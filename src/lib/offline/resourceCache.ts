import { getResearchRSAPublicKey, type StimulusVersion } from '@/lib/api/research';
import type { RSAPublicKey } from '@/lib/api/types';

import { hasUsableCacheBody, purgePoisonedCacheEntries } from './cacheUtils';
import { getMetadataCacheEntry, putMetadataCacheEntry, requestPersistentStorage } from './db';
import { areFaceModelsCached, ensureFaceModelsCached, FACE_MODELS_CACHE } from './faceModels';
import {
  hlsCacheKey,
  STIMULUS_LANGUAGES,
  STIMULUS_URLS,
  STIMULUS_VERSIONS,
  type StimulusLanguage,
} from './stimulus';
import {
  APP_ASSETS_CACHE,
  areTestAssetsCached,
  ensureTestAssetsCached,
  OFFLINE_TEST_ASSETS_CACHE,
} from './testAssets';
import type { MetadataCacheKey, OfflinePackMeta } from './types';

const RSA_KEY: MetadataCacheKey = 'rsa_public_key';
const DEFAULT_TTL_MS = 24 * 60 * 60 * 1000; // 24h

function isFresh(fetchedAt: number, ttlMs = DEFAULT_TTL_MS): boolean {
  return Date.now() - fetchedAt < ttlMs;
}

export async function getCachedRSAPublicKey(): Promise<RSAPublicKey | null> {
  const entry = await getMetadataCacheEntry<RSAPublicKey>(RSA_KEY);
  return entry?.value ?? null;
}

export async function setCachedRSAPublicKey(key: RSAPublicKey): Promise<void> {
  await putMetadataCacheEntry(RSA_KEY, key);
}

/**
 * Returns cached RSA key, refreshing from network when online and stale/missing.
 * Throws if offline and no cache exists.
 */
export async function getRSAPublicKeyCached(options?: {
  forceRefresh?: boolean;
}): Promise<RSAPublicKey> {
  const cached = await getMetadataCacheEntry<RSAPublicKey>(RSA_KEY);
  const force = options?.forceRefresh ?? false;

  if (!force && cached && isFresh(cached.fetchedAt)) {
    return cached.value;
  }

  if (!navigator.onLine && cached) {
    return cached.value;
  }

  if (!navigator.onLine && !cached) {
    throw new Error(
      'RSA public key is not cached. Prepare this device from the dashboard first (Prepare for tests in low internet).'
    );
  }

  try {
    const key = await getResearchRSAPublicKey();
    await setCachedRSAPublicKey(key);
    return key;
  } catch (err) {
    if (cached) return cached.value;
    throw err;
  }
}

export async function setHlsCached(
  language: StimulusLanguage,
  version: StimulusVersion,
  cached: boolean
): Promise<void> {
  await putMetadataCacheEntry(`hls_cached:${hlsCacheKey(language, version)}`, cached);
}

export async function isHlsCached(
  language: StimulusLanguage,
  version: StimulusVersion
): Promise<boolean> {
  const entry = await getMetadataCacheEntry<boolean>(
    `hls_cached:${hlsCacheKey(language, version)}`
  );
  return entry?.value === true;
}

const HLS_CACHE = 'hls-stimulus-videos';

export type OfflineDownloadStep =
  | 'encryption'
  | 'faceModels'
  | 'testAssets'
  | 'stimulusVideos'
  | 'done';

export interface OfflineDownloadProgress {
  step: OfflineDownloadStep;
  label: string;
  /** 0–100 overall progress */
  percent: number;
  detail?: string;
}

export interface OfflineDownloadResult {
  ok: boolean;
  meta: OfflinePackMeta;
  errors: string[];
}

