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

// 体のパーツ。大人(ADULT_AGE)はくびれと腰のラインがある体型、それ以外は細身の体型。
const FB_BODIES = {
  young: {
    torso: FBM.sym([[32, 26], [28.6, 27], [25.8, 29], [25.2, 31.5], [26.2, 38], [27.2, 45], [26.4, 51], [25.6, 57], [32, 58]]),
    arm: FBM.both(FBM.poly([[25.4, 29], [27, 31.5], [25.8, 44], [24.8, 55], [22.3, 55], [22.8, 44], [23.8, 31]])),
    hand: FBM.both(FBM.ell(23.5, 56.6, 1.8, 2.2)),
    leg: FBM.both(FBM.poly([[26, 55], [31.6, 55], [31.1, 75], [30.6, 90], [30.2, 104.5], [28, 104.5], [27.3, 90], [26.7, 75]])),
    hip: 25.5, waist: 27.2,
  },
  adult: {
    torso: FBM.sym([[32, 26], [28.4, 27], [25.4, 29], [24.6, 31.5], [24.5, 35], [25.6, 38.5], [27.6, 44], [27.2, 47.5], [25.2, 52], [24.6, 56.5], [32, 58]]),
    arm: FBM.both(FBM.poly([[25, 29], [26.6, 31.5], [25.8, 38], [24.8, 44], [23.6, 55], [21, 55], [21.6, 44], [22.6, 38], [23.2, 31]])),
    hand: FBM.both(FBM.ell(22.3, 56.6, 1.8, 2.2)),
    leg: FBM.both(FBM.poly([[24.8, 55], [31.6, 55], [31.4, 66], [30.9, 79], [31.2, 86], [30.4, 104.5], [28.2, 104.5], [27.4, 95], [26.8, 86], [27.3, 79], [26.2, 68]])),
    hip: 24.3, waist: 27.6,
  },
};
for (const k in FB_BODIES) {
  const B = FB_BODIES[k];
  B.neck = FBM.rect(30, 22, 34, 29);
  B.foot = FBM.both(FBM.poly([[27.6, 103.5], [30.6, 103.5], [31, 108.5], [26.8, 108.5]]));
  B.all = FBM.or(B.neck, B.torso, B.arm, B.hand, B.leg, B.foot);
}

function fbMix(a, b, t) {
  const p = h => [1, 3, 5].map(k => parseInt(h.slice(k, k + 2), 16));
  const A = p(a.length === 4 ? '#' + a[1] + a[1] + a[2] + a[2] + a[3] + a[3] : a), Bc = p(b);
  return '#' + A.map((v, k) => Math.round(v + (Bc[k] - v) * t).toString(16).padStart(2, '0')).join('');
}
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
    if (o.alpha && g.c[i]) { g.c[i] = fbMix(g.c[i], c, o.alpha); continue; }
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
// ---- 衣装パーツ (B = 体, K = 色やキャラ情報) ----
const WHITE = '#ffffff', GOLD = '#f5c542', BLACK = '#1e1a28', BROWN = '#6a3c22';
const FBP = {
  // 腰から広がるスカート (腰のラインに沿う)
  skirt: (B, y0, y1, fl) => FBM.sym([[32, y0], [B.waist - 0.2, y0], [B.hip - 0.4, 52], [B.hip - 0.4 - fl, y1], [32, y1]]),
  top: (g, B, col, y0 = 26, y1 = 48, sleeveY = 0) => fbFill(g, FBM.or(FBM.and(B.torso, FBM.band(y0, y1)), sleeveY ? FBM.and(B.arm, FBM.band(0, sleeveY)) : () => false), col),
  sleeve: (g, B, col, y0, y1) => fbFill(g, FBM.and(B.arm, FBM.band(y0, y1)), col),
  legs: (g, B, col, y0, y1 = 128) => fbFill(g, FBM.and(B.leg, FBM.band(y0, y1)), col),
  shoes: (g, B, col, y0 = 102) => fbFill(g, FBM.or(B.foot, FBM.and(B.leg, FBM.band(y0, 128))), col),
  frill(g, y, x0, x1, col) { for (let x = Math.ceil(x0); x < x1; x++) { fbDot(g, x, y, col); if (x % 2) fbDot(g, x, y + 1, col); } },
  necklace(g, col = GOLD) { for (let x = 29; x <= 35; x++) fbDot(g, x, 28 + Math.round(1.6 - Math.abs(x - 32) * 0.4), col); },
  pleats(g, x0, x1, y0, y1, col, step = 3) { for (let x = x0; x < x1; x += step) fbLine(g, x, y0, Math.round(x + (x - 32) * 0.35), y1, col); },
  belt: (g, B, col, y = 44, h = 2.5) => fbFill(g, FBM.and(B.torso, FBM.band(y, y + h)), col),
  bow: (g, cx, cy, col, s = 1) => fbFill(g, FBM.or(FBM.ell(cx - 1.6 * s, cy, 1.7 * s, 1.2 * s), FBM.ell(cx + 1.6 * s, cy, 1.7 * s, 1.2 * s)), col, { shade: false }),
  collar: (g, col = WHITE) => fbFill(g, FBM.sym([[29, 26], [32, 26], [32, 31]]), col, { shade: false }),
  // 背中側 (体より先に描く): マント・しっぽ・翼
  cape: (g, col, y1, w = 19) => fbFill(g, FBM.sym([[32, 27], [26, 27.5], [23, 31], [w, y1], [32, y1]]), col),
};
// 柄 (属性ごと)
const FB_MOTIF = {
  fire: (g, x, y, c) => { fbDot(g, x, y, c); fbDot(g, x - 1, y + 1, c); fbDot(g, x + 1, y + 1, c); fbDot(g, x, y + 2, c); },
  water: (g, x, y, c) => { fbDot(g, x - 1, y + 1, c); fbDot(g, x, y, c); fbDot(g, x + 1, y, c); fbDot(g, x + 2, y + 1, c); },
  wind: (g, x, y, c) => { fbDot(g, x, y, c); fbDot(g, x + 1, y + 1, c); fbDot(g, x + 2, y + 1, c); },
  earth: (g, x, y, c) => { fbDot(g, x, y, c); fbDot(g, x + 1, y, c); fbDot(g, x, y + 1, c); fbDot(g, x + 1, y + 1, c); },
  light: (g, x, y, c) => { fbDot(g, x, y, c); fbDot(g, x - 1, y, c); fbDot(g, x + 1, y, c); fbDot(g, x, y - 1, c); fbDot(g, x, y + 1, c); },
  dark: (g, x, y, c) => { fbDot(g, x, y, c); fbDot(g, x, y + 1, c); fbDot(g, x + 1, y + 2, c); },
};
function fbPattern(g, mask, K, col, step = 6) {
  const fn = FB_MOTIF[K.elem] || FB_MOTIF.light;
  for (let y = 28; y < 110; y += step) for (let x = 14 + ((y / step) % 2 ? step / 2 : 0); x < 50; x += step) if (mask(x, y) && mask(x, y + 2)) fn(g, x, y, col);
}

