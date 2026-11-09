'use strict';
// ===== ゲーム状態・育成・セーブ =====
const SAVE_KEY = 'seishou_chronicle_save_v2'; // v2: 256x256 ワールド
let G = null; // 現在の状態

function mkChar(id, lv = 1) {
  const c = { id, lv, exp: 0, lb: 0, eq: { w: null, a: null, x: null }, st: {}, hp: 1, mp: 1 };
  const s = charStats(c);
  c.hp = s.hp; c.mp = s.mp;
  return c;
}
function charStats(c) {
  const d = CHARS[c.id];
  const mul = 1 + 0.08 * (c.lb || 0);
  const o = {};
  for (const k of ['hp', 'mp', 'atk', 'def', 'mag', 'spd']) o[k] = Math.floor((d.base[k] + d.grow[k] * (c.lv - 1)) * mul);
  o.elem = 'none';
  for (const sl of ['w', 'a', 'x']) {
    const eid = c.eq[sl];
    if (!eid || !EQUIPS[eid]) continue;
    const e = EQUIPS[eid], r = (G && G.equips[eid]) ? G.equips[eid].r : 0;
    for (const k in e.st) o[k] += Math.floor(e.st[k] * (1 + 0.12 * r));
    if (sl === 'w' && e.elem) o.elem = e.elem;
  }
  return o;
}
function charSkills(c) { return CHARS[c.id].skills.filter(s => s[0] <= c.lv).map(s => s[1]); }
function isDead(c) { return c.hp <= 0; }

function newGame() {
  G = {
    v: 1,
    roster: {}, party: ['aria'],
    equips: { bronze: { r: 0 }, traveler: { r: 0 } },
    items: { potion: 5, antidote: 2 },
    gold: 150, stones: 750,
    flags: {}, chests: {}, crystals: [], bosses: {}, solved: {}, holes: {}, boulders: {}, rdoors: {}, hidden: {}, saves: { lumina: 1 },
    pos: { x: WORLD.start.x, y: WORLD.start.y, dir: 'd' },
    lastSave: null,
    explored: new Uint8Array(MW * MH),
    gacha: { beginnerDone: false, total: 0, history: [] },
    login: '', playtime: 0, seal: false, seen: {},
  };
  G.roster.aria = mkChar('aria', 1);
  G.roster.aria.eq.w = 'bronze'; G.roster.aria.eq.a = 'traveler';
  const s = charStats(G.roster.aria); G.roster.aria.hp = s.hp; G.roster.aria.mp = s.mp;
  return G;
}

function partyChars() { return G.party.map(id => G.roster[id]).filter(Boolean); }
function maxRosterLv() { let m = 1; for (const k in G.roster) m = Math.max(m, G.roster[k].lv); return m; }
function fullHeal(c) { const s = charStats(c); c.hp = s.hp; c.mp = s.mp; c.st = {}; }
function healAll() { for (const k in G.roster) fullHeal(G.roster[k]); }

function gainExp(c, n) {
  const ups = [];
  if (c.lv >= LV_CAP) return ups;
  c.exp += n;
  while (c.lv < LV_CAP && c.exp >= expNext(c.lv)) {
    c.exp -= expNext(c.lv);
    const before = charStats(c);
    const oldSk = charSkills(c);
    c.lv++;
    const after = charStats(c);
    c.hp += after.hp - before.hp; c.mp += after.mp - before.mp;
    const newSk = charSkills(c).filter(s => !oldSk.includes(s));
    ups.push({ lv: c.lv, skills: newSk });
  }
  return ups;
}

