const { chromium, devices } = require('playwright');
const SP = process.env.SP;
(async () => {
  const b = await chromium.launch();
  const p = await (await b.newContext({ ...devices['iPhone 13'] })).newPage();
  p.on('pageerror', e => console.log('PAGEERR', e.message, (e.stack || '').split('\n').slice(0, 3).join(' | ')));
  await p.goto('file://' + process.cwd() + '/index.html');
  await p.waitForFunction(() => typeof Game !== 'undefined' && Game.scene === 'title' && UI.stack.length > 0);
  const sh = n => p.screenshot({ path: `${SP}/W_${n}.png` });
  await p.evaluate(() => { UI.pop(UI.stack[0]); buildWorld(); newGame(); G.flags.cleared = 1; Field.init(); Game.scene = 'field'; Game.hud();
    for (const k of ['seres', 'noa', 'kanae']) obtainChar(k); for (const id in G.roster) G.roster[id].lv = 30; healAll(); Battle.auto = true; Battle.fast = true;
    Field.teleport(Field.portal.x, Field.portal.y + 1, 'u'); });
  await p.waitForTimeout(300); await sh('portal');
  await p.keyboard.press('KeyZ'); await p.waitForTimeout(400); await p.keyboard.press('KeyZ'); await p.waitForTimeout(600);
  await sh('tower');
  console.log(await p.evaluate(() => JSON.stringify({ choices: G.towerRun.choices, floor: G.towerRun.floor, deck: G.towerRun.deck.length })));
  // 戦闘ノードを選ぶ (戦闘は必ず含まれる)
  const idx = await p.evaluate(() => G.towerRun.choices.indexOf('battle'));
  for (let i = 0; i < idx; i++) await p.keyboard.press('ArrowDown');
  await p.keyboard.press('KeyZ');
  for (let i = 0; i < 120; i++) { await p.waitForTimeout(500); if (await p.locator('.pick-layer').count()) break; if (await p.locator('.dlg').count()) await p.keyboard.press('KeyZ'); }
  await sh('reward');
  await p.keyboard.press('KeyZ'); await p.waitForTimeout(500);
  console.log(await p.evaluate(() => JSON.stringify({ floor: G.towerRun.floor, hp: G.towerRun.hp + '/' + G.towerRun.max, deck: G.towerRun.deck.length, stones: G.towerRun.stones, best: G.tower.best })));
  await sh('floor2');
  // 休憩・商人・イベントを直接
  await p.evaluate(async () => { Tower.rest(); });
  await p.waitForTimeout(400); await sh('rest');
  await p.keyboard.press('KeyZ'); await p.waitForTimeout(300);
  await p.evaluate(async () => { Tower.shop(); });
  await p.waitForTimeout(400); await sh('shop');
  await b.close();
})();
