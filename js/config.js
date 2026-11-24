// よみバトル：数字と決まり（すべて「仮」。遊んでみて調整する）

export const ZAKO = 6;            // 1ステージのザコの数
export const BOSS_HP = 5;         // ボスの生命力
export const HEARTS = 5;          // はじめのハート
export const CARRY = 2;           // 持っていけるアイテム
export const ITEM_MAX = 3;        // 1種類に持てる数
export const DROP = 0.3;          // アイテムが出る確率
export const DROP_KAISHIN = 0.5;  // 会心のときの確率
export const LV_MAX = 10;
export const APPEAR = 0.6;        // 敵が出てきて止まっている秒数（ここで読む）
export const BOSS_SPEED = 0.8;    // ボスはザコの8割の時間で着く
export const SUNA = 1.2;          // すなどけい：時間が1.2倍

// けいけんち
export const EXP = { ok: 10, kaishin: 15, retry: 3, boss: 30, clear: 20, graduate: 10 };
// レベル n → n+1 に必要なけいけんち
export const needExp = lv => 80 + 40 * (lv - 1);
// レベルで変わるもの
export const maxHearts = lv => HEARTS + (lv >= 3) + (lv >= 6) + (lv >= 9);
export const kaishinDamage = lv => 2 + (lv >= 5) + (lv >= 10);
export const kaishinRatio = lv => 0.5 + (Math.min(lv, LV_MAX) - 1) * (0.1 / 9);

// 主人公の持ち物（レベル）
export const GEAR = [
  { lv: 3, e: '🗡️', name: 'つるぎ' },
  { lv: 5, e: '🛡️', name: 'たて' },
  { lv: 7, e: '🧣', name: 'マフラー' },
  { lv: 10, e: '👑', name: 'かんむり' },
];

// ステージ：base＝敵がとどくまでの秒数 / band＝問題のむずかしさの はんい（0やさしい〜1むずかしい）
export const STAGES = [
  { id: 'heiya', name: '平原', icon: '🌾', base: 12, band: [0, 0.45], bossBand: [0, 0.5],
    mons: ['🐗', '🐍', '🐝', '🐓'], boss: { e: '🐗', name: 'おおいのしし' },
    sky: ['#BFE6F5', '#E9F6F1'], land: ['#D4EBB7', '#A9D677', '#84C35E'], path: '#F2E8C4', ink: '#2d5a2a',
    deco: ['🌼', '🌱', '🌼', '🌳'] },
  { id: 'mori', name: '森', icon: '🌲', base: 11, band: [0.2, 0.65], bossBand: [0.2, 0.7],
    mons: ['🐺', '🦉', '🍄', '🦊'], boss: { e: '🐻', name: 'くまの王' },
    sky: ['#CFE9D2', '#EEF6E4'], land: ['#8FC79A', '#5BA872', '#3F7F57'], path: '#E6D9B0', ink: '#1f4a33',
    deco: ['🍄', '🌿', '🌲', '🌲'] },
  { id: 'doukutsu', name: '洞窟', icon: '🪨', base: 10, band: [0.4, 0.85], bossBand: [0.4, 0.85],
    mons: ['🦇', '🕷️', '👻', '🐌'], boss: { e: '🐉', name: 'いわやのりゅう' },
    sky: ['#2E2840', '#4A4262'], land: ['#6A5C8F', '#55497A', '#3F365C'], path: '#8E82AE', ink: '#f2ecff',
    deco: ['💎', '🪨', '💎', '🕯️'] },
  { id: 'shiro', name: '城', icon: '🏰', base: 9, band: [0.55, 1], bossBand: [0.55, 1],
    mons: ['💀', '🧛', '👺', '🦂'], boss: { e: '👹', name: 'おにの王' },
    sky: ['#FFC9A3', '#FFE9D2'], land: ['#D99A86', '#C7766B', '#8A4B5C'], path: '#EBCFB4', ink: '#5a2430',
    deco: ['🏯', '🔥', '🏰', '🔥'] },
];

export const ITEMS = {
  heart:   { e: '💗', name: 'ハートのかけら', desc: 'このステージだけ ハート＋1' },
  omamori: { e: '🛡️', name: 'おまもり', desc: '攻撃を1回だけ ふせぐ' },
  suna:    { e: '⏳', name: 'すなどけい', desc: '敵が ゆっくり歩く（1.2倍）' },
  hint:    { e: '📜', name: 'ヒントのまきもの', desc: '1回だけ 読みの1文字目が見える' },
  tsurugi: { e: '🗡️', name: 'ちからのつるぎ', desc: 'ボスへの攻撃が1回だけ 2ばい' },
};
export const ITEM_IDS = Object.keys(ITEMS);
