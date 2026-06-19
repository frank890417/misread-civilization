# 誤讀文明 Misread Civilization — 互動參考預覽

> 共域座標 POST-TRIBE AR · three.js + Tone.js reference build  
> 這不是最終 AR 檔，而是給製作團隊理解「漂浮石陣 / 點擊互動 / 音效觸發 / 網站整合」的可執行參考版。

線上版：<https://frank890417.github.io/misread-civilization/>

Repo：<https://github.com/frank890417/misread-civilization>

---

## 快速查看

線上直接開 GitHub Pages 連結即可。

本機測試：

```bash
python3 -m http.server 8123 --bind 127.0.0.1
```

然後開：<http://127.0.0.1:8123>

也可以 double-click `serve.command`。

操作方式：

- 拖曳環視、滾輪縮放。
- 點石頭：無重力推一下、發光、播放該物件音色、浮現考古誤讀字幕。
- 第一次點擊會解鎖瀏覽器 AudioContext，聲音才會開始。
- 場上石頭會自己慢慢飄入、飄出，像一個會呼吸的漂浮族群。
- 右側製作參考說明會先顯示 5 秒，之後自動收合；可用底部「顯示說明」再次展開。

---

## 專案結構

```text
.
├── index.html          # HTML shell + UI 文案 + importmap
├── css/
│   └── styles.css      # 所有介面與 HUD 樣式
├── js/
│   ├── main.js         # 啟動程式、按鈕事件、模組接線
│   ├── scene.js        # three.js 場景、GLB 載入、互動、石頭進出
│   ├── sound.js        # Tone.js 聲音系統
│   └── models.js       # 29 顆模型資料、音色、誤讀字幕
├── assets/
│   ├── glb/            # 壓縮後 GLB 模型
│   ├── hdri/sky.png    # HDRI sky sphere / environment
│   └── audio/          # 未來可放錄製聲音或 AI sampling 人聲
└── serve.command       # macOS 本機預覽快捷
```

這版已把原本單檔 `index.html` 拆成 CSS、3D、聲音、資料四塊，方便活動網站團隊接手或只拿其中一部分整合。

---

## 整合到活動網站

最簡單的方式是把整個 repo 當作一個靜態互動頁面嵌入或連出去。

若要整合進既有網站，可搬以下檔案：

- `index.html` 裡的 `#app`、HUD、控制按鈕與 importmap。
- `css/styles.css`
- `js/main.js`、`js/scene.js`、`js/sound.js`、`js/models.js`
- `assets/glb/` 與 `assets/hdri/sky.png`

注意事項：

- 目前使用 CDN importmap 載入 `three` 與 `tone`，沒有 build step。
- 若對方網站已有 bundler，可把 importmap 改成 npm imports。
- 由於瀏覽器限制，Tone.js 必須在真人點擊後才會出聲。不要在 page load 時自動播放。
- GLB 路徑寫在 `js/models.js`：`assets/glb/<id>.glb`。若搬到不同目錄，改這裡即可。

---

## 目前互動設計

### 1. 分層渲染

- 近景：可點擊的 3D 漂浮石。
- 遠景：`assets/hdri/sky.png` 作為 equirect sky sphere，同時提供環境光。
- 石頭材質統一壓成霧面：`roughness 0.97`、低 `envMapIntensity`，避免太亮或太塑膠。
- 底部工具列使用全寬 scrim 漸層，確保亮天空背景下控制列與提示文字都可讀。

### 2. 更多石頭與動態族群

- 已納入 29 顆 GLB。
- 開場先載 12 種模型，再 clone 成約 22 顆，避免一開始硬載 29 顆造成 Pages 太慢。
- 場上族群維持在 18–28 顆之間。
- 每隔數秒隨機讓一顆飄出去，另一顆從場外飄進來。
- 尚未載過的模型會在進場時 lazy-load，所以種類會隨時間逐漸變多。

### 3. 點擊互動

點任一石頭會觸發：

- 無重力推位移
- 自轉加速
- 縮放脈衝
- 暖色發光
- 誤讀字幕
- 對應物件音色
- 小石頭會額外觸發快速碎碎音粒

### 4. 聲音系統

`js/sound.js` 使用 Tone.js 合成：

- D Dorian 教堂和聲床。
- re-fa-la-do 加入 Dorian 第 6 音 B，保留 b7 C 的教堂色彩。
- 聖詠動機：2-4-6-6-[7]-6-5-6。
- organum 開五度低音。
- 人聲合唱質感 pad。
- glitch 人聲 stutter，呼應「AI 誤讀我們」。
- 每個 hero 物件有不同音色與 ADSR。
- 整體高頻已過 EQ / filter，避免方波或三角波太尖。

---

## 修改指南

### 改模型、字幕、音色

編輯 `js/models.js`。

每個模型格式：

```js
M('phone', '手機', { voice: 'glass', note: 'A5' }, [
  '供奉用的發光石板，疑似祈雨',
  '部族隨身攜帶的靈魂容器',
  '一種會自己亮起來的神諭',
])
```

- `id` 對應 `assets/glb/<id>.glb`
- `label` 用在載入文字與交接理解
- `voice` 對應 `js/sound.js` 裡的音色
- `note` 建議維持在 D Dorian：D E F G A B C
- `misreads` 是點擊時出現的考古誤讀字幕

### 改聲音

編輯 `js/sound.js`。

常改位置：

- `PROG`：教堂和聲進行
- `CHANT`：聖詠旋律
- `makeVoice()`：每個物件的音色
- `crumble()`：小石頭碎碎聲密度與速度
- `EQ3` / `Filter`：整體刺耳程度與空氣感

### 改 3D 行為

編輯 `js/scene.js`。

常改參數：

```js
const INITIAL_UNIQUE = 12;
const INITIAL_POP = 22;
const MIN_POP = 18;
const MAX_POP = 28;
const DRIFT_MS = 3400;
const RES_TARGET = 18;
```

可調整開場載入種類、場上石頭密度、進出頻率與共鳴門檻。

### 改 UI / 說明文字

- 視覺樣式：`css/styles.css`
- 右側說明面板與按鈕：`index.html`

---

## 素材與大小

- 原始 FBX 約 539MB，未放入 repo。
- 目前 repo 放的是壓縮 GLB，總計約 203MB。
- 每顆 GLB 約 3.7–9.7MB，單檔皆低於 GitHub 100MB 限制。
- 壓縮管線：Tripo FBX → `assimp export` → `gltf-transform optimize`（meshopt + WebP）。

若要進一步進 WebAR 或降低手機流量，可再做：

- 貼圖降到 512px。
- Draco / meshopt 參數再壓。
- 幾何 simplify。
- 只保留最終 10 hero，其他作遠景或 skybox。

---

## 待辦建議

- 依展場主視覺決定最終 10 hero 物件。
- 把 Tone.js 合成人聲替換或疊加錄製 / AI sampling 的合唱素材。
- 誤讀字幕做成外部 JSON，讓文案可由團隊直接維護。
- 為活動網站加一個低效能模式：少量模型、關閉 HDRI、降低 pixel ratio。
- 若要 AR 化，將 `assets/glb/` 中的模型再個別優化到目標平台限制。

---

three.js + Tone.js reference build · 2026-06
