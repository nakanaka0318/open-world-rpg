'use strict';
// ===== ドット絵定義 (すべてコード内で定義) =====
const TS = 16; // タイルサイズ

function mkCanvas(w, h) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const x = c.getContext('2d');
  x.imageSmoothingEnabled = false;
  return c;
}

// 文字列パターンを描画。'.' は透明。短い行は右側を透明で補完。
function paint(ctx, rows, pal, ox = 0, oy = 0, flip = false, w = null) {
  const W = w || Math.max(...rows.map(r => r.length));
  for (let y = 0; y < rows.length; y++) {
    const r = rows[y];
    for (let x = 0; x < r.length; x++) {
      const ch = r[x];
      if (ch === '.' || ch === ' ') continue;
      const col = pal[ch];
      if (!col) continue;
      ctx.fillStyle = col;
      ctx.fillRect(ox + (flip ? W - 1 - x : x), oy + y, 1, 1);
    }
  }
}
function patCanvas(rows, pal, w, h, flip = false) {
  const c = mkCanvas(w || rows[0].length, h || rows.length);
  paint(c.getContext('2d'), rows, pal, 0, 0, flip, w);
  return c;
}

const OUT = '#181425';

// ---------- 地面ジェネレータ ----------
function genSpeck(ctx, base, cols, dens, seed, w = 16, h = 16) {
  ctx.fillStyle = base; ctx.fillRect(0, 0, w, h);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const r = U.hash2(x, y, seed);
    if (r < dens) { ctx.fillStyle = cols[Math.floor(U.hash2(x, y, seed + 1) * cols.length)]; ctx.fillRect(x, y, 1, 1); }
  }
}
function genBricks(ctx, base, mortar, light, bw = 8, bh = 4, dark) {
  ctx.fillStyle = base; ctx.fillRect(0, 0, 16, 16);
  for (let r = 0; r < 16 / bh; r++) {
    const off = (r % 2) * (bw / 2);
    ctx.fillStyle = mortar; ctx.fillRect(0, r * bh + bh - 1, 16, 1);
    for (let x = -bw; x < 16; x += bw) {
      ctx.fillStyle = mortar; ctx.fillRect(x + off + bw - 1, r * bh, 1, bh - 1);
      ctx.fillStyle = light; ctx.fillRect(x + off, r * bh, bw - 1, 1);
      if (dark) { ctx.fillStyle = dark; ctx.fillRect(x + off, r * bh + bh - 2, bw - 1, 1); }
    }
  }
}
function genPlanks(ctx, base, line, light) {
  ctx.fillStyle = base; ctx.fillRect(0, 0, 16, 16);
  for (let r = 0; r < 4; r++) {
    ctx.fillStyle = line; ctx.fillRect(0, r * 4 + 3, 16, 1);
    ctx.fillStyle = light; ctx.fillRect(0, r * 4, 16, 1);
    const s = (r * 5 + 3) % 16;
    ctx.fillStyle = line; ctx.fillRect(s, r * 4, 1, 3);
  }
}
function genWater(ctx, base, dark, light, f) {
  ctx.fillStyle = base; ctx.fillRect(0, 0, 16, 16);
  for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
    const v = Math.sin((x + f * 4) * 0.8 + y * 0.5) + Math.sin(y * 1.3 - f * 1.6 + x * 0.2);
    if (v > 1.45) { ctx.fillStyle = light; ctx.fillRect(x, y, 1, 1); }
    else if (v < -1.4) { ctx.fillStyle = dark; ctx.fillRect(x, y, 1, 1); }
  }
}

