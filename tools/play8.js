const { chromium, devices } = require('playwright');
(async () => {
  const b = await chromium.launch();
  const p = await (await b.newContext({ ...devices['iPhone 13'] })).newPage();
  p.on('pageerror', e => console.log('PAGEERR', e.message, (e.stack || '').split('\n').slice(0, 4).join(' | ')));
  await p.goto('file://' + process.cwd() + '/index.html');
  await p.waitForTimeout(600);
  await p.evaluate(() => { UI.pop(UI.stack[0]); buildWorld(); newGame(); Field.init(); Game.scene = 'field'; for (const k of ['noa', 'homura', 'shizuku']) obtainChar(k); healAll();
    window._r = null; Battle.fast = true; Battle.auto = true; Battle.start(['wolf', 'wolf'], { bg: 'forest' }).then(r => window._r = r); });
  for (let i = 0; i < 120; i++) { await p.waitForTimeout(500); const r = await p.evaluate(() => window._r); if (r) { console.log('res', r); break; } }
  console.log(await p.evaluate(() => 'turn=' + Battle.turn + ' busy=' + Battle.busy + ' ar=' + Battle.autoRunning + ' done=' + Battle.done + ' en=' + Battle.enemies.map(e => e.hp + (e.alive ? 'A' : 'D')).join() + ' hand=' + Battle.hand.length + ' E=' + Battle.energy + ' onAny=' + !!Battle.onAny)); console.log(await p.evaluate(() => Game.scene + ' P=' + Battle.P.hp + '/' + Battle.P.max + ' chars=' + partyChars().map(c => c.id + ':' + c.hp + '/' + charStats(c).hp).join(',') + ' stack=' + UI.stack.length));
  await b.close();
})();
