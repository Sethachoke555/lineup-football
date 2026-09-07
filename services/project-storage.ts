/** Storage boundary. UI should depend on this service entry point, not localStorage. */
export { LocalProjectRepository, projectRepository, STORAGE_KEY } from '@/lib/storage';
export type { ProjectRepository } from '@/lib/storage';
