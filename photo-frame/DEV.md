# Photo Frame — 开发文档

给照片加一条带拍摄参数的边框（相机、镜头、焦段、光圈、快门、ISO、日期，可选后期参数），**原图分辨率导出**，全部在浏览器本地完成，不上传。主要面向 **iPhone Safari**，桌面浏览器也可用。支持中英双语。

入口：主页 `index.html` 的 "Photo Frame" 卡片 → `photo-frame/index.html`

---

## 1. 文件结构

```
photo-frame/
├── index.html            页面结构 + 全部 CSS（独立的"相机说明书 / 瑞士平面"风格：白底黑字、直角、1.5px 黑线、徕卡红点缀；不依赖站内其他样式）
├── DEV.md                本文档
└── js/
    ├── app.js            UI 状态、加载、预览、分块导出、分享/下载
    ├── metadata.js       解析 EXIF / XMP / ICC（JPEG、HEIC/HEIF/AVIF、PNG、WebP、TIFF）
    ├── format.js         把原始 EXIF 变成显示用文字；读取 Lightroom (crs:) 后期参数
    ├── layout.js         边框版式计算 + 绘制（预览和导出共用）
    ├── jpeg-encoder.js   流式 baseline JPEG 编码器（4:4:4）
    ├── encoder-worker.js 在 Web Worker 里跑编码器
    ├── exif-writer.js    生成导出文件的 EXIF(APP1) 和 ICC(APP2) 段
    └── i18n.js           中英文案；语言也决定边框上后期参数的标签语言
```

零依赖、零构建：原生 ES Module，直接部署静态文件即可（GitHub Pages 可用）。没有任何外部请求（字体用系统自带的 Helvetica / 苹方）。

## 2. 本地运行

ES Module 和 Worker 不能在 `file://` 下运行，需要起一个本地服务器：

```bash
cd /Users/intern1/Movies/personal-webpage && python3 -m http.server 8000
```

然后打开 <http://localhost:8000/photo-frame/>。

**在 iPhone 上测试**：手机和电脑连同一个 Wi-Fi，用 `python3 -m http.server 8000 --bind 0.0.0.0` 启动，手机 Safari 访问 `http://<电脑局域网IP>:8000/photo-frame/`。注意：非 HTTPS 页面上 `navigator.share` 不可用，「存储 / 分享」按钮会退化为下载；要测分享面板请部署到正式站点（HTTPS）再测。

## 3. 处理流程

```
选图 (<input type=file accept="image/*">)
  │
  ├─ file.arrayBuffer() → metadata.readMetadata()     读 EXIF / XMP / ICC / JPEG 帧尺寸
  │                        format.detectFields()        生成各字段默认文字
  │                        format.xmpAdjustments()      读 Lightroom 调整参数
  │
  ├─ <img> 解码（浏览器自动应用 EXIF 方向，naturalWidth/Height 已是正向尺寸）
  │    └─ 缩小一份 ≤2400px 的预览源图，缓存起来
  │
  ├─ 预览：layout.computeLayout() → layout.drawFrame(scale<1) 画到 #preview
  │        （每次修改参数都用 requestAnimationFrame 合并重绘）
  │
  └─ 导出（点击「生成图片」）
       computeLayout() 按原尺寸算版式
       exif-writer 生成 APP1/APP2 段
       逐条带（strip）：每条带再按 ≤4096px 宽切成若干块（tile）
         drawFrame(scale=1) → getImageData → 拼成整行 RGBA
         → postMessage 给 Worker → JpegEncoder.addRows()
         （Worker 编码第 N 条带的同时，主线程渲染第 N+1 条带）
       finish() → Blob → 「存储 / 分享」(navigator.share) 或「下载」
```

## 4. 关键设计决策

### 4.1 为什么自己写 JPEG 编码器（保持原图清晰度的核心）

iOS Safari 单个 canvas 的面积上限约 **1670 万像素**（4096×4096）。一张 2400 万像素的相机照片，或 iPhone 4800 万像素的原图，再加上边框，都放不进一个 canvas，所以 `canvas.toBlob()` 只能缩小输出。

解决办法是把输出图按条带、分块渲染，每块 ≤400 万像素（`TILE_MAX_PIXELS`），远低于上限，内存也更安全。再用流式编码器逐条带写成**一个完整的原尺寸 JPEG**。

- 编码器是标准 baseline JPEG：AAN 快速 DCT、Annex K 标准量化表和霍夫曼表
- **4:4:4 色度，不做色度下采样**，文字边缘和细节更锐利（`canvas.toBlob` 默认是 4:2:0）
- 条带高度必须是 8 的倍数（最后一条除外），边缘块用复制最后一行/列的方式填充
- 画质选项：标准 90 / 高 95（默认）/ 最高 100

