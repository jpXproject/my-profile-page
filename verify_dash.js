/* E2E test: live dashboard (token login + stats render) */
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

  await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
  await page.goto('https://jpxcode.pages.dev/dashboard', { waitUntil: 'networkidle0', timeout: 60000 });
  await new Promise(r => setTimeout(r, 2500));

  const gateState = await page.evaluate(() => ({
    gateVisible: !document.getElementById('gate').hidden,
    dashHidden: document.getElementById('dash').hidden,
  }));

  // token SALAH
  await page.type('#tokenInput', 'wrongtoken123');
  await page.click('#unlockBtn');
  await new Promise(r => setTimeout(r, 2500));
  const wrongToken = await page.evaluate(() => ({
    errorText: document.getElementById('gateError').textContent,
    stillGated: !document.getElementById('dash').hidden === false,
  }));

  // token BENAR
  const token = process.env.TOKEN || '';
  if (!token) { console.log('FATAL: env TOKEN kosong'); process.exit(1); }
  await page.type('#tokenInput', token);
  await page.click('#unlockBtn');
  await new Promise(r => setTimeout(r, 3500));

  const unlocked = await page.evaluate(() => ({
    dashVisible: !document.getElementById('dash').hidden,
    total: document.getElementById('totalNum').textContent,
    items: document.querySelectorAll('#statList .item').length,
    hasResetBtn: !!document.getElementById('resetBtn'),
    updatedAt: document.getElementById('updatedAt').textContent,
  }));

  await page.screenshot({ path: 'C:/Users/XCODE/myPage/shot_dashboard.png' });
  console.log('GATE AWAL:', JSON.stringify(gateState));
  console.log('TOKEN SALAH:', JSON.stringify(wrongToken));
  console.log('TOKEN BENAR:', JSON.stringify(unlocked, null, 2));
  console.log('\nCONSOLE ERRORS:', errors.length ? '\n' + errors.join('\n') : 'NONE ✅');

  await browser.close();
  if (fs.existsSync(userDataDir)) fs.rmSync(userDataDir, { recursive: true, force: true });
})().catch(e => { console.error('FATAL:', e.message); process.exit(1); });
