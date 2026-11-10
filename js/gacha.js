'use strict';
// ===== ソシャゲ風ガチャ =====
// 装備アイコン (ピクセル描画 + 自動アウトライン)
const ICON_CACHE = {};
function equipKind(id) {
  const e = EQUIPS[id];
  if (e.slot === 'w') return /弓/.test(e.n) ? 'bow' : (e.st.mag ? 'staff' : 'sword');
  if (e.slot === 'a') return /ドレス|ローブ|服/.test(e.n) ? 'dress' : 'armor';
  return /ティアラ|カチューシャ|髪飾り|バンド/.test(e.n) ? 'tiara' : (/ペンダント|ブローチ|お守り/.test(e.n) ? 'amulet' : 'ring');
}
function iconCanvas(kind, color) {
  const key = kind + color;
  if (ICON_CACHE[key]) return ICON_CACHE[key];
  const c = mkCanvas(16, 16), x = c.getContext('2d');
  const px = (a, b, col) => { x.fillStyle = col; x.fillRect(a, b, 1, 1); };
  const line = (x0, y0, x1, y1, col, w = 1) => { const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)); for (let i = 0; i <= n; i++) { const a = Math.round(x0 + (x1 - x0) * i / n), b = Math.round(y0 + (y1 - y0) * i / n); x.fillStyle = col; x.fillRect(a, b, w, w); } };
  const lt = U.shade(color, 0.5), dk = U.shade(color, -0.35);
  if (kind === 'sword') { line(4, 11, 13, 2, '#e8eef8', 2); line(5, 11, 13, 3, lt); line(2, 9, 6, 13, '#f5c542', 2); line(1, 14, 4, 11, '#7a4a2c', 2); px(13, 2, '#fff'); }
  if (kind === 'staff') { line(2, 14, 10, 6, '#8a5a32', 2); x.fillStyle = color; x.fillRect(9, 2, 5, 5); x.fillStyle = lt; x.fillRect(10, 3, 2, 2); px(8, 7, '#f5c542'); px(9, 7, '#f5c542'); }
  if (kind === 'bow') { for (let a = -1.2; a <= 1.2; a += 0.08) { const bx = Math.round(5 + Math.cos(a) * 7), by = Math.round(8 + Math.sin(a) * 7); x.fillStyle = color; x.fillRect(bx, by, 2, 1); } line(6, 1, 6, 15, '#f4f0e8'); line(3, 8, 14, 8, '#c8b090'); px(14, 8, '#fff'); px(13, 7, '#fff'); px(13, 9, '#fff'); }
  if (kind === 'armor') { x.fillStyle = color; x.fillRect(3, 3, 10, 7); x.fillRect(4, 10, 8, 2); x.fillRect(6, 12, 4, 2); x.fillStyle = lt; x.fillRect(4, 4, 3, 4); x.fillStyle = '#f5c542'; x.fillRect(7, 3, 2, 10); }
  if (kind === 'dress') { x.fillStyle = color; x.fillRect(6, 2, 4, 4); x.fillRect(5, 6, 6, 2); x.fillRect(4, 8, 8, 3); x.fillRect(3, 11, 10, 3); x.fillStyle = lt; x.fillRect(6, 3, 1, 2); x.fillRect(4, 11, 2, 2); x.fillStyle = '#fff'; x.fillRect(5, 6, 6, 1); }
  if (kind === 'ring') { for (let a = 0; a < 6.3; a += 0.25) { x.fillStyle = '#f5c542'; x.fillRect(Math.round(8 + Math.cos(a) * 4), Math.round(9 + Math.sin(a) * 4), 1, 1); } x.fillStyle = color; x.fillRect(6, 2, 4, 4); x.fillStyle = lt; x.fillRect(7, 3, 1, 1); }
  if (kind === 'amulet') { line(3, 2, 8, 8, '#c8b090'); line(13, 2, 8, 8, '#c8b090'); x.fillStyle = color; x.fillRect(5, 8, 6, 6); x.fillStyle = lt; x.fillRect(6, 9, 2, 2); }
  if (kind === 'tiara') { x.fillStyle = '#f5c542'; x.fillRect(2, 9, 12, 3); x.fillRect(3, 6, 2, 3); x.fillRect(7, 4, 2, 5); x.fillRect(11, 6, 2, 3); x.fillStyle = color; x.fillRect(7, 5, 2, 2); x.fillRect(3, 10, 2, 1); x.fillRect(11, 10, 2, 1); }
  // アウトライン
  const img = x.getImageData(0, 0, 16, 16), d = img.data;
  const out = new Uint8Array(256);
  for (let i = 0; i < 256; i++) if (!d[i * 4 + 3]) { const a = i % 16, b = (i / 16) | 0; for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const na = a + dx, nb = b + dy; if (na >= 0 && nb >= 0 && na < 16 && nb < 16 && d[(nb * 16 + na) * 4 + 3]) out[i] = 1; } }
  for (let i = 0; i < 256; i++) if (out[i]) { d[i * 4] = 24; d[i * 4 + 1] = 20; d[i * 4 + 2] = 37; d[i * 4 + 3] = 255; }
  x.putImageData(img, 0, 0);
  ICON_CACHE[key] = c;
  return c;
}
const ICON_URL = {};
function equipIconURL(id) {
  if (ICON_URL[id]) return ICON_URL[id];
  const e = EQUIPS[id];
  const col = e.elem ? ELEM[e.elem].c : { 3: '#7ac8f0', 4: '#c27ff0', 5: '#ffd94a' }[e.rar];
  return (ICON_URL[id] = iconCanvas(equipKind(id), col).toDataURL());
}
const RAR_COL = { 3: '#5aa0e8', 4: '#e8b83a', 5: 'rainbow' };

