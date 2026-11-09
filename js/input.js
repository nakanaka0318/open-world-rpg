'use strict';
// ===== 入力 (キーボード + タッチパッド) =====
const Input = {
  held: { up: false, down: false, left: false, right: false, a: false, b: false },
  dirOrder: [],
  repeat: { k: null, t: 0, n: 0 },
  handler: null, // (key) => void
  touch: false,

  init() {
    const map = {
      ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right',
      KeyW: 'up', KeyS: 'down', KeyA: 'left', KeyD: 'right',
      KeyZ: 'a', Enter: 'a', Space: 'a', KeyX: 'b', Escape: 'b', Backspace: 'b',
      KeyC: 'menu', KeyM: 'menu', ShiftLeft: 'b', ShiftRight: 'b',
    };
    window.addEventListener('keydown', e => {
      const k = map[e.code];
      if (!k) return;
      e.preventDefault();
      if (e.repeat) return;
      this.down(k);
    });
    window.addEventListener('keyup', e => {
      const k = map[e.code];
      if (!k) return;
      e.preventDefault();
      this.up(k);
    });
    window.addEventListener('blur', () => { for (const k in this.held) this.held[k] = false; this.dirOrder = []; });
    this.initPad();
  },
  isDir(k) { return k === 'up' || k === 'down' || k === 'left' || k === 'right'; },
  down(k) {
    if (this.isDir(k)) {
      if (this.held[k]) return;
      this.held[k] = true;
      this.dirOrder = this.dirOrder.filter(d => d !== k); this.dirOrder.push(k);
      this.repeat = { k, t: 0, n: 0 };
    } else {
      this.held[k] = true;
    }
    if (typeof Sound !== 'undefined') Sound.unlock();
    if (this.handler) this.handler(k);
  },
  up(k) {
    if (!(k in this.held)) return;
    this.held[k] = false;
    if (this.isDir(k)) {
      this.dirOrder = this.dirOrder.filter(d => d !== k);
      if (this.repeat.k === k) this.repeat.k = null;
    }
  },
  dir() { return this.dirOrder.length ? this.dirOrder[this.dirOrder.length - 1] : null; },
  // メニュー用のキーリピート
  update(dt, menuActive) {
    const r = this.repeat;
    if (!r.k || !this.held[r.k] || !menuActive) return;
    r.t += dt;
    const first = 0.32, every = 0.085;
    if (r.n === 0 && r.t >= first) { r.n = 1; r.t = 0; if (this.handler) this.handler(r.k); }
    else if (r.n > 0 && r.t >= every) { r.t = 0; r.n++; if (this.handler) this.handler(r.k); }
  },
  initPad() {
    const pad = document.getElementById('dpad');
    let pid = null, cur = null;
    const setDir = d => {
      if (cur === d) return;
      if (cur) this.up(cur);
      cur = d;
      if (d) this.down(d);
      pad.dataset.dir = d || '';
    };
    const calc = e => {
      const r = pad.getBoundingClientRect();
      const x = e.clientX - (r.left + r.width / 2), y = e.clientY - (r.top + r.height / 2);
      const dz = r.width * 0.12;
      if (Math.abs(x) < dz && Math.abs(y) < dz) return null;
      return Math.abs(x) > Math.abs(y) ? (x > 0 ? 'right' : 'left') : (y > 0 ? 'down' : 'up');
    };
    pad.addEventListener('pointerdown', e => { e.preventDefault(); pid = e.pointerId; pad.setPointerCapture(pid); this.markTouch(); setDir(calc(e)); });
    pad.addEventListener('pointermove', e => { if (e.pointerId !== pid) return; setDir(calc(e)); });
    const end = e => { if (e.pointerId !== pid) return; pid = null; setDir(null); };
    pad.addEventListener('pointerup', end);
    pad.addEventListener('pointercancel', end);
    for (const [id, k] of [['bA', 'a'], ['bB', 'b'], ['bM', 'menu']]) {
      const el = document.getElementById(id);
      el.addEventListener('pointerdown', e => { e.preventDefault(); this.markTouch(); el.classList.add('on'); this.down(k); });
      const off = () => { el.classList.remove('on'); this.up(k); };
      el.addEventListener('pointerup', off); el.addEventListener('pointercancel', off); el.addEventListener('pointerleave', off);
    }
    window.addEventListener('touchstart', () => this.markTouch(), { passive: true });
    if (window.matchMedia && window.matchMedia('(pointer: coarse)').matches) this.markTouch();
    document.addEventListener('gesturestart', e => e.preventDefault());
  },
  markTouch() {
    if (this.touch) return;
    this.touch = true;
    document.body.classList.add('touch');
    if (typeof Game !== 'undefined' && Game.resize) Game.resize();
  },
};