// ---------- パターン (16x16) ----------
const P = {};
P.tree = [
  '................',
  '......oooo......',
  '....ooLLGGoo....',
  '...oLLLGGGGdo...',
  '..oLLGGGGGGGdo..',
  '..oLGGGGLGGGdo..',
  '.oGGGGGLLGGGGdo.',
  '.oGGLGGGGGGGddo.',
  '.oGLLGGGGGGdddo.',
  '.odGGGGGGGddddo.',
  '..oddGGGdddddo..',
  '...ooddddddoo...',
  '.....ooTToo.....',
  '......oTto......',
  '.....ooTtoo.....',
  '......oooo......',
];
P.pine = [
  '.......oo.......',
  '......oWWo......',
  '.....oWGGWo.....',
  '.....oGGGdo.....',
  '....oWWGGWWo....',
  '....oGGGGGdo....',
  '...oWWGGGWWdo...',
  '...oGGGGGGddo...',
  '..oWWWGGGWWWdo..',
  '..oGGGGGGGGddo..',
  '.oWWGGGGGGWWddo.',
  '.oGGGGGGGGGdddo.',
  '..ooooooTtooooo.',
  '......oTto......',
  '......oTto......',
  '.......oo.......',
];
P.palm = [
  '................',
  '...oo.....oo....',
  '..oLLo...oLLo...',
  '.oLGGLo.oLGGLo..',
  'oLGooGLoLGooGLo.',
  'oGo..oGGGo..oGo.',
  '.o...oGTGo...o..',
  '....oLotoLo.....',
  '...oGo.oTooGo...',
  '...oo..oTo.oo...',
  '.......oto......',
  '.......oTo......',
  '.......oto......',
  '.......oTo......',
  '......oTtoo.....',
  '......ooooo.....',
];
P.cactus = [
  '................',
  '.......oo.......',
  '......oLGo......',
  '......oLGo......',
  '..oo..oLGo......',
  '.oLGo.oLGo..oo..',
  '.oLGo.oLGo.oLGo.',
  '.oLGooGLGo.oLGo.',
  '..oLGGGLGooLGGo.',
  '...ooGLGGGGGGo..',
  '.....oLGGoooo...',
  '.....oLGGo......',
  '.....oLGGo......',
  '....ooLGGoo.....',
  '....odddddo.....',
  '.....ooooo......',
];
P.deadtree = [
  '................',
  '....o......o....',
  '...oTo....oTo...',
  '....oTo..oTo..o.',
  '.....oToTTo..oTo',
  '..o...oTTo..oTo.',
  '.oTo..oTTooTTo..',
  '..oTooTTTTTo....',
  '...oTTTTTo......',
  '.....oTTo.......',
  '.....oTTo.......',
  '.....oTTo.......',
  '.....oTto.......',
  '....ooTttoo.....',
  '...otttttto.....',
  '....oooooo......',
];
P.mountain = [
  '................',
  '.......oo.......',
  '......oLro......',
  '.....oLLrro.....',
  '.....oLRRro.....',
  '....oLLRRrro....',
  '....oLRRRRro....',
  '...oLLRRRRrro...',
  '...oLRRRRRRro...',
  '..oLLRRRRRRrro..',
  '..oLRRRRRRRRro..',
  '.oLLRRRRRRRRrro.',
  '.oLRRRRRRRRRRro.',
  'oLLRRRRRRRRRRrro',
  'oRRRRRRRRRRRRRro',
  'oooooooooooooooo',
];
P.snowmtn = [
  '................',
  '.......oo.......',
  '......oWWo......',
  '.....oWWWWo.....',
  '.....oWWWro.....',
  '....oWWRWrro....',
  '....oLRRRRro....',
  '...oLLRRRRrro...',
  '...oLRRRRRRro...',
  '..oLLRRRRRRrro..',
  '..oLRRRRRRRRro..',
  '.oLLRRRRRRRRrro.',
  '.oLRRRRRRRRRRro.',
  'oLLRRRRRRRRRRrro',
  'oRRRRRRRRRRRRRro',
  'oooooooooooooooo',
];
P.fence = [
  '................',
  '................',
  '..oo......oo....',
  '.oTTo....oTTo...',
  'ooTTooooooTToooo',
  'TTTTTTTTTTTTTTTT',
  'tttttttttttttttt',
  'ooTTooooooTToooo',
  '.oTTo....oTTo...',
  '.oTTo....oTTo...',
  'ooTTooooooTToooo',
  'TTTTTTTTTTTTTTTT',
  'tttttttttttttttt',
  'ooTTooooooTToooo',
  '.otto....otto...',
  '..oo......oo....',
];
P.well = [
  '................',
  '................',
  '...oooooooooo...',
  '..oLLLLLLLLLLo..',
  '.oLSSSSSSSSSSLo.',
  '.oSoooooooooSSo.',
  '.oSoBBBBBBBoSSo.',
  '.oSoBbBBbBBoSSo.',
  '.oSoBBBBBBBoSSo.',
  '.oSSoooooooSSSo.',
  '.oSSSSSSSSSSSso.',
  '.osSSsSSSsSSSso.',
  '.osssssssssssso.',
  '..oooooooooooo..',
  '................',
  '................',
];
P.table = [
  '................',
  '................',
  '................',
  '.oooooooooooooo.',
  '.oLLLLLLLLLLLLo.',
  '.oTTTTTTTTTTTTo.',
  '.oTTTTTTTTTTTTo.',
  '.oTTTTTTTTTTTTo.',
  '.otttttttttttto.',
  '.oooooooooooooo.',
  '..oto......oto..',
  '..oto......oto..',
  '..ooo......ooo..',
  '................',
  '................',
  '................',
];
P.bed = [
  '................',
  '.oooooooooooooo.',
  '.oTTTTTTTTTTTTo.',
  '.oWWWWWWWWWWWWo.',
  '.oWWWWWWWWWWWWo.',
  '.oooooooooooooo.',
  '.oBBBBBBBBBBBBo.',
  '.oBbBBBBBBBBbBo.',
  '.oBBBBBBBBBBBBo.',
  '.oBBBBBBBBBBBBo.',
  '.oBBBBBBBBBBBBo.',
  '.obbbbbbbbbbbbo.',
  '.oTTTTTTTTTTTTo.',
  '.oooooooooooooo.',
  '................',
  '................',
];
P.shelf = [
  'oooooooooooooooo',
  'oTTTTTTTTTTTTTTo',
  'oTRRBGGoYYRBBGTo',
  'oTRRBGGoYYRBBGTo',
  'oTRRBGGoYYRBBGTo',
  'otttttttttttttto',
  'oTBGGRYYoRRGBBTo',
  'oTBGGRYYoRRGBBTo',
  'oTBGGRYYoRRGBBTo',
  'otttttttttttttto',
  'oTYRRBoGGBYYRRTo',
  'oTYRRBoGGBYYRRTo',
  'oTYRRBoGGBYYRRTo',
  'otttttttttttttto',
  'oTTTTTTTTTTTTTTo',
  'oooooooooooooooo',
];
P.counter = [
  '................',
  '................',
  'oooooooooooooooo',
  'oLLLLLLLLLLLLLLo',
  'oTTTTTTTTTTTTTTo',
  'otttttttttttttto',
  'oTTTTTTTTTTTTTTo',
  'oTTtTTTTTTTTtTTo',
  'oTTTTTTTTTTTTTTo',
  'oTTtTTTTTTTTtTTo',
  'oTTTTTTTTTTTTTTo',
  'otttttttttttttto',
  'oooooooooooooooo',
  '................',
  '................',
  '................',
];
P.pot = [
  '................',
  '................',
  '................',
  '.....oooooo.....',
  '....oBBBBBBo....',
  '.....oooooo.....',
  '....oBBLBBBo....',
  '...oBLLBBBBbo...',
  '...oBLBBBBBbo...',
  '...oBBBBBBBbo...',
  '...oBBBBBBbbo...',
  '....obbbbbbo....',
  '.....oooooo.....',
  '................',
  '................',
  '................',
];
P.statue = [
  '......oooo......',
  '.....oLLSSo.....',
  '.....oLSSSo.....',
  '......oSSo......',
  '....ooLSSSoo....',
  '...oLLSSSSSso...',
  '...oLSSSSSSso...',
  '....oLSSSSso....',
  '....oLSSSSso....',
  '....oLSSSSso....',
  '...ooLSSSSsoo...',
  '..oLLLLSSSSSso..',
  '..oSSSSSSSSSso..',
  '..osssssssssso..',
  '..oooooooooooo..',
  '................',
];
P.tablet = [
  '................',
  '....oooooooo....',
  '...oLLLLLLLSo...',
  '...oLSSSSSSso...',
  '...oLSoSoSSso...',
  '...oLSSSSSSso...',
  '...oLSooSoSso...',
  '...oLSSSSSSso...',
  '...oLSoSooSso...',
  '...oLSSSSSSso...',
  '...oLSSSSSSso...',
  '...oSSSSSSSso...',
  '..oossssssssoo..',
  '..osssssssssso..',
  '...oooooooooo...',
  '................',
];
P.sign = [
  '................',
  '................',
  '..oooooooooooo..',
  '.oTTTTTTTTTTTTo.',
  '.oTttTTtTTttTTo.',
  '.oTTTTTTTTTTTTo.',
  '.oTtTTttTtTTtTo.',
  '.oTTTTTTTTTTTTo.',
  '.otttttttttttto.',
  '..oooooTtooooo..',
  '......oTto......',
  '......oTto......',
  '......oTto......',
  '.....ooTtoo.....',
  '................',
  '................',
];
P.altar = [
  '.......oo.......',
  '......oWCo......',
  '.....oWCCco.....',
  '.....oCCCco.....',
  '......oCco......',
  '.......oo.......',
  '....oooooooo....',
  '...oGGGGGGGGo...',
  '...oSSSSSSSSo...',
  '....oSSSSSSo....',
  '....oSsSSsSo....',
  '....oSSSSSSo....',
  '...oSSSSSSSSo...',
  '..oLLLLLLLLLLo..',
  '..osssssssssso..',
  '..oooooooooooo..',
];
P.chest = [
  '................',
  '................',
  '...oooooooooo...',
  '..oTTTTTTTTTTo..',
  '.oTLLLLLLLLLLTo.',
  '.oTTTTTTTTTTTTo.',
  '.oGGGGGGGGGGGGo.',
  '.oTTTTTooTTTTTo.',
  '.oTTTTTYYTTTTTo.',
  '.oTTTTTooTTTTTo.',
  '.oTTTTTTTTTTTTo.',
  '.oGGGGGGGGGGGGo.',
  '.otttttttttttto.',
  '..oooooooooooo..',
  '................',
  '................',
];
P.chestOpen = [
  '................',
  '...oooooooooo...',
  '..oTTTTTTTTTTo..',
  '.otttttttttttto.',
  '.oKKKKKKKKKKKKo.',
  '.oKKKKKKKKKKKKo.',
  '.oGGGGGGGGGGGGo.',
  '.oTTTTTTTTTTTTo.',
  '.oTTTTTTTTTTTTo.',
  '.oTTTTTTTTTTTTo.',
  '.oTTTTTTTTTTTTo.',
  '.oGGGGGGGGGGGGo.',
  '.otttttttttttto.',
  '..oooooooooooo..',
  '................',
  '................',
];
P.boulder = [
  '................',
  '................',
  '.....oooooo.....',
  '...ooLLRRRRoo...',
  '..oLLRRRRRRRro..',
  '..oLRRRRRRRRro..',
  '.oLRRRRRRRRRrro.',
  '.oLRRRrRRRRRrro.',
  '.oRRRRRRRRRRrro.',
  '.oRRRRRRRRRrrro.',
  '.oRRRRRRRRrrrro.',
  '..orRRRRRrrrro..',
  '..orrrrrrrrrro..',
  '...oorrrrrroo...',
  '.....oooooo.....',
  '................',
];
P.crystal = [
  '.......oo.......',
  '......oWLo......',
  '.....oWLLCo.....',
  '....oWLLCCCo....',
  '...oWLLCCCCco...',
  '...oLLCCCCCco...',
  '..oLLCCCCCCcco..',
  '..oLCCCCCCCcco..',
  '...oCCCCCCcco...',
  '...oCCCCCccco...',
  '....oCCCccco....',
  '.....oCccco.....',
  '......occo......',
  '.......oo.......',
  '................',
  '................',
];

// ---------- タイル定義 ----------
const PAL_TREE = { o: '#1d3b22', d: '#2e6b34', G: '#3f8f3e', L: '#63b84f', T: '#7a4a2c', t: '#4e2e1c' };
const PAL_WOOD = { o: OUT, T: '#a8683a', t: '#6e4024', L: '#c98a52', W: '#f4f0e8', B: '#c0392b', b: '#8e2a20', K: '#2a1c18', G: '#f5c542', Y: '#fff1a8', R: '#c0392b', S: '#8f97a8', s: '#6a7186' };
const PAL_STONE = { o: OUT, S: '#9aa1b2', s: '#6d7488', L: '#c4cad6', B: '#3a7bd5', b: '#77b3f2', G: '#5aa83c' };

const TILE_DEFS = [];
const T = {};
function defTile(k, props, gen) { props.k = k; props.gen = gen; T[k] = TILE_DEFS.length; TILE_DEFS.push(props); }

