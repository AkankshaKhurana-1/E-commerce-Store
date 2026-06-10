/**
 * auth.js — Registration and Login page logic
 * Depends on: config.js (loaded first via <script> tag)
 */

/* ── Field-level error helpers ─────────────────────────────── */
function showFieldError(fieldId, message) {
  var field = document.getElementById(fieldId);
  if (field) field.classList.add('error');
  var errEl = document.getElementById(fieldId + '-error');
  if (errEl) { errEl.textContent = message; errEl.style.display = 'block'; }
}

function clearFormErrors() {
  document.querySelectorAll('.form-control.error').forEach(function (el) {
    el.classList.remove('error');
  });
  document.querySelectorAll('.field-error').forEach(function (el) {
    el.textContent = '';
    el.style.display = 'none';
  });
  var alertEl = document.getElementById('form-alert');
  if (alertEl) alertEl.style.display = 'none';
}

function setButtonLoading(btn, loading, text) {
  if (!btn) return;
  btn.disabled    = loading;
  btn.textContent = text;
}

function showFormAlert(message) {
  var alertEl = document.getElementById('form-alert');
  if (!alertEl) return;
  alertEl.className   = 'alert alert-danger';
  alertEl.textContent = message;
  alertEl.style.display = 'flex';
}

/* ══════════════════════════════════════════════════════════════
   REGISTRATION
══════════════════════════════════════════════════════════════ */
function initRegister() {
  var form = document.getElementById('register-form');
  if (!form) return;

  // Already logged in → go home
  if (isLoggedIn()) { window.location.href = 'index.html'; return; }

  form.addEventListener('submit', async function (e) {
    e.preventDefault();
    clearFormErrors();

    var name            = document.getElementById('name').value.trim();
    var email           = document.getElementById('email').value.trim();
    var password        = document.getElementById('password').value;
    var confirmPassword = document.getElementById('confirm-password').value;

    // Client-side validation
    var valid = true;
    if (!name || name.length < 2) {
      showFieldError('name', 'Name must be at least 2 characters'); valid = false;
    }
    if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
      showFieldError('email', 'Please enter a valid email address'); valid = false;
    }
    if (!password || password.length < 6) {
      showFieldError('password', 'Password must be at least 6 characters'); valid = false;
    }
    if (password !== confirmPassword) {
      showFieldError('confirm-password', 'Passwords do not match'); valid = false;
    }
    if (!valid) return;

    var btn = form.querySelector('button[type="submit"]');
    setButtonLoading(btn, true, 'Creating Account…');

    try {
      var data = await apiFetch('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ name: name, email: email, password: password, confirmPassword: confirmPassword }),
      });

      saveAuth(data.token, data.user);
      showToast('Account created! Welcome 🎉', 'success');
      setTimeout(function () { window.location.href = 'index.html'; }, 1000);
    } catch (err) {
      showFormAlert(err.message);
      showToast(err.message, 'error');
    } finally {
      setButtonLoading(btn, false, 'Create Account');
    }
  });

  // Real-time password match indicator
  var confirmInput  = document.getElementById('confirm-password');
  var passwordInput = document.getElementById('password');
  if (confirmInput && passwordInput) {
    confirmInput.addEventListener('input', function () {
      if (!confirmInput.value) { confirmInput.style.borderColor = ''; return; }
      confirmInput.style.borderColor =
        confirmInput.value === passwordInput.value ? 'var(--success)' : 'var(--danger)';
    });
  }
}

/* ══════════════════════════════════════════════════════════════
   LOGIN
══════════════════════════════════════════════════════════════ */
function initLogin() {
  var form = document.getElementById('login-form');
  if (!form) return;

  // Already logged in → go home
  if (isLoggedIn()) { window.location.href = 'index.html'; return; }

  form.addEventListener('submit', async function (e) {
    e.preventDefault();
    clearFormErrors();

    var email    = document.getElementById('email').value.trim();
    var password = document.getElementById('password').value;

    var valid = true;
    if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
      showFieldError('email', 'Please enter a valid email address'); valid = false;
    }
    if (!password) {
      showFieldError('password', 'Password is required'); valid = false;
    }
    if (!valid) return;

    var btn = form.querySelector('button[type="submit"]');
    setButtonLoading(btn, true, 'Signing In…');

    try {
      var data = await apiFetch('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email: email, password: password }),
      });

      saveAuth(data.token, data.user);
      showToast('Welcome back, ' + data.user.name.split(' ')[0] + '! 👋', 'success');

      // Redirect to intended page or home
      var redirect = new URLSearchParams(window.location.search).get('redirect');
      setTimeout(function () { window.location.href = redirect || 'index.html'; }, 900);
    } catch (err) {
      showFormAlert(err.message);
      showToast(err.message, 'error');
    } finally {
      setButtonLoading(btn, false, 'Sign In');
    }
  });
}

/* ── Password visibility toggles ──────────────────────────── */
function initPasswordToggles() {
  document.querySelectorAll('.toggle-password').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var targetId = btn.dataset.target;
      var input    = document.getElementById(targetId);
      if (!input) return;
      var isText   = input.type === 'text';
      input.type   = isText ? 'password' : 'text';
      btn.textContent = isText ? '👁️' : '🙈';
    });
  });
}

/* ── Init ──────────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', function () {
  initRegister();
  initLogin();
  initPasswordToggles();
});
