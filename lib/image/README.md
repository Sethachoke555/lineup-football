# Player background removal

Player and standalone hero uploads use `PlayerPhotoUpload`, then the shared
Before/After dialog. The chosen source enters the existing crop editor and renderers.
Both sources persist in `playerPhoto`; `photo` (or hero `src`) remains the active
source for compatibility with existing renders and project files.

Inference uses @imgly/background-removal 1.7 in a dedicated, cancellable worker.
The first opaque image downloads the ISNet FP16 model and WASM from IMG.LY's CDN.
Photos are not uploaded. An internet connection is required for uncached model
assets; saved cutouts can be edited/exported without further inference.
Existing alpha images bypass segmentation and are encoded as full-frame PNG.
Outputs retain source dimensions. Model segmentation can still miss fine edges
or include another prominent person; Before/After and Keep Original remain available.

The dependency is AGPL-3.0 licensed; see its bundled LICENSE.md and
https://github.com/imgly/background-removal-js for distribution terms and alternative
licensing. No API credentials or server processing are required.

Run the normal suite for alpha passthrough, crop, version persistence and export.
For a real model integration check, set REMOVAL_PHOTO to an absolute path to a
JPG/PNG/WEBP photograph and run:

```
npm run test:e2e -- --grep "background removal real"
```

This test downloads real model assets, checks nonempty foreground/transparency
and unchanged dimensions, and writes a Before/After screenshot. It is opt-in
because it needs a photograph and network access.