const GRASS = c => genSpeck(c, '#5aa83c', ['#4a9132', '#78c454', '#4a9132'], 0.22, 11);
const SAND = c => genSpeck(c, '#ecd18f', ['#d8b66c', '#f6e3ae'], 0.18, 21);
const SNOW = c => genSpeck(c, '#eef3f9', ['#cfdbe9', '#ffffff'], 0.15, 31);
const ASH = c => genSpeck(c, '#5b4c4a', ['#473a39', '#6e5d59'], 0.25, 41);
const DARKGRASS = c => genSpeck(c, '#3f6b45', ['#335a3a', '#4f7d52'], 0.25, 51);
const PATH = c => { genSpeck(c, '#c9a26b', ['#b08a55', '#dcb985'], 0.25, 61); };
const CAVEF = c => genSpeck(c, '#6b5d52', ['#574a41', '#7d6e62'], 0.25, 71);
const STONEF = c => { genBricks(c, '#8f97a8', '#737b8f', '#a7aebd', 8, 8); };
const WOODF = c => genPlanks(c, '#b8804a', '#94643a', '#c99560');
const ICEF = c => { genSpeck(c, '#bfe6f5', ['#a3d8ee', '#e8f8ff'], 0.2, 81); c.fillStyle = '#ffffff'; c.fillRect(3, 3, 3, 1); c.fillRect(3, 4, 1, 2); };
const SANDF = c => genBricks(c, '#d9b26a', '#b8914f', '#e8c785', 8, 8);
const CASTF = c => genBricks(c, '#4a3c63', '#3a2f50', '#5d4e7a', 8, 8);
const VOLCF = c => genSpeck(c, '#4a3532', ['#3a2826', '#5e4440', '#6a3a2a'], 0.28, 91);
const FLOORS = { stone: STONEF, cave: CAVEF, ice: ICEF, sand: SANDF, castle: CASTF, volc: VOLCF, wood: WOODF, grass: GRASS, sandg: SAND, snowg: SNOW, ashg: ASH, dgrass: DARKGRASS };
const STYLE_LIST = Object.keys(FLOORS);

function over(under, pat, pal) { return c => { under(c); paint(c, pat, pal); }; }

defTile('OCEAN', { solid: 1, water: 1, anim: 3, map: '#24529e' }, (c, f) => genWater(c, '#24529e', '#1c4282', '#4b80cc', f));
defTile('GRASS', { map: '#5aa83c' }, GRASS);
defTile('FLOWERS', { map: '#62ad42' }, c => {
  GRASS(c);
  const cols = ['#f6757a', '#fee761', '#ffffff', '#c27ff0'];
  for (let i = 0; i < 5; i++) {
    const x = Math.floor(U.hash2(i, 1, 5) * 13) + 1, y = Math.floor(U.hash2(i, 2, 5) * 13) + 1;
    c.fillStyle = cols[i % 4]; c.fillRect(x, y, 2, 2); c.fillStyle = '#fff6c0'; c.fillRect(x, y, 1, 1);
  }
});
defTile('TREE', { solid: 1, map: '#2e6b34' }, over(GRASS, P.tree, PAL_TREE));
defTile('PINE', { solid: 1, map: '#2b5a3a' }, over(SNOW, P.pine, { o: '#1d3b2a', d: '#24533a', G: '#2f7048', W: '#f4f8ff', T: '#6e4024', t: '#4e2e1c' }));
defTile('SAND', { map: '#ecd18f' }, SAND);
defTile('CACTUS', { solid: 1, map: '#7aa54a' }, over(SAND, P.cactus, { o: '#1d3b22', d: '#3c6e2c', G: '#5a9a3a', L: '#8fcf5a' }));
defTile('SNOW', { map: '#eef3f9' }, SNOW);
defTile('MOUNTAIN', { solid: 1, map: '#7d7a8a' }, over(GRASS, P.mountain, { o: OUT, R: '#8a8698', r: '#625e78', L: '#b4b0c4' }));
defTile('WATER', { solid: 1, water: 1, anim: 3, map: '#3a7bd5' }, (c, f) => {
  genWater(c, '#3a7bd5', '#2f66b8', '#77b3f2', f);
});
defTile('PATH', { map: '#c9a26b' }, PATH);
defTile('BRIDGE', { map: '#a8683a' }, c => {
  c.fillStyle = '#2f66b8'; c.fillRect(0, 0, 16, 16);
  genPlanks(c, '#a8683a', '#6e4024', '#c98a52');
  c.fillStyle = '#4e2e1c'; c.fillRect(0, 0, 1, 16); c.fillRect(15, 0, 1, 16);
});
defTile('LAVA', { solid: 1, anim: 3, map: '#d9411e' }, (c, f) => {
  c.fillStyle = '#c8381a'; c.fillRect(0, 0, 16, 16);
  for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
    const v = Math.sin(x * 0.7 + f * 2.1 + Math.sin(y * 0.6)) + Math.cos(y * 0.9 - f * 1.3);
    if (v > 1.2) { c.fillStyle = '#ffd34d'; c.fillRect(x, y, 1, 1); }
    else if (v > 0.5) { c.fillStyle = '#f08a24'; c.fillRect(x, y, 1, 1); }
  }
});
defTile('ASH', { map: '#5b4c4a' }, ASH);
defTile('DEADTREE', { solid: 1, map: '#4a3a30' }, over(ASH, P.deadtree, { o: OUT, T: '#6e5544', t: '#3e2f26' }));
defTile('VMOUNTAIN', { solid: 1, map: '#3e2e2c' }, over(ASH, P.mountain, { o: OUT, R: '#5a4240', r: '#3a2826', L: '#7a5a52' }));
defTile('SNOWMTN', { solid: 1, map: '#b8c0d0' }, over(SNOW, P.snowmtn, { o: OUT, R: '#8a8698', r: '#625e78', L: '#b4b0c4', W: '#f4f8ff' }));
defTile('PALM', { solid: 1, map: '#5a9a3a' }, over(SAND, P.palm, { o: '#1d3b22', G: '#3f8f3e', L: '#7ccf5a', T: '#9a6a3a', t: '#6e4024' }));
defTile('DARKGRASS', { map: '#3f6b45' }, DARKGRASS);
// 室内・ダンジョン床
defTile('WOODF', { map: '#b8804a', floor: 1 }, WOODF);
defTile('STONEF', { map: '#8f97a8', floor: 1 }, STONEF);
defTile('CAVEF', { map: '#6b5d52', floor: 1 }, CAVEF);
defTile('ICEF', { map: '#bfe6f5', floor: 1 }, ICEF);
defTile('SANDF', { map: '#d9b26a', floor: 1 }, SANDF);
defTile('CASTF', { map: '#4a3c63', floor: 1 }, CASTF);
defTile('VOLCF', { map: '#4a3532', floor: 1 }, VOLCF);
defTile('CARPET', { map: '#b3303c', floor: 1 }, c => {
  c.fillStyle = '#b3303c'; c.fillRect(0, 0, 16, 16);
  c.fillStyle = '#8e2430'; for (let i = 0; i < 16; i += 4) c.fillRect(i, i % 8 === 0 ? 7 : 8, 2, 1);
  c.fillStyle = '#e8b83a'; c.fillRect(1, 0, 1, 16); c.fillRect(14, 0, 1, 16);
});
// 壁
defTile('HWALL', { solid: 1, map: '#d8c8a8' }, c => {
  c.fillStyle = '#e8dcc0'; c.fillRect(0, 0, 16, 16);
  c.fillStyle = '#7a4a2c'; c.fillRect(0, 0, 16, 2); c.fillRect(0, 14, 16, 2); c.fillRect(0, 0, 2, 16); c.fillRect(14, 0, 2, 16);
  c.fillStyle = '#c8b898'; c.fillRect(2, 12, 12, 2);
  c.fillStyle = '#4e2e1c'; c.fillRect(0, 15, 16, 1);
});
defTile('HWIN', { solid: 1, map: '#d8c8a8' }, c => {
  c.fillStyle = '#e8dcc0'; c.fillRect(0, 0, 16, 16);
  c.fillStyle = '#7a4a2c'; c.fillRect(0, 0, 16, 2); c.fillRect(0, 14, 16, 2); c.fillRect(0, 0, 2, 16); c.fillRect(14, 0, 2, 16);
  c.fillStyle = '#4e2e1c'; c.fillRect(4, 4, 8, 7);
  c.fillStyle = '#9fd4f5'; c.fillRect(5, 5, 6, 5);
  c.fillStyle = '#e6f6ff'; c.fillRect(5, 5, 2, 2);
  c.fillStyle = '#4e2e1c'; c.fillRect(7, 5, 1, 5); c.fillRect(5, 7, 6, 1);
});
defTile('DOOR', { map: '#5e3a20', door: 1 }, c => {
  c.fillStyle = '#7a4a2c'; c.fillRect(0, 0, 16, 16);
  c.fillStyle = '#3a2214'; c.fillRect(3, 2, 10, 14);
  c.fillStyle = '#2a170e'; c.fillRect(4, 3, 8, 13);
  c.fillStyle = '#5e3a20'; c.fillRect(3, 2, 10, 1);
});
defTile('STONEW', { solid: 1, map: '#5d6478' }, c => { genBricks(c, '#6d7488', '#4a5064', '#8b93a6', 8, 4, '#5d6478'); c.fillStyle = '#4f8a3c'; c.fillRect(2, 0, 3, 1); c.fillRect(10, 4, 2, 1); c.fillRect(6, 8, 3, 1); });
defTile('CAVEW', { solid: 1, map: '#3e3430' }, c => { genSpeck(c, '#4a3e38', ['#3a302b', '#5c4e46', '#2c2420'], 0.4, 101); c.fillStyle = '#6a5a50'; c.fillRect(0, 0, 16, 1); });
defTile('ICEW', { solid: 1, map: '#6fb5d8' }, c => genBricks(c, '#7cc3e3', '#4d93b8', '#bfe9fb', 8, 4, '#64acd0'));
defTile('SANDW', { solid: 1, map: '#a8844a' }, c => genBricks(c, '#bf9a58', '#8e6e38', '#d9b878', 8, 4, '#a8844a'));
defTile('CASTW', { solid: 1, map: '#2c2440' }, c => genBricks(c, '#3a2f50', '#221a33', '#54467a', 8, 4, '#2f2645'));
defTile('VOLCW', { solid: 1, map: '#2a1c1a' }, c => { genSpeck(c, '#3a2624', ['#2a1a18', '#4e3430', '#6a2a1a'], 0.4, 111); c.fillStyle = '#5e3e38'; c.fillRect(0, 0, 16, 1); });
// 家具・装飾
defTile('TABLE', { solid: 1, map: '#a8683a' }, over(WOODF, P.table, PAL_WOOD));
defTile('BED', { solid: 1, map: '#c0392b' }, over(WOODF, P.bed, PAL_WOOD));
defTile('SHELF', { solid: 1, map: '#6e4024' }, over(WOODF, P.shelf, { o: OUT, T: '#a8683a', t: '#6e4024', R: '#c0392b', B: '#3a6ed8', G: '#3f8f3e', Y: '#e8b83a' }));
defTile('COUNTER', { solid: 1, counter: 1, map: '#a8683a' }, over(WOODF, P.counter, PAL_WOOD));
defTile('POT', { solid: 1, map: '#a0603a' }, over(WOODF, P.pot, { o: OUT, B: '#b86a3c', b: '#80462a', L: '#e09a62' }));
defTile('FENCE', { solid: 1, map: '#8a5a32' }, over(GRASS, P.fence, PAL_WOOD));
defTile('WELL', { solid: 1, map: '#8f97a8' }, over(GRASS, P.well, PAL_STONE));
defTile('SIGN', { solid: 1, read: 1, map: '#a8683a' }, over(GRASS, P.sign, PAL_WOOD));
defTile('TABLET', { solid: 1, read: 1, map: '#8f97a8' }, null); // 床はstructごとに差し替え
defTile('STATUE', { solid: 1, map: '#9aa1b2' }, null);
defTile('ALTAR', { solid: 1, map: '#7fd8ff' }, over(c => { c.fillStyle = '#b3303c'; c.fillRect(0, 0, 16, 16); }, P.altar, { o: OUT, W: '#ffffff', C: '#7fd8ff', c: '#3a8fd0', G: '#e8b83a', S: '#9aa1b2', s: '#6d7488', L: '#c4cad6' }));
// ギミック
defTile('SWITCH', { map: '#c0a050' }, null);
defTile('GATE', { solid: 1, map: '#505868' }, null);
defTile('HOLE', { solid: 1, hole: 1, map: '#101010' }, null);
defTile('FILLED', { map: '#7a7060' }, null);
defTile('RUNE', { map: '#4fd8e8' }, null);
defTile('RDOOR', { solid: 1, map: '#7a6a9a' }, null);
defTile('SEAL', { solid: 1, anim: 3, map: '#b050ff' }, (c, f) => {
  c.fillStyle = '#2f66b8'; c.fillRect(0, 0, 16, 16);
  genPlanks(c, '#a8683a', '#6e4024', '#c98a52');
  for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
    const v = Math.sin(x * 0.9 + y * 0.4 + f * 2) + Math.sin(y * 1.1 - f * 2.4);
    c.fillStyle = v > 0.8 ? 'rgba(255,200,255,0.85)' : 'rgba(170,70,255,0.55)';
    c.fillRect(x, y, 1, 1);
  }
});
defTile('CAVEIN', { map: '#000000', door: 1 }, null); // ダンジョン入口

