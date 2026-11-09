const { chromium, devices } = require('playwright');
(async () => {
  const b = await chromium.launch();
  const p = await (await b.newContext({ ...devices['iPhone 13'] })).newPage();
  p.on('pageerror', e => console.log('PAGEERR', e.message));
  await p.goto('file://' + process.cwd() + '/index.html');
  await p.waitForFunction(() => typeof Game !== 'undefined' && Game.scene === 'title' && UI.stack.length > 0);
  await p.evaluate(() => { UI.pop(UI.stack[0]); buildWorld(); newGame(); Field.init(); Game.scene = 'field';
    for (const k of ['seres', 'kanae', 'misuzu']) obtainChar(k); G.roster.seres.lb = 2; healAll();
    const o = Battle.startTurn.bind(Battle); window._st = 0; Battle.startTurn = function () { window._st++; console.log('startTurn', new Error().stack.split('\n').slice(1, 4).join(' | ')); return o(); };
    Battle.start(['crab'], { bg: 'beach' }); });
  p.on('console', m => console.log('console', m.text()));
  await p.waitForTimeout(2600);
  console.log(await p.evaluate(() => 'calls=' + window._st + ' turn=' + Battle.turn + ' block=' + Battle.P.block + ' hand=' + Battle.hand.length + ' draw=' + Battle.drawPile.length));
  await b.close();
})();
