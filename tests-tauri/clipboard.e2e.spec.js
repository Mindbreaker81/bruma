import os from 'node:os';
import path from 'node:path';
import { writeFileSync, mkdirSync } from 'node:fs';

import { expect } from 'chai';
import { By, Key, until } from 'selenium-webdriver';

import {
  ensureSession,
  shutdownSession,
  ensureEditorView,
  repoRoot,
} from './session.js';
import {
  clipboardAvailable,
  getClipboardFormats,
  getClipboardText,
  setClipboardText,
} from './clipboard-os.js';

// Automates the parts of the D1 protocol and the V1–V9 matrix that do not
// need a human at the OS menu bar: real keystrokes through the platform
// WebDriver (msedgedriver on Windows, WebKitWebDriver on Linux) and the real
// system clipboard (PowerShell / xclip / pbpaste).
//
// Still manual: V2 and D1-3 (clicking items of the native Win32/GTK menu and
// the WebView2 context menu need UI Automation), V8 (menu relabeling, UIA).

const MOD = process.platform === 'darwin' ? Key.META : Key.CONTROL;
const REDO_CHORD =
  process.platform === 'darwin'
    ? Key.chord(Key.META, Key.SHIFT, 'z')
    : Key.chord(Key.CONTROL, 'y');

let driver;

before(async function () {
  this.timeout(180000);

  if (!clipboardAvailable()) {
    // eslint-disable-next-line no-console
    console.log('Skipping clipboard E2E: no OS clipboard tool available.');
    this.skip();
  }

  driver = await ensureSession();

  // Open a real document so the editor exists (welcome screen otherwise).
  const e2eDir = path.join(os.homedir(), '.bruma-e2e');
  mkdirSync(e2eDir, { recursive: true });
  const docPath = path.join(e2eDir, 'clip.md');
  writeFileSync(docPath, '# Doc E2E\n', 'utf8');
  await driver.executeScript(
    'return window.brumaE2E.openFileFromPath(arguments[0]);',
    docPath
  );
  await ensureEditorView(driver);
  await driver.wait(until.elementLocated(By.css('.cm-content')), 30000);
});

after(async function () {
  this.timeout(30000);
  await shutdownSession();
});

async function editorElement() {
  return driver.findElement(By.css('.cm-content'));
}

// WebKitWebDriver is strict about WebDriver "interactability"; the JS fallback
// exercises the same app logic when the trusted path is unavailable.
async function realClick(el) {
  try {
    await el.click();
  } catch {
    await driver.executeScript('arguments[0].click()', el);
  }
}

async function focusEditor() {
  const el = await editorElement();
  await realClick(el);
  await driver.executeScript('arguments[0].focus()', el);
  await driver.wait(
    () =>
      driver.executeScript(
        'return Boolean(document.activeElement && document.activeElement.closest(".cm-content"));'
      ),
    10000
  );
  return el;
}

async function rightClick(el) {
  try {
    await driver.actions().contextClick(el).perform();
  } catch {
    await driver.executeScript(
      'const r = arguments[0].getBoundingClientRect();' +
        'arguments[0].dispatchEvent(new MouseEvent("contextmenu", {bubbles: true, cancelable: true, clientX: r.left + 10, clientY: r.top + 10}));',
      el
    );
  }
}

// IconButton renders its accessible name in a `.sr-only` span, not aria-label.
async function iconButton(iconClass) {
  return driver.findElement(
    By.xpath(`//button[.//*[contains(@class,"${iconClass}")]]`)
  );
}

// Element sendKeys parses modifier characters (Key.chord) server-side;
// actions().sendKeys drops the modifiers on WebKitWebDriver.
async function typeText(el, text) {
  try {
    await el.sendKeys(text);
  } catch {
    await driver.actions().sendKeys(text).perform();
  }
}

async function sendChord(el, ...keys) {
  const chord = Key.chord(...keys);
  try {
    await el.sendKeys(chord);
  } catch {
    await driver.actions().sendKeys(chord).perform();
  }
}