// ---- いつもの服 (キャラごとの普段着) ----
const FB_STYLES = {
  adventurer(g, B, K) { // 剣士: チュニック・ベルト・短いマント・ブーツ
    FBP.shoes(g, B, BROWN, 88);
    FBP.top(g, B, K.C, 26, 48, 36);
    fbFill(g, FBP.skirt(B, 44, 68, 4), K.D);
    FBP.belt(g, B, BROWN, 44, 3); fbFill(g, FBM.rect(31, 44, 33, 47), GOLD);
    FBP.collar(g); fbFill(g, FBM.ell(32, 31, 1.4, 1.4), K.A, { shade: false });
    FBP.frill(g, 67, 20, 44, WHITE);
  },
  knight: { back: (g, K) => FBP.cape(g, K.A, 100, 18), front(g, B, K) { // 騎士: 胸当て・長いスカート・すね当て
    FBP.shoes(g, B, '#b8c0d0', 86);
    FBP.top(g, B, K.C, 26, 50, 54);
    fbFill(g, FBP.skirt(B, 44, 92, 6), K.D);
    fbFill(g, FBM.and(B.torso, FBM.band(29, 45)), '#d8dce8');
    fbFill(g, FBM.and(B.arm, FBM.band(28, 34)), '#d8dce8');
    fbLine(g, 32, 31, 32, 43, GOLD); fbLine(g, 29, 36, 35, 36, GOLD);
    FBP.belt(g, B, GOLD, 45, 2);
  } },
  witch: { back: (g, K) => FBP.cape(g, U.shade(K.C, -0.35), 104, 17), front(g, B, K) { // 魔女: 長いローブ
    FBP.shoes(g, B, BLACK);
    FBP.top(g, B, K.C, 26, 48, 55);
    fbFill(g, FBP.skirt(B, 44, 104, 9), K.C);
    FBP.pleats(g, 24, 41, 50, 102, K.D, 4);
    FBP.belt(g, B, K.A, 44, 2);
    fbFill(g, FBM.and(B.arm, FBM.band(51, 55)), K.A);
    FBP.necklace(g); fbFill(g, FBM.ell(32, 31.5, 1.3, 1.5), K.A, { shade: false });
  } },
  miko(g, B, K) { // 巫女: 白い上衣と赤い袴
    FBP.shoes(g, B, WHITE);
    fbFill(g, FBM.or(FBM.and(B.torso, FBM.band(26, 48)), FBM.both(FBM.poly([[25, 29], [21, 32], [19.5, 50], [25.5, 50], [26, 38]]))), WHITE);
    fbFill(g, FBP.skirt(B, 43, 102, 5), '#d8303a');
    FBP.pleats(g, 25, 40, 47, 100, '#a8202a', 4);
    fbLine(g, 29, 26, 33, 38, '#d8303a'); fbLine(g, 35, 26, 32, 33, '#d8303a');
    FBP.bow(g, 32, 44, '#d8303a');
  },
  ranger(g, B, K) { // 弓使い: 短いチュニック・タイツ・ブーツ・矢筒の帯
    FBP.legs(g, B, U.shade(K.C, -0.4), 55);
    FBP.shoes(g, B, BROWN, 84);
    FBP.top(g, B, K.C, 26, 50, 40);
    fbFill(g, FBP.skirt(B, 44, 62, 3), K.C);
    fbLine(g, 26, 29, 37, 47, BROWN); fbLine(g, 27, 29, 38, 47, BROWN);
    FBP.belt(g, B, BROWN, 46, 2);
    for (let y = 31; y < 45; y += 4) fbDot(g, 32, y, K.A);
  },
  princess(g, B, K) { // 姫: 星をちりばめたドレス
    FBP.top(g, B, K.C, 30, 48, 36);
    fbFill(g, FBP.skirt(B, 44, 108, 14), K.C);
    FBP.pleats(g, 24, 41, 50, 106, K.D, 4);
    FBP.frill(g, 30, 25, 39, WHITE); FBP.frill(g, 107, 11, 53, GOLD);
    for (const [x, y] of [[22, 70], [38, 62], [28, 88], [43, 96], [18, 100], [33, 80]]) FB_MOTIF.light(g, x, y, '#ffe66d');
    FBP.necklace(g); FBP.belt(g, B, GOLD, 44, 2);
  },
  priestess(g, B, K) { // 神官: 白いローブと青い縁取り
    FBP.shoes(g, B, WHITE);
    FBP.top(g, B, WHITE, 26, 48, 56);
    fbFill(g, FBP.skirt(B, 44, 104, 7), WHITE);
    fbFill(g, FBM.rect(30.5, 30, 33.5, 104), K.C);
    fbFill(g, FBM.and(B.arm, FBM.band(52, 56)), K.C);
    FBP.belt(g, B, K.C, 44, 2); FBP.frill(g, 103, 14, 50, K.C);
    fbFill(g, FBM.sym([[28, 26], [32, 26], [32, 30]]), K.C, { shade: false });
  },
  mage: { back: (g, K) => FBP.cape(g, K.C, 96, 19), front(g, B, K) { // 魔導士: ファーつきのコート
    FBP.shoes(g, B, BLACK, 90);
    FBP.legs(g, B, BLACK, 70);
    FBP.top(g, B, K.C, 26, 48, 55);
    fbFill(g, FBP.skirt(B, 44, 82, 7), K.C);
    fbFill(g, FBM.rect(31, 30, 33, 82), WHITE);
    fbFill(g, FBM.and(B.arm, FBM.band(51, 55)), WHITE);
    FBP.frill(g, 81, 17, 47, WHITE);
    fbFill(g, FBM.sym([[27, 26.5], [32, 26], [32, 29], [26, 30]]), WHITE);
  } },
  smith(g, B, K) { // 鍛冶屋の娘: 吊りズボンとシャツ
    FBP.shoes(g, B, BROWN, 92);
    FBP.top(g, B, WHITE, 26, 48, 38);
    fbFill(g, FBM.or(FBM.and(B.torso, FBM.band(38, 58)), FBM.and(B.leg, FBM.band(55, 92))), K.C);
    fbLine(g, 28, 28, 28, 38, K.C); fbLine(g, 36, 28, 36, 38, K.C);
    fbFill(g, FBM.rect(28, 38, 36, 44), K.D);
    fbDot(g, 28, 38, GOLD); fbDot(g, 35, 38, GOLD);
  },
  nun(g, B, K) { // シスター: 修道服と白い襟
    FBP.shoes(g, B, BLACK);
    FBP.top(g, B, K.C, 26, 48, 56);
    fbFill(g, FBP.skirt(B, 44, 104, 6), K.C);
    fbFill(g, FBM.sym([[27, 26], [32, 26], [32, 33], [26, 31]]), WHITE);
    fbLine(g, 32, 36, 32, 42, GOLD); fbLine(g, 30, 38, 34, 38, GOLD);
    fbFill(g, FBM.and(B.arm, FBM.band(52, 56)), WHITE);
  },
  ninja(g, B, K) { // くノ一: 短い着物・帯・レッグガード・マフラー
    FBP.legs(g, B, '#2a2a3a', 70);
    FBP.shoes(g, B, '#2a2a3a', 96);
    fbFill(g, FBM.and(B.leg, FBM.band(70, 92)), '#4a4a5a');
    FBP.top(g, B, K.C, 26, 48, 40);
    fbFill(g, FBP.skirt(B, 44, 62, 3), K.C);
    FBP.belt(g, B, K.A, 42, 4);
    fbFill(g, FBM.or(FBM.rect(28, 25, 36, 29), FBM.poly([[34, 27], [41, 26], [44, 44], [39, 44]])), '#d8303a');
    fbLine(g, 29, 29, 33, 40, WHITE);
  },
  student: { back: (g, K) => FBP.cape(g, '#2a2a4a', 72, 20), front(g, B, K) { // 魔法学校: ブラウスとスカートとマント
    FBP.shoes(g, B, BROWN);
    FBP.legs(g, B, '#2a2a4a', 80, 102);
    FBP.top(g, B, WHITE, 26, 48, 54);
    fbFill(g, FBP.skirt(B, 44, 68, 5), K.C);
    FBP.pleats(g, 25, 40, 47, 66, K.D);
    FBP.bow(g, 32, 29, K.A); FBP.belt(g, B, BROWN, 44, 2);
  } },
  thief(g, B, K) { // 盗賊: ベスト・ショートパンツ・スカーフ
    FBP.shoes(g, B, BROWN, 86);
    FBP.top(g, B, WHITE, 26, 46, 36);
    fbFill(g, FBM.and(B.torso, FBM.band(29, 46)), K.C);
    fbFill(g, FBM.rect(30.5, 29, 33.5, 46), WHITE);
    fbFill(g, FBM.or(FBM.and(B.torso, FBM.band(46, 58)), FBM.and(B.leg, FBM.band(55, 64))), BROWN);
    fbFill(g, FBM.rect(28.5, 25, 35.5, 28.5), K.A);
    FBP.belt(g, B, '#3a2414', 46, 2); fbFill(g, FBM.rect(35, 47, 38, 52), K.D);
  },
  fighter(g, B, K) { // 格闘家: チャイナ風の上着とショートパンツ
    FBP.shoes(g, B, BLACK, 100);
    FBP.top(g, B, K.C, 26, 50, 33);
    fbFill(g, FBM.or(FBM.and(B.torso, FBM.band(50, 58)), FBM.and(B.leg, FBM.band(55, 62))), BLACK);
    fbLine(g, 32, 26, 34, 36, GOLD); for (let y = 30; y < 46; y += 4) { fbDot(g, 34, y, GOLD); fbDot(g, 35, y, GOLD); }
    fbFill(g, FBM.and(B.arm, FBM.band(50, 55)), K.A);
    FBP.belt(g, B, K.A, 47, 3);
  },
  bard: { back: (g, K) => FBP.cape(g, K.A, 64, 19), front(g, B, K) { // 吟遊詩人: ポンチョとロングスカート
    FBP.shoes(g, B, BROWN);
    fbFill(g, FBP.skirt(B, 44, 98, 7), K.D);
    FBP.top(g, B, WHITE, 26, 48, 54);
    fbFill(g, FBM.sym([[32, 26], [27, 27], [21, 36], [24, 46], [32, 48]]), K.C);
    for (let x = 22; x < 43; x += 3) fbDot(g, x, 45 - Math.abs(x - 32) * 0.15, K.A);
    FBP.frill(g, 97, 16, 48, K.A);
  } },
  captain: { back: (g, K) => fbFill(g, FBM.sym([[32, 28], [25, 29], [22, 50], [21, 92], [32, 92]]), K.C), front(g, B, K) { // 船長: ロングコート・白シャツ・ブーツ
    FBP.legs(g, B, '#f0e8d8', 55);
    FBP.shoes(g, B, BROWN, 82);
    FBP.top(g, B, WHITE, 26, 58, 0);
    fbFill(g, FBM.or(FBM.and(B.arm, FBM.band(26, 55)), FBM.sym([[25.5, 28], [29, 28], [29.5, 52], [24, 60], [21.5, 92], [26, 92], [28, 58], [26, 30]]), FBM.mirror(FBM.sym([[25.5, 28], [29, 28], [29.5, 52], [24, 60], [21.5, 92], [26, 92], [28, 58], [26, 30]]))), K.C);
    for (let y = 33; y < 52; y += 5) { fbDot(g, 28, y, GOLD); fbDot(g, 36, y, GOLD); }
    fbFill(g, FBM.and(B.arm, FBM.band(50, 55)), GOLD);
    FBP.belt(g, B, BROWN, 47, 2);
  } },
  hoodie(g, B, K) { // ゲーマー: 大きめのパーカー・ショートパンツ・ニーハイ
    FBP.legs(g, B, '#2a2a3a', 70);
    FBP.shoes(g, B, WHITE, 100);
    fbFill(g, FBM.and(B.leg, FBM.band(55, 62)), '#3a3a5a');
    fbFill(g, FBM.or(FBM.and(B.torso, FBM.band(26, 60)), FBM.sym([[32, 52], [B.hip - 0.6, 52], [B.hip - 1, 60], [32, 60]]), FBM.and(B.arm, FBM.band(0, 55))), K.C);
    fbFill(g, FBM.and(B.arm, FBM.band(51, 55)), K.D);
    fbFill(g, FBM.rect(28, 47, 36, 52), K.D);
    fbLine(g, 30, 27, 30, 36, WHITE); fbLine(g, 34, 27, 34, 36, WHITE);
    fbFill(g, FBM.rect(28, 38, 36, 42), K.A);
    fbFill(g, B.hand, SKIN);
  },
  dragon: { back(g, K) { // 竜の子: 翼としっぽ
    fbFill(g, FBM.both(FBM.poly([[25, 31], [12, 22], [14, 30], [10, 34], [15, 38], [12, 44], [24, 40]])), K.A);
    fbFill(g, FBM.poly([[34, 50], [44, 62], [50, 60], [52, 54], [48, 66], [40, 64]]), K.H);
  }, front(g, B, K) {
    FBP.shoes(g, B, BROWN, 96);
    FBP.top(g, B, K.C, 26, 48, 34);
    fbFill(g, FBP.skirt(B, 44, 66, 6), K.C);
    FBP.frill(g, 65, 19, 45, WHITE);
    FBP.belt(g, B, K.A, 44, 2); FBP.bow(g, 32, 30, K.A);
  } },
  cloud(g, B, K) { // 雲の精霊: ふわふわの雲のドレス
    FBP.top(g, B, K.C, 26, 48, 0);
    fbFill(g, FBP.skirt(B, 44, 78, 8), K.C);
    const puff = FBM.or(...[[18, 76], [24, 79], [30, 80], [36, 80], [42, 79], [47, 76], [21, 48], [43, 48], [32, 46]].map(([x, y]) => FBM.ell(x, y, 4.2, 3.2)));
    fbFill(g, puff, WHITE);
    fbFill(g, FBM.or(FBM.ell(24.5, 31, 3, 2.6), FBM.ell(39.5, 31, 3, 2.6)), WHITE);
    FBP.shoes(g, B, '#bfe0ff');
  },
  magician: { back: (g, K) => fbFill(g, FBM.sym([[32, 44], [26, 44], [22, 70], [28, 74], [32, 60]]), BLACK), front(g, B, K) { // 手品師: 燕尾服・ショートパンツ・タイツ
    FBP.legs(g, B, '#4a3a4a', 55);
    FBP.shoes(g, B, BLACK, 100);
    FBP.top(g, B, WHITE, 26, 48, 0);
    fbFill(g, FBM.or(FBM.and(B.arm, FBM.band(26, 55)), FBM.and(B.torso, FBM.band(26, 52)), FBM.and(B.leg, FBM.band(55, 60))), BLACK);
    fbFill(g, FBM.sym([[30, 27], [32, 27], [32, 48], [30.5, 40]]), WHITE);
    FBP.bow(g, 32, 28, '#e43b44'); fbFill(g, FBM.and(B.arm, FBM.band(51, 55)), WHITE);
    fbDot(g, 32, 40, GOLD); fbDot(g, 32, 44, GOLD);
  } },
  gothic: { back: (g, K) => { FBP.cape(g, '#a01830', 100, 15); FBP.cape(g, BLACK, 98, 16.5); }, front(g, B, K) { // 吸血姫: ゴシックドレスと赤い裏地のマント
    FBP.shoes(g, B, BLACK);
    FBP.legs(g, B, BLACK, 80);
    FBP.top(g, B, K.C, 26, 48, 55);
    fbFill(g, FBP.skirt(B, 44, 84, 10), K.C);
    FBP.frill(g, 83, 14, 50, BLACK); FBP.frill(g, 80, 16, 48, '#a01830');
    fbFill(g, FBM.rect(29, 26, 35, 30), BLACK); fbFill(g, FBM.ell(32, 31, 1.6, 1.6), '#e43b44', { shade: false });
    for (let y = 33; y < 44; y += 3) { fbDot(g, 30, y, BLACK); fbDot(g, 33, y, BLACK); }
  } },
  maid: (g, B, K) => FB_OUTFITS.maid(g, B, K),
  sporty(g, B, K) { // 全力少女: ジャケットとミニスカート・スニーカー
    FBP.shoes(g, B, WHITE, 98);
    FBP.legs(g, B, WHITE, 90, 100);
    FBP.top(g, B, WHITE, 26, 48, 0);
    fbFill(g, FBM.or(FBM.sym([[25.5, 28], [29, 28], [29.5, 47], [25.5, 49], [26, 30]]), FBM.mirror(FBM.sym([[25.5, 28], [29, 28], [29.5, 47], [25.5, 49], [26, 30]])), FBM.and(B.arm, FBM.band(26, 55))), K.C);
    fbFill(g, FBM.and(B.arm, FBM.band(51, 55)), WHITE);
    fbFill(g, FBP.skirt(B, 44, 64, 5), K.A);
    FBP.pleats(g, 25, 40, 47, 62, U.shade(K.A, -0.35));
  },
  guardian(g, B, K) { // 守護者: ロングドレスとショール
    FBP.shoes(g, B, BROWN);
    FBP.top(g, B, K.C, 26, 48, 56);
    fbFill(g, FBP.skirt(B, 44, 104, 8), K.C);
    fbFill(g, FBM.sym([[32, 27], [26, 27.5], [22.5, 32], [24, 44], [32, 40]]), K.A);
    FBP.frill(g, 103, 15, 49, WHITE);
    fbFill(g, FBM.ell(32, 38, 1.6, 1.6), GOLD, { shade: false });
  },
  diva(g, B, K) { // 歌姫: マーメイドドレス
    fbFill(g, FBM.or(FBM.and(B.torso, FBM.band(32, 58)), FBM.sym([[32, 44], [B.waist, 44], [B.hip - 0.3, 53], [26.6, 68], [28, 80], [17, 108], [32, 108]])), K.C);
    FBP.frill(g, 32, 25, 39, WHITE); FBP.frill(g, 107, 15, 49, WHITE);
    for (const [x, y] of [[29, 50], [35, 62], [28, 74], [34, 90], [24, 100], [40, 98]]) FB_MOTIF.water(g, x, y, U.shade(K.C, 0.4));
    FBP.necklace(g, '#7fe8ff');
  },
  dancer(g, B, K) { // 踊り子: ボレロ・飾り帯・ふんわりしたロングスカート
    FBP.shoes(g, B, GOLD);
    FBP.top(g, B, K.C, 30, 40, 36);
    fbFill(g, FBP.skirt(B, 46, 104, 12), K.D);
    fbFill(g, FBM.poly([[24, 46], [40, 46], [44, 100], [37, 104], [33, 60]]), K.C);
    FBP.belt(g, B, GOLD, 45, 2);
    for (let x = 24; x < 41; x += 2) fbDot(g, x, 48 + (x % 4 ? 1 : 0), GOLD);
    FBP.necklace(g);
  },
  samurai(g, B, K) { // 侍: 着物と袴
    FBP.shoes(g, B, WHITE);
    fbFill(g, FBM.or(FBM.and(B.torso, FBM.band(26, 48)), FBM.both(FBM.poly([[25, 29], [21.5, 32], [20.5, 48], [25.5, 48], [26, 38]]))), K.C);
    fbPattern(g, FBM.and(B.torso, FBM.band(26, 44)), K, U.shade(K.C, 0.45), 5);
    fbFill(g, FBP.skirt(B, 43, 102, 5), '#3a3a5a');
    FBP.pleats(g, 25, 40, 47, 100, '#24243a', 4);
    fbLine(g, 29, 26, 33, 40, WHITE); fbLine(g, 35, 26, 32, 33, WHITE);
  },
  herbalist(g, B, K) { // 薬師: ワンピースとエプロン
    FBP.shoes(g, B, BROWN);
    FBP.top(g, B, K.C, 26, 48, 36);
    fbFill(g, FBP.skirt(B, 44, 80, 6), K.C);
    fbFill(g, FBM.poly([[27, 44], [37, 44], [38.5, 76], [25.5, 76]]), '#f0ead8');
    fbFill(g, FBM.and(B.torso, FBM.band(44, 46)), '#f0ead8');
    for (const [x, y] of [[29, 54], [35, 60], [30, 68]]) FB_MOTIF.wind(g, x, y, '#5ab84a');
    FBP.collar(g);
  },
  cat: { back: (g, K) => { for (let k = 0; k < 18; k++) { const t = k / 17; fbFill(g, FBM.ell(36 + t * 10, 54 - Math.sin(t * 3) * 10, 1.6, 1.6), BLACK); } }, front(g, B, K) { // 使い魔: 黒いワンピースと鈴
    FBP.shoes(g, B, BLACK);
    FBP.legs(g, B, WHITE, 84, 102);
    FBP.top(g, B, BLACK, 26, 48, 38);
    fbFill(g, FBP.skirt(B, 44, 72, 7), BLACK);
    FBP.frill(g, 71, 18, 46, WHITE);
    fbFill(g, FBM.rect(29, 26, 35, 28.5), '#d8303a'); fbFill(g, FBM.ell(32, 30, 1.6, 1.6), GOLD, { shade: false });
  } },
};
// キャラごとの普段着 (ここにないキャラは adventurer)
const FB_CHAR_STYLE = {
  aria: 'adventurer', seres: 'knight', noa: 'witch', homura: 'miko', sylphy: 'ranger', stella: 'princess', shizuku: 'priestess',
  yuki: 'mage', lily: 'smith', miko: 'nun', kagura: 'ninja', mei: 'student', popo: 'thief', coco: 'fighter', nemu: 'bard',
  pico: 'nun', luka: 'captain', yumeno: 'hoodie', fuuri: 'dragon', mokomo: 'cloud', rapidhat: 'magician', viola: 'gothic',
  aurora: 'witch', kanae: 'maid', lumia: 'sporty', misuzu: 'guardian', marina: 'diva', terra: 'knight', akane: 'dancer',
  lilith: 'nun', tsubaki: 'samurai', sora: 'knight', mint: 'herbalist', chloe: 'cat',
};

