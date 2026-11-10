'use strict';
// ===== 全身ドット絵 (64x128) =====
// 体と衣装を「図形」で描き、陰影・内側の線・外側のアウトラインを自動で付ける。
// 頭は立ち絵(32x32)の上半分をそのまま使うので、髪型・飾り・目の色は立ち絵と同じになる。
// 衣装の形は FB_OUTFITS に関数で書く (look.outfit がキー。なければ default)。
const FB_W = 64, FB_H = 128;

// ---- 図形 (マスク関数) ----
const FBM = {
  poly(pts) {
    return (x, y) => {
      const px = x + 0.5, py = y + 0.5;
      let ins = false;
      for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
        const [xi, yi] = pts[i], [xj, yj] = pts[j];
        if ((yi > py) !== (yj > py) && px < (xj - xi) * (py - yi) / (yj - yi) + xi) ins = !ins;
      }
      return ins;
    };
  },
  // 左半分の点を書くと左右対称の多角形にする
  sym(left) { const r = left.slice().reverse().map(([x, y]) => [64 - x, y]); return FBM.poly(left.concat(r)); },
  mirror(m) { return (x, y) => m(63 - x, y); },
  both(m) { return FBM.or(m, FBM.mirror(m)); },
  ell(cx, cy, rx, ry) { return (x, y) => ((x + 0.5 - cx) / rx) ** 2 + ((y + 0.5 - cy) / ry) ** 2 <= 1; },
  rect(x0, y0, x1, y1) { return (x, y) => x >= x0 && x < x1 && y >= y0 && y < y1; },
  or(...ms) { return (x, y) => ms.some(m => m(x, y)); },
  and(...ms) { return (x, y) => ms.every(m => m(x, y)); },
  not(m) { return (x, y) => !m(x, y); },
  band(y0, y1) { return (x, y) => y >= y0 && y < y1; },
};

// 体のパーツ
const FB_BODY = {
  neck: FBM.rect(29, 22, 35, 30),
  torso: FBM.sym([[32, 26], [25, 27], [20, 30], [22, 40], [25, 50], [23, 60], [32, 61]]),
  arm: FBM.both(FBM.poly([[20, 29], [23, 32], [21, 46], [19, 59], [15, 59], [16, 46], [17, 31]])),
  hand: FBM.both(FBM.ell(17, 61, 2.6, 3.2)),
  leg: FBM.both(FBM.poly([[23.5, 57], [31.6, 57], [31, 80], [30, 100], [29.6, 117], [26.4, 117], [25, 100], [24, 80]])),
  foot: FBM.both(FBM.poly([[25.5, 115], [30.5, 115], [31, 121], [24.5, 121]])),
};
FB_BODY.all = FBM.or(FB_BODY.neck, FB_BODY.torso, FB_BODY.arm, FB_BODY.hand, FB_BODY.leg, FB_BODY.foot);

function fbGrid() { return { c: new Array(FB_W * FB_H).fill(null) }; }
// 図形を塗る。shade: 右端に影・左端にハイライト / line: 下にある色との境目に線
function fbFill(g, m, col, o = {}) {
  const mk = new Uint8Array(FB_W * FB_H);
  for (let y = 0; y < FB_H; y++) for (let x = 0; x < FB_W; x++) if (m(x, y)) mk[y * FB_W + x] = 1;
  const at = (x, y) => x >= 0 && y >= 0 && x < FB_W && y < FB_H && mk[y * FB_W + x];
  const dk = U.shade(col, -0.2), lt = U.shade(col, 0.22), ln = o.lineCol || U.shade(col, -0.55);
  for (let y = 0; y < FB_H; y++) for (let x = 0; x < FB_W; x++) {
    const i = y * FB_W + x;
    if (!mk[i]) continue;
    let c = col;
    if (o.shade !== false) {
      if (!at(x + 1, y) || !at(x + 2, y) || !at(x, y + 1)) c = dk;
      else if (!at(x - 1, y) || !at(x, y - 1)) c = lt;
    }
    const edge = !at(x - 1, y) || !at(x + 1, y) || !at(x, y - 1) || !at(x, y + 1);
    if (edge && o.line !== false && g.c[i] && g.c[i] !== col) c = ln;
    g.c[i] = c;
  }
}
// 細い線 (1px)
function fbLine(g, x0, y0, x1, y1, col) {
  const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0), 1);
  for (let k = 0; k <= n; k++) { const x = Math.round(x0 + (x1 - x0) * k / n), y = Math.round(y0 + (y1 - y0) * k / n); if (x >= 0 && y >= 0 && x < FB_W && y < FB_H) g.c[y * FB_W + x] = col; }
}
function fbDot(g, x, y, col) { if (x >= 0 && y >= 0 && x < FB_W && y < FB_H) g.c[y * FB_W + x] = col; }

