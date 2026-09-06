/** Integration boundary only: no background removal service or UI action is currently enabled.
 * A provider should return an alpha-preserving PNG/WEBP Blob. Keep the original player.photo
 * bytes and store its result separately; feed the result through readImage before previewing it.
 */
export interface BackgroundRemovalService {
  removeBackground(original: Blob, options: { signal: AbortSignal }): Promise<Blob>;
}
