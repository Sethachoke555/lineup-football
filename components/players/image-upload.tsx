'use client';
import { useId, useState } from 'react';
import { Upload, X } from 'lucide-react';
import { readImage } from '@/lib/images';
export function ImageUpload({ label, value, onChange, onError }: { label: string; value: string; onChange: (value: string) => void; onError: (message: string) => void }) {
  const id = useId(); const [busy, setBusy] = useState(false);
  return <div className="upload-field"><span className="upload-label">{label}</span><div className={`upload-area ${value ? 'has-image' : ''}`}>
    {value && <div className="upload-thumbnail" style={{ backgroundImage: `url("${value}")` }} role="img" aria-label={label} />}
    <label htmlFor={id}><Upload size={17} /><strong>{busy ? 'Reading image…' : value ? 'Replace image' : 'Upload image'}</strong><small>PNG, JPG, WEBP · max 12 MB</small></label>
    <input id={id} aria-label={label} type="file" accept="image/png,image/jpeg,image/webp" disabled={busy} onChange={async (event) => { const file = event.target.files?.[0]; event.target.value = ''; if (!file) return; setBusy(true); try { onChange(await readImage(file)); } catch (error) { onError(error instanceof Error ? error.message : 'Image upload failed.'); } finally { setBusy(false); } }} />
    {value && <button className="remove-image" aria-label={`Remove ${label.toLowerCase()}`} onClick={() => onChange('')}><X size={13} /></button>}
  </div></div>;
}
