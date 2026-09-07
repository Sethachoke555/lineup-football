import { renderDesignedLineup } from '@/features/starting-lineup/utils/render-design';
import type { Project } from '@/types/project';

export async function renderStartingLineup(canvas: HTMLCanvasElement, project: Project) {
  if (!project.startingLineup) throw new Error('Starting lineup data is missing.');
  return renderDesignedLineup(canvas, project, project.startingLineup);
}
