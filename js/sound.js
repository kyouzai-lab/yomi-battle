// 効果音：その場で作る音（ファイルなし）。消音は せってい から
import { S } from './state.js';

let ctx = null;
function ac() {
  if (!ctx) { try { ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch { return null; } }
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}
// iPad はタップのときに音を「起こす」必要がある
export function unlock() { ac(); }

function tone(freq, dur, { type = 'sine', vol = .18, at = 0, slide = 0 } = {}) {
  if (!S.sound) return; const c = ac(); if (!c) return;
  const t = c.currentTime + at, o = c.createOscillator(), g = c.createGain();
  o.type = type; o.frequency.setValueAtTime(freq, t);
  if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(40, freq * slide), t + dur);
  g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + .01); g.gain.exponentialRampToValueAtTime(.001, t + dur);
  o.connect(g).connect(c.destination); o.start(t); o.stop(t + dur + .02);
}
export const sfx = {
  tap: () => tone(660, .08, { type: 'triangle', vol: .12 }),
  hit: () => { tone(520, .1, { type: 'square', vol: .08 }); tone(780, .14, { type: 'triangle', at: .06 }); },
  kaishin: () => { [660, 880, 1175, 1568].forEach((f, i) => tone(f, .16, { type: 'triangle', at: i * .05, vol: .14 })); },
  hurt: () => { tone(220, .28, { type: 'sawtooth', vol: .1, slide: .5 }); },
  block: () => { tone(1200, .12, { type: 'triangle', vol: .1 }); tone(1600, .2, { type: 'sine', at: .05, vol: .1 }); },
  wrong: () => tone(180, .15, { type: 'square', vol: .06 }),
  item: () => { tone(988, .1, { type: 'triangle', vol: .12 }); tone(1319, .18, { type: 'triangle', at: .08, vol: .12 }); },
  boss: () => { [196, 185, 174].forEach((f, i) => tone(f, .3, { type: 'sawtooth', at: i * .22, vol: .07 })); },
  win: () => { [523, 659, 784, 1047].forEach((f, i) => tone(f, .25, { type: 'triangle', at: i * .12, vol: .15 })); },
  lose: () => { [392, 330, 262].forEach((f, i) => tone(f, .3, { type: 'triangle', at: i * .18, vol: .12 })); },
  levelup: () => { [784, 988, 1175, 1568].forEach((f, i) => tone(f, .2, { type: 'square', at: i * .09, vol: .06 })); },
};
