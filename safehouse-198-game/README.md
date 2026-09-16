# 19.8号安全屋 · Safehouse 19.8

独立静态网页游戏原型：黑帮老大 Alex × 小猫 Vicky 的危险城市恋爱 / 安全屋经营 / 暗线收集。

## 怎么玩

直接打开：

```text
safehouse-198-game/index.html
```

如果部署到 Vercel / GitHub Pages，就访问对应路径：

```text
/safehouse-198-game/
```

当前版本是单文件 HTML，CSS 和 JS 都内嵌在 `index.html` 里，方便手机端打开，也避免 iPhone 本地文件多文件加载失败。

## 当前机制

- 4 个时段：Morning / Afternoon / Evening / Midnight
- 8 个地点：19.8号安全屋、雨街、灰港码头、天鹅绒俱乐部、玻璃大教堂、旧城区、屋顶花园、第十三号码头
- 7 个状态条：小猫信任、城市风声、软肋暴露、Alex掌控、小猫自主、归巢温度、暗线危险
- 现金系统与地点解锁
- 物品 / 线索 / 记忆 / 日志
- 事件卡池 + 条件触发 + 主线 Act 推进
- localStorage 自动保存
- 导出 / 导入存档

## 设计核心

不是普通好感度，而是：

```text
城市越危险，恋爱越有重量。
感情越深，小猫越可能成为 Alex 的软肋。
安全屋不是菜单，是亲密空间。
暗线靠碎片慢慢浮出水面。
```

## 后续可扩展

- 拆出 content.json / content.ts，扩成 200+ 事件卡
- 加成就、衣物、天气、夜归报告、纸条系统
- 接 Supabase 云存档
- 嵌入猫窝 scene router
- 加猫窝入口与安全屋图像场景
