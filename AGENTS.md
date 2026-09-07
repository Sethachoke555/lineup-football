<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->


# Touchline Studio

Football graphic generator built with Next.js, React and TypeScript.

## Existing Features

- Lineup / Formation
- Starting Lineup / Team Sheet
- Match Result
- Player photo upload/edit
- Graphic templates
- Save/load project
- PNG/JPG export

## Development Rules

- Never rebuild the project from scratch.
- Never break existing features.
- Inspect only files relevant to the current task.
- Reuse existing components, types, state and utilities when possible.
- Avoid duplicate implementations.
- Keep components modular.
- Avoid unnecessary dependencies.
- Do not implement fake buttons or placeholder features.
- Do not modify unrelated code unless required.

## Shared Data

Reuse existing data across graphic modules when possible:

- Team
- Team logo
- Squad
- Players
- Player photos
- Shirt numbers
- Competition
- Match information

Do not require users to enter the same data repeatedly.

## Images

- Preserve image aspect ratio.
- Never stretch player photos or logos.
- Preserve transparent PNG alpha.
- Reuse existing crop/position/zoom system.
- Keep image quality high for export.

## Graphics

Supported canvas sizes:

- 1080x1350
- 1080x1080
- 1080x1920
- 1920x1080

Graphic features should support existing:

- Live preview
- Templates
- Save/load
- PNG/JPG export

Changing templates should not reset user data.

## Language

Support both Thai and English text.

Avoid layouts that break with long Thai or English names.

## Before Coding

- Inspect the relevant existing implementation first.
- Reuse existing functionality where practical.
- Do not scan unrelated files unless necessary.

## After Coding

Run:

npm run build

Fix TypeScript/build errors before finishing.