// 構造物ごとの床に依存するタイル (床 x 種類)
const STYLE_TILES = {};
function styleTile(kind, style) { return STYLE_TILES[kind + ':' + style]; }

// ---------- 屋根 ----------
function genRoof(c, base, dark, light, eave) {
  c.fillStyle = base; c.fillRect(0, 0, 16, 16);
  for (let r = 0; r < 4; r++) {
    const off = (r % 2) * 4;
    c.fillStyle = dark; c.fillRect(0, r * 4 + 3, 16, 1);
    for (let x = off; x < 16; x += 8) { c.fillStyle = dark; c.fillRect(x, r * 4, 1, 3); }
    c.fillStyle = light; c.fillRect(0, r * 4, 16, 1);
  }
  if (eave) { c.fillStyle = dark; c.fillRect(0, 12, 16, 4); c.fillStyle = OUT; c.fillRect(0, 15, 16, 1); c.fillStyle = light; c.fillRect(0, 12, 16, 1); }
}
const ROOFS = {};

// ---------- 野外キャラ (女の子 16x16) ----------
const GIRL_D = [
  '....oooooooo....',
  '..ooHHHHHHHHoo..',
  '.oHHHHLLHHHHHHo.',
  '.oHHHLLHHHHHHHo.',
  'oHHHHHHHHHHHHHHo',
  'oHHhHHhHHhHHhHHo',
  'oHhSShSSSShSShHo',
  'oHhSEESSSSEEShHo',
  'oHhSEWSSSSEWShHo',
  'oHHPSSSmmSSSPHHo',
  '.oHHoSSSSSSoHHo.',
  '.ohHocXAAXcoHho.',
  '..ooSCCCCCCSoo..',
  '...oCCCCCCCCo...',
];
const GIRL_U = [
  '....oooooooo....',
  '..ooHHHHHHHHoo..',
  '.oHHHHHHHHLLHHo.',
  '.oHHHHHHHLLHHHo.',
  'oHHHHHHHHHHHHHHo',
  'oHHHhHHHHHHhHHHo',
  'oHHhHHHHHHHHhHHo',
  'oHHhHHHAAHHHhHHo',
  'oHHhHHHHHHHHhHHo',
  'oHhHHHHHHHHHHhHo',
  '.oHHHHHHHHHHHHo.',
  '.ohHHhHHHHhHHho.',
  '..oSCCCCCCCCSo..',
  '...oCCCCCCCCo...',
];
const GIRL_R = [
  '....oooooooo....',
  '..ooHHHHHHHHoo..',
  '.oHHHHHHHLLHHHo.',
  '.oHHHHHHLLHHHHo.',
  'oHHHHHHHHHHHHHo.',
  'oHHHHHHhHHhHhHo.',
  'oHHHHHhSSSShSSo.',
  'oHHHAHhSSSSEESo.',
  'oHHHHHhSSSSEWSo.',
  'oHHHHHHSSSSSPSo.',
  '.oHHHHoSSSSmSo..',
  '.ohHHhocXAXco...',
  '..ooCCCCCCSo....',
  '...oCCCCCCCo....',
];
const LEGS = {
  d0: ['...ocCCCCCCco...', '....oSo..oSo....', '....oBo..oBo....'],
  d1: ['...ocCCCCCCco...', '...oSo....oo....', '...oBo..........'],
  d2: ['...ocCCCCCCco...', '....oo....oSo...', '..........oBo...'],
  r0: ['...ocCCCCCco....', '....oSo.oSo.....', '....oBo.oBo.....'],
  r1: ['...ocCCCCCco....', '...oSo...oSo....', '...oBo...oBo....'],
  r2: ['...ocCCCCCco....', '.....oSoSo......', '.....oBoBo......'],
};
const ELDER = [
  '....oooooooo....',
  '..ooWWWWWWWWoo..',
  '.oWWWWWWWWWWWWo.',
  '.oWWSSSSSSSSWWo.',
  'oWWSSSSSSSSSSWWo',
  'oWSSooSSSSooSSWo',
  'oWSSSSSSSSSSSSWo',
  '.oSSSWWWWWWSSSo.',
  '.oSWWWWWWWWWWSo.',
  '..oWWWWWWWWWWo..',
  '..oCCWWWWWWCCo..',
  '.oCCCCWWWWCCCCo.',
  '.oSCCCCCCCCCCSo.',
  '..oCCCCCCCCCCo..',
  '..ocCCCCCCCCco..',
  '...oBBo..oBBo...',
];

