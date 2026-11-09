const { chromium, devices } = require('playwright');
const SP = process.env.SP;
(async () => {
  const b = await chromium.launch();
  const mobile = process.env.MOBILE === '1';
  const ctx = await b.newContext(mobile ? { ...devices['iPhone 13'] } : { viewport: { width: 960, height: 600 } });
  const p = await ctx.newPage();
  const errs = [];
  p.on('pageerror', e => { errs.push(e.message); console.log('PAGEERR', e.message, (e.stack || '').split('\n').slice(0, 3).join(' | ')); });
  p.on('console', m => { if (m.type() === 'error') console.log('console:', m.text()); });
  await p.goto('file://' + process.cwd() + '/index.html');
  await p.waitForTimeout(600);
  const key = async (k, n = 1, w = 110) => { for (let i = 0; i < n; i++) { await p.keyboard.press(k); await p.waitForTimeout(w); } };
  const shot = async n => { await p.screenshot({ path: `${SP}/${process.env.PFX || ''}${n}.png` }); };
  const st = async () => p.evaluate(() => Game.scene + ' stack=' + UI.stack.length + ' busy=' + Field.busy);
  await key('KeyZ'); await p.waitForTimeout(700);
  // イントロを進めてガチャを開く
  for (let i = 0; i < 14; i++) await key('KeyZ', 1, 200);
  await p.waitForTimeout(500);
  console.log('after intro', await st());
  await shot('a1');
  // ガチャ画面で10連
  for (let i = 0; i < 25; i++) { await key('KeyZ', 1, 250); }
  await shot('a2');
  console.log('gacha', await st());
  await key('KeyX'); await p.waitForTimeout(400);
  await key('KeyX'); await p.waitForTimeout(400);
  console.log('closed', await st(), await p.evaluate(() => JSON.stringify(G.party) + ' stones=' + G.stones));
  await shot('a3_field');
  // 歩く
  await p.keyboard.down('ArrowUp'); await p.waitForTimeout(900); await p.keyboard.up('ArrowUp');
  await p.keyboard.down('ArrowLeft'); await p.waitForTimeout(900); await p.keyboard.up('ArrowLeft');
  await shot('a4_walk');
  // 村長の家に入る (ドアの下にテレポート)
  await p.evaluate(() => { const t = TOWNS[0]; Field.teleport(t.x + 2 + 4, t.y + 2 + 7, 'u'); });
  await p.keyboard.down('ArrowUp'); await p.waitForTimeout(500); await p.keyboard.up('ArrowUp');
  await p.waitForTimeout(300);
  await shot('a5_house');
  // メニュー
  await key('KeyC'); await p.waitForTimeout(400); await shot('a6_menu');
  await key('KeyZ'); await p.waitForTimeout(400); await shot('a7_party');
  await key('KeyZ'); await p.waitForTimeout(300); await key('KeyZ'); await p.waitForTimeout(400); await shot('a8_status');
  await key('KeyX'); await key('KeyX'); await key('KeyX'); await p.waitForTimeout(300);
  console.log('menu back', await st());
  await key('ArrowRight'); await key('KeyZ'); await p.waitForTimeout(300); await key('KeyZ'); await p.waitForTimeout(300); await shot('a9_equip');
  await key('KeyZ'); await p.waitForTimeout(300); await key('ArrowDown'); await p.waitForTimeout(200); await shot('a10_equiplist');
  await key('KeyX'); await key('KeyX'); await key('KeyX'); await key('KeyX'); await p.waitForTimeout(300);
  console.log('menu back2', await st());
  await key('ArrowDown', 2); await key('KeyZ'); await p.waitForTimeout(500); await shot('a11_map');
  await key('KeyX'); await key('ArrowRight'); await key('KeyZ'); await p.waitForTimeout(400); await shot('a12_records');
  await key('KeyX'); await key('KeyX'); await p.waitForTimeout(300);
  console.log('menu closed', await st());
  // バトル
  await p.evaluate(() => { Field.busy = false; Field.teleport(60, 70, 'd'); Field.encounter(Field.enemies.find(e => e.area === 'meadow')); });
  await p.waitForTimeout(1800);
  await shot('b1_battle');
  await key('KeyZ'); await p.waitForTimeout(300); await shot('b2_target');
  for (let i = 0; i < 40; i++) { await key('KeyZ', 1, 220); if ((await p.evaluate(() => Game.scene)) === 'field') break; }
  await shot('b3_after');
  console.log('after battle', await st(), await p.evaluate(() => partyChars().map(c => c.id + ':' + c.lv + ':' + c.hp).join(',')));
  // ボス戦 (オート)
  await p.evaluate(() => { for (const k in G.roster) { G.roster[k].lv = 12; fullHeal(G.roster[k]); } const b = Field.bosses.find(x => x.id === 'shrine'); Field.teleport(b.x, b.y + 1, 'u'); });
  await p.waitForTimeout(300);
  await shot('c0_dungeon');
  await key('KeyZ'); await p.waitForTimeout(400); await key('KeyZ'); await p.waitForTimeout(1500);
  await shot('c1_boss');
  await key('KeyC'); await p.waitForTimeout(200);
  for (let i = 0; i < 120; i++) { await p.waitForTimeout(400); const s = await p.evaluate(() => Game.scene + (Battle.onAny ? 'R' : '')); if (s.includes('R')) { await shot('c2_result'); await key('KeyZ'); } if (s === 'field') break; }
  for (let i = 0; i < 6; i++) await key('KeyZ', 1, 300);
  console.log('after boss', await st(), await p.evaluate(() => JSON.stringify(G.crystals)));
  await shot('c3_end');
  // 暗いダンジョン
  await p.evaluate(() => { const d = WORLD.dunInfo.ruins; Field.teleport(d.entrance.x, d.entrance.y - 2, 'u'); });
  await p.waitForTimeout(300); await shot('d1_dark');
  await p.evaluate(() => { const d = WORLD.dunInfo.icecave; Field.teleport(d.entrance.x, d.entrance.y - 1, 'u'); });
  await p.waitForTimeout(300); await shot('d2_ice');
  await p.evaluate(() => { Field.teleport(WORLD.seal.x, WORLD.seal.y + 3, 'u'); });
  await p.waitForTimeout(300); await shot('d3_seal');
  console.log('errors', errs.length);
  await b.close();
})();
