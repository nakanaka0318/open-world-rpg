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
  return `<div class="cl"><img class="clp" src="${portraitURL(d.look)}"><div class="clt"><div class="cln"><span class="rar r${d.rar}">${'★'.repeat(d.rar)}</span> ${U.esc(d.n)} <span class="lb">${c.lb ? c.lb + '凸' : ''}</span></div><div class="cls"><span class="tel" style="color:${ELEM[d.elem].c}">${ELEM[d.elem].n}</span> Lv${c.lv} HP${Math.max(0, c.hp)}/${s.hp} MP${c.mp}/${s.mp}</div></div>${extra}</div>`;
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
        top.innerHTML = `<div class="mn-party">${partyChars().map(c => { const d = CHARS[c.id], s = charStats(c); return `<div class="mp-c"><img src="${portraitURL(d.look)}"><div class="mp-n">${U.esc(d.n)}</div><div class="mp-l">Lv${c.lv}</div><div class="bar hp"><i style="width:${100 * Math.max(0, c.hp) / s.hp}%"></i></div><div class="bar mp"><i style="width:${100 * c.mp / Math.max(1, s.mp)}%"></i></div></div>`; }).join('')}</div>`;
        foot.innerHTML = `<span class="gem">◆</span>星晶石 ${G.stones}　<span class="gold">G</span> ${G.gold}　⏱ ${fmtTime(G.playtime)}　水晶 ${G.crystals.length}/4`;
      };
      const items = [
        { label: '<span class="mi">👥</span>パーティ', f: () => this.party() },
        { label: '<span class="mi">🗡</span>そうび', f: () => this.equipPick() },
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

  // ---------- パーティ ----------
  party() {
    return new Promise(res => {
      const L = this.screen('パーティ編成');
      L.onClosed = res;
      const info = U.el('div', 'sc-note', 'キャラを選んで 編成・リーダー変更・装備ができます (最大4人)');
      const listEl = U.el('div', 'sc-list');
      L.body.append(info, listEl);
      const render = (keep) => {
        const ids = Object.keys(G.roster).sort((a, b) => {
          const pa = G.party.indexOf(a), pb = G.party.indexOf(b);
          if (pa >= 0 || pb >= 0) return (pa < 0 ? 99 : pa) - (pb < 0 ? 99 : pb);
          return CHARS[b].rar - CHARS[a].rar || G.roster[b].lv - G.roster[a].lv;
        });
        L.ids = ids;
        const items = ids.map(id => {
          const pi = G.party.indexOf(id);
          return { label: charLine(G.roster[id], pi >= 0 ? `<div class="tag ${pi === 0 ? 'lead' : ''}">${pi === 0 ? 'リーダー' : 'メンバー'}</div>` : '<div class="tag off">控え</div>') };
        });
        if (!L.menu) {
          L.menu = new ListMenu({ items, onSelect: (i) => act(L.ids[i]), onCancel: () => L.close() });
          listEl.appendChild(L.menu.el);
        } else L.menu.set(items, keep);
      };
      const act = async (id) => {
        const inP = G.party.includes(id);
        const opts = ['ステータス', inP ? 'パーティから外す' : 'パーティに入れる', 'リーダーにする', 'そうび', 'もどる'];
        L.menu.locked = true;
        const c = await UI.ask(`${CHARS[id].n} をどうする?`, opts);
        L.menu.locked = false;
        if (c === 0) await this.status(id);
        if (c === 1) {
          if (inP) { if (G.party.length <= 1) { Sound.play('buzz'); UI.toast('最低1人は必要です'); } else G.party = G.party.filter(x => x !== id); }
          else { if (G.party.length >= 4) { const r = await UI.ask('パーティが満員です。\n誰と入れ替えますか?', G.party.map(x => CHARS[x].n)); if (r >= 0) G.party[r] = id; } else G.party.push(id); }
        }
        if (c === 2) { if (!inP) { if (G.party.length >= 4) G.party[3] = G.party[0]; else G.party.push(G.party[0]); G.party[0] = id; G.party = [...new Set(G.party)]; } else { G.party = [id, ...G.party.filter(x => x !== id)]; } UI.toast(`${CHARS[id].n} がリーダーになった!`); }
        if (c === 3) await this.equip(id);
        render(true);
      };
      render();
    });
  },
  status(id) {
    return new Promise(res => {
      const c = G.roster[id], d = CHARS[id], s = charStats(c);
      const L = this.screen(d.n + ' のステータス', { cls: 'status' });
      L.onClosed = res;
      const sk = charSkills(c);
      const next = d.skills.filter(x => x[0] > c.lv).slice(0, 2);
      L.body.innerHTML = `<div class="st-top"><img class="st-port" src="${portraitURL(d.look)}"><div class="st-info"><div class="rar r${d.rar}">${'★'.repeat(d.rar)}${c.lb ? ` <span class="lb">${c.lb}凸</span>` : ''}</div><div class="st-n">${U.esc(d.n)}</div><div class="st-t">${U.esc(d.title)}</div><div class="st-e"><span style="background:${ELEM[d.elem].c}">${ELEM[d.elem].n}</span> ${U.esc(d.role)}</div><div>Lv ${c.lv}　EXP ${c.exp}/${expNext(c.lv)}</div></div></div>
      <div class="st-grid">${['hp', 'mp', 'atk', 'def', 'mag', 'spd'].map(k => `<div><span>${STAT_N[k]}</span><b>${k === 'hp' ? Math.max(0, c.hp) + '/' : k === 'mp' ? c.mp + '/' : ''}${s[k]}</b></div>`).join('')}</div>
      <div class="st-sec">そうび</div><div class="st-eq">${['w', 'a', 'x'].map(sl => `<div><span>${SLOT_N[sl]}</span>${c.eq[sl] ? `<img src="${equipIconURL(c.eq[sl])}">${U.esc(equipName(c.eq[sl]))}` : '―'}</div>`).join('')}</div>
      <div class="st-sec">スキル</div><div class="st-sk">${sk.map(k => `<div><b>${U.esc(SKILLS[k].n)}</b> <span class="mpc">MP${SKILLS[k].mp}</span><br><small>${U.esc(SKILLS[k].desc || '')}</small></div>`).join('')}${next.map(x => `<div class="lock">Lv${x[0]}で習得: ${U.esc(SKILLS[x[1]].n)}</div>`).join('')}</div>
      <div class="st-prof">${U.esc(d.profile)}</div>`;
    });
  },

  // ---------- 装備 ----------
  equipPick() {
    return new Promise(async res => {
      const ids = G.party.concat(Object.keys(G.roster).filter(k => !G.party.includes(k)));
      const L = this.screen('そうび: キャラを選ぶ');
      L.onClosed = res;
      const lm = new ListMenu({ items: ids.map(id => ({ label: charLine(G.roster[id]) })), onSelect: async i => { lm.locked = true; await this.equip(ids[i]); lm.locked = false; lm.set(ids.map(id => ({ label: charLine(G.roster[id]) })), true); }, onCancel: () => L.close() });
      L.menu = lm;
      L.body.appendChild(lm.el);
    });
  },
  equip(id) {
    return new Promise(res => {
      const c = G.roster[id];
      const L = this.screen(CHARS[id].n + ' のそうび');
      L.onClosed = res;
      const statEl = U.el('div', 'eq-stats');
      const listEl = U.el('div', 'sc-list');
      L.body.append(statEl, listEl);
      const showStats = (prev) => {
        const s = charStats(c);
        statEl.innerHTML = ['hp', 'mp', 'atk', 'def', 'mag', 'spd'].map(k => {
          const v = prev ? prev[k] : s[k];
          const diff = v - s[k];
          return `<div><span>${STAT_N[k]}</span><b>${v}</b>${diff ? `<i class="${diff > 0 ? 'up' : 'down'}">${diff > 0 ? '+' : ''}${diff}</i>` : ''}</div>`;
        }).join('') + `<div class="eq-elem">攻撃属性: <b style="color:${ELEM[(prev || s).elem].c}">${ELEM[(prev || s).elem].n}</b></div>`;
      };
      let mode = 'slot', slot = null, eqList = [];
      const slots = () => {
        mode = 'slot';
        const items = ['w', 'a', 'x'].map(sl => ({ label: `<span class="slt">${SLOT_N[sl]}</span>${c.eq[sl] ? `<img class="ico" src="${equipIconURL(c.eq[sl])}"><span class="rar r${EQUIPS[c.eq[sl]].rar}">★${EQUIPS[c.eq[sl]].rar}</span> ${U.esc(equipName(c.eq[sl]))}` : '<span class="dim">― なし ―</span>'}` }));
        if (L.menu) L.menu.set(items); else { L.menu = new ListMenu({ items, onSelect: (i) => mode === 'slot' ? pick(['w', 'a', 'x'][i]) : choose(i), onCancel: () => mode === 'slot' ? L.close() : slots(), onChange: (i) => { if (mode === 'eq') preview(i); } }); listEl.appendChild(L.menu.el); }
        L.menu.i = 0; L.menu.mark();
        showStats();
      };
      const preview = (i) => {
        const eid = eqList[i];
        const old = c.eq[slot]; c.eq[slot] = eid; const s = charStats(c); c.eq[slot] = old;
        showStats(s);
      };
      const pick = (sl) => {
        mode = 'eq'; slot = sl;
        eqList = [null].concat(Object.keys(G.equips).filter(k => EQUIPS[k].slot === sl).sort((a, b) => EQUIPS[b].rar - EQUIPS[a].rar));
        const items = eqList.map(eid => {
          if (!eid) return { label: '<span class="dim">はずす</span>' };
          const e = EQUIPS[eid], who = equippedBy(eid);
          return { label: `<img class="ico" src="${equipIconURL(eid)}"><span class="rar r${e.rar}">★${e.rar}</span> ${U.esc(equipName(eid))} <small class="eqst">${Object.entries(e.st).map(([k, v]) => STAT_N[k] + '+' + v).join(' ')}${e.elem ? ' ' + ELEM[e.elem].n + '属性' : ''}</small>${who ? `<span class="tag ${who === id ? 'lead' : ''}">${who === id ? '装備中' : U.esc(CHARS[who].n)}</span>` : ''}` };
        });
        L.menu.set(items);
        L.menu.i = Math.max(0, eqList.indexOf(c.eq[sl])); L.menu.mark();
      };
      const choose = (i) => {
        const eid = eqList[i];
        if (eid) { const who = equippedBy(eid); if (who && who !== id) G.roster[who].eq[slot] = null; }
        c.eq[slot] = eid;
        const s = charStats(c); c.hp = Math.min(c.hp, s.hp); c.mp = Math.min(c.mp, s.mp);
        slots();
      };
      slots();
    });
  },

  // ---------- どうぐ ----------
  items() {
    return new Promise(res => {
      const L = this.screen('どうぐ');
      L.onClosed = res;
      const desc = U.el('div', 'sc-note', '');
      const listEl = U.el('div', 'sc-list');
      L.body.append(desc, listEl);
      let ids = [];
      const render = () => {
        ids = Object.keys(G.items).filter(k => G.items[k] > 0);
        const items = ids.length ? ids.map(k => ({ label: `${U.esc(ITEMS[k].n)}<span class="mpc">×${G.items[k]}</span>` })) : [{ label: '<span class="dim">なにも持っていない</span>', disabled: true }];
        if (!L.menu) { L.menu = new ListMenu({ items, onSelect: i => use(ids[i]), onCancel: () => L.close(), onChange: i => { desc.textContent = ids[i] ? ITEMS[ids[i]].desc : ''; } }); listEl.appendChild(L.menu.el); }
        else L.menu.set(items, true);
        desc.textContent = ids[L.menu.i] ? ITEMS[ids[L.menu.i]].desc : '';
      };
      const use = async (id) => {
        const it = ITEMS[id];
        const pc = partyChars();
        L.menu.locked = true;
        const r = await UI.ask(`${it.n} をだれに使う?`, pc.map(c => { const s = charStats(c); return `${CHARS[c.id].n}  HP${Math.max(0, c.hp)}/${s.hp} MP${c.mp}/${s.mp}`; }));
        L.menu.locked = false;
        if (r < 0) return;
        const c = pc[r], s = charStats(c);
        let ok = true;
        if (it.type === 'heal') { if (c.hp <= 0 || c.hp >= s.hp) ok = false; else c.hp = Math.min(s.hp, c.hp + it.amt); }
        else if (it.type === 'mp') { if (c.hp <= 0 || c.mp >= s.mp) ok = false; else c.mp = Math.min(s.mp, c.mp + it.amt); }
        else if (it.type === 'cure') { if (!c.st || !c.st.poison) ok = false; else delete c.st.poison; }
        else if (it.type === 'revive') { if (c.hp > 0) ok = false; else c.hp = Math.round(s.hp * it.amt); }
        else if (it.type === 'full') { c.hp = s.hp; c.mp = s.mp; }
        if (!ok) { Sound.play('buzz'); UI.toast('効果がない'); return; }
        useItemCount(id);
        Sound.play('heal');
        UI.toast(`${CHARS[c.id].n} に ${it.n} を使った!`);
        render();
      };
      render();
    });
  },

  // ---------- 地図 ----------
  map() {
    return new Promise(res => {
      const L = this.screen('ワールドマップ', { cls: 'mapscr' });
      L.onClosed = () => { clearInterval(timer); res(); };
      const c = mkCanvas(MW * 2, MH * 2);
      c.className = 'wmap';
      const x = c.getContext('2d');
      const draw = (blink) => {
        x.fillStyle = '#0a0a18'; x.fillRect(0, 0, c.width, c.height);
        for (let ty = 0; ty < MH; ty++) for (let tx = 0; tx < MW; tx++) {
          const i = ty * MW + tx;
          if (!G.explored[i]) continue;
          const r = WORLD.region[i];
          let col = TILE_DEFS[WORLD.tiles[i]].map || '#000';
          if (r) col = { house: '#c0473a', dungeon: '#7a5aaa' }[WORLD.regions[r].type] || col;
          x.fillStyle = col; x.fillRect(tx * 2, ty * 2, 2, 2);
        }
        for (const s of WORLD.structs) {
          if (!G.explored[(s.y + (s.h >> 1)) * MW + s.x + (s.w >> 1)] && !G.explored[(s.y + s.h - 1) * MW + s.x + (s.w >> 1)]) continue;
          const cx = (s.x + s.w / 2) * 2, cy = (s.y + s.h / 2) * 2;
          const done = G.bosses[s.id];
          x.fillStyle = s.kind === 'dungeon' ? (done ? '#ffe66d' : '#ff5a8a') : '#ffffff';
          x.beginPath(); x.arc(cx, cy, 4, 0, Math.PI * 2); x.fill();
          x.strokeStyle = '#181425'; x.lineWidth = 1.5; x.stroke();
        }
        for (const sv of WORLD.objs.saves) if (G.saves[sv.id]) { x.fillStyle = '#5ac8f0'; x.fillRect(sv.x * 2 - 1, sv.y * 2 - 1, 3, 3); }
        if (blink) { x.fillStyle = '#ff3b3b'; x.fillRect(Field.p.x * 2 - 2, Field.p.y * 2 - 2, 5, 5); x.fillStyle = '#fff'; x.fillRect(Field.p.x * 2 - 1, Field.p.y * 2 - 1, 3, 3); }
      };
      let b = true; draw(b);
      const timer = setInterval(() => { b = !b; draw(b); }, 400);
      const legend = U.el('div', 'map-legend', `<span><i style="background:#fff"></i>町</span><span><i style="background:#ff5a8a"></i>ダンジョン</span><span><i style="background:#ffe66d"></i>攻略済み</span><span><i style="background:#5ac8f0"></i>セーブ</span><span><i style="background:#ff3b3b"></i>現在地</span>`);
      const explored = G.explored.reduce((a, v) => a + v, 0);
      const land = WORLD.biome.reduce((a, v) => a + (v ? 1 : 0), 0);
      L.body.append(c, legend, U.el('div', 'sc-note', `探索率 ${Math.min(100, Math.round(explored / land * 100))}%　現在地: ${U.esc(Field.locName)}`));
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
      <div class="sc-note obj">${U.esc(Story.objective())}</div>
      <div class="st-sec">ダンジョン</div>${dl}
      <div class="st-sec">データ</div><div class="st-grid"><div><span>プレイ時間</span><b>${fmtTime(G.playtime)}</b></div><div><span>宝箱</span><b>${opened}/${total}</b></div><div><span>仲間</span><b>${Object.keys(G.roster).length}/${Object.keys(CHARS).length}</b></div><div><span>召喚回数</span><b>${G.gacha.total}</b></div><div><span>武具</span><b>${Object.keys(G.equips).length}/${Object.keys(EQUIPS).length}</b></div><div><span>隠し宝</span><b>${Object.keys(G.hidden).length}/${WORLD.objs.hidden.length}</b></div></div>`;
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
        ];
        if (L.menu) L.menu.set(items, true);
        else { L.menu = new ListMenu({ items, onSelect: sel, onCancel: () => L.close() }); L.body.appendChild(L.menu.el); L.body.appendChild(U.el('div', 'sc-note', '操作: 移動=矢印/WASD　決定=Z/Enter　キャンセル/ダッシュ=X/Shift　メニュー=C<br>セーブは各地のクリスタルで行えます。')); }
      };
      const sel = async (i) => {
        if (i === 0) Sound.setMusic(!Sound.music);
        if (i === 1) Sound.setSfx(!Sound.enabled);
        if (i === 2) { document.body.classList.toggle('touch'); Input.touch = document.body.classList.contains('touch'); Game.resize(); }
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
