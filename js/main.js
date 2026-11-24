// よみバトル：画面の切りかえ（タイトル → 学年 → 場所えらび → かばん → 闘い → 結果）
import { STAGES, ITEMS, ITEM_IDS, CARRY, LV_MAX, needExp, maxHearts } from './config.js';
import { S, G, save, hasSave, canSave, returnActive, resetAll, nigateList } from './state.js';
import { heroHTML, titleLand, islandSVG, hanamaru, moosukoshi, sun, gearText } from './art.js';
import { startBattle } from './battle.js';
import { sfx, unlock } from './sound.js';

const stage = document.getElementById('stage');
const $ = q => stage.querySelector(q);
let battle = null;

// ---------- 画面に合わせて縮める（キーボードが出ても大きさは変えない） ----------
let lastW = 0;
function fit(force) {
  const W = document.documentElement.clientWidth, H = document.documentElement.clientHeight;
  if (!force && W === lastW) return; lastW = W;
  const s = Math.min(W / 1180, H / 820);
  stage.style.transform = `translate(${(W - 1180 * s) / 2}px,${(H - 820 * s) / 2}px) scale(${s})`;
}
addEventListener('resize', () => fit());
addEventListener('orientationchange', () => setTimeout(() => fit(true), 300));
fit(true);
if (matchMedia('(pointer:coarse)').matches) document.getElementById('rotate').classList.add('ipad');
// iPad でキーボードが出たときに画面がずれたら戻す
if (window.visualViewport) visualViewport.addEventListener('scroll', () => { if (window.scrollY) window.scrollTo(0, 0); });

// 音はタップで起こす
document.addEventListener('pointerdown', unlock, { once: true });
// 押したときの小さな音
stage.addEventListener('click', e => { if (e.target.closest('button') && !e.target.closest('#atk')) sfx.tap(); });

// 闘い中に閉じていたら、持っていったアイテムを返す
returnActive();

const stars = n => '★'.repeat(n) + `<i>${'★'.repeat(3 - n)}</i>`;
const LOGO_COLORS = ['#EF5A3C', '#F4B53F', '#3C6FD8', '#3FA36B', '#E86FA3'];

// ---------- タイトル ----------
function title() {
  battle = null;
  stage.innerHTML = `<div class="scr" style="background:linear-gradient(#BFE6F5,#EAF6EE 70%)">
    ${sun(930, 44, 150)}
    <div class="a drift" style="left:200px;top:70px"><div class="paper" style="width:170px;height:56px;border-radius:40px"></div></div>
    <div class="a drift" style="left:640px;top:150px;animation-duration:18s"><div class="paper" style="width:120px;height:42px;border-radius:30px"></div></div>
    ${titleLand()}
    <div class="a logo" style="left:0;right:0;top:170px">${[...'よみバトル'].map((c, i) =>
      `<div style="background:${LOGO_COLORS[i]};transform:rotate(${[-6, 4, -3, 5, -4][i]}deg) translateY(${[0, -8, 4, -6, 2][i]}px);animation-delay:${i * .07}s">${c}</div>`).join('')}</div>
    <div class="a" style="left:0;right:0;top:336px;text-align:center;font-weight:900;font-size:26px;letter-spacing:.3em;color:#2d5a2a">かんじの よみで たたかえ！</div>
    <div class="a" style="left:150px;top:350px">${heroHTML(hasSave() ? G().lv : 3, 1.25, 'bob')}</div>
    <div class="shadow" style="left:150px;top:600px;width:170px"></div>
    <div class="a hop" style="left:860px;top:380px;text-align:center;width:220px"><div class="fuda" style="font-size:58px">漢字</div><div class="stk" style="font-size:120px;margin-top:10px">🐗</div></div>
    <div class="shadow" style="left:880px;top:612px;width:180px"></div>
    <div class="a stk s" style="left:700px;top:560px;font-size:44px">🌼</div>
    <div class="a stk s" style="left:420px;top:600px;font-size:38px">🌱</div>
    <div class="a" style="left:0;right:0;top:640px;display:flex;justify-content:center;gap:22px">
      <button class="b" id="go" style="height:88px;font-size:34px;padding:0 64px;border-radius:26px">${hasSave() ? 'つづきから' : 'はじめる'}</button>
    </div>
    ${hasSave() ? `<button class="a pill" id="setting" style="right:34px;top:30px">⚙️ せってい</button><div class="a pill" style="left:34px;top:30px;cursor:default">🏫 ${S.grade}年</div>` : ''}
  </div>`;
  $('#go').onclick = () => hasSave() ? map() : gradeSelect(true);
  const st = $('#setting'); if (st) st.onclick = () => settings(title);
}