async function downloadHlsStimulus(
  language: StimulusLanguage,
  version: StimulusVersion,
  options?: {
    onSegment?: (done: number, total: number) => void;
    signal?: AbortSignal;
  }
): Promise<void> {
  const signal = options?.signal;
  if (signal?.aborted) throw new DOMException('Download cancelled', 'AbortError');

  const url = STIMULUS_URLS[version][language];
  const cache = await caches.open(HLS_CACHE);
  const playlistRes = await fetch(url, { mode: 'cors', cache: 'reload', signal });
  if (!playlistRes.ok) {
    throw new Error(
      `Failed to download ${language} v${version} video playlist (${playlistRes.status})`
    );
  }
  const text = await playlistRes.text();
  await cache.put(
    url,
    new Response(text, { headers: { 'Content-Type': 'application/vnd.apple.mpegurl' } })
  );

  const base = url.replace(/playlist\.m3u8.*$/, '');
  const segments = text
    .split('\n')
    .map(l => l.trim())
    .filter(l => l && !l.startsWith('#'));

  const keepUrls = new Set<string>([url, ...segments.map(seg => new URL(seg, base).toString())]);

  let done = 0;
  for (const seg of segments) {
    if (signal?.aborted) throw new DOMException('Download cancelled', 'AbortError');
    const segUrl = new URL(seg, base).toString();
    const existing = await cache.match(segUrl);
    if (!(await hasUsableCacheBody(existing))) {
      const res = await fetch(segUrl, { mode: 'cors', cache: 'reload', signal });
      if (!res.ok) {
        throw new Error(`Failed to download ${language} v${version} video segment`);
      }
      const blob = await res.clone().blob();
      if (blob.size === 0) {
        throw new Error(`Empty response for ${language} v${version} video segment`);
      }
      await cache.put(segUrl, res);
    }
    done += 1;
    options?.onSegment?.(done, segments.length);
  }

  // Prune orphaned segments from prior playlist versions for this prefix
  const keys = await cache.keys();
  await Promise.all(
    keys.map(async req => {
      const href = req.url;
      if (href.includes(base) && !keepUrls.has(href)) {
        await cache.delete(req);
      }
    })
  );

  await setHlsCached(language, version, true);
}

/** All four (version × language) stimulus downloads, in a stable order. */
const STIMULUS_DOWNLOADS: Array<{ language: StimulusLanguage; version: StimulusVersion }> =
  STIMULUS_VERSIONS.flatMap(version => STIMULUS_LANGUAGES.map(language => ({ language, version })));

/**
 * One-shot download of everything needed to run research tests offline.
 * Intended to be triggered explicitly from the dashboard UI.
 */
export async function downloadOfflinePack(
  uid: string,
  options?: {
    onProgress?: (p: OfflineDownloadProgress) => void;
    signal?: AbortSignal;
  }
): Promise<OfflineDownloadResult> {
  if (!navigator.onLine) {
    throw new Error('You need an internet connection to download offline assets.');
  }

  // Mark storage persistent so the browser does not evict the pack we're about
  // to download. This runs inside the user-initiated "Prepare this device" flow,
  // which is when a persist() prompt is most likely to be granted. Best-effort:
  // if it's denied the download still proceeds (storage just stays evictable).
  await requestPersistentStorage();

  // Clear 0-byte entries cached by older SW versions (fixes second-offline-test breakage)
  await purgePoisonedCacheEntries([
    FACE_MODELS_CACHE,
    APP_ASSETS_CACHE,
    OFFLINE_TEST_ASSETS_CACHE,
    HLS_CACHE,
  ]);

  const onProgress = options?.onProgress;
  const errors: string[] = [];
  const steps = {
    encryptionKey: false,
    faceModels: false,
    testAssets: false,
    stimulusVideos: false,
  };

  const report = (step: OfflineDownloadStep, label: string, percent: number, detail?: string) => {
    onProgress?.({ step, label, percent, detail });
  };

  const throwIfAborted = () => {
    if (options?.signal?.aborted) {
      throw new DOMException('Download cancelled', 'AbortError');
    }
  };

  // 1. Encryption key (~0–15%)
  report('encryption', 'Saving security files…', 5);
  throwIfAborted();
  try {
    const key = await getResearchRSAPublicKey();
    await setCachedRSAPublicKey(key);
    steps.encryptionKey = true;
  } catch (err) {
    errors.push(err instanceof Error ? err.message : 'Failed to download encryption key');
  }
  report('encryption', 'Security files saved', 15);

  // 2. Face models (~15–40%)
  report('faceModels', 'Saving camera checks…', 20);
  throwIfAborted();
  try {
    await ensureFaceModelsCached();
    steps.faceModels = true;
  } catch (err) {
    errors.push(err instanceof Error ? err.message : 'Failed to download face models');
  }
  report('faceModels', 'Camera checks saved', 40);

  // 3. Instruction / calibration UI assets (~40–55%)
  report('testAssets', 'Saving test instructions…', 45);
  throwIfAborted();
  try {
    await ensureTestAssetsCached();
    steps.testAssets = true;
  } catch (err) {
    errors.push(err instanceof Error ? err.message : 'Failed to download test instructions');
  }
  report('testAssets', 'Test instructions saved', 55);

  // 4. Stimulus videos (~55–95%) — largest payload: 2 versions × 2 languages
  report('stimulusVideos', 'Saving screening videos…', 57, 'English & Hindi, both versions');
  throwIfAborted();
  try {
    let index = 0;
    for (const { language, version } of STIMULUS_DOWNLOADS) {
      throwIfAborted();
      await downloadHlsStimulus(language, version, {
        signal: options?.signal,
        onSegment: (done, total) => {
          if (options?.signal?.aborted) return;
          const base = 55 + (index / STIMULUS_DOWNLOADS.length) * 40;
          const span = 40 / STIMULUS_DOWNLOADS.length;
          const pct = Math.round(base + (done / Math.max(total, 1)) * span);
          const langLabel = language === 'hindi' ? 'Hindi' : 'English';
          report(
            'stimulusVideos',
            `Saving ${langLabel} v${version} screening video…`,
            pct,
            `Video ${index + 1} of ${STIMULUS_DOWNLOADS.length} — ${done} of ${total} parts`
          );
        },
      });
      index += 1;
    }
    steps.stimulusVideos = true;
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') throw err;
    errors.push(err instanceof Error ? err.message : 'Failed to download test videos');
  }

  const ready = steps.encryptionKey && steps.faceModels && steps.testAssets && steps.stimulusVideos;

  const meta: OfflinePackMeta = {
    ready,
    downloadedAt: Date.now(),
    steps,
  };
  await putMetadataCacheEntry(`offline_pack:${uid}`, meta);

  report('done', ready ? 'This device is ready' : 'Some files could not be saved', 100);

  return { ok: ready, meta, errors };
}