// ---------- 立ち絵 (32x32) ----------
const PORT_BASE = [
  '', '', '', '', '', '', '', '', '',
  '..........oooooooooooo',
  '.........oSSSSSSSSSSSSo',
  '........oSSSSSSSSSSSSSSo',
  '........oSSSSSSSSSSSSSSo',
  '.......oSSSSSSSSSSSSSSSSo',
  '.......oSSSSSSSSSSSSSSSSo',
  '.......oSEEEESSSSSSEEEESo',
  '.......oSEWIESSSSSSEWIESo',
  '.......oSEIIESSSSSSEIIESo',
  '.......oSEiiESSSSSSEiiESo',
  '.......oSSEESSSSSSSSEESSo',
  '.......oSPPSSSSSSSSSSPPSo',
  '.......oSSSSSSSmmSSSSSSSo',
  '........oSSSSSSSSSSSSSSo',
  '.........oSSSSSSSSSSSSo',
  '..........oooSSSSSSooo',
  '.............osSSso',
  '.............oSSSSo',
  '......ooCCCCcXSSSSXcCCCCoo',
  '.....oCCCCCCcXXAAXXcCCCCCCo',
  '....oCCCCCCCCcXAAXcCCCCCCCCo',
  '...oCCCCCCCCCCcAAcCCCCCCCCCCo',
  '...oCCCCCCCCCCCccCCCCCCCCCCCo',
];
const HAIR_FRONT = [
  '', '',
  '...........oooooooooo',
  '.........ooHHHHHHHHHHoo',
  '........oHHHHHHLLHHHHHHo',
  '.......oHHHHHHLLHHHHHHHHo',
  '......oHHHHHHLLHHHHHHHHHHo',
  '......oHHHHHHHHHHHHHHHHHHo',
  '.....oHHHHHHHHHHHHHHHHHHHHo',
  '.....oHHHHHHHHHHHHHHHHHHHHo',
  '.....oHHHHhHHHHHHHHHHhHHHHo',
  '....oHHHHhHHHHHhHHHHHHhHHHHo',
  '....oHHHhHHHHHHhHHHHHHHhHHHo',
  '....oHHHHoooHHHooHHHoooHHHHo',
  '....oHHho...oHo..oHo...ohHHo',
  '....oHHho..............ohHHo',
  '....oHHho..............ohHHo',
  '....oHHho..............ohHHo',
  '....oHHho..............ohHHo',
  '....oHHho..............ohHHo',
  '....oHhho..............ohhHo',
  '....oHhho..............ohhHo',
  '....oHhho..............ohhHo',
  '....oHhho..............ohhHo',
  '....oHhho..............ohhHo',
  '.....oho................oho',
  '......o..................o',
];
const HAIR_BACK = {
  long: [
    '', '', '', '', '', '',
    '......oooooooooooooooooooo',
    '.....oHHHHHHHHHHHHHHHHHHHHo',
    '....oHHHHHHHHHHHHHHHHHHHHHHo',
    '...oHHHHHHHHHHHHHHHHHHHHHHHHo',
    '...oHHHHHHHHHHHHHHHHHHHHHHHHo',
    '...oHHHHHHHHHHHHHHHHHHHHHHHHo',
    '...ohHHHHHHHHHHHHHHHHHHHHHHho',
    '...ohHHHHHHHHHHHHHHHHHHHHHHho',
    '...ohHHHHHHHHHHHHHHHHHHHHHHho',
    '...ohHHHHHHHHHHHHHHHHHHHHHHho',
    '...ohHHHHHHHHHHHHHHHHHHHHHHho',
    '...ohHHHHHHHHHHHHHHHHHHHHHHho',
    '...ohHHHHHHHHHHHHHHHHHHHHHHho',
    '...ohhHHHHHHHHHHHHHHHHHHHHhho',
    '...ohhHHHHHHHHHHHHHHHHHHHHhho',
    '..ohhHHHHHHHHHHHHHHHHHHHHHHhho',
    '..ohhHHHHHHHHHHHHHHHHHHHHHHhho',
    '..ohhHHHHHHHHHHHHHHHHHHHHHHhho',
    '..ohhHHHHHHHHHHHHHHHHHHHHHHhho',
    '..ohhHHHHHHHHHHHHHHHHHHHHHHhho',
    '..ohhHHHHHHHHHHHHHHHHHHHHHHhho',
    '..ohHHhHHhHHhHHhHHhHHhHHhHHhho',
    '..o.oo.oo.oo.oo.oo.oo.oo.oo.o',
  ],
  bob: [
    '', '', '', '', '', '',
    '......oooooooooooooooooooo',
    '.....oHHHHHHHHHHHHHHHHHHHHo',
    '....oHHHHHHHHHHHHHHHHHHHHHHo',
    '...oHHHHHHHHHHHHHHHHHHHHHHHHo',
    '...oHHHHHHHHHHHHHHHHHHHHHHHHo',
    '...oHHHHHHHHHHHHHHHHHHHHHHHHo',
    '...ohHHHHHHHHHHHHHHHHHHHHHHho',
    '...ohHHHHHHHHHHHHHHHHHHHHHHho',
    '...ohHHHHHHHHHHHHHHHHHHHHHHho',
    '...ohHHHHHHHHHHHHHHHHHHHHHHho',
    '...ohHHHHHHHHHHHHHHHHHHHHHHho',
    '...ohHHHHHHHHHHHHHHHHHHHHHHho',
    '...ohhHHHHHHHHHHHHHHHHHHHHhho',
    '...ohhHHHHHHHHHHHHHHHHHHHHhho',
    '....ohhHhhHHHHHHHHHHHhhHhho',
    '.....oooohhho....ohhhoooo',
    '.........ooo......ooo',
  ],
};
const TAIL = [
  '..oo..',
  '.oAAo.',
  'oHAAHo',
  'oHHHHo',
  'oHHHHo',
  'oHHHho',
  'oHHHho',
  'oHHHho',
  'oHHHho',
  '.oHHho',
  '.oHHho',
  '.oHHho',
  '.oHhho',
  '.oHhho',
  '..oHho',
  '..oHho',
  '..ohho',
  '...oho',
  '....o.',
];
const ACC = {
  ribbon: { x: 18, y: 1, rows: [
    '.oo......oo',
    'oAAo....oAAo',
    'oAAAo..oAAAo',
    'oAAaAooAaAAo',
    'oAAAaAAaAAAo',
    'oAAaAooAaAAo',
    'oAAAo..oAAAo',
    '.oo......oo',
  ] },
  tiara: { x: 10, y: 4, rows: [
    '.....oo.....',
    '..o.oWWo.o..',
    '.oGoGRRGoGo.',
    'oGGGGGGGGGGo',
    '.oooooooooo.',
  ] },
  witch: { x: 2, y: -1, rows: [
    '.................oooo',
    '...............ooKKKko',
    '.............ooKKKKko.',
    '...........ooKKKKKKo..',
    '..........oKKKKKKKKo..',
    '.........oKKKKKKKKKo..',
    '........oKKKKKKKKKKo..',
    '........oKKKKKKKKKKKo.',
    '.......oAAAAAAAAAAAAAo',
    '..oooooAAAAAAAAAAAAAAAooooo',
    '.oKKKKKKKKKKKKKKKKKKKKKKKKKo',
    'oKKKKKKKKKKKKKKKKKKKKKKKKKKKo',
    '.oooooooooooooooooooooooooo',
  ] },
  flower: { x: 3, y: 8, rows: [
    '..oo.oo.',
    '.oAAoAAo',
    '.oAAWAAo',
    'oAAWYWAAo',
    '.oAAWAAo',
    '.oAAoAAo',
    '..oo.oo.',
  ] },
  elf: { x: 0, y: 13, rows: [
    'oo..........................oo',
    'oSo........................oSo',
    '.oSo......................oSo.',
    '.oSso....................osSo.',
    '..oSo....................oSo..',
    '...o......................o...',
  ] },
  star: { x: 19, y: 2, rows: [
    '....oo....',
    '...oYYo...',
    'oooYYYYooo',
    'oYYYYYYYYo',
    '.oYYYYYYo.',
    '..oYYYYo..',
    '.oYYooYYo.',
    '.ooo..ooo.',
  ] },
  hairpin: { x: 20, y: 9, rows: [
    'o..o..',
    '.oAo..',
    '.oAAo.',
    'oAo.oo',
    'o..o..',
  ] },
  cat: { x: 5, y: 0, rows: [
    'oo..................oo',
    'oHo................oHo',
    'oHHo..............oHHo',
    'oHAHo............oHAHo',
    'oHAAHo..........oHAAHo',
    'oHHHHHo........oHHHHHo',
  ] },
  band: { x: 5, y: 8, rows: [
    '.oooooooooooooooooooo',
    'oAAAAAAAAAAAAAAAAAAAAo',
    'oaaaaaaaaaaaaaaaaaaaaoo',
    '.oooooooooooooooooooooAo',
    '.....................oAAo',
    '......................oo',
  ] },
};