// ガチャで入手
function obtainChar(id) {
  const d = CHARS[id];
  if (!G.roster[id]) {
    const lv = Math.max(1, maxRosterLv() - 2);
    G.roster[id] = mkChar(id, lv);
    if (G.party.length < 4) G.party.push(id);
    return { isNew: true, text: 'NEW!' };
  }
  const c = G.roster[id];
  if (c.lb < 5) {
    c.lb++;
    const s = charStats(c); c.hp = Math.min(s.hp, c.hp + 50); c.mp = Math.min(s.mp, c.mp);
    return { lb: c.lb, text: '限界突破 ' + c.lb + '凸!' };
  }
  const st = { 3: 10, 4: 50, 5: 200 }[d.rar];
  G.stones += st;
  return { conv: st, text: '星晶石+' + st };
}
function obtainEquip(id) {
  if (!G.equips[id]) { G.equips[id] = { r: 0 }; return { isNew: true, text: 'NEW!' }; }
  const e = G.equips[id];
  if (e.r < 4) { e.r++; return { r: e.r, text: '精錬 +' + e.r + '!' }; }
  const g = { 3: 100, 4: 400, 5: 1500 }[EQUIPS[id].rar];
  G.gold += g;
  return { conv: g, text: g + 'G に変換' };
}
function equippedBy(eid) { for (const k in G.roster) for (const s of ['w', 'a', 'x']) if (G.roster[k].eq[s] === eid) return k; return null; }
function equipName(eid) { const r = G.equips[eid] ? G.equips[eid].r : 0; return EQUIPS[eid].n + (r ? ' +' + r : ''); }
function addItem(id, n = 1) { G.items[id] = (G.items[id] || 0) + n; }
function useItemCount(id) { if (!G.items[id]) return false; G.items[id]--; if (G.items[id] <= 0) delete G.items[id]; return true; }

// 報酬付与 → テキスト
function grant(r) {
  if (r.stones) { G.stones += r.stones; return `星晶石 ×${r.stones}`; }
  if (r.gold) { G.gold += r.gold; return `${r.gold} G`; }
  if (r.item) { addItem(r.item, r.n || 1); return `${ITEMS[r.item].n} ×${r.n || 1}`; }
  if (r.equip) { const res = obtainEquip(r.equip); return `★${EQUIPS[r.equip].rar} ${EQUIPS[r.equip].n}` + (res.isNew ? '' : `(${res.text})`); }
  return '';
}

// ---------- セーブ/ロード ----------
function b64(u8) { let s = ''; for (let i = 0; i < u8.length; i += 8192) s += String.fromCharCode.apply(null, u8.subarray(i, i + 8192)); return btoa(s); }
function unb64(s) { const bin = atob(s); const u = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i); return u; }
function packBits(u8) { const o = new Uint8Array(Math.ceil(u8.length / 8)); for (let i = 0; i < u8.length; i++) if (u8[i]) o[i >> 3] |= 1 << (i & 7); return o; }
function unpackBits(p, n) { const o = new Uint8Array(n); for (let i = 0; i < n; i++) o[i] = (p[i >> 3] >> (i & 7)) & 1; return o; }

function saveGame() {
  const o = Object.assign({}, G);
  o.explored = b64(packBits(G.explored));
  o.savedAt = Date.now();
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(o)); return true; } catch (e) { return false; }
}
function hasSave() { try { return !!localStorage.getItem(SAVE_KEY); } catch (e) { return false; } }
function saveInfo() {
  try {
    const o = JSON.parse(localStorage.getItem(SAVE_KEY));
    const lead = o.roster[o.party[0]];
    return { lv: lead ? lead.lv : 1, crystals: o.crystals.length, time: o.playtime || 0, at: o.savedAt };
  } catch (e) { return null; }
}
function loadGame() {
  try {
    const o = JSON.parse(localStorage.getItem(SAVE_KEY));
    if (!o) return false;
    o.explored = unpackBits(unb64(o.explored), MW * MH);
    const base = newGame();
    G = Object.assign(base, o);
    G.gacha = Object.assign({ beginnerDone: false, total: 0, history: [] }, o.gacha);
    for (const k in G.roster) { const c = G.roster[k]; c.st = c.st || {}; c.eq = c.eq || { w: null, a: null, x: null }; }
    return true;
  } catch (e) { console.error(e); return false; }
}
function fmtTime(sec) { sec = Math.floor(sec); const h = Math.floor(sec / 3600), m = Math.floor(sec / 60) % 60; return h + ':' + String(m).padStart(2, '0'); }
