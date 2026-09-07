'use client';
import { useState } from 'react';
import type { Player, Project, PlayerPhotoSettings } from '@/types/project';
import { DEFAULT_PHOTO_SETTINGS, settingsForPlayer } from '@/lib/photo-crop';
import { loadImage } from '@/lib/images';
import { ImageUpload } from './image-upload';
import { PhotoCropDialog } from './photo-crop-dialog';

export function PhotoEditor({ player, project, onChange, onError }: { player: Player; project: Project; onChange: (patch: Partial<Player>) => void; onError: (message: string) => void }) {
  const [draft, setDraft] = useState<{ src: string; image: HTMLImageElement; settings: PlayerPhotoSettings } | null>(null);
  const open = async (src: string, existing = false) => {
    try {
      const image = await loadImage(src);
      setDraft({ src, image, settings: existing ? settingsForPlayer(player, { width: image.naturalWidth, height: image.naturalHeight }) : { ...DEFAULT_PHOTO_SETTINGS } });
    } catch (error) { onError(error instanceof Error ? error.message : 'Unable to open photo.'); }
  };
  return <div className="inspector-section"><h3>Player photo</h3>
    <ImageUpload label="Player photo" value={player.photo} onChange={(src) => { if (src) void open(src); else onChange({ photo: '', photoSettings: undefined }); }} onError={onError} />
    {player.photo && <button className="button full-width" onClick={() => void open(player.photo, true)}>Edit Photo</button>}
    <p className="muted">Frame the full head, shoulders and upper body. Original quality and transparency are preserved.</p>
    {draft && <PhotoCropDialog {...draft} player={player} project={project} onCancel={() => setDraft(null)} onApply={(photoSettings, photoEffect) => { onChange({ photo: draft.src, photoSettings, photoEffect }); setDraft(null); }} />}
  </div>;
}
