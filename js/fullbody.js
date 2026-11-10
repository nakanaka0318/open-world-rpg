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

// 体のパーツ (細め・小柄。肩はなで肩、腕と脚は細く先に向かって細くなる)
const FB_BODY = {
  neck: FBM.rect(30, 22, 34, 29),
  torso: FBM.sym([[32, 26], [28.5, 27], [25.6, 29], [24.8, 31.5], [26.2, 38], [27.4, 46], [26.2, 52], [25, 57.5], [32, 58.5]]),
  arm: FBM.both(FBM.poly([[25.3, 29], [27, 31.5], [25.6, 44], [24.6, 55], [22, 55], [22.6, 44], [23.6, 31]])),
  hand: FBM.both(FBM.ell(23.3, 56.8, 1.9, 2.3)),
  leg: FBM.both(FBM.poly([[25.6, 55], [31.6, 55], [31.1, 75], [30.5, 91], [30.1, 106], [27.9, 106], [27.1, 91], [26.3, 75]])),
  foot: FBM.both(FBM.poly([[27.6, 104.5], [30.6, 104.5], [31, 109.5], [26.8, 109.5]])),
};
FB_BODY.all = FBM.or(FB_BODY.neck, FB_BODY.torso, FB_BODY.arm, FB_BODY.hand, FB_BODY.leg, FB_BODY.foot);

function fbGrid() { return { c: new Array(FB_W * FB_H).fill(null) }; }
// 図形を塗る。shade: 右端に影・左端にハイライト / line: 下にある色との境目に線
function fbFill(g, m, col, o = {}) {
  const mk = new Uint8Array(FB_W * FB_H);
  for (let y = 0; y < FB_H; y++) for (let x = 0; x < FB_W; x++) if (m(x, y)) mk[y * FB_W + x] = 1;
  const at = (x, y) => x >= 0 && y >= 0 && x < FB_W && y < FB_H && mk[y * FB_W + x];
  const dk = U.shade(col, -0.16), lt = U.shade(col, 0.22), ln = o.lineCol || U.shade(col, -0.36);
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
  skirt: (y0, y1, fl, top = 26.5) => FBM.poly([[top, y0], [64 - top, y0], [64 - top + fl, y1], [top - fl, y1]]),
  sleeve: (y1) => FBM.and(FB_BODY.arm, FBM.band(0, y1)),
  socks: (y0) => FBM.and(FB_BODY.leg, FBM.band(y0, 128)),
  shoes: (g, col) => fbFill(g, FBM.or(FB_BODY.foot, FBM.and(FB_BODY.leg, FBM.band(103, 128))), col),
  frill(g, y, x0, x1, col) { for (let x = Math.ceil(x0); x < x1; x++) { fbDot(g, x, y, col); if (x % 2) fbDot(g, x, y + 1, col); } },
  necklace(g) { for (let x = 29; x <= 35; x++) fbDot(g, x, 28 + Math.round(1.6 - Math.abs(x - 32) * 0.4), '#f5c542'); },
};
const FB_SLEEVE_YUKATA = FBM.both(FBM.poly([[25, 29], [21.5, 32], [19.5, 52], [25, 52], [26, 38]]));

