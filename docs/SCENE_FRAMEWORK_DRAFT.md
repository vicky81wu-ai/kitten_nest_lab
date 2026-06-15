# Scene Framework Draft

This is a planning document, not runtime code.

Do not connect this directly to `/cloud` until the framework is tested in a separate harness.

## Naming baseline

```text
originalHome = current first homepage / nest origin
nestAtlas    = future big-world entrance / map of hubs
```

`originalHome` is the current beautiful default entry scene. It should remain the first opened scene unless explicitly changed later.

`nestAtlas` is not a specific world. It is the big-world map / hub selector.

## Current existing branch stays where it is

Do not move the existing branch under `nestAtlas` yet.

Current branch:

```text
originalHome
  rightDock -> go(coffeeCorner)

coffeeCorner
  leftDock  -> go(originalHome)
  lapHot    -> push(lapClose)

lapClose
  leftDock  -> back()
```

Meaning:

- Existing originalHome / coffeeCorner / lapClose stay as the current side branch.
- Future hubs go under `nestAtlas`.
- If existing scenes are later migrated into a hub, do it through config, not by rewriting the router.

## Future top-level hubs under nestAtlas

```text
nestAtlas
  dreamHub
  lifeHub
  privateHub
  storyHub
  nestCity
  futureHub
```

### dreamHub / 梦境区

For experimental scene groups or standalone images.

Examples of future styles:

```text
newspaper style
illustration style
2D scenes
strange dream logic
visual experiments
```

### lifeHub / 日常区

For daily life, dates, and main relationship story groups.

This is not the current coffeeCorner branch yet. The current existing branch stays connected directly from originalHome until a future migration is explicitly planned.

### privateHub / 私密区

For management, records, memory-related spaces, notebook/archive views, and personal nest areas.

This hub is for private/internal nest functions and should not be treated as a visitor-facing story area.

### storyHub / 故事区

Former draft name: `roleplayHub`.

Final current name: `storyHub` / 故事区.

For playful roleplay or story-like scene groups that are not the daily-life mainline.

Examples:

```text
sports roleplay
doctor roleplay
one-off playful scripts
non-mainline character setups
```

### nestCity / 猫窝城

For buildable, explorable, object-rich fantasy nest-world scenes.

This is not the same as `nestAtlas`.

```text
nestAtlas = map / selector / big-world entrance
nestCity  = actual explorable constructed nest city
```

Possible future content:

```text
secret garden
magic stone entrance
love stone
restaurant
newspaper stand
camera area
interactive vendors
object-triggered panels and bubbles
```

`nestCity` should not become the main relationship story entrance. Main relationship story groups belong more naturally in `lifeHub`.

### futureHub / 未定区

Reserved hub for future use.

Internal structural name:

```text
futureHub
```

Display name can be adjusted later.

## Dock action model

Bottom left/right hotspots are fixed positions, not fixed meanings.

Use scene-configured dock actions:

```text
leftDock
action decided by current scene

rightDock
action decided by current scene
```

Action types:

```text
go(target)      direct move / same-level move / cross-map move; does not necessarily push stack
push(target)    enter a deeper nested scene; pushes current scene to stack
back()          pop one pushed scene
jumpTo(anchor)  navigation panel jump to a major anchor
openPanel()     open top-right navigation panel
```

Important:

```text
leftDock is not always back.
rightDock is not always forward.
```

Example:

```text
originalHome.leftDock  = go(nestAtlas)
originalHome.rightDock = go(coffeeCorner)
coffeeCorner.leftDock  = go(originalHome)
coffeeCorner.lapHot    = push(lapClose)
lapClose.leftDock      = back()
```

## Navigation panel draft

Top-right navigation panel should be a rescue/navigation tool, not a full breadcrumb system at first.

Do not include `previousScene` as a panel item because ordinary previous-scene behavior belongs to leftDock/back.

First panel anchors:

```text
go originalHome
go nestAtlas
jump current first-level hub root, when applicable
jump current sceneGroup root, when applicable
```

If the world becomes more complex later, the panel can expose:

```text
first-level root
second-level root
current group root
```

Breadcrumb UI is optional and should not be built before the registry is stable.

## Scene card minimum shape

Each real scene should eventually have a card.

Minimum fields:

```text
id
displayName
type: scene / hub / group / placeholder
group
assetKey
dockActions
hotspots
lifecycle
status
directorNote
```

Avoid early extra classifications such as:

```text
usageTier
homePinned
alexOnly / kittenOnly
primaryAccess
```

If homepage shortcuts are needed later, create a separate `homeQuickLinks` config instead of bloating scene cards.

## Asset rule

Scenes should refer to an `assetKey`, not a hard-coded URL.

```text
scene -> assetKey -> URL / Supabase object / GitHub fallback / local override
```

Changing a picture should be treated as an asset-layer change, not a router change.

A future asset admin should support:

```text
upload new image
choose assetKey / scene
auto bump version
preview
set as current asset
```

## Lifecycle rule

Scene effects must belong to scene lifecycle, not scattered click patches.

Lifecycle hooks:

```text
onLeave(oldScene)
onEnter(newScene)
afterEnter(newScene)
transitionLock owned by sceneRouter
```

Effects such as steam, bubble, photoGlow, and transient overlays should be restored or hidden through lifecycle hooks.

Do not rely on random clicks to restore effects.

## Current lap test conclusion

The lap visual flow is viable, but it should not be reconnected to main `/cloud` through the clean controller as-is.

Useful findings:

```text
stable fade/crossfade is safer than zoom/blur/scale
lap image asset is not the root problem
navigation ownership is the root problem
steam/bubble recovery belongs to lifecycle hooks
```

Decision:

```text
Stop patching lap with v6-style guards.
Build sceneRouter / sceneStack test line first.
```
