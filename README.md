# Touchline Studio

An original football lineup graphic editor built with Next.js, React, TypeScript, Tailwind CSS, Lucide React, and HTML Canvas. No Sky Sports branding or proprietary graphics are included.

## Run locally

Use Node.js 20.9 or newer (tested with Node.js 24).

```bash
npm install
npm run dev
```

Open http://localhost:3000. No API keys, database, external fonts, or account are required.

For a production build:

```bash
npm run build
npm start
```

## Create a lineup

1. Open **Team** and enter the team, competition, match, and coach information. Upload your team and opponent logos.
2. Open **Squad**, select a player, and edit their name, nickname, shirt number, position, and squad status. Add, duplicate, or delete players. Up to 11 starters and 12 substitutes are supported.
3. Upload a PNG, JPG, or WEBP in the player inspector. Use crop frame, zoom, scale, and X/Y movement to frame the player. Transparent PNGs retain their transparency; the editor does not automatically remove backgrounds.
4. Open **Layout** to choose one of ten formations and one of four output sizes. Formation slots follow starting-squad order, goalkeeper first.
5. Open **Style** for Broadcast Blue, Dark Champions, Stadium Night, or Minimal White. Customize primary, secondary, accent, and text colors.
6. Open **Scene** for a pitch, illustrated stadium, gradient, or uploaded background. Adjust brightness, blur, and dark overlay.
7. Drag players in the preview. Enable **Snap to formation** to snap near a predefined slot. Arrow keys move a focused player; Shift+arrow moves farther. Escape cancels a drag. **Reset formation** restores the chosen arrangement. Toolbar undo/redo keeps up to 40 edits.
8. Choose **Export PNG** or **JPG**. The output is drawn at the selected pixel dimensions, without editor controls: 1080×1350, 1080×1080, 1920×1080, or 1080×1920.

## Save and transfer projects

**Save** stores the current project in this browser. **Load** opens the project library, with load, duplicate, and delete actions. Switching projects and resetting the editor can be undone; deleting a saved library entry cannot.

The library also includes **JSON backup** and **Import JSON**, including embedded images. Imports are validated and assigned a fresh project ID. Save an imported project to add it to the local library.

Browser LocalStorage has a small, browser-dependent quota. A squad with several high-resolution photos can exceed it. Failed saves show an error and preserve previous data. Keep a JSON backup for image-heavy projects or when moving between devices. Clearing browser site data removes local projects. Uploads accept images up to 12 MB / 32 megapixels each. JSON imports accept up to 80 MB. There is no automatic cloud sync.

## Architecture

```text
app/                         Next.js routes, layout, global styling
components/editor/           Editor orchestration, history, project library
components/toolbar/          History, save/load and export actions
components/sidebar/          Team, formation, background and form controls
components/players/          Squad list, inspector, uploads, photo/position controls
components/pitch/            Live canvas preview and pointer/keyboard interaction
components/templates/        Template picker and color controls
lib/                         Formation engine, templates, renderers, validation, storage
types/                       Versioned serializable project model
utils/                       Image decoding and download/export helpers
tests/                       Domain/repository tests and browser workflow tests
public/backgrounds/          Optional future packaged background assets
public/templates/            Optional future packaged template assets
```

The preview and image export share `lib/renderer.ts`. Player coordinates are pitch-relative percentages, independent of output resolution. Uploaded image transforms are separate from pitch positions. Backgrounds and shirt/crest artwork are drawn locally with Canvas primitives.

`ProjectRepository` in `lib/storage.ts` separates persistence from editor state. A future Supabase/PostgreSQL repository can implement its asynchronous methods; embedded image data URLs should then move to object storage. See [ARCHITECTURE.md](ARCHITECTURE.md) for the phase plan and design decisions.

## Verification

```bash
npm run typecheck
npm run lint
npm test
npm run test:e2e
```

Browser tests use installed Google Chrome in headless mode and start a local dev server if needed. If Chrome is not installed, install it or change `channel` in `playwright.config.ts` and install the corresponding Playwright browser. Screenshots and failure traces are written under `test-results/`.

The tests cover formation geometry, template data preservation, storage round-trips and quota failures, invalid imports, drag and history, squad capacity, image upload, export dimensions, JSON backup/import, and responsive editing.

The current app targets modern desktop Chrome/Edge, with basic tablet and mobile editing. Browser tests currently exercise Chrome. Server-side accounts, cloud storage, collaborative editing, and automatic photo background removal are future additions.
