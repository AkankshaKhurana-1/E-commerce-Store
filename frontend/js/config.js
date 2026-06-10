/**
 * config.js — Global configuration, API helpers, and shared utilities
 * Must be loaded FIRST on every page (before auth.js, products.js, cart.js, checkout.js)
 */

const API_BASE = 'http://localhost:5001/api';

/* ── Auth helpers ──────────────────────────────────────────── */
const getToken   = ()  => localStorage.getItem('token');
const getUser    = ()  => JSON.parse(localStorage.getItem('user') || 'null');
const isLoggedIn = ()  => !!getToken();

const saveAuth = (token, user) => {
  localStorage.setItem('token', token);
  localStorage.setItem('user', JSON.stringify(user));
};

const clearAuth = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
};

/* ── Authenticated fetch wrapper ───────────────────────────── */
const apiFetch = async (endpoint, options = {}) => {
  const token = getToken();
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  if (token) headers['Authorization'] = 'Bearer ' + token;

  const res  = await fetch(API_BASE + endpoint, { ...options, headers });
  const data = await res.json();

  if (!res.ok) throw new Error(data.message || 'Request failed (' + res.status + ')');
  return data;
};

/* ── Toast notifications ───────────────────────────────────── */
const showToast = (message, type, duration) => {
  type     = type     || 'info';
  duration = duration || 3500;

  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    container.className = 'toast-container';
    document.body.appendChild(container);
  }

  const icons = { success: '✅', error: '❌', info: 'ℹ️', warning: '⚠️' };
  const toast = document.createElement('div');
  toast.className = 'toast ' + type;
  toast.innerHTML = '<span>' + (icons[type] || 'ℹ️') + '</span><span>' + message + '</span>';
  container.appendChild(toast);

  setTimeout(function () {
    toast.classList.add('removing');
    toast.addEventListener('animationend', function () { toast.remove(); });
  }, duration);
};

/* ── Global spinner ────────────────────────────────────────── */
const showSpinner = () => {
  if (document.getElementById('global-spinner')) return;
  const el = document.createElement('div');
  el.id = 'global-spinner';
  el.className = 'spinner-overlay';
  el.innerHTML = '<div class="spinner"></div>';
  document.body.appendChild(el);
};

const hideSpinner = () => {
  const el = document.getElementById('global-spinner');
  if (el) el.remove();
};

/* ── Utilities ─────────────────────────────────────────────── */
const renderStars = (rating) => {
  rating = rating || 0;
  const full  = Math.floor(rating);
  const half  = (rating % 1 >= 0.5) ? 1 : 0;
  const empty = 5 - full - half;
  return '★'.repeat(full) + (half ? '½' : '') + '☆'.repeat(empty);
};

const formatPrice = (amount) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount || 0);

/* ── Cart badge ────────────────────────────────────────────── */
const updateCartBadge = () => {
  const cart  = JSON.parse(localStorage.getItem('cart') || '[]');
  const total = cart.reduce(function (sum, item) { return sum + item.quantity; }, 0);
  const badge = document.getElementById('cart-badge');
  if (!badge) return;
  badge.textContent = total;
  badge.style.display = total > 0 ? 'flex' : 'none';
};

/* ── Navbar auth state ─────────────────────────────────────── */
const updateNavAuth = () => {
  const user         = getUser();
  const loginLink    = document.getElementById('nav-login');
  const registerLink = document.getElementById('nav-register');
  const logoutLink   = document.getElementById('nav-logout');
  const userGreeting = document.getElementById('nav-user');

  if (user) {
    if (loginLink)    loginLink.style.display    = 'none';
    if (registerLink) registerLink.style.display = 'none';
    if (logoutLink)   logoutLink.style.display   = 'inline-flex';
    if (userGreeting) {
      userGreeting.style.display = 'inline-flex';
      userGreeting.textContent   = 'Hi, ' + user.name.split(' ')[0];
    }
  } else {
    if (loginLink)    loginLink.style.display    = 'inline-flex';
    if (registerLink) registerLink.style.display = 'inline-flex';
    if (logoutLink)   logoutLink.style.display   = 'none';
    if (userGreeting) userGreeting.style.display = 'none';
  }
};

/* ── Logout ────────────────────────────────────────────────── */
const handleLogout = () => {
  clearAuth();
  showToast('Logged out successfully', 'info');
  setTimeout(function () { window.location.href = 'index.html'; }, 800);
};

/* ── Bootstrap on every page ───────────────────────────────── */
document.addEventListener('DOMContentLoaded', function () {
  updateCartBadge();
  updateNavAuth();

  // Hamburger toggle
  var hamburger = document.getElementById('hamburger');
  var navLinks  = document.getElementById('nav-links');
  if (hamburger && navLinks) {
    hamburger.addEventListener('click', function () {
      navLinks.classList.toggle('open');
    });
  }

  // Logout button
  var logoutBtn = document.getElementById('nav-logout');
  if (logoutBtn) logoutBtn.addEventListener('click', handleLogout);

  // Navbar search form
  var navSearchForm = document.getElementById('nav-search-form');
  if (navSearchForm) {
    navSearchForm.addEventListener('submit', function (e) {
      e.preventDefault();
      var q = document.getElementById('nav-search-input').value.trim();
      if (q) window.location.href = 'index.html?search=' + encodeURIComponent(q);
    });
  }
});
