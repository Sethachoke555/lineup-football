'use client';
import { useState } from 'react';
import { Settings2, Users, Palette, LayoutGrid, ImageIcon, X } from 'lucide-react';
import { MatchResultEditor, createMatchResult } from '@/features/match-result';
import { StartingLineupEditor, ensureStartingLineup } from '@/features/starting-lineup';
import { useProject } from '@/hooks/use-project';
import { Toolbar, ProjectActions, BackgroundSettings, TemplateSettings } from '@/components/shared';
import { TeamSettings } from '@/components/sidebar/team-settings';
import { FormationSettings, PitchPreview, PlayerInspector, PositionEditor, SquadList } from '@/features/lineup';
import { applyTemplate } from '@/lib/templates';
import { createProject, newPlayer } from '@/lib/defaults';
import { arrangePlayers, placeStarter } from '@/lib/formations';
import { PhotoEditor } from '@/components/players/photo-editor';
import { SIZES, type Player } from '@/types/project';

export function Editor() {
  const { project, edit, undo, redo, canUndo, canRedo, replace } = useProject();
  const [tab, setTab] = useState('players');
  const [selectedId, setSelectedId] = useState<string | null>(() => project.players[8]?.id ?? null);
  const [message, setMessage] = useState('');
  const [snap, setSnap] = useState(false);
  const selectedPlayer = project.players.find((player) => player.id === selectedId);
  const add = (status: Player['status']) => {
    if (project.players.filter((x) => x.status === status).length >= (status === 'starting' ? 11 : 12)) return;
    const player = newPlayer(project.players.length, status);
    edit((p) => ({ ...p, players: [...p.players, status === 'starting' ? placeStarter(player, p.players, p.formation) : player] }));
    setSelectedId(player.id);
  };
  const duplicate = (id: string) => {
    const source = project.players.find((p) => p.id === id);
    if (!source || project.players.filter((p) => p.status === 'substitute').length >= 12) return;
    const copy: Player = { ...source, id: crypto.randomUUID(), name: `${source.name} copy`.slice(0, 50), status: 'substitute' };
    edit((p) => ({ ...p, players: [...p.players, copy] })); setSelectedId(copy.id);
  };
  const updatePlayer = (patch: Partial<Player>) => edit((p) => {
    const current = p.players.find((x) => x.id === selectedId);
    if (!current) return p;
    if (patch.status && patch.status !== current.status && p.players.filter((x) => x.status === patch.status).length >= (patch.status === 'starting' ? 11 : 12)) return p;
    const changed = { ...current, ...patch };
    const positioned = patch.status === 'starting' && current.status !== 'starting' ? placeStarter(changed, p.players, p.formation) : changed;
    return { ...p, players: p.players.map((x) => x.id === selectedId ? positioned : x) };
  });

  return <div className="studio">
    <Toolbar name={project.name} onName={(name) => edit((p) => ({ ...p, name }))} {...{ undo, redo, canUndo, canRedo }} reset={() => { if (confirm('Reset this project? You can undo this action.')) replace(createProject()); }}><ProjectActions project={project} onLoad={(p) => { replace(p); setSelectedId(null); }} notify={setMessage} /></Toolbar>
    <nav className="mode-tabs" aria-label="Studio mode">{(['lineup', 'starting-lineup', 'result'] as const).map((mode) => <button key={mode} aria-pressed={(project.mode ?? 'lineup') === mode} onClick={() => edit((p) => ({ ...p, mode, ...(mode === 'result' && !p.matchResult ? { matchResult: createMatchResult(p) } : {}), ...(mode === 'starting-lineup' ? { startingLineup: ensureStartingLineup(p) } : {}) }))}>{mode === 'lineup' ? 'LINEUP' : mode === 'starting-lineup' ? 'STARTING LINEUP' : 'MATCH RESULT'}</button>)}</nav>
    {project.mode === 'result' && project.matchResult ? <MatchResultEditor project={project} onError={setMessage} onChange={(patch) => edit((p) => ({ ...p, matchResult: { ...p.matchResult!, ...patch } }))} /> : project.mode === 'starting-lineup' && project.startingLineup ? <StartingLineupEditor project={project} onError={setMessage} onChange={(patch) => edit((p) => ({ ...p, startingLineup: { ...p.startingLineup!, ...patch } }))} /> : <div className="workspace">
      <aside className="left-sidebar">
        <nav className="side-tabs" aria-label="Editor panels">
          {[
            { id: 'team', label: 'Team', icon: Settings2 }, { id: 'players', label: 'Squad', icon: Users },
            { id: 'formation', label: 'Layout', icon: LayoutGrid }, { id: 'templates', label: 'Style', icon: Palette },
            { id: 'background', label: 'Scene', icon: ImageIcon },
          ].map(({ id, label, icon: Icon }) =>
            <button key={id} className={tab === id ? 'active' : ''} aria-pressed={tab === id} onClick={() => setTab(id)}><Icon size={18} /><span>{label}</span></button>)}
        </nav>
        {tab === 'team' && <TeamSettings team={project.team} onError={setMessage} onChange={(patch) => edit((p) => ({ ...p, team: { ...p.team, ...patch } }))} />}
        {tab === 'players' && <SquadList players={project.players} selectedId={selectedId} select={setSelectedId} add={add} duplicate={duplicate} remove={(id) => edit((p) => ({ ...p, players: p.players.filter((x) => x.id !== id) }))} />}
        {tab === 'formation' && <FormationSettings project={project} onFormation={(formation) => edit((p) => ({ ...p, formation, players: arrangePlayers(p.players, formation) }))} onSize={(size) => edit((p) => ({ ...p, size }))} />}
        {tab === 'templates' && <TemplateSettings project={project} onTemplate={(template) => edit((p) => applyTemplate(p, template))} onColors={(patch) => edit((p) => ({ ...p, colors: { ...p.colors, ...patch } }))} />}
        {tab === 'background' && <BackgroundSettings background={project.background} onChange={(patch) => edit((p) => ({ ...p, background: { ...p.background, ...patch } }))} onError={setMessage} />}
      </aside>
      <main className="center-panel">
        <div className="preview-heading"><div><span className="eyebrow">MATCHDAY CREATIVE</span><h1>Starting lineup</h1></div><span className="live-badge"><i /> Live preview</span></div>
        <div className="preview-tools"><span>Drag players to fine-tune your lineup</span><label className="checkbox-field"><input type="checkbox" checked={snap} onChange={(e) => setSnap(e.target.checked)} />Snap to formation</label></div>
        <div className="canvas-stage"><PitchPreview project={project} selectedId={selectedId} select={setSelectedId} onError={setMessage} snap={snap} onMove={(id, point) => edit((p) => ({ ...p, players: p.players.map((player) => player.id === id ? { ...player, ...point } : player) }))} /></div>
        <div className="preview-footer"><span>{SIZES[project.size].join(' × ')} px</span><span>{project.formation} · {project.players.filter((p) => p.status === 'starting').length} starters</span><span>Built for matchday.</span></div>
      </main>
      <aside className="right-sidebar">
        <PlayerInspector player={selectedPlayer} project={project} onChange={updatePlayer} onText={(patch) => edit((p) => ({ ...p, text: { ...p.text, ...patch } }))}>
          {selectedPlayer && <>
            <PhotoEditor key={selectedId} player={selectedPlayer} project={project} onChange={updatePlayer} onError={setMessage} />
            <PositionEditor player={selectedPlayer} onChange={updatePlayer} />
          </>}
        </PlayerInspector>
      </aside>
    </div>
    }
    {message && <div className="status-message" role="status">{message}<button aria-label="Dismiss notification" onClick={() => setMessage('')}><X size={16} /></button></div>}
  </div>;
}
