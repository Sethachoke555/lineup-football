import { FORMATIONS, SIZES, type Project } from '@/types/project';
import { startingLineupBackgrounds } from '@/features/starting-lineup/utils/backgrounds';
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
function image(value: unknown, label: string, max = 17_000_000) {
  string(value, label, max);
  if (value !== '' && !/^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/]+=*$/.test(value as string)) throw new Error(`Invalid project: ${label} must be an embedded PNG, JPG or WEBP.`);
}
function photoVersions(value: unknown, active: unknown) {
  if (value === undefined) return;
  const v = record(value, 'photo versions');
  image(v.originalSrc, 'original photo');
  image(v.cutoutSrc, 'cutout photo', 180_000_000);
  if (v.cutoutSrc && !(v.cutoutSrc as string).startsWith('data:image/png;base64,')) throw new Error('Cutout must be a transparent-capable PNG.');
  choice(v.activeVersion, ['original', 'cutout'], 'active photo version');
  const selected = v.activeVersion === 'cutout' ? v.cutoutSrc : v.originalSrc;
  if (!selected || (active !== undefined && selected !== active)) throw new Error('Active photo does not match its saved version.');
}
export function validateProject(value: unknown): Project {
  const p = record(value, 'project data');
  if (p.version !== 1) throw new Error('This project version is not supported.');
  if (p.mode !== undefined) choice(p.mode, ['lineup', 'starting-lineup', 'result'], 'editor mode');
  if (p.mode === 'result' && !p.matchResult) throw new Error('Missing match result.');
  if (p.mode === 'starting-lineup' && !p.startingLineup) throw new Error('Missing starting lineup.');
  if (p.startingLineup !== undefined) {
    const s = record(p.startingLineup, 'starting lineup');
    if (s.textScale !== undefined) numeric(s.textScale, 'starting lineup text size', .8, 1.5);
    if (s.backgroundOpacity !== undefined) numeric(s.backgroundOpacity, 'starting background opacity', 0, 100);
    if (s.backgroundPreset !== undefined) choice(s.backgroundPreset, startingLineupBackgrounds.map(p => p.id), 'starting background preset');
    choice(s.title, ['STARTING XI', 'LINE-UP', 'TEAM SHEET'], 'starting lineup title'); choice(s.template, ['broadcast-list', 'dark-team-sheet', 'club-poster', 'minimal-lineup', 'hero-xi', 'formation-pro', 'player-cards', 'clean-xi', 'matchday-xi', 'stadium-xi'], 'starting lineup template'); choice(s.size, Object.keys(SIZES), 'starting lineup size'); choice(s.nameStyle, ['full', 'surname', 'nickname'], 'starting lineup name style'); choice(s.substituteLayout, ['wrapped', 'compact'], 'substitute layout'); choice(s.sponsorPosition, ['top', 'bottom'], 'sponsor position');
    if (typeof s.showSponsors !== 'boolean') throw new Error('Invalid sponsor visibility.');
    if (s.design !== undefined) { const d = record(s.design, 'starting design'); numeric(d.variation, 'design variation', 0, 5); numeric(d.fontScale, 'font scale', .7, 1.3); numeric(d.spacing, 'spacing', .8, 1.2); }
    const colors = record(s.colors, 'starting lineup colors'); for (const key of ['primary', 'secondary', 'accent', 'text']) if (typeof colors[key] !== 'string' || !/^#[0-9a-f]{6}$/i.test(colors[key] as string)) throw new Error('Invalid starting lineup color.');
    const bg = record(s.background, 'starting lineup background'); choice(bg.kind, ['pitch', 'stadium', 'gradient', 'custom'], 'starting lineup background'); image(bg.image, 'starting lineup background image'); numeric(bg.brightness, 'starting lineup brightness', 20, 160); numeric(bg.blur, 'starting lineup blur', 0, 20); numeric(bg.overlay, 'starting lineup overlay', 0, 90);
    const hero = record(s.hero, 'starting lineup hero'); image(hero.src, 'hero image', 180_000_000); photoVersions(hero.playerPhoto, hero.playerId ? undefined : hero.src); string(hero.playerId ?? '', 'hero player ID'); numeric(hero.x, 'hero X', -50, 50); numeric(hero.y, 'hero Y', -50, 50); numeric(hero.zoom, 'hero zoom', .5, 2); image(s.competitionLogo, 'competition logo');
    if (!Array.isArray(s.starters) || s.starters.length !== 11) throw new Error('Starting lineup must contain exactly 11 players.');
    const starterIds = new Set<string>(); let captains = 0; for (const value of s.starters) { const entry = record(value, 'starting player'); string(entry.playerId, 'starting player ID'); if (starterIds.has(entry.playerId as string)) throw new Error('Starting players must be unique.'); starterIds.add(entry.playerId as string); if (entry.captain) captains++; if (entry.displayName !== undefined) string(entry.displayName, 'starting display name', 80); if (typeof entry.captain !== 'boolean') throw new Error('Invalid captain flag.'); } if (captains > 1) throw new Error('Starting lineup can have one captain.');
    if (!Array.isArray(s.substitutes) || s.substitutes.length > 12 || new Set(s.substitutes).size !== s.substitutes.length) throw new Error('Starting substitutes are invalid.'); s.substitutes.forEach((id) => string(id, 'substitute ID'));
    const info = record(s.matchInfo, 'starting lineup match info'); if (typeof info.enabled !== 'boolean') throw new Error('Invalid match info visibility.'); for (const key of ['opponent', 'date', 'time', 'venue', 'round']) string(info[key], `starting lineup ${key}`); image(info.opponentLogo, 'starting opponent logo');
    if (!Array.isArray(s.sponsors) || s.sponsors.length > 12) throw new Error('Too many sponsor logos.'); for (const value of s.sponsors) { const sponsor = record(value, 'sponsor'); string(sponsor.id, 'sponsor ID'); string(sponsor.label, 'sponsor label', 80); image(sponsor.src, 'sponsor image'); }
  }
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
    numeric(player.x, 'player X', 0, 100); numeric(player.y, 'player Y', 0, 100); image(player.photo, 'player photo', 180_000_000); photoVersions(player.playerPhoto, player.photo);
    if (player.photoEffect !== undefined) {
      const e = record(player.photoEffect, 'photo effect');
      if (e.version !== 1) throw new Error('Unsupported photo effect version.');
      choice(e.mode, ['original', 'cutout', '3d'], 'photo effect mode');
      for (const [key, min, max] of [['zoom', .5, 1.5], ['x', -100, 100], ['y', -100, 100], ['rotation', -30, 30], ['perspective', 600, 2000], ['tiltX', -20, 20], ['tiltY', -20, 20], ['overlap', 0, .5]] as const) numeric(e[key], `effect ${key}`, min, max);
      const shadow = record(e.shadow, 'depth shadow'); const edge = record(e.edge, 'edge effect'); const card = record(e.card, 'depth card');
      if (typeof shadow.enabled !== 'boolean' || typeof card.enabled !== 'boolean' || typeof edge.useTeamColor !== 'boolean') throw new Error('Invalid photo effect toggle.');
      for (const [key, min, max] of [['x', -60, 60], ['y', -60, 60], ['blur', 0, 60], ['opacity', 0, 1], ['distance', 0, 3]] as const) numeric(shadow[key], `shadow ${key}`, min, max);
      choice(edge.style, ['none', 'outline', 'team', 'soft'], 'edge style');
      numeric(edge.width, 'outline width', 0, 8); numeric(edge.strength, 'glow strength', 0, 1); numeric(edge.blur, 'glow blur', 0, 50);
      if (typeof edge.color !== 'string' || !/^#[0-9a-f]{6}$/i.test(edge.color)) throw new Error('Invalid glow color.');
      for (const [key, min, max] of [['depth', 0, 30], ['shadow', 0, 1], ['tilt', -12, 12], ['border', 0, 6], ['radius', 0, 40]] as const) numeric(card[key], `card ${key}`, min, max);
    }
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