export async function getOfflinePackStatus(uid: string): Promise<{
  meta: OfflinePackMeta | null;
  ready: boolean;
  missing: string[];
}> {
  const entry = await getMetadataCacheEntry<OfflinePackMeta>(`offline_pack:${uid}`);
  const missing: string[] = [];

  const hasRsa = !!(await getCachedRSAPublicKey());
  const hasFace = await areFaceModelsCached();
  const hasTestAssets = await areTestAssetsCached();
  const hlsFlags = await Promise.all(
    STIMULUS_DOWNLOADS.map(({ language, version }) => isHlsCached(language, version))
  );
  const hasAllHls = hlsFlags.every(Boolean);

  if (!hasRsa) missing.push('encryption key');
  if (!hasFace) missing.push('face models');
  if (!hasTestAssets) missing.push('test instructions');
  if (!hasAllHls) missing.push('test videos');

  const liveReady = missing.length === 0;
  const meta = entry?.value
    ? { ...entry.value, ready: liveReady && entry.value.ready }
    : liveReady
      ? {
          ready: true,
          downloadedAt: entry?.fetchedAt ?? Date.now(),
          steps: {
            encryptionKey: hasRsa,
            faceModels: hasFace,
            testAssets: hasTestAssets,
            stimulusVideos: hasAllHls,
          },
        }
      : null;

  return { meta, ready: liveReady, missing };
}

export interface OfflinePrerequisites {
  hasAuth: boolean;
  hasRsa: boolean;
  hasHls: boolean;
  ok: boolean;
  missing: string[];
}

/**
 * Whether a new test can start right now. Online: auth is enough (network
 * supplies assets). Offline: the pack must cover the RSA key, face models, test
 * assets, and the stimulus video for every selected version in the chosen language.
 */
export async function canTakeTestOffline(options: {
  hasAuth: boolean;
  uid: string | null;
  videoLanguage?: StimulusLanguage;
  stimulusVersions?: StimulusVersion[];
}): Promise<OfflinePrerequisites> {
  const missing: string[] = [];
  const { hasAuth, uid, videoLanguage = 'english', stimulusVersions = ['1', '2'] } = options;

  if (!hasAuth || !uid) {
    missing.push('authentication');
  }

  if (!uid) {
    return { hasAuth, hasRsa: false, hasHls: false, ok: false, missing };
  }

  const status = await getOfflinePackStatus(uid);
  if (!status.ready) {
    for (const m of status.missing) {
      if (!missing.includes(m)) missing.push(m);
    }
  }

  // When online, allow starting without a full pack (network can supply assets)
  if (navigator.onLine) {
    return {
      hasAuth,
      hasRsa: !status.missing.includes('encryption key'),
      hasHls: true,
      ok: hasAuth && !!uid,
      missing: hasAuth && uid ? [] : missing,
    };
  }

  const hasRsa = !status.missing.includes('encryption key');
  const hlsFlags = await Promise.all(
    stimulusVersions.map(version => isHlsCached(videoLanguage, version))
  );
  const hasHls = hlsFlags.every(Boolean);
  if (!hasHls && !missing.includes('test videos')) missing.push('test videos');

  return {
    hasAuth,
    hasRsa,
    hasHls,
    ok: missing.length === 0,
    missing,
  };
}
