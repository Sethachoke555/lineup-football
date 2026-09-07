'use client';
import { useState } from 'react';
import type { PlayerPhotoVersions } from '@/types/project';
import { ImageUpload } from './image-upload';
import { BackgroundRemovalDialog } from './background-removal-dialog';

/** Shared source picker for squad photos and standalone Starting Lineup hero photos. */
export function PlayerPhotoUpload({ label, value, versions, onChange, onError }: {
  label: string; value: string; versions?: PlayerPhotoVersions;
  onChange: (src: string, versions?: PlayerPhotoVersions) => void; onError: (message: string) => void;
}) {
  const [pending, setPending] = useState<{ original: string; cached: string } | null>(null);
  const choose = (activeVersion: PlayerPhotoVersions['activeVersion']) => {
    if (!versions) return;
    const next = { ...versions, activeVersion };
    onChange(activeVersion === 'cutout' ? next.cutoutSrc : next.originalSrc, next);
  };
  return <>
    <ImageUpload label={label} value={value} onError={onError} onChange={(src) => src ? setPending({ original: src, cached: '' }) : onChange('')} />
    {value && <div className="photo-buttons">
      <button className="button" onClick={() => setPending({ original: versions?.originalSrc || value, cached: versions?.cutoutSrc || '' })}>Remove Background</button>
      {versions && <><button className="button" aria-label="Use Original" aria-pressed={versions.activeVersion === 'original'} onClick={() => choose('original')}>Original</button><button className="button" aria-label="Use Cutout" aria-pressed={versions.activeVersion === 'cutout'} disabled={!versions.cutoutSrc} onClick={() => choose('cutout')}>Background Removed</button></>}
    </div>}
    {pending && <BackgroundRemovalDialog {...pending} onCancel={() => setPending(null)} onUse={(next) => { setPending(null); onChange(next.activeVersion === 'cutout' ? next.cutoutSrc : next.originalSrc, next); }} />}
  </>;
}
