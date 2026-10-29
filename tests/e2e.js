const puppeteer = require('puppeteer-core');
const BASE = process.argv[2] || 'http://127.0.0.1:8765/';
let pass = 0, fail = 0; const errors = [];
const ok = (c, name, extra='') => { if (c) { pass++; console.log('PASS', name); } else { fail++; console.log('FAIL', name, extra); } };
const sleep = ms => new Promise(r => setTimeout(r, ms));
(async () => {
  const browser = await puppeteer.launch({ executablePath: '/usr/bin/google-chrome', headless: 'new', args: ['--no-sandbox', '--autoplay-policy=no-user-gesture-required'] });
  const page = await browser.newPage();
  page.on('pageerror', e => errors.push('pageerror: ' + e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push('console: ' + m.text()); });
  page.on('dialog', d => d.accept());
  await page.setViewport({ width: 1366, height: 900 });
  const url = BASE + 'index.html?mute';
  const resp = await page.goto(url, { waitUntil: 'networkidle0' });
  ok(resp.status() === 200, 'index loads (HTTP ' + resp.status() + ')');
  await page.evaluate(() => localStorage.clear()); await page.goto(url, { waitUntil: 'networkidle0' });
  const disc = await page.$eval('#disclaimer', e => e.textContent);
  ok(disc.includes('Demonstration by 92 Logics for tender GHI/ED/PSR1 — not an official Suffolk County Council service.'), 'disclaimer label shown');
  const askQ = async (q) => { await page.$eval('#q', (e, v) => e.value = v, q); await page.click('#askForm button[type=submit]'); await sleep(450); return page.$$eval('.msg.bot', els => { const l = els[els.length - 1]; return { cls: l.className, text: l.querySelector('.bubble').textContent, cites: [...l.querySelectorAll('a.cite')].map(a => a.href) }; }); };
  let r = await askQ('Tell me about the Port of Felixstowe');
  ok(/largest container port/.test(r.text) && r.cites.some(c => c.includes('Port_of_Felixstowe')), 'answers port question with citation', JSON.stringify(r));
  const cap = await page.$eval('#captions', e => e.textContent); ok(cap.length > 20, 'captions/subtitles show spoken answer');
  ok(await page.$eval('#avatar', e => e.classList.contains('speaking')), 'avatar animates while speaking');
  r = await askQ('tell me more'); ok(/1967/.test(r.text), 'follow-up "tell me more" keeps context');
  r = await askQ('What is the weather on Mars?'); ok(r.cls.includes('unanswered') && r.cites.length === 0, 'says it does not know (no citation) for out-of-scope', JSON.stringify(r));
  r = await askQ('Who should I vote for?'); ok(r.cls.includes('moderated'), 'declines political question');
  await page.select('#audience', 'investor'); r = await askQ('What is Freeport East?'); ok(r.text.startsWith('From an investment point of view') && r.cites.length, 'investor-tailored answer with source');
  await page.select('#audience', 'general');
  // signpost click logging
  await page.evaluate(() => { const a = [...document.querySelectorAll('.signpost a')].pop(); a.removeAttribute('target'); a.addEventListener('click', e => e.preventDefault()); a.click(); });
  // QR
  const qr = await page.$eval('#qr', e => ({ svg: !!e.querySelector('svg'), url: e.dataset.url }));
  ok(qr.svg && /lead\.html\?src=qr$/.test(qr.url), 'QR code rendered → ' + qr.url);
  // Lead capture validation + save
  await page.click('#btnLead'); await sleep(200);
  await page.click('#leadSubmit'); await sleep(150);
  const err = await page.$eval('#leadErr', e => e.textContent); ok(/name/i.test(err) && /consent/i.test(err), 'lead form validates required fields + consent');
  await page.type('#leadForm [name=name]', 'Test Visitor'); await page.type('#leadForm [name=company]', '=HYPERLINK("x")'); await page.type('#leadForm [name=email]', 'visitor@example.com');
  await page.select('#leadForm [name=interest]', 'Clean energy'); await page.click('#leadForm [name=consent]'); await page.click('#leadSubmit'); await sleep(200);
  const leads = await page.evaluate(() => SEAStore.leads()); ok(leads.length === 1 && leads[0].consent === 'yes' && leads[0].interest === 'Clean energy', 'lead stored locally with consent');
  const csv = await page.evaluate(() => SEAStore.toCSV(SEAStore.leads(), ['name', 'company', 'email'])); ok(csv.includes('"Test Visitor"') && csv.includes(`"'=HYPERLINK(""x"")"`), 'CSV export escapes quotes and blocks formula injection');
  await page.screenshot({ path: '/tmp/shot-desktop.png' });
  // Kiosk
  await page.click('#btnKiosk'); await sleep(300); ok(await page.evaluate(() => document.body.classList.contains('kiosk')), 'kiosk mode toggles on');
  await page.screenshot({ path: '/tmp/shot-kiosk.png' });
  await page.click('#btnKiosk');
  // Admin
  await page.goto(BASE + 'admin.html#analytics', { waitUntil: 'networkidle0' });
  const cards = await page.$eval('#cards', e => e.textContent); ok(/Questions asked/.test(cards), 'admin analytics cards render');
  const unans = await page.$eval('#unanswered', e => e.textContent); ok(/weather on mars/.test(unans), 'unanswered questions listed for content gaps');
  const topics = await page.$eval('#topTopics', e => e.textContent); ok(/Ports & logistics/.test(topics), 'top topics shown');
  const sp = await page.$eval('#signposts', e => e.textContent); ok(sp.length > 10 && !/No data/.test(sp), 'signposting clicks tracked');
  await page.screenshot({ path: '/tmp/shot-admin-analytics.png', fullPage: true });
  await page.click('[data-tab=leads]'); const lt = await page.$eval('#leadsTable', e => e.textContent); ok(lt.includes('visitor@example.com'), 'admin leads table shows lead');
  await page.click('[data-tab=content]');
  await page.evaluate(() => document.querySelector('tr[data-id="felixstowe"] button[data-act="toggle"]').click());
  const st = await page.evaluate(() => SEAStore.kb().find(b => b.id === 'felixstowe')); ok(st.status === 'blocked' && st.version === 2, 'admin blocks a source (version bumped)');
  // add a new block
  await page.evaluate(() => { const f = document.getElementById('blockForm'); f.id.value = 'test-ipswich-waterfront'; f.topic.value = 'Regeneration'; f.title.value = 'Ipswich Waterfront'; f.keywords.value = 'waterfront marina regeneration'; f.text.value = 'Test block: Ipswich Waterfront is a regenerated marina area.'; f.sourceName.value = 'Test source'; f.sourceUrl.value = 'https://example.org/waterfront'; f.requestSubmit(); });
  await page.screenshot({ path: '/tmp/shot-admin-content.png', fullPage: true });
  await page.goto(BASE + 'index.html?mute', { waitUntil: 'networkidle0' });
  r = await askQ('Tell me about the Port of Felixstowe'); ok(!r.cites.some(c => c.includes('Port_of_Felixstowe')), 'blocked source no longer used in answers', JSON.stringify(r));
  r = await askQ('Tell me about the waterfront marina'); ok(r.cites.some(c => c.includes('example.org/waterfront')), 'newly added content block is answerable immediately');
  await page.goto(BASE + 'admin.html', { waitUntil: 'networkidle0' });
  await page.type('#blockDomain', 'freeporteast.com'); await page.click('#btnBlockDomain'); await sleep(100);
  const nb = await page.evaluate(() => SEAStore.kb().filter(b => b.status === 'blocked').map(b => b.id)); ok(nb.includes('freeport') && nb.includes('gateway14'), 'emergency domain block: ' + nb.join(','));
  const audit = await page.evaluate(() => SEAStore.auditLog().map(a => a.action)); ok(audit.includes('emergency_block_domain') && audit.includes('block') && audit.includes('add'), 'audit log records changes: ' + audit.join(','));
  await page.evaluate(() => SEAStore.resetKb());
  // Attract loop + idle reset
  await page.goto(BASE + 'index.html?mute&attract=1500&idle=4500', { waitUntil: 'networkidle0' });
  await sleep(2300); ok(await page.$eval('#attract', e => !e.hidden), 'attract loop appears after idle');
  ok(await page.$eval('#avatar', e => e.classList.contains('waving')), 'avatar waves in attract loop');
  await page.mouse.click(400, 400); await sleep(200); ok(await page.$eval('#attract', e => e.hidden), 'tap dismisses attract loop');
  const s1 = await page.evaluate(() => window.__demo.state().session);
  await askQ('What is Sizewell C?');
  await sleep(3400); ok(await page.$eval('#idleWarn', e => !e.hidden), 'idle warning shown before reset');
  await sleep(2200);
  const st2 = await page.evaluate(() => ({ s: window.__demo.state(), n: document.querySelectorAll('.msg').length }));
  ok(st2.s.session !== s1 && st2.n === 1 && st2.s.turns === 0, 'idle reset clears conversation & starts new session', JSON.stringify(st2));
  // lead.html
  await page.goto(BASE + 'lead.html?src=qr', { waitUntil: 'networkidle0' });
  await page.type('[name=name]', 'QR Visitor'); await page.type('[name=email]', 'qr@example.com'); await page.click('[name=consent]'); await page.click('button.primary'); await sleep(150);
  const l2 = await page.evaluate(() => SEAStore.leads().pop()); ok(l2 && l2.source === 'qr', 'QR follow-up page stores lead with source=qr');
  // mobile
  await page.setViewport({ width: 390, height: 844, isMobile: true });
  await page.goto(BASE + 'index.html?mute', { waitUntil: 'networkidle0' }); await askQ('Where can I study in Suffolk?');
  await page.screenshot({ path: '/tmp/shot-mobile.png', fullPage: true });
  ok(errors.length === 0, 'no JS errors', errors.join(' | '));
  await browser.close();
  console.log(`\nE2E: ${pass} passed, ${fail} failed`); process.exit(fail ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2); });