// ---------- 敵スプライト ----------
const EN = {};
EN.slime = [
  '................',
  '................',
  '................',
  '.......oo.......',
  '......oLBo......',
  '.....oLBBBo.....',
  '....oLBBBBBo....',
  '...oLLBBBBBBo...',
  '..oLBBBBBBBBBo..',
  '..oBBWoBBWoBBo..',
  '.oBBBWoBBWoBBBo.',
  '.oBBBBBBBBBBBbo.',
  '.oBBBBRRRRBBBbo.',
  '.obBBBBRRBBBbbo.',
  '..obbbbbbbbbbo..',
  '...oooooooooo...',
];
EN.bat = [
  '................',
  '................',
  '................',
  '................',
  'o..............o',
  'oo....o..o....oo',
  'oBo...oBBo...oBo',
  'oBBo.oBBBBo.oBBo',
  'oBBBoBEBBEBoBBBo',
  '.oBBBBBBBBBBBBo.',
  '.obBBBBWWBBBBbo.',
  '..obBBoBBoBBbo..',
  '...obo.oo.obo...',
  '....o......o....',
  '................',
  '................',
];
EN.mush = [
  '................',
  '................',
  '......oooo......',
  '....ooBBBBoo....',
  '...oBBWWBBBBo...',
  '..oBBWWWBBLBBo..',
  '..oBBBWBBBBBBo..',
  '.oBBBBBBBWWBBBo.',
  '.oBLBBBBBWWBBbo.',
  '.obbBBBBBBBBbbo.',
  '..oobbbbbbbboo..',
  '....oSSSSSSo....',
  '....oSoSSoSo....',
  '....oSSRRSSo....',
  '....osSSSSso....',
  '.....oooooo.....',
];
EN.wolf = [
  '................',
  '................',
  '...o..o.........',
  '..oBooBo........',
  '..oBBBBBo.......',
  '.oBEBBBBBo......',
  'oBBBBBBBBBoooo.o',
  'oWBbBBBBBBBBBBoB',
  '.oooBBBBBBBBBBBo',
  '....oBBBBBBBBBbo',
  '....oBBBBBBBBbo.',
  '....obBbbbbbBbo.',
  '....oBo.oBo.oBo.',
  '....oBo.oBo.oBo.',
  '....ooo.ooo.ooo.',
  '................',
];
EN.skel = [
  '................',
  '.....oooooo.....',
  '....oWWWWWWo....',
  '...oWWWWWWWWo...',
  '...oWEEWWEEWo...',
  '...oWEEWWEEWo...',
  '...oWWWooWWWo...',
  '....oWoWoWWo....',
  '.....oWWWWo.....',
  '...ooooWWoooo...',
  '..oWoWWWWWWoWo..',
  '..oWooWoWoWoWo..',
  '...o.oWWWWo.oA..',
  '.....oWooWo.oA..',
  '.....oWo.oWo.A..',
  '.....oo..ooo....',
];
EN.ghost = [
  '................',
  '......oooo......',
  '....ooLLBBoo....',
  '...oLLBBBBBBo...',
  '..oLBBBBBBBBBo..',
  '..oBBoEBBoEBBo..',
  '..oBBooBBooBBo..',
  '.oBBBBBBBBBBBBo.',
  '.oBBBBBRRBBBBBo.',
  '.oBBBBBBBBBBBbo.',
  '.oBBBBBBBBBBbbo.',
  '.obBBBBBBBBbbbo.',
  '.obbBBbBBbbBbbo.',
  '.obo.obbo.obbo..',
  '..o...oo...oo...',
  '................',
];
EN.scorp = [
  '................',
  '...........oo...',
  '..........oBBo..',
  '..........oBAo..',
  '...........oBo..',
  '...........oBo..',
  '..oo.......oBo..',
  '.oBBo.oooooBBo..',
  '.oBo.oBBBBBBo...',
  '..oooBEBEBBBBo..',
  '...oBBBBBBBBBo..',
  '..oBoBBBBBBBoBo.',
  '.oBo.obbbbbo.oBo',
  '.oo.oBo.oBo...oo',
  '....oo...oo.....',
  '................',
];
EN.imp = [
  '................',
  '..o..........o..',
  '..oAo......oAo..',
  '...oAoooooooAo..',
  '....oBBBBBBBo...',
  '...oBBBBBBBBBo..',
  '...oBEEBBBEEBo..',
  '...oBBBBBBBBBo..',
  '....oBWRRRWBo...',
  '..oo.oBBBBBo.oo.',
  '.oBBooBBBBBooBBo',
  '.oBo.oBBBBBo.oBo',
  '..o..obBBBbo..o.',
  '.....oBo.oBo....',
  '.....oo...oo....',
  '................',
];
EN.wisp = [
  '................',
  '.......o........',
  '......oLo.......',
  '.....oLLo..o....',
  '....oLBBLooLo...',
  '...oLBBBBLLBo...',
  '...oBBBBBBBBo...',
  '..oBBBWWBBBBBo..',
  '..oBBWEEWBWWBo..',
  '..oBBBWWBWEEBo..',
  '..oBBBBBBBWWBo..',
  '...oBBBRRBBBo...',
  '...obBBBBBBbo...',
  '....obbbbbbo....',
  '.....oooooo.....',
  '................',
];
// ボス (32x32)
EN.treant = [
  '................................',
  '..........oooooooooooo..........',
  '........ooLLLGGGGGGGGGoo........',
  '......ooLLGGGGGGGGGGGGGGoo......',
  '.....oLLGGGGGGLGGGGGGGGGGGo.....',
  '....oLGGGGGGGLLGGGGGGGLGGGGo....',
  '...oLGGGGGGGGGGGGGGGGLLGGGGGo...',
  '...oGGGGLGGGGGGGGGGGGGGGGGGgo...',
  '..oLGGGLLGGGGGGGGGGGGGGGGGGggo..',
  '..oGGGGGGGGGGGGGLGGGGGGGGGgggo..',
  '..oGGGGGGGGGGGGLLGGGGGGGGggggo..',
  '..ogGGGGGGGGGGGGGGGGGGGGgggggo..',
  '...ogGGGGGGGGGGGGGGGGGggggggo...',
  '...oogggGGGGGGGGGGGGGgggggoo....',
  '.....ooggggggggggggggggggoo.....',
  '.o.....ooooTTTTTTTTToooo.....o..',
  'oTo.......oTTTTTTTTTTo......oTo.',
  '.oTo......oTTooTTooTTo.....oTo..',
  '..oTo.....oTEEoTToEEto....oTo...',
  '...oTTooooTTTTTTTTTTTToooTTo....',
  '....ooTTTTTTTTTTTTTTTTTTToo.....',
  '......ooooTTTRRRRRRTTToooo......',
  '..........oTTRWRRWRTTo..........',
  '..........oTTTRRRRTTto..........',
  '..........oTTTTTTTTTto..........',
  '..........oTtTTTTTTtto..........',
  '.........ooTTTTTTTTTttoo........',
  '........oTTTTTTTTTTTttttoo......',
  '......ooTTtoTTTToTTTTotTTToo....',
  '.....oTTTo.oTTo..oTTo..oTTTo....',
  '.....oooo..oooo..oooo...oooo....',
  '................................',
];
EN.dragon = [
  '................................',
  '.....................oo.........',
  '....................oAAo....oo..',
  '...................oAAAAo..oAAo.',
  '..................oAALLAAooAAAo.',
  '.................oAALLAAAAAAAAo.',
  '................oAALAAAAAAAAAo..',
  '......oo.......oAAAAAAAAAAAAo...',
  '.....oBBo.....oAAAAAAAAAAAAo....',
  '....oBBBBo...oBBAAAAAAAAAo......',
  '...oBEBBBBo.oBBBBAAAAAAo........',
  '..oBBBBBBBBoBBBBBBBBBo..........',
  '.oWBBBBBBBBBBBBBBBBBBBo.........',
  '.oRWoBBBBBBBBBBBBBBBBBBo........',
  '..ooooBBBBSSBBBBBBBBBBBBo.......',
  '......oBBSSSSBBBBBBBBBBBBo......',
  '.....oBBSSSSSSBBBBBBBBBBBBo.....',
  '.....oBSSSSSSSSBBBBBBBBBBBBo....',
  '.....oBSSSSSSSSBBBBBBBBBBBbo....',
  '.....oBSSSSSSSSBBBBBBBBBBbbo....',
  '......oSSSSSSSBBBBBBBBBBbbo.....',
  '......oBSSSSSBBBBBBBBBbbbo.oo...',
  '.......oBBBBBBBBBBBBbbbboooBBo..',
  '.......oBBbbBBBBBBbbbbbBBBBBo...',
  '......oBBo.obBBBbbbo.oBBBBo.....',
  '.....oBBo...oBBbbo...ooooo......',
  '....oWoWo...oBBBo...............',
  '.....o.o...oBBBo................',
  '...........oWoWo................',
  '............o.o.................',
  '................................',
  '................................',
];
EN.golem = [
  '................................',
  '................................',
  '...........oooooooooo...........',
  '..........oLLLLBBBBBBo..........',
  '..........oLBBBBBBBBbo..........',
  '..........oBBEEBBEEBbo..........',
  '..........oBBBBBBBBBbo..........',
  '..........oBBoooooBBbo..........',
  '...........obbbbbbbbo...........',
  '......oooooooooooooooooooo......',
  '.....oLLLBBBBBBBBBBBBBBBBBo.....',
  '....oLLBBBBBBBBAABBBBBBBBBbo....',
  '....oLBBBoBBBBAAAABBBBoBBBbo....',
  '....oBBBo.oBBBBAABBBBo.oBBbo....',
  '...oLBBo..oBBBBBBBBBBo..oBBbo...',
  '...oBBBo..oBBBBBBBBBBo..oBBbo...',
  '...oBBBo..oBBBBBBBBBbo..oBbbo...',
  '..oLBBBo..oBBBBBBBBbbo..oBbbbo..',
  '..oBBBBo..obbbbbbbbbbo..oBbbbo..',
  '..oBBBbo...oooooooooo...obbbbo..',
  '..obbbbo..oBBBBoBBBBBo..obbbbo..',
  '...oooo...oBBBBooBBBBo...oooo...',
  '..........oBBBbo.oBBBbo.........',
  '.........oLBBBbo.oBBBbbo........',
  '.........oBBBBbo.oBBBbbo........',
  '.........oBBBbbo.oBBbbbo........',
  '........oLBBBbbo.oBBbbbbo.......',
  '........obbbbbbo.obbbbbbo.......',
  '........oooooooo.oooooooo.......',
  '................................',
  '................................',
  '................................',
];
EN.demon = [
  '................................',
  '......o..................o......',
  '.....oAo................oAo.....',
  '.....oAAo..............oAAo.....',
  '......oAAo..oooooooo..oAAo......',
  '.......oAAooSSSSSSSSooAAo.......',
  '........oAoSSSSSSSSSSoAo........',
  '.........oSSSSSSSSSSSSo.........',
  '.........oSEESSSSSSEESo.........',
  '.........oSSEoSSSSoESSo.........',
  '.........oSSSSSSSSSSSSo.........',
  '..........oSSWRRRRWSSo..........',
  '...........oSSSSSSSSo...........',
  '......ooooooGooooooGoooooo......',
  '....ooKKKKKKGGGGGGGGKKKKKKoo....',
  '...oKKKKKKKKKGGGGGGKKKKKKKKKo...',
  '..oKKKKoKKKKKKGGGGKKKKKKoKKKKo..',
  '..oKKKo.oKKKKKKKKKKKKKKo.oKKKo..',
  '.oKKKKo.oKKKKKKKKKKKKKKo.oKKKKo.',
  '.oKKKo..oKKKKKKKKKKKKKKo..oKKKo.',
  '.oSSo...oKKKKKKKKKKKKKKo...oSSo.',
  '.oSSo..oKKKKKKKKKKKKKKKKo..oSSo.',
  '..oo...oKKKKKKKKKKKKKKKKo...oo..',
  '......oKKKKKKKKKKKKKKKKKKo......',
  '......oKKKKKKKKKKKKKKKKKKo......',
  '.....oKKKKKKKKKKKKKKKKKKKKo.....',
  '.....oKKKKKKKKKKKKKKKKKKKKo.....',
  '....oKKKKKKKKKKKKKKKKKKKKKKo....',
  '....okkkkkkkkkkkkkkkkkkkkkko....',
  '....oooooooooooooooooooooooo....',
  '................................',
  '................................',
];

