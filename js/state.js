// 記録（iPad の中だけ）。学年ごとに レベル・アイテム・クリア・にがて を持つ
import { ITEM_IDS, ITEM_MAX, LV_MAX, needExp } from './config.js';

const KEY = 'yomi-battle-v1';
export let canSave = true;

function fresh() { return { grade: 0, sound: true, g: {}, active: null }; }
function freshGrade() {
  return { lv: 1, exp: 0, clear: {}, items: Object.fromEntries(ITEM_IDS.map(k => [k, 0])), nigate: {}, graduated: 0 };
}

export const S = load();
function load() {
  try {
    const raw = localStorage.getItem(KEY);
    const d = raw ? JSON.parse(raw) : fresh();
    return Object.assign(fresh(), d);
  } catch { canSave = false; return fresh(); }
}
export function save() {
  try { localStorage.setItem(KEY, JSON.stringify(S)); canSave = true; } catch { canSave = false; }
}
try { localStorage.setItem(KEY + '-test', '1'); localStorage.removeItem(KEY + '-test'); } catch { canSave = false; }

export function G(grade = S.grade) {
  if (!S.g[grade]) S.g[grade] = freshGrade();
  const g = S.g[grade];
  for (const k of ITEM_IDS) if (g.items[k] == null) g.items[k] = 0;
  return g;
}
export const hasSave = () => !!S.grade;

// けいけんちを足す → 上がったレベルの一覧
export function addExp(n) {
  const g = G(); const ups = [];
  if (g.lv >= LV_MAX) return ups;
  g.exp += n;
  while (g.lv < LV_MAX && g.exp >= needExp(g.lv)) { g.exp -= needExp(g.lv); g.lv++; ups.push(g.lv); }
  if (g.lv >= LV_MAX) g.exp = 0;
  return ups;
}

// アイテム：たりなくなったら false（いっぱい）
export function addItem(id) {
  const g = G();
  if (g.items[id] >= ITEM_MAX) return false;
  g.items[id]++; return true;
}

// にがて
export const nigateList = () => Object.entries(G().nigate).map(([kanji, v]) => ({ kanji, yomi: v.yomi }));
export function markNigate(q) { G().nigate[q.kanji] = { yomi: q.yomi, streak: 0 }; }
// すぐ正解（攻撃を受けずに正解）→ 2回つづけたら そつぎょう。そつぎょうしたら true
export function nigateCorrect(q) {
  const n = G().nigate[q.kanji]; if (!n) return false;
  n.streak++;
  if (n.streak >= 2) { delete G().nigate[q.kanji]; G().graduated++; return true; }
  return false;
}

// 闘い中に閉じたとき、持っていったアイテムを返す
export function returnActive() {
  if (!S.active) return;
  const g = G(S.active.grade);
  for (const id of S.active.carry || []) g.items[id] = Math.min(ITEM_MAX, (g.items[id] || 0) + 1);
  S.active = null; save();
}

export function resetAll() { try { localStorage.removeItem(KEY); } catch {} Object.assign(S, fresh()); }
