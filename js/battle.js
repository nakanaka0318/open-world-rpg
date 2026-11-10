'use strict';
// ===== カードバトル (スレスパ風デッキ構築バトル) =====
// パーティ4人×固有5枚 + 共通5枚 = 25枚。毎ターン エナジー3・5枚ドロー・手札は全部捨てる。
// HPはパーティ全員の合計(共有)。敵は次の行動を予告し、ブロックでダメージを防ぐ。
const BG_DEF = {
  meadow: { sky: ['#5aa0e8', '#a8d8f8'], ground: ['#5aa83c', '#3f8530'], hill: '#4a9132' },
  forest: { sky: ['#2a5a3a', '#5a8a5a'], ground: ['#3f7a35', '#2a5a28'], hill: '#24532a', tree: true },
  desert: { sky: ['#e88a4a', '#f8d898'], ground: ['#e8c47a', '#c8a058'], hill: '#d8a860' },
  snow: { sky: ['#8ab0d8', '#e0ecf8'], ground: ['#eef3f9', '#c8d4e4'], hill: '#b8c8dc' },
  volcano: { sky: ['#3a1a1a', '#a83a1a'], ground: ['#4a3532', '#2a1c1a'], hill: '#5a2a20', lava: true },
  shrine: { sky: ['#2a3a2a', '#4a6a4a'], ground: ['#6d7488', '#4a5064'], hill: '#3a5a3a', cave: true },
  ruins: { sky: ['#1a1208', '#4a3a20'], ground: ['#b8914f', '#8e6e38'], hill: '#5a4020', cave: true },
  ice: { sky: ['#0a1a2a', '#2a5a7a'], ground: ['#a3d8ee', '#6fb5d8'], hill: '#4d93b8', cave: true },
  lava: { sky: ['#1a0808', '#5a1a10'], ground: ['#4a3532', '#2a1a18'], hill: '#3a2624', cave: true, lava: true },
  castle: { sky: ['#0a0614', '#2a1a40'], ground: ['#3a2f50', '#221a33'], hill: '#2c2440', cave: true },
  beach: { sky: ['#3ab0f0', '#b8f0ff'], ground: ['#f0dca0', '#d8bc78'], hill: '#2a8ad8' },
  crystal: { sky: ['#4a3a8a', '#c8b8f0'], ground: ['#b4a6d6', '#8a7ab8'], hill: '#8ad0f0' },
};
const ST_N = { str: '筋力', dex: '敏捷', vuln: '脆弱', weak: '脱力', poison: '毒', regen: '再生', thorns: 'トゲ', devote: '献身', serve: '奉仕' };
const ST_GOOD = { str: 1, dex: 1, regen: 1, thorns: 1, devote: 1, serve: 1 };
const HAND_MAX = 10, DRAW_N = 5, ENERGY_MAX = 3;

// 敵の行動 → 予告
function enemyIntent(e) {
  const d = e.d;
  let pool = d.act.slice();
  if (d.def >= 22 && !pool.some(a => a[0] === 'e_guard')) pool.push(['e_guard', 0.6]);
  if (e.boss && e.hp < e.max * 0.4) pool = pool.map(([k, w]) => [k, SKILLS[k] && SKILLS[k].target === 'enemies' ? w * 2 : w]);
  if (e.hp > e.max * 0.7) pool = pool.filter(([k]) => k !== 'e_heal');
  if (e.last) pool = pool.map(([k, w]) => [k, k === e.last && k !== 'attack' ? w * 0.4 : w]);
  const tot = pool.reduce((a, b) => a + b[1], 0);
  let r = Math.random() * tot, k = pool[0][0];
  for (const [kk, w] of pool) { r -= w; if (r <= 0) { k = kk; break; } }
  e.last = k;
  const m = e.mul || 1;
  const A = d.atk * 1.15 * m, M = d.mag * 1.05 * m, sk = SKILLS[k] || { n: '' };
  const I = { k, n: k === 'attack' ? 'こうげき' : k === 'e_guard' ? 'かまえる' : sk.n };
  switch (k) {
    case 'attack': I.dmg = A; break;
    case 'e_bite': I.dmg = A * 1.25; break;
    case 'e_poison': I.dmg = A * 0.7; I.poison = Math.max(2, Math.round(d.atk * m / 7)); break;
    case 'e_fire': case 'e_ice': case 'e_wind': case 'e_dark': I.dmg = M; break;
    case 'e_firebreath': case 'e_icebreath': I.dmg = M * 1.15; I.vuln = 1; break;
    case 'e_leaf': case 'e_darkwave': I.dmg = M * 1.15; I.weak = 1; break;
    case 'e_rock': I.dmg = A * 0.6; I.hits = 2; break;
    case 'e_root': I.dmg = A * 1.1; I.weak = 1; break;
    case 'e_smash': I.dmg = A * 1.6; break;
    case 'e_drain': I.dmg = A * 0.9; I.drain = true; break;
    case 'e_heal': I.heal = Math.round(e.max * 0.15); break;
    case 'e_charge': I.str = Math.max(2, Math.round(d.atk * 0.1 * m)); break;
    case 'e_guard': I.block = Math.round(d.def * 0.7 * m); break;
    default: I.dmg = A;
  }
  if (I.dmg) I.dmg = Math.max(1, Math.round(I.dmg));
  I.hits = I.hits || 1;
  return I;
}

