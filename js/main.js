'use strict';
// ===== メイン =====
const Game = {
  scene: 'title', vw: 320, vh: 240, scale: 2, last: 0,
  init() {
    this.cv = document.getElementById('cv');
    this.ctx = this.cv.getContext('2d');
    UI.init();
    Input.init();
    Input.handler = k => this.onKey(k);
    try { const o = JSON.parse(localStorage.getItem('seishou_opts') || '{}'); if (o.m === false) Sound.setMusic(false); if (o.s === false) Sound.setSfx(false); } catch (e) { }
    buildSprites();
    buildWorld();
    this.hudEl = U.el('div', 'hud hidden');
    UI.root.appendChild(this.hudEl);
    window.addEventListener('resize', () => this.resize());
    window.addEventListener('orientationchange', () => setTimeout(() => this.resize(), 200));
    document.addEventListener('visibilitychange', () => { if (document.hidden) Sound.stopBgm(); else if (Sound.cur) { const c = Sound.cur; Sound.cur = null; Sound.bgm(c); } });
    this.resize();
    this.title();
    requestAnimationFrame(t => this.loop(t));
  },
  resize() {
    const scr = document.getElementById('screen');
    const r = scr.getBoundingClientRect();
    const cw = Math.max(1, r.width), ch = Math.max(1, r.height);
    const minSide = Math.min(cw, ch);
    const scale = Math.max(1, Math.round(minSide / (16 * 12)));
    this.scale = scale;
    this.vw = Math.ceil(cw / scale); this.vh = Math.ceil(ch / scale);
    this.cv.width = this.vw; this.cv.height = this.vh;
    this.cv.style.width = this.vw * scale + 'px'; this.cv.style.height = this.vh * scale + 'px';
    this.ctx.imageSmoothingEnabled = false;
    const fs = U.clamp(Math.round(Math.min(cw, ch * 1.25) / 26), 12, 20);
    document.documentElement.style.setProperty('--fs', fs + 'px');
    if (Battle.active) Battle.layout();
  },
  loop(t) {
    const dt = Math.min(0.05, (t - this.last) / 1000 || 0);
    this.last = t;
    Input.update(dt, UI.active());
    const ctx = this.ctx;
    const hideHud = this.scene !== 'field' || UI.active();
    if (hideHud !== this._hudHidden) { this._hudHidden = hideHud; this.hudEl.style.visibility = hideHud ? 'hidden' : 'visible'; }
    if (this.scene === 'field') {
      Field.update(dt);
      G.playtime += dt;
      Field.draw(ctx);
    } else if (this.scene === 'battle') {
      G.playtime += dt;
      Battle.draw(ctx);
    } else if (this.scene === 'trans') {
      Field.draw(ctx);
    } else if (this.scene === 'title') {
      this.drawTitleBg(ctx, dt);
    }
    requestAnimationFrame(tt => this.loop(tt));
  },
  onKey(k) {
    if (UI.handle(k)) return;
    if (this.scene === 'field' && !Field.busy) {
      if (k === 'a') Field.interact();
      else if (k === 'menu') this.openMenu();
    }
  },
  async openMenu() {
    if (Field.busy || this.scene !== 'field') return;
    Field.busy = true;
    await Menu.open();
    Field.busy = false;
  },
  hud() {
    if (!G || this.scene !== 'field') { this.hudEl.classList.add('hidden'); return; }
    this.hudEl.classList.remove('hidden');
    const cr = Object.keys(CRYSTAL_INFO).map(k => `<i class="${G.crystals.includes(k) ? 'on' : ''}" style="--cc:${CRYSTAL_INFO[k].c}"></i>`).join('');
    this.hudEl.innerHTML = `<div><div class="hud-loc">${U.esc(Field.locName || '')}</div><div class="hud-crys">${cr}</div></div><div class="hud-r"><div class="hud-st"><span class="gem">◆</span>${G.stones}</div><div class="hud-btn" data-a="gacha">ガチャ</div><div class="hud-btn m" data-a="menu">MENU</div></div>`;
    this.hudEl.querySelectorAll('.hud-btn').forEach(b => b.onclick = async e => {
      e.stopPropagation();
      if (Field.busy || UI.active() || this.scene !== 'field') return;
      if (b.dataset.a === 'menu') this.openMenu();
      else { Field.busy = true; Sound.play('ok'); await Gacha.open(); Field.busy = false; this.hud(); }
    });
  },

  // ---------- タイトル ----------
  title() {
    this.scene = 'title';
    for (const l of UI.stack.slice()) UI.pop(l);
    this.hud();
    this.tcam = { x: 40 * TS, y: 70 * TS, t: 0 };
    Sound.bgm('title');
    const el = U.el('div', 'layer title-layer');
    const girls = ['aria', 'seres', 'noa', 'homura', 'sylphy', 'stella'];
    el.innerHTML = `<div class="title-girls">${girls.map(g => `<img src="${portraitURL(CHARS[g].look)}">`).join('')}</div><div class="logo"><div class="l1">星晶のクロニクル</div><div class="l2">STAR CRYSTAL CHRONICLE</div><div class="l3">― オープンワールド・ドットRPG ―</div></div>`;
    const box = UI.win('title-menu');
    const has = hasSave();
    const info = has ? saveInfo() : null;
    const items = [{ label: 'はじめから' }, { label: 'つづきから' + (info ? ` <small class="dim">Lv${info.lv} 水晶${info.crystals}/4 ${fmtTime(info.time)}</small>` : ''), disabled: !has }];
    const lm = new ListMenu({
      items, start: has ? 1 : 0, onSelect: async i => {
        if (i === 0) {
          if (has) { lm.locked = true; const c = await UI.ask('セーブデータがあります。\nはじめから始めますか?\n(セーブするまで上書きはされません)', ['はじめる', 'やめる']); lm.locked = false; if (c !== 0) return; }
          UI.pop(layer); this.newGame();
        } else { UI.pop(layer); this.continueGame(); }
      },
    });
    box.appendChild(lm.el);
    el.appendChild(box);
    el.appendChild(U.el('div', 'title-foot', '移動:矢印/WASD　決定:Z/Enter　キャンセル:X　メニュー:C<br>スマホは画面下のパッドで操作'));
    const layer = { el, handle: k => lm.handle(k) };
    UI.push(layer);
  },
  drawTitleBg(ctx, dt) {
    const c = this.tcam; c.t += dt;
    c.x = (110 + Math.sin(c.t * 0.05) * 40) * TS;
    c.y = (140 + Math.cos(c.t * 0.04) * 24) * TS;
    Field.cam.x = Math.round(U.clamp(c.x, 0, MW * TS - this.vw)); Field.cam.y = Math.round(U.clamp(c.y, 0, MH * TS - this.vh));
    Field.time += dt;
    const objs = Field.objs; Field.objs = new Map();
    const cr = Field.curRegion; Field.curRegion = 0;
    Field.hideP = true;
    Field.draw(ctx);
    Field.hideP = false; Field.objs = objs; Field.curRegion = cr;
  },
  async newGame() {
    buildWorld();
    newGame();
    Field.init();
    this.scene = 'field';
    this.hud();
    Field.busy = true;
    await Story.intro();
    G.login = U.today();
    Field.busy = false;
    Field.updateLoc(true);
    this.hud();
  },
  async continueGame() {
    buildWorld();
    newGame();
    if (!loadGame()) { this.title(); return; }
    Field.init();
    this.scene = 'field';
    this.hud();
    Field.busy = true;
    await UI.fade('#000', 10, 0, 500);
    await Story.login();
    Field.busy = false;
  },
  async gameOver() {
    Sound.stopBgm();
    const el = U.el('div', 'layer title-layer');
    el.innerHTML = '<div class="logo"><div class="l1" style="background:linear-gradient(#fff,#ff6a6a);-webkit-background-clip:text;background-clip:text">GAME OVER</div><div class="l2">― 力尽きてしまった… ―</div></div>';
    const box = UI.win('title-menu');
    const has = hasSave();
    await new Promise(res => {
      const lm = new ListMenu({ items: [{ label: has ? '最後のセーブから再開' : '村からやり直す' }, { label: 'タイトルへ' }], onSelect: i => { UI.pop(layer); res(i); this._go = i; } });
      box.appendChild(lm.el); el.appendChild(box);
      const layer = { el, handle: k => lm.handle(k) };
      UI.push(layer);
    });
    if (this._go === 1) { this.title(); return; }
    if (has) { await this.continueGame(); return; }
    // セーブがない場合: 村で復活 (所持金半分)
    G.gold = Math.floor(G.gold / 2);
    healAll();
    Field.teleport(WORLD.start.x, WORLD.start.y, 'd');
    this.scene = 'field';
    this.hud();
    await UI.say('気がつくと ルミナ村にいた…\n(所持金が半分になった)');
  },
};

// バトル終了時の後処理をフック
const _bStart = Battle.start.bind(Battle);
Battle.start = async function (ids, opts) {
  Game.hud();
  const r = await _bStart(ids, opts);
  if (r === 'lose') { await Game.gameOver(); return r; }
  Game.scene = 'field';
  Game.hud();
  Field.updateLoc(true);
  return r;
};

window.addEventListener('load', () => Game.init());
