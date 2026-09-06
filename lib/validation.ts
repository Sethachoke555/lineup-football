import { FORMATIONS, SIZES, type Project } from '@/types/project';
type RecordValue = Record<string, unknown>;
function record(value: unknown, label: string): RecordValue {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error(`Invalid project: ${label}.`);
  return value as RecordValue;
}
function string(value: unknown, label: string, max = 120) {
  if (typeof value !== 'string' || value.length > max) throw new Error(`Invalid project: ${label}.`);
}
function numeric(value: unknown, label: string, min: number, max: number) {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < min || value > max) throw new Error(`Invalid project: ${label}.`);
}
function choice(value: unknown, choices: readonly string[], label: string) {
  if (typeof value !== 'string' || !choices.includes(value)) throw new Error(`Invalid project: ${label}.`);
}
function image(value: unknown, label: string) {
  string(value, label, 17_000_000);
  if (value !== '' && !/^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/]+=*$/.test(value as string)) throw new Error(`Invalid project: ${label} must be an embedded PNG, JPG or WEBP.`);
}
export function validateProject(value: unknown): Project {
  const p = record(value, 'project data');
  if (p.version !== 1) throw new Error('This project version is not supported.');
  if (p.mode !== undefined) choice(p.mode, ['lineup', 'result'], 'editor mode');
  if (p.mode === 'result' && !p.matchResult) throw new Error('Missing match result.');
  if (p.matchResult !== undefined) {
    const r = record(p.matchResult, 'match result');
    for (const side of ['home', 'away']) {
      const t = record(r[side], `${side} team`); string(t.name, 'result team name', 80); image(t.logo, 'result logo'); numeric(t.score, 'score', 0, 99);
      if (!Number.isInteger(t.score)) throw new Error('Scores must be whole numbers.');
    }
    for (const key of ['competition', 'date', 'venue']) string(r[key], `result ${key}`);
    choice(r.template, ['broadcast', 'champions', 'stadium', 'minimal'], 'result template'); choice(r.size, Object.keys(SIZES), 'result size');
    const colors = record(r.colors, 'result colors');
    for (const key of ['primary', 'secondary', 'accent', 'text', 'cardBackground', 'cardText']) {
      if ((key === 'cardBackground' || key === 'cardText') && colors[key] === undefined) continue;
      if (typeof colors[key] !== 'string' || !/^#[0-9a-f]{6}$/i.test(colors[key] as string)) throw new Error('Invalid result color.');
    }
    const bg = record(r.background, 'result background'); choice(bg.kind, ['pitch', 'stadium', 'gradient', 'custom'], 'result background'); image(bg.image, 'result background image');
    numeric(bg.brightness, 'brightness', 20, 160); numeric(bg.blur, 'blur', 0, 20); numeric(bg.overlay, 'overlay', 0, 90);
    if (!Array.isArray(r.scorers) || r.scorers.length > 20) throw new Error('Use at most 20 goal scorers.');
    const ids = new Set();
    for (const value of r.scorers) {
      const s = record(value, 'scorer'); string(s.id, 'scorer ID'); string(s.name, 'scorer name', 50); string(s.minute, 'scorer minute', 7); choice(s.side, ['home', 'away'], 'scorer team');
      if (!s.id || ids.has(s.id) || !/^[0-9+]*$/.test(s.minute as string)) throw new Error('Invalid goal scorer.'); ids.add(s.id);
    }
  }
  string(p.id, 'project ID'); if (!p.id) throw new Error('Missing project ID.');
  string(p.name, 'project name', 100); string(p.updatedAt, 'save date');
  if (!Number.isFinite(Date.parse(p.updatedAt as string))) throw new Error('Invalid project save date.');
  choice(p.formation, FORMATIONS, 'formation'); choice(p.size, Object.keys(SIZES), 'canvas format');
  choice(p.template, ['broadcast', 'champions', 'stadium', 'minimal'], 'template');
  const team = record(p.team, 'team');
  for (const key of ['name', 'shortName', 'opponent', 'competition', 'date', 'time', 'venue', 'coach']) string(team[key], `team ${key}`);
  image(team.logo, 'team logo'); image(team.opponentLogo, 'opponent logo');
  const colors = record(p.colors, 'colors');
  for (const key of ['primary', 'secondary', 'accent', 'text']) if (typeof colors[key] !== 'string' || !/^#[0-9a-f]{6}$/i.test(colors[key] as string)) throw new Error('Invalid project color.');
  for (const key of ['cardBackground', 'cardText']) if (colors[key] !== undefined && (typeof colors[key] !== 'string' || !/^#[0-9a-f]{6}$/i.test(colors[key] as string))) throw new Error('Invalid player card color.');
  const bg = record(p.background, 'background'); choice(bg.kind, ['pitch', 'stadium', 'gradient', 'custom'], 'background type'); image(bg.image, 'background image');
  numeric(bg.brightness, 'brightness', 20, 160); numeric(bg.blur, 'blur', 0, 20); numeric(bg.overlay, 'overlay', 0, 90);
  const text = record(p.text, 'text'); numeric(text.size, 'text size', .75, 1.4);
  if (typeof text.uppercase !== 'boolean' || typeof text.useNickname !== 'boolean') throw new Error('Invalid typography settings.');
  if (!Array.isArray(p.players) || p.players.length > 23) throw new Error('A squad supports up to 23 players.');
  const ids = new Set<string>(); let starters = 0; let subs = 0;
  for (const value of p.players) {
    const player = record(value, 'player'); string(player.id, 'player ID');
    if (!player.id || ids.has(player.id as string)) throw new Error('Player IDs must be unique.'); ids.add(player.id as string);
    string(player.name, 'player name', 50); string(player.nickname, 'nickname', 30); string(player.number, 'shirt number', 3);
    if (!/^\d{0,3}$/.test(player.number as string)) throw new Error('Invalid shirt number.');
    choice(player.position, ['GK','CB','LB','RB','LWB','RWB','DM','CM','AM','LM','RM','LW','RW','ST','CF'], 'player position');
    choice(player.status, ['starting', 'substitute'], 'player status'); if (player.status === 'starting') starters++; else subs++;
    numeric(player.x, 'player X', 0, 100); numeric(player.y, 'player Y', 0, 100); image(player.photo, 'player photo');
    const t = record(player.transform, 'photo transform'); numeric(t.zoom, 'photo zoom', 1, 3); numeric(t.scale, 'photo scale', .5, 1.5); numeric(t.x, 'photo X', -100, 100); numeric(t.y, 'photo Y', -100, 100); choice(t.crop, ['portrait', 'circle', 'square'], 'crop');
    if (player.photoSettings !== undefined) {
      const s = record(player.photoSettings, 'portrait crop');
      if (s.version !== 1) throw new Error('Unsupported photo crop version.');
      numeric(s.x, 'crop X', -1000, 1000); numeric(s.y, 'crop Y', -1000, 1000); numeric(s.zoom, 'crop zoom', .1, 512);
      numeric(s.cropWidth, 'crop width', 1, 100); numeric(s.cropHeight, 'crop height', 1, 100);
      if (s.legacyFrame !== undefined) {
        choice(s.legacyFrame, ['portrait', 'circle', 'square'], 'legacy crop frame');
        if (s.cropWidth !== 88 || s.cropHeight !== (s.legacyFrame === 'portrait' ? 84 : 88)) throw new Error('Invalid legacy crop aspect ratio.');
      } else if (s.cropWidth !== 4 || s.cropHeight !== 5) throw new Error('Portrait photos must use a 4:5 frame.');
    }
  }
  if (starters > 11 || subs > 12) throw new Error('Use at most 11 starters and 12 substitutes.');
  return value as Project;
}
