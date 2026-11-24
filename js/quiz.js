// 問題の読みこみ・えらび方・答えの判定（判定は漢字すごろくと同じ）
import { KANJI_QUESTIONS } from './data/questions.js';
import { STAGES, ZAKO } from './config.js';

const len = s => Array.from(s).length;
export const QUESTIONS = {};
const SORTED = {}, BOSS = {};
for (const g of [4, 5, 6]) {
  QUESTIONS[g] = KANJI_QUESTIONS[g].split(/[,\n]/).map(s => s.trim()).filter(Boolean)
    .map(s => { const [kanji, yomi] = s.split(/\s+/); return { kanji, yomi }; })
    .filter(q => q.kanji && q.yomi);
  // むずかしさ：読みの長さ＋漢字の文字数
  const score = q => len(q.yomi) + len(q.kanji) * 1.5;
  SORTED[g] = [...QUESTIONS[g]].sort((a, b) => score(a) - score(b));
  // ボス：3文字以上 か 読みが6文字以上
  BOSS[g] = SORTED[g].filter(q => len(q.kanji) >= 3 || len(q.yomi) >= 6);
}

const slice = (arr, [a, b]) => arr.slice(Math.floor(arr.length * a), Math.max(Math.ceil(arr.length * b), Math.floor(arr.length * a) + 8));
function shuffle(a) { a = [...a]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }

// 1ステージぶんの問題。nigate＝[{kanji,yomi}]
export function makeStageQuestions(grade, stageIndex, nigate) {
  const st = STAGES[stageIndex];
  const used = new Set();
  const take = (list, n) => { const out = []; for (const q of shuffle(list)) { if (out.length >= n) break; if (!used.has(q.kanji)) { used.add(q.kanji); out.push(q); } } return out; };
  // ザコ：にがてを1〜2体まぜる
  const nig = shuffle(nigate);
  const nz = Math.min(nig.length, nig.length >= 4 ? 2 : 1);
  const zakoN = take(nig, nz).map(q => ({ ...q, nigate: true }));
  const zako = shuffle([...zakoN, ...take(slice(SORTED[grade], st.band), ZAKO - zakoN.length)]);
  // ボス：にがてがあれば半分以上をにがてから（たりない分は長いことば）
  const restNig = nig.filter(q => !used.has(q.kanji));
  const bossNig = take(restNig, Math.min(restNig.length, 3)).map(q => ({ ...q, nigate: true }));
  const longs = take(slice(BOSS[grade], st.bossBand), 12);
  const first = shuffle([...bossNig, ...longs.slice(0, 5 - bossNig.length)]);
  return { zako, boss: [...first, ...longs.slice(5 - bossNig.length)] };
}

// 子どもの入力ゆれをならす（小さい字＝大きい字、カタカナ＝ひらがな、ローマ字もOK）
const SMALL = { 'ぁ': 'あ', 'ぃ': 'い', 'ぅ': 'う', 'ぇ': 'え', 'ぉ': 'お', 'ゃ': 'や', 'ゅ': 'ゆ', 'ょ': 'よ', 'っ': 'つ', 'ゎ': 'わ' };
export function normalize(input) {
  let s = String(input).normalize('NFKC').toLowerCase().trim();
  if (/[a-z]/.test(s) && window.wanakana) s = window.wanakana.toHiragana(s, { convertLongVowelMark: false });
  s = s.replace(/[ァ-ヶ]/g, ch => String.fromCharCode(ch.charCodeAt(0) - 0x60));
  s = s.replace(/([あいうえお])ー/g, '$1$1');
  s = s.replace(/[ぁぃぅぇぉゃゅょっゎ]/g, m => SMALL[m]);
  s = s.replace(/[\s、。．・･,.]/g, '');
  return s;
}
export const hasKanji = s => /[㐀-鿿々〆]/.test(s);

// 'empty' | 'kanji'（漢字のまま）| 'partial'（ローマ字の打ちかけ）| 'ok' | 'ng'
export function check(input, q) {
  const raw = String(input).trim();
  if (!raw) return 'empty';
  if (hasKanji(raw)) return 'kanji';
  const n = normalize(raw);
  if (!n) return 'empty';
  if (/[a-z]/.test(n)) return 'partial';
  return n === normalize(q.yomi) ? 'ok' : 'ng';
}