// 衣装ごとの描き方。L = look (cloth: 服の色, acc: 飾りの色, collar: 襟の色)
const FB_OUTFITS = {
  default(g, L) {
    const C = L.cloth;
    FBP.shoes(g, '#6a3c22');
    fbFill(g, FBM.and(FB_BODY.leg, FBM.band(92, 128)), '#7a4a2c');
    fbFill(g, FBM.or(FBM.and(FB_BODY.torso, FBM.band(26, 48)), FBP.sleeve(37)), C);
    fbFill(g, FBP.skirt(45, 72, 6), U.shade(C, -0.1));
    fbFill(g, FBM.rect(27, 44, 37, 46.5), L.acc);
    fbFill(g, FBM.sym([[29, 26], [32, 26], [32, 31]]), '#ffffff', { shade: false });
    fbFill(g, FBM.ell(32, 31, 1.5, 1.5), L.acc, { shade: false });
    FBP.frill(g, 71, 20, 44, '#ffffff');
  },
  uniform(g, L) {
    const N = L.collar || '#2a3a6a';
    FBP.shoes(g, '#4a2c1c');
    fbFill(g, FBP.socks(84), '#ffffff');
    fbFill(g, FBM.or(FBM.and(FB_BODY.torso, FBM.band(26, 49)), FBP.sleeve(53)), '#f4f4fa');
    fbFill(g, FBM.and(FB_BODY.arm, FBM.band(51, 54)), N);
    fbFill(g, FBP.skirt(45, 69, 5), N);
    for (let x = 24; x < 41; x += 3) fbLine(g, x, 48, Math.round(x + (x - 32) / 5), 67, U.shade(N, -0.35));
    fbFill(g, FBM.sym([[25.4, 27.5], [32, 27], [32, 38], [26.5, 32.5]]), N);
    fbFill(g, FBM.or(FBM.ell(30.3, 35.5, 2, 1.4), FBM.ell(33.7, 35.5, 2, 1.4), FBM.poly([[31.3, 36], [32.7, 36], [34, 42], [30, 42]])), '#e43b44');
  },
  yukata(g, L) {
    const C = L.cloth, A = L.acc;
    fbFill(g, FB_BODY.foot, '#8a5a32');
    const robe = FBM.sym([[32, 26], [28.5, 27], [24.8, 30], [25.6, 56], [26, 105.5], [32, 105.5]]);
    fbFill(g, FBM.or(robe, FB_SLEEVE_YUKATA), C);
    for (let y = 30; y < 104; y += 6) for (let x = 18 + (y % 12 ? 3 : 0); x < 47; x += 6) if (robe(x, y) || FB_SLEEVE_YUKATA(x, y)) { fbDot(g, x, y, A); fbDot(g, x + 1, y, A); fbDot(g, x, y + 1, A); }
    fbLine(g, 29, 26, 34, 39, '#ffffff'); fbLine(g, 35, 26, 32, 33, '#ffffff');
    fbFill(g, FBM.rect(25.5, 42, 38.5, 48), A);
    fbFill(g, FBM.poly([[36, 42], [42, 39], [43, 47], [37, 47]]), A);
    fbLine(g, 32, 48, 32, 104, U.shade(C, -0.35));
    fbFill(g, FB_BODY.hand, SKIN);
  },
  swim(g, L) {
    const C = L.cloth;
    fbFill(g, FBM.or(FBM.ell(29.6, 34.5, 2.8, 2.2), FBM.ell(34.4, 34.5, 2.8, 2.2)), C);
    fbLine(g, 29, 32, 30, 26, C); fbLine(g, 35, 32, 34, 26, C);
    fbFill(g, FBM.poly([[25.8, 53], [38.2, 53], [36.5, 57.5], [32, 59.5], [27.5, 57.5]]), C);
  },
  bikini(g, L) {
    const C = L.cloth, P = U.shade(L.acc, 0.2);
    fbFill(g, FBM.or(FBM.poly([[26.2, 36.5], [31.3, 36.5], [30.4, 32]]), FBM.poly([[32.7, 36.5], [37.8, 36.5], [33.6, 32]])), C);
    fbLine(g, 30, 32, 31, 26, C); fbLine(g, 34, 32, 33, 26, C);
    fbFill(g, FBM.poly([[26, 54], [38, 54], [36, 57.5], [32, 59.5], [28, 57.5]]), C);
    fbFill(g, FBM.poly([[25, 54], [31, 55.5], [28.5, 77], [21.5, 74]]), P);
    fbFill(g, FBM.ell(26.5, 54.8, 2, 1.5), P);
    fbFill(g, FB_BODY.foot, '#c89060');
  },
  maid(g, L) {
    const C = L.cloth || '#2a2a3e';
    FBP.shoes(g, '#1a1420');
    fbFill(g, FBP.socks(84), '#ffffff');
    fbFill(g, FBM.or(FBM.and(FB_BODY.torso, FBM.band(26, 48)), FBP.sleeve(52), FBM.ell(24.6, 31, 2.8, 3), FBM.ell(39.4, 31, 2.8, 3)), C);
    fbFill(g, FBM.and(FB_BODY.arm, FBM.band(50, 53)), '#ffffff');
    fbFill(g, FBP.skirt(45, 75, 7), C);
    FBP.frill(g, 75, 18, 46, '#ffffff');
    fbFill(g, FBM.or(FBM.rect(28.5, 31, 35.5, 43), FBM.poly([[27.5, 43], [36.5, 43], [38, 71], [26, 71]])), '#ffffff');
    FBP.frill(g, 71, 26, 38, '#e8e8f0');
    fbFill(g, FBM.sym([[29, 26], [32, 26], [32, 30]]), '#ffffff', { shade: false });
    fbFill(g, FBM.or(FBM.ell(30.6, 29.5, 1.6, 1.2), FBM.ell(33.4, 29.5, 1.6, 1.2)), '#e43b44', { shade: false });
  },
  dress(g, L) {
    const C = L.cloth;
    fbFill(g, FBM.and(FB_BODY.torso, FBM.band(33, 48)), C);
    fbFill(g, FBP.skirt(45, 110, 12), C);
    for (let x = 24; x < 41; x += 4) fbLine(g, x, 50, Math.round(x + (x - 32) * 0.7), 108, U.shade(C, -0.22));
    FBP.frill(g, 109, 13, 51, '#ffffff');
    FBP.frill(g, 33, 25, 39, '#ffffff');
    FBP.necklace(g);
    fbFill(g, FBM.ell(32, 31, 1.3, 1.4), '#f5c542', { shade: false });
    fbFill(g, FBM.and(FB_BODY.arm, FBM.band(42, 60)), '#ffffff');
  },
  gala(g, L) {
    const C = '#f4f0ff';
    fbFill(g, FBM.and(FB_BODY.torso, FBM.band(33, 48)), C);
    fbFill(g, FBP.skirt(45, 110, 14), C);
    for (let x = 24; x < 41; x += 3) fbLine(g, x, 50, Math.round(x + (x - 32) * 0.8), 108, '#ddd6f2');
    fbFill(g, FBM.rect(26.5, 44, 37.5, 47), '#f5c542');
    fbFill(g, FBM.poly([[36, 44], [42, 41], [42, 50], [37, 47]]), '#f5c542');
    FBP.frill(g, 109, 11, 53, '#f5c542');
    FBP.frill(g, 33, 25, 39, '#f5c542');
    fbFill(g, FBM.ell(32, 31, 1.3, 1.4), '#7fe8ff', { shade: false });
    for (const [x, y] of [[22, 66], [40, 60], [29, 84], [43, 92], [19, 100], [34, 102], [26, 56], [46, 78]]) { fbDot(g, x, y, '#ffe66d'); for (const [a, b] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) fbDot(g, x + a, y + b, '#fff7c0'); }
    fbFill(g, FBM.and(FB_BODY.arm, FBM.band(42, 60)), '#ffffff');
  },
  bunny(g, L) {
    const C = L.cloth || '#1e1a2a';
    fbFill(g, FBM.and(FB_BODY.leg, FBM.band(54, 128)), '#6a5462');
    FBP.shoes(g, '#1a1420');
    fbFill(g, FBM.sym([[26.4, 35.5], [32, 35], [32, 60], [29, 57], [25.2, 55], [27.2, 47], [26.2, 39]]), C);
    fbFill(g, FBM.rect(29.5, 25, 34.5, 27.5), '#ffffff', { shade: false });
    fbFill(g, FBM.or(FBM.ell(30.6, 28.3, 1.6, 1.2), FBM.ell(33.4, 28.3, 1.6, 1.2)), '#e43b44', { shade: false });
    fbFill(g, FBM.and(FB_BODY.arm, FBM.band(50, 53)), '#ffffff');
    fbFill(g, FBM.ell(38.6, 54, 2, 2), '#ffffff');
  },
  slitdress(g, L) {
    const C = L.cloth || '#8a1a3a';
    fbFill(g, FB_BODY.foot, '#1a1420');
    const skirt = FBM.and(FBP.skirt(45, 110, 10), FBM.not(FBM.and(FB_BODY.leg, FBM.poly([[33, 80], [38, 80], [40, 110], [33, 110]]))));
    fbFill(g, FBM.or(FBM.sym([[25, 33], [29.4, 33], [32, 41], [32, 48], [26.6, 48]]), skirt), C);
    for (let x = 24; x < 33; x += 4) fbLine(g, x, 52, Math.round(x + (x - 32) * 0.5), 108, U.shade(C, -0.28));
    FBP.necklace(g);
    fbFill(g, FBM.ell(32, 31, 1.2, 1.4), '#e43b44', { shade: false });
    fbFill(g, FBM.and(FB_BODY.arm, FBM.band(40, 60)), '#2a1a24');
  },
};

