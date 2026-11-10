const { chromium, devices } = require('playwright');
const SP = process.env.SP;
(async () => {
  const b = await chromium.launch();
  const p = await (await b.newContext({ ...devices['iPhone 13'] })).newPage();
  p.on('pageerror', e => console.log('PAGEERR', e.message));
  await p.goto('file://' + process.cwd() + '/index.html');
  await p.waitForFunction(() => typeof Game !== 'undefined' && Game.scene === 'title' && UI.stack.length > 0);
  await p.evaluate(() => { UI.pop(UI.stack[0]); buildWorld(); newGame(); G.flags.cleared = 1; Field.init(); Game.scene = 'field';
    for (const k of ['seres', 'noa', 'kanae']) obtainChar(k); for (const id in G.roster) G.roster[id].lv = 30; healAll();
    Field.teleport(Field.portal.x, Field.portal.y + 1, 'u'); });
  await p.keyboard.press('KeyZ'); await p.waitForTimeout(400); await p.keyboard.press('KeyZ'); await p.waitForTimeout(600);
  const idx = await p.evaluate(() => G.towerRun.choices.indexOf('battle'));
  for (let i = 0; i < idx; i++) await p.keyboard.press('ArrowDown');
  await p.keyboard.press('KeyZ'); await p.waitForTimeout(2600);
  await p.screenshot({ path: SP + '/W_battlefix.png' });
  console.log(await p.evaluate(() => getComputedStyle(document.querySelector('.tower-layer')).display));
  await b.close();
})();
