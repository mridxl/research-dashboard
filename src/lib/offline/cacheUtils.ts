/** Reject poisoned Cache Storage entries (status 0 / empty body). */
export async function hasUsableCacheBody(response: Response | undefined): Promise<boolean> {
  if (!response?.ok) return false;
  try {
    const size = (await response.clone().blob()).size;
    return size > 0;
  } catch {
    return false;
  }
}

/** Remove empty or failed entries left by older service worker versions. */
export async function purgePoisonedCacheEntries(cacheNames: string[]): Promise<void> {
  await Promise.all(
    cacheNames.map(async name => {
      const cache = await caches.open(name);
      const keys = await cache.keys();
      await Promise.all(
        keys.map(async req => {
          const res = await cache.match(req);
          if (!(await hasUsableCacheBody(res))) {
            await cache.delete(req);
          }
        })
      );
    })
  );
}

/**
 * Fetch a URL and store it in Cache Storage, skipping entries that already have content.
 * Deletes and replaces empty or failed prior entries (fixes first-works-second-breaks poisoning).
 */
export async function fetchAndCache(cache: Cache, url: string, init?: RequestInit): Promise<void> {
  const existing = await cache.match(url);
  if (await hasUsableCacheBody(existing)) return;

  if (existing) {
    await cache.delete(url);
  }

  const response = await fetch(url, init);
  if (!response.ok) {
    throw new Error(`Failed to fetch ${url} (${response.status})`);
  }

  const blob = await response.blob();
  if (blob.size === 0) {
    throw new Error(`Empty response for ${url}`);
  }

  const headers = new Headers();
  const contentType = response.headers.get('Content-Type');
  if (contentType) headers.set('Content-Type', contentType);

  await cache.put(url, new Response(blob, { headers }));
}
