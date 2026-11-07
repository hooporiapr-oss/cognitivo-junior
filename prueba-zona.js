// ══════════════════════════════════════════════════════════════════
//  ZONA 2-1-2 · Tinluz          node prueba-zona.js
//  Plays all three levels with misses on purpose. Checks: a miss
//  never ends anything, no words on the child's screen, progress is
//  recorded only with a name, and the hub and progress pages know it.
// ══════════════════════════════════════════════════════════════════
const path = require('path');
const { chromium } = require('playwright');
let malos = 0;
const ok = (c, m) => { if (!c) malos++; console.log((c ? '  ✓ ' : '  ✗ ') + m); };
const U = f => 'file://' + path.join(__dirname, f);
const TODOS = ['leon', 'delfin', 'rana', 'zorro', 'panda'];

(async () => {
  const b = await chromium.launch({ args: ['--no-sandbox'] });
  const p = await b.newPage({ viewport: { width: 390, height: 844 } });
  const errs = [];
  p.on('pageerror', e => errs.push(String(e)));
  await p.route('**/*', r => r.request().url().startsWith('file:') ? r.continue()
    : r.fulfill({ status: 200, contentType: 'application/json', body: '{}' }));
  // a tablet that already entered its centre's code
  await p.addInitScript(() => { try {
    if (!localStorage.getItem('cj-acceso'))
      localStorage.setItem('cj-acceso', JSON.stringify({ code: 'CJ-PRUEBA', site: 'Centro de prueba', kind: 'licencia', until: '2099-12-31' }));
    if (!localStorage.getItem('cfh_lang')) localStorage.setItem('cfh_lang', 'es');
  } catch (e) {} });

  const Z = () => p.evaluate(() => ({ nivel: ZONA.nivel, round: ZONA.round, busy: ZONA.busy,
    want: ZONA.want && ZONA.want.id, chain: (ZONA.chain || []).map(g => g.id), results: ZONA.results }));
  const listo = () => p.waitForFunction(() => !ZONA.busy || document.getElementById('done').style.display === 'flex', null, { timeout: 15000 });
  const terminado = () => p.evaluate(() => document.getElementById('done').style.display === 'flex');
  // a tap on one friend, even while another one is sliding past it
  const guardia = id => p.evaluate(id => document.querySelector(`[data-guard="${id}"]`).dispatchEvent(new MouseEvent('click', { bubbles: true })), id);
  const casa = id => p.locator(`[data-casa="${id}"]`).click({ force: true });

  console.log('\n1 · The hub');
  await p.goto(U('index.html')); await p.waitForTimeout(300);
  ok(await p.locator('a.card[href="zona.html"]').count() === 1, 'Tinluz home has a Zona 2-1-2 card');
  ok(/4 a 6 años/i.test(await p.locator('a.card[href="zona.html"]').innerText()), 'marked 4 a 6 años');

  console.log('\n2 · The teacher screen');
  await p.goto(U('zona.html')); await p.waitForTimeout(400);
  ok(/Cuida tu casa/.test(await p.locator('#tRules').innerText()), '«Cuida tu casa. Muévete hacia la bola.»');
  ok(await p.locator('#pickLvl button').count() === 3, 'three levels to pick');
  ok(/conos de colores/.test(await p.locator('#tCoach').innerText()), 'the coach note: cones on the court in 2-1-2');
  // a name, so the session is recorded
  await p.selectOption('#cjWho', '__add');
  await p.fill('#cjName', 'Ana'); await p.click('#cjSave');
  ok(await p.evaluate(() => { const s = document.getElementById('cjWho'); return s.options[s.selectedIndex].text; }) === 'Ana', 'a child picked: Ana');

  console.log('\n3 · Level 1 · Encuentra tu casa');
  await p.locator('#pickLvl button[data-lvl="1"]').click();
  await p.locator('#pickVoz button[data-voz="0"]').click();
  await p.click('#goBtn');
  await p.waitForFunction(() => ZONA.want, null, { timeout: 5000 });
  let z = await Z();
  ok(z.nivel === 1 && !!z.want, 'a friend shows up at the top: ' + z.want);
  ok(!/[A-Za-zÁÉÍÓÚáéíóúñ]/.test(await p.locator('#play').innerText()), 'no words on the child\u2019s screen');
  await casa(TODOS.find(x => x !== z.want)); await p.waitForTimeout(200);
  ok((await Z()).round === 0, 'a wrong house: the right one glows, nothing ends');
  for (let i = 0; i < 8; i++){ await listo(); if (await terminado()) break; z = await Z(); await casa(z.want); await p.waitForTimeout(1500); }
  await p.waitForFunction(() => document.getElementById('done').style.display === 'flex', null, { timeout: 8000 });
  const st = await p.locator('#dStars').innerText();
  ok((st.match(/⭐/g) || []).length === 4 && (st.match(/✨/g) || []).length === 1, 'five rounds: four ⭐ and one ✨ (the round with the miss)');
  const log = await p.evaluate(() => CJ.log());
  ok(log.length === 1 && log[0].game === 'zona' && log[0].perfect === 4 && log[0].helped === 1, 'recorded for Ana on this tablet: zona, 4 + 1');

  console.log('\n4 · Level 2 · ¿Quién va?');
  await p.click('#dBack');
  await p.locator('#pickLvl button[data-lvl="2"]').click();
  await p.click('#goBtn'); await listo(); await p.waitForTimeout(700);
  z = await Z();
  ok(z.nivel === 2 && await p.locator('#face').innerText() === '👆', 'the ball appears, the face shows a hand');
  await guardia(TODOS.find(x => x !== z.want)); await p.waitForTimeout(300);
  ok((await Z()).round === 0, 'the wrong friend: the right one glows, same ball again');
  await listo(); await guardia(z.want); await p.waitForTimeout(700);
  const mov = await p.evaluate(() => [...document.querySelectorAll('.zn-guard')].map(n => getComputedStyle(n).transform));
  ok(mov.every(t => t !== 'none'), 'the right friend runs to the ball, the other four take a step');
  for (let i = 0; i < 8; i++){ await listo(); if (await terminado()) break; z = await Z(); await guardia(z.want); await p.waitForTimeout(1900); }
  ok(await terminado(), 'level 2 complete');

  console.log('\n5 · Level 3 · La bola viaja');
  await p.click('#dBack');
  await p.locator('#pickLvl button[data-lvl="3"]').click();
  await p.click('#goBtn'); await p.waitForTimeout(900);
  ok(await p.locator('#face').innerText() === '👀', 'eyes while the ball travels');
  await listo(); z = await Z();
  ok(z.chain.length === 2, 'two passes first');
  await guardia(TODOS.find(x => x !== z.chain[0])); await p.waitForTimeout(300);
  ok((await Z()).round === 0, 'a miss: the ball shows the way again — no game over');
  for (let r = 0; r < 14; r++){
    await listo(); if (await terminado()) break; z = await Z();
    for (const id of z.chain){ await guardia(id); await p.waitForTimeout(150); }
    await p.waitForTimeout(1900);
  }
  ok(await terminado(), 'level 3 complete');
  const largos = await p.evaluate(() => ZONA.chain.length);
  ok(largos === 3, 'three passes in the second half of the session');

  console.log('\n6 · Progress, English, phone');
  await p.goto(U('maestro.html')); await p.waitForTimeout(400);
  await p.locator('[data-toggle]').first().click();
  ok(/Zona 2-1-2/i.test(await p.locator('body').innerText()), 'the progress page names it «Zona 2-1-2»');
  await p.goto(U('zona.html')); await p.waitForTimeout(300);
  await p.click('#langBtn');
  const en = await p.locator('#tRules').innerText();
  ok(/Guard your house/.test(en), 'EN: «Guard your house. Move toward the ball.»' + (/Guard/.test(en) ? '' : ' — got: ' + en.slice(0, 40)));
  await p.setViewportSize({ width: 360, height: 740 });
  ok(await p.evaluate(() => document.documentElement.scrollWidth <= 360), 'fits a small phone');
  ok(!errs.length, 'no page errors ' + errs.join(' | '));

  await b.close();
  console.log(malos ? `\n${malos} FAILED` : '\nALL PASS');
  process.exit(malos ? 1 : 0);
})();
