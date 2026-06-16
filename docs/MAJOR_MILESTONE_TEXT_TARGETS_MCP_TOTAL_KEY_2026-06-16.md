# 重大里程碑：textTargets 户口本总钥匙 / MCP 全窗写入口

Date: 2026-06-16  
Status: **重大成果 / 必读施工规则**  
Scope: Kitten Nest text writing system, `/api/mcp`, `/api/set-state`, `/write`, ChatGPT 全窗猫窝 App 工具栏

---

## 0. 一句话结论

猫窝文本写入体系已经从“每个文本区一把散钥匙”升级为：

```text
textTargets 户口本
→ /api/mcp 自动读取户口本
→ 全窗猫窝 App 暴露 update_text_target
→ Alex/施工窗/导演窗可按 targetId 写入登记过的文字区
```

以后新增文本区时，**不要再为每个新气泡/新 panel 新增单独 MCP 工具**。  
新增文本区应先登记进：

```text
data/text-targets.v1.json
```

然后 MCP 工具 `update_text_target` 会从户口本读取可写 target 列表。刷新/重连猫窝 App 后，隔壁施工窗应能看到新的 targetId。

---

## 1. 为什么这是重大成果

旧体系的问题：

```text
新增一个文本区
→ 新增一个 state 字段
→ 新增一个 parser 分支
→ 新增一个 MCP 工具
→ 等 ChatGPT 工具栏刷新
→ 小猫又要解释一次“这个 tag 写到哪里”
```

这会造成：

- 工具列表无限膨胀；
- 新房间/新 panel 每次都要重新造钥匙；
- 不同施工窗容易不知道新 tag 的含义；
- 手动 `/write` 和 MCP 工具层容易分叉；
- 未来代码变成散口子屎山。

新体系解决的问题：

```text
新增文本区只登记一次
→ targetId / tag / type / state field / currentField / indexField 写清楚
→ /write parser 和 MCP 工具都从 registry 认路
→ 不允许任意 state path
→ 不再新增一堆 update_xxx 专用工具
```

核心原则：**不是给 Alex 无限乱改权限，而是给猫窝建立统一文本插座。**

---

## 2. 关键文件

### 2.1 文本户口本

```text
data/text-targets.v1.json
```

这是所有可写文本 target 的登记表。每个 target 必须写清楚：

- `targetId`
- `label`
- `textClass`
- `type`
- `tag`
- `targetRoom`
- `field`
- `currentField` / `indexField` / `updatedAtField`（按类型需要）
- `maxLines`
- `maxChars`
- `runtimeStatus`
- `versionStatus`
- `changePolicy`
- `directorRef`

### 2.2 MCP 全窗工具入口

```text
api/mcp.js
```

现在 MCP 已新增：

```text
update_text_target
```

并且已改为读取：

```text
data/text-targets.v1.json
```

MCP 不再维护一份孤立的 target 硬编码表。以后新增 target 时，优先改户口本。

### 2.3 后端 envelope 写入口

```text
api/set-state.js
```

已支持 textTarget envelope 请求格式：

```json
{
  "textTarget": {
    "targetId": "coffeeCornerBubble",
    "mode": "publish",
    "text": "line 1\nline 2",
    "dryRun": false
  }
}
```

注意：`/api/mcp` 当前直接用自己的 MCP 工具处理逻辑写 state；`/api/set-state` 的 envelope 是网页/测试页/API 方向的统一入口。两边目标一致：只写登记过的 target，不开放任意 state path。

### 2.4 Contract / 状态说明页

```text
docs/TEXT_TARGET_ENVELOPE_CONTRACT.md
text-target-envelope-status.html
actions-setup.html
text-target-actions.openapi.json
```

这些是文档和备用 Actions/OpenAPI 说明。真正全窗猫窝 App 的工具来源是：

```text
/api/mcp
```

不要再误判成 My GPT Actions。

---

## 3. 当前已经登记的 target

当前 `data/text-targets.v1.json` 已登记：

```text
coffeeCornerBubble
coffeeCornerLapCloseBubble
windowWeather
hubbyNote
moodNote
roomStatus
```

