# Nestward formal world model

Status: current formal architecture, 2026-08-13

## Product boundary

`v2/nestward/` is an immersive family world, not another room in the image-scene stack and not a second `/cloud` runtime. The first Canvas prototype proved the product intent, but none of its temporary coordinates, hard-coded hit boxes, HUD, or procedural placeholder art are specifications.

The accepted rule is:

```text
Keep the lived-world intent.
Design the formal world, coordinates, camera, art, collisions, and interaction sockets together.
Do not migrate or preserve prototype coordinates merely because they already existed.
```

The production home scene owns one transparent Pebble Jar hotspot. It opens the isolated same-origin route `/v2/nestward/`; it does not mount Nestward controllers inside `/cloud`, change the scene stack, or write state.

## Formal coordinate source

`v2/nestward/world-model.js` is the only owner of world geometry.

Each authored world is currently `1536 × 1024` world units:

```text
x       horizontal world coordinate
z       normalized walk-depth coordinate
hit     visual object hit region [x1, y1, x2, y2]
block   occupied walk region [x1, x2, z1, z2]
socket  approach destination before an interaction opens
slots   named final positions for multi-actor actions
mounts  final pose attachment: x, z, renderY, pose, height/width, facing
```

The camera may reveal the complete width of every authored world. One-finger dragging temporarily releases follow, two-finger pinching zooms around the gesture midpoint, and a deliberate player walk restores natural dead-zone following. Interaction controllers never carry duplicate room coordinates: they resolve `socket`, `slots`, and `mounts` from the scene object that owns the action. Every approach socket must be walkable and pathfinding must reach the exact authored point rather than silently replacing it with a nearby fallback.

## Rendering contract

`world-renderer.js` owns drawing and projection, not world meaning.

The renderer composes:

1. one detailed, perspective-consistent world plate;
2. depth-sorted Kitten, Hubby, and Naili pose or walk sprites;
3. world-model-owned foreground plate masks for correct furniture occlusion;
4. actor shadows, carried state, and wearable wings;
5. deterministic ambient particles and small world-bound effects;
6. transient tap feedback.

An object may now own a `visual` prop with independent `backZ` and `frontZ`
passes. `frontPolygons` clip only the portions that must cover a mounted actor.
The green reading chair is the reference implementation: the chair back renders
behind the sitter, the sitter renders at the authored mount, and the arms plus
seat rail render in front. This is the accepted proof that future separable
furniture can provide real occlusion without baking every character pose into a
full-scene image.

Static decoration is never regenerated per frame. Any procedural variation uses a fixed seed. Actors pass in front of or behind one another by walk depth. The Canvas fills the installed-PWA viewport and must not expose a demo title, scene badge, hotspot icon field, or permanent instruction HUD.

An interactive object baked into a plate may still be used for navigation or inspection, but an object that seats, hides, carries, opens, swings, animates, or changes state must own one or more separate visual layers and authored mounts. A standing actor sprite must never be rotated on the floor to impersonate a lie or seat pose.

The indoor room's fine, warm illustration is the current style reference. The initial outdoor pixel-game plate is a functional layout reference only and must not define future garden rendering.

## Interaction contract

```text
tap clear floor       -> walk there
tap object            -> walk to its socket, then respond
one direct action     -> execute without an extra menu
several valid actions -> show a small object-anchored context menu
tap character         -> approach before personal interaction
tap door              -> approach, crossfade, preserve family state across worlds
drag world            -> inspect freely without moving the actor
pinch world           -> zoom around the fingers; do not scale UI overlays
long-press CG object  -> open its same-origin CG route only when cgPortal is authored
```

Hubby and Naili are actors, not static hotspots. Follow, carry, put-down, shared seating, swing pushing, and related actions use the same world model. Object interaction must never work only because a large invisible screen-fixed rescue target catches the tap. Local action menus must always offer an explicit close control.

Character bodies use two semantic touch zones. The upper body owns speech; the
lower body owns local actions and poses. Mounted characters stay mounted while
their speech or action menu is inspected. A clear-floor tap is the ordinary way
to leave a mount and resume walking. Kitten and Hubby may also sit, lie, stand,
or lean on clear floor through the same authored pose assets.

Speech is data-driven through `speech-runtime.js` rather than one-off timers.
Scripts declare ordered turns, speaker, duration, playback (`manual`, `auto`, or
`hybrid`), and loop policy. Tapping a character can advance or resume its script;
tapping the bubble pauses and hides it without drawing a close icon. Automatic
dialogue preserves consecutive turns by the same speaker and can finish by
removing the bubble. Kitten-authored copy uses the shared vivid peach-pink voice
token while Hubby copy remains dark ink.

Princess carry is one combined two-frame actor state. Hubby owns movement and
camera follow while Kitten stays synchronized to him; their complete combined
sprite mirrors as one unit for travel direction. The carry script may alternate
natural Hubby and Kitten lines while moving. A destination object can end the
carry silently at its approach socket and continue into that object's normal
interaction.

## Current worlds and durable state

The indoor world includes bed, window seat, wardrobe, sofa, tea table, desk, message wall, and the garden door. The outdoor reference world includes the return door, mailbox, tree bench, swing, flower bed, tea table, wishing fountain, firefly pond, vine bower, and a stateful future-expansion gate. A closed garden gate must open before the future route is available.

The wishing fountain unlocks the visible Moonlight Wings. The wardrobe can then equip or store them, and walking while equipped becomes flight. Only controls with corresponding finished visual behavior may be offered; placeholder outfit buttons that do not alter the rendered character are forbidden.

Diary, message-wall, mailbox, wing unlock, and wing-equipped values are device-local. This world introduces no Supabase table, state path, RLS policy, bucket, Storage object, MCP target, or production text write.

## Installed-app and Cat Nest boundary

Cat Nest and Nestward share one root-scoped standalone manifest so same-origin navigation stays within the installed app. The Pebble Jar is the one and only Cat Nest entry into Nestward; no parallel home entry is created.

CG integration is capability-first and assignment-later. Runtime supports a validated same-origin `cgPortal.route` on an authored object, but no general long-press hotspot field is created and current objects do not receive placeholder routes. Rare future objects may opt in deliberately.

## Expansion rule

Future rooms, yards, NPCs, animals, weather, quests, and larger world chunks extend this model. They may replace the present art or topology when deliberately redesigned, but their geometry, hit regions, collisions, sockets, mounts, foreground masks, and stateful layers must again be authored as one coherent world model. Prototype compatibility is never a reason to compromise the formal world.
