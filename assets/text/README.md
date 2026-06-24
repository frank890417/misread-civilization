# 誤讀文明 — 誤讀字幕 文字方案素材（給製作團隊）

> 解決「中文字型在 AR 太重」的問題。這裡備好**三種呈現方案**的可用素材，團隊依引擎能力挑一種即可。
> 創作端立場：**誤讀字幕是作品命題的本體**（floating 石頭 + 誤讀文字 = 才成立），建議**留在場景裡（能被錄影/拍照 capture）**，讓每次分享都帶著命題。

---

## 方案比較

| 方案 | 被 capture？ | 容量 | 彈性 | 適用 |
|---|---|---|---|---|
| **A. 子集字型**（推薦先試）| ✅ 是 | **268KB** | 動態：任意句、可隨機、可做燒字動畫 | 引擎能 render text（three.js / WebGL text） |
| **B. PNG 字卡** | ✅ 是 | 820KB（42 張）| 固定圖、藝術指導感強（古代發光） | 引擎只吃貼圖 / 想要美術鎖定 |
| ~~C. 純網頁文字~~ | ❌ 否（capture 沒字）| 0 | 高 | **不建議**：分享出去只剩石頭、命題不傳播 |

> **容量提醒**：若擔心總容量，模型改用我們提供的 **lite GLB**（`assets/glb-lite/`，29 顆共 4.52MB，vs 高清 203MB），騰出的空間放字型/字卡 + 音樂綽綽有餘。

---

## A. 子集字型 `font/`

- `misread-subset.woff2`（268KB）/ `misread-subset.otf`（407KB）
- 思源宋體 繁中（Source Han Serif TC，**SIL OFL 開源、可自由嵌入散布**），子集化為**只含本作用到的 527 字**（所有誤讀句 + 作品概念/互動全文 + 標點 + 英數）。
- 用法（CSS）：
  ```css
  @font-face{ font-family:'MisreadSerif'; src:url('misread-subset.woff2') format('woff2'); }
  ```
  three.js 文字可用 troika-three-text 指定此字型；一般 DOM 直接 `font-family:'MisreadSerif'`。
- 只要文字不超出這 527 字就能正常顯示（要加字 → 跟哲宇要重新子集化，很快）。

## B. PNG 字卡 `png/`

- 42 張：10 hero 物件 × 3 句（`<物件id>_1/2/3.png`）+ 通用誤讀 12 句（`generic_1..12.png`）。
- 透明底、金色宋體 + 古代發光描邊（亮天空/任何背景都可讀）。每張 ~20KB。
- `_manifest.json`：每張 → 物件 id + 文字內容，方便程式對應。
- 用法：當作貼圖/quad 浮在石頭旁，3 秒淡出即可。

## 對應關係

- 哪張字卡/哪句屬於哪顆石頭：見 `png/_manifest.json`（`object` 欄＝模型 id，對應 `assets/glb/<id>.glb`）。
- 物件聲音對應：見 `assets/audio/stems/_對應表.md`。

---

## 需要時哲宇可再產

- 字卡改文案 / 換風格（燒字、碑刻、不同色）→ 重出。
- 字型加字 / 換字重（思源宋體有 Light~Heavy）→ 重新子集化。
- 想要「字逐筆燒出」動畫（4/29 會議的 stretch）→ 可出序列幀或給 shader 參數。

_by 吳哲宇 × Muse 🫧 · 2026-06-24_
