import { describe, expect, test } from 'bun:test';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (file) => readFileSync(join(root, file), 'utf8');

class Element {
  listeners = {};
  hidden = false;
  disabled = false;
  value = '';
  type = '';
  attrs = {};
  textContent = '';
  children = {};
  addEventListener(name, fn) { this.listeners[name] = fn; }
  dispatch(name, event = {}) { return this.listeners[name]?.({ preventDefault() {}, currentTarget: this, target: this, ...event }); }
  setAttribute(name, value) { this.attrs[name] = value; }
  focus() { this.focused = true; }
  reset() { this.value = ''; }
  querySelector(selector) { return this.children[selector]; }
}

function frontendDemo() {
  const selectors = ['#login-form', '#login-view', '#home-view', '#login-submit', '#login-error', '#password', '#toggle-password', '#username', '#logout-button', '#user-name', '#session-status'];
  const elements = Object.fromEntries(selectors.map((selector) => [selector, new Element()]));
  elements['#login-submit'].children.span = new Element();
  elements['#password'].type = 'password';
  elements['#home-view'].hidden = true;
  const storage = new Map();
  const context = {
    document: { querySelector: (selector) => elements[selector] },
    window: { APP_CONFIG: { demoUser: 'demo', demoPassword: 'demo123' } },
    sessionStorage: {
      setItem: (key, value) => storage.set(key, value),
      getItem: (key) => storage.get(key) ?? null,
      removeItem: (key) => storage.delete(key)
    },
    setTimeout: (fn) => { fn(); return 1; },
    clearTimeout() {},
    Promise
  };
  vm.runInNewContext(read('app.js'), context);
  return { elements, storage };
}

function scriptApi() {
  const sessions = new Map();
  const sheet = {
    getLastRow: () => 2,
    getDataRange: () => ({ getValues: () => [
      ['usuario', 'pass', 'rol', 'alcances', 'mail', 'nombre', 'docenteId'],
      ['demo', 'demo123', 'admin', '[]', 'demo@example.org', 'Administrador', '']
    ] })
  };
  const context = {
    Date, JSON, String, Error, Object, Array,
    SpreadsheetApp: { getActiveSpreadsheet: () => ({ getSheetByName: (name) => name === 'Usuarios' ? sheet : null }) },
    CacheService: { getScriptCache: () => ({
      get: (key) => sessions.get(key) ?? null,
      put: (key, value) => sessions.set(key, value),
      remove: (key) => sessions.delete(key)
    }) },
    Utilities: { getUuid: (() => { let n = 0; return () => `uuid-${++n}`; })() },
    ContentService: { createTextOutput: (value) => ({ getContent: () => value, setMimeType() { return this; } }), MimeType: { JSON: 'application/json' } }
  };
  vm.createContext(context);
  vm.runInContext(read('apps-script/Code.gs'), context);
  const doPost = vm.runInContext('doPost', context);
  return (body) => JSON.parse(doPost({ postData: { contents: JSON.stringify(body) } }).getContent());
}

describe('plantilla inicial', () => {
  test('HTML/CSS ofrece login accesible y layout responsive', () => {
    const html = read('index.html');
    const css = read('styles.css');
    const config = read('config.js');
    expect(html).toContain('<html lang="es-AR">');
    expect(html).toContain('name="username"');
    expect(html).toContain('name="password"');
    expect(html).toContain('aria-live="polite"');
    expect(html).toContain('aria-describedby="username-error"');
    expect(html).toContain('id="home-view"');
    expect(css).toContain('@media (max-width: 760px)');
    expect(css).toContain('@media (max-width: 380px)');
    expect(css).toContain('prefers-reduced-motion');
    expect(css).toContain('height: 48px');
    expect(config).toContain("demoUser: 'demo'");
    expect(config).toContain("demoPassword: 'demo123'");
    for (const source of [html, css, config, read('app.js')]) expect(source).not.toMatch(/https?:\/\//);
  });

  test('login mock valida vacíos/credenciales, entra y cierra sesión', async () => {
    const { elements, storage } = frontendDemo();
    expect(elements['#login-view'].hidden).toBe(false);
    await elements['#login-form'].dispatch('submit');
    expect(elements['#login-error'].textContent).toContain('Completá usuario');
    elements['#username'].value = 'demo';
    elements['#password'].value = 'incorrecta';
    await elements['#login-form'].dispatch('submit');
    expect(elements['#login-error'].textContent).toContain('No coincide');
    elements['#password'].value = 'demo123';
    await elements['#login-form'].dispatch('submit');
    expect(elements['#home-view'].hidden).toBe(false);
    expect(elements['#user-name'].textContent).toBe('demo');
    expect(storage.get('appScaffoldDemoSession')).toBe('demo');
    elements['#logout-button'].dispatch('click');
    expect(elements['#login-view'].hidden).toBe(false);
    expect(storage.has('appScaffoldDemoSession')).toBe(false);
  });

  test('Code.gs autentica y administra la sesión; setup no es destructivo', () => {
    const code = read('apps-script/Code.gs');
    const manifest = JSON.parse(read('apps-script/appsscript.json'));
    const instructions = read('apps-script/README.md');
    expect(code).toContain('function setupTemplate()');
    expect(code).toContain('function login_(username, password)');
    expect(code).toContain('function requireSession_(token)');
    expect(code).toContain("['usuario', 'pass', 'rol']");
    expect(code).toContain('function resetDatabase(email, confirmation, token)');
    expect(code).toContain('function showResetDialog()');
    expect(code).toContain('CacheService.getUserCache()');
    expect(code).toContain("userCache.get(tokenKey) !== tokenValue");
    expect(code).toContain("remove('DATA_VERSION')");
    expect(code).not.toContain("body.action === 'reset'");
    expect(code).toContain('function showResetDialog()');
    expect(code).toContain('function onOpen()');
    expect(code).toContain('LockService.getDocumentLock()');
    expect(code).toContain('finally {\n    lock.releaseLock();');
    expect(code).not.toContain('clearContents');
    expect(manifest.runtimeVersion).toBe('V8');
    expect(manifest.oauthScopes).toContain('https://www.googleapis.com/auth/spreadsheets');
    expect(manifest.oauthScopes).toContain('https://www.googleapis.com/auth/script.container.ui');
    expect(manifest.oauthScopes).toEqual(['https://www.googleapis.com/auth/spreadsheets', 'https://www.googleapis.com/auth/script.container.ui']);
    expect(instructions).toContain('despliegue manual');
    expect(instructions).toContain('planilla nueva de prueba');

    const post = scriptApi();
    expect(post({ action: 'auth', username: 'demo', password: 'mal' }).error).toBe('INVALID_CREDENTIALS');
    const auth = post({ action: 'auth', username: 'DEMO', password: 'demo123' });
    expect(auth.ok).toBe(true);
    expect(auth.role).toBe('admin');
    const who = post({ action: 'whoami', sessionToken: auth.sessionToken });
    expect(who.user).toEqual({ username: 'demo', role: 'admin' });
    expect(post({ action: 'logout', sessionToken: auth.sessionToken }).ok).toBe(true);
    expect(post({ action: 'whoami', sessionToken: auth.sessionToken }).error).toBe('SESSION_EXPIRED');
  });
});