const SKIN = '#fde3cf';
// よく使う衣装パーツ
const FBP = {
  skirt: (y0, y1, fl, top = 24) => FBM.poly([[top, y0], [64 - top, y0], [64 - top + fl, y1], [top - fl, y1]]),
  sleeve: (y1) => FBM.and(FB_BODY.arm, FBM.band(0, y1)),
  socks: (y0) => FBM.and(FB_BODY.leg, FBM.band(y0, 128)),
  shoes: (g, col) => fbFill(g, FBM.or(FB_BODY.foot, FBM.and(FB_BODY.leg, FBM.band(113, 128))), col),
  frill(g, y, x0, x1, col) { for (let x = Math.ceil(x0); x < x1; x++) { fbDot(g, x, y, col); if (x % 2) fbDot(g, x, y + 1, col); } },
};

// 衣装ごとの描き方。L = look, C = 服の色, A = 飾りの色
const FB_OUTFITS = {
  default(g, L) {
    const C = L.cloth;
    FBP.shoes(g, '#6a3c22');
    fbFill(g, FBM.and(FB_BODY.leg, FBM.band(98, 128)), '#7a4a2c');
    fbFill(g, FBM.or(FBM.and(FB_BODY.torso, FBM.band(26, 52)), FBP.sleeve(40)), C);
    fbFill(g, FBP.skirt(49, 80, 6), U.shade(C, -0.12));
    fbFill(g, FBM.rect(24, 48, 40, 51), L.acc);
    fbFill(g, FBM.sym([[27, 26], [32, 26], [32, 33]]), '#ffffff', { shade: false });
    fbFill(g, FBM.ell(32, 32, 2, 2), L.acc);
    FBP.frill(g, 79, 18, 46, '#ffffff');
  },
  uniform(g, L) {
    const N = L.collar || '#2a3a6a';
    FBP.shoes(g, '#4a2c1c');
    fbFill(g, FBP.socks(92), '#ffffff');
    fbFill(g, FBM.or(FBM.and(FB_BODY.torso, FBM.band(26, 53)), FBP.sleeve(57)), '#f4f4fa');
    fbFill(g, FBM.and(FB_BODY.arm, FBM.band(53, 57)), N);
    fbFill(g, FBP.skirt(49, 77, 5), N);
    for (let x = 21; x < 44; x += 3) fbLine(g, x, 53, x + (x - 32) / 6, 75, U.shade(N, -0.4));
    fbFill(g, FBM.sym([[22, 27], [32, 27], [32, 41], [24, 33]]), N);
    fbFill(g, FBM.or(FBM.ell(29.5, 38, 3, 2), FBM.ell(34.5, 38, 3, 2), FBM.poly([[31, 39], [33, 39], [35, 46], [29, 46]])), '#e43b44');
  },
  yukata(g, L) {
    const C = L.cloth, A = L.acc;
    fbFill(g, FB_BODY.foot, '#8a5a32');
    const robe = FBM.sym([[32, 26], [24, 27], [20, 30], [21, 60], [22, 117], [32, 117]]);
    fbFill(g, robe, C);
    fbFill(g, FBM.both(FBM.poly([[20, 29], [15, 32], [12, 58], [20, 58], [22, 40]])), C);
    for (let y = 30; y < 116; y += 7) for (let x = 14 + (y % 14 ? 3 : 0); x < 50; x += 7) if (robe(x, y) || FBM.both(FBM.poly([[20, 29], [15, 32], [12, 58], [20, 58], [22, 40]]))(x, y)) { fbDot(g, x, y, A); fbDot(g, x + 1, y, A); fbDot(g, x, y + 1, A); }
    fbLine(g, 28, 26, 34, 42, '#ffffff'); fbLine(g, 36, 26, 32, 36, '#ffffff');
    fbFill(g, FBM.rect(21, 43, 43, 51), A);
    fbFill(g, FBM.poly([[36, 44], [44, 40], [46, 50], [38, 50]]), A);
    fbLine(g, 32, 51, 33, 116, U.shade(C, -0.45));
    fbFill(g, FBM.and(FB_BODY.hand), SKIN);
  },
  swim(g, L) {
    const C = L.cloth;
    fbFill(g, FBM.or(FBM.ell(28, 36, 4.2, 3.2), FBM.ell(36, 36, 4.2, 3.2)), C);
    fbLine(g, 27, 33, 29, 26, C); fbLine(g, 37, 33, 35, 26, C);
    fbFill(g, FBM.poly([[23.5, 55], [40.5, 55], [38, 61], [32, 64], [26, 61]]), C);
  },
  bikini(g, L) {
    const C = L.cloth;
    fbFill(g, FBM.or(FBM.poly([[24, 38], [31, 38], [30, 32]]), FBM.poly([[33, 38], [40, 38], [34, 32]])), C);
    fbLine(g, 30, 32, 31, 26, C); fbLine(g, 34, 32, 33, 26, C); fbLine(g, 24, 38, 21, 37, C); fbLine(g, 40, 38, 43, 37, C);
    fbFill(g, FBM.poly([[24, 56], [40, 56], [37, 61], [32, 63], [27, 61]]), C);
    fbFill(g, FBM.poly([[22, 56], [30, 58], [26, 84], [18, 80]]), U.shade(L.acc, 0.2));
    fbFill(g, FBM.ell(25, 57, 2.5, 2), U.shade(L.acc, 0.2));
    fbFill(g, FB_BODY.foot, '#c89060');
  },
  maid(g, L) {
    const C = L.cloth || '#2a2a3e';
    FBP.shoes(g, '#1a1420');
    fbFill(g, FBP.socks(90), '#ffffff');
    fbFill(g, FBM.or(FBM.and(FB_BODY.torso, FBM.band(26, 52)), FBP.sleeve(54)), C);
    fbFill(g, FBM.or(FBM.ell(18, 33, 4, 4), FBM.ell(46, 33, 4, 4)), C);
    fbFill(g, FBM.and(FB_BODY.arm, FBM.band(52, 55)), '#ffffff');
    fbFill(g, FBP.skirt(49, 84, 8), C);
    FBP.frill(g, 84, 16, 48, '#ffffff');
    fbFill(g, FBM.or(FBM.rect(27, 32, 37, 46), FBM.poly([[26, 46], [38, 46], [40, 80], [24, 80]])), '#ffffff');
    FBP.frill(g, 80, 24, 40, '#e8e8f0');
    fbFill(g, FBM.sym([[27, 26], [32, 26], [32, 31]]), '#ffffff', { shade: false });
    fbFill(g, FBM.or(FBM.ell(30, 30, 2, 1.5), FBM.ell(34, 30, 2, 1.5)), '#e43b44');
  },
  dress(g, L) {
    const C = L.cloth;
    fbFill(g, FBM.and(FB_BODY.torso, FBM.band(34, 52)), C);
    fbFill(g, FBP.skirt(49, 122, 14), C);
    for (let x = 22; x < 44; x += 5) fbLine(g, x, 54, x + (x - 32) * 0.6, 120, U.shade(C, -0.3));
    FBP.frill(g, 121, 10, 54, '#ffffff');
    FBP.frill(g, 34, 22, 42, '#ffffff');
    for (let x = 28; x <= 36; x++) fbDot(g, x, 29 + Math.round(Math.abs(x - 32) * -0.4 + 1.6), '#f5c542');
    fbFill(g, FBM.ell(32, 32, 1.6, 1.6), '#f5c542', { shade: false });
    fbFill(g, FBM.and(FB_BODY.arm, FBM.band(44, 60)), '#ffffff');
  },
  gala(g, L) {
    const C = '#f4f0ff';
    fbFill(g, FBM.and(FB_BODY.torso, FBM.band(34, 52)), C);
    fbFill(g, FBP.skirt(49, 122, 16), C);
    for (let x = 22; x < 44; x += 4) fbLine(g, x, 54, x + (x - 32) * 0.7, 120, '#d8d0f0');
    fbFill(g, FBM.rect(23, 48, 41, 52), '#f5c542');
    fbFill(g, FBM.poly([[38, 48], [46, 44], [46, 56], [39, 52]]), '#f5c542');
    FBP.frill(g, 121, 8, 56, '#f5c542');
    FBP.frill(g, 34, 22, 42, '#f5c542');
    fbFill(g, FBM.ell(32, 31, 1.6, 1.6), '#7fe8ff', { shade: false });
    for (const [x, y] of [[20, 70], [40, 64], [28, 90], [44, 100], [16, 108], [34, 112], [24, 60], [48, 84]]) { fbDot(g, x, y, '#ffe66d'); fbDot(g, x - 1, y, '#fff7c0'); fbDot(g, x + 1, y, '#fff7c0'); fbDot(g, x, y - 1, '#fff7c0'); fbDot(g, x, y + 1, '#fff7c0'); }
    fbFill(g, FBM.and(FB_BODY.arm, FBM.band(44, 60)), '#ffffff');
  },
  bunny(g, L) {
    const C = L.cloth || '#1e1a2a';
    fbFill(g, FBM.and(FB_BODY.leg, FBM.band(57, 128)), '#5a4652');
    FBP.shoes(g, '#1a1420');
    fbFill(g, FBM.sym([[25, 37], [32, 36], [32, 66], [28, 62], [22, 60], [25, 50], [24, 40]]), C);
    fbFill(g, FBM.rect(28, 25, 37, 28), '#ffffff');
    fbFill(g, FBM.or(FBM.ell(30, 28.5, 2, 1.5), FBM.ell(34, 28.5, 2, 1.5)), '#e43b44');
    fbFill(g, FBM.and(FB_BODY.arm, FBM.band(53, 57)), '#ffffff');
    fbFill(g, FBM.ell(42, 58, 2.6, 2.6), '#ffffff');
  },
  slitdress(g, L) {
    const C = L.cloth || '#8a1a3a';
    fbFill(g, FB_BODY.foot, '#1a1420');
    const skirt = FBM.and(FBP.skirt(49, 122, 12), FBM.not(FBM.poly([[34, 86], [41, 86], [46, 122], [34, 122]])));
    fbFill(g, FBM.or(FBM.sym([[23, 33], [29, 33], [32, 44], [32, 52], [24, 52]]), skirt), C);
    for (let x = 23; x < 34; x += 4) fbLine(g, x, 56, x + (x - 32) * 0.5, 120, U.shade(C, -0.35));
    for (let x = 28; x <= 36; x++) fbDot(g, x, 29 + Math.round(Math.abs(x - 32) * -0.4 + 1.6), '#f5c542');
    fbFill(g, FBM.ell(32, 32, 1.4, 1.6), '#e43b44', { shade: false });
    fbFill(g, FBM.and(FB_BODY.arm, FBM.band(42, 60)), '#2a1a24');
  },
};

