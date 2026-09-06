import type { Colors, Project, TemplateId } from '@/types/project';
export interface GraphicTemplate { id: TemplateId; name: string; description: string; colors: Colors; scene: Project['background']['kind'] }
export const TEMPLATES: GraphicTemplate[] = [
  { id: 'broadcast', name: 'Broadcast Blue', description: 'Electric blue. Matchday energy.', colors: { primary: '#071c46', secondary: '#1258c7', accent: '#f04458', text: '#ffffff' }, scene: 'pitch' },
  { id: 'champions', name: 'Dark Champions', description: 'Midnight tones. Golden details.', colors: { primary: '#101117', secondary: '#32303a', accent: '#d5b56b', text: '#fff8e8' }, scene: 'gradient' },
  { id: 'stadium', name: 'Stadium Night', description: 'Under the lights. Ready to play.', colors: { primary: '#06242c', secondary: '#126566', accent: '#b9f36e', text: '#f2fffd' }, scene: 'stadium' },
  { id: 'minimal', name: 'Minimal White', description: 'Clean lines. A fresh perspective.', colors: { primary: '#e8edf4', secondary: '#ffffff', accent: '#e6465d', text: '#14243c' }, scene: 'pitch' },
];
export function applyTemplate(project: Project, template: GraphicTemplate): Project {
  return { ...project, template: template.id, colors: { ...template.colors }, background: { ...project.background, kind: template.scene, brightness: 100, blur: 0, overlay: template.id === 'minimal' ? 0 : 25 } };
}
