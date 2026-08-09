# Kitten Nest v2 `/cloud` promotion plan

Status: gated; no production route has changed

## Preconditions

- `npm run check:v2` passes with no skipped or failing checks.
- The protected branch preview completes the concise iPhone sweep in `ACCEPTANCE.md`.
- `/api/state` and the installed `猫窝` MCP connection can read the same live state.
- The production rollback commit is re-read immediately before promotion. The current baseline is `5723fd592188583e3d366cf3550882f8c04d3927`.

## Exact promotion diff

The promotion must be one isolated commit containing only these product changes:

1. Change the `vercel.json` `/cloud` destination from `/api/app-coords` to `/v2/index.html`.
2. Change `v2/data/nest-manifest.v2.json` from preview metadata (`promoted:false`, route `/v2/index.html`) to production metadata (`promoted:true`, route `/cloud`).
3. Update manifest validation so `promoted:true` is accepted only with route `/cloud`; the preview combination remains `promoted:false` with route `/v2/index.html`.
4. Remove isolated-preview wording from the document title and stage label. Keep `PREVIEW COPY` as a degraded-state notice only.
5. Update v2 status and acceptance records with the deployed production URL and promotion commit.

No controller, coordinate, hotspot, state field, asset source, or text target changes belong in this commit.

## Owners retired

Routing `/cloud` to the v2 document retires the v1 `api/app-coords.js` document and its injected owner chain from the product path. The legacy file remains reachable only through the explicit `/cloud-coords` compatibility route during the rollback window. It is never loaded beside v2.

## State preserved

- `nest_state/main` is not migrated or rewritten.
- The v2 runtime continues to read `/api/state`.
- MCP writes continue through the registered targets in `data/text-targets.v1.json`.
- Browser-originated writes remain limited to the six `hubbyNote` fields already enforced by the notebook client and `/api/set-state`.
- Supabase credentials remain server-side; no key enters the v2 document or manifest.

## Production acceptance

Full URL: `https://kitten-nest-lab.vercel.app/cloud`

After deployment, close the existing home-screen nest, reopen it once, and run this short route:

1. Home paints, moon toggles day/night, clock moves, and weather opens/closes.
2. Coffee corner shows the MCP-published bubble without a tail or position jump.
3. Photo wall and Gomoku open and return through the one panel stack.
4. Beach handhold -> bracelet -> stall -> back to coffee corner works.
5. Lap close -> coffee corner -> home works without leaked hotspots or panels.

## Rollback

If any production acceptance item fails:

1. Revert only the isolated promotion commit (or restore the `/cloud` destination to `/api/app-coords` if the merge created a grouped commit).
2. Redeploy `main` and verify `/cloud` serves the v1 owner chain again.
3. Confirm `/api/state` and `/api/mcp` remained untouched.
4. Keep the failing v2 work on the draft branch; do not patch production with a second runtime.

The pre-promotion `main` commit above is the current known-good reference, but it must not be force-reset or assumed current without re-reading the remote head.
