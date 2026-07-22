import dogFace from '@/assets/dog_face.webp';
import beepSound from '@/assets/instructions/beep-beep.mp3';
import calibrationGif from '@/assets/instructions/calibration.gif';
import namecall1 from '@/assets/instructions/namecall_1.webp';
import namecall2 from '@/assets/instructions/namecall_2.webp';

import { fetchAndCache, hasUsableCacheBody } from './cacheUtils';

/** Bundled + public assets required for the offline test flow UI. */
export const OFFLINE_TEST_ASSET_URLS = [
  calibrationGif,
  beepSound,
  namecall1,
  namecall2,
  dogFace,
  '/dog_bark.wav',
  '/favicon.png',
] as const;

/** Matches workbox runtime cache for public test assets (vite.config.ts). */
export const OFFLINE_TEST_ASSETS_CACHE = 'offline-test-assets';

/** Matches workbox runtime cache for hashed Vite bundles (vite.config.ts). */
export const APP_ASSETS_CACHE = 'app-assets';

/**
 * Resolve a bundled asset (Vite import URLs already include BASE_URL) or a raw
 * public asset path (e.g. '/dog_bark.wav', needs BASE_URL prefixed) to an absolute URL.
 */
function toAbsoluteUrl(url: string): string {
  if (/^https?:\/\//.test(url)) {
    return url;
  }
  if (url.startsWith('/')) {
    const base = import.meta.env.BASE_URL;
    const path = url.startsWith(base) ? url : `${base.replace(/\/$/, '')}${url}`;
    return new URL(path, window.location.origin).href;
  }
  return new URL(url, window.location.origin).href;
}

function cacheNameForAsset(url: string): string {
  const path = new URL(toAbsoluteUrl(url)).pathname;
  return path.startsWith('/assets/') ? APP_ASSETS_CACHE : OFFLINE_TEST_ASSETS_CACHE;
}

/**
 * Warm instruction/calibration assets into Cache Storage during offline pack download.
 * Uses build-time hashed URLs and the same cache names as the service worker runtime rules.
 */
export async function ensureTestAssetsCached(): Promise<void> {
  for (const asset of OFFLINE_TEST_ASSET_URLS) {
    const absolute = toAbsoluteUrl(asset);
    const cache = await caches.open(cacheNameForAsset(asset));
    await fetchAndCache(cache, absolute, { cache: 'reload' });
  }
}

export async function areTestAssetsCached(): Promise<boolean> {
  try {
    for (const asset of OFFLINE_TEST_ASSET_URLS) {
      const absolute = toAbsoluteUrl(asset);
      const cache = await caches.open(cacheNameForAsset(asset));
      const match = await cache.match(absolute);
      if (!(await hasUsableCacheBody(match))) return false;
    }
    return true;
  } catch {
    return false;
  }
}
