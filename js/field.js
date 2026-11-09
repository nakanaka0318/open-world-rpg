'use strict';
// ===== フィールド (移動・描画・ギミック・シンボルエンカウント) =====
const DIRS = { up: [0, -1, 'u'], down: [0, 1, 'd'], left: [-1, 0, 'l'], right: [1, 0, 'r'] };
const DV = { u: [0, -1], d: [0, 1], l: [-1, 0], r: [1, 0] };

const Field = {
  p: null, objs: new Map(), enemies: [], npcs: [], boulders: [], bosses: [],
  curRegion: 0, cam: { x: 0, y: 0 }, time: 0, invuln: 0, busy: false, locName: '',
  fog: null,

  key(x, y) { return y * MW + x; },
  tile(x, y) { return (x < 0 || y < 0 || x >= MW || y >= MH) ? T.OCEAN : WORLD.tiles[y * MW + x]; },
  regionAt(x, y) { return WORLD.region[y * MW + x] || 0; },

  init() {
    const W = WORLD;
    this.p = { x: G.pos.x, y: G.pos.y, fx: G.pos.x, fy: G.pos.y, t: 1, moving: false, dir: G.pos.dir || 'd', steps: 0 };
    // ギミック状態を反映
    for (const g of W.objs.gates) if (G.solved[g.struct + ':' + g.group]) this.setFloor(g.x, g.y, g.struct);
    for (const h of W.objs.holes) if (G.holes[h.x + ',' + h.y]) W.tiles[this.key(h.x, h.y)] = T.FILLED;
    for (const d of W.objs.rdoors) if (G.rdoors[d.id]) this.setFloor(d.x, d.y, d.struct);
    if (G.seal) W.tiles[this.key(W.seal.x, W.seal.y)] = T.BRIDGE;
    // オブジェクト
    this.objs = new Map();
    this.boulders = W.objs.boulders.map(b => {
      const s = G.boulders[b.id];
      const o = { type: 'boulder', id: b.id, x: s ? s[0] : b.sx, y: s ? s[1] : b.sy, sx: b.sx, sy: b.sy, struct: b.struct, gone: s === null };
      if (s === null) o.gone = true;
      return o;
    });
    for (const b of this.boulders) if (!b.gone) this.place(b);
    for (const c of W.objs.chests) this.place(Object.assign({ type: 'chest' }, c));
    for (const s of W.objs.saves) this.place(Object.assign({ type: 'save' }, s));
    this.bosses = [];
    for (const b of W.objs.bosses) if (!G.bosses[b.id]) { const o = Object.assign({ type: 'boss' }, b); this.bosses.push(o); this.place(o); }
    this.npcs = W.objs.npcs.map(n => Object.assign({ type: 'npc', fx: n.x, fy: n.y, t: 1, dir: 'd', timer: Math.random() * 3 }, n, NPCS[n.id] || {}));
    for (const n of this.npcs) this.place(n);
    // 敵シンボル
    this.enemies = W.objs.spawns.map((s, i) => ({ type: 'enemy', i, sx: s.x, sy: s.y, x: s.x, y: s.y, fx: s.x, fy: s.y, t: 1, area: s.area, region: s.region, alive: true, timer: Math.random() * 2, stun: 0, respawn: 0, dir: 'd', lead: null }));
    for (const e of this.enemies) { e.lead = this.pickLead(e.area); this.place(e); }
    // 町の中には敵が入れない
    this.noEnemy = new Uint8Array(MW * MH);
    for (const s of W.structs) if (s.kind !== 'dungeon') for (let y = s.y - 2; y < s.y + s.h + 2; y++) for (let x = s.x - 2; x < s.x + s.w + 2; x++) if (x >= 0 && y >= 0 && x < MW && y < MH) this.noEnemy[this.key(x, y)] = 1;
    this.curRegion = this.regionAt(this.p.x, this.p.y);
    this.reveal();
    this.updateLoc(true);
  },
  pickLead(area) { const a = AREAS[area]; const g = a.groups[Math.floor(Math.random() * a.groups.length)]; return g[0]; },
  setFloor(x, y, structId) {
    const st = WORLD.structs.find(s => s.id === structId);
    WORLD.tiles[this.key(x, y)] = st ? st.floor : T.STONEF;
  },
  place(o) { this.objs.set(this.key(o.x, o.y), o); },
  unplace(o) { const k = this.key(o.x, o.y); if (this.objs.get(k) === o) this.objs.delete(k); },
  objAt(x, y) { return this.objs.get(this.key(x, y)); },
  moveObj(o, x, y) { this.unplace(o); o.x = x; o.y = y; this.place(o); },

  walkable(x, y, forEnemy) {
    const t = this.tile(x, y);
    if (TILE_DEFS[t].solid) return false;
    if (this.objAt(x, y)) return false;
    return true;
  },

  reveal() {
    const r = 6, px = this.p.x, py = this.p.y;
    for (let y = py - r; y <= py + r; y++) for (let x = px - r; x <= px + r; x++) {
      if (x < 0 || y < 0 || x >= MW || y >= MH) continue;
      if ((x - px) * (x - px) + (y - py) * (y - py) <= r * r + 2) G.explored[this.key(x, y)] = 1;
    }
  },

  locInfo() {
    const r = this.curRegion;
    if (r) {
      const R = WORLD.regions[r];
      if (R.type === 'dungeon') return { name: R.name, bgm: 'dungeon', kind: 'dungeon' };
    }
    const x = this.p.x, y = this.p.y;
    for (const s of WORLD.structs) if (s.kind !== 'dungeon' && x >= s.x - 1 && y >= s.y - 1 && x <= s.x + s.w && y <= s.y + s.h) return { name: s.name, bgm: 'town', kind: 'town' };
    if (WORLD.biome[this.key(x, y)] === 6) return { name: '魔王城の島', bgm: 'dungeon', kind: 'field' };
    return { name: AREAS[biomeArea(x, y)].n, bgm: 'field', kind: 'field' };
  },
  updateLoc(force) {
    const li = this.locInfo();
    if (force || li.name !== this.locName) {
      const changed = this.locName && li.name !== this.locName;
      this.locName = li.name;
      Game.hud();
      if (changed && li.kind !== 'field') UI.toast(`<b>${U.esc(li.name)}</b>`, 1500);
    }
    if (Game.scene === 'field') Sound.bgm(li.bgm);
  },

  // ---------- 更新 ----------
  update(dt) {
    this.time += dt;
    if (this.invuln > 0) this.invuln -= dt;
    const p = this.p;
    const canAct = !UI.active() && !this.busy;
    // プレイヤー移動
    if (p.moving) {
      const speed = Input.held.b ? 12 : 7;
      p.t += dt * speed;
      if (p.t >= 1) { p.t = 1; p.moving = false; this.arrive(); }
    }
    if (!p.moving && canAct) {
      const d = Input.dir();
      if (d) this.tryMove(d);
    }
    // NPC・敵
    if (canAct) {
      for (const n of this.npcs) this.updateNPC(n, dt);
      for (const e of this.enemies) this.updateEnemy(e, dt);
    }
    this.updateCam();
  },
  tryMove(d) {
    const p = this.p, [dx, dy, dc] = DIRS[d];
    p.dir = dc;
    const nx = p.x + dx, ny = p.y + dy;
    const o = this.objAt(nx, ny);
    if (o) {
      if (o.type === 'boulder') { if (!this.push(o, dx, dy)) return; }
      else if (o.type === 'enemy' && o.alive) { this.encounter(o); return; }
      else if (o.type === 'boss') { this.bossTalk(o); return; }
      else return;
    }
    const t = this.tile(nx, ny);
    if (TILE_DEFS[t].solid) { if (t === T.SEAL && !this.sealHinted) { this.sealHinted = true; this.interactTile(nx, ny, t); } return; }
    p.fx = p.x; p.fy = p.y; p.x = nx; p.y = ny; p.t = 0; p.moving = true; p.steps++;
    const nr = this.regionAt(nx, ny);
    if (nr !== this.curRegion) { this.curRegion = nr; }
  },
  push(b, dx, dy) {
    const tx = b.x + dx, ty = b.y + dy;
    const t = this.tile(tx, ty);
    if (this.regionAt(tx, ty) !== this.regionAt(b.x, b.y)) return false;
    if (this.objAt(tx, ty)) return false;
    if (t === T.HOLE) {
      this.unplace(b); b.gone = true;
      WORLD.tiles[this.key(tx, ty)] = T.FILLED;
      G.holes[tx + ',' + ty] = 1;
      G.boulders[b.id] = null;
      Sound.play('push');
      setTimeout(() => Sound.play('gate'), 120);
      UI.toast('岩が穴を埋めた!', 1200);
      return true;
    }
    if (TILE_DEFS[t].solid || t === T.CAVEIN || t === T.DOOR || t === T.RUNE) return false;
    this.moveObj(b, tx, ty);
    b.anim = { fx: b.x - dx, fy: b.y - dy, t: 0 };
    G.boulders[b.id] = [tx, ty];
    Sound.play('push');
    this.checkSwitches(b.struct);
    return true;
  },
  checkSwitches(structId) {
    const groups = {};
    for (const s of WORLD.objs.switches) if (s.struct === structId) (groups[s.group] = groups[s.group] || []).push(s);
    for (const g in groups) {
      const k = structId + ':' + g;
      if (G.solved[k]) continue;
      const all = groups[g].every(s => { const o = this.objAt(s.x, s.y); return o && o.type === 'boulder'; });
      if (all) {
        G.solved[k] = 1;
        for (const gt of WORLD.objs.gates) if (gt.struct === structId && gt.group === g) this.setFloor(gt.x, gt.y, structId);
        G.stones += 100;
        setTimeout(() => { Sound.play('puzzle'); setTimeout(() => Sound.play('gate'), 400); UI.toast('ゴゴゴ…!どこかで扉が開いた!<br><span class="st">星晶石 +100</span>', 2600); Game.hud(); }, 200);
      }
    }
  },
  resetPuzzle(structId) {
    let moved = false;
    for (const b of this.boulders) {
      if (b.struct !== structId) continue;
      // 解決済みグループのスイッチに乗っている岩はそのまま
      const onSolved = WORLD.objs.switches.some(s => s.struct === structId && s.x === b.x && s.y === b.y && G.solved[structId + ':' + s.group]);
      if (onSolved) continue;
      if (b.gone) continue;
      if (b.x === b.sx && b.y === b.sy) continue;
      if (this.objAt(b.sx, b.sy) || (this.p.x === b.sx && this.p.y === b.sy)) continue;
      this.moveObj(b, b.sx, b.sy); delete G.boulders[b.id]; moved = true;
    }
    if (moved) { Sound.play('magic'); UI.toast('光る紋様が輝き、岩が元の位置に戻った!', 1800); }
  },
  arrive() {
    const p = this.p;
    if (p.steps % 2 === 0) Sound.play('step');
    this.reveal();
    const t = this.tile(p.x, p.y);
    if (t === T.RUNE) {
      const st = WORLD.objs.runes.find(r => r.x === p.x && r.y === p.y);
      if (st) this.resetPuzzle(st.struct);
    }
    this.updateLoc();
    G.pos = { x: p.x, y: p.y, dir: p.dir };
  },

  // ---------- NPC ----------
  updateNPC(n, dt) {
    if (n.t < 1) { n.t = Math.min(1, n.t + dt * 3); return; }
    if (!n.wander) return;
    n.timer -= dt;
    if (n.timer > 0) return;
    n.timer = 1.5 + Math.random() * 3;
    const ds = ['u', 'd', 'l', 'r'];
    const d = ds[Math.floor(Math.random() * 4)];
    const [dx, dy] = DV[d];
    const nx = n.x + dx, ny = n.y + dy;
    n.dir = d;
    const h = n.home;
    if (h && (nx <= h.x || ny <= h.y || nx >= h.x + h.w - 1 || ny >= h.y + h.h - 1)) return;
    if (!this.walkable(nx, ny) || this.regionAt(nx, ny) !== 0 || (nx === this.p.x && ny === this.p.y)) return;
    const tt = this.tile(nx, ny);
    if (tt === T.DOOR) return;
    n.fx = n.x; n.fy = n.y; this.moveObj(n, nx, ny); n.t = 0;
  },

  // ---------- 敵シンボル ----------
  updateEnemy(e, dt) {
    const p = this.p;
    const dist = Math.abs(e.x - p.x) + Math.abs(e.y - p.y);
    if (!e.alive) {
      if (G.playtime > e.respawn && dist > 12 && !this.objAt(e.sx, e.sy)) {
        e.alive = true; e.x = e.sx; e.y = e.sy; e.fx = e.x; e.fy = e.y; e.t = 1; e.lead = this.pickLead(e.area); this.place(e);
      }
      return;
    }
    if (dist > 24) return;
    if (e.t < 1) { e.t = Math.min(1, e.t + dt * (e.chase ? 4.2 : 2.6)); }
    if (e.stun > 0) { e.stun -= dt; return; }
    // 接触判定
    const ex = U.lerp(e.fx, e.x, e.t), ey = U.lerp(e.fy, e.y, e.t);
    const px = U.lerp(p.fx, p.x, p.t), py = U.lerp(p.fy, p.y, p.t);
    if (Math.abs(ex - px) < 0.7 && Math.abs(ey - py) < 0.7 && this.invuln <= 0 && this.regionAt(e.x, e.y) === this.curRegion) { this.encounter(e); return; }
    if (e.t < 1) return;
    e.timer -= dt;
    if (e.timer > 0) return;
    const sameRegion = this.curRegion === e.region;
    e.chase = sameRegion && dist <= 5 && this.invuln <= 0;
    e.timer = e.chase ? 0.05 : 0.6 + Math.random() * 1.4;
    let d;
    if (e.chase) {
      const dx = p.x - e.x, dy = p.y - e.y;
      const opts = [];
      if (dx) opts.push(dx > 0 ? 'r' : 'l');
      if (dy) opts.push(dy > 0 ? 'd' : 'u');
      if (Math.abs(dy) > Math.abs(dx)) opts.reverse();
      d = opts[0];
      if (opts[1] && !this.enemyCanStep(e, ...DV[d])) d = opts[1];
      if (Math.random() < 0.15) d = ['u', 'd', 'l', 'r'][Math.floor(Math.random() * 4)];
    } else {
      if (Math.random() < 0.35) return;
      d = ['u', 'd', 'l', 'r'][Math.floor(Math.random() * 4)];
    }
    if (!d) return;
    const [dx, dy] = DV[d];
    e.dir = d;
    if (!e.chase && (Math.abs(e.x + dx - e.sx) > 4 || Math.abs(e.y + dy - e.sy) > 4)) return;
    if (e.x + dx === p.x && e.y + dy === p.y) { if (this.invuln <= 0 && sameRegion) { e.fx = e.x; e.fy = e.y; e.t = 0.5; this.encounter(e); } return; }
    if (!this.enemyCanStep(e, dx, dy)) return;
    e.fx = e.x; e.fy = e.y; this.moveObj(e, e.x + dx, e.y + dy); e.t = 0;
  },
  enemyCanStep(e, dx, dy) {
    const nx = e.x + dx, ny = e.y + dy;
    if (!this.walkable(nx, ny)) return false;
    if (this.regionAt(nx, ny) !== e.region) return false;
    if (this.noEnemy[this.key(nx, ny)]) return false;
    const t = this.tile(nx, ny);
    if (t === T.RUNE || t === T.SWITCH || t === T.CAVEIN || t === T.DOOR || t === T.BRIDGE) return false;
    return true;
  },
  async encounter(e) {
    if (this.busy || Game.scene !== 'field') return;
    this.busy = true;
    const area = AREAS[e.area];
    const grp = area.groups.find(g => g[0] === e.lead) || area.groups[0];
    const res = await Battle.start(grp.slice(), { bg: area.bg, area: e.area });
    if (res === 'win') { e.alive = false; this.unplace(e); e.respawn = G.playtime + 75; }
    else if (res === 'escape') { this.invuln = 3; e.stun = 3; }
    this.busy = false;
  },
  async bossTalk(o) {
    if (this.busy) return;
    this.busy = true;
    const en = ENEMIES[o.enemy];
    const st = WORLD.structs.find(s => s.id === o.struct);
    const lv = partyChars().reduce((a, c) => Math.max(a, c.lv), 1);
    const warn = st && lv < st.lv ? `\n(推奨レベル ${st.lv} ／ 現在 ${lv})` : '';
    const c = await UI.ask(`${en.n}が 立ちはだかる!${warn}\n戦いますか?`, ['戦う', 'やめる']);
    if (c === 0) {
      const res = await Battle.start([o.enemy], { bg: AREAS[st.area || 'meadow'].bg, boss: true });
      if (res === 'win') {
        G.bosses[o.id] = 1;
        this.unplace(o);
        this.bosses = this.bosses.filter(b => b !== o);
        await Story.bossDefeated(o);
      }
    }
    this.busy = false;
  },

  // ---------- 調べる ----------
  async interact() {
    if (this.busy || this.p.moving) return;
    const p = this.p, [dx, dy] = DV[p.dir];
    let fx = p.x + dx, fy = p.y + dy;
    let o = this.objAt(fx, fy);
    let t = this.tile(fx, fy);
    if (!o && TILE_DEFS[t].counter) { const o2 = this.objAt(fx + dx, fy + dy); if (o2 && o2.type === 'npc') o = o2; }
    this.busy = true;
    try {
      if (o) await this.interactObj(o);
      else if (!(await this.interactTile(fx, fy, t))) await this.search();
    } finally { this.busy = false; }
  },
  async interactObj(o) {
    if (o.type === 'npc') {
      const back = { u: 'd', d: 'u', l: 'r', r: 'l' }[this.p.dir];
      o.dir = back;
      if (o.talk) await o.talk(o); else await UI.say('……', { name: o.name });
    } else if (o.type === 'chest') {
      if (G.chests[o.id]) { await UI.say('宝箱は からっぽだ。'); return; }
      G.chests[o.id] = 1;
      Sound.play('chest');
      const txt = grant(o);
      Game.hud();
      await UI.say(`宝箱を開けた!\n${txt} を手に入れた!`);
    } else if (o.type === 'save') {
      await Story.saveCrystal(o);
    } else if (o.type === 'boss') {
      this.busy = false; await this.bossTalk(o); this.busy = true;
    } else if (o.type === 'boulder') {
      await UI.say('大きな岩だ。押せば動きそうだ。');
    } else if (o.type === 'enemy') {
      this.busy = false; this.encounter(o);
    }
  },
  async interactTile(x, y, t) {
    const W = WORLD;
    if (t === T.TABLET) { const tb = W.objs.tablets.find(a => a.x === x && a.y === y); await UI.say(tb ? tb.text : '…'); return true; }
    if (t === T.SIGN) { const s = W.objs.signs.find(a => a.x === x && a.y === y); await UI.say(s ? s.text : '…'); return true; }
    if (t === T.RDOOR) { const d = W.objs.rdoors.find(a => a.x === x && a.y === y); if (d) await Story.riddle(d); return true; }
    if (t === T.ALTAR) { await Story.altar(); return true; }
    if (t === T.SEAL) { await Story.seal(); return true; }
    if (t === T.WELL) { await UI.say('井戸をのぞきこんだ。\n水面に自分の顔がうつっている。'); return true; }
    if (t === T.GATE) { await UI.say('鉄格子が道をふさいでいる。\nどこかに仕掛けがあるようだ。'); return true; }
    if (t === T.HOLE) { await UI.say('深い穴だ。落ちたら戻れそうにない…\n何かで埋められないだろうか。'); return true; }
    if (t === T.SHELF) { await UI.say(U.pick(['古い冒険の本が並んでいる。', '「はじめての召喚術」という本がある。\n星晶石を捧げると仲間が現れるらしい。', '料理の本だ。おいしそう…', '「カードの心得」\n敵の頭上には次の行動が見える。\n攻撃が来るときはブロックで守るべし。'])); return true; }
    if (t === T.BED) { await UI.say('ふかふかのベッドだ。'); return true; }
    if (t === T.POT) { await UI.say('つぼの中は空っぽだ。'); return true; }
    return false;
  },
  async search() {
    const p = this.p, [dx, dy] = DV[p.dir];
    for (const [x, y] of [[p.x, p.y], [p.x + dx, p.y + dy]]) {
      const h = WORLD.objs.hidden.find(a => a.x === x && a.y === y);
      if (h && !G.hidden[h.id]) {
        G.hidden[h.id] = 1;
        Sound.play('chest');
        const txt = grant(h.reward);
        Game.hud();
        await UI.say(`足元を調べた…\nなにか埋まっている!\n${txt} を手に入れた!`);
        return;
      }
    }
  },
  teleport(x, y, dir = 'd') {
    const p = this.p;
    p.x = p.fx = x; p.y = p.fy = y; p.t = 1; p.moving = false; p.dir = dir;
    this.curRegion = this.regionAt(x, y);
    this.reveal();
    G.pos = { x, y, dir };
    this.updateCam();
    this.updateLoc(true);
  },

  // ---------- 描画 ----------
  updateCam() {
    const p = this.p;
    const px = U.lerp(p.fx, p.x, p.t) * TS + 8, py = U.lerp(p.fy, p.y, p.t) * TS + 8;
    const vw = Game.vw, vh = Game.vh;
    this.cam.x = Math.round(U.clamp(px - vw / 2, 0, MW * TS - vw));
    this.cam.y = Math.round(U.clamp(py - vh / 2, 0, MH * TS - vh));
  },
  draw(ctx) {
    const vw = Game.vw, vh = Game.vh, cam = this.cam;
    const x0 = Math.floor(cam.x / TS), y0 = Math.floor(cam.y / TS);
    const x1 = Math.ceil((cam.x + vw) / TS), y1 = Math.ceil((cam.y + vh) / TS);
    const frame = Math.floor(this.time * 2.5) % 3;
    const cr = this.curRegion, R = WORLD.regions;
    const curR = R[cr];
    const dim = cr && curR;
    ctx.fillStyle = '#000'; ctx.fillRect(0, 0, vw, vh);
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
      if (x < 0 || y < 0 || x >= MW || y >= MH) continue;
      const i = y * MW + x, sx = x * TS - cam.x, sy = y * TS - cam.y;
      const r = WORLD.region[i];
      if (r && r !== cr) {
        const roof = SPR.roofs[R[r].roof];
        const below = y + 1 < MH ? WORLD.region[i + MW] : 0;
        ctx.drawImage(below === r ? roof.mid : roof.eave, sx, sy);
      } else {
        this.drawTile(ctx, i, x, y, sx, sy, frame);
      }
      if (dim && r !== cr) { ctx.fillStyle = curR.dark ? 'rgba(0,0,0,0.92)' : 'rgba(10,8,30,0.5)'; ctx.fillRect(sx, sy, TS, TS); }
    }
    // オブジェクト (y順)
    const list = [];
    for (const o of this.objs.values()) {
      if (o.x < x0 - 2 || o.x > x1 + 2 || o.y < y0 - 2 || o.y > y1 + 2) continue;
      const r = this.regionAt(o.x, o.y);
      if (r && r !== cr) continue;
      if (cr && r !== cr && curR.dark) continue;
      list.push(o);
    }
    if (!this.hideP) list.push(this.p);
    list.sort((a, b) => (a.y - (a.t < 1 ? 1 - a.t : 0) * 0) - b.y);
    for (const o of list) this.drawObj(ctx, o);
    // 暗闇
    if (cr && curR.dark) this.drawDark(ctx);
  },
  drawTile(ctx, i, x, y, sx, sy, frame) {
    const t = WORLD.tiles[i];
    const def = TILE_DEFS[t];
    if (!def.gen || t === T.TABLET || t === T.STATUE) {
      const st = STYLE_LIST[WORLD.style[i]];
      let k = def.k;
      if (t === T.SWITCH) { const o = this.objAt(x, y); if (o && o.type === 'boulder') k = 'SWITCH_ON'; }
      if (t === T.CAVEIN) {
        const st2 = WORLD.structs.find(s => s.kind === 'dungeon' && x >= s.x && x < s.x + s.w && y >= s.y && y < s.y + s.h);
        const roof = st2 ? SPR.roofs[WORLD.regions[st2.region].roof] : SPR.roofs.mountain;
        ctx.drawImage(roof.mid, sx, sy);
        ctx.fillStyle = '#000'; ctx.fillRect(sx + 3, sy + 5, 10, 11); ctx.fillRect(sx + 4, sy + 3, 8, 2); ctx.fillRect(sx + 5, sy + 2, 6, 1);
        return;
      }
      const im = STYLE_TILES[k + ':' + st] || STYLE_TILES[k + ':stone'];
      if (im) { ctx.drawImage(im, sx, sy); return; }
    }
    const fr = SPR.tiles[t];
    ctx.drawImage(fr[def.anim ? frame % fr.length : 0], sx, sy);
  },
  drawObj(ctx, o) {
    const cam = this.cam;
    let wx = o.x, wy = o.y;
    if (o.t !== undefined && o.t < 1 && o.fx !== undefined) { wx = U.lerp(o.fx, o.x, o.t); wy = U.lerp(o.fy, o.y, o.t); }
    if (o.anim) { o.anim.t += 0.25; if (o.anim.t >= 1) o.anim = null; else { wx = U.lerp(o.anim.fx, o.x, o.anim.t); wy = U.lerp(o.anim.fy, o.y, o.anim.t); } }
    const sx = Math.round(wx * TS - cam.x), sy = Math.round(wy * TS - cam.y);
    if (o === this.p) {
      if (this.invuln > 0 && Math.floor(this.time * 12) % 2) return;
      const lead = G.roster[G.party[0]] || G.roster.aria;
      const look = CHARS[lead.id].look;
      const fr = o.moving ? (o.steps % 2 ? 1 : 2) : 0;
      this.shadow(ctx, sx, sy);
      ctx.drawImage(girlSprite(look, o.dir, o.moving && o.t < 0.6 ? fr : 0), sx, sy - 2);
      return;
    }
    switch (o.type) {
      case 'chest': ctx.drawImage(G.chests[o.id] ? SPR.obj.chestOpen : SPR.obj.chest, sx, sy); break;
      case 'boulder': ctx.drawImage(SPR.obj.boulder, sx, sy); break;
      case 'save': {
        const b = Math.round(Math.sin(this.time * 3) * 2);
        ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.fillRect(sx + 4, sy + 13, 8, 2);
        ctx.drawImage(SPR.obj.crystal, sx, sy - 3 + b);
        if (Math.floor(this.time * 4) % 4 === 0) { ctx.fillStyle = '#fff'; ctx.fillRect(sx + 4 + (Math.floor(this.time * 4) % 7), sy + b, 1, 1); }
        break;
      }
      case 'npc': {
        this.shadow(ctx, sx, sy);
        if (o.look === 'elder' || !o.look) ctx.drawImage(SPR.obj.elder, sx, sy - 2);
        else ctx.drawImage(girlSprite(o.look, o.dir, o.t < 1 ? 1 : 0), sx, sy - 2);
        break;
      }
      case 'enemy': {
        if (!o.alive) return;
        const en = ENEMIES[o.lead];
        const s = enemySprite(en.spr, en.pal);
        const hop = o.t < 1 ? -Math.round(Math.sin(o.t * Math.PI) * 3) : 0;
        this.shadow(ctx, sx, sy);
        ctx.save();
        if (o.stun > 0) ctx.globalAlpha = 0.5;
        if (o.dir === 'r') { ctx.translate(sx + 16, 0); ctx.scale(-1, 1); ctx.drawImage(s, 0, sy - 2 + hop, 16, 16); }
        else ctx.drawImage(s, sx, sy - 2 + hop, 16, 16);
        ctx.restore();
        if (o.chase) { ctx.fillStyle = '#ff3b3b'; ctx.fillRect(sx + 7, sy - 9, 2, 4); ctx.fillRect(sx + 7, sy - 4, 2, 1); }
        break;
      }
      case 'boss': {
        const en = ENEMIES[o.enemy];
        const s = enemySprite(en.spr, en.pal);
        const b = Math.round(Math.sin(this.time * 2) * 1);
        ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fillRect(sx - 4, sy + 12, 24, 4);
        ctx.drawImage(s, sx - 8, sy - 16 + b, 32, 32);
        break;
      }
    }
  },
  shadow(ctx, sx, sy) { ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.fillRect(sx + 3, sy + 13, 10, 3); },
  drawDark(ctx) {
    const vw = Game.vw, vh = Game.vh;
    if (!this.fog || this.fog.width !== vw || this.fog.height !== vh) this.fog = mkCanvas(vw, vh);
    const f = this.fog.getContext('2d');
    f.globalCompositeOperation = 'source-over';
    f.clearRect(0, 0, vw, vh);
    f.fillStyle = 'rgba(4,2,12,0.93)'; f.fillRect(0, 0, vw, vh);
    f.globalCompositeOperation = 'destination-out';
    const p = this.p;
    const cx = U.lerp(p.fx, p.x, p.t) * TS + 8 - this.cam.x, cy = U.lerp(p.fy, p.y, p.t) * TS + 8 - this.cam.y;
    const rad = 5.2 * TS + Math.sin(this.time * 5) * 2;
    const g = f.createRadialGradient(cx, cy, TS, cx, cy, rad);
    g.addColorStop(0, 'rgba(0,0,0,1)'); g.addColorStop(0.6, 'rgba(0,0,0,0.85)'); g.addColorStop(1, 'rgba(0,0,0,0)');
    f.fillStyle = g; f.beginPath(); f.arc(cx, cy, rad, 0, Math.PI * 2); f.fill();
    ctx.drawImage(this.fog, 0, 0);
  },
};
