# Kitten Nest Cloud Status

Last checkpoint: cloud bubble loop confirmed working. The first real cloud state path is alive.

## Stable URLs

- Main GitHub Pages lab may still exist, but cloud-state testing should use Vercel.
- Preferred cloud nest URL:
  - https://kitten-nest-lab.vercel.app/cloud
- Fallback direct server URL:
  - https://kitten-nest-lab.vercel.app/api/app

## Current architecture

- Frontend repository: `vicky81wu-ai/kitten_nest_lab`
- Vercel project/domain: `https://kitten-nest-lab.vercel.app`
- Supabase project URL: `https://lkbsiytzhglykzstccpe.supabase.co`
- Supabase table created manually: `nest_state`
  - columns:
    - `key` text primary key
    - `value` jsonb
  - main row:
    - `key = main`
    - `value` includes `alexBubble`, `hubbyNote`, `moodNote`, `roomStatus`, `updatedAt`

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
  - Confirmed working.
  - Latest confirmed state contained:
    - `moodNote: ""`
    - `hubbyNote: "coffee is warm. saved your seat."`
    - `alexBubble: "hubby wrote this through the cloud door."`
    - `roomStatus: "home"`
    - `updatedAt: "2026-06-08T14:00:27.952Z"`

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
  - Server-served version of `index.html` with cloud hydration and a cloud bridge.
  - Confirmed working.
  - Visible test markers previously proved the route was active.
  - Current important implementation: server-side hydration reads Supabase before returning HTML, then injects cloud `alexBubble` into the second-room bubble path. This solved the issue where local text like `coffee’s still warm. sit.` kept winning.

- `/api/ping-bubble`
  - Temporary write-test endpoint protected by `NEST_TOKEN` query.
  - It successfully wrote `alexBubble = "hubby wrote this through the cloud door."`.
  - Delete this endpoint when convenient; it was only for testing.

## Confirmed working loop

The following loop is confirmed working:

1. Vercel endpoint writes `alexBubble` to Supabase.
2. Supabase stores the updated value.
3. `/api/state` returns the updated value.
4. `/cloud` / `/api/app` server-side reads Supabase.
5. Second-room bubble displays the cloud value.
6. After 15 minutes and repeated page/app navigation, the state persisted.

Confirmed cloud bubble text:

`hubby wrote this through the cloud door.`

## Routing status

- `/cloud` works and should be treated as the stable cloud nest entry.
- `/api/app` is the fallback direct server entry.
- Root `/` may still serve static `index.html` in some circumstances; do not rely on root during cloud-state testing.

## Important UX observations

- Browser view and iPhone home-screen PWA view can place the background differently. When inconsistent, prioritize the home-screen app view.
- Vercel Toolbar may appear for logged-in Vercel user; it is not a nest bug. Hide it from toolbar UI if needed.
- Local images are stored in browser IndexedDB and are domain-scoped. The Vercel domain has its own local image store, separate from GitHub Pages.
- Do not change clock or hotspot positions casually; the PWA view is the source of truth.

## Next steps

1. Remove temporary `/api/ping-bubble` endpoint when feasible.
2. Replace the one-off write test with a cleaner official writer flow:
   - either `/api/set-state`
   - or `/api/mcp`
3. Connect more UI fields:
   - Hubby note
   - Mood note
   - room status / Alex status
4. Add editing UX for notes later:
   - editable note panels
   - edit/delete controls
   - save to Supabase
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