const Gacha = {
  open(startId) {
    return new Promise(res => {
      Sound.bgm('gacha');
      const el = U.el('div', 'layer gacha-layer');
      const head = U.el('div', 'g-head');
      const stonesEl = U.el('div', 'g-stones');
      const close = U.el('div', 'g-close', '✕ とじる');
      head.append(U.el('div', 'g-title', '召喚'), stonesEl, close);
      const tabs = U.el('div', 'g-tabs');
      const body = U.el('div', 'g-body');
      el.append(head, tabs, body);
      let banners = getBanners(G), bi = Math.max(0, banners.findIndex(b => b.id === startId));
      let focus = 0; // 0: 単発 1: 10連
      const render = () => {
        banners = getBanners(G);
        bi = U.clamp(bi, 0, banners.length - 1);
        const b = banners[bi];
        stonesEl.innerHTML = `<span class="gem">◆</span> ${G.stones}`;
        tabs.innerHTML = '';
        banners.forEach((x, i) => {
          const t = U.el('div', 'g-tab' + (i === bi ? ' cur' : ''), U.esc(x.n));
          t.onclick = e => { e.stopPropagation(); bi = i; Sound.play('cursor'); render(); };
          tabs.appendChild(t);
        });
        body.innerHTML = '';
        const ban = U.el('div', 'g-banner');
        ban.style.setProperty('--bc', b.color);
        if (b.feature) {
          const fd = CHARS[b.feature];
          ban.innerHTML = `<div class="g-rays"></div><img class="g-feat" src="${portraitURL(fd.look)}"><div class="g-ftxt"><div class="g-fstar">★★★★★</div><div class="g-fname">${U.esc(fd.n)}</div><div class="g-ftitle">${U.esc(fd.title)}</div><div class="g-fel" style="background:${ELEM[fd.elem].c}">${ELEM[fd.elem].n}属性 ／ ${U.esc(fd.role)}</div></div>`;
        } else {
          const fc = cardPool(5).slice(0, 3);
          ban.innerHTML = `<div class="g-rays"></div><div class="g-cards">${fc.map(k => cardFaceHTML(k)).join('')}</div><div class="g-ftxt"><div class="g-fstar">★5 カード</div><div class="g-fname">伝説のカード</div><div class="g-ftitle">「${U.esc(CARDS[fc[0]].n)}」「${U.esc(CARDS[fc[1]].n)}」ほか</div></div>`;
        }
        body.appendChild(ban);
        body.appendChild(U.el('div', 'g-sub', U.esc(b.sub)));
        if (b.pickup) {
          const pu = pickupRate(b);
          const row = U.el('div', 'g-pu', `ピックアップ <b>${U.esc(CHARS[b.pickup].n)}</b> の出現率 ${pu.toFixed(2)}% <small>(他の★5の8倍)</small>`);
          if (b.selectable) {
            const btn = U.el('div', 'g-pubtn', 'ピックアップを選ぶ ▸');
            btn.onclick = async e => { e.stopPropagation(); await this.choosePickup(); render(); };
            row.appendChild(btn);
          }
          body.appendChild(row);
        }
        body.appendChild(U.el('div', 'g-rate', `提供割合 ★5 ${b.rates[0]}% ／ ★4 ${b.rates[1]}% ／ ★3 ${b.rates[2]}%<br>10連は ★4以上 1枠確定!`));
        const btns = U.el('div', 'g-btns');
        const one = U.el('div', 'g-btn single' + (focus === 0 ? ' cur' : ''), `単発召喚<br><span class="gem">◆</span>${GACHA_COST.single}`);
        const ten = U.el('div', 'g-btn ten' + (focus === 1 ? ' cur' : ''), `10連召喚<br><span class="gem">◆</span>${b.tenCost || GACHA_COST.ten}`);
        if (b.onlyTen) one.classList.add('dis');
        if (G.stones < GACHA_COST.single || b.onlyTen) one.classList.add('dis');
        if (G.stones < (b.tenCost || GACHA_COST.ten)) ten.classList.add('dis');
        one.onclick = e => { e.stopPropagation(); focus = 0; go(1); };
        ten.onclick = e => { e.stopPropagation(); focus = 1; go(10); };
        btns.append(one, ten);
        body.appendChild(btns);
        const links = U.el('div', 'g-links');
        const info = U.el('div', 'g-info', b.kind === 'char' ? '提供キャラ一覧 ▸' : '提供武具一覧 ▸');
        info.onclick = e => { e.stopPropagation(); showPool(b); };
        const hist = U.el('div', 'g-info', '召喚履歴 ▸');
        hist.onclick = e => { e.stopPropagation(); this.history(); };
        links.append(info, hist);
        body.appendChild(links);
      };
      const showPool = (b) => this.pool(b);
      const go = async (n) => {
        const b = banners[bi];
        const cost = n === 10 ? (b.tenCost || GACHA_COST.ten) : GACHA_COST.single;
        if (n === 1 && b.onlyTen) { Sound.play('buzz'); return; }
        if (G.stones < cost) { Sound.play('buzz'); UI.toast('星晶石が足りない!<br>宝箱・パズル・ボス討伐で集めよう', 2000); return; }
        Sound.play('ok');
        const c = await UI.ask(`星晶石 ${cost} 個を使って\n${n === 10 ? '10連' : '単発'}召喚しますか?\n(所持: ${G.stones})`, ['召喚する!', 'やめる']);
        if (c !== 0) return;
        G.stones -= cost;
        if (b.once) { G.gacha.used = G.gacha.used || {}; G.gacha.used[b.id] = 1; if (b.id === 'beginner') G.gacha.beginnerDone = true; }
        const results = this.roll(b, n);
        G.gacha.total += n;
        await this.summon(results, b);
        render();
        Game.hud();
        Sound.bgm('gacha');
      };
      const done = () => { UI.pop(layer); Field.updateLoc(true); res(); };
      close.onclick = e => { e.stopPropagation(); Sound.play('cancel'); done(); };
      const layer = {
        el, handle: k => {
          if (k === 'b' || k === 'menu') { Sound.play('cancel'); done(); }
          else if (k === 'left' || k === 'up') { bi = (bi + banners.length - 1) % banners.length; Sound.play('cursor'); render(); }
          else if (k === 'right' || k === 'down') { bi = (bi + 1) % banners.length; Sound.play('cursor'); render(); }
          else if (k === 'a') { go(banners[bi].onlyTen ? 10 : 10); }
        },
      };
      UI.push(layer);
      render();
    });
  },

  // ピックアップにするキャラを選ぶ
  async choosePickup() {
    let chosen = null;
    await Menu.tabList({
      title: 'ピックアップするキャラを選ぶ',
      tabs: [{ n: 'すべて' }].concat(['fire', 'water', 'wind', 'earth', 'light', 'dark'].map(e => ({ n: ELEM[e].n, f: k => CHARS[k].elem === e }))),
      items: () => charPool(5),
      label: k => `<img class="ico" src="${portraitURL(CHARS[k].look)}"><span class="rar r5">★★★★★</span> ${U.esc(CHARS[k].n)} <small class="eqst">${U.esc(CHARS[k].title)}</small>${k === selPickup() ? '<span class="tag lead">選択中</span>' : ''}${G.roster[k] ? `<span class="tag off">${G.roster[k].lb}凸</span>` : ''}`,
      note: k => U.esc(CHARS[k].profile),
      onSelect: async (k, ctx) => { chosen = k; ctx.close(); },
    });
    if (chosen) { G.gacha.pickup = chosen; Sound.play('ok'); UI.toast(`${CHARS[chosen].n} をピックアップに設定した!`); }
  },

  // 提供一覧 (所持していないものはシルエット)
  pool(b) {
    return new Promise(res => {
      const L = Menu.screen(b.kind === 'char' ? '提供キャラ一覧' : '提供カード一覧');
      L.onClosed = res;
      let html = `<div class="sc-note">${U.esc(b.n)} ／ ★5 ${b.rates[0]}%・★4 ${b.rates[1]}%・★3 ${b.rates[2]}%</div>`;
      for (const r of [5, 4, 3]) {
        const ids = b.kind === 'char' ? charPool(r).concat(r === 5 && b.limited ? ['stella'] : []) : cardPool(r);
        const own = ids.filter(k => b.kind === 'char' ? G.roster[k] : G.cards[k]).length;
        html += `<div class="pool-sec"><span class="rar r${r}">${'★'.repeat(r)}</span> <small class="dim">所持 ${own}/${ids.length}</small></div><div class="pool-grid">`;
        for (const k of ids) {
          const has = b.kind === 'char' ? G.roster[k] : G.cards[k];
          if (b.kind !== 'char') { html += `<div class="pool-c card ${has ? '' : 'no'}">${cardFaceHTML(k)}</div>`; continue; }
          const up = b.pickup === k || (b.elem && b.kind === 'char' && CHARS[k].elem === b.elem && r >= 4);
          const d = b.kind === 'char' ? CHARS[k] : EQUIPS[k];
          const img = b.kind === 'char' ? portraitURL(d.look) : equipIconURL(k);
          html += `<div class="pool-c tap ${has ? '' : 'no'} ${up ? 'up' : ''}" data-ch="${k}">${up ? '<span class="pu">UP</span>' : ''}<img src="${img}"><div>${U.esc(d.n)}</div>${b.kind === 'char' ? `<div style="color:${ELEM[d.elem].c}">${ELEM[d.elem].n}</div>` : ''}</div>`;
        }
        html += '</div>';
      }
      L.body.innerHTML = '<div class="sc-note">キャラをタップすると性能(ステータス・固有カード・レリック)が見られます</div>' + html;
      L.body.querySelectorAll('[data-ch]').forEach(el => el.onclick = e => { e.stopPropagation(); Sound.play('ok'); Menu.charPreview(el.dataset.ch); });
    });
  },
  history() {
    const hs = (G.gacha.history || []).map((h, i) => Object.assign({ i }, h));
    return Menu.tabList({
      title: '召喚履歴 (最新50件)',
      tabs: [{ n: 'すべて' }, { n: '★5', f: h => h.r === 5 }, { n: '★4', f: h => h.r === 4 }, { n: 'キャラ', f: h => h.k === 'char' }, { n: 'カード', f: h => h.k === 'card' }],
      items: () => hs,
      label: h => { const isC = h.k === 'char'; const d = isC ? CHARS[h.id] : (CARDS[h.id] || CARDS.blank); return `<img class="ico" src="${isC ? portraitURL(d.look) : cardArtURL(CARDS[h.id] ? h.id : 'blank')}"><span class="rar r${h.r}">${'★'.repeat(h.r)}</span> ${U.esc(d.n)}${isC ? '' : ' <small class="dim">カード</small>'}`; },
      empty: 'まだ召喚していない',
      onSelect: async () => { },
    });
  },

  roll(b, n) {
    const out = [];
    for (let i = 0; i < n; i++) {
      const r = Math.random() * 100;
      let rar = r < b.rates[0] ? 5 : r < b.rates[0] + b.rates[1] ? 4 : 3;
      if (n === 10 && i === 9 && out.every(o => o.rar < 4) && rar < 4) rar = 4;
      let id;
      if (b.kind === 'char') {
        let pool = charPool(rar);
        if (b.elem && rar >= 4 && Math.random() < 0.6) { const ep = pool.filter(k => CHARS[k].elem === b.elem); if (ep.length) pool = ep; }
        if (rar === 5 && b.pickup) id = pickupDraw(b);
        else id = pool[Math.floor(Math.random() * pool.length)];
        out.push({ kind: 'char', id, rar });
      } else {
        const pool = cardPool(rar);
        id = pool[Math.floor(Math.random() * pool.length)];
        out.push({ kind: 'card', id, rar });
      }
    }
    // 入手処理
    for (const o of out) {
      o.res = o.kind === 'char' ? obtainChar(o.id) : obtainCard(o.id);
      G.gacha.history.unshift({ k: o.kind, id: o.id, r: o.rar });
    }
    G.gacha.history = G.gacha.history.slice(0, 50);
    return out;
  },

  // 召喚演出
  summon(results, banner) {
    return new Promise(res => {
      const max = Math.max(...results.map(r => r.rar));
      // 昇格演出: 最初は低いレアの色で始まり、途中で上がる
      let startRar = max;
      if (max === 5 && Math.random() < 0.35) startRar = 4;
      else if (max === 4 && Math.random() < 0.2) startRar = 3;
      const el = U.el('div', 'layer summon-layer');
      const stars = U.el('div', 'sm-stars');
      for (let i = 0; i < 40; i++) { const s = U.el('i'); s.style.left = Math.random() * 100 + '%'; s.style.top = Math.random() * 100 + '%'; s.style.animationDelay = (Math.random() * 2) + 's'; stars.appendChild(s); }
      const circle = U.el('div', 'sm-circle r' + startRar);
      circle.innerHTML = '<div class="ring r1"></div><div class="ring r2"></div><div class="ring r3"></div><div class="core"></div>';
      const tip = U.el('div', 'sm-tip', 'タップでスキップ');
      el.append(stars, circle, tip);
      let stage = 0, skip = false, timers = [];
      const later = (ms, f) => timers.push(setTimeout(f, ms));
      const layer = { el, handle: k => { if (k === 'a' || k === 'b') next(); } };
      el.addEventListener('click', e => { e.stopPropagation(); next(); });
      UI.push(layer);
      Sound.stopBgm();
      Sound.play('orb');
      later(900, () => { circle.classList.add('charge'); Sound.play('magic'); });
      if (startRar !== max) later(1700, () => { circle.classList.remove('r' + startRar); circle.classList.add('r' + max, 'promote'); Sound.play(max === 5 ? 'star5' : 'star4'); });
      later(startRar !== max ? 2600 : 2000, () => { circle.classList.add('burst'); Sound.play('star' + max); });
      later(startRar !== max ? 3000 : 2400, () => { if (stage === 0) showCards(); });
      const next = () => {
        if (stage === 0) { timers.forEach(clearTimeout); showCards(); }
        else if (stage === 1 && this._advance) this._advance();
      };
      const showCards = async () => {
        if (stage !== 0) return;
        stage = 1;
        el.innerHTML = '';
        el.appendChild(stars);
        const grid = U.el('div', 'sm-grid' + (results.length === 1 ? ' one' : ''));
        el.appendChild(grid);
        const cards = results.map(r => {
          const c = U.el('div', 'sm-card back r' + r.rar);
          grid.appendChild(c);
          return c;
        });
        const fill = (c, r) => {
          const isC = r.kind === 'char';
          const d = isC ? CHARS[r.id] : CARDS[r.id];
          const img = isC ? portraitURL(d.look) : cardArtURL(r.id);
          c.className = 'sm-card r' + r.rar + (isC ? ' ch' : ' eq');
          c.innerHTML = `<img src="${img}"><div class="smc-st">${'★'.repeat(r.rar)}</div><div class="smc-n">${U.esc(d.n)}</div>${r.res.isNew ? '<div class="smc-new">NEW</div>' : `<div class="smc-res">${U.esc(r.res.text)}</div>`}`;
        };
        for (let i = 0; i < results.length; i++) {
          const r = results[i];
          await U.sleep(results.length === 1 ? 150 : 110);
          fill(cards[i], r);
          Sound.play('star' + Math.min(r.rar, 4));
          if (r.rar === 5 || (r.kind === 'char' && r.rar === 4 && r.res.isNew)) await this.reveal(el, r);
        }
        const btns = U.el('div', 'sm-btns');
        const ok = U.el('div', 'btn', 'OK');
        btns.appendChild(ok);
        el.appendChild(btns);
        this._advance = () => { this._advance = null; UI.pop(layer); res(); };
        ok.onclick = e => { e.stopPropagation(); Sound.play('ok'); this._advance && this._advance(); };
      };
    });
  },
  // ★5 / 新規キャラの全画面演出
  reveal(parent, r) {
    return new Promise(res => {
      const isC = r.kind === 'char';
      const d = isC ? CHARS[r.id] : CARDS[r.id];
      const box = U.el('div', 'sm-reveal r' + r.rar);
      const img = isC ? portraitURL(d.look) : cardArtURL(r.id);
      box.innerHTML = `<div class="rv-rays"></div>${isC ? `<img class="rv-img" src="${img}">` : `<div class="rv-card">${cardFaceHTML(r.id)}</div>`}<div class="rv-txt"><div class="rv-st">${'★'.repeat(r.rar)}</div><div class="rv-n">${U.esc(d.n)}</div>${isC ? `<div class="rv-t">${U.esc(d.title)}</div><div class="rv-el" style="background:${ELEM[d.elem].c}">${ELEM[d.elem].n}属性</div><div class="rv-p">「${U.esc(d.profile)}」</div>${RELICS[r.id] ? `<div class="rv-relic">レリック: <b>${U.esc(RELICS[r.id].n)}</b><br><small>${U.esc(RELICS[r.id].desc(relicLevel(r.id)))}</small></div>` : ''}` : `<div class="rv-t">共通カード・${CARD_TYPE[d.type]} ⚡${cardCost(r.id)}</div><div class="rv-p">${U.esc(cardDesc(r.id))}</div>`}${r.res.isNew ? '<div class="rv-new">NEW!</div>' : `<div class="rv-new sub">${U.esc(r.res.text)}</div>`}</div>`;
      parent.appendChild(box);
      if (r.rar === 5) Sound.play('star5'); else Sound.play('star4');
      let done = false;
      const fin = () => { if (done) return; done = true; box.classList.add('out'); setTimeout(() => { box.remove(); res(); }, 250); };
      setTimeout(() => { box.onclick = e => { e.stopPropagation(); fin(); }; this._advance = fin; }, 500);
    }).then(() => { this._advance = null; });
  },
};
