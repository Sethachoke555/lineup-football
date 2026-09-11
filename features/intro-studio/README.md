# Integrated intro studios

The PLAYER INTRO and TEAM INTRO tabs embed the existing Kickoff renderer at `/kickoff/`. Styles and animation loops stay inside the iframe, so the existing lineup, starting-lineup and result editors retain their own canvas and controls.

The host supplies the current team, squad, logo, colors and photo crops through a same-origin, source-checked message bridge. Existing crop utilities prepare images without changing original project assets. Each intro keeps its own presentation overrides in `project.introStudio`; Save, Load, undo and JSON backups use the existing project repository. “ใช้ข้อมูลทีมล่าสุด” imports current shared values again. Large embedded videos can exceed browser save quotas; the existing save error remains visible and JSON backup is available.

Source lives in `kickoff-studio/`; built assets are in `public/kickoff/` and are served by Next.js on the same port. No second running server is required. To rebuild after editing the renderer:

```
npm --prefix kickoff-studio ci
npm --prefix kickoff-studio run build
npm run build
```

The original project at `D:\My_Project_1\3D_football` is retained. Generated static assets and the standalone JavaScript project are excluded from the host's Next.js ESLint rules. Intro exports use their own image/video buttons; the original PNG/JPG toolbar buttons remain available in the existing graphic modes.
