# 誤讀文明 Misread Civilization — 互動參考預覽

> 共域座標 POST-TRIBE AR · 給製作團隊的 three.js 對齊參考
> 用既有 Tripo 批次素材，把製作會議 spec 做成「活的」互動預覽。
> **這不是最終 AR 檔，是讓團隊一眼看懂「組合 / 互動 / 音效觸發」要長怎樣的參考版。**

🔗 **線上版**：https://frank890417.github.io/misread-civilization/

---

## 怎麼看

**線上**：直接開上面的 GitHub Pages 連結。

**本機**：double-click `serve.command`，或：
```bash
python3 -m http.server 8123 --bind 127.0.0.1
# 開 http://127.0.0.1:8123
```
> 需用支援 WebGL 的瀏覽器。模型已壓成 GLB（10 顆共 ~67MB），秒載。

**操作**：拖曳環視 · 滾輪縮放 · **點石頭**（第一下解鎖聲音）→ 無重力推一下 + 發聲 + 浮現誤讀字幕。累積觸碰達 18 次 → 觸發「共鳴」彩蛋。

---

## 這個預覽示範了什麼（對應製作會議 spec）

| spec | 預覽怎麼做 |
|---|---|
| ① 分層渲染 | 近景 3D 可互動漂浮石；遠景巨石用 HDRI 全景天空撐密度（即建議的 Skybox 360）。示範會議結論「**少種模型 + 換色**」：10 顆 hero + clone 調色 = 24 顆 |
| ② 點擊互動 | 無重力推位移 + 自轉 + 縮放脈衝 + 發光（對齊「太空中被輕推」） |
| ③ 聲音系統（Tone.js）| 中古教堂和絃床（D Dorian，ADSR pad + organum 低音 + **人聲合唱**）+ 聖詠旋律（凸顯 b7＝教堂感）+ **glitch 人聲扭曲**（呼應「AI 誤讀我們」雙重扭曲）+ **每物件不同音色**，多顆疊成 ambient |
| ④ 誤讀字幕 | 點擊浮現 <25 字考古誤讀，3 秒淡出（v2 可做魔戒字逐筆燒出） |
| ⑤ 共鳴彩蛋 | 累積點擊達閾值 → 全體石陣共鳴脈衝 + 環境變色（Discover → Touch → Resonate） |

---

## 素材

- **3D 物件**：`assets/glb/` — 10 顆 hero（Tripo 批次生成 → assimp 轉 GLB → gltf-transform 壓縮：meshopt 幾何 + WebP 貼圖，每顆 <10MB）
  - 手機 / 珍奶杯(瓶) / 悠遊卡(藍方塊) / 捷運(彩繪螢幕盒) / AirPods(珊瑚) / 人孔蓋(石叢) / 紅綠燈(紫苔石) / 塑膠袋(地衣石) / 充電線(殘骸) / 101(裂石)
  - ⭐ 這批壓縮後的 GLB 也接近 web-AR 的 <5MB 規格，可直接當 AR 素材起點
- **天空**：`assets/hdri/sky.png` — equirect 全景（彩石漂浮藍天）當 sky sphere + 環境光

## 待補

- [ ] 聲音現為 Tone.js 合成。若要換**錄製/AI sampling 人聲素材** → 放 `assets/audio/`
- [ ] 各物件音色/音高微調 + 最終 10 物件定版 + 誤讀字幕文案（目前每物件 3 句 pool）
- [ ] 7 城調式變體（目前 D Dorian）
- [ ] 部分 GLB 仍 >5MB，要進 AR 可再降貼圖到 512 / 幾何 simplify

---

## 技術

- three.js 0.169 + Tone.js 14.9（CDN importmap，無 build step）· GLTFLoader + MeshoptDecoder
- 模型管線：Tripo FBX → `assimp export` GLB → `gltf-transform optimize`（meshopt + WebP 1024）→ 539MB 砍到 67MB
- 石頭材質：GLB 的 StandardMaterial 壓高粗糙（roughness 0.97）+ 去金屬反光 = 風化岩石感
- 單檔 `index.html`，所有邏輯內含、有註解；載入時模型 normalize 統一尺寸，clone HSV 調色示範「少種模型換色」

_three.js + Tone.js reference build · by Muse 🫧 · 2026-06_
