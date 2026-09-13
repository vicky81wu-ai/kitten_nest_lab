# 3D Garden experiment — third-party notes

This experimental branch keeps the production `main` branch untouched and rebuilds the lakeside scene under `v2/nestward/garden-3d.*`.

## Code incorporated

### Luminous Lake
- Source: https://github.com/stas4000/luminous-lake
- License: MIT
- A selected set of source modules is vendored under `v2/nestward/vendor/luminous-lake/`, together with its original LICENSE.
- Used for the procedural lake terrain, transparent reflective water, sky/environment lighting, wave field, wildlife simulation/view code, and fishing-boat base.
- Kitten Nest wraps and changes the presentation, movement, boarding/boat controls, cottage/shore layout, mobile controls, quality policy, and NW character integration.

### Three.js
- Source: https://github.com/mrdoob/three.js
- License: MIT
- Runtime modules are loaded through jsDelivr via the page import map.

## Techniques studied but not directly vendored

The high-density near-shore vegetation/LOD approach in the Kitten Nest integration was informed by these MIT projects:
- Realistic Forest — https://github.com/Token-Gremlin/realistic-forest
- False Earth — https://github.com/momentchan/false-earth
- three-landscape — https://github.com/nwpointer/three-landscape

No purchased character models, no demo-only textures from three-landscape, and no mixed-license binary media from other repositories are copied into this branch. The cottage, dock, close-up broadleaf tree system, grass field, rocks, fairies, mobile controller, and NW billboard character integration are original Kitten Nest experiment code.

## Recovery

- Pre-3D production backup: `backup/pre-3d-garden-20260913`
- First playable 3D prototype backup: `backup/3d-garden-v1-20260913`
- Current experiment branch: `experiment/3d-garden-world`
