# nest-motion-lab / kitten-dynamic-lab

独立动态实验台，用来测试「静态图片 + CSS/网页动态叠层 + 场景转场 + 图片拖动」的组合上限。

## 项目边界

- 不改主猫窝入口。
- 不接主猫窝状态。
- 不写入主猫窝数据。
- 只作为视觉和交互实验区。

当前放在 `kitten_nest_lab` 的 `motion-lab/` 目录内，是因为当前 GitHub 连接工具不能直接创建全新仓库。后续如果单独创建 `nest-motion-lab` 仓库，可以直接迁移这一整个目录。

## MVP 已覆盖

1. 固定比例图片舞台
   - 默认 `707 / 1536`，贴近当前手机竖图测试比例。
   - 也可切换 `9 / 16`、`3 / 4`、`16 / 9`。

2. 每张图的拖动规则配置
   - `static`
   - `pan-x`
   - `pan-y`
   - `pan-xy`
   - 可调最大移动范围。
   - 可 reset 回默认位置。

3. 基础场景转场
   - `soft-fade`
   - `zoom-blur`
   - `warm-mask`
   - 预留并实现 `light-sweep`、`dream-ripple`、`dark-fade` 作为后续测试项。

4. CSS 动态叠层
   - 咖啡热气 `steam`
   - 星光 / 光粒 `sparkles`
   - 暖光脉冲 `warm-light`
   - 雨雾 / 玻璃感 `rain-fog`

5. 本地导入图片
   - 可从手机/电脑选择图片。
   - 可作为新场景加入。
   - 不上传、不写入服务器，只在当前浏览器内临时测试。

## 推荐咖啡角转场

从 `coffee_001_base` 到 `coffee_002_lap_closeup` 推荐：

```txt
zoom-blur + warm-mask
```

感觉像从咖啡角远景轻轻走近，坐到 Alex 腿上，镜头被暖光裹住后进入近景。

## 后续可搬回主猫窝的成熟项

- 某些场景的固定转场 preset。
- 图片 ID + pan mode 配置表。
- 叠层效果组件化。
- 横图 pan-x 的舞台适配规则。
- 近景/远景切换的视觉节奏。