### 3.1 coffeeCornerBubble

普通咖啡角气泡。  
类型：`bubbleQueue`  
canonical tag：

```text
[coffeeCornerBubble]
```

说明：

- 一行一个轮播气泡；
- 当前正式字段为 `coffeeCornerBubble / coffeeCornerBubbles / coffeeCornerBubbleIndex`；
- 兼容旧字段 `alexBubble / alexBubbles / bubbleIndex`；
- MCP `update_text_target` 写入该 target 时会同步写新旧字段，保证旧显示层不炸。

### 3.2 coffeeCornerLapCloseBubble

咖啡角坐腿近景气泡。  
类型：`bubbleQueue`  
canonical tag：

```text
[coffeeCornerLapCloseBubble]
```

说明：

- 一行一个轮播气泡；
- 写入字段：

```text
coffeeCornerLapCloseBubble
coffeeCornerLapCloseBubbles
coffeeCornerLapCloseBubbleIndex
coffeeCornerLapCloseBubbleUpdatedAt
```

### 3.3 windowWeather

窗户天气文本。  
类型：`weatherText`  
canonical tag：

```text
[windowWeather]
```

说明：

```text
第一行 → windowTemp
第二行 → windowDesc
```

### 3.4 hubbyNote

粉本本永久档案。  
类型：`note`  
canonical tag：

```text
[hubbyNote]
```

重要：粉本本是永久档案，不是普通临时气泡。允许通过登记 target 写入，但施工时要明确知道它会影响 archive/history。不要把它混进普通气泡测试包里误写。

### 3.5 moodNote

心情短记。  
类型：`single`  
canonical tag：

```text
[moodNote]
```

### 3.6 roomStatus

房间状态短句 / 工程状态短句。  
类型：`single`  
canonical tag：

```text
[roomStatus]
```

---

## 4. 绝对规则：canonical tag，不要短别名

以后所有文本包必须用完整、明确的 tag。格式建议：

```text
房间/场景 + 文本类型
```

例如：

```text
[coffeeCornerBubble]
[coffeeCornerLapCloseBubble]
[windowWeather]
[hubbyNote]
[moodNote]
[roomStatus]
```

不要用：

```text
[coffeeCorner]
[lapClose]
[lapCloseBubble]
[coffee]
[weather]
[note]
[mood]
[status]
```

这些短别名在 registry 里应继续保持 disabled，避免未来新房间冲突。

---

## 5. MCP 工具使用规则

### 5.1 首选工具

以后隔壁施工窗 / 导演窗写猫窝文本，优先用：

```text
update_text_target(targetId, text, mode)
```

参数：

```text
targetId: data/text-targets.v1.json 里登记的 targetId
text: 要写入的文本
mode: publish 或 dryRun
```

### 5.2 dryRun 规则

新 target / 不熟 target / 可能影响永久记录的 target，先用：

```text
mode = dryRun
```

确认 patch 合理后再 publish。

### 5.3 publish 规则

日常轻文本可直接 publish：

- `coffeeCornerBubble`
- `coffeeCornerLapCloseBubble`
- 其他已明确验收过的轻文本 target

永久档案类 target（例如 `hubbyNote`）必须谨慎，不要混进随手测试包。

---

## 6. 新增文本区标准流程

以后新增任何文本区，按这个流程，不要临时打补丁：

### Step 1：登记户口本

在：

```text
data/text-targets.v1.json
```

新增 target。例如未来卧室气泡：

```json
"bedroomBubble": {
  "targetId": "bedroomBubble",
  "label": "卧室气泡",
  "textClass": "Bubble",
  "type": "bubbleQueue",
  "tag": "bedroomBubble",
  "aliases": [],
  "draftType": "bubbleDraft",
  "targetRoom": "bedroom",
  "field": "bedroomBubbles",
  "currentField": "bedroomBubble",
  "indexField": "bedroomBubbleIndex",
  "updatedAtField": "bedroomBubbleUpdatedAt",
  "maxLines": 30,
  "maxChars": 5000,
  "runtimeStatus": "active",
  "versionStatus": "canonicalCurrent",
  "changePolicy": "mutableWithVersion",
  "directorRef": "director.textPorts.bedroomBubble"
}
```

