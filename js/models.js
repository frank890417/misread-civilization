// ============================================================================
// models.js — 誤讀文明 物件清單（資料層，無依賴）
// ----------------------------------------------------------------------------
// 每個物件：
//   id       對應 assets/glb/<id>.glb（Tripo FBX → assimp → gltf-transform 壓縮）
//   label    名稱
//   sound    { voice, note } 點擊音色 id（見 sound.js makeVoice）+ 固定音（D Dorian，互相和諧）
//   misreads 該物件的「考古誤讀」字幕 pool（沒給就用 GENERIC_MISREADS）
// ============================================================================

const M = (id, label, sound, misreads = null) => ({ id, label, sound, misreads, glb: `assets/glb/${id}.glb` });

// 10 hero — 對應作品定稿的 10 個日常物件（誤讀成漂浮黏土彩石）
const HEROES = [
  M('phone', '手機', { voice: 'glass', note: 'A5' },
    ['供奉用的發光石板，疑似祈雨', '部族隨身攜帶的靈魂容器', '一種會自己亮起來的神諭']),
  M('bottle', '珍奶杯', { voice: 'marimba', note: 'D5' },
    ['貴族飲用聖水的容器', '內含珍珠的祭祀瓶', '裝載液態記憶的禮器']),
  M('cube_blue', '悠遊卡', { voice: 'metal', note: 'A4' },
    ['通行靈界的藍色符印', '刷一下即可開門的咒石', '一塊被馴服的天空']),
  M('cube_painted', '捷運車廂', { voice: 'pluck', note: 'E4' },
    ['會說話的方形神龕', '內有小人居住的盒子', '集體移動用的記憶箱']),
  M('coral', 'AirPods', { voice: 'glassSoft', note: 'C5' },
    ['海神遺落的指骨化石', '塞進耳朵聆聽神諭的器官', '成對出現的微型圖騰']),
  M('cluster', '人孔蓋', { voice: 'organLow', note: 'D3' },
    ['部族集會堆疊的記憶石堆', '通往地底世界的封印', '大地的鈕扣']),
  M('rock_purple', '紅綠燈', { voice: 'am', note: 'F4' },
    ['長出紫色思想的冥想石', '指揮人群停與走的神祇', '會變色的命令之石']),
  M('rock_lichen', '塑膠袋', { voice: 'air', note: 'G4' },
    ['時間在上面結痂的證物', '一種永不腐爛的祭祀布', '被風供奉了三百年']),
  M('rock_abstract', '充電線', { voice: 'duo', note: 'A3' },
    ['某種已滅絕生物的脊椎', '傳遞生命能量的臍帶', '纏繞神明手腕的繩結']),
  M('rock_cracked', '101', { voice: 'bellLow', note: 'D4' },
    ['憤怒之神捏碎的禱告', '曾經很高很高的祈願塔', '一節通天的彩色脊柱']),
];

// 額外 19 顆 — 同批 Tripo 殘骸，沒對應特定物件，當「未被辨識的遺物」漂浮，
// 誤讀字幕用 GENERIC_MISREADS。音色循環整個調色盤、音高鋪滿 D Dorian。
const VOICE_CYCLE = ['organLow', 'marimba', 'am', 'pluck', 'glass', 'duo', 'metal', 'air', 'glassSoft', 'bellLow'];
const NOTE_CYCLE = ['D3', 'F3', 'A3', 'C4', 'E4', 'G4', 'B4', 'D5', 'F5', 'A5'];
const EXTRA_DEFS = [
  ['clay_sculpture', '黏土殘像'], ['lichen_rock', '地衣石'], ['mineral_rock', '礦脈'],
  ['mosaic_rock', '碎磚馬賽克'], ['painted_rock', '彩繪殘塊'], ['rock_a', '彩石・甲'],
  ['rock_b', '彩石・乙'], ['rock_c', '彩石・丙'], ['rock_d', '彩石・丁'],
  ['rock_e', '彩石・戊'], ['rock_f', '彩石・己'], ['rock_fragment', '碎片'],
  ['rock_sculpture', '殘雕'], ['cube_cracked', '裂方'], ['rock_block', '塊石'],
  ['clay_painted', '彩繪黏土'], ['rock_pink', '粉石'], ['rock_pink2', '粉石・貳'],
  ['rock_lichen2', '地衣石・貳'],
];
const EXTRAS = EXTRA_DEFS.map(([id, label], i) =>
  M(id, label, { voice: VOICE_CYCLE[i % VOICE_CYCLE.length], note: NOTE_CYCLE[i % NOTE_CYCLE.length] }));

export const MODELS = [...HEROES, ...EXTRAS];

// 未辨識遺物的通用誤讀字幕（<25 字，未來 AI 對殘片的錯誤推測）
export const GENERIC_MISREADS = [
  '某種神祇的牙齒，已風化',
  '用途不明，可能與占卜有關',
  '被三百年的時間磨圓的禱告',
  '一塊記得太多的石頭',
  '疑似某次集體儀式的殘片',
  '當代人類拋棄的圖騰之一',
  '無法辨識，暫存於誤讀檔案',
  '據推測曾經會發光',
  '一個被誤讀成石頭的東西',
  '文明崩解時掉落的標點符號',
  '某種情緒的化石',
  '被風供奉、被雨翻譯的遺物',
];
