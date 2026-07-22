/**
 * Client-side derivation of the server session document id for offline-created
 * sessions. MUST byte-match the middleware's derivation
 * (app/api/research.py::_derive_session_id_from_client_id):
 *
 *   sha1(f"{uid}:{client_session_id}").hexdigest()[:32]
 *
 * Fixed parity vector (verified against the middleware test
 * core/middleware/tests/test_research_session_id.py):
 *   deriveSessionId('testuid123', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890')
 *     === '47e07e7200097fbe12a5dda2ef1c124d'
 * If either side changes, offline-created sessions would desync from their
 * server documents.
 */
export async function deriveSessionId(uid: string, clientSessionId: string): Promise<string> {
  const buf = await crypto.subtle.digest(
    'SHA-1',
    new TextEncoder().encode(`${uid}:${clientSessionId}`)
  );
  return [...new Uint8Array(buf)]
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
    .slice(0, 32);
}
