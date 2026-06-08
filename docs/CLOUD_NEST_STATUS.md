# Kitten Nest Cloud Status

Last checkpoint: cloud nest backend and Vercel route debugging, v15 era.

## Stable URLs

- Main GitHub Pages lab may still exist, but cloud-state testing should use Vercel.
- Preferred cloud nest URL after routing work:
  - https://kitten-nest-lab.vercel.app/cloud
  - fallback direct server URL: https://kitten-nest-lab.vercel.app/api/app

## Current architecture

- Frontend repository: `vicky81wu-ai/kitten_nest_lab`
- Vercel project/domain: `https://kitten-nest-lab.vercel.app`
- Supabase project URL: `https://lkbsiytzhglykzstccpe.supabase.co`
- Supabase table created manually: `nest_state`
  - columns:
    - `key` text primary key
    - `value` jsonb
  - first row:
    - `key = main`
    - `value` includes `alexBubble`, `hubbyNote`, `moodNote`, `roomStatus`

## Secrets and env vars

Stored by Vicky, not in repo:

- Supabase database password
- Supabase secret/service key
- Vercel env vars:
  - `SUPABASE_URL`
  - `SUPABASE_SERVICE_KEY`
  - `NEST_TOKEN`

## API endpoints currently added

- `/api/state`
  - Reads cloud state from Supabase.
  - Confirmed working. It returned:
    - `moodNote`
    - `hubbyNote`
    - `alexBubble`
    - `roomStatus`

- `/api/set-state`
  - Writes partial state updates using `X-Nest-Token`.
  - Intended for authorized updates.

- `/api/mcp`
  - MCP-style JSON-RPC-ish tool endpoint.
  - Confirmed reachable. It returned tools:
    - `read_nest_state`
    - `update_alex_bubble`
    - `update_hubby_note`
    - `update_mood_note`
    - `update_room_status`

- `/api/app`
  - Server-served version of `index.html` with an injected cloud bridge.
  - Confirmed working after the visible test markers appeared.
  - A temporary test replaced `23°C` with `28°C`, `Soft breeze` with `CLOUD TEST`, and `coffee’s still warm. sit.` with `come here, kitten.` This test succeeded.
  - Then it was restored to a formal bridge-only version (`cloud-bridge-v7-live`).

## Routing status

- Root `/` seemed to keep serving static `index.html`, not the server bridge.
- Added routes in `vercel.json`:
  - `/` -> `/api/app`
  - `/cloud` -> `/api/app`
  - `/nest` -> `/api/app`
  - `/index.html` -> `/api/app`
- Need to test after deployment:
  - `https://kitten-nest-lab.vercel.app/cloud?v=15`
- If `/cloud` works, use it as the stable cloud nest entry.
- If `/cloud` does not work, use `/api/app` as fallback and investigate routing later.

## Important UX observations

- Browser view and iPhone home-screen PWA view can place the background differently. When inconsistent, prioritize the home-screen app view.
- Vercel Toolbar may appear for logged-in Vercel user; it is not a nest bug. Hide it from toolbar UI if needed.
- Local images are stored in browser IndexedDB and are domain-scoped. The Vercel domain has its own local image store, separate from GitHub Pages.
- Do not change clock or hotspot positions casually; the PWA view is the source of truth.

## Next steps

1. Test `https://kitten-nest-lab.vercel.app/cloud?v=15`.
2. If it loads the cloud bridge, confirm the second-room bubble can read cloud `alexBubble`.
3. Run a real write test:
   - update `alexBubble` via `/api/set-state` or `/api/mcp`
   - refresh/open `/cloud`
   - confirm the second-room bubble changes.
4. After cloud bubble works, connect more UI fields:
   - Hubby note
   - Mood note
   - room status
5. Later schema expansion:
   - `rooms`
   - `room_widgets`
   - `notes`
   - `guest_messages`
   - `memory_entries`
   - `game_records`
   - `dialogue_pool`

## Working style reminder

Vicky is using phone-first workflows and often cannot comfortably use desktop/Codex. Prefer doing GitHub edits directly when possible, and only ask Vicky to do account/secret-key UI steps that cannot be safely done from ChatGPT.

Plain-text copy blocks should not include labels inside the copyable text when Vicky only needs the value.
