import type { Project } from '@/types/project';
import { validateProject } from './validation';
export const STORAGE_KEY = 'touchline.projects.v1';
export interface ProjectRepository {
  list(): Promise<Project[]>;
  get(id: string): Promise<Project | null>;
  save(project: Project): Promise<void>;
  duplicate(project: Project): Promise<Project>;
  remove(id: string): Promise<void>;
}
type StorageAdapter = Pick<Storage, 'getItem' | 'setItem'>;
export class LocalProjectRepository implements ProjectRepository {
  constructor(private storage: StorageAdapter) {}
  async list(): Promise<Project[]> {
    const raw = this.storage.getItem(STORAGE_KEY); if (!raw) return [];
    try {
      const values: unknown = JSON.parse(raw); if (!Array.isArray(values)) throw new Error();
      return values.map(validateProject).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
    } catch { throw new Error('Saved project data could not be read. Existing storage has been left intact. You can import a JSON backup.'); }
  }
  async get(id: string) { return (await this.list()).find((p) => p.id === id) ?? null; }
  private write(projects: Project[]) {
    try { this.storage.setItem(STORAGE_KEY, JSON.stringify(projects)); }
    catch { throw new Error('Local save failed: browser storage is full or unavailable. Download a JSON backup, or delete an old saved project and retry.'); }
  }
  async save(project: Project) {
    validateProject(project); const projects = await this.list();
    this.write([project, ...projects.filter((p) => p.id !== project.id)]);
  }
  async duplicate(project: Project) {
    const copy: Project = { ...project, id: crypto.randomUUID(), name: `${project.name} copy`.slice(0, 100), updatedAt: new Date().toISOString() };
    await this.save(copy); return copy;
  }
  async remove(id: string) { this.write((await this.list()).filter((p) => p.id !== id)); }
}
export function projectRepository(): ProjectRepository { return new LocalProjectRepository(window.localStorage); }
