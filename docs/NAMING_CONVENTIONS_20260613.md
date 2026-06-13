# Naming Conventions - 2026-06-13

## Core rule

One technical object should have one canonical ID.

User-facing names may repeat across scenes, but technical IDs must be scene-scoped unless the feature is truly global management.

```text
Good:
home.pinkNotebook.hotspot
home.pinkNotebook.panel
beach.pinkNotebook.hotspot
beach.pinkNotebook.panel
admin.materialPanel

Bad:
pinkNotebook
pinkNotebook
pinkNotebook
```

## Name layers

A single thing may have several name layers. They are not the same job.

```text
canonical ID     = unique technical identity in registry/config
roomId           = where it belongs
selector/class   = DOM hook used by code
owner/controller = code module that manages it
displayName      = name shown to Vicky
moduleName       = feature/system name
directorRef      = pointer to director guide
```

Example:

```text
canonical ID: home.hubbyNoteHot
roomId: home
selector: .hubbyNoteButton
owner: hubbyNoteController
displayName: 粉本本
moduleName: hubbyNote
directorRef: director.notebooks.hubbyNote
```

## Hubby note / 粉本本 rule

`hubbyNote` is the feature/module name.

It owns the saving/archive/editing logic for the current home notebook feature.

`粉本本` is a user-facing display name.

Current mapping:

```text
home.hubbyNoteHot = physical powder notebook hotspot on home
home.hubbyNotePanel = archive-first notebook panel opened by the home powder notebook
coffeeCorner = no physical powder notebook currently
```

The current powder notebook panel is home-scoped, not shared. It is only opened by the home powder notebook.

Future scene notebooks should get their own scene-scoped IDs unless Vicky explicitly approves a shared archive.

Do not mass-rename runtime state fields such as:

```text
hubbyNote
hubbyNoteArchive
hubbyNoteHistory
hubbyNoteTrash
```

These are existing state keys. Rename only through a deliberate migration, not during visual/layout cleanup.

## When to rename

Do rename when:

```text
A new object is added.
A selector or owner is ambiguous.
A registry ID does not include its room/scene context.
A future scene reuses a user-facing object name.
```

Do not rename when:

```text
The name is an internal module/state key that already works.
The rename would touch runtime state, saved data, or multiple controllers.
The only issue is that the user-facing name and module name are different.
```

## Recommended ID pattern

Use:

```text
sceneId.objectName.kind
```

Examples:

```text
home.pinkNotebook.hotspot
home.pinkNotebook.panel
coffeeCorner.photoWall.hotspot
beach.pinkNotebook.hotspot
beach.pinkNotebook.panel
admin.materialPanel
```

The current registry still has some legacy-style IDs such as:

```text
home.hubbyNoteHot
home.hubbyNotePanel
```

These are acceptable for now because they are home-scoped and working.

Future additions should prefer the cleaner pattern above.

## Display-name reuse

It is okay for multiple scene objects to have the same displayName:

```text
粉本本
```

But their canonical IDs must remain different:

```text
home.pinkNotebook.hotspot
beach.pinkNotebook.hotspot
```

Short rule:

```text
小猫看到的名字可以可爱重复；代码户口本里的身份证必须唯一带场景。只有真正全局管理功能才用 admin/global/shared 之类的范围名。
```
