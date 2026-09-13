# 3D Garden experiment — third-party notes

This experimental branch keeps the production `main` branch untouched and rebuilds the lakeside scene under `v2/nestward/garden-3d.*`.

## Incorporated open / public-domain components

### Luminous Lake
- Source: https://github.com/stas4000/luminous-lake
- License: MIT
- Selected source modules are vendored under `v2/nestward/vendor/luminous-lake/`, together with the upstream LICENSE.
- Used for the procedural lake terrain, transparent reflective water, sky/environment lighting, wave field, wildlife simulation/view code and the original fishing-boat fallback.

### Quaternius — Ultimate Stylized Nature
- Mirror used for source files: https://github.com/agentkaerf/FreeModels
- Original creator: https://quaternius.com
- License: CC0 1.0
- Kitten Nest stores lightweight glTF wrapper files under `v2/nestward/assets/3d-cc0/`.
- The wrappers point to the public source buffers/base-color textures and deliberately omit very large bark normal maps for mobile use.
- Used for true modeled birch/maple trees and flowering shrubs.

### 3DAssets.dev
All items below are declared CC0 1.0 by the asset library and are loaded as optimized GLB files:
- Hedge Witch Cottage starter scene — asset 32485 — https://cdn.3dassets.dev/assets/32485/v1/model.glb
- Cabin Fishing Boat — asset 19553 — https://cdn.3dassets.dev/assets/19553/v1/model.glb
- Oak Tree Young — asset 28312 — https://cdn.3dassets.dev/assets/28312/v1/model.glb

These are used only in this non-custom visual-ceiling experiment. A future Kitten Nest house can replace the cottage without changing the world/core architecture.

### ambientCG terrain materials via Vestige
- Integration repository: https://github.com/milnet01/Vestige
- Vestige's ASSET_LICENSES.md identifies the terrain maps as ambientCG CC0 sources.
- Used maps: Grass001, Ground068, Rock035 and Ground037 derivatives supplied in `assets/textures/terrain/`.
- The scene uses real albedo/normal data for the PBR shore/grass/rock material instead of multiplying the old dark procedural vertex colors.
- Vestige foliage cards are also used for grass blades and small flowers.

### Poly Haven HDRI
- Source: https://polyhaven.com/a/meadow_2
- License: CC0 1.0
- The 1K `meadow_2` HDR is used only as the PBR environment/reflection source; the visible sky remains the controllable Luminous Lake sky.

### Three.js
- Source: https://github.com/mrdoob/three.js
- License: MIT
- Runtime modules are loaded through jsDelivr via the page import map.
- EffectComposer + SSAO are used for restrained screen-space contact shading, with automatic mobile fallback.

## Techniques studied but not directly copied as assets

The vegetation/LOD and terrain strategy was informed by these MIT projects:
- Realistic Forest — https://github.com/Token-Gremlin/realistic-forest
- False Earth — https://github.com/momentchan/false-earth
- three-landscape — https://github.com/nwpointer/three-landscape

No purchased character model, no demo-only three-landscape texture, and no mixed-license binary media is copied into this branch.

## Kitten Nest original integration work

The experiment-specific code covers:
- mobile third-person joystick/camera
- NW animated 2D character as a world-space billboard
- boarding, steering, floating and disembarking logic for the imported boat
- cottage/dock collision and layout
- deterministic asset scattering and mobile shadow policy
- shoreline reeds / meadow / flower placement
- PBR height/slope/path terrain blending
- live lake reflections
- adaptive SSAO / pixel ratio / vegetation fallback
- loading/error handling and the old-NW return route

## Recovery points

- Pre-3D production backup: `backup/pre-3d-garden-20260913`
- First playable 3D prototype backup: `backup/3d-garden-v1-20260913`
- Second procedural/high-detail prototype backup: `backup/3d-garden-v2-20260913`
- Current experiment branch: `experiment/3d-garden-world`

Production `main` is intentionally not merged until visual acceptance.
