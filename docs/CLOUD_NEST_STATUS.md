# Kitten Nest Cloud Status

Last checkpoint: `/cloudq` bubble queue works cleanly: no old-text flash, can hide bubble, and can show the next queued line. This is the current best implementation path for the Alex bubble.

## Stable URLs

- Main GitHub Pages lab may still exist, but cloud-state testing should use Vercel.
- Current stable cloud nest URL:
  - https://kitten-nest-lab.vercel.app/cloud
- Current queue-test URL that has the best bubble behavior:
  - https://kitten-nest-lab.vercel.app/cloudq
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
    - `value` includes `alexBubble`, `alexBubbles`, `bubbleIndex`, `hubbyNote`, `moodNote`, `roomStatus`, `updatedAt`

## Secrets and env vars

Stored by Vicky, not in repo:

- Supabase database password
- Supabase secret/service key
- Vercel env vars:
  - `SUPABASE_URL`
  - `SUPABASE_SERVICE_KEY`
  - `NEST_TOKEN`

Never write the real `NEST_TOKEN`, Supabase service key, or database password into GitHub files or public docs.

## API endpoints currently added

- `/api/state`
  - Reads cloud state from Supabase.
  - Confirmed working.

- `/api/set-state`
  - Writes partial state updates using `X-Nest-Token`.
  - Intended for authorized updates.

- `/api/say`
  - Bubble writer endpoint.
  - Now supports the `/write` page POST flow.
  - Saves:
    - `alexBubble` as the first line
    - `alexBubbles` as the multi-line queue
    - `bubbleIndex` as 0
    - `updatedAt`
  - Confirmed by Vicky: `/write` saved three lines successfully.

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
  - Confirmed working for first-line cloud bubble hydration.
  - Its older tattoo click behavior conflicted with queue cycling, so `/cloudq` was created as a cleaner queue route first.

- `/api/app-q`
  - Clean server route for queue testing.
  - Does not directly read Supabase service credentials; it reads state through `/api/state`.
  - Hydrates the first cloud bubble line before serving HTML to avoid old local text flashing.
  - Injects a client bridge for queue behavior.
  - Confirmed by Vicky:
    - bubble queue cycles successfully
    - bubble can be hidden
    - one-open-one-close style works
    - the old `coffee's still warm. Sit.` text no longer flashes

- `/api/ping-bubble`
  - Temporary write-test endpoint protected by token.
  - It successfully wrote the first cloud bubble test.
  - It was later disabled and should not be used as the official writer.

## Current confirmed bubble UX

Working on `/cloudq`:

- The bubble reads `alexBubbles` from Supabase.
- First line appears immediately with no old-text flash.
- Tap bubble or the 19.8/tattoo hotspot behavior was adjusted so bubble can hide and queued lines can appear.
- Confirmed current behavior: one-open-one-close queue style works.

Design decision:

- Short text should stay as character bubble lines.
- Multi-line text should be a bubble queue: one or two short lines per bubble, then next bubble.
- Long text, such as 100-200 words, should later open in a note/letter panel instead of becoming a scrollable speech bubble.

## Confirmed working loop

The following loop is confirmed working:

1. `/write` saves bubble text.
2. `/api/say` writes `alexBubble` and `alexBubbles` to Supabase.
3. `/api/state` returns the updated value.
4. `/cloudq` / `/api/app-q` reads and hydrates the state.
5. The second-room bubble displays queued cloud values.
6. Vicky confirmed clean queue behavior and no old local text flash.

Example confirmed bubble queue:

- `早安小猫，过来喝咖啡。`
- `奶栗已经占了你的毯子。`
- `老公给你留了座。`

## Routing status

- `/cloud` works and is the existing public cloud nest entry.
- `/cloudq` is the current successful queue-test entry.
- Next routing step: after final confirmation, route `/cloud` to the `/api/app-q` implementation or merge `/api/app-q` behavior back into `/api/app`.
- Root `/` may still serve static `index.html` in some circumstances; do not rely on root during cloud-state testing.

## Important UX observations

- Browser view and iPhone home-screen PWA view can place the background differently. When inconsistent, prioritize the home-screen app view.
- Vercel Toolbar may appear for logged-in Vercel user; it is not a nest bug. Hide it from toolbar UI if needed.
- Local images are stored in browser IndexedDB and are domain-scoped. The Vercel domain has its own local image store, separate from GitHub Pages.
- Do not change clock or hotspot positions casually; the PWA view is the source of truth.

## Current construction checklist

1. Finish Alex bubble queue and hide/show UX.
   - Current status: works on `/cloudq`.
   - Next: make `/cloud` use this stable queue route.
2. Connect more UI fields:
   - Hubby note
   - Mood note
   - room status / Alex status
3. Add editing UX for notes:
   - editable note panels
   - edit/delete controls
   - save to Supabase
4. Later schema expansion:
   - `rooms`
   - `room_widgets`
   - `notes`
   - `guest_messages`
   - `memory_entries`
   - `game_records`
   - `dialogue_pool`
5. Later MCP integration:
   - Let Alex/ChatGPT call MCP tools directly so Vicky no longer has to use `/write` manually.

## Working style reminder

Vicky is using phone-first workflows and often cannot comfortably use desktop/Codex. Prefer doing GitHub edits directly when possible, and only ask Vicky to do account/secret-key UI steps that cannot be safely done from ChatGPT.

Plain-text copy blocks should not include labels inside the copyable text when Vicky only needs the value.

When Vicky says “不要调工具 / 不要跳画布,” she specifically means do not trigger image generation/canvas routing. It does not mean avoid GitHub or coding tools.