// ---------- 学年えらび ----------
function gradeSelect(first) {
  stage.innerHTML = `<div class="scr" style="background:#F6EFDF">
    <div class="a" style="inset:0;background-image:linear-gradient(#E4DAC4 1px,transparent 1px),linear-gradient(90deg,#E4DAC4 1px,transparent 1px);background-size:40px 40px;opacity:.6"></div>
    <div class="a" style="left:0;right:0;top:70px;text-align:center;font-size:44px;font-weight:900">なん年生？</div>
    <div class="a" style="left:0;right:0;top:136px;text-align:center;font-size:20px;color:var(--sub)">その学年までに習う 漢字が 出てくるよ。${first ? 'あとで「せってい」から かえられるよ。' : 'きろくは 学年ごとに のこるよ。'}</div>
    ${[4, 5, 6].map((n, i) => `<button class="gradecard" data-g="${n}" style="left:${120 + i * 340}px;top:250px;transform:rotate(${[-2, 1.5, -1][i]}deg)">
      <div class="tape" style="left:110px;top:-14px;width:80px;height:28px;transform:rotate(${[3, -4, 2][i]}deg)"></div>
      <div class="n" style="color:${['#3FA36B', '#3C6FD8', '#EF5A3C'][i]}">${n}<span style="font-size:44px">年</span></div>
      <div class="ex">${['観察 季節', '貿易 興味', '宇宙 砂糖'][i]}</div>
      ${S.g[n] ? `<div style="font-size:16px;color:var(--sub);font-weight:700">ヨミ Lv${S.g[n].lv}</div>` : ''}
    </button>`).join('')}
    ${first ? '' : '<button class="a b shiro sm" id="back" style="left:40px;top:40px">もどる</button>'}
  </div>`;
  stage.querySelectorAll('.gradecard').forEach(b => b.onclick = () => { S.grade = +b.dataset.g; G(); save(); map(); });
  const bk = $('#back'); if (bk) bk.onclick = () => map();
}

