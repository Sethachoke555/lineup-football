'use client';
import { useEffect, useState } from 'react';
import { Download, FolderOpen, Save } from 'lucide-react';
import type { Project } from '@/types/project';
import { projectRepository } from '@/services/project-storage';
import { exportGraphic } from '@/lib/export';
import { ProjectLibrary } from '@/components/editor/project-library';
export function ProjectActions({ project, onLoad, notify }: { project: Project; onLoad: (project: Project) => void; notify: (message: string) => void }) {
  const [library, setLibrary] = useState(false); const [busy, setBusy] = useState(''); const [savedAt, setSavedAt] = useState('');
  const dirty = savedAt !== project.id + project.updatedAt;
  useEffect(() => { if (!dirty) return; const warn = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = ''; }; window.addEventListener('beforeunload', warn); return () => window.removeEventListener('beforeunload', warn); }, [dirty]);
  const run = async (label: string, work: () => Promise<void>) => { setBusy(label); try { await work(); } catch (error) { notify(error instanceof Error ? error.message : 'The action could not be completed.'); } finally { setBusy(''); } };
  return <><span className="save-indicator">{dirty ? 'Unsaved' : 'Saved locally'}</span><button className="button" disabled={!!busy} onClick={() => void run('save', async () => { await projectRepository().save(project); setSavedAt(project.id + project.updatedAt); notify('Project saved in this browser.'); })}><Save size={14} />{busy === 'save' ? 'Saving…' : 'Save'}</button><button className="button" disabled={!!busy} onClick={() => setLibrary(true)}><FolderOpen size={14} />Load</button><button className="button primary" disabled={!!busy} onClick={() => void run('png', async () => { await exportGraphic(project, 'png'); notify('PNG exported at full resolution.'); })}><Download size={14} />{busy === 'png' ? 'Exporting…' : 'Export PNG'}</button><button className="button" disabled={!!busy} onClick={() => void run('jpg', async () => { await exportGraphic(project, 'jpg'); notify('JPG exported at full resolution.'); })}>{busy === 'jpg' ? 'Exporting…' : 'JPG'}</button>{library && <ProjectLibrary current={project} onLoad={(p, saved) => { onLoad(p); setSavedAt(saved ? p.id + p.updatedAt : ''); }} onClose={() => setLibrary(false)} onDelete={(id) => { if (id === project.id) setSavedAt(''); }} notify={notify} />}</>;
}


