// 絵の部品：主人公ヨミ（顔は絵文字・体はちぎり紙）、ちぎり紙の山、島、はなまる
import { GEAR } from './config.js';

// 主人公。lv で持ち物がふえる。s＝大きさ（1＝130×200）
export function heroHTML(lv, s = 1, cls = '') {
  const has = l => lv >= l;
  const W = 130 * s, H = 200 * s;
  const scarf = has(7) ? `<path d="M44 80 Q64 92 84 80 L86 90 Q64 102 42 90 Z" fill="#F4B53F"/><path d="M76 88 L88 120 L78 118 L70 92Z" fill="#E09A1E"/>` : '';
  return `<div class="hero ${cls}" style="width:${W}px;height:${H}px">
    <div class="stk hero-body"><svg viewBox="0 0 130 200" width="${W}" height="${H}" style="overflow:visible">
      <path d="M40 84 L88 84 L104 178 L80 172 L64 182 L46 172 L22 180 Z" fill="#EF5A3C"/>
      <path d="M40 84 L88 84 L104 178 L80 172 L64 182 L46 172 L22 180 Z" fill="none" stroke="#C94428" stroke-width="2" stroke-dasharray="3 5" opacity=".5"/>
      <rect x="46" y="148" width="14" height="38" rx="7" fill="#4A3B33"/><rect x="68" y="148" width="14" height="38" rx="7" fill="#4A3B33"/>
      <ellipse cx="51" cy="189" rx="12" ry="7" fill="#2E2420"/><ellipse cx="77" cy="189" rx="12" ry="7" fill="#2E2420"/>
      <path d="M42 84 Q64 74 86 84 L94 156 Q64 166 34 156 Z" fill="#3C6FD8"/>
      <path d="M50 84 L64 104 L78 84" fill="#fff" opacity=".9"/>
      <rect x="36" y="122" width="56" height="11" rx="3" fill="#F4B53F"/><rect x="58" y="120" width="12" height="15" rx="3" fill="#C98A17"/>
      <rect x="22" y="90" width="15" height="44" rx="7.5" fill="#3C6FD8" transform="rotate(14 30 92)"/><circle cx="22" cy="134" r="8" fill="#F6C9A0"/>
      <rect x="92" y="88" width="15" height="40" rx="7.5" fill="#3C6FD8" transform="rotate(-40 98 90)"/><circle cx="121" cy="114" r="8" fill="#F6C9A0"/>
      ${scarf}
    </svg></div>
    <div class="stk" style="position:absolute;left:${26 * s}px;top:${2 * s}px;font-size:${78 * s}px">🧒</div>
    ${has(10) ? `<div class="stk s" style="position:absolute;left:${44 * s}px;top:${-30 * s}px;font-size:${40 * s}px">👑</div>` : ''}
    ${has(3) ? `<div class="stk s" style="position:absolute;left:${104 * s}px;top:${50 * s}px;font-size:${54 * s}px;transform:rotate(-20deg)">🗡️</div>` : ''}
    ${has(5) ? `<div class="stk s" style="position:absolute;left:${-4 * s}px;top:${106 * s}px;font-size:${46 * s}px">🛡️</div>` : ''}
  </div>`;
}
export const gearText = lv => GEAR.filter(g => g.lv === lv).map(g => g.e + ' ' + g.name).join('');

// ちぎり紙：上のふちをギザギザにして、白い紙のふちを少し見せる
function rnd(seed) { return () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; }; }
export function torn(y, amp, freq, phase, seed, bottom = 820) {
  const r = rnd(seed); let d = `M0 ${bottom} L0 ${y}`;
  for (let x = 0; x <= 1180; x += 7) {
    const yy = y + amp * Math.sin(x * freq + phase) + amp * .45 * Math.sin(x * freq * 2.3 + phase * 1.7) + (r() - .5) * 3.2;
    d += ` L${x} ${yy.toFixed(1)}`;
  }
  return d + ` L1180 ${bottom} Z`;
}
const layer = (y, amp, freq, phase, seed, color, edge = '#fff') =>
  `<g style="filter:drop-shadow(0 -2px 3px rgba(60,40,20,.18))"><path d="${torn(y - 4, amp, freq, phase, seed + 1)}" fill="${edge}" opacity=".9"/><path d="${torn(y, amp, freq, phase, seed)}" fill="${color}"/></g>`;

// 闘いの背景（ステージの色）
export function battleLand(st) {
  const [far, mid, near] = st.land;
  const edge = st.id === 'doukutsu' ? '#9C90C4' : '#fff';
  return `<svg class="land" viewBox="0 0 1180 820">
    ${layer(250, 26, .006, .4, 5, far, edge)}${layer(292, 14, .01, 2, 9, mid, edge)}${layer(326, 5, .014, 3, 13, near, edge)}
    <path d="${torn(338, 2, .02, 1, 21, 384)}" fill="${st.path}" opacity=".85"/>
  </svg>`;
}
// タイトルの野原
export function titleLand() {
  return `<svg class="land" viewBox="0 0 1180 820">${layer(430, 34, .006, 1, 3, '#D4EBB7')}${layer(500, 22, .009, 2, 7, '#A9D677')}${layer(590, 10, .012, 4, 11, '#84C35E')}</svg>`;
}