// 後ろ髪 (体より奥)
function fbHairBack(g, L) {
  const H = L.hair;
  let m = null;
  if (L.style === 'long' || !L.style) m = FBM.sym([[32, 10], [19, 10], [18, 36], [20.5, 56], [24.5, 60], [32, 58]]);
  if (L.style === 'twin') m = FBM.both(FBM.poly([[13, 10], [19, 10], [18.5, 30], [17, 50], [14, 60], [10.5, 50], [10.5, 30]]));
  if (L.style === 'pony') m = FBM.poly([[44, 6], [49.5, 8], [51.5, 28], [49, 46], [46, 52], [46, 28]]);
  if (!m) return;
  fbFill(g, m, H);
  const dk = U.shade(H, -0.28);
  for (let y = 18; y < 64; y++) for (let x = 0; x < FB_W; x++) if (m(x, y) && m(x - 2, y) && m(x + 2, y) && (x + Math.floor(y / 9)) % 6 === 0) fbDot(g, x, y, dk);
}

const FB_CACHE = {};
function fullBody(look) {
  const key = 'fb' + JSON.stringify(look);
  if (FB_CACHE[key]) return FB_CACHE[key];
  const g = fbGrid();
  fbHairBack(g, look);
  fbFill(g, FB_BODY.all, SKIN, { line: true, lineCol: '#e4ae96' });
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
  x.putImageData(img, 0, 8);
  // 頭 (立ち絵の上27行)
  x.drawImage(portrait(look), 0, 0, 32, 27, 16, 8, 32, 27);
  return (FB_CACHE[key] = c);
}
const FB_URL = {};
function fullBodyURL(look) { const k = JSON.stringify(look); return FB_URL[k] || (FB_URL[k] = fullBody(look).toDataURL()); }
