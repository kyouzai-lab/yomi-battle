// 闘い：敵（漢字の札をもったまもの）が右から歩いてくる。きょり＝のこり時間
import { STAGES, ITEMS, ITEM_IDS, ZAKO, BOSS_HP, APPEAR, BOSS_SPEED, SUNA, DROP, DROP_KAISHIN, EXP,
  maxHearts, kaishinRatio, kaishinDamage } from './config.js';
import { S, G, save, markNigate, nigateCorrect, addExp, addItem } from './state.js';
import { makeStageQuestions, check } from './quiz.js';
import { nigateList } from './state.js';
import { heroHTML, battleLand, sun } from './art.js';
import { sfx } from './sound.js';

const SPAWN = 1030;   // 敵の まん中（出てくる所）
const CONTACT = 410;  // 敵の まん中（主人公にとどく所）
const ENEMY_W = 300;
const $ = (root, q) => root.querySelector(q);
const len = s => Array.from(s).length;

export function startBattle(stage, { stageIndex, carry, onEnd, onQuit }) {
  const st = STAGES[stageIndex];
  const g = G(); const lv = g.lv;
  const ratio = kaishinRatio(lv);
  const has = id => carry.includes(id);
  const B = {
    hearts: maxHearts(lv) + (has('heart') ? 1 : 0), maxH: maxHearts(lv) + (has('heart') ? 1 : 0),
    timeMul: has('suna') ? SUNA : 1,
    omamori: has('omamori') ? 1 : 0, hint: has('hint') ? 1 : 0, tsurugi: has('tsurugi') ? 1 : 0,
    qs: makeStageQuestions(S.grade, stageIndex, nigateList()),
    phase: 'zako', zi: 0, bi: 0, bossHp: BOSS_HP,
    cur: null, stats: { defeated: 0, kaishin: 0, hurt: 0, exp: 0, found: [], newNig: [], grad: 0 },
    paused: { hidden: false, blur: false, quit: false }, ended: false,
  };
  S.active = { grade: S.grade, carry: [...carry] }; save();

  // ---------- 画面 ----------
  const isDark = st.id === 'doukutsu';
  stage.innerHTML = `<div class="scr battle st-${st.id}" style="background:linear-gradient(${st.sky[0]},${st.sky[1]} 46%)">
    ${st.id === 'doukutsu' ? '' : sun(st.id === 'shiro' ? 960 : 1010, st.id === 'shiro' ? 150 : 84, st.id === 'shiro' ? 140 : 110)}
    ${isDark ? '<div class="a stk s" style="left:280px;top:110px;font-size:40px;opacity:.8">💎</div><div class="a stk s" style="left:820px;top:90px;font-size:34px;opacity:.7">💎</div><div class="a stk s" style="left:520px;top:160px;font-size:28px;opacity:.6">✨</div>'
      : '<div class="a drift" style="left:330px;top:100px"><div class="paper" style="width:150px;height:46px;border-radius:30px"></div></div><div class="a drift" style="left:760px;top:60px;animation-duration:19s"><div class="paper" style="width:110px;height:36px;border-radius:30px"></div></div>'}
    ${st.id === 'shiro' ? '<div class="a stk" style="left:760px;top:120px;font-size:150px;opacity:.55;filter:grayscale(.3)">🏯</div>' : ''}
    ${battleLand(st)}
    <div class="a stk s" style="left:300px;top:${isDark ? 300 : 440}px;font-size:30px">${st.deco[0]}</div>
    <div class="a stk s" style="left:860px;top:450px;font-size:30px">${st.deco[1]}</div>
    <div class="a stk" style="left:1070px;top:262px;font-size:96px">${st.deco[3]}</div>
    <div class="under"><div class="tip" style="color:${isDark ? 'rgba(255,255,255,.35)' : 'rgba(0,0,0,.28)'}">Enter キーでも こうげき できるよ</div></div>

    <div class="hud">
      <div class="box paper hearts" id="hearts"></div>
      <div class="box paper prog" id="prog"></div>
      <div class="sp"></div>
      <div id="itembtns" style="display:flex;gap:10px"></div>
      <button class="pill" id="quit" style="height:60px;color:var(--sub);padding:6px 18px">やめる</button>
    </div>
    <div class="kaishin-tape" style="left:${Math.round(SPAWN - (SPAWN - CONTACT) * ratio - 20)}px"><span>かいしん</span></div>
    <div class="a steps" id="steps"></div>
    <div class="shadow" style="left:92px;top:356px;width:170px"></div>
    <div class="herowrap" id="hero">${heroHTML(lv, .95, 'bob')}</div>
    <div class="a" style="left:118px;top:376px;background:#fff;border-radius:12px;padding:2px 12px;font-weight:900;font-size:16px;box-shadow:0 3px 0 #E2D4B6;z-index:4">ヨミ <span style="color:var(--sub)">Lv${lv}</span></div>
    <div class="shadow" id="eshadow" style="left:0;top:358px;width:170px"></div>
    <div id="enemyslot"></div>
    <div class="inrow">
      <input class="yomi-in" id="yomi" type="text" lang="ja" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false" enterkeyhint="go" placeholder="よみを 入れる">
      <button class="b" id="atk"><span class="stk s" style="font-size:30px">⚔️</span>こうげき</button>
      <button class="b shiro sm" id="idk">わからない</button>
    </div>
    <div id="saybox"></div>
    <div class="redflash" id="flash"></div>
    <div id="bannerbox"></div>
    <div id="coverbox"></div>
  </div>`;
  const root = stage.firstElementChild;
  const input = $(root, '#yomi');
  const focus = () => { try { input.focus({ preventScroll: true }); } catch { input.focus(); } };
  focus(); // 「しゅつじん」のタップの中で呼ぶ → iPad でもキーボードが出る

  // 入力欄からフォーカスを外さない（ボタンを押してもキーボードが閉じないように）
  root.addEventListener('mousedown', e => { if (e.target !== input) e.preventDefault(); });

  // 足あと（のこりのきょり）
  const steps = $(root, '#steps');
  steps.innerHTML = Array.from({ length: 18 }, (_, i) => `<span style="left:${CONTACT + 40 + i * 36}px;top:${348 + (i % 2 ? 6 : -2)}px;background:rgba(80,60,30,.22)"></span>`).join('');
  const stepEls = [...steps.children];

  function drawHearts(lost = -1) {
    $(root, '#hearts').innerHTML = Array.from({ length: B.maxH }, (_, i) =>
      `<span class="stk s ${i >= B.hearts ? 'off' : ''} ${i === lost ? 'lose' : ''}">❤️</span>`).join('');
  }
  function drawProg() {
    const p = $(root, '#prog');
    if (B.phase === 'zako') {
      p.innerHTML = Array.from({ length: ZAKO }, (_, i) => `<span class="d ${i < B.zi ? 'on' : ''} ${i === B.zi ? 'now' : ''}"></span>`).join('') +
        `<span class="stk s" style="font-size:30px;margin-left:4px">👑</span>`;
    } else {
      p.innerHTML = `<span class="stk s" style="font-size:30px">${st.boss.e}</span><b style="font-size:18px;margin:0 6px">${st.boss.name}</b>
        <span class="bosshp">${Array.from({ length: BOSS_HP }, (_, i) => `<span class="stk s ${i >= B.bossHp ? 'off' : ''}">🔥</span>`).join('')}</span>`;
    }
  }
  function drawItems() {
    const box = $(root, '#itembtns'); const out = [];
    if (has('hint')) out.push(`<button class="pill ${B.hint ? '' : 'used'}" id="hintbtn" style="height:60px"><span class="stk s" style="font-size:28px">📜</span>ヒント</button>`);
    if (has('omamori')) out.push(`<span class="pill ${B.omamori ? '' : 'used'}" style="height:60px;cursor:default"><span class="stk s" style="font-size:28px">🛡️</span>おまもり</span>`);
    if (has('tsurugi')) out.push(`<span class="pill ${B.tsurugi ? '' : 'used'}" style="height:60px;cursor:default"><span class="stk s" style="font-size:28px">🗡️</span>つるぎ</span>`);
    if (has('suna')) out.push(`<span class="pill" style="height:60px;cursor:default"><span class="stk s" style="font-size:28px">⏳</span></span>`);
    box.innerHTML = out.join('');
    const hb = $(root, '#hintbtn'); if (hb) hb.onclick = () => { useHint(); focus(); };
  }
  drawHearts(); drawProg(); drawItems();

  function say(text, cls = '') {
    $(root, '#saybox').innerHTML = text ? `<div class="say ${cls}">${text}</div>` : '';
  }
  function pop(text, x, y, color = 'var(--ink)', size = 44) {
    const d = document.createElement('div'); d.className = 'pop';
    d.style.cssText = `left:${x}px;top:${y}px;color:${color};font-size:${size}px`; d.textContent = text;
    root.appendChild(d); setTimeout(() => d.remove(), 1200);
  }
  function banner(text, ms = 1400) {
    $(root, '#bannerbox').innerHTML = `<div class="banner"><div>${text}</div></div>`;
    setTimeout(() => { $(root, '#bannerbox').innerHTML = ''; }, ms);
  }

  // ---------- 敵 ----------
  function spawn() {
    const boss = B.phase === 'boss';
    const list = boss ? B.qs.boss : B.qs.zako;
    const q = boss ? list[B.bi % list.length] : list[B.zi];
    const T = st.base * (boss ? BOSS_SPEED : 1) * B.timeMul + Math.max(0, len(q.yomi) - 3) * 0.6;
    const mons = st.mons; const mon = boss ? st.boss.e : mons[Math.floor(Math.random() * mons.length)];
    const fs = len(q.kanji) <= 2 ? 70 : len(q.kanji) === 3 ? 60 : 50;
    $(root, '#enemyslot').innerHTML = `<div class="enemy appear ${boss ? 'boss' : ''}" id="enemy" style="top:${boss ? 112 : 138}px">
      <div class="bodywrap"><div class="fuda kanji" style="font-size:${boss ? fs - 4 : fs}px">${q.kanji}${q.nigate ? '<span class="nig">にがて</span>' : ''}</div>
      <div class="bubble" id="bubble"></div>
      <div class="mon stk">${mon}</div></div></div>`;
    B.cur = { q, T, t: 0, state: 'appear', boss, el: $(root, '#enemy'), x: SPAWN, attacked: false };
    place(SPAWN);
    input.value = ''; input.classList.remove('retry'); input.placeholder = 'よみを 入れる'; say('');
    drawProg();
  }
  function place(x) {
    const c = B.cur; if (!c) return; c.x = x;
    c.el.style.transform = `translateX(${x - ENEMY_W / 2}px)`;
    $(root, '#eshadow').style.left = (x - 85) + 'px';
    stepEls.forEach((s, i) => { const sx = CONTACT + 40 + i * 36; s.style.opacity = sx < x - 70 ? 1 : 0; });
  }
  function bubble(html, color) {
    const b = $(root, '#bubble'); if (!b) return;
    b.innerHTML = html ? `<span style="position:absolute;left:50%;top:-70px;transform:translateX(-50%);background:${color};color:#fff;font-weight:900;font-size:30px;
      padding:6px 18px;border-radius:14px;white-space:nowrap;letter-spacing:.06em;box-shadow:0 4px 0 rgba(0,0,0,.18);font-family:'Zen Maru Gothic'">${html}</span>` : '';
  }

  // ---------- 時間 ----------
  let last = performance.now();
  const isPaused = () => B.paused.hidden || B.paused.blur || B.paused.quit || B.ended || portrait();
  const tick = setInterval(() => {
    const now = performance.now(); const dt = Math.min(.1, (now - last) / 1000); last = now;
    const c = B.cur; if (!c || isPaused()) return;
    if (c.state === 'appear') {
      c.t += dt; if (c.t >= APPEAR) { c.state = 'walk'; c.t = 0; c.el.classList.remove('appear'); c.el.classList.add('walk'); }
    } else if (c.state === 'walk') {
      c.t += dt; const p = Math.min(1, c.t / c.T);
      place(SPAWN - (SPAWN - CONTACT) * p);
      if (p >= 1) attacked('time');
    }
  }, 33);

  // ---------- 入力 ----------
  let composing = false;
  input.addEventListener('compositionstart', () => composing = true);
  input.addEventListener('compositionend', () => composing = false);
  input.addEventListener('keydown', e => {
    if (e.key === 'Enter' && !e.isComposing && !composing && e.keyCode !== 229) { e.preventDefault(); submit(); }
  });
  $(root, '#atk').onclick = () => { submit(); focus(); };
  $(root, '#idk').onclick = () => { const c = B.cur; if (c && (c.state === 'walk' || c.state === 'appear')) attacked('idk'); focus(); };
  $(root, '#quit').onclick = () => askQuit();

  function submit() {
    const c = B.cur; if (!c || isPaused()) return;
    if (!['appear', 'walk', 'retry'].includes(c.state)) return;
    const r = check(input.value, c.q);
    if (r === 'empty') return;
    if (r === 'kanji') { say('ひらがなで 入れてね', 'blue'); return; }
    if (r === 'partial') { say('さいごまで 打ってね', 'blue'); return; }
    if (r === 'ok') { c.state === 'retry' ? defeat(false, true) : defeat(c.t < c.T * ratio || c.state === 'appear', false); return; }
    // まちがい
    if (c.state === 'retry') {
      sfx.wrong(); input.classList.remove('bad'); void input.offsetWidth; input.classList.add('bad');
      say(`もういちど。せいかいは「${c.q.yomi}」`, 'red'); input.value = ''; return;
    }
    attacked('ng');
  }

  function useHint() {
    const c = B.cur; if (!B.hint || !c || !['appear', 'walk'].includes(c.state)) return;
    B.hint = 0; drawItems(); sfx.item();
    bubble(`${Array.from(c.q.yomi)[0]}……`, 'var(--ai)');
  }

  // ---------- 攻撃を受ける ----------
  function attacked(reason) {
    const c = B.cur; c.state = 'retry'; c.attacked = true;
    c.el.classList.remove('walk', 'appear'); place(CONTACT);
    const hero = $(root, '#hero');
    if (B.omamori) {
      B.omamori = 0; drawItems(); sfx.block();
      pop('🛡️ おまもりが まもった！', 260, 120, 'var(--ai)', 34);
    } else {
      B.hearts--; B.stats.hurt++; sfx.hurt();
      hero.classList.remove('hurt'); void hero.offsetWidth; hero.classList.add('hurt');
      const f = $(root, '#flash'); f.classList.remove('on'); void f.offsetWidth; f.classList.add('on');
      drawHearts(B.hearts);
      pop(reason === 'ng' ? 'ちがう！ −1' : reason === 'idk' ? '−1' : 'こうげきを うけた！', 230, 110, 'var(--shu)', 36);
    }
    // にがてに入れる（もうにがての字なら つづけて正解の数を0に）
    const already = !!G().nigate[c.q.kanji];
    markNigate(c.q); save();
    if (!already && !B.stats.newNig.some(q => q.kanji === c.q.kanji)) B.stats.newNig.push(c.q);
    if (B.hearts <= 0) { setTimeout(() => end(false), 900); return; }
    bubble(c.q.yomi, 'var(--shu)');
    input.value = ''; input.classList.add('retry'); input.placeholder = c.q.yomi + ' と 打とう';
    say(`せいかいは「${c.q.yomi}」。打って たおそう！`, 'red');
  }

  // ---------- たおす ----------
  function defeat(kaishin, retry) {
    const c = B.cur; c.state = 'dead';
    let exp = retry ? EXP.retry : kaishin ? EXP.kaishin : EXP.ok;
    if (!retry && !c.attacked && G().nigate[c.q.kanji]) {
      if (nigateCorrect(c.q)) { B.stats.grad++; exp += EXP.graduate; setTimeout(() => pop('📕 にがて そつぎょう！', 590, 60, 'var(--ai)', 32), 400); }
      save();
    }
    B.stats.exp += exp;
    if (kaishin) { B.stats.kaishin++; sfx.kaishin(); } else sfx.hit();
    const hero = $(root, '#hero'); hero.classList.add('attack'); setTimeout(() => hero.classList.remove('attack'), 160);
    say(''); input.value = ''; input.classList.remove('retry'); input.placeholder = 'よみを 入れる';

    if (c.boss) {
      let dmg = kaishin ? kaishinDamage(lv) : 1;
      if (B.tsurugi) { B.tsurugi = 0; dmg *= 2; drawItems(); pop('🗡️ ちからのつるぎ！', c.x, 40, 'var(--kin-d)', 30); }
      B.bossHp = Math.max(0, B.bossHp - dmg); drawProg();
      pop(`${kaishin ? 'かいしん！ ' : ''}−${dmg}`, c.x, 70, kaishin ? 'var(--kin-d)' : 'var(--shu)', kaishin ? 52 : 44);
      if (B.bossHp <= 0) {
        c.el.classList.remove('walk'); c.el.classList.add('dead'); B.stats.defeated++;
        B.stats.found.push(ITEM_IDS[Math.floor(Math.random() * ITEM_IDS.length)]);
        setTimeout(() => banner(`${st.boss.name}を たおした！`, 1600), 300);
        setTimeout(() => end(true), 1900);
        return;
      }
      // はじきとばされて、次の漢字でまた歩いてくる
      c.el.classList.remove('walk'); c.el.style.transition = 'transform .45s cubic-bezier(.2,.8,.3,1)'; place(SPAWN);
      B.bi++;
      setTimeout(() => { if (B.ended) return; c.el.style.transition = ''; spawn(); }, 600);
      return;
    }
    c.el.classList.remove('walk', 'appear'); c.el.classList.add('dead'); B.stats.defeated++;
    pop(kaishin ? 'かいしん！' : 'たおした！', c.x, 70, kaishin ? 'var(--kin-d)' : 'var(--shu)', kaishin ? 56 : 44);
    if (Math.random() < (kaishin ? DROP_KAISHIN : DROP)) {
      B.stats.found.push(ITEM_IDS[Math.floor(Math.random() * ITEM_IDS.length)]);
      setTimeout(() => { sfx.item(); pop('🎁 なにか ひろった！', 590, 120, 'var(--ink)', 30); }, 350);
    }
    B.zi++; drawProg();
    setTimeout(() => {
      if (B.ended) return;
      if (B.zi >= ZAKO) {
        B.phase = 'boss'; B.cur = null; $(root, '#enemyslot').innerHTML = ''; drawProg(); sfx.boss();
        banner(`${st.boss.e} ボスが あらわれた！`, 1500);
        setTimeout(() => { if (!B.ended) spawn(); }, 1500);
      } else spawn();
    }, 750);
  }

  // ---------- 止める ----------
  const onVis = () => { B.paused.hidden = document.hidden; last = performance.now(); };
  document.addEventListener('visibilitychange', onVis);
  input.addEventListener('blur', () => {
    if (B.ended || B.paused.quit) return;
    B.paused.blur = true;
    $(root, '#coverbox').innerHTML = `<div class="cover"><button class="b kin" id="resume" style="height:90px;font-size:30px">▶ ここをタップして つづける</button></div>`;
    $(root, '#resume').onclick = () => { $(root, '#coverbox').innerHTML = ''; B.paused.blur = false; last = performance.now(); focus(); };
  });
  input.addEventListener('focus', () => { window.scrollTo(0, 0); });

  function askQuit() {
    B.paused.quit = true;
    $(root, '#coverbox').innerHTML = `<div class="veil"><div class="sheet" style="width:620px;text-align:center">
      <h2>やめる？</h2><p class="sub" style="font-size:20px;line-height:1.8">やめると このステージの けいけんちと<br>ひろったアイテムは もらえないよ。<br>（もってきたアイテムは かえってくる）</p>
      <div style="display:flex;gap:18px;justify-content:center;margin-top:20px"><button class="b shiro" id="q-yes">やめる</button><button class="b kin" id="q-no">つづける</button></div></div></div>`;
    $(root, '#q-no').onclick = () => { $(root, '#coverbox').innerHTML = ''; B.paused.quit = false; last = performance.now(); focus(); };
    $(root, '#q-yes').onclick = () => {
      cleanup();
      const back = [];
      if (B.omamori) back.push('omamori'); if (has('hint') && B.hint) back.push('hint'); if (B.tsurugi) back.push('tsurugi');
      if (B.phase === 'zako' && B.zi === 0 && !B.cur?.attacked) { if (has('heart')) back.push('heart'); if (has('suna')) back.push('suna'); }
      back.forEach(id => addItem(id));
      S.active = null; save(); onQuit();
    };
  }

  function cleanup() { B.ended = true; clearInterval(tick); document.removeEventListener('visibilitychange', onVis); input.blur(); }

  function end(clear) {
    if (B.ended) return; cleanup();
    clear ? sfx.win() : sfx.lose();
    let gain = B.stats.exp + (clear ? EXP.boss + EXP.clear : 0);
    const lvBefore = G().lv;
    const ups = addExp(gain);
    // ひろったもの
    const found = B.stats.found.map(id => ({ id, ok: addItem(id) }));
    // 使わなかったアイテムを返す（ハートのかけら・すなどけいは入ったときに使った）
    if (B.omamori) addItem('omamori'); if (has('hint') && B.hint) addItem('hint'); if (B.tsurugi) addItem('tsurugi');
    let stars = 0;
    if (clear) {
      stars = 1 + (B.hearts >= Math.ceil(B.maxH / 2) ? 1 : 0) + (B.stats.kaishin >= 4 ? 1 : 0);
      const gg = G(); gg.clear[st.id] = Math.max(gg.clear[st.id] || 0, stars);
    }
    S.active = null; save();
    onEnd({ clear, stageIndex, stars, gain, ups, lvBefore, found, newNig: B.stats.newNig, grad: B.stats.grad,
      defeated: B.stats.defeated, kaishin: B.stats.kaishin, hearts: B.hearts });
  }

  function portrait() { return window.innerHeight > window.innerWidth && matchMedia('(pointer:coarse)').matches; }

  spawn();
  // 確認用
  return { B, submit: v => { input.value = v; submit(); }, answer: () => B.cur && B.cur.q.yomi, end };
}
