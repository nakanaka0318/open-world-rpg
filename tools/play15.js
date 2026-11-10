const { chromium, devices } = require('playwright');
const SP = process.env.SP;
(async () => {
  const b = await chromium.launch();
  const p = await (await b.newContext({ ...devices['iPhone 13'] })).newPage();
  p.on('pageerror', e => console.log('PAGEERR', e.message, (e.stack || '').split('\n').slice(0, 3).join(' | ')));
  await p.goto('file://' + process.cwd() + '/index.html');
  await p.waitForFunction(() => typeof Game !== 'undefined' && Game.scene === 'title' && UI.stack.length > 0);
  const r = await p.evaluate(async () => {
    UI.pop(UI.stack[0]); buildWorld(); newGame(); Field.init(); Game.scene = 'field';
    for (const k of ['rapidhat', 'viola', 'aurora']) obtainChar(k);
    for (const id in G.roster) G.roster[id].lv = 12; healAll(); Sound.enabled = false;
    const log = [];
    setInterval(() => { if (Battle.onAny) Battle.onAny(); }, 100); ENEMIES.golemk.chp = 5000; Battle.start(['golemk'], { bg: 'ruins', boss: true });
    await new Promise(r => setTimeout(r, 1800));
    log.push('start hand ' + Battle.hand.map(h => h.cid).join(','));
    const ids = ['rapidhat_1', 'rapidhat_2', 'rapidhat_4', 'viola_0', 'viola_4', 'viola_3', 'aurora_3', 'aurora_0'];
    Battle.drawPile.push(...ids.map(cid => ({ u: Battle.uid++, cid })));
    Battle.hand = []; Battle.drawCards(8); Battle.energy = 30; Battle.refresh();
    const play = async cid => { const i = Battle.hand.findIndex(h => h.cid === cid); if (i < 0) return log.push('missing ' + cid); const hp = Battle.enemies[0].hp, php = Battle.P.hp; await Battle.play(i, 0); log.push(`${cid}: boss ${hp}->${Battle.enemies[0].hp} partyHP ${php}->${Battle.P.hp} hand=${Battle.hand.length} combo=${Battle.combo} free=${Battle.P.st.free || 0}`); };
    await play('rapidhat_1'); await play('rapidhat_2');
    const tk = Battle.hand.find(h => h.cid.startsWith('tk_')); if (tk) await play(tk.cid);
    await play('rapidhat_4'); await play('viola_0');
    Battle.P.hp = Math.floor(Battle.P.max * 0.3); await play('viola_4'); await play('viola_3');
    await play('aurora_3');
    // 極光の詠唱を保留してチャージ
    const ach = Battle.hand.find(h => h.cid === 'aurora_0'); if (ach) ach.charge = 2;
    await play('aurora_0');
    return log.join('\n');
  });
  console.log(r);
  await p.screenshot({ path: SP + '/T_battle.png' });
  await b.close();
})();
