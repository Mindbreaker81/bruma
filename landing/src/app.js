const THEME_KEY = 'bruma-landing-theme';

function getPreferredTheme() {
  const stored = localStorage.getItem(THEME_KEY);
  if (stored === 'light' || stored === 'dark') {
    return stored;
  }
  if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
    return 'dark';
  }
  return 'light';
}

function applyTheme(theme) {
  const root = document.documentElement;
  if (theme === 'dark') {
    root.setAttribute('data-theme', 'dark');
  } else {
    root.setAttribute('data-theme', 'light');
  }
  const toggle = document.getElementById('theme-toggle');
  if (toggle) {
    toggle.setAttribute('aria-pressed', theme === 'dark' ? 'true' : 'false');
    toggle.textContent = theme === 'dark' ? 'Tema claro' : 'Tema oscuro';
  }
}

function cycleTheme() {
  const next = getPreferredTheme() === 'dark' ? 'light' : 'dark';
  localStorage.setItem(THEME_KEY, next);
  applyTheme(next);
}

function openDetailsFromHash() {
  const hash = window.location.hash.slice(1);
  if (hash === 'readme') {
    const el = document.getElementById('details-readme');
    if (el) el.open = true;
  }
  if (hash === 'changelog') {
    const el = document.getElementById('details-changelog');
    if (el) el.open = true;
  }
}

async function copyPreCode(event) {
  const pre = event.target.closest('.md-content pre');
  if (!pre || !pre.contains(event.target)) {
    return;
  }
  const code = pre.querySelector('code');
  const text = code ? code.innerText : pre.innerText;
  try {
    await navigator.clipboard.writeText(text.trimEnd());
    pre.setAttribute('data-copied', 'true');
    window.setTimeout(() => pre.removeAttribute('data-copied'), 2000);
  } catch {
    /* clipboard puede fallar sin permisos */
  }
}

function initFooterYear() {
  const el = document.getElementById('footer-year');
  if (el) {
    el.textContent = String(new Date().getFullYear());
  }
}

applyTheme(getPreferredTheme());
initFooterYear();
openDetailsFromHash();

document.getElementById('theme-toggle')?.addEventListener('click', cycleTheme);
window.addEventListener('hashchange', openDetailsFromHash);

document.querySelectorAll('.md-content').forEach((region) => {
  region.addEventListener('dblclick', copyPreCode);
});
