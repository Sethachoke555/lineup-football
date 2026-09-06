export const FORMATIONS = ['4-4-2', '4-3-3', '4-2-3-1', '4-1-4-1', '4-1-2-1-2', '3-4-3', '3-5-2', '3-4-2-1', '5-3-2', '5-4-1'] as const;
export type Formation = typeof FORMATIONS[number];
export type TemplateId = 'broadcast' | 'champions' | 'stadium' | 'minimal';
export const SIZES = { portrait: [1080, 1350], square: [1080, 1080], landscape: [1920, 1080], story: [1080, 1920] } as const;
export type CanvasSize = keyof typeof SIZES;
export interface Point { x: number; y: number }
export interface PhotoTransform { zoom: number; scale: number; x: number; y: number; crop: 'portrait' | 'circle' | 'square' }
/** Non-destructive crop. Offsets are fractions of the crop frame; zoom 1 fits the whole source. */
export interface PlayerPhotoSettings {
  version: 1;
  x: number;
  y: number;
  zoom: number;
  cropWidth: number;
  cropHeight: number;
  legacyFrame?: PhotoTransform['crop'];
}
export interface Player extends Point {
  id: string;
  name: string;
  nickname: string;
  number: string;
  position: string;
  status: 'starting' | 'substitute';
  photo: string;
  photoSettings?: PlayerPhotoSettings;
  transform: PhotoTransform;
}
export interface Team {
  name: string; shortName: string; logo: string; opponent: string; opponentLogo: string;
  competition: string; date: string; time: string; venue: string; coach: string;
}
export interface Colors { primary: string; secondary: string; accent: string; text: string; cardBackground?: string; cardText?: string }
export interface Background { kind: 'pitch' | 'stadium' | 'gradient' | 'custom'; image: string; brightness: number; blur: number; overlay: number }
export interface Project {
  mode?: 'lineup' | 'result';
  matchResult?: MatchResult;
  version: 1; id: string; name: string; updatedAt: string;
  team: Team; players: Player[]; formation: Formation; size: CanvasSize; template: TemplateId;
  colors: Colors; background: Background;
  text: { size: number; uppercase: boolean; useNickname: boolean };
}
export interface MatchResult {
  home: { name: string; logo: string; score: number };
  away: { name: string; logo: string; score: number };
  competition: string;
  venue: string;
  date: string;
  scorers: { id: string; side: 'home' | 'away'; name: string; minute: string }[];
  template: TemplateId;
  colors: Colors;
  background: Background;
  size: CanvasSize;
}
