# Kitten Nest Cloud Project Status

Updated: 2026-06-15

This is the top-level handoff file for the Kitten Nest Cloud project. New construction windows should read this file first, then read the detailed discipline docs in `docs/` and the machine-readable registries in `data/`.

Private write keys and service credentials must never be committed to this repository. Repository docs should only use placeholders such as `<NEST_TOKEN>`, `<SUPABASE_URL>`, and `<SUPABASE_SERVICE_KEY>`.

---

## 1. Stable entry points

Repository:

```text
vicky81wu-ai/kitten_nest_lab
```

Public deployment:

```text
https://kitten-nest-lab.vercel.app
```

Current stable cloud nest entry:

```text
https://kitten-nest-lab.vercel.app/cloud
```

Current writer console:

```text
https://kitten-nest-lab.vercel.app/write
```

Daily rule:

```text
Use /write for publishing text updates.
Use /cloud for checking the live nest.
```

---

## 2. Current promoted baseline

Verified by Vicky on 2026-06-15:

```text
home <-> coffeeCorner works.
coffeeCorner -> push(lapClose) works.
lapClose -> back() returns to coffeeCorner.
lapClose is isolated from parent coffeeCorner hotspots and panels.
coffeeCornerLapCloseBubble queue works from /write to /cloud.
```

Current scene ids:

```text
home          = default home scene
coffeeCorner  = right-dock coffee corner scene
lapClose      = pushed child scene under coffeeCorner
nestAtlas     = future world hub placeholder, not default home
```

Current object-id rule:

```text
Home-owned objects use home.*
Coffee-corner objects use coffeeCorner.*
Nested child scene text surfaces must include scene path + surface type in their write tag.
```

Do not reintroduce `originalHome` as a technical scene id unless doing a dedicated migration/compatibility pass. It may be used only as wording/display note meaning the first/default home.

---

## 3. Clean router and scene manifest rules

Current promoted runtime uses the clean scene router and manifest isolation model:

```text
sceneRouterClean owns navigation only:
- go
- push
- back
- jumpTo

scene manifest owns scene/object relationship:
- currentScene decides allowed objects
- pushed child scene uses only its own objects plus explicit inherits
- parent scene hotspots/panels do not remain active inside a child scene
```

Key runtime files:

```text
assets/scene-router-clean.v1.js
assets/scene-manifest-isolation-test.js
data/scene-manifest.home-name-test.v1.json
```

Despite the historical filename containing `test`, the manifest file now records the promoted home-scene naming model:

```text
sceneId = home
object prefix = home.*
```

Future cleanup may rename this file, but do not rename it during unrelated feature work.

---

## 4. Current active write tags

Use these tags in Alex update packages:

```text
[hubbyNote]                    -> home.hubbyNotePanel
[coffeeCorner]                 -> coffeeCorner.bubble / alexBubbles
[windowWeather]                -> home.windowWeatherDisplay / advice text
[coffeeCornerLapCloseBubble]   -> coffeeCorner.lapCloseBubble.cleanRouter queue
```

Backward-compatible alias:

```text
[coffeeCornerLapClose] -> [coffeeCornerLapCloseBubble]
```

Do not use as canonical tags:

```text
[lapClose]
[lapCloseBubble]
```

They are too generic and do not include the parent scene.

Write-all preset:

```text
写猫窝所有地方
```

must include:

```text
[hubbyNote]
[coffeeCorner]
[windowWeather]
[coffeeCornerLapCloseBubble]
```

Machine-readable registry:

```text
data/write-tag-registry.v1.json
```

Human-readable discipline:

```text
docs/WRITE_TAG_ROUTING.md
```

---

## 5. Current state fields used by active routes

Coffee-corner main bubble queue:

```text
alexBubble
alexBubbles
bubbleIndex
```

Coffee-corner lap-close bubble queue:

```text
coffeeCornerLapCloseBubble
coffeeCornerLapCloseBubbles
coffeeCornerLapCloseBubbleIndex
coffeeCornerLapCloseBubbleUpdatedAt
```

Home window weather:

```text
windowTemp
windowDesc
```

Home notebook:

```text
hubbyNote
hubbyNoteUpdatedAt
hubbyNoteArchive
hubbyNoteHistory
```

Writer console draft workflow:

```text
pendingDrafts
lastPublishedAt
previousPublished
updatedAt
```

---

## 6. Current stable user workflow

Normal operation:

```text
1. Open /write.
2. Paste Alex update package into the top package box.
3. Click 生成草稿.
4. Click 一键发布全部.
5. Open /cloud and verify.
```

Example package:

```text
[coffeeCorner]
早上好，小猫。
咖啡已经热好，毯子也给你留着。

[coffeeCornerLapCloseBubble]
坐稳，小猫。
Stop wriggling in my lap.

[windowWeather]
26°C
Tiny breeze

[hubbyNote]
今天的猫窝稳定封板：home / coffeeCorner / lapClose 路由清楚，坐腿气泡队列也回家了。
```

Expected result:

```text
/write parses every tagged block into drafts.
Publishing updates only the matching state fields.
/cloud shows coffeeCorner bubbles, home weather, home note, and lapClose bubble queue in their own places.
```

---

## 7. Overlay lifecycle discipline

Cold-start overlay drift is classified as:

```text
scene overlay lifecycle / placement readiness
```

Do not repair these one overlay at a time with private timing patches:

```text
coffee steam
home clock hands
photo glow
coffeeCorner lapClose bubble
future overlays
```

Future direction:

```text
scene ready
image loaded / decoded
coverBox ready
state ready
router settled
manifest ownership resolved
=> place all registered overlays for current scene
```

Discipline file:

```text
docs/OVERLAY_LIFECYCLE_RULES.md
```

Current accepted imperfection:

```text
On cold refresh, the lap-close bubble may briefly appear in an old/low position until scene/state/layout reconciliation catches up. This is accepted after validation and must be solved later through unified overlay lifecycle, not a one-off lap bubble patch.
```

---

## 8. Important construction discipline

Read these before new construction:

```text
docs/CONSTRUCTION_RULES.md
docs/WRITE_TAG_ROUTING.md
docs/OVERLAY_LIFECYCLE_RULES.md
docs/CONSTRUCTION_LOG.md
```

No blind binding:

```text
Before binding any hotspot, check object ownership and scene membership.
```

No tag, no write:

```text
Before adding any writable text surface, create its tag route in data/write-tag-registry.v1.json.
```

No child scene leakage:

```text
A pushed child scene must not inherit parent hotspots/panels unless explicitly declared.
```

No casual new APIs:

```text
Vercel Hobby plan has a 12 Serverless Functions limit.
Avoid adding api/*.js wrappers unless consolidating/removing another wrapper.
```

---

## 9. Protected areas

Do not touch casually:

```text
private key handling
/api/state
/api/set-state
/write daily workflow
/cloud promoted route
sceneRouterClean go / push / back behavior
scene manifest isolation
coffeeCorner main bubble queue
coffeeCornerLapCloseBubble queue
home window weather
home hubbyNote
19.8 tattoo hotspot
```

---

## 10. Recommended next order

Do not add a new visible room as the next step.

Recommended order:

```text
1. Keep /cloud and /write stable after the 2026-06-15 promoted baseline.
2. If working on text surfaces, update write-tag-registry first.
3. If working on overlays, follow OVERLAY_LIFECYCLE_RULES instead of local timing patches.
4. If working on new nested scenes, create scene/object cards and manifest entries first.
5. Only then consider new room content.
```
