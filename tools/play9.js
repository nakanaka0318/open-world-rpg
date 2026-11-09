const { chromium, devices } = require('playwright');
(async () => {
  const b = await chromium.launch();
  const p = await (await b.newContext({ ...devices['iPhone 13'] })).newPage();
  p.on('pageerror', e => console.log('PAGEERR', e.message));
  p.on('console', m => console.log('console', m.text()));
  await p.goto('file://' + process.cwd() + '/index.html');
  await p.waitForTimeout(600);
  await p.evaluate(() => { window.addEventListener('unhandledrejection', e => console.log('UNHANDLED', e.reason && e.reason.stack)); UI.pop(UI.stack[0]); buildWorld(); newGame(); Field.init(); Game.scene = 'field'; for (const k of ['noa', 'homura', 'shizuku']) obtainChar(k); healAll();
    Battle.fast = true; Battle.start(['wolf', 'wolf'], { bg: 'forest' }); });
  await p.waitForTimeout(2500);
  console.log(await p.evaluate(() => JSON.stringify(Battle.autoPick()) + ' hand=' + Battle.hand.map(h => h.cid).join()));
  await p.evaluate(() => Battle.toggleAuto());
  await p.waitForTimeout(6000);
  console.log(await p.evaluate(() => 'turn=' + Battle.turn + ' en=' + Battle.enemies.map(e => e.hp).join()));
  await b.close();
})();
