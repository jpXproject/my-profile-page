/* E2E test: online global click counter on live jpxcode.pages.dev */
const puppeteer = require('C:/Users/XCODE/jpXMotionStudios/backend/node_modules/puppeteer');
const fs = require('fs');

(async () => {
  const userDataDir = 'C:/Users/XCODE/myPage/.chromeprofile';
  if (fs.existsSync(userDataDir)) fs.rmSync(userDataDir, { recursive: true, force: true });

  const browser = await puppeteer.launch({
    headless: 'new',
    executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
    userDataDir,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu', '--disable-dev-shm-usage'],
    timeout: 60000
  });
  const page = await browser.newPage();
  const errors = [];
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('pageerror', e => errors.push(e.message));
  page.on('requestfailed', r => errors.push('REQ FAIL: ' + r.url().slice(0, 80) + ' ' + (r.failure() || {}).errorText));

  await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
  await page.goto('https://jpxcode.pages.dev/', { waitUntil: 'networkidle0', timeout: 60000 });
  await new Promise(r => setTimeout(r, 4500));

  const before = await page.evaluate(() => {
    const btns = document.querySelectorAll('.link-btn:not(.placeholder)');
    return {
      total: document.getElementById('totalClicks').textContent,
      badgesShown: document.querySelectorAll('.lb-count.show').length,
      freebuffBadge: btns[0].querySelector('.lb-count-num').textContent,
      githubBadge: btns[1].querySelector('.lb-count-num').textContent,
    };
  });

  // klik tombol GitHub (index 1) → harus +1 global
  await page.evaluate(() => {
    document.querySelectorAll('.link-btn:not(.placeholder)')[1].click();
  });
  await new Promise(r => setTimeout(r, 3000));

  const after = await page.evaluate(() => {
    const btns = document.querySelectorAll('.link-btn:not(.placeholder)');
    return {
      total: document.getElementById('totalClicks').textContent,
      githubBadge: btns[1].querySelector('.lb-count-num').textContent,
      githubShown: btns[1].querySelector('.lb-count').classList.contains('show'),
    };
  });

  await page.screenshot({ path: 'C:/Users/XCODE/myPage/shot_live_online.png' });
  console.log('SEBELUM KLIK:', JSON.stringify(before, null, 2));
  console.log('SESUDAH KLIK GITHUB:', JSON.stringify(after, null, 2));
  console.log('\nCONSOLE ERRORS:', errors.length ? '\n' + errors.join('\n') : 'NONE ✅');

  await browser.close();
  if (fs.existsSync(userDataDir)) fs.rmSync(userDataDir, { recursive: true, force: true });
})().catch(e => { console.error('FATAL:', e.message); process.exit(1); });