### 4.2 照片像素 1:1 拷贝

导出时 `drawFrame` 在 scale=1 下，照片的目标矩形是整数坐标、尺寸等于源图尺寸，`drawImage` 做的是 1:1 拷贝，**没有任何重采样**。唯一的画质损失来自最终的 JPEG 编码。

### 4.3 色彩空间（广色域）

- 源图 ICC 描述里含 "P3"（iPhone 照片、索尼等机身的 P3 模式）→ canvas 用 `colorSpace: 'display-p3'`，导出时**原样嵌入源图的 ICC 配置文件**，不会把 P3 压缩成 sRGB
- 源图是 sRGB → 按 sRGB 处理，同样嵌入原 ICC
- 其他配置文件（Adobe RGB、ProPhoto 等）→ 浏览器绘制时会转换成 sRGB，导出不嵌入 ICC（默认就是 sRGB），颜色正确但会损失色域

ICC 来源：JPEG 读 APP2 `ICC_PROFILE`，HEIC/AVIF 读 `colr` 盒子，WebP 读 `ICCP` 块。PNG 的 `iCCP` 是压缩的，没有解析，PNG 一律按 sRGB 处理。

### 4.4 EXIF 写入策略（隐私）

`exif-writer.js` 按**白名单**把原图的拍摄参数逐个标签原样复制（沿用原文件的字节序，值的字节直接拷贝，不做数值换算），然后：

- Orientation 强制设为 1（像素已经是正向的）
- PixelXDimension / PixelYDimension 改成新尺寸
- **删除**：GPS 位置、机身/镜头序列号、MakerNote 厂商私有数据、缩略图（IFD1）

用户可以关掉「保留拍摄参数」，这样导出文件里就完全没有 EXIF。

### 4.5 版式：所有尺寸按 u = √(宽×高) 计算

字号、边距、底栏高度都是 `u` 的固定比例（见 `layout.js` 顶部的 `M` 常量）。用几何平均值而不是宽度来计算，是为了让各种画幅都协调：

| 情况 | 处理 |
|---|---|
| 竖幅 / 横幅 / 方图 | 按 u 计算，视觉比例一致 |
| 全景（如 12000×2000） | u 按面积计算，文字不会被宽度撑得过大 |
| 窄长图（如 600×6000，长截图） | 左右两栏放不下时，自动改成居中堆叠 |
| 参数行或镜头名太长 | **换行**，不截断数字；单项本身比整行还宽时（如超长镜头名）按单词再拆行 |
| 相机名太长 | 先缩小到 70%，仍放不下才加 "…" 截断（最后手段） |
| 超小图（u < 1000px，如 320×240） | 整体放大到 u=1000，保证文字清晰，界面上会提示已放大 |
| 没有任何文字 | 只留一条细边 |

因为版式完全按比例计算，**小预览和原尺寸导出是严格等比的**。

两种版式：`bar` 底栏（左边相机+镜头，右边参数+日期）、`center` 底栏居中。另有独立开关 `framed`「相框包裹照片」（默认开启）：开启后照片四周加一圈白边（宽 0.035u），底栏文字左右对齐照片边缘；两种版式都能配合相框使用。边框固定为白色（`layout.js` 的 `PALETTE`）。

### 4.6 相机名美化（`format.js`）

- 厂商名规范化：`NIKON CORPORATION` → Nikon，`SONY` → Sony，`FUJIFILM` → Fujifilm
- 去掉型号里重复的厂商名：`Canon` + `Canon EOS R5` → Canon EOS R5
- Sony：`ILCE-7M5` → α7 V，`ILCE-7RM5` → α7R V，`ILCE-6400` → α6400
- Nikon：`Z 6_2` → Z 6II
- Apple / Google 只显示型号（iPhone 15 Pro），并去掉镜头名开头重复的机型
- 焦段默认显示 35mm 等效值；如果实际焦段和等效焦段不同（手机、APS-C），会出现切换开关

所有字段都可以手动修改，也可以单独隐藏。

### 4.7 后期参数

自动读取 Lightroom / Camera Raw 写在 XMP 里的 `crs:` 参数（曝光、对比度、高光、阴影、白色/黑色色阶、色温/色调、纹理、清晰度、去朦胧、自然饱和度/饱和度、锐化、降噪、暗角、颗粒）。

- 值为 0 的项不显示
- 色温/色调只在白平衡不是「原照设置」(As Shot) 时显示
- **iPhone 相册里的编辑不会写进导出文件**，这是系统本身的限制，只能让用户手动添加（有预设标签菜单，也可以自定义）