// ---------- 場所えらび ----------
const NODES = [{ x: 420, y: 560, s: 136 }, { x: 676, y: 342, s: 156 }, { x: 880, y: 228, s: 136 }, { x: 996, y: 70, s: 136 }];
function map() {
  battle = null;
  const g = G();
  const open = i => i === 0 || !!g.clear[STAGES[i - 1].id];
  const now = Math.max(0, STAGES.findIndex((s, i) => open(i) && !g.clear[s.id]));
  const nowIdx = STAGES.every(s => g.clear[s.id]) ? -1 : now;
  const itemsN = ITEM_IDS.reduce((a, k) => a + g.items[k], 0);
  const nextNeed = g.lv >= LV_MAX ? 0 : needExp(g.lv) - g.exp;
  stage.innerHTML = `<div class="scr" style="background:#9AD3EC">
    ${islandSVG()}
    <div class="a paper" style="left:30px;top:34px;width:300px;height:752px;border-radius:14px;transform:rotate(-1.2deg);padding:34px 28px;text-align:center">
      <div class="tape" style="left:110px;top:-14px;width:90px;height:30px;transform:rotate(3deg)"></div>
      <div style="display:flex;justify-content:center">${heroHTML(g.lv, .95, 'bob')}</div>
      <div style="font-weight:900;font-size:30px;margin-top:8px">ヨミ <span style="color:var(--sub);font-size:22px">Lv ${g.lv}</span></div>
      <div style="height:18px;border-radius:9px;background:#EADFC8;margin:14px 4px 4px;overflow:hidden"><i style="display:block;width:${g.lv >= LV_MAX ? 100 : Math.round(g.exp / needExp(g.lv) * 100)}%;height:100%;background:linear-gradient(90deg,var(--kin),#FFD36B);border-radius:9px"></i></div>
      <div style="font-size:14px;color:var(--sub)">${g.lv >= LV_MAX ? 'さいこうレベル！' : `つぎのレベルまで あと${nextNeed}`}</div>
      <div style="margin:16px 0 6px;display:flex;justify-content:center;gap:2px;flex-wrap:wrap">${'<span class="stk s" style="font-size:26px">❤️</span>'.repeat(maxHearts(g.lv))}</div>
      <div style="text-align:left;margin:18px 6px 0;font-size:19px;line-height:2.3;border-top:2px dashed var(--line);padding-top:10px">
        <div class="row"><span>📕 にがて</span><b>${Object.keys(g.nigate).length}</b></div>
        <div class="row"><span>🎓 そつぎょう</span><b>${g.graduated}</b></div>
        <div class="row"><span>🏫 学年</span><b>${S.grade}年</b></div></div>
      <button class="b kin" id="bag" style="width:100%;margin-top:18px"><span class="stk s" style="font-size:30px">🎒</span>かばん <span style="font-size:18px;opacity:.7">${itemsN}</span></button>
      <div style="display:flex;justify-content:center;gap:10px;margin-top:20px"><button class="pill" id="setting" style="font-size:16px;white-space:nowrap">⚙️ せってい</button><button class="pill" id="nigate" style="font-size:16px;white-space:nowrap">📕 にがて</button></div>
    </div>
    ${STAGES.map((s, i) => {
      const n = NODES[i]; const o = open(i); const cl = g.clear[s.id] || 0;
      if (!o) return `<div class="node lock" style="left:${n.x + 10}px;top:${n.y}px"><div class="disk" style="width:116px;height:116px"><span class="stk s" style="font-size:50px">🔒</span></div>
        <div style="font-weight:900;color:#fff;margin-top:8px;text-shadow:0 2px 0 #0003">${s.name}</div></div>`;
      return `<button class="node ${i === nowIdx ? 'now' : ''}" data-i="${i}" style="left:${n.x}px;top:${n.y}px">
        ${i === nowIdx ? `<div style="position:absolute;left:${n.s / 2 - 26}px;top:-70px;font-size:52px" class="stk bob">📍</div>` : ''}
        <div class="disk" style="width:${n.s}px;height:${n.s}px"><span class="stk" style="font-size:${n.s * .56}px">${s.icon}</span></div>
        <div class="lab"><span class="pill" style="${i === nowIdx ? 'background:var(--kin);box-shadow:0 3px 0 var(--kin-d)' : ''}">${s.name} ${cl ? `<span class="stars">${stars(cl)}</span>` : i === nowIdx ? '　いまここ' : ''}</span></div></button>`;
    }).join('')}
    <div class="a stk s" style="left:560px;top:470px;font-size:40px">🌼</div>
    <div class="a stk s" style="left:830px;top:510px;font-size:46px">🍄</div>
    <div class="a stk s" style="left:1040px;top:250px;font-size:48px">🦇</div>
    <div class="a stk bob" style="left:400px;top:80px;font-size:60px">⛵</div>
    <div class="a stk s" style="left:1090px;top:700px;font-size:44px">🐟</div>
    ${nowIdx === -1 ? '<div class="a pill" style="left:560px;top:30px;font-size:22px;cursor:default">🎉 ぜんぶ クリア！ ★をあつめよう</div>' : ''}
    ${canSave ? '' : '<div class="a pill" style="left:400px;top:760px;cursor:default;color:var(--shu)">⚠ きろくが のこらない せっていです</div>'}
    <div id="over"></div>
  </div>`;
  stage.querySelectorAll('.node[data-i]').forEach(b => b.onclick = () => bag(+b.dataset.i));
  $('#bag').onclick = () => bag(-1);
  $('#setting').onclick = () => settings(map);
  $('#nigate').onclick = () => nigateNote();
}

