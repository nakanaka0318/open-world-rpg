const { chromium, devices } = require('playwright');
const SP = process.env.SP;
(async () => {
  const b = await chromium.launch();
  const p = await (await b.newContext({ ...devices['iPhone 13 landscape'] })).newPage();
  p.on('pageerror', e => console.log('PAGEERR', e.message));
  await p.goto('file://' + process.cwd() + '/index.html');
  await p.waitForTimeout(600);
  await p.evaluate(() => { UI.pop(UI.stack[0]); buildWorld(); newGame(); Field.init(); Game.scene = 'field'; for (const k of ['noa', 'homura', 'shizuku']) obtainChar(k); healAll(); Battle.start(['hellhound', 'wisp', 'bombslime'], { bg: 'volcano' }); });
  await p.waitForTimeout(2300);
  await p.locator('.cb-slot').nth(2).click(); await p.waitForTimeout(300);
  await p.screenshot({ path: SP + '/BL.png' });
  await p.evaluate(() => { Battle.auto = false; for (const l of UI.stack.slice()) UI.pop(l); Battle.active = false; Game.scene = 'field'; Battle.start(['demon'], { bg: 'castle', boss: true }); });
  await p.waitForTimeout(2300);
  await p.screenshot({ path: SP + '/BL2.png' });
  await b.close();
})();