// ---------- 生成・キャッシュ ----------
const SPR = {
  tiles: [], // [tileIndex][frame] = canvas
  obj: {},
  roofs: {},
  girl: {},
  port: {},
  enemy: {},
  ready: false,
};

function tileFloorGen(style) { return FLOORS[style] || STONEF; }

function buildSprites() {
  // 基本タイル
  for (let i = 0; i < TILE_DEFS.length; i++) {
    const d = TILE_DEFS[i];
    const frames = [];
    const n = d.anim || 1;
    for (let f = 0; f < n; f++) {
      const c = mkCanvas(16, 16);
      if (d.gen) d.gen(c.getContext('2d'), f);
      frames.push(c);
    }
    SPR.tiles.push(frames);
  }
  // 床スタイル依存のギミックタイル
  const styles = Object.keys(FLOORS);
  const gimmick = {
    TABLET: (c) => paint(c, P.tablet, PAL_STONE),
    STATUE: (c) => paint(c, P.statue, PAL_STONE),
    SWITCH: (c) => {
      c.fillStyle = OUT; c.fillRect(2, 2, 12, 12);
      c.fillStyle = '#a08850'; c.fillRect(3, 3, 10, 10);
      c.fillStyle = '#c8b070'; c.fillRect(3, 3, 10, 1); c.fillRect(3, 3, 1, 10);
      c.fillStyle = '#6a5a30'; c.fillRect(6, 6, 4, 4);
    },
    SWITCH_ON: (c) => {
      c.fillStyle = OUT; c.fillRect(2, 2, 12, 12);
      c.fillStyle = '#5a8a40'; c.fillRect(3, 3, 10, 10);
      c.fillStyle = '#9ef07a'; c.fillRect(6, 6, 4, 4);
    },
    GATE: (c) => {
      c.fillStyle = 'rgba(0,0,0,0.35)'; c.fillRect(0, 0, 16, 16);
      for (let x = 1; x < 16; x += 4) { c.fillStyle = OUT; c.fillRect(x, 0, 3, 16); c.fillStyle = '#8a92a6'; c.fillRect(x + 1, 0, 1, 16); }
      c.fillStyle = OUT; c.fillRect(0, 2, 16, 3); c.fillRect(0, 11, 16, 3);
      c.fillStyle = '#6a7286'; c.fillRect(0, 3, 16, 1); c.fillRect(0, 12, 16, 1);
    },
    HOLE: (c) => {
      c.fillStyle = OUT; c.fillRect(1, 1, 14, 14);
      c.fillStyle = '#05040a'; c.fillRect(2, 3, 12, 11);
      c.fillStyle = '#2a2430'; c.fillRect(2, 2, 12, 1);
    },
    FILLED: (c) => {
      c.fillStyle = '#5a5248'; c.fillRect(1, 1, 14, 14);
      c.fillStyle = '#7a7060'; c.fillRect(2, 2, 5, 4); c.fillRect(8, 3, 6, 4); c.fillRect(3, 8, 6, 5); c.fillRect(10, 9, 4, 4);
      c.fillStyle = '#3a342c'; c.fillRect(7, 2, 1, 12); c.fillRect(2, 7, 12, 1);
    },
    RUNE: (c) => {
      c.fillStyle = '#4fd8e8';
      for (let a = 0; a < 24; a++) { const t = a / 24 * Math.PI * 2; c.fillRect(Math.round(8 + Math.cos(t) * 6) - 1, Math.round(8 + Math.sin(t) * 6) - 1, 1, 1); }
      c.fillStyle = '#b8f6ff'; c.fillRect(7, 3, 1, 9); c.fillRect(4, 7, 7, 1); c.fillRect(5, 5, 1, 1); c.fillRect(9, 9, 1, 1); c.fillRect(9, 5, 1, 1); c.fillRect(5, 9, 1, 1);
    },
    RDOOR: (c) => {
      c.fillStyle = OUT; c.fillRect(0, 0, 16, 16);
      c.fillStyle = '#6a5a8a'; c.fillRect(1, 1, 14, 15);
      c.fillStyle = '#8a7aaa'; c.fillRect(1, 1, 14, 1); c.fillRect(1, 1, 1, 15);
      c.fillStyle = '#4a3a6a'; c.fillRect(7, 1, 2, 15);
      c.fillStyle = '#ffd94a'; c.fillRect(5, 6, 6, 4); c.fillStyle = OUT; c.fillRect(7, 7, 2, 2);
      c.fillStyle = '#ffd94a'; c.fillRect(7, 4, 2, 1); c.fillRect(7, 11, 2, 1);
    },
    CAVEIN: (c) => {
      c.fillStyle = '#000'; c.fillRect(0, 0, 16, 16);
    },
  };
  for (const s of styles) {
    for (const k in gimmick) {
      const c = mkCanvas(16, 16);
      const x = c.getContext('2d');
      FLOORS[s](x);
      gimmick[k](x);
      STYLE_TILES[k + ':' + s] = c;
    }
  }
  // 屋根
  const R = (base, dark, light) => ({ mid: (() => { const c = mkCanvas(16, 16); genRoof(c.getContext('2d'), base, dark, light, false); return c; })(), eave: (() => { const c = mkCanvas(16, 16); genRoof(c.getContext('2d'), base, dark, light, true); return c; })() });
  SPR.roofs.red = R('#c0473a', '#7a2a24', '#e07a5a');
  SPR.roofs.blue = R('#3a6ed8', '#22408a', '#6a9af0');
  SPR.roofs.green = R('#3f8f5e', '#24583a', '#6abf86');
  SPR.roofs.sand = R('#c8a060', '#8a6a38', '#e6c488');
  SPR.roofs.purple = R('#6a4a9a', '#3a2a5a', '#9a7ac8');
  const mtn = (k) => ({ mid: SPR.tiles[T[k]][0], eave: SPR.tiles[T[k]][0] });
  SPR.roofs.canopy = (() => { const c = mkCanvas(16, 16); const x = c.getContext('2d'); genSpeck(x, '#2e6b34', ['#3f8f3e', '#24532a', '#63b84f'], 0.45, 121); const e = mkCanvas(16, 16); const ex = e.getContext('2d'); ex.drawImage(c, 0, 0); ex.fillStyle = '#1d3b22'; ex.fillRect(0, 13, 16, 3); ex.fillStyle = '#24532a'; ex.fillRect(0, 12, 16, 1); return { mid: c, eave: e }; })();
  SPR.roofs.snowmtn = mtn('SNOWMTN');
  SPR.roofs.mountain = mtn('MOUNTAIN');
  SPR.roofs.volc = mtn('VMOUNTAIN');
  SPR.roofs.pyramid = (() => {
    const c = mkCanvas(16, 16); const x = c.getContext('2d');
    genBricks(x, '#e0bc72', '#a8844a', '#f2d898', 16, 4, '#c8a060');
    const e = mkCanvas(16, 16); const ex = e.getContext('2d'); ex.drawImage(c, 0, 0); ex.fillStyle = '#8e6e38'; ex.fillRect(0, 13, 16, 3);
    return { mid: c, eave: e };
  })();
  SPR.roofs.castle = (() => {
    const c = mkCanvas(16, 16); const x = c.getContext('2d');
    genBricks(x, '#3a2f50', '#221a33', '#54467a', 8, 4, '#2f2645');
    const e = mkCanvas(16, 16); const ex = e.getContext('2d'); ex.drawImage(c, 0, 0);
    ex.fillStyle = '#221a33'; ex.fillRect(0, 12, 16, 4); ex.fillStyle = '#54467a'; ex.fillRect(1, 12, 5, 2); ex.fillRect(10, 12, 5, 2);
    return { mid: c, eave: e };
  })();
  // オブジェクト
  SPR.obj.chest = patCanvas(P.chest, PAL_WOOD);
  SPR.obj.chestOpen = patCanvas(P.chestOpen, PAL_WOOD);
  SPR.obj.boulder = patCanvas(P.boulder, { o: OUT, R: '#8a8698', r: '#625e78', L: '#b4b0c4' });
  SPR.obj.crystal = patCanvas(P.crystal, { o: OUT, W: '#ffffff', L: '#b8f0ff', C: '#5ac8f0', c: '#2a78c0' });
  SPR.obj.crystalUsed = patCanvas(P.crystal, { o: OUT, W: '#fff6d0', L: '#ffe08a', C: '#f0b040', c: '#b07020' });
  SPR.obj.elder = patCanvas(ELDER, { o: OUT, W: '#e8e8f0', S: '#f2c8a0', C: '#6a4a9a', c: '#4a3270', B: '#5a3a20' });
  SPR.ready = true;
}