// ---------- かばん（もちもの） ----------
function bag(stageIndex) {
  const g = G(); const sel = [];
  const st = STAGES[stageIndex];
  const draw = () => {
    $('#over').innerHTML = `<div class="veil"><div class="sheet" style="width:1000px">
      <div class="tape" style="left:450px;top:-14px;width:100px;height:30px;transform:rotate(-2deg)"></div>
      ${st ? `<h2><span class="stk s" style="font-size:38px">${st.icon}</span> ${st.name}へ　なにを もっていく？</h2>
        <div class="sub">2つまで えらべるよ（つかうと なくなる）。ザコ6体のあと ボス <span class="emo">${st.boss.e}</span> ${st.boss.name}</div>`
        : `<h2>🎒 かばん</h2><div class="sub">闘いで ひろったアイテム。ステージに入るときに 2つまで もっていける（1しゅるい ${3}こまで）</div>`}
      <div class="itemgrid">${ITEM_IDS.map(id => { const it = ITEMS[id]; const n = g.items[id];
        return `<button class="itemcard ${n ? '' : 'zero'} ${sel.includes(id) ? 'on' : ''}" data-id="${id}"><span class="ct">${n}</span>
          <div class="stk e">${it.e}</div><div class="nm">${it.name}</div><div class="ds">${it.desc}</div></button>`; }).join('')}</div>
      ${ITEM_IDS.every(id => !g.items[id]) ? '<div class="sub" style="text-align:center;margin:-6px 0 14px">まだ もっていないよ。闘いで ひろえるよ</div>' : ''}
      <div style="display:flex;justify-content:space-between;align-items:center">
        <button class="b shiro sm" id="close">${st ? 'やめる' : 'とじる'}</button>
        ${st ? `<button class="b kin" id="sortie" style="height:84px;font-size:32px;padding:0 56px">しゅつじん！</button>` : ''}
      </div></div></div>`;
    stage.querySelectorAll('.itemcard').forEach(b => b.onclick = () => {
      if (!st) return;
      const id = b.dataset.id; if (!g.items[id]) return;
      const k = sel.indexOf(id); if (k >= 0) sel.splice(k, 1); else if (sel.length < CARRY) sel.push(id); else { sel.shift(); sel.push(id); }
      draw();
    });
    $('#close').onclick = () => { $('#over').innerHTML = ''; };
    const so = $('#sortie'); if (so) so.onclick = () => go(stageIndex, sel);
  };
  draw();
}

// ---------- 闘いへ ----------
function go(stageIndex, carry) {
  const g = G();
  for (const id of carry) g.items[id]--;
  save();
  battle = startBattle(stage, {
    stageIndex, carry,
    onEnd: r => setTimeout(() => result(r), 200),
    onQuit: () => map(),
  });
  window.__battle = battle;
}

