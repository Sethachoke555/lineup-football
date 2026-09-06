# Touchline Studio architecture

An original, local-first football broadcast graphic editor. No broadcast network assets or trademarks are used.

## Layers

- `types/project.ts`: versioned, JSON-serializable project contract. Images are embedded data URLs in the initial local implementation.
- `lib/formations.ts`: deterministic formation slots in pitch-relative percentages; goalkeeper is the first slot.
- `lib/templates.ts`: appearance presets that never replace squad or team data.
- `lib/renderer.ts`: browser Canvas 2D renderer shared by the live preview and image export. Editor selection controls are DOM overlays, absent from exports.
- `lib/storage.ts`: asynchronous repository interface and LocalStorage implementation. A future Supabase/PostgreSQL adapter can implement the same contract; images can then move to object storage.
- `components/editor`: project ownership, bounded undo/redo history and layout orchestration.
- `components/sidebar`, `players`, `toolbar`, `pitch`: focused controls and pointer interaction.
- `utils`: image validation/loading and browser download helpers.

## Coordinates and rendering

Positions use 0–100 X/Y coordinates within a pitch region derived from canvas aspect ratio. Formation rows run from defense to attack, with goalkeeper nearest the bottom. Changing formation redistributes starting players in squad order; dragging changes only the selected player's coordinates. Substitutes appear in a separate footer strip. Photo transforms are stored independently of player coordinates.

The renderer draws at the requested output resolution (1080×1350, 1080×1080, 1920×1080 or 1080×1920). CSS scales the preview. The export draws to a separate canvas after images and fonts are ready, then uses `toBlob` for PNG or JPEG. Transparent player images are composited directly. JPEG has an opaque background. All graphics use locally generated shapes and uploaded images, avoiding remote-image CORS dependencies.

## Persistence and history

Explicit Save writes a named project. Load, duplicate and delete operate through the repository. Writes report quota errors; they never silently claim success. Project JSON backup provides a portable alternative for image-heavy projects. Uploads preserve the original image bytes. Schema validation protects load/import boundaries. History is capped to limit memory use.

## Implementation phases

1. Architecture and typed project contract.
2. Next.js, React, TypeScript, Tailwind, Lucide, lint/typecheck setup.
3. Responsive editor layout and project history.
4. Squad management with 11 starting and 12 substitute slots.
5. Formation engine and shared canvas rendering.
6. Upload validation, alpha-preserving photo transforms and crop controls.
7. Four original templates, colors and backgrounds.
8. Pointer dragging and formation reset.
9. Exact-resolution PNG/JPG export and persistence workflow.
10. Build, lint, typecheck and functional verification.

Run typecheck and lint at each code phase boundary. Test formation integrity, repository behavior and the rendered workflow before completion.

## Implemented result

All ten phases are implemented. The app includes the responsive editor, 23-player squad management, ten formations, alpha-preserving photo uploads and crop transforms, four appearance presets, background controls, pointer/keyboard placement, exact-resolution PNG/JPG downloads, and the local project library with JSON backup/import.

Final verification covers TypeScript, ESLint, the production build, domain/repository tests, and Chrome browser workflows. Library quota and blocked-storage paths are exercised. Exported PNG pixels are compared directly with the live canvas, including uploaded logos and a custom background. Browser tests also verify JPG dimensions and every PNG output format.

Adding a substitute or promoting a starter preserves existing manual coordinates. Only explicit formation changes or Reset formation rearrange the whole starting lineup. Photo crop is a non-destructive frame with zoom and movement; automatic background removal is outside the current scope.
