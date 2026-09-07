/** Providers return a full-frame transparent PNG without changing crop coordinates. */
export interface BackgroundRemovalService {
  removeBackground(original: Blob, options: { signal: AbortSignal }): Promise<Blob>;
}