// ---------- ステージ結果 ----------
function result(r) {
  battle = null;
  const st = STAGES[r.stageIndex]; const g = G();
  const lvUp = r.ups.length > 0;
  stage.innerHTML = `<div class="scr" style="background:#F6EFDF">
    <div class="a" style="inset:0;background-image:linear-gradient(#E4DAC4 1px,transparent 1px),linear-gradient(90deg,#E4DAC4 1px,transparent 1px);background-size:40px 40px;opacity:.6"></div>
    <div class="a paper note-paper" style="left:56px;top:38px;width:680px;height:744px;border-radius:10px;transform:rotate(-.6deg);padding:40px 48px">
      <div class="tape" style="left:280px;top:-14px;width:110px;height:30px;transform:rotate(-2deg);background:var(--tape-b)"></div>
      <div style="display:flex;align-items:center;gap:10px">
        <div class="stampbox" style="margin:-24px -10px -20px -24px">${r.clear ? hanamaru() : moosukoshi()}</div>
        <div><div style="font-size:72px;font-weight:900;color:${r.clear ? 'var(--shu)' : 'var(--ai)'};letter-spacing:.04em;line-height:1">${r.clear ? 'クリア！' : 'もうすこし！'}</div>
        <div style="font-size:22px;color:var(--sub);margin-top:8px">${st.name}　${r.clear ? `<span class="stars">${stars(r.stars)}</span>` : 'ハートが なくなった'}</div></div>
      </div>
      <div style="font-size:26px;line-height:49px;margin-top:22px">
        <div class="row ln" style="animation-delay:.3s"><span>⚔️ たおした</span><b>${r.defeated}</b></div>
        <div class="row ln" style="animation-delay:.45s"><span>✨ かいしん</span><b>${r.kaishin}</b></div>
        <div class="row ln" style="animation-delay:.6s"><span>⭐ けいけんち</span><b style="color:var(--kin-d)">＋${r.gain}</b></div>
        ${r.grad ? `<div class="row ln" style="animation-delay:.75s"><span>🎓 にがて そつぎょう</span><b style="color:var(--ai)">${r.grad}</b></div>` : ''}
      </div>
      <div style="font-weight:900;margin:20px 0 12px;font-size:20px">ひろったもの ${r.found.length ? '<span style="color:var(--sub);font-weight:500;font-size:16px">タップして あけよう</span>' : ''}</div>
      <div style="display:flex;gap:16px;min-height:96px;flex-wrap:wrap;margin-bottom:34px">${r.found.length ? r.found.map((f, i) =>
        `<button class="gift closed" data-i="${i}"><span class="stk s" style="font-size:46px">🎁</span></button>`).join('') : '<div style="color:var(--sub);font-size:18px;line-height:96px">こんどは なにか ひろえるかも</div>'}</div>
      <div style="font-weight:900;margin:0 0 10px;font-size:20px">にがてになった漢字</div>
      <div style="display:flex;gap:12px;flex-wrap:wrap">${r.newNig.length ? r.newNig.slice(0, 6).map((q, i) =>
        `<div style="display:inline-flex;align-items:baseline;gap:12px;background:#fff;padding:6px 18px;border-radius:8px;box-shadow:0 8px 12px -8px #0005;transform:rotate(${i % 2 ? -1 : 1}deg)">
          <span class="kanji" style="font-size:34px">${q.kanji}</span><span style="font-size:20px;font-weight:700">${q.yomi}</span></div>`).join('')
        + (r.newNig.length > 6 ? `<span style="align-self:center;color:var(--sub)">ほか${r.newNig.length - 6}こ</span>` : '')
        : '<div style="font-size:22px;font-weight:900;color:var(--ai)">なし！ すごい</div>'}</div>
    </div>
    <div class="a" style="left:800px;top:${lvUp ? 70 : 110}px;width:320px;text-align:center">
      ${r.clear ? '<div class="a stk s" style="left:0;top:0;font-size:64px;transform:rotate(-14deg)">🎉</div><div class="a stk s" style="right:6px;top:40px;font-size:40px">✨</div>' : ''}
      <div style="display:flex;justify-content:center;margin-top:40px">${heroHTML(g.lv, 1.5, 'bob')}</div>
      ${lvUp ? `<div class="lvribbon" style="margin-top:22px">LEVEL UP!</div>
        <div style="font-size:26px;font-weight:900;margin-top:12px">Lv${r.lvBefore} → Lv${g.lv}</div>
        <div style="font-size:18px;margin-top:4px;line-height:1.6">${lvUpText(r.lvBefore, g.lv)}</div>`
        : `<div style="font-size:24px;font-weight:900;margin-top:22px">ヨミ Lv${g.lv}</div><div style="font-size:16px;color:var(--sub)">${g.lv >= LV_MAX ? 'さいこうレベル！' : `つぎのレベルまで あと${needExp(g.lv) - g.exp}`}</div>`}
    </div>
    <button class="a b kin" id="tomap" style="left:820px;top:${lvUp ? 650 : 640}px;width:280px">場所えらびへ</button>
    <button class="a b shiro sm" id="again" style="left:860px;top:${lvUp ? 744 : 734}px;width:200px">もういちど</button>
  </div>`;
  if (lvUp) setTimeout(() => sfx.levelup(), 700);
  stage.querySelectorAll('.gift').forEach(b => b.onclick = () => {
    if (b.classList.contains('open')) return;
    const f = r.found[+b.dataset.i]; const it = ITEMS[f.id];
    b.className = 'gift open'; b.innerHTML = `<span class="stk" style="font-size:54px">${it.e}</span><span class="full">${f.ok ? it.name : 'いっぱいで もてない'}</span>`;
    sfx.item();
  });
  $('#tomap').onclick = () => map();
  $('#again').onclick = () => { map(); bag(r.stageIndex); };
}
function lvUpText(a, b) {
  const out = [];
  for (let l = a + 1; l <= b; l++) {
    if ([3, 6, 9].includes(l)) out.push('❤️ ハートが1つ ふえた');
    if ([5, 10].includes(l)) out.push('✨ かいしんが つよくなった');
    const gt = gearText(l); if (gt) out.push(gt + ' を手に入れた');
  }
  out.push('かいしんの線が すこし近くなった');
  return out.join('<br>');
}

