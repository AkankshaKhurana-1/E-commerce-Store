/**
 * cart.js — Cart management (localStorage) and Cart page rendering
 * Depends on: config.js
 */

/* ── Cart CRUD ─────────────────────────────────────────────── */
function getCart() {
  return JSON.parse(localStorage.getItem('cart') || '[]');
}

function saveCart(cart) {
  localStorage.setItem('cart', JSON.stringify(cart));
  updateCartBadge();
}

/**
 * Add a product to the cart (or increment quantity)
 * @param {Object} product - Product object from API
 * @param {number} qty     - Quantity to add (default 1)
 */
function addToCart(product, qty) {
  qty = qty || 1;
  var cart     = getCart();
  var existing = null;
  for (var i = 0; i < cart.length; i++) {
    if (cart[i]._id === product._id) { existing = cart[i]; break; }
  }

  if (existing) {
    existing.quantity = Math.min(existing.quantity + qty, product.stock);
  } else {
    cart.push({
      _id:      product._id,
      name:     product.name,
      price:    product.price,
      image:    product.image,
      category: product.category,
      stock:    product.stock,
      quantity: Math.min(qty, product.stock),
    });
  }
  saveCart(cart);
}

function removeFromCart(productId) {
  var cart = getCart().filter(function (item) { return item._id !== productId; });
  saveCart(cart);
}

function updateCartQuantity(productId, newQty) {
  if (newQty <= 0) { removeFromCart(productId); return; }
  var cart = getCart();
  for (var i = 0; i < cart.length; i++) {
    if (cart[i]._id === productId) {
      cart[i].quantity = Math.min(newQty, cart[i].stock);
      break;
    }
  }
  saveCart(cart);
}

function clearCart() {
  localStorage.removeItem('cart');
  updateCartBadge();
}

function getCartTotals() {
  var cart     = getCart();
  var subtotal = cart.reduce(function (sum, item) { return sum + item.price * item.quantity; }, 0);
  var shipping = subtotal > 100 ? 0 : (subtotal > 0 ? 10 : 0);
  var total    = subtotal + shipping;
  var itemCount = cart.reduce(function (sum, item) { return sum + item.quantity; }, 0);
  return { subtotal: subtotal, shipping: shipping, total: total, itemCount: itemCount };
}

/* ══════════════════════════════════════════════════════════════
   CART PAGE
══════════════════════════════════════════════════════════════ */
function initCartPage() {
  var cartContainer = document.getElementById('cart-container');
  if (!cartContainer) return;
  renderCartPage();
}

function renderCartPage() {
  var cartContainer = document.getElementById('cart-container');
  if (!cartContainer) return;
  var cart = getCart();

  if (cart.length === 0) {
    cartContainer.innerHTML =
      '<div class="empty-state">' +
        '<div class="empty-state-icon">🛒</div>' +
        '<h3>Your cart is empty</h3>' +
        '<p>Looks like you haven\'t added anything yet.</p>' +
        '<a href="index.html" class="btn btn-primary mt-2">Start Shopping</a>' +
      '</div>';
    return;
  }

  var totals    = getCartTotals();
  var subtotal  = totals.subtotal;
  var shipping  = totals.shipping;
  var total     = totals.total;
  var itemCount = totals.itemCount;

  var shippingHtml = shipping === 0
    ? '<span style="color:var(--success);font-weight:600">FREE</span>'
    : formatPrice(shipping);

  var freeShippingNote = '';
  if (subtotal > 0 && subtotal <= 100) {
    freeShippingNote = '<p class="free-shipping-note">🚚 Add ' + formatPrice(100 - subtotal) + ' more for free shipping!</p>';
  } else if (subtotal > 100) {
    freeShippingNote = '<p class="free-shipping-note">🎉 You qualify for free shipping!</p>';
  }

  var checkoutHref = isLoggedIn() ? 'checkout.html' : 'login.html?redirect=checkout.html';
  var checkoutLabel = isLoggedIn() ? '🔒 Proceed to Checkout' : '🔑 Login to Checkout';

  var itemsHtml = '';
  for (var i = 0; i < cart.length; i++) {
    itemsHtml += renderCartItem(cart[i]);
  }

  cartContainer.innerHTML =
    '<div class="cart-layout">' +
      '<div>' +
        '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:1rem">' +
          '<h2 style="font-size:1.3rem">Shopping Cart <span style="color:var(--text-muted);font-size:1rem;font-weight:500">(' + itemCount + ' item' + (itemCount !== 1 ? 's' : '') + ')</span></h2>' +
          '<button class="btn btn-danger btn-sm" id="clear-cart-btn">🗑️ Clear Cart</button>' +
        '</div>' +
        '<div class="cart-items-list" id="cart-items-list">' + itemsHtml + '</div>' +
      '</div>' +
      '<div class="cart-summary">' +
        '<h3>Order Summary</h3>' +
        '<div class="summary-row"><span>Subtotal (' + itemCount + ' items)</span><span>' + formatPrice(subtotal) + '</span></div>' +
        '<div class="summary-row"><span>Shipping</span><span>' + shippingHtml + '</span></div>' +
        freeShippingNote +
        '<div class="summary-row total"><span>Total</span><span>' + formatPrice(total) + '</span></div>' +
        '<a href="' + checkoutHref + '" class="btn btn-primary btn-full btn-lg" style="margin-top:1.25rem">' + checkoutLabel + '</a>' +
        '<a href="index.html" class="btn btn-secondary btn-full" style="margin-top:.75rem">← Continue Shopping</a>' +
      '</div>' +
    '</div>';

  attachCartListeners();
}

