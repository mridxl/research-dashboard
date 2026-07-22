import { fetchAndCache, hasUsableCacheBody } from './cacheUtils';

/** Face-api model assets under public/models/ — keep in sync with Fillup prefetch. */
export const FACE_MODEL_FILES = [
  'tiny_face_detector_model-weights_manifest.json',
  'tiny_face_detector_model.bin',
  'face_landmark_68_tiny_model-weights_manifest.json',
  'face_landmark_68_tiny_model.bin',
] as const;

export const FACE_MODELS_CACHE = 'face-api-models';

/** Absolute base URL for face-api loadFromUri (no trailing slash). */
export function getFaceModelsBaseUrl(): string {
  return new URL(`${import.meta.env.BASE_URL}models`, window.location.origin).href.replace(
    /\/$/,
    ''
  );
}

/**
 * Ensure model manifests + weights are in Cache Storage (and browser-available).
 * Safe to call repeatedly; skips files already cached with non-empty bodies.
 */
export async function ensureFaceModelsCached(): Promise<string> {
  const base = getFaceModelsBaseUrl();
  const cache = await caches.open(FACE_MODELS_CACHE);

  await Promise.all(
    FACE_MODEL_FILES.map(file => fetchAndCache(cache, `${base}/${file}`, { cache: 'reload' }))
  );

  return base;
}

export async function areFaceModelsCached(): Promise<boolean> {
  try {
    const base = getFaceModelsBaseUrl();
    const cache = await caches.open(FACE_MODELS_CACHE);
    const matches = await Promise.all(FACE_MODEL_FILES.map(file => cache.match(`${base}/${file}`)));
    const usable = await Promise.all(matches.map(m => hasUsableCacheBody(m)));
    return usable.every(Boolean);
  } catch {
    return false;
  }
}