// 女の子の野外スプライト (look: {hair, cloth, acc, style})
function girlSprite(look, dir, frame) {
  const key = look.hair + look.cloth + look.acc + look.style + dir + frame;
  if (SPR.girl[key]) return SPR.girl[key];
  const pal = {
    o: OUT, H: look.hair, h: U.shade(look.hair, -0.28), L: U.shade(look.hair, 0.35),
    S: '#fde3cf', s: '#f0bfa0', P: '#f7a1a8', E: '#2a1d3a', W: '#ffffff', m: '#c2565e',
    C: look.cloth, c: U.shade(look.cloth, -0.3), A: look.acc, X: '#ffffff', B: '#6a3c22',
  };
  const c = mkCanvas(16, 16);
  const x = c.getContext('2d');
  const side = dir === 'l' || dir === 'r';
  const base = dir === 'd' ? GIRL_D : dir === 'u' ? GIRL_U : GIRL_R;
  const legs = LEGS[(side ? 'r' : 'd') + frame];
  const bob = frame === 0 ? 0 : 0;
  // ツインテール/ポニーテールの付け足し
  if (look.style === 'twin' && !side) {
    x.fillStyle = OUT; x.fillRect(0, 5, 2, 7); x.fillRect(14, 5, 2, 7);
    x.fillStyle = look.hair; x.fillRect(0, 6, 1, 5); x.fillRect(15, 6, 1, 5);
  }
  if (look.style === 'pony' && dir === 'u') {
    // 後ろ姿のしっぽ
  }
  paint(x, base, pal, 0, bob, dir === 'l', 16);
  paint(x, legs, pal, 0, 13 + bob, dir === 'l', 16);
  if (look.style === 'pony' && dir === 'u') {
    x.fillStyle = OUT; x.fillRect(6, 9, 4, 5); x.fillStyle = look.hair; x.fillRect(7, 9, 2, 4);
  }
  if (look.style === 'pony' && side) {
    const px = dir === 'l' ? 13 : 0;
    x.fillStyle = OUT; x.fillRect(px, 3, 3, 7); x.fillStyle = look.hair; x.fillRect(px + (dir === 'l' ? 0 : 1), 4, 2, 5);
  }
  if (look.style === 'twin' && side) {
    const px = dir === 'l' ? 12 : 1;
    x.fillStyle = OUT; x.fillRect(px, 6, 3, 7); x.fillStyle = look.hair; x.fillRect(px + 1, 7, 1, 5);
  }
  if (look.style === 'bob') {
    // ボブは襟足を短く (裾を削る)
  }
  SPR.girl[key] = c;
  return c;
}

// 立ち絵 32x32
function portrait(look) {
  const key = JSON.stringify(look);
  if (SPR.port[key]) return SPR.port[key];
  const pal = {
    o: OUT, H: look.hair, h: U.shade(look.hair, -0.25), L: U.shade(look.hair, 0.4),
    S: '#fde3cf', s: '#f0bfa0', P: '#f7a1a8', E: '#2a1d3a', W: '#ffffff', m: '#c2565e',
    I: look.eye, i: U.shade(look.eye, 0.45),
    C: look.cloth, c: U.shade(look.cloth, -0.3), A: look.acc, a: U.shade(look.acc, -0.3), X: '#ffffff',
    G: '#f5c542', R: '#e43b44', Y: '#ffe66d', K: look.hat || '#3a2a5a', k: U.shade(look.hat || '#3a2a5a', -0.4),
  };
  const c = mkCanvas(32, 32);
  const x = c.getContext('2d');
  const style = look.style || 'long';
  if (style === 'twin' || style === 'pony') {
    if (style === 'twin') paint(x, TAIL, pal, 0, 8, false, 6);
    paint(x, TAIL, pal, 26, style === 'pony' ? 4 : 8, true, 6);
  }
  const back = HAIR_BACK[style === 'twin' || style === 'pony' ? 'bob' : style];
  paint(x, back, pal, 0, 0, false, 32);
  paint(x, PORT_BASE, pal, 0, 0, false, 32);
  paint(x, HAIR_FRONT, pal, 0, 0, false, 32);
  if (look.accType && ACC[look.accType]) {
    const a = ACC[look.accType];
    paint(x, a.rows, pal, a.x, a.y);
  }
  SPR.port[key] = c;
  return c;
}
const PORT_URL = {};
function portraitURL(look) {
  const key = JSON.stringify(look);
  if (!PORT_URL[key]) PORT_URL[key] = portrait(look).toDataURL();
  return PORT_URL[key];
}

function enemySprite(spr, pal) {
  const key = spr + JSON.stringify(pal);
  if (SPR.enemy[key]) return SPR.enemy[key];
  const B = pal.B || '#888';
  const full = Object.assign({
    o: OUT, B, b: U.shade(B, -0.3), L: U.shade(B, 0.4), E: '#ff3b3b', e: '#000', W: '#ffffff', R: '#c2264a',
    A: '#f5c542', a: '#b08020', S: '#f0e0c0', s: '#c8b090', G: '#f5c542', K: '#3a2050', k: '#22122e', T: '#7a5a3a', t: '#4e3624',
  }, pal);
  if (pal.T) full.t = U.shade(pal.T, -0.35);
  if (pal.K) full.k = U.shade(pal.K, -0.4);
  if (pal.G && spr === 'treant') { full.g = U.shade(pal.G, -0.3); full.L = U.shade(pal.G, 0.3); }
  if (spr === 'treant' && !pal.G) { full.G = '#3f8f3e'; full.g = '#2e6b34'; full.L = '#63b84f'; }
  if (spr === 'dragon') { full.A = pal.A || U.shade(B, -0.15); full.L = U.shade(full.A, 0.35); full.S = pal.S || U.shade(B, 0.5); }
  const rows = EN[spr];
  const c = patCanvas(rows, full, rows[0].length, rows.length);
  SPR.enemy[key] = c;
  return c;
}
