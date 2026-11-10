// 昼夜・天気・採集・釣り・料理・図鑑と実績のテスト
const { chromium, devices } = require('playwright');
const SP = process.env.SP || '.';
(async () => {
  const b = await chromium.launch();
  const p = await (await b.newContext({ ...devices['iPhone 13'] })).newPage();
  p.on('pageerror', e => console.log('PAGEERR', e.message));
  await p.goto('file://' + process.cwd() + '/index.html');
  await p.waitForFunction(() => typeof Game !== 'undefined' && Game.scene === 'title' && UI.stack.length > 0);
  await p.evaluate(() => { UI.pop(UI.stack[0]); buildWorld(); newGame(); obtainChar('seres'); G.party = ['aria', 'seres']; for (const id in G.roster) G.roster[id].lv = 20; healAll(); Field.init(); Game.scene = 'field'; Game.hud(); });
  console.log('gather points', await p.evaluate(() => [Life.points.length, Life.clockText(), Life.phase(), Life.weather()]));
  // 夜にして、雨の草原へ
  await p.evaluate(() => { G.clockOfs = 13 * 60; const pt = Life.points.find(q => q.area === 'meadow'); Field.teleport(pt.x, pt.y + 1, 'u'); });
  let tries = 0; while (tries++ < 40 && await p.evaluate(() => Life.weather()) !== 'rain') await p.evaluate(() => { G.clockOfs += 360; });
  await p.waitForTimeout(500);
  console.log('night', await p.evaluate(() => [Life.clockText(), Life.isNight(), Life.weather()]));
  await p.screenshot({ path: SP + '/L_night.png' });
  // 採集
  await p.evaluate(() => { const pt = Life.points.find(q => q.area === 'meadow'); console.log('facing', JSON.stringify(Field.objAt(pt.x, pt.y)), Field.p.x, Field.p.y, pt.x, pt.y); Life.gather(pt); });
  await p.waitForTimeout(400);
  console.log('gathered', await p.evaluate(() => JSON.stringify(Object.fromEntries(Object.entries(G.items).filter(([k]) => ITEMS[k].cat === 'food')))));
  await p.keyboard.press('KeyZ'); await p.waitForTimeout(300);
  // 釣り (水辺を探す)
  await p.evaluate(() => { const L = WORLD.lumina.gates.n; for (let r = 1; r < 60; r++) for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) { const x = L.x + dx, y = L.y + dy; if (Field.tile(x, y) === T.WATER && !TILE_DEFS[Field.tile(x, y + 1)].solid && !Field.objAt(x, y + 1)) { Field.teleport(x, y + 1, 'u'); return; } } });
  await p.keyboard.press('KeyZ'); await p.waitForTimeout(300); await p.keyboard.press('KeyZ'); await p.waitForTimeout(300);
  await p.screenshot({ path: SP + '/L_fish.png' });
  // ゾーンに入るまで待って押す
  for (let k = 0; k < 400; k++) { const inz = await p.evaluate(() => { const mk = document.querySelector('.fish-mk'), z = document.querySelector('.fish-zone'); if (!mk) return null; const a = parseFloat(mk.style.left), z0 = parseFloat(z.style.left), zw = parseFloat(z.style.width); return a >= z0 + 1 && a <= z0 + zw - 1; }); if (inz === null) break; if (inz) { await p.keyboard.press('KeyZ'); break; } await p.waitForTimeout(8); }
  await p.waitForTimeout(800);
  console.log('fish', await p.evaluate(() => JSON.stringify(G.fishLog)));
  await p.keyboard.press('KeyZ'); await p.waitForTimeout(300);
  // 料理
  await p.evaluate(() => { while (UI.stack.length) UI.pop(UI.stack[UI.stack.length - 1]); addItem('berry', 2); addItem('wheat', 1); addItem('firepepper', 1); addItem('spice', 1); addItem('herb', 3); Life.cook(); });
  await p.waitForTimeout(400);
  await p.screenshot({ path: SP + '/L_cook.png' });
  await p.evaluate(() => { const el = [...document.querySelectorAll('#ui .li')].find(e => e.textContent.includes('ベリータルト')); el.click(); });
  await p.waitForTimeout(200);
  await p.evaluate(() => { const el = [...document.querySelectorAll('#ui .li')].find(e => e.textContent.includes('ベリータルト')); el.click(); });
  await p.waitForTimeout(300);
  console.log('cooked', await p.evaluate(() => [JSON.stringify(G.cooked), G.items.d_berrytart]));
  await p.evaluate(() => { while (UI.stack.length) UI.pop(UI.stack[UI.stack.length - 1]); Life.eat('d_berrytart'); window._r = Battle.start(['nightbat', 'nightbat'], {}); });
  await p.waitForTimeout(2600);
  console.log('meal battle', await p.evaluate(() => [Battle.P.block, JSON.stringify(G.meal)]));
  await p.evaluate(() => { Battle.toggleAuto(); Battle.fast = true; });
  // 勝利画面はボタン待ちなので、戦闘が終わるまで押し続ける
  for (let i = 0; i < 200 && await p.evaluate(() => Battle.active && Game.scene === 'battle'); i++) { await p.evaluate(() => { if (Battle.onAny) Battle.onAny(); }); await p.waitForTimeout(150); }
  for (let i = 0; i < 4; i++) { await p.keyboard.press('KeyZ'); await p.waitForTimeout(200); }
  console.log('after', await p.evaluate(() => [JSON.stringify(G.meal), JSON.stringify(G.kills), JSON.stringify(G.ach)]));
  await p.evaluate(() => { while (UI.stack.length) UI.pop(UI.stack[UI.stack.length - 1]); Life.book(); });
  await p.waitForTimeout(400);
  await p.screenshot({ path: SP + '/L_book.png' });
  await b.close();
})();
