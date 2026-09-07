'use client';
import { useEffect, useRef, useState } from 'react';
import type { PlayerPhotoVersions } from '@/types/project';
import { removePlayerBackground } from '@/lib/image/background-removal';

export function BackgroundRemovalDialog({ original, cached = '', onUse, onCancel }: {
  original: string; cached?: string; onUse: (versions: PlayerPhotoVersions) => void; onCancel: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [cutout, setCutout] = useState(cached);
  const [busy, setBusy] = useState(!cached);
  const [progress, setProgress] = useState('The first use downloads the model. Your photo stays on this device.');
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);
  useEffect(() => { const el = dialog.current!; el.showModal(); return () => el.close(); }, []);
  useEffect(() => {
    if (cached && attempt === 0) return;
    const controller = new AbortController();
    void removePlayerBackground(original, controller.signal, setProgress)
      .then((src) => { if (!controller.signal.aborted) setCutout(src); })
      .catch((e: Error) => { if (!controller.signal.aborted) setError(e.message); })
      .finally(() => { if (!controller.signal.aborted) setBusy(false); });
    return () => controller.abort();
  }, [original, cached, attempt]);
  const use = (activeVersion: PlayerPhotoVersions['activeVersion']) => onUse({ originalSrc: original, cutoutSrc: cutout, activeVersion });
  return <dialog ref={dialog} className="photo-dialog removal-dialog" aria-labelledby="removal-title" onCancel={(e) => { e.preventDefault(); onCancel(); }}>
    <header><h2 id="removal-title">Player Photo — Background Removal</h2><p>Keep the full image frame. Check hair, hands and shoes before continuing.</p></header>
    <div className="removal-comparison">
      <figure><figcaption>Before · Original</figcaption><div role="img" aria-label="Before original photo" style={{ backgroundImage: `url("${original}")` }} /></figure>
      <figure><figcaption>After · Background Removed</figcaption><div role="img" aria-label="After transparent cutout" style={{ backgroundImage: cutout ? `url("${cutout}")` : undefined }} /></figure>
    </div>
    {busy && <div role="status"><strong>Removing background...</strong><p>{progress}</p><progress aria-label="Background removal progress" /></div>}
    {error && <p role="alert">Could not remove the background: {error}</p>}
    <footer><button className="button" onClick={onCancel}>Cancel</button><button className="button" onClick={() => use('original')}>Keep Original</button><button className="button" disabled={busy} onClick={() => { setError(''); setBusy(true); setProgress('Removing background...'); setAttempt((n) => n + 1); }}>Retry</button><button className="button primary" disabled={busy || !cutout} onClick={() => use('cutout')}>Use Cutout</button></footer>
  </dialog>;
}
