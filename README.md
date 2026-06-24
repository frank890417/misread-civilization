# 誤讀文明 Misread Civilization — 互動參考預覽

> 共域座標 POST-TRIBE AR · three.js + Tone.js reference build
> 不是最終 AR 檔，而是給製作團隊理解「漂浮石陣 / 點擊互動 / 音效觸發 / 文字呈現 / 網站整合」的可執行參考版，並附上可直接拿去用的素材（GLB 模型、分軌音效、字型/字卡）。

- 線上版：<https://frank890417.github.io/misread-civilization/>
- Repo：<https://github.com/frank890417/misread-civilization>

---

## 三個頁面

| 頁面 | 用途 |
|---|---|
| `index.html` | 主互動預覽（漂浮石陣 + 點擊 + 即時 Tone.js 聲音 + 畫質切換） |
| `audio-stems.html` | 聲音分軌**試聽頁**（直接播 `assets/audio/stems/` 的 34 軌 MP3） |
| `audio-export.html` | 聲音**離線渲染器**（Tone.Offline → MP3，團隊想改音色可自行重出） |

本機看：`python3 -m http.server 8123 --bind 127.0.0.1` → 開 <http://127.0.0.1:8123>（或 double-click `serve.command`）。

**操作**：拖曳環視、滾輪縮放、點石頭（無重力推 + 發光 + 該物件音色 + 誤讀字幕）。首次點擊解鎖瀏覽器 AudioContext，聲音才開始。石頭會自己慢慢飄入/飄出。底部可切「畫質：高清 ⇄ 輕量」、聲音、石陣/散佈、觸發共鳴。

---

## 專案結構

```text
.
├── index.html            # 主互動預覽 + UI + importmap
├── audio-stems.html      # 34 軌分軌試聽頁
├── audio-export.html     # Tone.Offline 離線渲染器（產 MP3）
├── css/styles.css        # 介面 / HUD 樣式
├── js/
│   ├── main.js           # 啟動 + 按鈕事件 + 模組接線
│   ├── scene.js          # three.js 場景、GLB 載入、互動、石頭進出、畫質切換
│   ├── sound.js          # Tone.js 即時聲音系統
│   └── models.js         # 29 顆模型資料（音色 / 音高 / 誤讀字幕）
├── assets/
│   ├── glb/              # 高清 GLB（29 顆，~203MB，meshopt + WebP 1024）
│   ├── glb-lite/         # 輕量 GLB（29 顆，合計 4.52MB，draco + WebP，每顆 <0.2MB）
│   ├── hdri/sky.png      # HDRI sky sphere / environment
│   ├── audio/stems/      # 34 軌分軌 MP3 + _對應表.md
│   └── text/             # 誤讀字幕文字方案素材（子集字型 + PNG 字卡 + 說明）
└── serve.command         # macOS 本機預覽快捷
```

單檔 `index.html` 已拆成 CSS / 3D / 聲音 / 資料四塊，方便團隊接手或只拿其中一部分整合。

---

## 互動設計

### ① 分層渲染 + 畫質切換
- 近景：可點擊的 3D 漂浮石。遠景：`assets/hdri/sky.png` 當 equirect sky sphere + 環境光。
- 石頭材質壓成霧面（`roughness 0.97`、低 `envMapIntensity`），避免太亮/太塑膠。
- **畫質切換**（底部「畫質」鈕）：高清 `assets/glb`（meshopt 幾何 + 1024 WebP）⇄ 輕量 `assets/glb-lite`（draco 幾何 + 1024 WebP，29 顆共 **4.52MB**）。兩種各自快取、即時重建族群。給活動網站/手機/低頻寬可用輕量版。

### ② 動態族群（石頭飄入/飄出）
- 29 顆 GLB。開場先載 12 種、clone 成約 22 顆。場上維持 18–28 顆。
- 每隔數秒隨機一顆飄出去、一顆從場外飄進來（淡入淡出）。未載過的種類進場時 lazy-load。

### ③ 點擊互動
無重力推位移 + 自轉 + 縮放脈衝 + 暖色發光 + 誤讀字幕 + 對應物件音色；**小石頭**額外觸發快速「碎碎」音粒；累積觸碰達閾值 → **共鳴**彩蛋（全體脈衝 + 環境變色）。

