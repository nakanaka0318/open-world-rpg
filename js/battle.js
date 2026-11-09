'use strict';
// ===== コマンドバトル (素早さ順ターン制 + 属性弱点) =====
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
};

const Battle = {
  active: false,
  async start(enemyIds, opts = {}) {
    this.opts = opts;
    this.active = true;
    this.turn = 0;
    this.fx = [];
    this.t = 0;
    const counts = {};
    enemyIds.forEach(id => counts[id] = (counts[id] || 0) + 1);
    const seen = {};
    this.enemies = enemyIds.map((id, i) => {
      const d = ENEMIES[id];
      seen[id] = (seen[id] || 0) + 1;
      const suf = counts[id] > 1 ? 'ABCD'[seen[id] - 1] : '';
      return { id, d, n: d.n + suf, hp: d.hp, maxhp: d.hp, st: {}, alive: true, flash: 0, shake: 0, fade: 1, lunge: 0, boss: !!d.boss, x: 0, y: 0 };
    });
    this.party = partyChars();
    for (const c of this.party) { c.st = c.st || {}; c.defend = false; delete c.st.buffs; }
    Sound.play('encounter');
    Game.scene = 'trans';
    await this.transition();
    Game.scene = 'battle';
    Sound.bgm(opts.boss ? 'boss' : 'battle');
    this.buildUI();
    this.layout();
    const result = await this.run();
    this.cleanup();
    return result;
  },
  transition() {
    return new Promise(res => {
      const el = U.el('div', 'enc-trans');
      UI.root.appendChild(el);
      setTimeout(() => { el.remove(); res(); }, 620);
    });
  },
  wait(ms) { return U.sleep(ms / (this.fast ? 2 : 1)); },

  // ---------- UI ----------
  buildUI() {
    const el = U.el('div', 'layer battle-layer');
    this.msgEl = U.el('div', 'win bmsg', '');
    const tools = U.el('div', 'btools');
    this.autoBtn = U.el('div', 'tbtn' + (this.auto ? ' on' : ''), 'AUTO');
    this.fastBtn = U.el('div', 'tbtn' + (this.fast ? ' on' : ''), '×2');
    this.autoBtn.onclick = e => { e.stopPropagation(); this.toggleAuto(); };
    this.fastBtn.onclick = e => { e.stopPropagation(); this.fast = !this.fast; this.fastBtn.classList.toggle('on', this.fast); Sound.play('cursor'); };
    tools.append(this.autoBtn, this.fastBtn);
    this.cmdEl = U.el('div', 'win bcmd hidden');
    this.partyEl = U.el('div', 'bparty');
    this.popEl = U.el('div', 'pops');
    el.append(this.msgEl, tools, this.popEl, this.cmdEl, this.partyEl);
    this.cards = this.party.map(c => {
      const d = CHARS[c.id];
      const card = U.el('div', 'card');
      card.innerHTML = `<img class="cport" src="${portraitURL(d.look)}"><div class="cel" style="background:${ELEM[d.elem].c}">${ELEM[d.elem].n}</div><div class="cn">${U.esc(d.n)}</div><div class="bar hp"><i></i></div><div class="nums"></div><div class="bar mp"><i></i></div><div class="cst"></div>`;
      card.addEventListener('click', e => { e.stopPropagation(); if (this.pickAlly) this.pickAlly(this.party.indexOf(c)); });
      this.partyEl.appendChild(card);
      return card;
    });
    this.layer = { el, handle: k => { if (k === 'menu') { this.toggleAuto(); return; } if (this.menu) this.menu.handle(k); else if ((k === 'a' || k === 'b') && this.onAny) this.onAny(); } };
    el.addEventListener('click', e => {
      if (this.pickEnemy) {
        const r = UI.root.getBoundingClientRect();
        const x = (e.clientX - r.left) / Game.scale, y = (e.clientY - r.top) / Game.scale;
        const j = this.enemies.findIndex(en => en.alive && x >= en.x - 4 && x <= en.x + en.w + 4 && y >= en.y - 4 && y <= en.y + en.h + 4);
        if (j >= 0) { this.pickEnemy(j); return; }
      }
      if (this.onAny) this.onAny();
    });
    UI.push(this.layer);
    this.refresh();
  },
  toggleAuto() {
    this.auto = !this.auto; this.autoBtn.classList.toggle('on', this.auto); Sound.play('cursor');
    if (this.auto && this.cancelInput) this.cancelInput();
  },
  refresh() {
    this.party.forEach((c, i) => {
      const s = charStats(c), card = this.cards[i];
      card.classList.toggle('dead', c.hp <= 0);
      card.querySelector('.hp i').style.width = (100 * Math.max(0, c.hp) / s.hp) + '%';
      card.querySelector('.hp').classList.toggle('low', c.hp > 0 && c.hp < s.hp * 0.3);
      card.querySelector('.mp i').style.width = (100 * Math.max(0, c.mp) / Math.max(1, s.mp)) + '%';
      card.querySelector('.nums').textContent = `${Math.max(0, c.hp)}/${s.hp}`;
      const sts = [];
      if (c.st.poison) sts.push('<span class="sp">毒</span>');
      if (c.st.buffs) for (const k in c.st.buffs) sts.push(`<span class="${c.st.buffs[k].mul > 1 ? 'su' : 'sd'}">${STAT_N[k]}${c.st.buffs[k].mul > 1 ? '↑' : '↓'}</span>`);
      if (c.defend) sts.push('<span class="sg">防</span>');
      card.querySelector('.cst').innerHTML = sts.join('');
    });
  },
  msg(t) { this.msgEl.innerHTML = t; this.msgEl.classList.toggle('hidden', !t); },
  layout() {
    const n = this.enemies.length, vw = Game.vw, vh = Game.vh;
    const base = Math.round(vh * (vh > vw ? 0.36 : 0.42));
    this.enemies.forEach((e, i) => {
      const sp = enemySprite(e.d.spr, e.d.pal);
      let sc = e.boss ? 2 : 2;
      if (e.boss) sc = Math.max(1, Math.min(3, Math.floor(Math.min(vw * 0.6, vh * 0.42) / 32)));
      else sc = vw < 260 && n >= 3 ? 2 : (vh > 300 && vw > 300 ? 3 : 2);
      e.sc = sc; e.w = sp.width * sc; e.h = sp.height * sc;
      e.x = Math.round(vw * (i + 1) / (n + 1) - e.w / 2);
      e.y = base - e.h;
    });
  },
  pop(text, x, y, cls) {
    const s = Game.scale;
    const p = U.el('div', 'pop ' + (cls || ''), text);
    p.style.left = (x * s) + 'px'; p.style.top = (y * s) + 'px';
    this.popEl.appendChild(p);
    setTimeout(() => p.remove(), 1100);
  },
  popCard(i, text, cls) {
    const card = this.cards[i]; if (!card) return;
    const p = U.el('div', 'pop card-pop ' + (cls || ''), text);
    card.appendChild(p);
    setTimeout(() => p.remove(), 1100);
  },

  // ---------- 描画 ----------
  draw(ctx) {
    this.t += 1 / 60;
    const vw = Game.vw, vh = Game.vh;
    const bg = BG_DEF[this.opts.bg] || BG_DEF.meadow;
    const hz = Math.round(vh * (vh > vw ? 0.28 : 0.32));
    let g = ctx.createLinearGradient(0, 0, 0, hz);
    g.addColorStop(0, bg.sky[0]); g.addColorStop(1, bg.sky[1]);
    ctx.fillStyle = g; ctx.fillRect(0, 0, vw, hz);
    // 遠景
    ctx.fillStyle = bg.hill;
    for (let x = 0; x < vw; x += 2) {
      const h = bg.cave ? 10 + Math.abs(Math.sin(x * 0.09)) * 14 + Math.sin(x * 0.31) * 3 : 8 + Math.sin(x * 0.04) * 6 + Math.sin(x * 0.13) * 3;
      if (bg.cave) { ctx.fillRect(x, 0, 2, Math.round(h * 0.6)); }
      ctx.fillRect(x, hz - Math.round(h), 2, Math.round(h));
    }
    if (bg.tree) { ctx.fillStyle = '#1d3b22'; for (let x = 4; x < vw; x += 22) { ctx.fillRect(x, hz - 26, 10, 26); ctx.fillRect(x - 4, hz - 34, 18, 14); } }
    g = ctx.createLinearGradient(0, hz, 0, vh);
    g.addColorStop(0, bg.ground[0]); g.addColorStop(1, bg.ground[1]);
    ctx.fillStyle = g; ctx.fillRect(0, hz, vw, vh - hz);
    ctx.fillStyle = 'rgba(0,0,0,0.08)';
    for (let y = hz + 4, k = 0; y < vh; y += 4 + k, k++) ctx.fillRect(0, y, vw, 1);
    if (bg.lava) { ctx.fillStyle = `rgba(255,${120 + Math.round(Math.sin(this.t * 3) * 40)},40,0.25)`; ctx.fillRect(0, hz, vw, 3); }
    // 敵
    for (const e of this.enemies) {
      if (e.fade <= 0) continue;
      const sp = enemySprite(e.d.spr, e.d.pal);
      let ox = 0;
      if (e.shake > 0) { ox = Math.round(Math.sin(e.shake * 40) * 3); e.shake -= 1 / 60; }
      let oy = Math.round(Math.sin(this.t * 2 + e.x) * 1.5);
      if (e.lunge > 0) { oy += Math.round(Math.sin(e.lunge * Math.PI) * 6); e.lunge -= 1 / 20; }
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
      // HPバー
      if (e.alive && (e.hp < e.maxhp || e.boss)) {
        const bw = Math.max(24, Math.min(e.w, 60)), bx = Math.round(e.x + e.w / 2 - bw / 2), by = e.y + e.h + 4;
        ctx.fillStyle = '#181425'; ctx.fillRect(bx - 1, by - 1, bw + 2, 4);
        ctx.fillStyle = e.hp / e.maxhp < 0.3 ? '#e43b44' : '#63c74d';
        ctx.fillRect(bx, by, Math.round(bw * e.hp / e.maxhp), 2);
      }
      if (this.targetIdx !== undefined && this.enemies[this.targetIdx] === e && Math.floor(this.t * 4) % 2) {
        const ax = Math.round(e.x + e.w / 2);
        ctx.fillStyle = '#ffe66d';
        for (let i = 0; i < 4; i++) ctx.fillRect(ax - 3 + i, e.y - 9 + i, 7 - i * 2, 1);
      }
    }
    // エフェクト
    this.fx = this.fx.filter(f => (f.t += 1 / 60) < f.dur);
    for (const f of this.fx) {
      const k = f.t / f.dur;
      ctx.save();
      if (f.type === 'slash') {
        ctx.fillStyle = f.color || '#fff'; ctx.globalAlpha = 1 - k;
        for (let i = 0; i < 18; i++) { const p = (i / 18) * Math.min(1, k * 3); ctx.fillRect(Math.round(f.x - 14 + p * 28 * (f.dir || 1) + (f.dir < 0 ? 28 : 0) - (f.dir < 0 ? 28 : 0)), Math.round(f.y - 14 + p * 28), 2, 2); }
      } else if (f.type === 'burst') {
        ctx.globalAlpha = 1 - k;
        const r = 4 + k * f.r;
        for (let i = 0; i < 16; i++) { const a = i / 16 * Math.PI * 2 + f.t * 2; ctx.fillStyle = i % 2 ? f.color : '#fff'; ctx.fillRect(Math.round(f.x + Math.cos(a) * r) - 1, Math.round(f.y + Math.sin(a) * r * 0.8) - 1, 3, 3); }
        ctx.fillStyle = f.color; ctx.globalAlpha = (1 - k) * 0.35; ctx.beginPath(); ctx.arc(f.x, f.y, r * 0.7, 0, Math.PI * 2); ctx.fill();
      } else if (f.type === 'screen') {
        ctx.globalAlpha = (1 - k) * 0.5; ctx.fillStyle = f.color; ctx.fillRect(0, 0, vw, vh);
      } else if (f.type === 'rise') {
        ctx.globalAlpha = 1 - k; ctx.fillStyle = f.color;
        for (let i = 0; i < 10; i++) ctx.fillRect(Math.round(f.x + Math.sin(i * 7) * 14), Math.round(f.y - k * 24 - i * 3), 2, 2);
      }
      ctx.restore();
    }
  },

  // ---------- 進行 ----------
  async run() {
    const names = this.enemies.map(e => e.n);
    this.msg(this.opts.boss ? `<b class="bossname">${U.esc(names[0])}</b> が あらわれた!` : `${U.esc(names.join('、'))} が あらわれた!`);
    await this.wait(900);
    for (; ;) {
      this.turn++;
      for (const c of this.party) c.defend = false;
      this.refresh();
      const cmds = await this.collect();
      if (cmds === 'escape') {
        const ok = await this.tryEscape();
        if (ok) return 'escape';
        cmds.length = 0;
      }
      const acts = [];
      if (Array.isArray(cmds)) for (const a of cmds) acts.push(a);
      for (const e of this.enemies) if (e.alive) acts.push(this.enemyAct(e));
      for (const a of acts) {
        const s = a.side === 'p' ? this.effStat(a.actor, 'spd') : this.effStat(a.actor, 'spd');
        a.ord = (a.prio || 0) * 1000 + s * (0.85 + Math.random() * 0.3);
      }
      acts.sort((a, b) => b.ord - a.ord);
      for (const a of acts) {
        if (a.side === 'p' ? a.actor.hp <= 0 : !a.actor.alive) continue;
        await this.exec(a);
        this.refresh();
        const end = this.checkEnd();
        if (end) return await this.finish(end);
      }
      await this.endTurn();
      const end = this.checkEnd();
      if (end) return await this.finish(end);
    }
  },
  checkEnd() {
    if (this.enemies.every(e => !e.alive)) return 'win';
    if (this.party.every(c => c.hp <= 0)) return 'lose';
    return null;
  },
  async endTurn() {
    const tick = (u, isP, i) => {
      if (u.st.poison && (isP ? u.hp > 0 : u.alive)) {
        const mx = isP ? charStats(u).hp : u.maxhp;
        const d = Math.max(1, Math.floor(mx * 0.07));
        u.hp = Math.max(1, u.hp - d);
        if (isP) this.popCard(i, d, 'dmg poison'); else this.pop(d, u.x + u.w / 2, u.y + u.h / 3, 'dmg poison');
      }
      if (u.st.buffs) for (const k in u.st.buffs) { if (--u.st.buffs[k].turns <= 0) delete u.st.buffs[k]; }
    };
    this.party.forEach((c, i) => tick(c, true, i));
    this.enemies.forEach(e => tick(e, false));
    this.refresh();
    await this.wait(200);
  },
  effStat(u, k) {
    const isP = !!u.id && !!CHARS[u.id] && !u.d;
    const base = isP ? charStats(u)[k] : u.d[k];
    const b = u.st && u.st.buffs && u.st.buffs[k];
    return Math.max(1, Math.round(base * (b ? b.mul : 1)));
  },

  // コマンド入力
  collect() {
    return new Promise(async resolve => {
      const cmds = [];
      const alive = this.party.map((c, i) => i).filter(i => this.party[i].hp > 0);
      let k = 0;
      const finish = (v) => { this.hideCmd(); this.cards.forEach(c => c.classList.remove('act')); this.msg(''); resolve(v); };
      if (this.auto) { for (const i of alive) cmds.push(this.autoCmd(this.party[i])); await this.wait(150); finish(cmds); return; }
      const ask = async () => {
        if (this.auto) { for (let j = k; j < alive.length; j++) cmds[j] = this.autoCmd(this.party[alive[j]]); finish(cmds); return; }
        if (k >= alive.length) { finish(cmds); return; }
        const i = alive[k], c = this.party[i];
        this.cards.forEach((cd, j) => cd.classList.toggle('act', j === i));
        const r = await this.commandFor(c, i, k === 0);
        if (r === 'auto') { ask(); return; }
        if (r === 'back') { if (k > 0) { k--; cmds.pop(); } ask(); return; }
        if (r === 'escape') { finish('escape'); return; }
        cmds[k] = r; k++;
        ask();
      };
      ask();
    });
  },
  hideCmd() { this.menu = null; this.cmdEl.classList.add('hidden'); this.cmdEl.innerHTML = ''; this.targetIdx = undefined; this.pickAlly = null; this.pickEnemy = null; },
  showMenu(title, items, onSelect, onCancel, onChange, cols) {
    this.cmdEl.innerHTML = '';
    this.cmdEl.classList.remove('hidden');
    if (title) this.cmdEl.appendChild(U.el('div', 'bcmd-t', title));
    const lm = new ListMenu({ items, onSelect, onCancel, onChange, cols });
    this.cmdEl.appendChild(lm.el);
    this.menu = lm;
    return lm;
  },
  commandFor(c, i, first) {
    return new Promise(res => {
      this.cancelInput = () => { this.cancelInput = null; this.hideCmd(); res('auto'); };
      const d = CHARS[c.id];
      const done = v => { this.cancelInput = null; this.hideCmd(); res(v); };
      const main = () => {
        this.targetIdx = undefined;
        this.msg(`<b>${U.esc(d.n)}</b> は どうする?`);
        this.showMenu(null, [
          { label: '⚔ こうげき' }, { label: '✦ スキル' }, { label: '🛡 ぼうぎょ' }, { label: '🧪 どうぐ' }, { label: '💨 にげる', disabled: !!this.opts.boss },
        ], (idx) => {
          if (idx === 0) target('enemy', null, t => done({ side: 'p', actor: c, ci: i, sk: 'attack', t }), main);
          else if (idx === 1) skills();
          else if (idx === 2) done({ side: 'p', actor: c, ci: i, sk: 'defend', prio: 5 });
          else if (idx === 3) items();
          else if (idx === 4) done('escape');
        }, () => done('back'), null, 1);
      };
      const skills = () => {
        const list = charSkills(c);
        const s = charStats(c);
        this.msg(`MP ${c.mp}/${s.mp}`);
        if (!list.length) { this.msg('使えるスキルがない!'); setTimeout(main, 700); return; }
        this.showMenu(null, list.map(id => {
          const sk = SKILLS[id];
          const el = sk.elem ? `<span class="tel" style="color:${ELEM[sk.elem].c}">${ELEM[sk.elem].n}</span>` : '';
          return { label: `${el}${U.esc(sk.n)}<span class="mpc">${sk.mp}</span>`, disabled: c.mp < sk.mp };
        }), (idx) => {
          const id = list[idx], sk = SKILLS[id];
          target(sk.target, sk, t => done({ side: 'p', actor: c, ci: i, sk: id, t }), skills);
        }, main, (idx) => { const sk = SKILLS[list[idx]]; if (sk) this.msg(`${U.esc(sk.desc || '')} <span class="mpc">消費MP ${sk.mp}</span>`); }, 1);
      };
      const items = () => {
        const list = Object.keys(G.items).filter(k => G.items[k] > 0 && ITEMS[k]);
        if (!list.length) { this.msg('どうぐを持っていない!'); setTimeout(main, 700); return; }
        this.showMenu(null, list.map(id => ({ label: `${U.esc(ITEMS[id].n)}<span class="mpc">×${G.items[id]}</span>` })), (idx) => {
          const id = list[idx], it = ITEMS[id];
          target(it.type === 'revive' ? 'dead' : 'ally', null, t => done({ side: 'p', actor: c, ci: i, item: id, t, prio: 3 }), items);
        }, main, (idx) => { const it = ITEMS[list[idx]]; if (it) this.msg(U.esc(it.desc)); }, 1);
      };
      const target = (type, sk, ok, back) => {
        if (type === 'enemies' || type === 'allies' || type === 'self') { ok(type === 'self' ? i : -1); return; }
        if (type === 'enemy') {
          const al = this.enemies.map((e, j) => j).filter(j => this.enemies[j].alive);
          const lm = this.showMenu('だれに?', al.map(j => {
            const e = this.enemies[j]; const w = sk && sk.elem ? elemMult(sk.elem, e.d.elem) : (SKILLS.attack && charStats(c).elem !== 'none' ? elemMult(charStats(c).elem, e.d.elem) : 1);
            return { label: U.esc(e.n) + (w > 1 && G.seen[e.id] ? '<span class="weak">WEAK</span>' : '') };
          }), idx => ok(al[idx]), back, idx => { this.targetIdx = al[idx]; }, 1);
          this.targetIdx = al[0];
          this.pickEnemy = j => { const k2 = al.indexOf(j); if (k2 >= 0) { lm.i = k2; lm.mark(); lm.select(); } };
          return;
        }
        const al = this.party.map((p, j) => j).filter(j => type === 'dead' ? this.party[j].hp <= 0 : this.party[j].hp > 0);
        if (!al.length) { this.msg('対象がいない!'); setTimeout(back, 700); return; }
        const lm = this.showMenu('だれに?', al.map(j => { const p = this.party[j], s = charStats(p); return { label: `${U.esc(CHARS[p.id].n)} <span class="mpc">${Math.max(0, p.hp)}/${s.hp}</span>` }; }), idx => ok(al[idx]), back, idx => { this.cards.forEach((cd, j) => cd.classList.toggle('tgt', j === al[idx])); }, 1);
        this.pickAlly = j => { const k2 = al.indexOf(j); if (k2 >= 0) { lm.i = k2; lm.mark(); lm.select(); } };
      };
      main();
    }).then(v => { this.cards.forEach(cd => cd.classList.remove('tgt')); return v; });
  },
  autoCmd(c) {
    const i = this.party.indexOf(c);
    const s = charStats(c);
    const sks = charSkills(c).filter(id => SKILLS[id].mp <= c.mp);
    const low = this.party.filter(p => p.hp > 0 && p.hp < charStats(p).hp * 0.45);
    const dead = this.party.filter(p => p.hp <= 0);
    if (dead.length && sks.includes('revive')) return { side: 'p', actor: c, ci: i, sk: 'revive', t: this.party.indexOf(dead[0]) };
    if (low.length >= 2) { const h = ['prayer', 'healall'].find(k => sks.includes(k)); if (h) return { side: 'p', actor: c, ci: i, sk: h, t: -1 }; }
    if (low.length) { const h = ['healmore', 'heal'].find(k => sks.includes(k)); if (h) { low.sort((a, b) => a.hp / charStats(a).hp - b.hp / charStats(b).hp); return { side: 'p', actor: c, ci: i, sk: h, t: this.party.indexOf(low[0]) }; } }
    const alive = this.enemies.filter(e => e.alive);
    const atk = sks.filter(id => ['phys', 'mag'].includes(SKILLS[id].type) && id !== 'drain');
    let best = 'attack', bestScore = (s.elem !== 'none' ? 1 : 1) * 1, bt = null;
    if (c.mp > s.mp * 0.25) {
      for (const id of atk) {
        const sk = SKILLS[id];
        for (const e of alive) {
          const st = sk.type === 'phys' ? s.atk : s.mag;
          let sc = sk.pow * (sk.hits || 1) * elemMult(sk.elem, e.d.elem) * st / Math.max(1, s.atk);
          if (sk.target === 'enemies') sc *= Math.min(alive.length, 3) * 0.8;
          if (sc > bestScore) { bestScore = sc; best = id; bt = e; }
        }
      }
    }
    const tgt = bt || alive.slice().sort((a, b) => a.hp - b.hp)[0];
    const sk = SKILLS[best];
    return { side: 'p', actor: c, ci: i, sk: best, t: sk.target === 'enemies' ? -1 : this.enemies.indexOf(tgt) };
  },
  enemyAct(e) {
    const acts = e.d.act;
    let pool = acts.slice();
    if (e.boss && e.hp < e.maxhp * 0.35) pool = pool.map(([k, w]) => [k, SKILLS[k] && SKILLS[k].target === 'enemies' ? w * 2 : w]);
    if (e.hp > e.maxhp * 0.7) pool = pool.filter(([k]) => k !== 'e_heal');
    const tot = pool.reduce((a, b) => a + b[1], 0);
    let r = Math.random() * tot, sk = pool[0][0];
    for (const [k, w] of pool) { r -= w; if (r <= 0) { sk = k; break; } }
    const alive = this.party.map((c, i) => i).filter(i => this.party[i].hp > 0);
    const t = alive[Math.floor(Math.random() * alive.length)];
    return { side: 'e', actor: e, sk, t };
  },

  // 行動実行
  async exec(a) {
    if (a.sk === 'defend') {
      a.actor.defend = true;
      this.msg(`<b>${U.esc(CHARS[a.actor.id].n)}</b> は 身を守っている。`);
      this.refresh();
      await this.wait(500);
      return;
    }
    if (a.item) return this.execItem(a);
    const sk = SKILLS[a.sk];
    const isP = a.side === 'p';
    const name = isP ? CHARS[a.actor.id].n : a.actor.n;
    if (isP && sk.mp) { if (a.actor.mp < sk.mp) { this.msg(`${U.esc(name)} は MPが足りない!`); await this.wait(600); return; } a.actor.mp -= sk.mp; }
    this.msg(a.sk === 'attack' ? `<b>${U.esc(name)}</b> の こうげき!` : `<b>${U.esc(name)}</b> の <span class="skn">${U.esc(sk.n)}</span>!`);
    if (isP) { const cd = this.cards[a.ci]; cd.classList.remove('hop'); void cd.offsetWidth; cd.classList.add('hop'); }
    else { a.actor.lunge = 1; }
    this.refresh();
    await this.wait(380);
    // 対象決定
    let targets = [];
    const foes = isP ? this.enemies : this.party;
    const allies = isP ? this.party : this.enemies;
    const aliveOf = (arr, side) => arr.filter(u => side === 'e' ? u.alive : u.hp > 0);
    if (sk.target === 'enemy') {
      let t = foes[a.t];
      if (!t || (isP ? !t.alive : t.hp <= 0)) t = aliveOf(foes, isP ? 'e' : 'p')[0];
      if (t) targets = [t];
    } else if (sk.target === 'enemies') targets = aliveOf(foes, isP ? 'e' : 'p');
    else if (sk.target === 'ally') { let t = allies[a.t]; if (!t || t.hp <= 0) t = a.actor; targets = [t]; }
    else if (sk.target === 'allies') targets = aliveOf(allies, isP ? 'p' : 'e');
    else if (sk.target === 'self') targets = [a.actor];
    else if (sk.target === 'dead') { const t = allies[a.t]; if (t && t.hp <= 0) targets = [t]; }
    if (!targets.length) { await this.wait(300); return; }
    const sound = sk.elem === 'fire' ? 'fire' : sk.elem === 'water' ? 'ice' : sk.type === 'mag' ? 'magic' : 'hit';
    if (sk.type === 'phys' || sk.type === 'mag') {
      const hits = sk.hits || 1;
      for (let h = 0; h < hits; h++) {
        for (const t of targets) {
          if (isP ? !t.alive : t.hp <= 0) continue;
          await this.hit(a.actor, t, sk, isP, sound);
        }
        if (hits > 1) await this.wait(160);
      }
      if (sk.target === 'enemies' && !isP) this.fx.push({ type: 'screen', color: ELEM[sk.elem || 'none'].c, t: 0, dur: 0.4 });
    } else if (sk.type === 'heal') {
      Sound.play('heal');
      for (const t of targets) {
        const tp = isP ? t : null;
        if (isP) {
          const s = charStats(t), amt = Math.round((this.effStat(a.actor, 'mag') * 1.1 + 14) * sk.pow * (0.92 + Math.random() * 0.16));
          const v = Math.min(s.hp - t.hp, amt); t.hp += v;
          this.popCard(this.party.indexOf(t), '+' + amt, 'heal');
          this.glowCard(this.party.indexOf(t), 'heal');
          if (sk.buff) { t.st.buffs = t.st.buffs || {}; t.st.buffs[sk.buff[0]] = { mul: sk.buff[1], turns: sk.buff[2] }; }
        } else {
          const amt = Math.round(t.maxhp * 0.12 * sk.pow);
          t.hp = Math.min(t.maxhp, t.hp + amt);
          this.pop('+' + amt, t.x + t.w / 2, t.y + t.h / 3, 'heal');
          this.fx.push({ type: 'rise', x: t.x + t.w / 2, y: t.y + t.h * 0.8, color: '#9ef07a', t: 0, dur: 0.8 });
        }
      }
      await this.wait(650);
    } else if (sk.type === 'revive') {
      Sound.play('heal');
      for (const t of targets) { const s = charStats(t); t.hp = Math.max(1, Math.round(s.hp * sk.pow)); t.st = {}; this.popCard(this.party.indexOf(t), '復活!', 'heal'); this.glowCard(this.party.indexOf(t), 'heal'); }
      await this.wait(700);
    } else if (sk.type === 'cure') {
      Sound.play('heal');
      for (const t of targets) { delete t.st.poison; this.popCard(this.party.indexOf(t), '回復', 'heal'); }
      await this.wait(600);
    } else if (sk.type === 'buff') {
      Sound.play('buff');
      for (const t of targets) {
        t.st.buffs = t.st.buffs || {}; t.st.buffs[sk.stat] = { mul: sk.mul, turns: sk.turns + 1 };
        if (isP) { this.popCard(this.party.indexOf(t), STAT_N[sk.stat] + 'UP', 'buff'); this.glowCard(this.party.indexOf(t), 'buff'); }
        else this.pop(STAT_N[sk.stat] + 'UP', t.x + t.w / 2, t.y, 'buff');
      }
      await this.wait(600);
    } else if (sk.type === 'debuff') {
      Sound.play('debuff');
      for (const t of targets) {
        t.st.buffs = t.st.buffs || {}; t.st.buffs[sk.stat] = { mul: sk.mul, turns: sk.turns + 1 };
        this.pop(STAT_N[sk.stat] + 'DOWN', t.x + t.w / 2, t.y, 'debuff');
        this.fx.push({ type: 'burst', x: t.x + t.w / 2, y: t.y + t.h / 2, color: '#b36bff', r: 18, t: 0, dur: 0.5 });
      }
      await this.wait(600);
    }
  },
  glowCard(i, cls) { const cd = this.cards[i]; if (!cd) return; cd.classList.remove('g-heal', 'g-buff', 'g-hit'); void cd.offsetWidth; cd.classList.add('g-' + cls); },
  async hit(att, def, sk, isP, sound) {
    const atkSide = isP ? att : att;
    const phys = sk.type === 'phys';
    const A = phys ? this.effStat(att, 'atk') : this.effStat(att, 'mag');
    const D = phys ? this.effStat(def, 'def') : Math.round(this.effStat(def, 'def') * 0.5 + this.effStat(def, 'mag') * 0.35);
    let elem = sk.elem;
    if (!elem && isP && sk === SKILLS.attack) elem = charStats(att).elem;
    const defElem = isP ? def.d.elem : CHARS[def.id].elem;
    const em = elemMult(elem, defElem);
    let dmg = (A * A) / (A + D) * 0.9 * sk.pow * (0.9 + Math.random() * 0.2) * em;
    let crit = false;
    if (phys && Math.random() < 0.08) { crit = true; dmg *= 1.6; }
    if (!isP && def.defend) dmg *= 0.5;
    dmg = Math.max(1, Math.round(dmg));
    if (isP) {
      // 敵へ
      def.hp -= dmg; def.flash = 0.25; def.shake = 0.3;
      G.seen[def.id] = 1;
      const cx = def.x + def.w / 2, cy = def.y + def.h / 2;
      if (phys) this.fx.push({ type: 'slash', x: cx, y: cy, color: elem && elem !== 'none' ? ELEM[elem].c : '#fff', t: 0, dur: 0.3, dir: 1 });
      else this.fx.push({ type: 'burst', x: cx, y: cy, color: ELEM[elem || 'none'].c, r: 22, t: 0, dur: 0.5 });
      Sound.play(crit ? 'crit' : sound);
      this.pop(dmg, cx, def.y + def.h * 0.3, 'dmg' + (crit ? ' crit' : ''));
      if (em > 1) this.pop('WEAK!', cx, def.y, 'weak');
      else if (em < 1) this.pop('RESIST', cx, def.y, 'resist');
      if (crit) this.pop('CRITICAL!', cx, def.y - 10, 'weak');
      if (sk.drain) { const s = charStats(att); const v = Math.round(dmg * sk.drain); att.hp = Math.min(s.hp, att.hp + v); this.popCard(this.party.indexOf(att), '+' + v, 'heal'); }
      if (def.hp <= 0) { def.hp = 0; def.alive = false; await this.wait(120); Sound.play('die'); }
    } else {
      // 味方へ
      const i = this.party.indexOf(def);
      def.hp -= dmg;
      Sound.play('damage');
      this.glowCard(i, 'hit');
      this.fx.push({ type: 'screen', color: '#e43b44', t: 0, dur: 0.2 });
      this.popCard(i, dmg, 'dmg' + (crit ? ' crit' : ''));
      if (em > 1) this.popCard(i, 'WEAK!', 'weak up');
      if (sk.poison && Math.random() < sk.poison && def.hp > 0) { def.st.poison = true; this.popCard(i, '毒!', 'poison up'); }
      if (sk.drain) { const v = Math.round(dmg * sk.drain); att.hp = Math.min(att.maxhp, att.hp + v); }
      if (def.hp <= 0) { def.hp = 0; def.st = {}; }
    }
    this.refresh();
    await this.wait(420);
  },
  async execItem(a) {
    const it = ITEMS[a.item];
    const name = CHARS[a.actor.id].n;
    if (!G.items[a.item]) { this.msg('どうぐがなくなっていた!'); await this.wait(500); return; }
    const t = this.party[a.t];
    if (!t) return;
    if (it.type === 'revive' ? t.hp > 0 : t.hp <= 0) { this.msg('しかし 効果がなかった!'); await this.wait(500); return; }
    useItemCount(a.item);
    this.msg(`<b>${U.esc(name)}</b> は ${U.esc(it.n)} を使った!`);
    Sound.play('heal');
    const s = charStats(t);
    if (it.type === 'heal') { t.hp = Math.min(s.hp, t.hp + it.amt); this.popCard(a.t, '+' + it.amt, 'heal'); }
    if (it.type === 'mp') { t.mp = Math.min(s.mp, t.mp + it.amt); this.popCard(a.t, 'MP+' + it.amt, 'mp'); }
    if (it.type === 'cure') { delete t.st.poison; this.popCard(a.t, '回復', 'heal'); }
    if (it.type === 'revive') { t.hp = Math.round(s.hp * it.amt); this.popCard(a.t, '復活!', 'heal'); }
    if (it.type === 'full') { t.hp = s.hp; t.mp = s.mp; this.popCard(a.t, '全回復!', 'heal'); }
    this.glowCard(a.t, 'heal');
    this.refresh();
    await this.wait(650);
  },
  async tryEscape() {
    this.msg('逃げ出そうとした…');
    await this.wait(400);
    const ps = this.party.filter(c => c.hp > 0).reduce((s, c) => s + charStats(c).spd, 0) / Math.max(1, this.party.filter(c => c.hp > 0).length);
    const es = this.enemies.filter(e => e.alive).reduce((s, e) => s + e.d.spd, 0) / Math.max(1, this.enemies.filter(e => e.alive).length);
    const ch = U.clamp(0.6 + (ps - es) * 0.02 + (this.escTries || 0) * 0.15, 0.3, 0.95);
    this.escTries = (this.escTries || 0) + 1;
    if (Math.random() < ch) {
      Sound.play('escape');
      this.msg('うまく逃げ切れた!');
      await this.wait(600);
      return true;
    }
    this.msg('しかし まわりこまれてしまった!');
    await this.wait(600);
    return false;
  },
  async finish(res) {
    this.hideCmd();
    if (res === 'lose') {
      Sound.stopBgm();
      Sound.play('die');
      this.msg('パーティは全滅してしまった…');
      await this.wait(1600);
      return 'lose';
    }
    // 勝利
    let exp = 0, gold = 0, stones = 0;
    const drops = [];
    for (const e of this.enemies) {
      exp += e.d.exp; gold += e.d.gold;
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
      if (inParty && c.hp <= 0) continue;
      const ups = gainExp(c, inParty ? exp : Math.floor(exp / 2));
      if (ups.length && inParty) {
        const u = ups[ups.length - 1];
        lvMsgs.push({ c, lv: u.lv, skills: ups.flatMap(x => x.skills) });
      } else if (ups.length) lvMsgs.push({ c, lv: ups[ups.length - 1].lv, skills: [], reserve: true });
    }
    for (const c of this.party) c.st = {};
    // リザルト
    const box = U.el('div', 'win result');
    let html = `<div class="rt">VICTORY!</div><div class="rrow"><span>経験値</span><b>${exp} EXP</b></div><div class="rrow"><span>ゴールド</span><b>${gold} G</b></div>`;
    if (stones) html += `<div class="rrow st"><span>星晶石</span><b>+${stones}</b></div>`;
    if (drops.length) html += `<div class="rrow"><span>アイテム</span><b>${drops.map(d => U.esc(ITEMS[d].n)).join('、')}</b></div>`;
    for (const m of lvMsgs) {
      html += `<div class="rlv"><img src="${portraitURL(CHARS[m.c.id].look)}"><div><b>${U.esc(CHARS[m.c.id].n)}</b> は レベル${m.lv} になった!${m.skills.length ? `<br><span class="skn">${m.skills.map(s => U.esc(SKILLS[s].n)).join('、')}</span> を覚えた!` : ''}</div></div>`;
    }
    box.innerHTML = html;
    this.layer.el.appendChild(box);
    if (lvMsgs.length) setTimeout(() => Sound.play('levelup'), 700);
    Game.hud();
    await new Promise(r => { this.onAny = () => { this.onAny = null; r(); }; setTimeout(() => { if (this.auto && this.onAny) this.onAny(); }, 2200); });
    return 'win';
  },
  cleanup() {
    this.active = false;
    if (this.layer) UI.pop(this.layer);
    this.layer = null; this.menu = null; this.onAny = null;
    Game.scene = 'field';
    for (const c of this.party) { c.defend = false; if (c.st) delete c.st.buffs; }
  },
};
