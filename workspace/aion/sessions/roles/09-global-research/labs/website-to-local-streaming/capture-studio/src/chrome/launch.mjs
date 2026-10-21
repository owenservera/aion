// Launch a dedicated, loopback-only Chrome profile for capture.
// Chrome 136+ refuses remote debugging on the default profile, so a separate --user-data-dir
// is both required and safer: the person signs in to the sites they want captured once, there.
import { spawn } from 'node:child_process';
import { existsSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { isReachable, browserVersion } from '../cdp/discovery.mjs';

export function chromeCandidates(env = process.env, platform = process.platform) {
  const c = [];
  if (env.CHROME_PATH) c.push(env.CHROME_PATH);
  if (platform === 'win32') {
    for (const base of [env['PROGRAMFILES'], env['PROGRAMFILES(X86)'], env.LOCALAPPDATA].filter(Boolean)) {
      c.push(path.win32.join(base, 'Google', 'Chrome', 'Application', 'chrome.exe'));
      c.push(path.win32.join(base, 'Google', 'Chrome Beta', 'Application', 'chrome.exe'));
      c.push(path.win32.join(base, 'Google', 'Chrome SxS', 'Application', 'chrome.exe'));
      c.push(path.win32.join(base, 'Chromium', 'Application', 'chrome.exe'));
      c.push(path.win32.join(base, 'Microsoft', 'Edge', 'Application', 'msedge.exe'));
    }
  } else if (platform === 'darwin') {
    c.push('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome');
    c.push('/Applications/Chromium.app/Contents/MacOS/Chromium');
  } else {
    c.push('/usr/bin/google-chrome', '/usr/bin/google-chrome-stable', '/usr/bin/chromium', '/usr/bin/chromium-browser');
  }
  return c;
}

export function findChrome() {
  const hit = chromeCandidates().find((p) => p && existsSync(p));
  if (!hit) throw new Error('Chrome not found. Set CHROME_PATH to chrome.exe.');
  return hit;
}

export async function launchChrome({ profileDir, port = 9222, url = 'about:blank', headless = false, extraArgs = [] } = {}) {
  if (await isReachable({ port })) {
    const v = await browserVersion({ port });
    return { alreadyRunning: true, port, browser: v.Browser, pid: null };
  }
  mkdirSync(profileDir, { recursive: true });
  const exe = findChrome();
  const args = [
    `--remote-debugging-port=${port}`,
    '--remote-debugging-address=127.0.0.1',
    `--user-data-dir=${profileDir}`,
    '--no-first-run',
    '--no-default-browser-check',
    ...(headless ? ['--headless=new'] : []),
    ...extraArgs,
    url,
  ];
  const child = spawn(exe, args, { detached: true, stdio: 'ignore', windowsHide: false });
  child.unref();
  for (let i = 0; i < 60; i++) {
    if (await isReachable({ port })) {
      const v = await browserVersion({ port });
      return { alreadyRunning: false, port, browser: v.Browser, pid: child.pid, exe, profileDir };
    }
    await new Promise((r) => setTimeout(r, 250));
  }
  throw new Error(`Chrome started (pid ${child.pid}) but DevTools did not answer on 127.0.0.1:${port}. Close other Chrome windows using that profile and retry.`);
}