const Battle = {
  active: false,
  async start(enemyIds, opts = {}) {
    this.opts = opts;
    this.active = true;
    this.t = 0; this.fx = []; this.turn = 0;
    const counts = {}, seen = {};
    enemyIds.forEach(id => counts[id] = (counts[id] || 0) + 1);
    this.enemies = enemyIds.map(id => {
      const d = ENEMIES[id];
      seen[id] = (seen[id] || 0) + 1;
      const mul = (opts.mul || 1) * enemyMul(id);
      const hp = Math.round((d.chp || d.hp) * mul);
      return { id, d, mul, n: d.n + (opts.tag ? opts.tag : '') + (counts[id] > 1 ? 'ABCD'[seen[id] - 1] : ''), hp, max: hp, block: 0, st: {}, alive: true, flash: 0, shake: 0, fade: 1, lunge: 0, boss: !!d.boss, x: 0, y: 0, w: 32, h: 32 };
    });
    // パーティ (共有HP)
    this.party = partyChars();
    const maxhp = this.party.reduce((a, c) => a + charStats(c).hp, 0);
    const hp = this.party.reduce((a, c) => a + Math.max(0, c.hp), 0);
    this.P = { hp: Math.max(1, hp), max: maxhp, block: 0, st: {}, gained: 0 };
    this.relics = this.party.filter(c => RELICS[c.id]).map(c => ({ id: c.id, L: c.lb || 0, r: RELICS[c.id] }));
    this.atkCount = 0;
    // デッキ
    const deck = [];
    for (let i = 0; i < 4; i++) { const c = this.party[i]; if (c) deck.push(...charCards(c.id)); else for (let k = 0; k < 5; k++) deck.push('blank'); }
    deck.push(...(G.deck || STARTER_DECK).slice(0, 5));
    while (deck.length < 25) deck.push('blank');
    this.uid = 0;
    this.drawPile = this.shuffle(deck.map(cid => ({ u: this.uid++, cid })));
    this.hand = []; this.discard = []; this.exhaust = [];
    this.energy = ENERGY_MAX; this.sel = -1; this.tgt = 0; this.targeting = false; this.busy = true;
    Sound.play('encounter');
    Game.scene = 'trans';
    await this.transition();
    Game.scene = 'battle';
    Sound.bgm(opts.boss ? 'boss' : 'battle');
    document.body.classList.add('in-battle');
    this.buildUI();
    this.layout();
    requestAnimationFrame(() => this.layout());
    const r = await this.run();
    this.cleanup();
    return r;
  },
  shuffle(a) { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; },
  transition() { return new Promise(res => { const el = U.el('div', 'enc-trans'); UI.root.appendChild(el); setTimeout(() => { el.remove(); res(); }, 620); }); },
  wait(ms) { return U.sleep(ms / (this.fast ? 2.2 : 1)); },

  // ---------- UI ----------
  buildUI() {
    const el = U.el('div', 'layer battle-layer cb');
    const top = U.el('div', 'cb-top');
    this.msgEl = U.el('div', 'cb-msg');
    const tools = U.el('div', 'btools');
    this.autoBtn = U.el('div', 'tbtn' + (this.auto ? ' on' : ''), 'AUTO');
    this.fastBtn = U.el('div', 'tbtn' + (this.fast ? ' on' : ''), '×2');
    this.runBtn = U.el('div', 'tbtn' + (this.opts.boss ? ' dis' : ''), 'にげる');
    this.autoBtn.onclick = e => { e.stopPropagation(); this.toggleAuto(); };
    this.fastBtn.onclick = e => { e.stopPropagation(); this.fast = !this.fast; this.fastBtn.classList.toggle('on', this.fast); Sound.play('cursor'); };
    this.runBtn.onclick = e => { e.stopPropagation(); this.tryEscape(); };
    tools.append(this.autoBtn, this.fastBtn, this.runBtn);
    top.append(this.msgEl, tools);
    this.enEl = U.el('div', 'cb-enemies');
    this.popEl = U.el('div', 'pops');
    this.panel = U.el('div', 'cb-panel');
    this.partyEl = U.el('div', 'cb-party');
    this.infoEl = U.el('div', 'cb-info');
    this.handEl = U.el('div', 'cb-hand');
    const btns = U.el('div', 'cb-btns');
    this.energyEl = U.el('div', 'cb-energy');
    this.drawBtn = U.el('div', 'cb-pile', '');
    this.discBtn = U.el('div', 'cb-pile', '');
    this.itemBtn = U.el('div', 'cb-pile', 'どうぐ');
    this.endBtn = U.el('div', 'cb-end', 'ターン終了');
    this.drawBtn.onclick = e => { e.stopPropagation(); this.viewPile('山札 (順番はシャッフル)', this.drawPile); };
    this.discBtn.onclick = e => { e.stopPropagation(); this.viewPile('捨て札', this.discard.concat(this.exhaust.map(x => Object.assign({ ex: 1 }, x)))); };
    this.itemBtn.onclick = e => { e.stopPropagation(); this.useItem(); };
    this.endBtn.onclick = e => { e.stopPropagation(); if (this.canAct()) this.endTurn(); };
    btns.append(this.energyEl, this.drawBtn, this.discBtn, this.itemBtn, this.endBtn);
    this.panel.append(this.partyEl, this.infoEl, this.handEl, btns);
    this.cutEl = U.el('div', 'cutin');
    el.append(top, this.enEl, this.popEl, this.panel, this.cutEl);
    // 敵のオーバーレイ
    this.enemies.forEach((e, i) => {
      const o = U.el('div', 'cb-en');
      o.innerHTML = '<div class="cbe-int"></div><div class="cbe-info"><div class="cbe-n"></div><div class="cbe-hp"><i></i><span></span></div><div class="cbe-st"></div></div>';
      o.onclick = ev => { ev.stopPropagation(); this.clickEnemy(i); };
      e.ov = o;
      this.enEl.appendChild(o);
    });
    this.layer = {
      el, handle: k => {
        if (this.onAny && (k === 'a' || k === 'b')) { this.onAny(); return; }
        if (!this.canAct()) { if (k === 'menu') this.toggleAuto(); return; }
        if (k === 'menu') { this.endTurn(); return; }
        if (this.targeting) {
          const al = this.aliveIdx();
          if (k === 'left' || k === 'right') { let j = al.indexOf(this.tgt); j = (j + (k === 'left' ? al.length - 1 : 1)) % al.length; this.tgt = al[j]; Sound.play('cursor'); this.refresh(); }
          else if (k === 'a') this.play(this.sel, this.tgt);
          else if (k === 'b') { this.targeting = false; Sound.play('cancel'); this.refresh(); }
          return;
        }
        if (k === 'left' || k === 'right') { if (!this.hand.length) return; this.sel = this.sel < 0 ? 0 : (this.sel + (k === 'left' ? this.hand.length - 1 : 1)) % this.hand.length; Sound.play('cursor'); this.refresh(); }
        else if (k === 'up') { if (this.sel < 0 && this.hand.length) { this.sel = 0; this.refresh(); } }
        else if (k === 'a') { if (this.sel < 0) { if (this.hand.length) { this.sel = 0; this.refresh(); } } else this.tapCard(this.sel); }
        else if (k === 'b' || k === 'down') { this.sel = -1; this.targeting = false; this.refresh(); }
      },
    };
    el.addEventListener('click', () => { if (this.onAny) this.onAny(); else if (this.canAct() && (this.sel >= 0)) { this.sel = -1; this.targeting = false; this.refresh(); } });
    UI.push(this.layer);
    this.refresh();
  },
  effCost(cid) { const c = cardCost(cid); return (c > 0 && this.P && this.P.st.free > 0) ? 0 : c; },
  canAct() { return !this.busy && !this.auto && !this.onAny && this.active; },
  aliveIdx() { return this.enemies.map((e, i) => i).filter(i => this.enemies[i].alive); },
  toggleAuto() {
    this.auto = !this.auto; this.autoBtn.classList.toggle('on', this.auto); Sound.play('cursor');
    if (this.auto && !this.busy && !this.onAny) this.scheduleAuto();
    this.refresh();
  },
  stChips(st) { return Object.keys(st).filter(k => st[k] > 0).map(k => `<span class="${ST_GOOD[k] ? 'sg' : 'sb'}">${ST_N[k]}${st[k]}</span>`).join(''); },
  refresh() {
    const P = this.P;
    // パーティ
    this.partyEl.innerHTML = `<div class="cbp-ports">${[0, 1, 2, 3].map(i => { const c = this.party[i]; return c ? `<span class="cbp-pc"><img src="${portraitURL(CHARS[c.id].look)}">${RELICS[c.id] ? `<img class="cbp-rl" src="${relicIconURL(c.id)}" title="${U.esc(RELICS[c.id].n)}">` : ''}</span>` : '<i></i>'; }).join('')}</div>
      <div class="cbp-main"><div class="cbp-hp${P.hp < P.max * 0.3 ? ' low' : ''}"><i style="width:${100 * P.hp / P.max}%"></i><span>HP ${P.hp} / ${P.max}</span></div><div class="cbp-st">${P.block ? `<span class="blk">ブロック${P.block}</span>` : ''}${this.stChips(P.st)}</div></div>`;
    // 敵
    const s = Game.scale;
    this.enemies.forEach((e, i) => {
      const o = e.ov;
      o.style.left = (e.x + e.w / 2) * s + 'px'; o.style.top = e.y * s + 'px'; o.style.height = e.h * s + 'px';
      o.classList.toggle('dead', !e.alive);
      o.classList.toggle('tgt', this.targeting && this.tgt === i);
      o.classList.toggle('can', this.sel >= 0 && !!this.hand[this.sel] && cardNeedsTarget(CARDS[this.hand[this.sel].cid]) && e.alive);
      const I = e.intent;
      let it = '';
      if (I && e.alive) {
        if (I.dmg) it += `<span class="ia">攻撃 ${this.previewDmg(e, I.dmg)}${I.hits > 1 ? '×' + I.hits : ''}</span>`;
        if (I.block) it += '<span class="ib">防御</span>';
        if (I.str) it += '<span class="ibf">強化</span>';
        if (I.heal) it += '<span class="ih">回復</span>';
        if (I.poison || I.weak || I.vuln) it += '<span class="idb">弱体</span>';
      }
      o.querySelector('.cbe-int').innerHTML = it;
      o.querySelector('.cbe-n').textContent = e.n;
      o.querySelector('.cbe-hp i').style.width = (100 * Math.max(0, e.hp) / e.max) + '%';
      o.querySelector('.cbe-hp span').textContent = `${Math.max(0, e.hp)}/${e.max}`;
      o.querySelector('.cbe-st').innerHTML = (e.block ? `<span class="blk">ブロック${e.block}</span>` : '') + this.stChips(e.st);
    });
    // 手札
    this.handEl.innerHTML = '';
    this.handEl.style.setProperty('--n', Math.max(5, this.hand.length));
    this.hand.forEach((h, i) => {
      const c = CARDS[h.cid];
      const playable = !c.blank && this.effCost(h.cid) <= this.energy;
      const w = U.el('div', 'cb-slot' + (i === this.sel ? ' sel' : '') + (playable ? ' ok' : ' no'));
      w.innerHTML = cardFaceHTML(h.cid, { charge: h.charge, free: this.effCost(h.cid) === 0 && cardCost(h.cid) > 0 });
      w.onclick = ev => { ev.stopPropagation(); if (this.canAct()) this.tapCard(i); };
      this.handEl.appendChild(w);
    });
    this.energyEl.innerHTML = `<b>${this.energy}</b>/${ENERGY_MAX}`;
    this.drawBtn.innerHTML = `山札<b>${this.drawPile.length}</b>`;
    this.discBtn.innerHTML = `捨て札<b>${this.discard.length}</b>`;
    this.endBtn.classList.toggle('dis', !this.canAct());
    this.runBtn.classList.toggle('dis', !!this.opts.boss || !this.canAct());
    // 説明
    if (this.sel >= 0 && this.hand[this.sel]) {
      const h = this.hand[this.sel], c = CARDS[h.cid];
      const cost = cardCost(h.cid);
      const hint = c.blank ? '使えないカード' : cost > this.energy ? 'エナジーが足りない' : this.targeting ? '◀▶で対象を選び、Aで使う(敵をタップでもOK)' : (cardNeedsTarget(c) && this.aliveIdx().length > 1 ? 'もう一度タップか、敵をタップして使う' : 'もう一度タップで使う');
      this.infoEl.innerHTML = `<b>${U.esc(c.n)}</b> <span class="cost">⚡${cost < 0 ? '-' : cost}</span> ${U.esc(cardDesc(h.cid))}<br><small>${hint}</small>`;
    } else this.infoEl.innerHTML = this.busy ? '' : (this.auto ? '<small>オートバトル中…(AUTOで解除)</small>' : '<small>カードをタップして選ぶ ／ MENU:ターン終了</small>');
  },
  previewDmg(e, base) {
    let n = base + (e.st.str || 0);
    if (e.st.weak) n *= 0.75;
    if (this.P.st.vuln) n *= 1.5;
    return Math.floor(n);
  },
  msg(t) { this.msgEl.innerHTML = t || ''; this.msgEl.classList.toggle('hidden', !t); },
  layout() {
    if (!this.enemies) return;
    const vw = Game.vw;
    let panelTop = Game.vh * 0.55;
    if (this.panel) { const r = this.panel.getBoundingClientRect(), rr = UI.root.getBoundingClientRect(); if (r.height) panelTop = (r.top - rr.top) / Game.scale; }
    const top = 26, room = Math.max(40, panelTop - top - 34);
    const n = this.enemies.length;
    this.enemies.forEach((e, i) => {
      const sp = enemySprite(e.d.spr, e.d.pal);
      let sc = Math.max(1, Math.min(e.boss ? 3 : 3, Math.floor(Math.min(room / sp.height, (vw / n) * 0.8 / sp.width))));
      e.w = sp.width * sc; e.h = sp.height * sc;
      e.x = Math.round(vw * (i + 1) / (n + 1) - e.w / 2);
      e.y = Math.round(top + (room - e.h) * 0.75);
    });
    this.hz = Math.round(this.enemies[0].y + this.enemies[0].h * 0.8);
    if (this.layer) this.refresh();
  },
  pop(text, x, y, cls) {
    const s = Game.scale;
    const p = U.el('div', 'pop ' + (cls || ''), text);
    p.style.left = (x * s) + 'px'; p.style.top = (y * s) + 'px';
    this.popEl.appendChild(p);
    setTimeout(() => p.remove(), 1100);
  },
  popParty(text, cls) {
    const r = this.partyEl.getBoundingClientRect(), rr = UI.root.getBoundingClientRect();
    const p = U.el('div', 'pop ' + (cls || ''), text);
    p.style.left = (r.left - rr.left + r.width * (0.45 + Math.random() * 0.2)) + 'px'; p.style.top = (r.top - rr.top) + 'px';
    this.popEl.appendChild(p);
    setTimeout(() => p.remove(), 1100);
    this.partyEl.classList.remove('hit', 'heal'); void this.partyEl.offsetWidth;
    if (cls && cls.includes('dmg')) this.partyEl.classList.add('hit');
    if (cls && cls.includes('heal')) this.partyEl.classList.add('heal');
  },

  // ---------- 描画 ----------
  draw(ctx) {
    this.t += 1 / 60;
    const vw = Game.vw, vh = Game.vh;
    const bg = BG_DEF[this.opts.bg] || BG_DEF.meadow;
    const hz = U.clamp(this.hz || Math.round(vh * 0.3), 20, vh - 10);
    let g = ctx.createLinearGradient(0, 0, 0, hz);
    g.addColorStop(0, bg.sky[0]); g.addColorStop(1, bg.sky[1]);
    ctx.fillStyle = g; ctx.fillRect(0, 0, vw, hz);
    ctx.fillStyle = bg.hill;
    for (let x = 0; x < vw; x += 2) {
      const h = bg.cave ? 10 + Math.abs(Math.sin(x * 0.09)) * 14 + Math.sin(x * 0.31) * 3 : 8 + Math.sin(x * 0.04) * 6 + Math.sin(x * 0.13) * 3;
      if (bg.cave) ctx.fillRect(x, 0, 2, Math.round(h * 0.6));
      ctx.fillRect(x, hz - Math.round(h), 2, Math.round(h));
    }
    if (bg.tree) { ctx.fillStyle = '#1d3b22'; for (let x = 4; x < vw; x += 22) { ctx.fillRect(x, hz - 26, 10, 26); ctx.fillRect(x - 4, hz - 34, 18, 14); } }
    g = ctx.createLinearGradient(0, hz, 0, vh);
    g.addColorStop(0, bg.ground[0]); g.addColorStop(1, bg.ground[1]);
    ctx.fillStyle = g; ctx.fillRect(0, hz, vw, vh - hz);
    ctx.fillStyle = 'rgba(0,0,0,0.08)';
    for (let y = hz + 4, k = 0; y < vh; y += 4 + k, k++) ctx.fillRect(0, y, vw, 1);
    if (bg.lava) { ctx.fillStyle = `rgba(255,${120 + Math.round(Math.sin(this.t * 3) * 40)},40,0.25)`; ctx.fillRect(0, hz, vw, 3); }
    for (const e of this.enemies) {
      if (e.fade <= 0) continue;
      const sp = enemySprite(e.d.spr, e.d.pal);
      let ox = 0;
      if (e.shake > 0) { ox = Math.round(Math.sin(e.shake * 40) * 3); e.shake -= 1 / 60; }
      let oy = Math.round(Math.sin(this.t * 2 + e.x) * 1.5);
      if (e.lunge > 0) { oy += Math.round(Math.sin(e.lunge * Math.PI) * 8); e.lunge -= 1 / 20; }
      ctx.save();
      ctx.globalAlpha = Math.max(0, e.fade);
      ctx.fillStyle = 'rgba(0,0,0,0.25)';
      ctx.fillRect(e.x + e.w * 0.15, e.y + e.h - 2, e.w * 0.7, 4);
      ctx.drawImage(sp, e.x + ox, e.y + oy, e.w, e.h);
      if (e.flash > 0) {
        ctx.globalCompositeOperation = 'source-atop';
        ctx.globalAlpha = Math.min(1, e.flash * 3);
        ctx.fillStyle = '#fff';
        ctx.fillRect(e.x + ox, e.y + oy, e.w, e.h);
        e.flash -= 1 / 60;
      }
      ctx.restore();
      if (!e.alive && e.fade > 0) e.fade -= 1 / 30;
    }
    this.fx = this.fx.filter(f => (f.t += 1 / 60) < f.dur);
    for (const f of this.fx) {
      const k = f.t / f.dur;
      ctx.save();
      if (f.type === 'slash') {
        ctx.fillStyle = f.color || '#fff'; ctx.globalAlpha = 1 - k;
        for (let i = 0; i < 18; i++) { const p = (i / 18) * Math.min(1, k * 3); ctx.fillRect(Math.round(f.x - 14 + p * 28), Math.round(f.y - 14 + p * 28), 2, 2); }
      } else if (f.type === 'burst') {
        ctx.globalAlpha = 1 - k;
        const r = 4 + k * f.r;
        for (let i = 0; i < 16; i++) { const a = i / 16 * Math.PI * 2 + f.t * 2; ctx.fillStyle = i % 2 ? f.color : '#fff'; ctx.fillRect(Math.round(f.x + Math.cos(a) * r) - 1, Math.round(f.y + Math.sin(a) * r * 0.8) - 1, 3, 3); }
      } else if (f.type === 'screen') {
        ctx.globalAlpha = (1 - k) * 0.45; ctx.fillStyle = f.color; ctx.fillRect(0, 0, vw, vh);
      }
      ctx.restore();
    }
  },

  // ---------- 進行 ----------
  run() {
    return new Promise(async res => {
      this.resolve = res;
      const names = this.enemies.map(e => e.n);
      this.msg(this.opts.boss ? `<b class="bossname">${U.esc(names[0])}</b> が あらわれた!` : `${U.esc(names.join('、'))} が あらわれた!`);
      for (const e of this.enemies) e.intent = enemyIntent(e);
      this.refresh();
      await this.wait(800);
      this.msg('');
      this.startTurn();
    });
  },
  drawCards(n) {
    for (let i = 0; i < n; i++) {
      if (this.hand.length >= HAND_MAX) break;
      if (!this.drawPile.length) {
        if (!this.discard.length) break;
        this.drawPile = this.shuffle(this.discard); this.discard = [];
        UI.toast('捨て札を山札に戻した', 900);
      }
      this.hand.push(this.drawPile.pop());
    }
  },
  async startTurn() {
    if (await this.checkEnd()) return;
    this.turn++;
    const P = this.P;
    P.block = 0;
    if (P.st.poison) { const d = P.st.poison; P.hp = Math.max(0, P.hp - d); P.st.poison--; this.popParty(d, 'dmg poison'); if (await this.checkEnd()) return; }
    this.energy = ENERGY_MAX;
    this.combo = 0;
    let extra = 0;
    if (this.turn === 1 && this.relics.length) {
      this.msg('レリック発動: ' + this.relics.map(x => `<span class="skn">${U.esc(x.r.n)}</span>`).join('、'));
      for (const x of this.relics) { if (x.r.start) x.r.start(this, x.L); if (x.r.draw) extra += x.r.draw(x.L); }
      this.relicFlash();
    }
    for (const x of this.relics) if (x.r.turn) x.r.turn(this, x.L);
    this.drawCards(DRAW_N + extra);
    this.sel = -1; this.targeting = false; this.busy = false;
    Sound.play('cursor');
    this.refresh();
    if (this.auto) this.scheduleAuto();
  },
  tapCard(i) {
    const h = this.hand[i]; if (!h) return;
    const c = CARDS[h.cid];
    if (this.sel !== i) { this.sel = i; this.targeting = false; Sound.play('cursor'); this.refresh(); return; }
    if (c.blank || this.effCost(h.cid) > this.energy) { Sound.play('buzz'); return; }
    if (cardNeedsTarget(c)) {
      const al = this.aliveIdx();
      if (al.length === 1) { this.play(i, al[0]); return; }
      if (!this.targeting) { this.targeting = true; this.tgt = al.includes(this.tgt) ? this.tgt : al[0]; Sound.play('ok'); this.refresh(); return; }
      this.play(i, this.tgt); return;
    }
    this.play(i, -1);
  },
  clickEnemy(j) {
    if (!this.canAct() || !this.enemies[j].alive) return;
    if (this.sel >= 0 && this.hand[this.sel] && cardNeedsTarget(CARDS[this.hand[this.sel].cid])) this.play(this.sel, j);
  },
  async play(i, tj) {
    const h = this.hand[i];
    if (!h || this.busy) return;
    const c = CARDS[h.cid];
    const cost = this.effCost(h.cid);
    if (c.blank || cost > this.energy) { Sound.play('buzz'); return; }
    this.busy = true;
    if (cost === 0 && cardCost(h.cid) > 0) this.P.st.free--;
    this.energy -= cost;
    this.combo = (this.combo || 0) + 1;
    this.hand.splice(i, 1);
    this.sel = -1; this.targeting = false;
    if (c.flags.exhaust) this.exhaust.push(h); else this.discard.push(h);
    this.refresh();
    await this.cutin(h.cid);
    if (c.flags.serve) { this.addSt(this.P, 'serve', 1); this.popParty('奉仕+1', 'buff'); }
    if (c.type === 'a') { this.atkCount++; for (const x of this.relics) if (x.r.attack) x.r.attack(this, x.L, this.atkCount); }
    await this.applyCard(h.cid, tj, h);
    this.busy = false;
    if (await this.checkEnd()) return;
    this.refresh();
  },
  async cutin(cid) {
    const c = CARDS[cid];
    const owner = c.owner && CHARS[c.owner];
    this.cutEl.className = 'cutin';
    this.cutEl.innerHTML = owner ? `<img src="${portraitURL(owner.look)}"><div class="ci-t"><small>${U.esc(owner.n)}</small><b>${U.esc(c.n)}</b></div>` : `<div class="ci-t solo"><b>${U.esc(c.n)}</b></div>`;
    this.cutEl.style.setProperty('--cc', owner ? ELEM[owner.elem].c : '#c8d0ff');
    void this.cutEl.offsetWidth;
    this.cutEl.classList.add('show', c.type === 'a' ? 'atk' : 'skl');
    this.msg(`${owner ? `<b>${U.esc(owner.n)}</b> の ` : ''}<span class="skn">${U.esc(c.n)}</span>!`);
    await this.wait(owner ? 520 : 300);
  },
  async applyCard(cid, tj, h) {
    const c = CARDS[cid], ops = cardOps(cid), P = this.P;
    const tgt = () => { let e = this.enemies[tj]; if (!e || !e.alive) e = this.enemies.find(x => x.alive); return e; };
    // 条件付きの威力倍率
    let mul = 1;
    const notes = [];
    if (c.flags.low && P.hp <= P.max / 2) { mul *= 2; notes.push('HP半分以下!'); }
    if (c.flags.blocky && P.block >= 20) { mul *= 2; notes.push('ブロック20以上!'); }
    if (c.flags.poisoned) { const e = tgt(); if (e && e.st.poison) { mul *= 2; notes.push('毒の追撃!'); } }
    if (h && h.charge) { const per = 0.5 + this.relicBonus('charge'); mul *= 1 + per * h.charge; notes.push(`チャージ${h.charge}!`); }
    if (notes.length) this.popParty(notes.join(' '), 'buff');
    const D = n => Math.round(n * mul);
    for (const o of ops) {
      if (!this.enemies.some(e => e.alive)) break;
      switch (o.k) {
        case 'd': for (let k = 0; k < o.hits; k++) { const e = tgt(); if (!e) break; this.hitEnemy(e, D(o.n)); await this.wait(o.hits > 1 ? 170 : 260); } break;
        case 'o': { const e = tgt(); if (e) { this.pop(`${this.combo}コンボ!`, e.x + e.w / 2, e.y - 4, 'weak'); this.hitEnemy(e, D(o.n * this.combo)); await this.wait(300); } break; }
        case 'r': { const e = tgt(); if (e) { const before = e.hp; this.hitEnemy(e, D(o.n)); const v = Math.max(0, before - Math.max(0, e.hp)); this.relicHeal(Math.floor(v / 2)); await this.wait(260); } break; }
        case 'u': { const e = tgt(); if (e) { const miss = 1 - P.hp / P.max; this.hitEnemy(e, D(Math.round(o.n * (1 + 2 * miss)))); await this.wait(320); } break; }
        case 'x': { const n = Math.max(1, Math.round(P.max * o.n / 100)); P.hp = Math.max(1, P.hp - n); Sound.play('damage'); this.popParty('-' + n, 'dmg'); break; }
        case 'y': for (let k = 0; k < o.n; k++) this.addToHand(U.pick(Object.keys(TRICK_CARDS))); Sound.play('magic'); break;
        case 'k': this.addSt(P, 'free', o.n); this.popParty('次のカード コスト0', 'mp'); Sound.play('magic'); break;
        case 'j': for (const hh of this.hand) if (CARDS[hh.cid].flags.grow) hh.charge = (hh.charge || 0) + o.n; this.popParty('チャージ+' + o.n, 'mp'); Sound.play('magic'); break;
        case 'D': for (let k = 0; k < o.hits; k++) { for (const e of this.enemies.filter(x => x.alive)) this.hitEnemy(e, D(o.n)); this.fx.push({ type: 'screen', color: '#fff', t: 0, dur: 0.25 }); await this.wait(280); } break;
        case 'b': { let n = o.n + (P.st.dex || 0); if (P.st.devote) n = Math.round(n * 2.5); P.block += n; P.gained += n; Sound.play('buff'); this.popParty('ブロック+' + n, 'buff'); break; }
        case 'h': { let n = o.n; if (P.st.devote) n = Math.round(n * 2.5); const v = Math.min(P.max - P.hp, n); P.hp += v; P.gained += v; Sound.play('heal'); this.popParty('+' + n, 'heal'); break; }
        case 'm': this.addSt(P, 'devote', o.n); this.popParty('献身' + o.n, 'buff'); Sound.play('buff'); break;
        case 'z': { const e = tgt(); if (e) { this.burnEnemy(e, o.n + (P.st.serve || 0) * o.per); await this.wait(300); } break; }
        case 'q': { const e = tgt(); if (e) { this.burnEnemy(e, Math.max(1, P.gained)); await this.wait(350); } break; }
        case 'c': this.drawCards(o.n); Sound.play('cursor'); break;
        case 'e': this.energy += o.n; Sound.play('magic'); this.popParty('エナジー+' + o.n, 'mp'); break;
        case 's': this.addSt(P, 'str', o.n); this.popParty(ST_N.str + '+' + o.n, 'buff'); Sound.play('buff'); break;
        case 'f': this.addSt(P, 'dex', o.n); this.popParty(ST_N.dex + '+' + o.n, 'buff'); Sound.play('buff'); break;
        case 'g': this.addSt(P, 'regen', o.n); this.popParty(ST_N.regen + o.n, 'heal'); Sound.play('heal'); break;
        case 't': this.addSt(P, 'thorns', o.n); this.popParty(ST_N.thorns + o.n, 'buff'); Sound.play('buff'); break;
        case 'v': case 'w': case 'p': { const e = tgt(); if (e) this.debuff(e, { v: 'vuln', w: 'weak', p: 'poison' }[o.k], o.n); break; }
        case 'V': case 'W': case 'P': for (const e of this.enemies.filter(x => x.alive)) this.debuff(e, { V: 'vuln', W: 'weak', P: 'poison' }[o.k], o.n); break;
      }
      this.refresh();
      await this.wait(120);
    }
  },
  addSt(u, k, n) { u.st[k] = (u.st[k] || 0) + n; },
  addToHand(cid) { if (this.hand.length >= HAND_MAX) { this.discard.push({ u: this.uid++, cid }); return; } this.hand.push({ u: this.uid++, cid }); },
  relicBonus(kind) { let v = 0; for (const x of this.relics) if (x.r.bonus && x.r.bonus[kind]) v += x.r.bonus[kind](x.L, this); return v; },
  // レリック用
  relicBlock(n) { this.P.block += n; this.P.gained += n; this.popParty('ブロック+' + n, 'buff'); },
  relicHeal(n) { const v = Math.min(this.P.max - this.P.hp, n); this.P.hp += v; this.P.gained += v; if (n > 0) this.popParty('+' + n, 'heal'); },
  relicSt(k, n) { this.addSt(this.P, k, n); this.popParty((ST_N[k] || k) + '+' + n, 'buff'); },
  relicFlash() { this.partyEl.classList.remove('relicon'); void this.partyEl.offsetWidth; this.partyEl.classList.add('relicon'); Sound.play('buff'); },
  debuff(e, k, n) { this.addSt(e, k, n); this.pop(ST_N[k] + n, e.x + e.w / 2, e.y + e.h * 0.2, k === 'poison' ? 'poison' : 'debuff'); Sound.play('debuff'); },
  // 防御無視ダメージ (バーン)
  burnEnemy(e, n) {
    if (this.P.st.devote) n *= 0.5;
    if (e.st.vuln) n *= 1.5;
    n = Math.max(1, Math.floor(n));
    e.hp -= n; e.flash = 0.4; e.shake = 0.5;
    G.seen[e.id] = 1;
    this.fx.push({ type: 'burst', x: e.x + e.w / 2, y: e.y + e.h / 2, color: '#ffb04a', r: 34, t: 0, dur: 0.6 });
    this.fx.push({ type: 'screen', color: '#ffb04a', t: 0, dur: 0.3 });
    Sound.play('crit');
    this.pop(n, e.x + e.w / 2, e.y + e.h * 0.35, 'dmg crit');
    this.pop('防御無視!', e.x + e.w / 2, e.y, 'weak');
    if (e.hp <= 0) { e.hp = 0; e.alive = false; Sound.play('die'); }
    this.refresh();
  },
  hitEnemy(e, base) {
    const P = this.P;
    let n = (base + (P.st.str || 0)) * (1 + this.relicBonus('dmg'));
    if (P.st.weak) n *= 0.75;
    if (P.st.devote) n *= 0.5;
    if (e.st.vuln) n *= 1.5;
    n = Math.max(0, Math.floor(n));
    const blocked = Math.min(e.block, n); e.block -= blocked;
    const dmg = n - blocked;
    e.hp -= dmg; e.flash = 0.25; e.shake = 0.3;
    G.seen[e.id] = 1;
    const cx = e.x + e.w / 2, cy = e.y + e.h / 2;
    this.fx.push({ type: n > 20 ? 'burst' : 'slash', x: cx, y: cy, color: '#fff', r: 20, t: 0, dur: 0.35 });
    Sound.play(n >= 25 ? 'crit' : 'hit');
    this.pop(blocked && !dmg ? 'ブロック' : dmg, cx, e.y + e.h * 0.35, 'dmg' + (n >= 25 ? ' crit' : ''));
    if (e.hp <= 0) { e.hp = 0; e.alive = false; Sound.play('die'); }
    this.refresh();
  },
  async endTurn() {
    if (this.busy) return;
    this.busy = true;
    this.sel = -1; this.targeting = false;
    const P = this.P;
    // 手札を捨てる
    const keep = [];
    for (const h of this.hand) { const f = CARDS[h.cid].flags; if (f.retain) { if (f.grow) { h.charge = (h.charge || 0) + 1; } keep.push(h); } else this.discard.push(h); }
    this.hand = keep;
    if (P.st.regen) { const v = Math.min(P.max - P.hp, P.st.regen); P.hp += v; this.popParty('+' + P.st.regen, 'heal'); P.st.regen--; }
    for (const k of ['weak', 'vuln', 'devote']) if (P.st[k]) P.st[k]--;
    this.refresh();
    await this.wait(250);
    // 敵のターン
    for (const e of this.enemies) {
      if (!e.alive) continue;
      e.block = 0;
      if (e.st.poison) { const d = e.st.poison; e.hp -= d; e.st.poison--; this.pop(d, e.x + e.w / 2, e.y + e.h / 3, 'dmg poison'); if (e.hp <= 0) { e.hp = 0; e.alive = false; Sound.play('die'); this.refresh(); continue; } }
      await this.enemyAct(e);
      for (const k of ['weak', 'vuln']) if (e.st[k]) e.st[k]--;
      this.refresh();
      if (await this.checkEnd()) return;
    }
    if (await this.checkEnd()) return;
    for (const e of this.enemies) if (e.alive) e.intent = enemyIntent(e);
    await this.wait(200);
    this.startTurn();
  },
  async enemyAct(e) {
    const I = e.intent, P = this.P;
    if (!I) return;
    this.msg(`<b>${U.esc(e.n)}</b> の <span class="skn">${U.esc(I.n)}</span>!`);
    e.lunge = 1;
    await this.wait(320);
    if (I.block) { e.block += I.block; this.pop('ブロック' + I.block, e.x + e.w / 2, e.y, 'buff'); Sound.play('buff'); }
    if (I.str) { this.addSt(e, 'str', I.str); this.pop(ST_N.str + '+' + I.str, e.x + e.w / 2, e.y, 'buff'); Sound.play('buff'); }
    if (I.heal) { e.hp = Math.min(e.max, e.hp + I.heal); this.pop('+' + I.heal, e.x + e.w / 2, e.y + e.h / 3, 'heal'); Sound.play('heal'); }
    if (I.dmg) {
      for (let h = 0; h < I.hits; h++) {
        let n = I.dmg + (e.st.str || 0);
        if (e.st.weak) n *= 0.75;
        if (P.st.vuln) n *= 1.5;
        n = Math.floor(n);
        const blocked = Math.min(P.block, n); P.block -= blocked;
        const dmg = n - blocked;
        P.hp = Math.max(0, P.hp - dmg);
        Sound.play(dmg ? 'damage' : 'buff');
        this.fx.push({ type: 'screen', color: dmg ? '#e43b44' : '#7fe8ff', t: 0, dur: 0.2 });
        this.popParty(dmg ? dmg : 'ブロック', dmg ? 'dmg' : 'buff');
        if (I.drain && dmg) e.hp = Math.min(e.max, e.hp + dmg);
        if (P.st.thorns) { e.hp -= P.st.thorns; this.pop(P.st.thorns, e.x + e.w / 2, e.y + e.h / 3, 'dmg'); if (e.hp <= 0) { e.hp = 0; e.alive = false; Sound.play('die'); } }
        this.refresh();
        await this.wait(260);
        if (P.hp <= 0 || !e.alive) break;
      }
    }
    if (I.poison) { this.addSt(P, 'poison', I.poison); this.popParty(ST_N.poison + I.poison, 'poison'); }
    if (I.weak) { this.addSt(P, 'weak', I.weak); this.popParty(ST_N.weak + I.weak, 'debuff'); }
    if (I.vuln) { this.addSt(P, 'vuln', I.vuln); this.popParty(ST_N.vuln + I.vuln, 'debuff'); }
    this.refresh();
    await this.wait(200);
    this.msg('');
  },
  async checkEnd() {
    if (this.done) return true;
    if (this.enemies.every(e => !e.alive)) { this.done = true; this.resolve(await this.finish('win')); return true; }
    if (this.P.hp <= 0) { this.done = true; this.resolve(await this.finish('lose')); return true; }
    return false;
  },

  // ---------- オート ----------
  scheduleAuto() { clearTimeout(this.autoTimer); this.autoTimer = setTimeout(() => this.autoTurn(), 60); },
  async autoTurn() {
    if (this.autoRunning || !this.auto || this.done || !this.active) return;
    this.autoRunning = true;
    let finished = false;
    try {
      await this.wait(250);
      for (let guard = 0; guard < 25 && this.auto && !this.done; guard++) {
        if (this.busy) { await this.wait(100); continue; }
        const pick = this.autoPick();
        if (!pick) { finished = true; break; }
        this.sel = pick.i; this.refresh();
        await this.wait(180);
        await this.play(pick.i, pick.t);
        await this.wait(120);
      }
    } finally { this.autoRunning = false; }
    if (finished && this.auto && !this.done && !this.busy) this.endTurn();
  },
  autoPick() {
    const P = this.P, alive = this.enemies.filter(e => e.alive);
    if (!alive.length) return null;
    const incoming = alive.reduce((a, e) => a + (e.intent && e.intent.dmg ? this.previewDmg(e, e.intent.dmg) * e.intent.hits : 0), 0);
    const need = Math.max(0, incoming - P.block);
    const target = alive.slice().sort((a, b) => a.hp - b.hp)[0];
    let best = null;
    this.hand.forEach((h, i) => {
      const c = CARDS[h.cid], cost = cardCost(h.cid);
      if (c.blank || this.effCost(h.cid) > this.energy) return;
      let sc = 0;
      for (const o of cardOps(h.cid)) {
        const dm = (o.n + (P.st.str || 0)) * o.hits;
        if (o.k === 'd') sc += Math.min(dm, target.hp + target.block) * 1.0 + (dm >= target.hp + target.block ? 8 : 0);
        if (o.k === 'D') sc += alive.reduce((a, e) => a + Math.min(dm, e.hp + e.block), 0);
        if (o.k === 'o') sc += Math.min(o.n * ((this.combo || 0) + 1), target.hp + target.block);
        if (o.k === 'r' || o.k === 'u') sc += Math.min(dm, target.hp + target.block) * 1.1;
        if (o.k === 'x') sc -= P.hp < P.max * 0.35 ? 99 : o.n;
        if (o.k === 'y') sc += o.n * 4;
        if (o.k === 'k') sc += 5;
        if (o.k === 'j') sc += this.hand.some(hh => CARDS[hh.cid].flags.grow) ? 6 : 0;
        if (o.k === 'b') sc += Math.min(o.n + (P.st.dex || 0), need) * 1.1;
        if (o.k === 'h') sc += P.hp < P.max * 0.6 ? Math.min(o.n, P.max - P.hp) * 0.8 : 0;
        if (o.k === 'g') sc += P.hp < P.max * 0.8 ? o.n * 1.5 : 0;
        if (o.k === 'c') sc += o.n * 4;
        if (o.k === 'e') sc += o.n * 6;
        if ('sf'.includes(o.k)) sc += o.n * 5;
        if (o.k === 't') sc += o.n * 2;
        if ('vw'.includes(o.k)) sc += o.n * 3;
        if ('VW'.includes(o.k)) sc += o.n * 3 * alive.length;
        if (o.k === 'p') sc += o.n * 1.5;
        if (o.k === 'P') sc += o.n * 1.5 * alive.length;
      }
      const val = sc / Math.max(0.6, cost);
      if (sc > 0 && (!best || val > best.val)) best = { i, val, t: cardNeedsTarget(c) ? this.enemies.indexOf(target) : -1 };
    });
    return best;
  },

  // ---------- その他の操作 ----------
  viewPile(title, list) {
    const el = U.el('div', 'layer pile-layer');
    const counts = {};
    for (const h of list) counts[h.cid] = (counts[h.cid] || 0) + 1;
    const ids = Object.keys(counts).sort((a, b) => (CARDS[a].owner || 'zz').localeCompare(CARDS[b].owner || 'zz') || a.localeCompare(b));
    el.innerHTML = `<div class="pile-h">${U.esc(title)} (${list.length}枚) <span class="dim">タップで閉じる</span></div><div class="pile-grid">${ids.map(id => `<div class="pile-c">${cardFaceHTML(id)}${counts[id] > 1 ? `<b class="pile-n">×${counts[id]}</b>` : ''}</div>`).join('') || '<div class="dim">なし</div>'}</div>`;
    const l = { el, handle: k => { if (k === 'a' || k === 'b') UI.pop(l); } };
    el.onclick = e => { e.stopPropagation(); UI.pop(l); };
    UI.push(l);
  },
  async useItem() {
    if (!this.canAct()) return;
    const ids = Object.keys(G.items).filter(k => G.items[k] > 0 && ITEMS[k] && ITEMS[k].type !== 'none');
    if (!ids.length) { UI.toast('どうぐを持っていない'); return; }
    this.busy = true;
    const r = await UI.ask('どうぐを使う(エナジー消費なし)', ids.map(k => `${ITEMS[k].n} ×${G.items[k]} ― ${ITEMS[k].bdesc || ITEMS[k].desc}`));
    if (r >= 0) {
      const it = ITEMS[ids[r]], P = this.P;
      useItemCount(ids[r]);
      Sound.play('heal');
      if (it.type === 'heal') { const v = Math.min(P.max - P.hp, it.amt); P.hp += v; this.popParty('+' + it.amt, 'heal'); }
      if (it.type === 'mp') { this.energy += 1; this.popParty('エナジー+1', 'mp'); }
      if (it.type === 'cure') { delete P.st.poison; delete P.st.weak; delete P.st.vuln; this.popParty('回復', 'heal'); }
      if (it.type === 'revive') { const v = Math.round(P.max * 0.3); P.hp = Math.min(P.max, P.hp + v); this.popParty('+' + v, 'heal'); }
      if (it.type === 'full') { P.hp = P.max; this.popParty('全回復!', 'heal'); }
    }
    this.busy = false;
    this.refresh();
  },
  async tryEscape() {
    if (!this.canAct() || this.opts.boss) { if (this.opts.boss) UI.toast('ボスからは逃げられない!'); return; }
    this.busy = true;
    this.msg('逃げ出そうとした…');
    await this.wait(400);
    const ps = this.party.reduce((s, c) => s + charStats(c).spd, 0) / Math.max(1, this.party.length);
    const es = this.enemies.filter(e => e.alive).reduce((s, e) => s + e.d.spd, 0) / Math.max(1, this.enemies.filter(e => e.alive).length);
    const ch = U.clamp(0.6 + (ps - es) * 0.02 + (this.escTries || 0) * 0.15, 0.3, 0.95);
    this.escTries = (this.escTries || 0) + 1;
    if (Math.random() < ch) {
      Sound.play('escape');
      this.msg('うまく逃げ切れた!');
      await this.wait(600);
      this.done = true;
      this.syncHp();
      this.resolve('escape');
      return;
    }
    this.msg('しかし まわりこまれてしまった!');
    await this.wait(600);
    this.busy = false;
    this.endTurn();
  },
  // 共有HPを各キャラへ戻す (最大HPの割合で分配)
  syncHp() {
    const ratio = U.clamp(this.P.hp / this.P.max, 0, 1);
    for (const c of this.party) { const s = charStats(c); c.hp = this.P.hp <= 0 ? 0 : Math.max(1, Math.round(s.hp * ratio)); c.st = {}; }
  },
  async finish(res) {
    this.busy = true;
    this.sel = -1;
    if (res === 'win') for (const x of this.relics) if (x.r.win) x.r.win(this, x.L);
    this.syncHp();
    if (res === 'lose') {
      Sound.stopBgm();
      Sound.play('die');
      this.msg('パーティは力尽きてしまった…');
      await this.wait(1600);
      return 'lose';
    }
    let exp = 0, gold = 0, stones = 0;
    const drops = [];
    for (const e of this.enemies) {
      const rw = this.opts.rematch ? (this.opts.mul || 1) : 1;
      exp += Math.round(e.d.exp * rw); gold += Math.round(e.d.gold * rw);
      if (!e.boss && Math.random() < 0.06) stones += 10;
      for (const [id, p] of e.d.drop || []) if (Math.random() < p) drops.push(id);
    }
    G.gold += gold; G.stones += stones;
    for (const d of drops) addItem(d);
    Sound.jingle('win');
    this.msg('');
    await this.wait(300);
    const lvMsgs = [];
    for (const k in G.roster) {
      const c = G.roster[k];
      const inParty = this.party.includes(c);
      const before = charStats(c).hp;
      const ups = gainExp(c, inParty ? exp : Math.floor(exp / 2));
      if (ups.length) lvMsgs.push({ c, lv: ups[ups.length - 1].lv, reserve: !inParty });
    }
    const box = U.el('div', 'win result');
    let html = `<div class="rt">VICTORY!</div><div class="rrow"><span>経験値</span><b>${exp} EXP</b></div><div class="rrow"><span>ゴールド</span><b>${gold} G</b></div>`;
    if (stones) html += `<div class="rrow st"><span>星晶石</span><b>+${stones}</b></div>`;
    if (drops.length) html += `<div class="rrow"><span>アイテム</span><b>${drops.map(d => U.esc(ITEMS[d].n)).join('、')}</b></div>`;
    html += `<div class="rrow"><span>残りHP</span><b>${this.P.hp}/${this.P.max}</b></div>`;
    for (const m of lvMsgs) html += `<div class="rlv"><img src="${portraitURL(CHARS[m.c.id].look)}"><div><b>${U.esc(CHARS[m.c.id].n)}</b> は レベル${m.lv} になった!<br><small>カードの威力が上がった</small></div></div>`;
    box.innerHTML = html;
    this.layer.el.appendChild(box);
    if (lvMsgs.length) setTimeout(() => Sound.play('levelup'), 700);
    Game.hud();
    await new Promise(r => { this.onAny = () => { this.onAny = null; r(); }; setTimeout(() => { if (this.auto && this.onAny) this.onAny(); }, 2200); });
    return 'win';
  },
  cleanup() {
    document.body.classList.remove('in-battle');
    this.active = false;
    this.done = false;
    this.autoRunning = false;
    if (this.layer) UI.pop(this.layer);
    this.layer = null; this.onAny = null;
    Game.scene = 'field';
  },
};
