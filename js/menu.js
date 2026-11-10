'use strict';
// ===== メインメニュー =====
const CRYSTAL_INFO = {
  wind: { n: '風の水晶', c: '#5ee07a', where: '風の神殿 (西の森)' },
  earth: { n: '大地の水晶', c: '#d9a441', where: '砂の遺跡 (南東の砂漠)' },
  water: { n: '水の水晶', c: '#3da5ff', where: '氷の洞窟 (北東の雪山)' },
  fire: { n: '炎の水晶', c: '#ff6a3d', where: '炎の火山 (東の火山地帯)' },
};

function charLine(c, extra = '') {
  const d = CHARS[c.id], s = charStats(c);
  return `<div class="cl"><img class="clp" src="${portraitURL(d.look)}"><div class="clt"><div class="cln"><span class="rar r${d.rar}">${'★'.repeat(d.rar)}</span> ${U.esc(d.n)} <span class="lb">${c.lb ? c.lb + '凸' : ''}</span></div><div class="cls"><span class="tel" style="color:${ELEM[d.elem].c}">${ELEM[d.elem].n}</span> Lv${c.lv} HP${Math.max(0, c.hp)}/${s.hp} 攻${s.atk} 魔${s.mag}</div></div>${extra}</div>`;
}

const Menu = {
  // 汎用サブ画面
  screen(title, opts = {}) {
    const el = U.el('div', 'layer screen-layer ' + (opts.cls || ''));
    const head = U.el('div', 'sc-head');
    const back = U.el('div', 'sc-back', '◀ もどる');
    head.append(back, U.el('div', 'sc-title', U.esc(title)), U.el('div', 'sc-res', `<span class="gem">◆</span>${G.stones} <span class="gold">G</span>${G.gold}`));
    const body = U.el('div', 'sc-body');
    el.append(head, body);
    const layer = { el, handle: k => { if (layer.menu) layer.menu.handle(k); else if (k === 'b') layer.close(); } };
    layer.body = body;
    layer.close = () => { UI.pop(layer); if (layer.onClosed) layer.onClosed(); };
    back.onclick = e => { e.stopPropagation(); Sound.play('cancel'); layer.close(); };
    UI.push(layer);
    return layer;
  },

  open() {
    return new Promise(res => {
      Sound.play('ok');
      const el = U.el('div', 'layer menu-layer');
      const top = U.el('div', 'mn-top');
      const grid = U.el('div', 'mn-grid');
      const foot = U.el('div', 'mn-foot');
      el.append(top, grid, foot);
      const render = () => {
        top.innerHTML = `<div class="mn-party">${partyChars().map(c => { const d = CHARS[c.id], s = charStats(c); return `<div class="mp-c"><img src="${portraitURL(d.look)}"><div class="mp-n">${U.esc(d.n)}</div><div class="mp-l">Lv${c.lv}</div><div class="bar hp"><i style="width:${100 * Math.max(0, c.hp) / s.hp}%"></i></div></div>`; }).join('')}</div>`;
        foot.innerHTML = `<span class="gem">◆</span>星晶石 ${G.stones}　<span class="gold">G</span> ${G.gold}　⏱ ${fmtTime(G.playtime)}　水晶 ${G.crystals.length}/4`;
      };
      const items = [
        { label: '<span class="mi">👥</span>パーティ', f: () => this.party() },
        { label: '<span class="mi">🃏</span>デッキ', f: () => this.deckEdit() },
        { label: '<span class="mi">🧪</span>どうぐ', f: () => this.items() },
        { label: '<span class="mi gl">✦</span>ガチャ', f: () => Gacha.open(), cls: 'gacha' },
        { label: '<span class="mi">🗺</span>ちず', f: () => this.map() },
        { label: '<span class="mi">📜</span>きろく', f: () => this.records() },
        { label: '<span class="mi">⚙</span>せってい', f: () => this.settings() },
        { label: '<span class="mi">✕</span>とじる', f: null },
      ];
      const done = () => { UI.pop(layer); Game.hud(); res(); };
      const lm = new ListMenu({
        cols: 2, items,
        onSelect: async (i, it) => {
          if (!it.f) { done(); return; }
          lm.locked = true;
          await it.f();
          lm.locked = false;
          if (this.toTitle) { this.toTitle = false; done(); Game.title(); return; }
          render();
        },
        onCancel: done,
      });
      grid.appendChild(lm.el);
      const layer = { el, handle: k => { if (k === 'menu') { Sound.play('cancel'); done(); return; } lm.handle(k); } };
      UI.push(layer);
      render();
    });
  },

  // ---------- 汎用: タブ付きリスト画面 ----------
  // キャラ・アイテム・転移先などが増えても使いやすいように、タブ(絞り込み)・並び替え・スクロールをまとめた部品。
  //  tabs: [{ n, f(item) }]  sorts: [{ n, cmp(a,b) }]  items(): 全項目  label(item): HTML
  //  onSelect(item, ctx): 選択時 (ctx.refresh() で再描画、ctx.close() で閉じる)
  tabList(o) {
    return new Promise(res => {
      const L = this.screen(o.title, { cls: o.cls || '' });
      L.onClosed = res;
      let ti = o.tab || 0, si = 0;
      const bar = U.el('div', 'tl-bar');
      const tabsEl = U.el('div', 'tl-tabs');
      const sortEl = U.el('div', 'tl-sort');
      bar.append(tabsEl);
      if (o.sorts && o.sorts.length > 1) bar.append(sortEl);
      const note = U.el('div', 'sc-note');
      const listEl = U.el('div', 'sc-list');
      L.body.append(bar);
      if (o.note) L.body.append(note);
      L.body.append(listEl);
      let cur = [];
      const ctx = { refresh: (keep = true) => render(keep), close: () => L.close(), L };
      const render = (keep) => {
        const all = o.items();
        const tabs = o.tabs || [{ n: 'すべて' }];
        tabsEl.innerHTML = '';
        tabs.forEach((t, i) => {
          const cnt = all.filter(x => !t.f || t.f(x)).length;
          const c = U.el('div', 'tl-tab' + (i === ti ? ' cur' : '') + (cnt ? '' : ' empty'), U.esc(t.n) + (o.counts !== false ? `<small>${cnt}</small>` : ''));
          c.onclick = e => { e.stopPropagation(); ti = i; Sound.play('cursor'); render(false); };
          tabsEl.appendChild(c);
        });
        const curTab = tabsEl.children[ti];
        if (curTab && curTab.scrollIntoView) try { curTab.scrollIntoView({ block: 'nearest', inline: 'nearest' }); } catch (e) { }
        if (o.sorts) { sortEl.innerHTML = `並び: <b>${U.esc(o.sorts[si].n)}</b> ⇅`; sortEl.onclick = e => { e.stopPropagation(); si = (si + 1) % o.sorts.length; Sound.play('cursor'); render(false); }; }
        const t = tabs[ti];
        cur = all.filter(x => !t.f || t.f(x));
        if (o.sorts) cur = cur.slice().sort(o.sorts[si].cmp);
        let items = cur.map(x => ({ label: o.label(x), disabled: o.disabled ? o.disabled(x) : false }));
        if (o.group) {
          const out = [], map = [];
          let last = null;
          cur.forEach((x, i) => { const g = o.group(x); if (g !== last) { out.push({ sep: true, label: U.esc(g) }); map.push(null); last = g; } out.push(items[i]); map.push(x); });
          items = out; cur = map;
        }
        if (!items.length) { items = [{ label: `<span class="dim">${U.esc(o.empty || 'なにもない')}</span>`, disabled: true }]; cur = [null]; }
        if (!L.menu) {
          L.menu = new ListMenu({
            items,
            onSelect: async i => { const x = cur[i]; if (!x) return; L.menu.locked = true; try { await o.onSelect(x, ctx); } finally { if (L.menu) L.menu.locked = false; } },
            onCancel: () => L.close(),
            onChange: i => { if (o.note) note.innerHTML = cur[i] ? o.note(cur[i]) : ''; },
            onLR: d => { const n = (o.tabs || [1]).length; if (n < 2) return; ti = (ti + (d === 'left' ? n - 1 : 1)) % n; Sound.play('cursor'); render(false); },
          });
          listEl.appendChild(L.menu.el);
        } else { if (!keep) L.menu.i = 0; L.menu.set(items, keep); }
        if (o.note) note.innerHTML = cur[L.menu.i] ? o.note(cur[L.menu.i]) : '';
      };
      const baseHandle = L.handle;
      L.handle = k => { if (k === 'menu' && o.sorts) { si = (si + 1) % o.sorts.length; Sound.play('cursor'); render(false); return; } baseHandle(k); };
      render(false);
    });
  },
  charTabs() {
    return [{ n: 'すべて' }, { n: 'パーティ', f: id => G.party.includes(id) }].concat(['fire', 'water', 'wind', 'earth', 'light', 'dark'].map(e => ({ n: ELEM[e].n, f: id => CHARS[id].elem === e })));
  },
  charSorts() {
    const po = id => { const i = G.party.indexOf(id); return i < 0 ? 99 : i; };
    return [
      { n: '編成順', cmp: (a, b) => po(a) - po(b) || CHARS[b].rar - CHARS[a].rar || G.roster[b].lv - G.roster[a].lv },
      { n: 'レア度', cmp: (a, b) => CHARS[b].rar - CHARS[a].rar || G.roster[b].lv - G.roster[a].lv },
      { n: 'レベル', cmp: (a, b) => G.roster[b].lv - G.roster[a].lv || CHARS[b].rar - CHARS[a].rar },
      { n: '凸数', cmp: (a, b) => G.roster[b].lb - G.roster[a].lb || CHARS[b].rar - CHARS[a].rar },
    ];
  },

  // ---------- パーティ ----------
  party() {
    const tagOf = id => { const pi = G.party.indexOf(id); return pi >= 0 ? `<div class="tag ${pi === 0 ? 'lead' : ''}">${pi === 0 ? 'リーダー' : 'メンバー'}</div>` : '<div class="tag off">控え</div>'; };
    return this.tabList({
      title: `パーティ編成 (仲間 ${Object.keys(G.roster).length}/${Object.keys(CHARS).length})`,
      tabs: this.charTabs(), sorts: this.charSorts(),
      items: () => Object.keys(G.roster),
      label: id => charLine(G.roster[id], tagOf(id)),
      note: () => '◀▶でタブ切替 ／ MENUで並び替え ／ パーティは最大4人',
      onSelect: async (id, ctx) => {
        const inP = G.party.includes(id);
        const opts = ['ステータス・カード', inP ? 'パーティから外す' : 'パーティに入れる', 'リーダーにする', 'もどる'];
        const c = await UI.ask(`${CHARS[id].n} をどうする?`, opts);
        if (c === 0) await this.status(id);
        if (c === 1) {
          if (inP) { if (G.party.length <= 1) { Sound.play('buzz'); UI.toast('最低1人は必要です'); } else G.party = G.party.filter(x => x !== id); }
          else { if (G.party.length >= 4) { const r = await UI.ask('パーティが満員です。\n誰と入れ替えますか?', G.party.map(x => CHARS[x].n)); if (r >= 0) G.party[r] = id; } else G.party.push(id); }
        }
        if (c === 2) { G.party = [id, ...G.party.filter(x => x !== id)].slice(0, 4); UI.toast(`${CHARS[id].n} がリーダーになった!`); }
        ctx.refresh(true);
      },
    });
  },
  // 未所持でも見られる性能プレビュー (ガチャの提供一覧から)
  charPreview(id) {
    return new Promise(res => {
      const d = CHARS[id], own = G.roster[id];
      const c = own || mkChar(id, 1);
      const s = charStats(c);
      const L = this.screen(d.n + ' の性能', { cls: 'status' });
      L.onClosed = res;
      const E = effLB(id, c.lb || 0);
      L.body.innerHTML = `<div class="st-top"><img class="st-port" src="${portraitURL(d.look)}"><div class="st-info"><div class="rar r${d.rar}">${'★'.repeat(d.rar)}${own ? ` <span class="lb">${own.lb}凸</span>` : ' <small class="dim">(未所持)</small>'}</div><div class="st-n">${U.esc(d.n)}</div><div class="st-t">${U.esc(d.title)}</div><div class="st-e"><span style="background:${ELEM[d.elem].c}">${ELEM[d.elem].n}</span> ${U.esc(d.role)}</div><div>${own ? 'Lv ' + own.lv + '(所持中)' : 'Lv1・無凸の性能'}</div></div></div>
      <div class="st-grid">${['hp', 'atk', 'def', 'mag', 'spd'].map(k => `<div><span>${STAT_N[k]}</span><b>${s[k]}</b></div>`).join('')}</div>
      <div class="sc-note">凸の強さ: ${d.rar === 3 ? '3凸で標準、5凸で大幅強化' : d.rar === 4 ? '1凸で標準、5凸で大幅強化' : '凸するほど強化(5凸でコスト2以上のカードが-1)'}${d.gacha || d.limited ? '' : '(ガチャ対象外)'} ／ 現在の相当倍率: カード×${lbCardMul(E).toFixed(2)}</div>
      ${RELICS[id] ? `<div class="st-sec">レリック</div>${relicHTML(id)}` : ''}${ultHTML(id)}
      <div class="st-sec">固有カード</div>
      <div class="deck-grid">${charCards(id).map(cid => cardFaceHTML(cid)).join('')}</div>
      ${charCards(id).map(cid => `<div class="sc-note"><b>${U.esc(CARDS[cid].n)}</b> ⚡${cardCost(cid)} ${U.esc(cardDesc(cid))}</div>`).join('')}
      <div class="st-prof">${U.esc(d.profile)}</div>`;
    });
  },
  status(id) {
    return new Promise(res => {
      const c = G.roster[id], d = CHARS[id], s = charStats(c);
      const L = this.screen(d.n + ' のステータス', { cls: 'status' });
      L.onClosed = res;
      L.body.innerHTML = `<div class="st-top"><img class="st-port" src="${portraitURL(d.look)}"><div class="st-info"><div class="rar r${d.rar}">${'★'.repeat(d.rar)}${c.lb ? ` <span class="lb">${c.lb}凸</span>` : ''}</div><div class="st-n">${U.esc(d.n)}</div><div class="st-t">${U.esc(d.title)}</div><div class="st-e"><span style="background:${ELEM[d.elem].c}">${ELEM[d.elem].n}</span> ${U.esc(d.role)}</div><div>Lv ${c.lv}　EXP ${c.exp}/${expNext(c.lv)}</div></div></div>
      <div class="st-grid">${['hp', 'atk', 'def', 'mag', 'spd'].map(k => `<div><span>${STAT_N[k]}</span><b>${k === 'hp' ? Math.max(0, c.hp) + '/' : ''}${s[k]}</b></div>`).join('')}</div>
      ${RELICS[id] ? `<div class="st-sec">レリック <small class="dim">(パーティにいると戦闘中に発動。凸で強化)</small></div>${relicHTML(id)}` : ''}${ultHTML(id)}
      <div class="st-sec">固有カード <small class="dim">(凸で強化。5凸でコスト2以上が-1)</small></div>
      <div class="deck-grid">${charCards(id).map(cid => cardFaceHTML(cid)).join('')}</div>
      <div class="st-prof">${U.esc(d.profile)}</div>`;
    });
  },

  // ---------- デッキ ----------
  // パーティ4人×固有5枚 + 共通カード5枚 = 25枚。共通カードの5枠をここで入れ替えます。
  deckEdit() {
    return new Promise(res => {
      const L = this.screen('デッキ編成');
      L.onClosed = res;
      const slotsEl = U.el('div', 'sc-list');
      const prev = U.el('div', '');
      L.body.append(U.el('div', 'sc-note', '共通カードの枠を選ぶと入れ替えられます。同じカードは1枚まで。<br>パーティが4人未満だと、空き枠は「空白のカード」(効果なし)になります。'), slotsEl, prev);
      const render = (keep) => {
        G.deck = (G.deck || STARTER_DECK.slice()).slice(0, 5);
        const items = G.deck.map((cid, i) => ({ label: `<span class="slt">共通${i + 1}</span><span class="rar r${CARDS[cid].rar}">★${CARDS[cid].rar}</span> ${U.esc(CARDS[cid].n)}${cardLevel(cid) ? ` <b class="lb">+${cardLevel(cid)}</b>` : ''} <small class="eqst">⚡${cardCost(cid)} ${U.esc(cardDesc(cid))}</small>` }));
        if (!L.menu) { L.menu = new ListMenu({ items, onSelect: i => pick(i), onCancel: () => L.close() }); slotsEl.appendChild(L.menu.el); }
        else L.menu.set(items, keep);
        let html = '';
        for (let i = 0; i < 4; i++) {
          const c = partyChars()[i];
          html += `<div class="st-sec">${c ? U.esc(CHARS[c.id].n) + 'の固有カード' : '空き枠'}</div><div class="deck-grid">${(c ? charCards(c.id) : ['blank', 'blank', 'blank', 'blank', 'blank']).map(cid => cardFaceHTML(cid)).join('')}</div>`;
        }
        html += `<div class="st-sec">共通カード</div><div class="deck-grid">${G.deck.map(cid => cardFaceHTML(cid)).join('')}</div>`;
        prev.innerHTML = html;
      };
      const pick = async (slot) => {
        const cur = G.deck[slot];
        const chosen = await new Promise(r2 => {
          let got = null;
          this.tabList({
            title: `共通${slot + 1} に入れるカード`,
            tabs: [{ n: 'すべて' }, { n: 'アタック', f: k => CARDS[k].type === 'a' }, { n: 'スキル', f: k => CARDS[k].type === 's' }, { n: '★5', f: k => CARDS[k].rar === 5 }, { n: '★4', f: k => CARDS[k].rar === 4 }, { n: '★3', f: k => CARDS[k].rar === 3 }],
            sorts: [{ n: 'レア度', cmp: (a, b) => CARDS[b].rar - CARDS[a].rar || cardCost(a) - cardCost(b) }, { n: 'コスト', cmp: (a, b) => cardCost(a) - cardCost(b) || CARDS[b].rar - CARDS[a].rar }],
            items: () => Object.keys(G.cards).filter(k => CARDS[k]),
            label: k => `<span class="rar r${CARDS[k].rar}">★${CARDS[k].rar}</span> ${U.esc(CARDS[k].n)}${cardLevel(k) ? ` <b class="lb">+${cardLevel(k)}</b>` : ''} <small class="eqst">⚡${cardCost(k)} ${U.esc(cardDesc(k))}</small>${k === cur ? '<span class="tag lead">この枠</span>' : G.deck.includes(k) ? '<span class="tag">使用中</span>' : ''}`,
            note: k => cardFaceHTML(k, { cls: 'big' }),
            onSelect: async (k, ctx) => { got = k; ctx.close(); },
          }).then(() => r2(got));
        });
        if (chosen && chosen !== cur) {
          const j = G.deck.indexOf(chosen);
          if (j >= 0) G.deck[j] = cur;
          G.deck[slot] = chosen;
          Sound.play('ok');
        }
        render(true);
      };
      render();
    });
  },

  // ---------- どうぐ ----------
  items() {
    return this.tabList({
      title: 'どうぐ',
      tabs: ITEM_CATS.map(([k, n]) => ({ n, f: k === 'all' ? null : id => (ITEMS[id].cat || 'heal') === k })),
      sorts: [{ n: '種類順', cmp: (a, b) => Object.keys(ITEMS).indexOf(a) - Object.keys(ITEMS).indexOf(b) }, { n: '所持数', cmp: (a, b) => G.items[b] - G.items[a] }],
      items: () => Object.keys(G.items).filter(k => G.items[k] > 0 && ITEMS[k]),
      label: id => `${U.esc(ITEMS[id].n)}<span class="mpc">×${G.items[id]}</span>`,
      note: id => U.esc(ITEMS[id].desc),
      empty: 'なにも持っていない',
      onSelect: async (id, ctx) => {
        const it = ITEMS[id];
        const pc = partyChars();
        if (it.type === 'mp' || it.type === 'cure') { Sound.play('buzz'); UI.toast('戦闘中に使うアイテムです'); return; }
        const r = await UI.ask(`${it.n} をだれに使う?`, pc.map(c => { const s = charStats(c); return `${CHARS[c.id].n}  HP${Math.max(0, c.hp)}/${s.hp}`; }));
        if (r < 0) return;
        const c = pc[r], s = charStats(c);
        let ok = true;
        if (it.type === 'heal') { if (c.hp <= 0 || c.hp >= s.hp) ok = false; else c.hp = Math.min(s.hp, c.hp + it.amt); }
        else if (it.type === 'revive') { if (c.hp >= s.hp) ok = false; else c.hp = Math.min(s.hp, c.hp + Math.round(s.hp * it.amt)); }
        else if (it.type === 'full') { c.hp = s.hp; }
        else ok = false;
        if (!ok) { Sound.play('buzz'); UI.toast('効果がない'); return; }
        useItemCount(id);
        Sound.play('heal');
        UI.toast(`${CHARS[c.id].n} に ${it.n} を使った!`);
        ctx.refresh(true);
      },
    });
  },

  // ---------- 転移 ----------
  teleport(fromId) {
    const GN = { town: '町', gate: 'ダンジョン入口', dungeon: 'ダンジョン内', field: '野外', hut: '小屋' };
    const order = Object.keys(GN);
    let chosen = null;
    return this.tabList({
      title: '転移先をえらぶ',
      tabs: [{ n: 'すべて' }].concat(order.map(g => ({ n: GN[g], f: s => s.group === g }))),
      items: () => WORLD.objs.saves.filter(s => G.saves[s.id]),
      sorts: [{ n: '種類順', cmp: (a, b) => order.indexOf(a.group) - order.indexOf(b.group) || a.name.localeCompare(b.name, 'ja') }, { n: '近い順', cmp: (a, b) => (Math.abs(a.x - Field.p.x) + Math.abs(a.y - Field.p.y)) - (Math.abs(b.x - Field.p.x) + Math.abs(b.y - Field.p.y)) }],
      group: s => GN[s.group] || 'その他',
      label: s => `<span class="tp">◆</span>${U.esc(s.name)}${s.id === fromId ? ' <span class="tag off">現在地</span>' : ''}`,
      disabled: s => s.id === fromId,
      note: s => `距離 ${Math.abs(s.x - Field.p.x) + Math.abs(s.y - Field.p.y)} 歩 ／ 登録数 ${Object.keys(G.saves).length}/${WORLD.objs.saves.length}`,
      empty: 'まだ転移先がない',
      onSelect: async (s, ctx) => { chosen = s; ctx.close(); },
    }).then(() => chosen);
  },

  // ---------- 地図 ----------
  map() {
    return new Promise(res => {
      const L = this.screen('ワールドマップ', { cls: 'mapscr' });
      L.onClosed = () => { clearInterval(timer); res(); };
      // 地形は1マス1ピクセルで一度だけ描き、印だけを上に重ねる
      const base = mkCanvas(MW, MH), bx = base.getContext('2d');
      const img = bx.createImageData(MW, MH), px = img.data;
      const rgb = {};
      const col = h => rgb[h] || (rgb[h] = U.hex2rgb(h));
      for (let i = 0; i < MW * MH; i++) {
        let c = [10, 10, 24];
        if (G.explored[i]) {
          const r = WORLD.region[i];
          c = col(r ? ({ house: '#c0473a', dungeon: '#7a5aaa' }[WORLD.regions[r].type] || '#000') : (TILE_DEFS[WORLD.tiles[i]].map || '#000'));
        }
        px[i * 4] = c[0]; px[i * 4 + 1] = c[1]; px[i * 4 + 2] = c[2]; px[i * 4 + 3] = 255;
      }
      bx.putImageData(img, 0, 0);
      const SC = 2;
      const cv = mkCanvas(MW * SC, MH * SC);
      cv.className = 'wmap';
      const x = cv.getContext('2d');
      const draw = (blink) => {
        x.imageSmoothingEnabled = false;
        x.drawImage(base, 0, 0, MW * SC, MH * SC);
        for (const s of WORLD.structs) {
          const cx = (s.x + s.w / 2) * SC, cy = (s.y + s.h / 2) * SC;
          if (!G.explored[Math.floor(s.y + s.h / 2) * MW + Math.floor(s.x + s.w / 2)] && !G.explored[(s.y + s.h) * MW + Math.floor(s.x + s.w / 2)]) continue;
          x.fillStyle = s.kind === 'dungeon' ? (G.bosses[s.id] ? '#ffe66d' : '#ff5a8a') : '#ffffff';
          x.beginPath(); x.arc(cx, cy, 5, 0, Math.PI * 2); x.fill();
          x.strokeStyle = '#181425'; x.lineWidth = 2; x.stroke();
        }
        for (const sv of WORLD.objs.saves) if (G.saves[sv.id]) { x.fillStyle = '#5ac8f0'; x.fillRect(sv.x * SC - 2, sv.y * SC - 2, 5, 5); }
        if (blink) { x.fillStyle = '#ff3b3b'; x.fillRect(Field.p.x * SC - 4, Field.p.y * SC - 4, 9, 9); x.fillStyle = '#fff'; x.fillRect(Field.p.x * SC - 2, Field.p.y * SC - 2, 5, 5); }
      };
      let bl = true; draw(bl);
      const timer = setInterval(() => { bl = !bl; draw(bl); }, 450);
      const legend = U.el('div', 'map-legend', `<span><i style="background:#fff"></i>町・小屋</span><span><i style="background:#ff5a8a"></i>ダンジョン</span><span><i style="background:#ffe66d"></i>攻略済み</span><span><i style="background:#5ac8f0"></i>転移クリスタル</span><span><i style="background:#ff3b3b"></i>現在地</span>`);
      let explored = 0, land = 0;
      for (let i = 0; i < MW * MH; i++) { if (WORLD.biome[i]) { land++; if (G.explored[i]) explored++; } }
      const tp = U.el('div', 'btn', '転移する');
      tp.onclick = async e => {
        e.stopPropagation();
        const s = await this.teleport(null);
        if (!s) return;
        L.close();
        Sound.play('magic');
        await UI.fade('#fff', 300, 100, 300, () => {
          for (const [dx, dy] of [[0, 1], [1, 0], [-1, 0], [0, -1]]) if (Field.walkable(s.x + dx, s.y + dy)) { Field.teleport(s.x + dx, s.y + dy, 'u'); break; }
        });
        Game.autoSave();
      };
      const row = U.el('div', 'map-row');
      row.append(U.el('div', 'sc-note', `探索率 ${Math.min(100, Math.round(explored / Math.max(1, land) * 100))}%　現在地: ${U.esc(Field.locName)}`), tp);
      L.body.append(cv, legend, row);
    });
  },

  // ---------- 記録 ----------
  records() {
    return new Promise(res => {
      const L = this.screen('冒険のきろく');
      L.onClosed = res;
      const opened = Object.keys(G.chests).length, total = WORLD.objs.chests.length;
      const cr = Object.keys(CRYSTAL_INFO).map(k => `<div class="cr ${G.crystals.includes(k) ? 'got' : ''}"><div class="crg" style="--cc:${CRYSTAL_INFO[k].c}"></div><div><b>${CRYSTAL_INFO[k].n}</b><br><small>${CRYSTAL_INFO[k].where}</small></div></div>`).join('');
      const dl = WORLD.structs.filter(s => s.kind === 'dungeon').map(s => `<div class="dl ${G.bosses[s.id] ? 'done' : ''}"><span>${U.esc(s.name)}</span><span>推奨Lv${s.lv}</span><b>${G.bosses[s.id] ? '攻略済み' : '未攻略'}</b></div>`).join('');
      L.body.innerHTML = `<div class="st-sec">封印の水晶 ${G.crystals.length}/4</div><div class="crs">${cr}</div>
      <div class="sc-note obj">${U.esc(Story.objective())}</div>${G.flags.cleared ? `<div class="sc-note">星界の塔 最高到達 ${(G.tower && G.tower.best) || 0}階${Tower.title() ? ' ／ 称号「' + U.esc(Tower.title()) + '」' : ''}</div>` : ''}
      <div class="st-sec">ダンジョン</div>${dl}
      <div class="st-sec">データ</div><div class="st-grid"><div><span>プレイ時間</span><b>${fmtTime(G.playtime)}</b></div><div><span>宝箱</span><b>${opened}/${total}</b></div><div><span>仲間</span><b>${Object.keys(G.roster).length}/${Object.keys(CHARS).length}</b></div><div><span>召喚回数</span><b>${G.gacha.total}</b></div><div><span>星界の塔</span><b>最高${(G.tower && G.tower.best) || 0}階</b></div><div><span>カード</span><b>${Object.keys(G.cards || {}).length}/${Object.keys(COMMON_CARDS).length}</b></div><div><span>隠し宝</span><b>${Object.keys(G.hidden).length}/${WORLD.objs.hidden.length}</b></div></div>`;
    });
  },

  // ---------- 設定 ----------
  settings() {
    return new Promise(res => {
      const L = this.screen('せってい');
      L.onClosed = res;
      const render = () => {
        const items = [
          { label: `BGM: <b>${Sound.music ? 'ON' : 'OFF'}</b>` },
          { label: `効果音: <b>${Sound.enabled ? 'ON' : 'OFF'}</b>` },
          { label: `タッチパッド: <b>${document.body.classList.contains('touch') ? '表示' : '非表示'}</b>` },
          { label: 'タイトルへもどる' },
          { label: '<span class="dim">デバッグ:</span> 星晶石 +10000' },
        ];
        if (L.menu) L.menu.set(items, true);
        else { L.menu = new ListMenu({ items, onSelect: sel, onCancel: () => L.close() }); L.body.appendChild(L.menu.el); L.body.appendChild(U.el('div', 'sc-note', '操作: 移動=矢印/WASD　決定=Z/Enter　キャンセル/ダッシュ=X/Shift　メニュー=C<br>セーブは各地のクリスタルで行えます。')); }
      };
      const sel = async (i) => {
        if (i === 0) Sound.setMusic(!Sound.music);
        if (i === 1) Sound.setSfx(!Sound.enabled);
        if (i === 2) { document.body.classList.toggle('touch'); Input.touch = document.body.classList.contains('touch'); Game.resize(); }
        if (i === 4) { G.stones += 10000; Sound.play('star5'); Game.hud(); Game.autoSave(true); UI.toast('デバッグ: 星晶石 +10000'); }
        if (i === 3) {
          L.menu.locked = true;
          const c = await UI.ask('タイトルへもどりますか?\n(セーブしていない進行は失われます)', ['もどる', 'やめる']);
          L.menu.locked = false;
          if (c === 0) { this.toTitle = true; L.close(); return; }
        }
        try { localStorage.setItem('seishou_opts', JSON.stringify({ m: Sound.music, s: Sound.enabled })); } catch (e) { }
        render();
      };
      render();
    });
  },
};
