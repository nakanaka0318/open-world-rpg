'use strict';
// ===== 共通ユーティリティ =====
const U = {
  // 再現可能な乱数
  rng(seed) {
    let a = seed >>> 0;
    return function () {
      a = (a + 0x6D2B79F5) >>> 0;
      let t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  },
  hash2(x, y, seed) {
    let h = (x * 374761393 + y * 668265263 + seed * 2147483647) | 0;
    h = Math.imul(h ^ (h >>> 13), 1274126177);
    h ^= h >>> 16;
    return (h >>> 0) / 4294967296;
  },
  // 値ノイズ (0..1)
  noise(x, y, scale, seed) {
    const fx = x * scale, fy = y * scale;
    const x0 = Math.floor(fx), y0 = Math.floor(fy);
    const tx = fx - x0, ty = fy - y0;
    const sx = tx * tx * (3 - 2 * tx), sy = ty * ty * (3 - 2 * ty);
    const a = U.hash2(x0, y0, seed), b = U.hash2(x0 + 1, y0, seed);
    const c = U.hash2(x0, y0 + 1, seed), d = U.hash2(x0 + 1, y0 + 1, seed);
    return a + (b - a) * sx + (c - a) * sy + (a - b - c + d) * sx * sy;
  },
  fbm(x, y, scale, seed) {
    return (U.noise(x, y, scale, seed) * 0.6 + U.noise(x, y, scale * 2, seed + 7) * 0.3 + U.noise(x, y, scale * 4, seed + 13) * 0.1);
  },
  clamp(v, a, b) { return v < a ? a : v > b ? b : v; },
  lerp(a, b, t) { return a + (b - a) * t; },
  ri(a, b) { return a + Math.floor(Math.random() * (b - a + 1)); },
  pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; },
  sleep(ms) { return new Promise(r => setTimeout(r, ms)); },
  hex2rgb(h) {
    h = h.replace('#', '');
    if (h.length === 3) h = h.split('').map(c => c + c).join('');
    const n = parseInt(h, 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  },
  rgb2hex(r, g, b) {
    return '#' + [r, g, b].map(v => U.clamp(Math.round(v), 0, 255).toString(16).padStart(2, '0')).join('');
  },
  // amt<0 で暗く、>0 で明るく
  shade(hex, amt) {
    const [r, g, b] = U.hex2rgb(hex);
    if (amt < 0) { const k = 1 + amt; return U.rgb2hex(r * k, g * k * 0.98, b * k * 1.02 + 6 * -amt); }
    return U.rgb2hex(r + (255 - r) * amt, g + (255 - g) * amt, b + (255 - b) * amt);
  },
  el(tag, cls, html) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html !== undefined) e.innerHTML = html;
    return e;
  },
  esc(s) { return String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); },
  stars(n) { return '★'.repeat(n); },
  today() { const d = new Date(); return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate(); },
  weekIndex() { return Math.floor((Date.now() / 86400000 + 3) / 7); },
};
