(() => {
  'use strict';
  const $ = (selector) => document.querySelector(selector);
  const form = $('#login-form');
  const loginView = $('#login-view');
  const homeView = $('#home-view');
  const submit = $('#login-submit');
  const error = $('#login-error');
  const password = $('#password');
  const sessionKey = 'appScaffoldDemoSession';

  function setError(message) {
    error.textContent = message;
    error.hidden = !message;
  }
  function showHome(user) {
    loginView.hidden = true;
    homeView.hidden = false;
    $('#user-name').textContent = user;
    $('#session-status').textContent = 'Sesión de demostración activa solo en esta pestaña.';
  }
  function showLogin() {
    loginView.hidden = false;
    homeView.hidden = true;
    form.reset();
    setError('');
    $('#username').focus();
  }

  $('#toggle-password').addEventListener('click', (event) => {
    const button = event.currentTarget;
    const visible = password.type === 'password';
    password.type = visible ? 'text' : 'password';
    button.setAttribute('aria-pressed', String(visible));
    button.setAttribute('aria-label', visible ? 'Ocultar contraseña' : 'Mostrar contraseña');
  });

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    setError('');
    const username = $('#username').value.trim();
    const pass = password.value;
    if (!username || !pass) {
      setError('Completá usuario y contraseña.');
      (!username ? $('#username') : password).focus();
      return;
    }
    submit.disabled = true;
    submit.querySelector('span').textContent = 'Verificando…';
    await new Promise((resolve) => setTimeout(resolve, 220));
    if (username !== window.APP_CONFIG.demoUser || pass !== window.APP_CONFIG.demoPassword) {
      setError('No coincide con la cuenta demo. Revisá los datos e intentá de nuevo.');
      password.focus();
    } else {
      sessionStorage.setItem(sessionKey, username);
      showHome(username);
    }
    submit.disabled = false;
    submit.querySelector('span').textContent = 'Entrar a la demo';
  });

  $('#logout-button').addEventListener('click', () => {
    sessionStorage.removeItem(sessionKey);
    showLogin();
  });

  const user = sessionStorage.getItem(sessionKey);
  if (user === window.APP_CONFIG.demoUser) showHome(user);
})();