// 後ろ髪 (体より奥)
function fbHairBack(g, L) {
  const H = L.hair;
  let m = null;
  if (L.style === 'long' || !L.style) m = FBM.sym([[32, 10], [17, 10], [15, 40], [18, 68], [24, 72], [32, 70]]);
  if (L.style === 'twin') m = FBM.both(FBM.poly([[12, 10], [19, 10], [18, 30], [16, 55], [12, 68], [8, 55], [9, 30]]));
  if (L.style === 'pony') m = FBM.poly([[44, 6], [50, 8], [53, 30], [50, 54], [46, 60], [46, 30]]);
  if (!m) return;
  fbFill(g, m, H);
  const dk = U.shade(H, -0.28);
  for (let y = 18; y < 70; y++) for (let x = 0; x < FB_W; x++) if (m(x, y) && m(x - 2, y) && m(x + 2, y) && (x + Math.floor(y / 9)) % 6 === 0) fbDot(g, x, y, dk);
}

const FB_CACHE = {};
function fullBody(look) {
  const key = 'fb' + JSON.stringify(look);
  if (FB_CACHE[key]) return FB_CACHE[key];
  const g = fbGrid();
  fbHairBack(g, look);
  fbFill(g, FB_BODY.all, SKIN, { line: true, lineCol: '#d89a80' });
  fbFill(g, FB_BODY.hand, SKIN);
  (FB_OUTFITS[look.outfit] || FB_OUTFITS.default)(g, look);
  // 外側のアウトライン
  const c = mkCanvas(FB_W, FB_H), x = c.getContext('2d');
  const img = x.createImageData(FB_W, FB_H), d = img.data;
  const hex = h => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
  for (let i = 0; i < FB_W * FB_H; i++) {
    let col = g.c[i];
    if (!col) {
      const px = i % FB_W, py = (i / FB_W) | 0;
      if ([[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => { const nx = px + dx, ny = py + dy; return nx >= 0 && ny >= 0 && nx < FB_W && ny < FB_H && g.c[ny * FB_W + nx]; })) col = OUT;
    }
    if (!col) continue;
    const [r, gg, b] = hex(col.length === 4 ? '#' + col[1] + col[1] + col[2] + col[2] + col[3] + col[3] : col);
    d[i * 4] = r; d[i * 4 + 1] = gg; d[i * 4 + 2] = b; d[i * 4 + 3] = 255;
  }
  x.putImageData(img, 0, 0);
  // 頭 (立ち絵の上27行)
  x.drawImage(portrait(look), 0, 0, 32, 27, 16, 0, 32, 27);
  return (FB_CACHE[key] = c);
}
const FB_URL = {};
function fullBodyURL(look) { const k = JSON.stringify(look); return FB_URL[k] || (FB_URL[k] = fullBody(look).toDataURL()); }
