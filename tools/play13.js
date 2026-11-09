const { chromium, devices } = require('playwright');
const SP = process.env.SP;
(async () => {
  const b = await chromium.launch();
  const p = await (await b.newContext({ ...devices['iPhone 13'] })).newPage();
  p.on('pageerror', e => console.log('PAGEERR', e.message, (e.stack || '').split('\n').slice(0, 3).join(' | ')));
  const t0 = Date.now();
  await p.goto('file://' + process.cwd() + '/index.html');
  await p.waitForFunction(() => typeof Game !== 'undefined' && Game.scene === 'title' && UI.stack.length > 0);
  console.log('title ready ms', Date.now() - t0);
  const sh = n => p.screenshot({ path: `${SP}/R_${n}.png` });
  await p.evaluate(() => { UI.pop(UI.stack[0]); buildWorld(); newGame(); Field.init(); Game.scene = 'field'; Game.hud();
    for (const k of ['seres', 'kanae', 'misuzu']) obtainChar(k); G.roster.seres.lb = 2; for (const id in G.roster) G.roster[id].lv = 10; healAll(); });
  // 自動セーブ
  await p.evaluate(() => Game.autoSave(true)); await p.waitForTimeout(200);
  console.log('saved', await p.evaluate(() => hasSave() + ' ' + (localStorage.getItem(SAVE_KEY) || '').length));
  // かけら
  await p.evaluate(() => { const s = WORLD.objs.shards[0]; Field.teleport(s.x, s.y - 1, 'd'); });
  await p.keyboard.down('ArrowDown'); await p.waitForTimeout(260); await p.keyboard.up('ArrowDown'); await p.waitForTimeout(400);
  await sh('shard');
  console.log('stones after shard', await p.evaluate(() => G.stones + ' shards=' + JSON.stringify(G.shards)));
  // サブダンジョン
  await p.evaluate(() => { const e = WORLD.dunInfo.seacave.entrance; Field.teleport(e.x, e.y - 2, 'u'); });
  await p.waitForTimeout(300); await sh('seacave');
  await p.evaluate(() => { const e = WORLD.dunInfo.crylab.entrance; Field.teleport(e.x, e.y + 2, 'u'); });
  await p.waitForTimeout(300); await sh('crylab_out');
  // レリック付きバトル
  await p.evaluate(() => { Battle.start(['crab', 'seaslime'], { bg: 'beach' }); });
  await p.waitForTimeout(2600); await sh('relic_battle');
  console.log('P', await p.evaluate(() => JSON.stringify({ block: Battle.P.block, st: Battle.P.st, hand: Battle.hand.length, relics: Battle.relics.map(r => r.r.n) })));
  await p.evaluate(() => { for (const l of UI.stack.slice()) UI.pop(l); Battle.active = false; document.body.classList.remove('in-battle'); Game.scene = 'field'; Field.busy = true; Menu.map(); });
  await p.waitForTimeout(800); await sh('map');
  await p.evaluate(() => { for (const l of UI.stack.slice()) UI.pop(l); Menu.status('seres'); });
  await p.waitForTimeout(300); await sh('status');
  await b.close();
})();