### ④ 聲音系統（`js/sound.js`，即時 Tone.js）
- D Dorian 中古教堂和聲床：ADSR pad + 開五度 organum 低音 + **人聲合唱** + **聖詠旋律**（動機 2-4-6-6-[7]-6-5-6，凸顯第 6 音 B 的教堂感）。
- **glitch 人聲扭曲**（呼應「AI 誤讀我們」）+ 偶現鐘聲 + 每物件不同音色 + 碎碎音粒。
- 全程 ADSR；整體高頻過 EQ/filter 去尖銳；混音平衡讓和弦/旋律壓在 drone 之上。

### ⑤ 誤讀字幕 / 文字呈現
誤讀字幕＝作品命題本體。中文全字型進 AR 太重，已備**三方案素材**於 `assets/text/`（見該資料夾 README）：
- **子集字型**（推薦）：思源宋體子集 **268KB woff2**，能在 AR live render、被 capture。
- **PNG 字卡**：42 張古代發光字卡（透明底、~20KB/張），引擎只吃貼圖時用。
- 純網頁文字：不建議（capture 沒字、命題不傳播）。

---

## 聲音分軌 MP3 輸出（給非網頁平台）

製作平台跑不了即時 Tone.js → 提供**離線渲染好的 34 軌 MP3**（`assets/audio/stems/`，合計 ~2.5MB）：

| 類別 | 檔案 | 說明 |
|---|---|---|
| 背景床 | `ambient_loop.mp3` | 教堂和弦床 38s，可循環 |
| 物件觸發 ×29 | `obj_<id>.mp3` | 對應 `assets/glb/<id>.glb`；10 hero 手工音色 + 19 循環音色 |
| 連續 seq ×4 | `seq_crumble_1/2/3.mp3`、`seq_resonance.mp3` | 碎碎音粒 3 變體（小石頭）+ 共鳴彩蛋 |

對應關係見 `assets/audio/stems/_對應表.md`。要改音色/重出 → 開 `audio-export.html` 自行渲染下載。

---

## 整合到活動網站

最簡單：整個 repo 當靜態互動頁嵌入或連出去。若整合進既有網站，搬：`index.html` 的 `#app`/HUD/importmap + `css/` + `js/` + `assets/glb`（或 `assets/glb-lite`）+ `assets/hdri/sky.png`（+ 視需要 `assets/audio`、`assets/text`）。

注意：CDN importmap 載 `three`/`tone`，無 build step；若有 bundler 可改 npm imports。Tone.js 須真人點擊後才出聲（不要 page load 自動播放）。GLB 路徑在 `js/models.js`。

---

## 修改指南

- **模型 / 字幕 / 音色**：`js/models.js`（`M(id, label, {voice, note}, [misreads])`；id 對應 `assets/glb/<id>.glb`；note 維持 D Dorian）。
- **聲音**：`js/sound.js`（`PROG` 和聲 / `CHANT` 旋律 / `makeVoice()` 音色 / 混音 volume 平衡 / `EQ3`、`Filter`）。
- **3D 行為**：`js/scene.js` 頂部常數（`INITIAL_UNIQUE` / `INITIAL_POP` / `MIN_POP` / `MAX_POP` / `DRIFT_MS` / `RES_TARGET`）。
- **UI / 文案**：`css/styles.css` + `index.html`。

---

## 素材與大小

- 原始 Tripo FBX ~539MB（未進 repo）。高清 GLB ~203MB（meshopt + WebP 1024）。輕量 GLB 4.52MB（draco + simplify + WebP 1024）。
- 壓縮管線：Tripo FBX → `assimp export` → `gltf-transform optimize`（高清 meshopt / 輕量 draco + `--simplify`）。
- 音效 34 軌 ~2.5MB。文字字型 268KB / 字卡 820KB。

---

## 待辦建議

- 文字呈現定案（子集字型 or PNG 字卡）→ 哲宇可協助產字卡/字型，或開短會對標引擎能力。
- 依展場主視覺定最終 10 hero 物件。
- 若要把 Tone.js 合成換成錄製/AI sampling 人聲，放 `assets/audio/` 由 export 流程替換。
- AR 化時把 `assets/glb-lite` 再依目標平台限制個別優化。

---

_three.js + Tone.js reference build · 2026-06_