## 5. 测试记录

测试环境是 Claude 内置浏览器（Chromium 内核）+ macOS ImageIO / Pillow 核对导出文件。**还没有在 iPhone 真机 Safari 上跑过**，见第 6 节。

| 用例 | 尺寸 | 结果 |
|---|---|---|
| 真实照片 DSC00135.jpg（Sony α7 V，P3） | 3395×4672 | 参数全部读对；输出 3395×5127；照片区 PSNR 51.1 dB；4:4:4；P3 ICC 保留；EXIF 保留且尺寸已更新；导出 0.8 秒 |
| iPhone 4800 万像素 + Orientation=6 + GPS | 8064×6048 → 显示为 6048×8064 | 方向正确；横向 2 块拼接，接缝处无误差（50.4 dB）；GPS 和序列号已删除；约 2 秒 |
| 全景 Fujifilm | 12000×2000 | 横向 3 块拼接无接缝；版式协调 |
| 方图 Nikon + Lightroom XMP | 3000×3000 | 读出 10 项后期参数；Z 6_2 → Z 6II；-0.7EV |
| 长截图 PNG（无 EXIF） | 1179×5000 | 显示「没有相机信息」提示，可手动填写 |
| 超小图 Canon | 320×240 | 放大到 1155×866 并提示 |
| 极窄图 + 超长镜头名 | 600×6000 | 自动改为居中堆叠，参数和镜头名换行，无截断 |
| WebP Sony α6400 | 2400×1600 | EXIF 读取正常；0.4s 快门格式正确 |
| HEIC（真实 Sony 照片转换） | — | EXIF 和 P3 ICC 解析正常；Chromium 无法解码 HEIC，会正确提示「请用 Safari」 |
| 画质 100 | 4800 万像素 | 可正常解码，PSNR 55.1 dB，20 MB |
| 尺寸 2048 | — | 照片长边缩到 2048 |
| 中英切换 | — | 界面和边框上的后期参数标签都会切换 |

复现测试的方法：用 Pillow 生成不同尺寸、带 EXIF 的测试图，在页面里通过 `DataTransfer` 把文件塞进 `#fileInput`，导出后把 blob POST 到本地的一个小服务器存盘，再用 `sips` 和 Pillow/numpy 核对尺寸、EXIF 和 PSNR。

## 6. 需要在 iPhone 真机上确认的事项

这些只能在真机 Safari 上验证：

1. **从相册选图时 EXIF 是否保留**：iOS 选图时可能把 HEIC 转成 JPEG。一般会保留拍摄参数，但位置信息取决于选图面板里「选项」的设置
2. **HEIC 解码**：Safari 17+ 支持，旧版本需要实测
3. **4800 万像素原图的内存表现**：解码后的源图约 190 MB，加上分块画布一般没问题，但旧机型（4GB 内存）需要确认不会刷新页面
4. **「存储 / 分享」**：需要 HTTPS；点击后应该弹出系统分享面板，其中有「存储图像」选项
5. **无痕浏览**：Safari 17+ 在无痕模式下会给 canvas 读回的像素加入少量防指纹噪声，导出图可能有极轻微的差异。普通模式不受影响
6. **P3 显示**：在 P3 屏幕上对比原图和导出图，颜色应该一致

## 7. 已知限制

- 输出格式固定为 JPEG（不做 HEIC/PNG 导出）；JPEG 最大尺寸 65535px，超过会报错
- 不能解码 RAW（DNG/ARW/NEF 等）：浏览器本身不支持。元数据可以解析，但画面无法显示
- PNG 的 ICC 没有解析，一律按 sRGB 处理
- 「尺寸 4096 / 2048」指的是照片部分的长边，不含边框
- 不做图像调整：后期参数只是印在边框上的文字，不会真的改变照片

## 8. 常见修改

- **加一个显示字段**：`format.js` 的 `FIELDS` / `detectFields()`，`app.js` 的 `FIELD_LABEL` / `FIELD_PLACEHOLDER`，`i18n.js` 两种语言都加标签；如果属于参数行，还要加进 `EXPOSURE_FIELDS`
- **加一种语言**：在 `i18n.js` 的 `STRINGS` 里加一份，并调整 `langBtn` 的切换逻辑（目前是中英二选一）
- **调整字号、边距**：只改 `layout.js` 里的 `M` 常量（都是 u 的比例）
- **加一种版式**：在 `computeLayout()` 里加分支，并在 `index.html` 的 `data-bind="layout"` 里加按钮和对应文案
- **新增可复制的 EXIF 标签**：加进 `exif-writer.js` 的 `IFD0_TAGS` / `EXIF_TAGS` 白名单
