# 3D Garden experiment — third-party notes

This experimental branch adds a new lakeside 3D scene under `v2/nestward/garden-3d.*`.

The implementation is original integration code for Kitten Nest, built on the MIT-licensed Three.js ecosystem and informed by two public MIT-licensed reference projects:

- Three.js — https://github.com/mrdoob/three.js — MIT.
- Open Water — https://github.com/bob6664569/open-water — MIT source code. Its repository contains mixed-license media, so this Kitten Nest experiment does **not** copy Open Water's bundled boat/animal/media assets.
- Sky Isles — https://github.com/stas4000/sky-isles — MIT. Used as a reference for procedural browser-world/touch-control architecture; no binary assets copied.

Runtime imports currently use Three.js, Sky and Water modules from jsDelivr. The normal-map texture used by Three.js Water is loaded from the official Three.js examples host.

This branch is intentionally experimental and should remain isolated from `main` until visual acceptance.