// 島（場所えらび）
function blob(cx, cy, rx, ry, seed, color, edge = true) {
  const r = rnd(seed); let d = '';
  for (let a = 0; a <= 360; a += 4) {
    const t = a * Math.PI / 180, k = 1 + .06 * Math.sin(t * 3 + seed) + .04 * Math.sin(t * 5) + (r() - .5) * .025;
    d += (a ? 'L' : 'M') + (cx + rx * k * Math.cos(t)).toFixed(1) + ' ' + (cy + ry * k * Math.sin(t)).toFixed(1);
  }
  return `<g style="filter:drop-shadow(0 8px 10px rgba(30,60,80,.25))">${edge ? `<path d="${d}Z" fill="#fff" transform="translate(0 -5)"/>` : ''}<path d="${d}Z" fill="${color}"/></g>`;
}
export function islandSVG() {
  let waves = '';
  for (let i = 0; i < 9; i++) { const y = 40 + i * 92; let d = ''; for (let x = 360 + (i % 2) * 40; x < 1180; x += 150) d += `M${x} ${y} q 18 -12 36 0 t 36 0 `; waves += `<path d="${d}" stroke="#fff" stroke-width="4" fill="none" opacity=".45" stroke-linecap="round"/>`; }
  return `<svg class="land" viewBox="0 0 1180 820">${waves}
    ${blob(780, 430, 390, 330, 4, '#F3E3B3')}
    ${blob(500, 600, 190, 150, 8, '#9FD06D')}${blob(740, 420, 190, 160, 12, '#4E9A63')}${blob(930, 280, 150, 120, 16, '#7A6BA3')}${blob(1040, 140, 150, 105, 20, '#C7766B')}
    <path d="M500 640 C 600 600, 640 520, 750 460 S 900 340, 940 300 S 1020 210, 1050 170" stroke="#fff" stroke-width="9" fill="none" stroke-dasharray="2 20" stroke-linecap="round"/>
  </svg>`;
}

// はなまる（クリア）と「もうすこし」スタンプ（しっぱい）
export function hanamaru(color = '#EF5A3C') {
  let d = ''; for (let t = 0; t <= 6 * Math.PI; t += .1) { const r = 6 + t * 3.2; d += (t ? 'L' : 'M') + (r * Math.cos(t)).toFixed(1) + ' ' + (r * Math.sin(t)).toFixed(1); }
  let p = ''; const n = 11; for (let i = 0; i <= n * 24; i++) { const t = i / (n * 24) * 2 * Math.PI; const r = 58 + 9 * Math.abs(Math.sin(t * n)); p += (i ? 'L' : 'M') + (r * Math.cos(t)).toFixed(1) + ' ' + (r * Math.sin(t)).toFixed(1); }
  return `<svg width="150" height="150" viewBox="-75 -75 150 150"><g transform="rotate(-12)" fill="none" stroke="${color}" stroke-width="6" stroke-linecap="round" stroke-linejoin="round" opacity=".92"><path d="${d}"/><path d="${p}Z"/></g></svg>`;
}
export function moosukoshi() {
  return `<svg width="150" height="150" viewBox="-75 -75 150 150"><g transform="rotate(-10)" fill="none" stroke="#3C6FD8" stroke-width="6" opacity=".9"><circle r="62"/><circle r="52" stroke-width="3"/></g>
    <text x="0" y="-6" text-anchor="middle" font-size="26" font-weight="900" fill="#3C6FD8" transform="rotate(-10)" font-family="Zen Maru Gothic">もう</text>
    <text x="0" y="26" text-anchor="middle" font-size="26" font-weight="900" fill="#3C6FD8" transform="rotate(-10)" font-family="Zen Maru Gothic">すこし</text></svg>`;
}

// 太陽（ゆっくり回る）
export const sun = (x, y, size = 110) => `<div class="a" style="left:${x}px;top:${y}px;width:${size}px;height:${size}px"><svg viewBox="0 0 150 150" class="spin"><g fill="#FFE08A">
  <path d="M75 0l6 30h-12zM75 150l-6-30h12zM0 75l30-6v12zM150 75l-30 6v-12zM22 22l26 16-10 10zM128 128l-26-16 10-10zM128 22l-16 26-10-10zM22 128l16-26 10 10z"/></g><circle cx="75" cy="75" r="36" fill="#FFC94D"/></svg></div>`;
