import { renderGraphic } from '@/lib/renderer';
import type { Project } from '@/types/project';
export function filename(project: Project) {
  const team = (project.mode === 'result' ? project.matchResult?.home.name || project.team.name : project.team.name).toLowerCase().trim().replace(/[^\p{L}\p{N}]+/gu, '-').replace(/^-|-$/g, '') || 'team';
  const mode = project.mode === 'result' ? 'match-result' : project.mode === 'starting-lineup' ? 'starting-xi' : 'lineup';
  const date = project.mode === 'result' ? project.matchResult?.date || project.team.date : project.mode === 'starting-lineup' ? project.startingLineup?.matchInfo.date || project.team.date : project.team.date;
  return `${team}-${mode}-${date.slice(0, 4) || new Date().getFullYear()}`;
}
export function downloadBlob(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob); const anchor = document.createElement('a'); anchor.href = url; anchor.download = name; document.body.appendChild(anchor); anchor.click(); anchor.remove(); setTimeout(() => URL.revokeObjectURL(url), 10_000);
}
export async function exportGraphic(project: Project, format: 'png' | 'jpg') {
  await document.fonts.ready;
  const canvas = document.createElement('canvas'); await renderGraphic(canvas, project);
  const blob = await new Promise<Blob>((resolve, reject) => canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error('Image export failed. Please try again.')), format === 'png' ? 'image/png' : 'image/jpeg', .96));
  downloadBlob(blob, `${filename(project)}.${format}`);
}
export function backupProject(project: Project) { downloadBlob(new Blob([JSON.stringify(project, null, 2)], { type: 'application/json' }), `${filename(project)}.json`); }
