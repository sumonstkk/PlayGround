import { createRequire } from 'node:module';
import { resolve, sep } from 'node:path';
import { mkdirSync } from 'node:fs';

const runtime = resolve(process.env.HOME, '.local/share/omgithub-playwright');
const require = createRequire(resolve(runtime, 'package.json'));
const { chromium } = require('playwright');
const captures = require(resolve(runtime, 'wip-screenshots.cjs'));
captures.instrument({ chromium });
const config = require('node:fs').readFileSync(resolve(runtime, process.platform === 'darwin' ? 'metal.json' : 'linux.json'), 'utf8');
const browserConfig = JSON.parse(config);
if (process.platform === 'linux') {
  process.env.DISPLAY ||= require('node:fs').readFileSync(resolve(runtime, 'display'), 'utf8').trim().replace(/^/, ':');
}

const url = process.env.CAPTURE_URL;
const output = process.env.CAPTURE_DIR && resolve(process.env.CAPTURE_DIR);
const project = resolve(process.cwd());
if (!url || !output) throw new Error('Set CAPTURE_URL and CAPTURE_DIR.');
if (!/^https?:\/\//i.test(url)) throw new Error('CAPTURE_URL must be an HTTP(S) URL.');
if (output === project || output.startsWith(project + sep)) throw new Error('CAPTURE_DIR must be outside the project.');
mkdirSync(output, { recursive: true });

const transient = error => Object.assign(error instanceof Error ? error : new Error(String(error)), { exitCode: 75 });
const defect = message => Object.assign(new Error(message), { exitCode: 1 });
let browser;
try {
  browser = await chromium.launch({ ...browserConfig.browser.launchOptions, timeout: 30000 }).catch(error => { throw transient(error); });
  for (const [name, width, height, mobile] of [['desktop', 1440, 900, false], ['mobile', 390, 844, true]]) {
    const page = await browser.newPage({ viewport: { width, height }, isMobile: mobile, hasTouch: mobile }).catch(error => { throw transient(error); });
    page.setDefaultTimeout(30000);
    const pageErrors = [];
    page.on('pageerror', error => pageErrors.push(error.message));
    let response;
    try {
      response = await page.goto(url, { waitUntil: 'load', timeout: 45000 });
    } catch (error) {
      throw transient(error);
    }
    if (!response?.ok()) {
      const status = response?.status();
      throw status === undefined || [408, 429, 500, 502, 503, 504].includes(status)
        ? transient(new Error(`Temporary HTTP ${status ?? 'navigation'} failure loading ${url}`))
        : defect(`HTTP ${status} loading ${url}`);
    }

    try {
      await page.locator('#game').waitFor({ state: 'visible', timeout: 20000 });
      await page.waitForFunction(() => {
        const canvas = document.querySelector('#game');
        return canvas && canvas.width > 0 && canvas.height > 0 &&
          (canvas.getContext('webgl2') || canvas.getContext('webgl')) &&
          document.querySelector('#start-button')?.getBoundingClientRect().width > 0;
      }, null, { timeout: 20000 });
    } catch (error) {
      if (!browser.isConnected() || error.name === 'TimeoutError') {
        throw defect(`Game did not render a WebGL scene for ${name}: ${error.message}`);
      }
      throw error;
    }
    if (pageErrors.length) throw defect(`Browser rendering error: ${pageErrors.join('; ')}`);

    const startButton = page.locator('#start-button');
    if (await startButton.isVisible().catch(() => false)) {
      try { await startButton.click({ timeout: 5000 }); }
      catch (error) { throw defect(`Could not enter the rendered game: ${error.message}`); }
    }
    await page.waitForTimeout(1200);
    if (pageErrors.length) throw defect(`Browser rendering error: ${pageErrors.join('; ')}`);
    try {
      await page.screenshot({ path: resolve(output, `final-${name}.png`), timeout: 30000 });
    } catch (error) {
      if (!browser.isConnected() || error.name === 'TimeoutError') throw transient(error);
      throw defect(`Could not save ${name} screenshot: ${error.message}`);
    }
    console.log(`Captured ${name} ${width}x${height} view at ${url}`);
    await page.close();
  }
} catch (error) {
  console.error(error);
  process.exitCode = error.exitCode || 1;
} finally {
  try { await browser?.close(); }
  catch (error) { console.error(error); process.exitCode ||= 75; }
}
