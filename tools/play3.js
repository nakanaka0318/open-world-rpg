const { chromium, devices } = require('playwright');
const SP = process.env.SP;
(async () => {
  const b = await chromium.launch();
  const dev = process.env.LAND === '1' ? devices['iPhone 13 landscape'] : devices['iPhone 13'];
  const ctx = await b.newContext({ ...dev });
  const p = await ctx.newPage();
  p.on('pageerror', e => console.log('PAGEERR', e.message, (e.stack || '').split('\n').slice(0, 3).join(' | ')));
  await p.goto('file://' + process.cwd() + '/index.html');
  await p.waitForTimeout(600);
  const pfx = process.env.LAND === '1' ? 'L_' : 'P_';
  const shot = async n => p.screenshot({ path: `${SP}/${pfx}${n}.png` });
  await shot('title');
  const tap = async (sel) => { await p.locator(sel).first().click(); await p.waitForTimeout(250); };
  await tap('.title-menu .li');
  await p.waitForTimeout(600);
  for (let i = 0; i < 6; i++) { await p.locator('#ui').click({ position: { x: 100, y: 100 } }); await p.waitForTimeout(250); }
  await shot('intro');
  // ガイド・選択肢
  for (let i = 0; i < 20 && !(await p.locator('.choice .li').count()); i++) { await p.locator('#ui').click({ position: { x: 100, y: 100 } }); await p.waitForTimeout(300); }
  await shot('ask');
  await tap('.choice .li');
  await p.waitForTimeout(500);
  await shot('gacha');
  await tap('.g-btn.ten'); await p.waitForTimeout(300);
  await shot('gacha_confirm');
  await tap('.choice .li'); await p.waitForTimeout(3500);
  await shot('summon');
  for (let i = 0; i < 20; i++) { await p.locator('.summon-layer').click({ position: { x: 50, y: 50 } }).catch(() => { }); await p.waitForTimeout(300); if (!(await p.locator('.summon-layer').count())) break; }
  await shot('gacha_after');
  await tap('.g-close'); await p.waitForTimeout(400);
  await shot('field');
  // パッドで歩く
  const pad = await p.locator('#dpad').boundingBox();
  await p.mouse.move(pad.x + pad.width / 2, pad.y + 10); await p.mouse.down(); await p.waitForTimeout(700); await p.mouse.up();
  await shot('walk');
  // バトル
  await p.evaluate(() => { Field.busy = false; Field.encounter(Field.enemies.find(e => e.area === 'meadow')); });
  await p.waitForTimeout(1800);
  await shot('battle');
  await tap('.bcmd .li'); await p.waitForTimeout(200); await shot('battle_tgt');
  await p.evaluate(() => Battle.toggleAuto());
  for (let i = 0; i < 40; i++) { await p.waitForTimeout(400); if (await p.locator('.result').count()) { await shot('battle_result'); break; } }
  await p.waitForTimeout(2500);
  await tap('.hud-btn.m'); await p.waitForTimeout(400); await shot('menu');
  await tap('.mn-grid .li >> nth=1'); await p.waitForTimeout(400); await shot('equip_pick');
  await tap('.screen-layer .li'); await p.waitForTimeout(400); await tap('.screen-layer:last-child .li'); await p.waitForTimeout(400); await shot('equip_list');
  await p.locator('.sc-back').last().click(); await p.waitForTimeout(250); await p.waitForTimeout(300); await p.locator('.sc-back').last().click(); await p.waitForTimeout(250); await p.waitForTimeout(300);
  await tap('.mn-grid .li >> nth=4'); await p.waitForTimeout(500); await shot('map');
  await p.locator('.sc-back').last().click(); await p.waitForTimeout(250); await p.waitForTimeout(300);
  await tap('.mn-grid .li >> nth=5'); await p.waitForTimeout(500); await shot('records');
  await b.close();
})();
