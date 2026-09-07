import type { BackgroundRemovalService } from '@/lib/photo-processing';

/** Each job owns a worker: cancellation stops inference as well as late UI updates. */
export function removePlayerBackground(src: string, signal: AbortSignal, progress: (message: string) => void): Promise<string> {
  return new Promise((resolve, reject) => {
    if (signal.aborted) { reject(new DOMException('Cancelled', 'AbortError')); return; }
    const worker = new Worker(new URL('./background-removal.worker.ts', import.meta.url), { type: 'module' });
    const cleanup = () => { clearTimeout(timeout); worker.terminate(); signal.removeEventListener('abort', cancel); };
    const cancel = () => { cleanup(); reject(new DOMException('Cancelled', 'AbortError')); };
    const timeout = setTimeout(() => { cleanup(); reject(new Error('Processing took too long. Keep the original or retry on a faster connection/device.')); }, 240_000);
    signal.addEventListener('abort', cancel, { once: true });
    worker.onerror = () => { cleanup(); reject(new Error('Background removal could not start. Please retry in a current browser.')); };
    worker.onmessage = (event: MessageEvent<{ error?: string; result?: Blob; progress?: { key: string; current: number; total: number } }>) => {
      if (event.data.error) { cleanup(); reject(new Error(event.data.error)); }
      else if (event.data.result) {
        const reader = new FileReader();
        reader.onerror = () => { cleanup(); reject(new Error('Could not read the cutout.')); };
        reader.onload = () => { cleanup(); resolve(String(reader.result)); };
        reader.readAsDataURL(event.data.result);
      } else if (event.data.progress) {
        const { key, current, total } = event.data.progress;
        progress(key.startsWith('fetch') ? `Downloading model: ${Math.round(current / Math.max(1, total) * 100)}%` : 'Processing player edges…');
      }
    };
    worker.postMessage({ src });
  });
}

export const backgroundRemovalService: BackgroundRemovalService = {
  async removeBackground(original, { signal }) {
    const src = await new Promise<string>((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(String(reader.result)); reader.onerror = reject; reader.readAsDataURL(original); });
    return (await fetch(await removePlayerBackground(src, signal, () => {}))).blob();
  },
};
