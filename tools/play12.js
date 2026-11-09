const { chromium, devices } = require('playwright');
const SP = process.env.SP;
(async () => {
  const b = await chromium.launch();
  const p = await (await b.newContext({ ...devices['iPhone 13'] })).newPage();
  p.on('pageerror', e => console.log('PAGEERR', e.message, (e.stack || '').split('\n').slice(0, 3).join(' | ')));
  await p.goto('file://' + process.cwd() + '/index.html');
  await p.waitForTimeout(600);
  const r = await p.evaluate(async () => {
    UI.pop(UI.stack[0]); buildWorld(); newGame(); Field.init(); Game.scene = 'field';
    for (const k of ['kanae', 'lumia', 'misuzu']) obtainChar(k);
    for (const id in G.roster) G.roster[id].lv = 8; healAll(); Sound.enabled = false;
    const log = [];
    Battle.start(['golemk'], { bg: 'ruins', boss: true });
    await new Promise(r => setTimeout(r, 1800));
    // 奉仕カードを全部使ってから成果を使う
    Battle.drawPile.push(...['kanae_0', 'kanae_1', 'kanae_3', 'kanae_4', 'misuzu_3', 'misuzu_1', 'misuzu_2', 'misuzu_4'].map(cid => ({ u: Battle.uid++, cid })));
    Battle.hand = []; Battle.drawCards(10); Battle.energy = 20; Battle.refresh();
    const playId = async cid => { const i = Battle.hand.findIndex(h => h.cid === cid); if (i < 0) return log.push('missing ' + cid); const before = Battle.enemies[0].hp; await Battle.play(i, 0); log.push(cid + ': boss ' + before + '->' + Battle.enemies[0].hp + ' serve=' + (Battle.P.st.serve || 0) + ' gained=' + Battle.P.gained + ' devote=' + (Battle.P.st.devote || 0)); };
    for (const c of ['kanae_0', 'kanae_1', 'kanae_3']) await playId(c);
    await playId('kanae_4');
    await playId('misuzu_3');
    await playId('misuzu_1');
    await playId('misuzu_2');
    await playId('misuzu_4');
    return log.join('\n');
  });
  console.log(r);
  await p.screenshot({ path: SP + '/N_battle.png' });
  await p.evaluate(() => { for (const l of UI.stack.slice()) UI.pop(l); Battle.active = false; Game.scene = 'field'; Gacha.open('pickup'); });
  await p.waitForTimeout(500);
  await p.screenshot({ path: SP + '/N_gacha.png' });
  await p.locator('.g-pubtn').click(); await p.waitForTimeout(400);
  await p.screenshot({ path: SP + '/N_pick.png' });
  await b.close();
})();
