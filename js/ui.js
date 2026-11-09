'use strict';
// ===== UI (DOMウィンドウ) =====
class ListMenu {
  constructor(o) {
    this.o = Object.assign({ cols: 1, items: [], cls: '' }, o);
    this.el = U.el('div', 'lm ' + this.o.cls);
    if (this.o.cols > 1) this.el.style.gridTemplateColumns = `repeat(${this.o.cols}, 1fr)`;
    this.i = this.o.start || 0;
    this.set(this.o.items);
  }
  set(items, keepIndex) {
    this.items = items;
    this.el.innerHTML = '';
    this.nodes = items.map((it, i) => {
      const n = U.el('div', 'li' + (it.disabled ? ' dis' : '') + (it.cls ? ' ' + it.cls : ''), it.label);
      n.addEventListener('click', e => {
        e.stopPropagation();
        if (this.locked) return;
        this.i = i; this.mark();
        this.select();
      });
      this.el.appendChild(n);
      return n;
    });
    if (!keepIndex) this.i = Math.min(this.i, Math.max(0, items.length - 1));
    else this.i = U.clamp(this.i, 0, Math.max(0, items.length - 1));
    this.mark();
  }
  mark() {
    this.nodes.forEach((n, i) => n.classList.toggle('cur', i === this.i));
    const n = this.nodes[this.i];
    if (n && n.scrollIntoView) { try { n.scrollIntoView({ block: 'nearest' }); } catch (e) { } }
    if (this.o.onChange) this.o.onChange(this.i, this.items[this.i]);
  }
  move(d) {
    if (!this.items.length) return;
    const n = this.items.length, c = this.o.cols;
    let i = this.i;
    if (d === 'up') i -= c; else if (d === 'down') i += c; else if (d === 'left') i -= (c > 1 ? 1 : 0); else if (d === 'right') i += (c > 1 ? 1 : 0);
    if (c === 1 && (d === 'left' || d === 'right')) { if (this.o.onLR) this.o.onLR(d); return; }
    i = (i + n) % n;
    if (i !== this.i) { this.i = i; Sound.play('cursor'); this.mark(); }
  }
  select() {
    const it = this.items[this.i];
    if (!it) return;
    if (it.disabled) { Sound.play('buzz'); return; }
    Sound.play('ok');
    if (this.o.onSelect) this.o.onSelect(this.i, it);
  }
  handle(k) {
    if (this.locked) return;
    if (Input.isDir(k)) this.move(k);
    else if (k === 'a') this.select();
    else if (k === 'b') { if (this.o.onCancel) { Sound.play('cancel'); this.o.onCancel(); } }
  }
}

