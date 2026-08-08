/* Verify Profile Links page — layout + click counter (localStorage) test */
const puppeteer = require('C:/Users/XCODE/jpXMotionStudios/backend/node_modules/puppeteer');
const fs = require('fs');

(async () => {
  const url = 'file:///C:/Users/XCODE/myPage/index.html';
  const userDataDir = 'C:/Users/XCODE/myPage/.chromeprofile';
  if (fs.existsSync(userDataDir)) fs.rmSync(userDataDir, { recursive: true, force: true });

  const browser = await puppeteer.launch({
    headless: 'new',
    executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
    userDataDir,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu', '--disable-dev-shm-usage'],
    timeout: 60000
  });
  const errors = [];

  async function check(viewport, label) {
    const page = await browser.newPage();
    page.on('console', m => { if (m.type() === 'error') errors.push(`[${label}] ${m.text()}`); });
    page.on('pageerror', e => errors.push(`[${label}] ${e.message}`));
    await page.setViewport(viewport);
    await page.goto(url, { waitUntil: 'networkidle0', timeout: 45000 });
    await new Promise(r => setTimeout(r, 3000));

    const data = await page.evaluate(() => {
      const q = s => document.querySelector(s);
      const featured = q('.link-btn.featured');
      return {
        title: document.title,
        hScroll: document.documentElement.scrollWidth - document.documentElement.clientWidth,
        linkButtons: document.querySelectorAll('.link-btn:not(.placeholder)').length,
        featuredHref: featured ? featured.getAttribute('href') : null,
        photoLoaded: document.body.classList.contains('has-photo'),
        avatarSrc: q('#avatarImg') ? q('#avatarImg').getAttribute('src') : null,
        totalClicksText: q('#totalClicks') ? q('#totalClicks').textContent : null,
        hasResetBtn: !!q('#resetClicks'),
      };
    });

    await page.screenshot({ path: `C:/Users/XCODE/myPage/shot_${label}.png` });
    console.log(`\n=== ${label} (${viewport.width}x${viewport.height}) ===`);
    console.log(JSON.stringify(data, null, 2));
    await page.close();
  }

  await check({ width: 390, height: 844, isMobile: true, hasTouch: true, deviceScaleFactor: 2 }, 'mobile');
  await check({ width: 1440, height: 900, deviceScaleFactor: 1 }, 'desktop');

  /* ===== CLICK COUNTER TEST ===== */
  console.log('\n=== CLICK COUNTER TEST (localStorage) ===');
  const page = await browser.newPage();
  page.on('console', m => { if (m.type() === 'error') errors.push(`[counter] ${m.text()}`); });
  page.on('pageerror', e => errors.push(`[counter] ${e.message}`));
  await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
  await page.goto(url, { waitUntil: 'networkidle0', timeout: 45000 });
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 2500));

  const before = await page.evaluate(() => document.querySelectorAll('.lb-count.show').length);
  // klik tombol featured 2x
  await page.evaluate(() => {
    const f = document.querySelector('.link-btn.featured');
    f.click(); f.click();
  });
  await new Promise(r => setTimeout(r, 900));

  const after = await page.evaluate(() => ({
    badgesShown: document.querySelectorAll('.lb-count.show').length,
    featuredNum: document.querySelector('.link-btn.featured .lb-count-num').textContent,
    total: document.getElementById('totalClicks').textContent,
    stored: JSON.parse(localStorage.getItem('jpx_link_clicks_v1') || '{}'),
  }));

  // reload → hitungan harus tetap (persisten)
  await page.reload({ waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 1500));
  const persisted = await page.evaluate(() => ({
    badgesShown: document.querySelectorAll('.lb-count.show').length,
    featuredNum: document.querySelector('.link-btn.featured .lb-count-num').textContent,
    total: document.getElementById('totalClicks').textContent,
  }));

  // klik reset → harus nol lagi
  await page.evaluate(() => document.getElementById('resetClicks').click());
  await new Promise(r => setTimeout(r, 600));
  const afterReset = await page.evaluate(() => ({
    badgesShown: document.querySelectorAll('.lb-count.show').length,
    total: document.getElementById('totalClicks').textContent,
    stored: localStorage.getItem('jpx_link_clicks_v1'),
  }));

  console.log('badges sebelum klik:', before);
  console.log('setelah 2 klik:', JSON.stringify(after));
  console.log('setelah reload (persisten):', JSON.stringify(persisted));
  console.log('setelah reset:', JSON.stringify(afterReset));
  await page.close();

  console.log('\n=== CONSOLE ERRORS ===');
  console.log(errors.length ? errors.join('\n') : 'NONE ✅');
  await browser.close();
  if (fs.existsSync(userDataDir)) fs.rmSync(userDataDir, { recursive: true, force: true });
})().catch(e => { console.error('FATAL:', e.message); process.exit(1); });
