'use client';
import { useState } from 'react';
import type { Player, Project, PlayerPhotoSettings, PlayerPhotoVersions } from '@/types/project';
import { DEFAULT_PHOTO_SETTINGS, settingsForPlayer } from '@/lib/photo-crop';
import { loadImage } from '@/lib/images';
import { PlayerPhotoUpload } from './player-photo-upload';
import { PhotoCropDialog } from './photo-crop-dialog';

export function PhotoEditor({ player, project, onChange, onError }: { player: Player; project: Project; onChange: (patch: Partial<Player>) => void; onError: (message: string) => void }) {
  const [draft, setDraft] = useState<{ src: string; image: HTMLImageElement; settings: PlayerPhotoSettings; versions?: PlayerPhotoVersions } | null>(null);
  const open = async (src: string, existing = false, versions = player.playerPhoto) => {
    try {
      const image = await loadImage(src);
      setDraft({ src, image, versions, settings: existing ? settingsForPlayer(player, { width: image.naturalWidth, height: image.naturalHeight }) : { ...DEFAULT_PHOTO_SETTINGS } });
    } catch (error) { onError(error instanceof Error ? error.message : 'Unable to open photo.'); }
  };
  return <div className="inspector-section"><h3>Player photo</h3>
    <PlayerPhotoUpload label="Player photo" value={player.photo} versions={player.playerPhoto} onChange={(src, versions) => { if (!src) onChange({ photo: '', playerPhoto: undefined, photoSettings: undefined }); else if (versions?.originalSrc === (player.playerPhoto?.originalSrc || player.photo)) onChange({ photo: src, playerPhoto: versions }); else void open(src, false, versions); }} onError={onError} />
    {player.photo && <button className="button full-width" onClick={() => void open(player.photo, true)}>Edit Photo</button>}
    <p className="muted">Frame the full head, shoulders and upper body. Original quality and transparency are preserved.</p>
    {draft && <PhotoCropDialog {...draft} player={player} project={project} onCancel={() => setDraft(null)} onApply={(photoSettings, photoEffect) => { onChange({ photo: draft.src, playerPhoto: draft.versions, photoSettings, photoEffect }); setDraft(null); }} />}
  </div>;
}