const UI = {
  stack: [],
  root: null,
  init() { this.root = document.getElementById('ui'); },
  top() { return this.stack[this.stack.length - 1]; },
  active() { return this.stack.some(l => !l.passive); },
  push(layer) {
    this.stack.push(layer);
    if (layer.el && !layer.el.parentNode) this.root.appendChild(layer.el);
    return layer;
  },
  pop(layer) {
    const i = this.stack.indexOf(layer);
    if (i >= 0) this.stack.splice(i, 1);
    if (layer.el && layer.el.parentNode) layer.el.parentNode.removeChild(layer.el);
    if (layer.onClose) layer.onClose();
  },
  handle(k) {
    for (let i = this.stack.length - 1; i >= 0; i--) {
      const l = this.stack[i];
      if (l.passive) continue;
      if (l.handle) l.handle(k);
      return true;
    }
    return false;
  },
  win(cls, html) { return U.el('div', 'win ' + (cls || ''), html); },

  // 会話ウィンドウ
  say(text, opts = {}) {
    const pages = Array.isArray(text) ? text : [text];
    return new Promise(res => {
      const el = U.el('div', 'layer dlg-layer');
      const w = this.win('dlg' + (opts.look ? ' has-port' : ''));
      if (opts.look) { const im = U.el('img', 'dlg-port'); im.src = portraitURL(opts.look); w.appendChild(im); }
      if (opts.name) w.appendChild(U.el('div', 'dlg-name', U.esc(opts.name)));
      const body = U.el('div', 'dlg-text');
      const arrow = U.el('div', 'dlg-next', '▼');
      w.appendChild(body); w.appendChild(arrow);
      el.appendChild(w);
      let p = 0, shown = 0, full = '', timer = null;
      const show = () => {
        full = pages[p];
        shown = 0; arrow.style.visibility = 'hidden';
        clearInterval(timer);
        timer = setInterval(() => {
          shown += 2;
          if (shown >= full.length) { shown = full.length; clearInterval(timer); timer = null; arrow.style.visibility = 'visible'; }
          body.innerHTML = U.esc(full.slice(0, shown)).replace(/\n/g, '<br>');
        }, 28);
      };
      const adv = () => {
        if (timer) { clearInterval(timer); timer = null; shown = full.length; body.innerHTML = U.esc(full).replace(/\n/g, '<br>'); arrow.style.visibility = 'visible'; return; }
        Sound.play('cursor');
        p++;
        if (p >= pages.length) { this.pop(layer); res(); } else show();
      };
      const layer = { el, handle: k => { if (k === 'a' || k === 'b') adv(); } };
      el.addEventListener('click', e => { e.stopPropagation(); adv(); });
      this.push(layer);
      show();
    });
  },

  // 選択肢
  ask(text, options, opts = {}) {
    return new Promise(res => {
      const el = U.el('div', 'layer ask-layer');
      if (text) {
        const w = this.win('dlg' + (opts.look ? ' has-port' : ''));
        if (opts.look) { const im = U.el('img', 'dlg-port'); im.src = portraitURL(opts.look); w.appendChild(im); }
        if (opts.name) w.appendChild(U.el('div', 'dlg-name', U.esc(opts.name)));
        w.appendChild(U.el('div', 'dlg-text', U.esc(text).replace(/\n/g, '<br>')));
        el.appendChild(w);
      }
      const box = this.win('choice');
      const done = v => { this.pop(layer); res(v); };
      const lm = new ListMenu({
        items: options.map(o => ({ label: U.esc(o) })),
        onSelect: i => done(i),
        onCancel: opts.noCancel ? null : () => done(-1),
      });
      box.appendChild(lm.el);
      el.appendChild(box);
      const layer = { el, handle: k => lm.handle(k) };
      this.push(layer);
    });
  },

  // 数字入力
  code(text, digits) {
    return new Promise(res => {
      const el = U.el('div', 'layer ask-layer');
      const w = this.win('dlg');
      w.appendChild(U.el('div', 'dlg-text', U.esc(text).replace(/\n/g, '<br>')));
      el.appendChild(w);
      const box = this.win('codebox');
      const vals = new Array(digits).fill(0);
      let cur = 0;
      const cells = [];
      const row = U.el('div', 'coderow');
      for (let i = 0; i < digits; i++) {
        const c = U.el('div', 'codecell');
        const up = U.el('div', 'cup', '▲'), num = U.el('div', 'cnum', '0'), dn = U.el('div', 'cdn', '▼');
        up.onclick = e => { e.stopPropagation(); cur = i; vals[i] = (vals[i] + 1) % 10; Sound.play('cursor'); draw(); };
        dn.onclick = e => { e.stopPropagation(); cur = i; vals[i] = (vals[i] + 9) % 10; Sound.play('cursor'); draw(); };
        num.onclick = e => { e.stopPropagation(); cur = i; draw(); };
        c.append(up, num, dn); row.appendChild(c); cells.push({ c, num });
      }
      const btns = U.el('div', 'codebtns');
      const okb = U.el('div', 'btn', '決定'), cb = U.el('div', 'btn sub', 'やめる');
      okb.onclick = e => { e.stopPropagation(); Sound.play('ok'); done(vals.join('')); };
      cb.onclick = e => { e.stopPropagation(); Sound.play('cancel'); done(null); };
      btns.append(okb, cb);
      box.append(row, btns);
      el.appendChild(box);
      const draw = () => cells.forEach((x, i) => { x.num.textContent = vals[i]; x.c.classList.toggle('cur', i === cur); });
      const done = v => { this.pop(layer); res(v); };
      const layer = {
        el, handle: k => {
          if (k === 'left') { cur = (cur + digits - 1) % digits; Sound.play('cursor'); }
          else if (k === 'right') { cur = (cur + 1) % digits; Sound.play('cursor'); }
          else if (k === 'up') { vals[cur] = (vals[cur] + 1) % 10; Sound.play('cursor'); }
          else if (k === 'down') { vals[cur] = (vals[cur] + 9) % 10; Sound.play('cursor'); }
          else if (k === 'a') { Sound.play('ok'); done(vals.join('')); return; }
          else if (k === 'b') { Sound.play('cancel'); done(null); return; }
          draw();
        },
      };
      draw();
      this.push(layer);
    });
  },

  // 順番入力 (紋章を順に押す)
  seq(text, options, len) {
    return new Promise(res => {
      const el = U.el('div', 'layer ask-layer');
      const w = this.win('dlg');
      const t = U.el('div', 'dlg-text', U.esc(text).replace(/\n/g, '<br>'));
      const picked = U.el('div', 'seqpicked');
      w.append(t, picked);
      el.appendChild(w);
      const box = this.win('choice');
      const sel = [];
      const draw = () => { picked.innerHTML = '入力: ' + (sel.length ? sel.map(s => `<b>${U.esc(s)}</b>`).join(' → ') : '―'); };
      const done = v => { this.pop(layer); res(v); };
      const lm = new ListMenu({
        cols: 2,
        items: options.map(o => ({ label: U.esc(o) })),
        onSelect: i => { sel.push(options[i]); draw(); if (sel.length >= len) setTimeout(() => done(sel.slice()), 250); },
        onCancel: () => { if (sel.length) { sel.pop(); draw(); } else done(null); },
      });
      box.appendChild(lm.el);
      el.appendChild(box);
      const layer = { el, handle: k => lm.handle(k) };
      draw();
      this.push(layer);
    });
  },

  toast(html, ms = 1800) {
    const t = U.el('div', 'toast', html);
    this.root.appendChild(t);
    setTimeout(() => t.classList.add('out'), ms);
    setTimeout(() => t.remove(), ms + 400);
  },

  // 画面フラッシュ / フェード
  fade(color = '#000', inMs = 250, hold = 0, outMs = 250, mid) {
    return new Promise(res => {
      const f = U.el('div', 'fade');
      f.style.background = color;
      f.style.transition = `opacity ${inMs}ms`;
      this.root.appendChild(f);
      requestAnimationFrame(() => { f.style.opacity = 1; });
      setTimeout(async () => {
        if (mid) await mid();
        setTimeout(() => {
          f.style.transition = `opacity ${outMs}ms`;
          f.style.opacity = 0;
          setTimeout(() => { f.remove(); res(); }, outMs);
        }, hold);
      }, inMs);
    });
  },
};