async function setContent(text) {
  await driver.executeScript(
    'window.brumaE2E.setActiveContent(arguments[0]);',
    text
  );
}

async function getContent() {
  return driver.executeScript('return window.brumaE2E.getActiveContent();');
}

// The store only updates after the editor's onChange debounce (~120 ms).
async function waitForContent(expected, { exact = false } = {}) {
  await driver.wait(async () => {
    const content = await getContent();
    if (typeof content !== 'string') return false;
    return exact ? content === expected : content.includes(expected);
  }, 10000);
}

async function waitForClipboardText(expected) {
  await driver.wait(async () => {
    try {
      return getClipboardText().includes(expected);
    } catch {
      return false;
    }
  }, 10000);
}

describe('Portapapeles y edición (E2E nativo)', () => {
  it('D1-1/D1-5: Ctrl+C copies the selection and fires the DOM copy event', async function () {
    this.timeout(60000);
    await setContent('texto d1');
    await waitForContent('texto d1');
    const editor = await focusEditor();

    await driver.executeScript(
      'window.__copyEvents = 0;' +
        'document.querySelector(".cm-content").addEventListener("copy", () => window.__copyEvents++, true);'
    );

    await sendChord(editor, MOD, 'a');
    await sendChord(editor, MOD, 'c');

    await waitForClipboardText('texto d1');

    const copyEvents = await driver.executeScript(
      'return window.__copyEvents;'
    );
    expect(copyEvents).to.be.greaterThan(0);
  });

  it('D1-2: Ctrl+V pastes the system clipboard into the editor', async function () {
    this.timeout(60000);
    setClipboardText('desde el portapapeles');
    await setContent('');
    const editor = await focusEditor();

    await sendChord(editor, MOD, 'v');

    await waitForContent('desde el portapapeles');
  });

  it('D1-4/V4: Ctrl+Z undoes once and redo restores', async function () {
    this.timeout(60000);
    // Seed content so a double-fired undo would overshoot and be detected.
    await setContent('BASE\n');
    await waitForContent('BASE');
    const editor = await focusEditor();
    await typeText(editor, Key.END);
    await typeText(editor, 'extra');
    await waitForContent('BASE\nextra', { exact: true });

    await sendChord(editor, MOD, 'z');
    await waitForContent('BASE\n', { exact: true });

    try {
      await editor.sendKeys(REDO_CHORD);
    } catch {
      await driver.actions().sendKeys(REDO_CHORD).perform();
    }
    await waitForContent('BASE\nextra', { exact: true });
  });

  it('V5: Ctrl+Z inside the search field only affects the field', async function () {
    this.timeout(60000);
    await setContent('documento intacto');
    await waitForContent('documento intacto');

    await realClick(await iconButton('lucide-search'));

    const searchInput = await driver.wait(
      until.elementLocated(
        By.xpath(
          "//input[contains(@placeholder,'Search') or contains(@placeholder,'Buscar')]"
        )
      ),
      10000
    );
    await realClick(searchInput);
    await driver.executeScript('arguments[0].focus()', searchInput);
    await typeText(searchInput, 'texto buscado');
    expect(await searchInput.getAttribute('value')).to.equal('texto buscado');

    await sendChord(searchInput, MOD, 'z');

    const value = await searchInput.getAttribute('value');
    // The critical part: the document must be untouched. Field-level undo
    // depends on native input-undo support (WebView2 yes; WebKitGTK no).
    expect(await getContent()).to.equal('documento intacto');
    if (process.platform === 'win32') {
      // WebView2 (Chromium) undo granularity in controlled inputs is not
      // guaranteed to clear the field in one step — hardware runs have
      // produced partial results ('te' after 'texto buscado'). Assert that
      // undo actually engaged instead of requiring an exact value.
      expect(value).to.not.equal('texto buscado');
    } else {
      // eslint-disable-next-line no-console
      console.log(`V5 field value after Ctrl+Z: '${value}'`);
    }
  });

  it('V7: right click on the editor shows the app context menu', async function () {
    this.timeout(60000);
    await focusEditor();
    await rightClick(await editorElement());

    // Radix marks an open menu with data-state="open". Selenium's
    // isDisplayed() can report false for portaled/fixed menus, so check the
    // component state plus a real layout box instead.
    const menu = await driver.wait(async () => {
      const menus = await driver.findElements(
        By.css('[role="menu"][data-state="open"]')
      );
      return menus.length > 0 ? menus[0] : false;
    }, 10000);
    expect(
      await driver.executeScript(
        'return arguments[0].getClientRects().length > 0;',
        menu
      )
    ).to.equal(true);

    await driver.actions().sendKeys(Key.ESCAPE).perform();
    await driver.wait(async () => {
      const open = await driver.findElements(
        By.css('[role="menu"][data-state="open"]')
      );
      return open.length === 0;
    }, 10000);
  });

  it('V3: the toolbar Paste button inserts the system clipboard', async function () {
    this.timeout(60000);
    if (process.platform === 'linux' && !process.env.DISPLAY) {
      // R4: navigator.clipboard may be unavailable headless; the button then
      // self-disables and the check is meaningless here.
      this.skip();
    }
    setClipboardText('pegado por boton');
    await setContent('');
    await focusEditor();

    const pasteButton = await iconButton('lucide-clipboard-paste');
    if (!(await pasteButton.isEnabled())) {
      // eslint-disable-next-line no-console
      console.log('Paste button disabled (canReadClipboard=false) — R4 path.');
      this.skip();
    }
    await realClick(pasteButton);

    // WebView2 shows a Fluent permission infobar on first readText()
    // ("Permitir") injected into the page DOM; grant it if present.
    // When the profile already holds the grant no prompt appears.
    if (process.platform === 'win32') {
      await driver
        .wait(async () => {
          const buttons = await driver.findElements(
            By.css('fluent-button#allow-button')
          );
          if (buttons.length === 0) return false;
          await driver.executeScript('arguments[0].click()', buttons[0]);
          return true;
        }, 3000)
        .catch(() => {});
    }

    try {
      await waitForContent('pegado por boton');
    } catch (error) {
      // navigator.clipboard.readText() exists but rejects without a user
      // gesture on WebKitGTK/headless — only Windows CI hard-verifies this.
      if (process.platform !== 'win32') {
        // eslint-disable-next-line no-console
        console.log(`Paste readText unavailable here — ${error}`);
        this.skip();
      }
      throw error;
    }
  });

  it('V9: context menu «Copiar como HTML» writes HTML to the clipboard', async function () {
    this.timeout(60000);
    await setContent('# Titulo HTML');
    await waitForContent('Titulo HTML');
    await focusEditor();

    await rightClick(await editorElement());
    const item = await driver.wait(
      until.elementLocated(
        By.xpath("//*[@role='menuitem' and (contains(.,'HTML'))]")
      ),
      10000
    );
    await realClick(item);

    // Plain text must always land; HTML format is asserted where the OS
    // exposes it (Windows CF_HTML / Linux text/html target).
    await driver.wait(async () => {
      try {
        return getClipboardText().length > 0;
      } catch {
        return false;
      }
    }, 10000);

    // The HTML flavour is only guaranteed where the webview supports
    // ClipboardItem with text/html (WebView2). Elsewhere the app degrades to
    // plain text by design (R2) — log the offered formats for diagnosis.
    const formats = getClipboardFormats();
    if (process.platform === 'win32') {
      const hasHtml = formats.some((f) => /html/i.test(String(f)));
      expect(hasHtml, `clipboard formats: ${formats}`).to.equal(true);
    } else {
      // eslint-disable-next-line no-console
      console.log(`V9 clipboard formats: ${formats}`);
    }
  });
});