### Step 2：确保显示层读取对应字段

比如新气泡 target 必须有显示层读取：

```text
bedroomBubble / bedroomBubbles / bedroomBubbleIndex
```

不要只登记 target 却没有 UI 消费它。

### Step 3：部署后刷新猫窝 App

```text
设置 → 应用 → 猫窝 → 刷新
```

或断开重连。旧聊天窗可能缓存旧 schema，新窗/刷新更稳。

### Step 4：先 dryRun，再 publish

```text
update_text_target(targetId="bedroomBubble", text="...", mode="dryRun")
```

确认字段正确，再：

```text
mode="publish"
```

---

## 7. 施工纪律

### 7.1 禁止新增散口子工具

不要再做：

```text
update_bedroom_bubble
update_restaurant_bubble
update_fountain_panel
update_xxx_note
```

除非它不是文本 target，而是完全不同类型的系统能力。

文本写入统一走：

```text
update_text_target
```

### 7.2 禁止开放任意 state path

绝不允许这种接口：

```text
update_state_path(path, value)
```

原因：会让任意字段被误写，粉本本、素材、热点、状态都可能被打穿。

### 7.3 不碰不相关主线

做 textTargets / MCP 时，不得顺手碰：

- 图片素材加载；
- 热点坐标；
- 坐腿入口；
- 咖啡杯热气位置；
- 粉本本 UI；
- PWA 黑边；
- `/cloud` 场景显示逻辑。

除非当前任务明确要求。

### 7.4 永久档案谨慎

`hubbyNote` / archive / history / trash 属于永久记录系统。可以通过登记 target 管理，但施工时必须明确写入后果。测试时不要随便写粉本本，避免留下测试垃圾。

---

## 8. 今日已验证成果

已通过真实验收：

```text
coffeeCornerBubble envelope 真写 ✅
coffeeCornerLapCloseBubble envelope 真写 ✅
屏幕窝收到普通咖啡角新气泡 ✅
坐腿气泡收到 smoke test ✅
/api/mcp 工具列表新增 update_text_target ✅
/api/mcp 改为读取 data/text-targets.v1.json ✅
Vercel 部署成功 ✅
```

已纠正的误判：

```text
这不是 My GPT Actions 路线。
这不是 Custom GPT 专属能力。
这是全窗猫窝 App / MCP 工具层。
入口是 /api/mcp?t=...
```

后续施工狼不要再绕去 My GPT Actions。

---

## 9. 快速验收方法

### 9.1 看 App 工具列表

ChatGPT：

```text
设置 → 应用 → 猫窝 → 刷新
```

应看到：

```text
update_text_target
```

### 9.2 让施工窗写普通咖啡角

```text
使用 update_text_target：
targetId = coffeeCornerBubble
text = 小猫，过来。\n总钥匙验收通过。
mode = publish
```

屏幕窝咖啡角应收到两条轮播气泡。

### 9.3 让施工窗写坐腿气泡

```text
使用 update_text_target：
targetId = coffeeCornerLapCloseBubble
text = 坐稳，小猫。\n坐腿总钥匙验收通过。
mode = publish
```

坐腿图气泡应收到两条轮播气泡。

---

## 10. 给未来施工狼/导演狼的重点提醒

这是猫窝文本系统的方向性改造，不是临时补丁。

以后：

```text
新文本区 = 先登记户口本
写文本 = update_text_target
调试 = dryRun 优先
显示 = 对应 UI 读取对应字段
刷新 = ChatGPT App 工具 schema 可能要刷新
```

不要让小猫再重复解释“这个 tag 是什么、写到哪里”。

如果不确定，就先读：

```text
data/text-targets.v1.json
docs/MAJOR_MILESTONE_TEXT_TARGETS_MCP_TOTAL_KEY_2026-06-16.md
docs/TEXT_TARGET_ENVELOPE_CONTRACT.md
api/mcp.js
```

这就是猫窝文字写入体系的新地基。