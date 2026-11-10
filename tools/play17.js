const { chromium, devices } = require('playwright');
(async () => {
  const b = await chromium.launch();
  const p = await (await b.newContext({ ...devices['iPhone 13'] })).newPage();
  p.on('pageerror', e => console.log('PAGEERR', e.message));
  await p.goto('file://' + process.cwd() + '/index.html');
  await p.waitForFunction(() => typeof Game !== 'undefined' && Game.scene === 'title' && UI.stack.length > 0);
  const r = await p.evaluate(async () => {
    UI.pop(UI.stack[0]); buildWorld(); newGame(); Field.init(); Game.scene = 'field'; Game.hud();
    for (const id in G.roster) G.roster[id].lv = 30;
    const e = Field.enemies.find(x => x.area === 'meadow');
    Field.teleport(e.x + 3, e.y, 'l');
    const d0 = Math.abs(e.x - Field.p.x) + Math.abs(e.y - Field.p.y);
    await new Promise(r => setTimeout(r, 2500));
    const d1 = Math.abs(e.x - Field.p.x) + Math.abs(e.y - Field.p.y);
    const out = `scared=${e.scared} chase=${e.chase} dist ${d0}->${d1} scene=${Game.scene}`;
    const exp0 = G.explored.reduce((a, v) => a + v, 0);
    G.stones = 0; for (const l of UI.stack.slice()) UI.pop(l); Field.busy = true; Menu.settings();
    return out + ' explored=' + exp0;
  });
  console.log(r);
  await p.waitForTimeout(400);
  await p.locator('.screen-layer .li').nth(4).click(); await p.waitForTimeout(300);
  console.log('stones', await p.evaluate(() => G.stones));
  await b.close();
})();
