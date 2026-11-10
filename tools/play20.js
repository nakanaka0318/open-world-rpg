// 奥義ゲージと新キャラのテスト
const { chromium, devices } = require('playwright');
const SP = process.env.SP || '.';
(async () => {
  const b = await chromium.launch();
  const p = await (await b.newContext({ ...devices['iPhone 13'] })).newPage();
  p.on('pageerror', e => console.log('PAGEERR', e.message));
  p.on('console', m => { if (m.type() === 'error') console.log('CONSOLE', m.text()); });
  await p.goto('file://' + process.cwd() + '/index.html');
  await p.waitForFunction(() => typeof Game !== 'undefined' && Game.scene === 'title' && UI.stack.length > 0);
  await p.evaluate(() => { UI.pop(UI.stack[0]); buildWorld(); newGame(); Field.init(); Game.scene = 'field';
    for (const k of ['luka', 'yumeno', 'fuuri', 'mokomo']) obtainChar(k);
    G.party = ['luka', 'yumeno', 'fuuri', 'mokomo'];
    for (const id in G.roster) G.roster[id].lv = 20; healAll();
    window._r = Battle.start(['slime', 'slime', 'bat'], { arena: true, ultStart: 11 }); });
  await p.waitForTimeout(2500);
  // カードを1枚使ってゲージMAXに
  await p.evaluate(() => { const i = Battle.hand.findIndex(h => !CARDS[h.cid].blank && Battle.effCost(h.cid) <= Battle.energy); Battle.play(i, Battle.aliveIdx()[0]); });
  await p.waitForTimeout(1500);
  console.log('ult', await p.evaluate(() => [Battle.ult, Battle.ultIds]));
  await p.click('.cbp-ult'); await p.waitForTimeout(400);
  await p.screenshot({ path: SP + '/U_pick.png' });
  await p.click('.up-c[data-i="0"]'); await p.waitForTimeout(500);
  await p.screenshot({ path: SP + '/U_cut.png' });
  await p.waitForTimeout(2500);
  console.log('after', await p.evaluate(() => [Battle.ult, Battle.enemies.map(e => e.hp)]));
  // オート
  await p.evaluate(() => { Battle.toggleAuto(); Battle.fast = true; });
  const r = await p.evaluate(() => window._r);
  console.log('result', JSON.stringify(r));
  // ステータス画面
  await p.evaluate(() => { Menu.open(); });
  await p.waitForTimeout(300);
  await p.evaluate(() => { Menu.status('yumeno'); });
  await p.waitForTimeout(400);
  await p.screenshot({ path: SP + '/U_status.png', fullPage: false });
  await b.close();
})();