// ---- 衣装 (スキン)。同じ衣装でもキャラごとに型や柄が変わる ----
const FB_OUTFITS = {
  uniform(g, B, K) {
    const N = K.L.collar || '#2a3a6a';
    FBP.shoes(g, B, '#4a2c1c');
    FBP.legs(g, B, K.adult ? '#2a2a3a' : WHITE, 84, 102);
    if (K.hash % 2) { // ブレザー
      fbFill(g, FBM.or(FBM.and(B.torso, FBM.band(26, 50)), FBM.and(B.arm, FBM.band(0, 55))), N);
      fbFill(g, FBM.poly([[29.5, 26], [34.5, 26], [32, 38]]), WHITE, { shade: false });
      fbFill(g, FBM.poly([[31.3, 27], [32.7, 27], [33.2, 36], [32, 38], [30.8, 36]]), K.A);
      fbLine(g, 29, 27, 32, 40, U.shade(N, 0.3)); fbLine(g, 35, 27, 32, 40, U.shade(N, 0.3));
      fbDot(g, 30, 44, GOLD); fbDot(g, 30, 47, GOLD);
    } else { // セーラー服
      FBP.top(g, B, '#f4f4fa', 26, 49, 53);
      FBP.sleeve(g, B, N, 51, 54);
      fbFill(g, FBM.sym([[25.4, 27.5], [32, 27], [32, 38], [26.5, 32.5]]), N);
      FBP.bow(g, 32, 35.5, K.A, 1.2);
    }
    fbFill(g, FBP.skirt(B, 44, 68, 5), N);
    FBP.pleats(g, 25, 40, 47, 66, U.shade(N, -0.35));
    for (const y of [52, 60]) fbLine(g, 22, y, 42, y, U.shade(K.A, -0.1));
  },
  yukata(g, B, K) {
    const C = K.L.cloth, A = K.A;
    fbFill(g, B.foot, '#8a5a32');
    const robe = FBM.or(FBM.and(B.torso, FBM.band(26, 58)), FBM.sym([[32, 44], [B.waist, 44], [B.hip - 0.6, 54], [25, 105], [32, 105]]));
    const sl = FBM.both(FBM.poly([[25, 29], [21.5, 32], [19.5, 52], [25, 52], [26, 38]]));
    fbFill(g, FBM.or(robe, sl), C);
    fbPattern(g, FBM.or(robe, sl), K, A, 6);
    fbLine(g, 29, 26, 34, 39, WHITE); fbLine(g, 35, 26, 32, 33, WHITE);
    FBP.belt(g, B, A, 41, 6);
    fbFill(g, FBM.poly([[36, 42], [42, 38], [43, 48], [37, 47]]), A);
    fbLine(g, 35, 48, 37, 104, U.shade(C, -0.35));
    fbFill(g, B.hand, SKIN);
  },
  swim(g, B, K) {
    // 体の内側だけに描く (腕や手にはみ出さない)
    const C = K.L.cloth, T = K.A, inT = m => FBM.and(B.torso, m);
    const v = K.adult ? K.hash % 3 : 1 + K.hash % 2;
    const straps = (y1) => { fbLine(g, 28, 27, 28, y1, C); fbLine(g, 36, 27, 36, y1, C); };
    const dots = (m) => { if (K.hash % 2) for (let y = 34; y < 58; y += 4) for (let x = 25 + (y % 8 ? 2 : 0); x < 40; x += 4) if (m(x, y)) fbDot(g, x, y, WHITE); };
    if (v === 0) { // フリルのビキニ
      const top = inT(FBM.or(FBM.ell(29.3, 34.6, 3, 2.2), FBM.ell(34.7, 34.6, 3, 2.2)));
      const bottom = FBM.sym([[32, 53], [B.hip + 0.2, 53], [B.hip + 1, 55], [30, 58.5], [32, 59]]);
      fbFill(g, FBM.or(top, bottom), C);
      straps(32);
      for (let x = 26; x <= 38; x++) if (B.torso(x, 37)) fbDot(g, x, 37 + (x % 2), WHITE);
      fbDot(g, Math.ceil(B.hip), 53, T); fbDot(g, Math.floor(64 - B.hip), 53, T);
      dots(FBM.or(top, bottom));
    } else if (v === 1) { // ワンピース水着 (年少はミニスカートつき)
      const body = FBM.and(inT(FBM.band(31, 57)), FBM.not(FBM.ell(32, 30.5, 3.2, 2.2)));
      const crotch = FBM.sym([[32, 52], [B.hip + 0.6, 52], [B.hip + 1.4, 54.5], [30.2, 58.5], [32, 59]]);
      fbFill(g, FBM.or(body, crotch), C);
      straps(31);
      if (!K.adult) {
        fbFill(g, FBM.sym([[32, 52], [B.hip - 0.2, 52], [B.hip - 1.6, 60], [32, 60]]), C);
        for (let x = Math.ceil(B.hip - 1.6); x < 64 - (B.hip - 1.6); x++) fbDot(g, x, 60 + (x % 2), WHITE);
      }
      fbFill(g, inT(FBM.band(43.5, 45.5)), T);
      FBP.bow(g, 32, 33.5, T, 0.8);
      dots(body);
    } else { // スポーティ (タンクトップとショートパンツ)
      const top = inT(FBM.band(30.5, 44));
      fbFill(g, top, C);
      straps(31);
      const shorts = FBM.or(inT(FBM.band(51, 58)), FBM.and(B.leg, FBM.band(55, 62)));
      fbFill(g, shorts, T);
      for (let y = 52; y < 62; y++) for (const x of [25, 38]) if (shorts(x, y)) fbDot(g, x + (y > 56 ? (x < 32 ? 1 : -1) : 0), y, WHITE);
      for (let x = 26; x <= 38; x++) if (B.torso(x, 43)) fbDot(g, x, 43, WHITE);
    }
  },
  maid(g, B, K) {
    const C = (K.L.outfit === 'maid' && K.L.cloth) || '#2a2a3e';
    FBP.shoes(g, B, BLACK);
    FBP.legs(g, B, WHITE, 82, 102);
    fbFill(g, FBM.or(FBM.and(B.torso, FBM.band(26, 48)), FBM.and(B.arm, FBM.band(0, 52)), FBM.ell(24.6, 31, 2.8, 3), FBM.ell(39.4, 31, 2.8, 3)), C);
    fbFill(g, FBM.and(B.arm, FBM.band(49, 52)), WHITE);
    fbFill(g, FBP.skirt(B, 44, 76, 7), C);
    FBP.frill(g, 75, 17, 47, WHITE);
    const apron = FBM.or(FBM.sym([[32, 32], [29, 32], [28.5, 44], [32, 44]]), FBM.sym([[32, 44], [27.5, 44], [26, 68], [28, 71], [32, 72]]));
    fbFill(g, apron, WHITE);
    FBP.frill(g, 71, 26, 38, '#e8e8f0');
    fbFill(g, FBM.and(B.torso, FBM.band(44, 46)), WHITE);
    fbFill(g, FBM.poly([[36, 44], [41, 42], [41, 50], [37, 47]]), WHITE);
    FBP.collar(g); FBP.bow(g, 32, 29.6, K.A);
  },
  dress(g, B, K) {
    const C = K.L.cloth, v = K.hash % 3;
    FBP.top(g, B, C, 32, 48, 0);
    FBP.frill(g, 32, 25, 39, WHITE);
    if (v === 0) { // ボールガウン
      fbFill(g, FBP.skirt(B, 44, 108, 14), C);
      FBP.pleats(g, 24, 41, 50, 106, U.shade(C, -0.2), 4);
      FBP.frill(g, 107, 11, 53, WHITE);
    } else if (v === 1) { // 三段フリル
      fbFill(g, FBP.skirt(B, 44, 104, 11), C);
      for (const y of [64, 84, 103]) FBP.frill(g, y, 32 - (y - 40) * 0.29 - 6, 32 + (y - 40) * 0.29 + 6, WHITE);
    } else if (K.adult) { // マーメイド
      fbFill(g, FBM.or(FBM.and(B.torso, FBM.band(44, 58)), FBM.sym([[32, 44], [B.waist, 44], [B.hip - 0.3, 53], [26.6, 68], [28, 80], [17, 108], [32, 108]])), C);
      FBP.frill(g, 107, 15, 49, WHITE);
    } else { // パフスリーブのプリンセス
      fbFill(g, FBP.skirt(B, 44, 96, 10), C);
      fbFill(g, FBM.or(FBM.ell(24.6, 31, 3, 3), FBM.ell(39.4, 31, 3, 3)), U.shade(C, 0.2));
      FBP.frill(g, 95, 14, 50, WHITE);
    }
    FBP.necklace(g); fbFill(g, FBM.ell(32, 31, 1.3, 1.4), K.A, { shade: false });
    if (v !== 2 || K.adult) FBP.sleeve(g, B, WHITE, 42, 56);
    FBP.belt(g, B, K.A, 44, 2);
  },
  gala(g, B, K) {
    const C = '#f4f0ff';
    FBP.top(g, B, C, 32, 48, 0);
    fbFill(g, FBP.skirt(B, 44, 108, 15), C);
    FBP.pleats(g, 24, 41, 50, 106, '#ddd6f2', 3);
    FBP.belt(g, B, GOLD, 44, 3);
    fbFill(g, FBM.poly([[36, 44], [42, 41], [42, 50], [37, 47]]), GOLD);
    FBP.frill(g, 107, 10, 54, GOLD); FBP.frill(g, 32, 25, 39, GOLD);
    fbFill(g, FBM.ell(32, 31, 1.3, 1.4), '#7fe8ff', { shade: false });
    for (const [x, y] of [[22, 66], [40, 60], [29, 84], [43, 92], [19, 100], [34, 102], [26, 56], [46, 78]]) FB_MOTIF.light(g, x, y, '#ffe66d');
    FBP.sleeve(g, B, WHITE, 42, 56);
  },
  bunny(g, B, K) {
    const C = K.L.cloth || '#1e1a2a';
    FBP.legs(g, B, '#6a5462', 54);
    FBP.shoes(g, B, BLACK);
    fbFill(g, FBM.and(B.torso, FBM.band(35, 58)), C);
    fbFill(g, FBM.rect(29.5, 25, 34.5, 27.5), WHITE, { shade: false });
    FBP.bow(g, 32, 28.3, '#e43b44');
    FBP.sleeve(g, B, WHITE, 50, 53);
    fbFill(g, FBM.ell(39, 54, 2, 2), WHITE);
  },
  bikini(g, B, K) {
    const C = K.L.cloth, P = U.shade(K.A, 0.25), inT = m => FBM.and(B.torso, m);
    const noArm = FBM.not(FBM.or(B.arm, B.hand));
    // トップ (三角ビキニ + 中央のリング + ホルターネック)
    const top = inT(FBM.or(FBM.poly([[25, 37.6], [31.6, 37.6], [29.4, 31.2]]), FBM.poly([[32.4, 37.6], [39, 37.6], [34.6, 31.2]])));
    fbFill(g, top, C);
    fbLine(g, 29, 31, 30, 27, C); fbLine(g, 35, 31, 34, 27, C);
    fbDot(g, 32, 35, GOLD); fbDot(g, 32, 36, GOLD);
    for (const x of [25, 39]) if (B.torso(x, 36)) fbDot(g, x, 36, C);
    // ボトム (サイドにひも)
    const bottom = FBM.sym([[32, 52.5], [B.hip + 0.3, 52.5], [B.hip + 1.2, 55], [30.2, 58.5], [32, 59]]);
    fbFill(g, bottom, C);
    fbDot(g, Math.ceil(B.hip + 0.3), 52, GOLD); fbDot(g, Math.floor(63.7 - B.hip), 52, GOLD);
    // パレオ (腰に巻いた透ける布。右の腰で結ぶ)
    const pareo = FBM.and(FBM.poly([[B.hip, 53], [64 - B.hip, 53], [43.5, 75], [26, 86], [19.5, 79]]), noArm);
    fbFill(g, pareo, P, { alpha: 0.55 });
    if (K.hash % 2) for (let y = 58; y < 84; y += 5) for (let x = 20 + (y % 10 ? 2 : 0); x < 44; x += 5) if (pareo(x, y)) FB_MOTIF.light(g, x, y, U.shade(P, -0.25));
    fbFill(g, FBM.and(FBM.or(FBM.ell(39.4, 54, 2, 1.6), FBM.poly([[39, 55], [41, 55], [42.5, 64], [40.5, 64]])), noArm), U.shade(P, -0.1));
    fbFill(g, B.foot, '#c89060');
    fbLine(g, 28, 104, 29, 106, '#c89060'); fbLine(g, 36, 104, 35, 106, '#c89060');
  },
  slitdress(g, B, K) {
    const C = K.L.cloth || '#8a1a3a';
    fbFill(g, B.foot, BLACK);
    const skirt = FBM.and(FBP.skirt(B, 44, 108, 9), FBM.not(FBM.and(B.leg, FBM.poly([[33, 80], [38, 80], [40, 110], [33, 110]]))));
    fbFill(g, FBM.or(FBM.and(B.torso, FBM.band(33, 50)), skirt), C);
    fbFill(g, FBM.sym([[32, 32], [30, 32.5], [32, 37]]), SKIN, { shade: false });
    FBP.pleats(g, 24, 33, 52, 106, U.shade(C, -0.25), 4);
    FBP.necklace(g);
    FBP.sleeve(g, B, '#2a1a24', 40, 56);
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
function fbHash(s) { let h = 7; for (const ch of String(s || '')) h = (h * 31 + ch.charCodeAt(0)) >>> 0; return h; }
function fullBody(look) {
  const key = 'fb' + JSON.stringify(look);
  if (FB_CACHE[key]) return FB_CACHE[key];
  const cid = look.cid;
  const adult = !!(cid && typeof ADULT_AGE !== 'undefined' && ADULT_AGE[cid]);
  const B = FB_BODIES[adult ? 'adult' : 'young'];
  const K = { L: look, C: look.cloth, D: U.shade(look.cloth, -0.25), A: look.acc, H: look.hair, adult, hash: fbHash(cid), elem: cid && CHARS[cid] ? CHARS[cid].elem : 'light' };
  const st = look.outfit ? FB_OUTFITS[look.outfit] : FB_STYLES[FB_CHAR_STYLE[cid] || 'adventurer'];
  const g = fbGrid();
  fbHairBack(g, look);
  if (st && st.back) st.back(g, K);
  fbFill(g, B.all, SKIN, { line: true, lineCol: '#e4ae96' });
  fbFill(g, B.hand, SKIN);
  if (st) (st.front || st)(g, B, K);
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
