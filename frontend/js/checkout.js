/**
 * checkout.js — Checkout page logic and order placement
 * Depends on: config.js, cart.js (both loaded before this file)
 */

/* ── Init ──────────────────────────────────────────────────── */
function initCheckout() {
  var form = document.getElementById('checkout-form');
  if (!form) return;

  // Must be logged in
  if (!isLoggedIn()) {
    window.location.href = 'login.html?redirect=checkout.html';
    return;
  }

  // Must have items in cart
  var cart = getCart();
  if (!cart || cart.length === 0) {
    window.location.href = 'cart.html';
    return;
  }

  // Pre-fill user name
  var user = getUser();
  if (user) {
    var fullNameInput = document.getElementById('fullName');
    if (fullNameInput) fullNameInput.value = user.name;
  }

  renderOrderReview();
  renderCheckoutSummary();
  initPaymentOptions();

  form.addEventListener('submit', handlePlaceOrder);
}

/* ── Render order review items ─────────────────────────────── */
function renderOrderReview() {
  var container = document.getElementById('order-review-items');
  if (!container) return;

  var cart = getCart();
  var html = '';
  for (var i = 0; i < cart.length; i++) {
    var item   = cart[i];
    var imgSrc = item.image || 'https://placehold.co/56x56?text=?';
    html +=
      '<div class="order-review-item">' +
        '<div class="order-review-img">' +
          '<img src="' + imgSrc + '" alt="' + item.name + '" ' +
               'onerror="this.src=\'https://placehold.co/56x56?text=?\'">' +
        '</div>' +
        '<div>' +
          '<div class="order-review-name">' + item.name + '</div>' +
          '<div class="order-review-qty">Qty: ' + item.quantity + '</div>' +
        '</div>' +
        '<div class="order-review-price">' + formatPrice(item.price * item.quantity) + '</div>' +
      '</div>';
  }
  container.innerHTML = html;
}

/* ── Render checkout totals ────────────────────────────────── */
function renderCheckoutSummary() {
  var totals    = getCartTotals();
  var subtotal  = totals.subtotal;
  var shipping  = totals.shipping;
  var total     = totals.total;
  var itemCount = totals.itemCount;

  function setEl(id, val) {
    var el = document.getElementById(id);
    if (el) el.textContent = val;
  }
  setEl('summary-subtotal', formatPrice(subtotal));
  setEl('summary-shipping', shipping === 0 ? 'FREE' : formatPrice(shipping));
  setEl('summary-total',    formatPrice(total));
  setEl('summary-items',    itemCount + ' item' + (itemCount !== 1 ? 's' : ''));
}

/* ── Payment option selection ──────────────────────────────── */
function initPaymentOptions() {
  document.querySelectorAll('.payment-option').forEach(function (option) {
    option.addEventListener('click', function () {
      document.querySelectorAll('.payment-option').forEach(function (o) {
        o.classList.remove('selected');
      });
      option.classList.add('selected');
      var radio = option.querySelector('input[type="radio"]');
      if (radio) radio.checked = true;
    });
  });

  // Select first option by default
  var first = document.querySelector('.payment-option');
  if (first) first.click();
}

/* ── Place order ───────────────────────────────────────────── */
async function handlePlaceOrder(e) {
  e.preventDefault();

  var cart = getCart();
  if (!cart || cart.length === 0) {
    showToast('Your cart is empty', 'error');
    return;
  }

  function getValue(id) {
    var el = document.getElementById(id);
    return el ? el.value.trim() : '';
  }

  var shippingAddress = {
    fullName:   getValue('fullName'),
    address:    getValue('address'),
    city:       getValue('city'),
    postalCode: getValue('postalCode'),
    country:    getValue('country'),
    phone:      getValue('phone'),
  };

  // Validate all shipping fields
  var fields = Object.keys(shippingAddress);
  for (var i = 0; i < fields.length; i++) {
    if (!shippingAddress[fields[i]]) {
      showToast('Please fill in all shipping address fields', 'error');
      return;
    }
  }

  var paymentRadio  = document.querySelector('input[name="payment"]:checked');
  var paymentMethod = paymentRadio ? paymentRadio.value : 'Cash on Delivery';

  // Build products array for API
  var orderProducts = cart.map(function (item) {
    return { product: item._id, quantity: item.quantity };
  });

  var orderPayload = {
    products:        orderProducts,
    shippingAddress: shippingAddress,
    paymentMethod:   paymentMethod,
    totalAmount:     getCartTotals().total,
  };

  var btn = document.getElementById('place-order-btn');
  if (btn) { btn.disabled = true; btn.textContent = '⏳ Placing Order…'; }
  showSpinner();

  try {
    var data = await apiFetch('/orders', {
      method: 'POST',
      body: JSON.stringify(orderPayload),
    });

    clearCart();
    showOrderSuccess(data.order);
  } catch (err) {
    showToast(err.message || 'Failed to place order. Please try again.', 'error');
    if (btn) { btn.disabled = false; btn.textContent = '✅ Place Order'; }
  } finally {
    hideSpinner();
  }
}

/* ── Order success screen ──────────────────────────────────── */
function showOrderSuccess(order) {
  var main = document.getElementById('checkout-main');
  if (!main) return;

  var shortId = order._id.slice(-8).toUpperCase();

  var itemsHtml = '';
  for (var i = 0; i < order.products.length; i++) {
    var item = order.products[i];
    itemsHtml +=
      '<div style="display:flex;justify-content:space-between;padding:.4rem 0;font-size:.9rem;border-bottom:1px solid var(--border)">' +
        '<span>' + item.name + ' × ' + item.quantity + '</span>' +
        '<span style="font-weight:600">' + formatPrice(item.price * item.quantity) + '</span>' +
      '</div>';
  }

  main.innerHTML =
    '<div class="order-success">' +
      '<div class="success-icon">🎉</div>' +
      '<h2>Order Placed Successfully!</h2>' +
      '<p style="margin:.75rem 0 .5rem">Thank you for your purchase. Your order is being processed.</p>' +
      '<div class="order-number">Order #' + shortId + '</div>' +
      '<div style="background:var(--bg);border-radius:var(--radius);padding:1.25rem;margin:1.5rem 0;text-align:left">' +
        '<h4 style="margin-bottom:.75rem;color:var(--text)">Order Details</h4>' +
        itemsHtml +
        '<div style="display:flex;justify-content:space-between;padding:.75rem 0 0;font-weight:700;font-size:1rem">' +
          '<span>Total Paid</span>' +
          '<span style="color:var(--primary)">' + formatPrice(order.totalAmount) + '</span>' +
        '</div>' +
      '</div>' +
      '<div style="background:#d1fae5;border-radius:var(--radius-sm);padding:1rem;margin-bottom:1.5rem;font-size:.9rem;color:#065f46">' +
        '📦 Status: <strong>' + order.status + '</strong> &nbsp;|&nbsp; 🚚 Estimated delivery: 3–5 business days' +
      '</div>' +
      '<div style="display:flex;gap:1rem;justify-content:center;flex-wrap:wrap">' +
        '<a href="index.html" class="btn btn-primary">Continue Shopping</a>' +
      '</div>' +
    '</div>';
}

/* ── Init on DOM ready ─────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', initCheckout);