// ---------- にがてノート ----------
function nigateNote() {
  const list = nigateList();
  $('#over').innerHTML = `<div class="veil"><div class="sheet note-paper" style="width:900px;max-height:700px;overflow:auto">
    <h2>📕 にがてノート（${S.grade}年）</h2>
    <div class="sub">攻撃を うけた漢字。あとの闘いで 2回つづけて すぐ読めたら そつぎょう（いままで ${G().graduated}こ）</div>
    <div style="display:flex;gap:12px;flex-wrap:wrap;margin:22px 0">${list.length ? list.map(q =>
      `<div style="display:inline-flex;align-items:baseline;gap:12px;background:#fff;padding:6px 18px;border-radius:8px;box-shadow:0 6px 10px -8px #0005">
        <span class="kanji" style="font-size:34px">${q.kanji}</span><span style="font-size:20px;font-weight:700">${q.yomi}</span></div>`).join('')
      : '<div style="font-size:22px;font-weight:900;color:var(--ai)">にがては ありません！</div>'}</div>
    <button class="b shiro sm" id="close">とじる</button></div></div>`;
  $('#close').onclick = () => { $('#over').innerHTML = ''; };
}

// ---------- せってい ----------
function settings(back) {
  const host = $('#over') || (() => { const d = document.createElement('div'); d.id = 'over'; stage.firstElementChild.appendChild(d); return d; })();
  const draw = (confirm = 0) => {
    host.innerHTML = `<div class="veil"><div class="sheet" style="width:720px">
      <h2>⚙️ せってい</h2>
      <div style="margin-top:22px;font-weight:900">学年</div>
      <div style="display:flex;gap:14px;margin-top:10px">${[4, 5, 6].map(n => `<button class="b ${S.grade === n ? '' : 'shiro'} sm" data-g="${n}">${n}年</button>`).join('')}</div>
      <div class="sub" style="margin-top:6px">きろく（レベル・アイテム・にがて）は 学年ごとに のこるよ</div>
      <div style="margin-top:22px;font-weight:900">音</div>
      <div style="display:flex;gap:14px;margin-top:10px"><button class="b ${S.sound ? '' : 'shiro'} sm" id="son">🔊 あり</button><button class="b ${S.sound ? 'shiro' : ''} sm" id="soff">🔇 なし</button></div>
      <div style="margin-top:26px;font-weight:900">きろくを けす</div>
      <div style="display:flex;gap:14px;margin-top:10px;align-items:center">
        <button class="b ${confirm ? 'ai' : 'shiro'} sm" id="reset">${['ぜんぶ けす', 'ほんとうに けす？', 'もう1回 おすと きえる'][confirm]}</button>
        ${confirm ? '<span class="sub">すべての学年の きろくが なくなります</span>' : ''}</div>
      <div style="text-align:right;margin-top:24px"><button class="b kin sm" id="close">とじる</button></div></div></div>`;
    host.querySelectorAll('[data-g]').forEach(b => b.onclick = () => { S.grade = +b.dataset.g; G(); save(); draw(); });
    host.querySelector('#son').onclick = () => { S.sound = true; save(); draw(); };
    host.querySelector('#soff').onclick = () => { S.sound = false; save(); draw(); };
    host.querySelector('#reset').onclick = () => { if (confirm < 2) draw(confirm + 1); else { resetAll(); title(); } };
    host.querySelector('#close').onclick = () => { host.innerHTML = ''; back(); };
  };
  draw();
}

title();
// 確認用
window.__yomi = { S, G, save, map, title, result };
