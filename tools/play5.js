const { chromium, devices } = require('playwright');
const SP = process.env.SP;
(async () => {
  const b = await chromium.launch();
  const p = await (await b.newContext({ ...devices['iPhone 13'] })).newPage();
  p.on('pageerror', e => console.log('PAGEERR', e.message, (e.stack || '').split('\n').slice(0, 3).join(' | ')));
  await p.goto('file://' + process.cwd() + '/index.html');
  await p.waitForTimeout(600);
  await p.evaluate(() => { UI.pop(UI.stack[0]); buildWorld(); newGame(); Field.init(); Game.scene = 'field'; Game.hud(); for (let i = 0; i < G.explored.length; i++) G.explored[i] = 1; });
  // ダンジョン入口付近 (森に囲まれた神殿)
  await p.evaluate(() => { const e = WORLD.dunInfo.shrine.entrance; Field.teleport(e.x, e.y + 3, 'u'); });
  await p.waitForTimeout(300); await p.screenshot({ path: SP + '/W_shrine.png' });
  await p.evaluate(() => { const e = WORLD.dunInfo.icecave.entrance; Field.teleport(e.x, e.y + 3, 'u'); });
  await p.waitForTimeout(300); await p.screenshot({ path: SP + '/W_ice.png' });
  // 小屋の住人と会話
  await p.evaluate(() => { const n = Field.npcs.find(n => n.id === 'volc_smith'); Field.teleport(n.x, n.y + 1, 'u'); });
  await p.keyboard.press('KeyZ'); await p.waitForTimeout(400);
  await p.screenshot({ path: SP + '/W_smith.png' });
  for (let i = 0; i < 4; i++) { await p.keyboard.press('KeyZ'); await p.waitForTimeout(250); }
  console.log('stack', await p.evaluate(() => UI.stack.length + ' ' + Field.busy));
  await p.evaluate(() => { for (const l of UI.stack.slice()) UI.pop(l); Field.busy = false; Menu.map(); }); await p.waitForTimeout(500);
  await p.screenshot({ path: SP + '/W_map.png' });
  console.log(await p.evaluate(() => [Game.scene, UI.stack.length, Object.keys(G.equips).join()].join(' | ')));
  await b.close();
})();