function renderCartItem(item) {
  var imgSrc = item.image || 'https://placehold.co/90x90?text=?';
  var plusDisabled = item.quantity >= item.stock ? 'disabled style="opacity:.4"' : '';
  return (
    '<div class="cart-item" data-id="' + item._id + '">' +
      '<div class="cart-item-img">' +
        '<img src="' + imgSrc + '" alt="' + item.name + '" onerror="this.src=\'https://placehold.co/90x90?text=?\'">' +
      '</div>' +
      '<div class="cart-item-info">' +
        '<div class="cart-item-name">' + item.name + '</div>' +
        '<div class="cart-item-category">' + (item.category || '') + '</div>' +
        '<div class="cart-item-price">' + formatPrice(item.price) + ' each</div>' +
      '</div>' +
      '<div class="cart-item-controls">' +
        '<button class="qty-btn qty-decrease" data-id="' + item._id + '">−</button>' +
        '<span class="qty-display">' + item.quantity + '</span>' +
        '<button class="qty-btn qty-increase" data-id="' + item._id + '" ' + plusDisabled + '>+</button>' +
        '<span class="cart-item-subtotal">' + formatPrice(item.price * item.quantity) + '</span>' +
        '<button class="btn btn-danger btn-sm btn-icon remove-item-btn" data-id="' + item._id + '" title="Remove">✕</button>' +
      '</div>' +
    '</div>'
  );
}

function attachCartListeners() {
  document.querySelectorAll('.qty-decrease').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var id   = btn.dataset.id;
      var cart = getCart();
      var item = cart.find(function (i) { return i._id === id; });
      if (item) updateCartQuantity(id, item.quantity - 1);
      renderCartPage();
    });
  });

  document.querySelectorAll('.qty-increase').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var id   = btn.dataset.id;
      var cart = getCart();
      var item = cart.find(function (i) { return i._id === id; });
      if (item) updateCartQuantity(id, item.quantity + 1);
      renderCartPage();
    });
  });

  document.querySelectorAll('.remove-item-btn').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var id   = btn.dataset.id;
      var cart = getCart();
      var item = cart.find(function (i) { return i._id === id; });
      if (item) showToast('"' + item.name + '" removed from cart', 'info');
      removeFromCart(id);
      renderCartPage();
    });
  });

  var clearBtn = document.getElementById('clear-cart-btn');
  if (clearBtn) {
    clearBtn.addEventListener('click', function () {
      if (confirm('Are you sure you want to clear your cart?')) {
        clearCart();
        renderCartPage();
        showToast('Cart cleared', 'info');
      }
    });
  }
}

/* ── Init ──────────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', initCartPage);
