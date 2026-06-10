/**
 * products.js — Product listing (index.html) and detail (product.html)
 * Depends on: config.js, cart.js
 */

/* ── State ─────────────────────────────────────────────────── */
var currentPage     = 1;
var currentCategory = 'All';
var currentSearch   = '';
var currentSort     = 'newest';
var totalPages      = 1;

/* ══════════════════════════════════════════════════════════════
   PRODUCT LISTING PAGE
══════════════════════════════════════════════════════════════ */
function initProductListing() {
  var grid = document.getElementById('products-grid');
  if (!grid) return;

  // Read URL params (e.g. from navbar search redirect)
  var params = new URLSearchParams(window.location.search);
  if (params.get('search')) {
    currentSearch = params.get('search');
    var searchInput = document.getElementById('search-input');
    if (searchInput) searchInput.value = currentSearch;
  }
  if (params.get('category')) {
    currentCategory = params.get('category');
  }

  loadCategories();
  loadProducts();

  // Live search with debounce
  var searchInput = document.getElementById('search-input');
  if (searchInput) {
    var debounceTimer;
    searchInput.addEventListener('input', function () {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(function () {
        currentSearch = searchInput.value.trim();
        currentPage   = 1;
        loadProducts();
      }, 400);
    });
  }

  // Sort select
  var sortSelect = document.getElementById('sort-select');
  if (sortSelect) {
    sortSelect.addEventListener('change', function () {
      currentSort = sortSelect.value;
      currentPage = 1;
      loadProducts();
    });
  }
}

/* ── Load category filter pills ────────────────────────────── */
async function loadCategories() {
  var bar = document.getElementById('categories-bar');
  if (!bar) return;

  try {
    var data       = await apiFetch('/products/categories');
    var categories = ['All'].concat(data.categories);

    bar.innerHTML = categories.map(function (cat) {
      return '<button class="category-pill ' + (cat === currentCategory ? 'active' : '') +
             '" data-category="' + cat + '">' + cat + '</button>';
    }).join('');

    bar.querySelectorAll('.category-pill').forEach(function (pill) {
      pill.addEventListener('click', function () {
        currentCategory = pill.dataset.category;
        currentPage     = 1;
        bar.querySelectorAll('.category-pill').forEach(function (p) { p.classList.remove('active'); });
        pill.classList.add('active');
        loadProducts();
      });
    });
  } catch (err) {
    console.error('Failed to load categories:', err);
  }
}

/* ── Fetch and render products ─────────────────────────────── */
async function loadProducts() {
  var grid         = document.getElementById('products-grid');
  var countEl      = document.getElementById('products-count');
  var paginationEl = document.getElementById('pagination');
  if (!grid) return;

  // Skeleton loaders
  var skeletons = '';
  for (var s = 0; s < 8; s++) {
    skeletons +=
      '<div class="product-card">' +
        '<div class="product-card-img loading-skeleton" style="aspect-ratio:1/1"></div>' +
        '<div class="product-card-body">' +
          '<div class="loading-skeleton" style="height:12px;width:60%;margin-bottom:.5rem"></div>' +
          '<div class="loading-skeleton" style="height:18px;width:90%;margin-bottom:.5rem"></div>' +
          '<div class="loading-skeleton" style="height:14px;width:40%"></div>' +
        '</div>' +
      '</div>';
  }
  grid.innerHTML = skeletons;

  try {
    var queryParams = new URLSearchParams({ page: currentPage, limit: 12, sort: currentSort });
    if (currentSearch)              queryParams.set('search',   currentSearch);
    if (currentCategory !== 'All')  queryParams.set('category', currentCategory);

    var data   = await apiFetch('/products?' + queryParams.toString());
    totalPages = data.pagination.pages;

    if (countEl) {
      countEl.textContent = data.pagination.total + ' product' + (data.pagination.total !== 1 ? 's' : '') + ' found';
    }

    if (data.products.length === 0) {
      grid.innerHTML =
        '<div class="empty-state" style="grid-column:1/-1">' +
          '<div class="empty-state-icon">🔍</div>' +
          '<h3>No products found</h3>' +
          '<p>Try adjusting your search or filter criteria.</p>' +
          '<button class="btn btn-primary mt-2" onclick="clearFilters()">Clear Filters</button>' +
        '</div>';
      if (paginationEl) paginationEl.innerHTML = '';
      return;
    }

    var html = '';
    for (var i = 0; i < data.products.length; i++) {
      html += renderProductCard(data.products[i]);
    }
    grid.innerHTML = html;
    renderPagination(paginationEl);

    // Attach add-to-cart listeners
    grid.querySelectorAll('.add-to-cart-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var product = JSON.parse(btn.dataset.product);
        addToCart(product, 1);
        showToast('"' + product.name + '" added to cart 🛒', 'success');
      });
    });

  } catch (err) {
    grid.innerHTML =
      '<div class="empty-state" style="grid-column:1/-1">' +
        '<div class="empty-state-icon">⚠️</div>' +
        '<h3>Failed to load products</h3>' +
        '<p>' + err.message + '</p>' +
        '<button class="btn btn-primary mt-2" onclick="loadProducts()">Retry</button>' +
      '</div>';
    console.error('Load products error:', err);
  }
}

/* ── Render a single product card ──────────────────────────── */
function renderProductCard(product) {
  var outOfStock  = product.stock === 0;
  var lowStock    = product.stock > 0 && product.stock <= 5;
  // Safely encode product data for data attribute
  var productData = JSON.stringify(product).replace(/"/g, '&quot;');
  var imgSrc      = product.image || 'https://placehold.co/400x400?text=No+Image';

  var badgeHtml = '';
  if (outOfStock) {
    badgeHtml = '<span class="product-badge out-of-stock">Out of Stock</span>';
  } else if (lowStock) {
    badgeHtml = '<span class="product-badge">Only ' + product.stock + ' left</span>';
  }

  var btnHtml = outOfStock
    ? '<button class="btn btn-primary" disabled>🚫 Out of Stock</button>'
    : '<button class="btn btn-primary add-to-cart-btn" data-product="' + productData + '">🛒 Add to Cart</button>';

  return (
    '<div class="product-card">' +
      '<a href="product.html?id=' + product._id + '" class="product-card-img">' +
        '<img src="' + imgSrc + '" alt="' + product.name + '" loading="lazy" ' +
             'onerror="this.src=\'https://placehold.co/400x400?text=No+Image\'">' +
        badgeHtml +
      '</a>' +
      '<div class="product-card-body">' +
        '<div class="product-category">' + product.category + '</div>' +
        '<a href="product.html?id=' + product._id + '">' +
          '<div class="product-name">' + product.name + '</div>' +
        '</a>' +
        '<div class="product-rating">' +
          '<span class="stars">' + renderStars(product.rating) + '</span>' +
          '<span class="rating-count">(' + (product.numReviews || 0) + ')</span>' +
        '</div>' +
        '<div class="product-price">' + formatPrice(product.price) + '</div>' +
      '</div>' +
      '<div class="product-card-footer">' + btnHtml + '</div>' +
    '</div>'
  );
}

/* ── Pagination ────────────────────────────────────────────── */
function renderPagination(container) {
  if (!container || totalPages <= 1) {
    if (container) container.innerHTML = '';
    return;
  }

  var html = '<button class="page-btn" onclick="goToPage(' + (currentPage - 1) + ')" ' +
             (currentPage === 1 ? 'disabled' : '') + '>‹</button>';

  for (var i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || Math.abs(i - currentPage) <= 1) {
      html += '<button class="page-btn ' + (i === currentPage ? 'active' : '') +
              '" onclick="goToPage(' + i + ')">' + i + '</button>';
    } else if (Math.abs(i - currentPage) === 2) {
      html += '<span style="padding:0 .25rem;color:var(--text-muted)">…</span>';
    }
  }

  html += '<button class="page-btn" onclick="goToPage(' + (currentPage + 1) + ')" ' +
          (currentPage === totalPages ? 'disabled' : '') + '>›</button>';
  container.innerHTML = html;
}

function goToPage(page) {
  if (page < 1 || page > totalPages) return;
  currentPage = page;
  loadProducts();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function clearFilters() {
  currentSearch   = '';
  currentCategory = 'All';
  currentPage     = 1;
  var searchInput = document.getElementById('search-input');
  if (searchInput) searchInput.value = '';
  document.querySelectorAll('.category-pill').forEach(function (p) {
    p.classList.toggle('active', p.dataset.category === 'All');
  });
  loadProducts();
}

/* ══════════════════════════════════════════════════════════════
   PRODUCT DETAIL PAGE
══════════════════════════════════════════════════════════════ */
function initProductDetail() {
  var container = document.getElementById('product-detail-container');
  if (!container) return;

  var id = new URLSearchParams(window.location.search).get('id');
  if (!id) { window.location.href = 'index.html'; return; }

  loadProductDetail(id);
}

async function loadProductDetail(id) {
  var container = document.getElementById('product-detail-container');
  showSpinner();

  try {
    var data = await apiFetch('/products/' + id);
    var p    = data.product;

    document.title = p.name + ' — ShopEase';

    var breadcrumbName = document.getElementById('breadcrumb-product-name');
    if (breadcrumbName) breadcrumbName.textContent = p.name;

    var outOfStock = p.stock === 0;
    var lowStock   = p.stock > 0 && p.stock <= 5;
    var imgSrc     = p.image || 'https://placehold.co/600x600?text=No+Image';

    var stockBadge = '';
    if (outOfStock)    stockBadge = '<span class="stock-badge no-stock">🚫 Out of Stock</span>';
    else if (lowStock) stockBadge = '<span class="stock-badge low-stock">⚠️ Only ' + p.stock + ' left</span>';
    else               stockBadge = '<span class="stock-badge in-stock">✅ In Stock</span>';

    container.innerHTML =
      '<div class="product-detail-grid">' +
        '<div class="product-detail-img">' +
          '<img src="' + imgSrc + '" alt="' + p.name + '" ' +
               'onerror="this.src=\'https://placehold.co/600x600?text=No+Image\'">' +
        '</div>' +
        '<div class="product-detail-info">' +
          '<div class="product-detail-category">' + p.category + '</div>' +
          '<h1 class="product-detail-name">' + p.name + '</h1>' +
          '<div class="product-rating">' +
            '<span class="stars" style="font-size:1.1rem">' + renderStars(p.rating) + '</span>' +
            '<span class="rating-count">' + (p.numReviews || 0) + ' reviews</span>' +
          '</div>' +
          '<div class="product-detail-price">' + formatPrice(p.price) + '</div>' +
          stockBadge +
          '<p class="product-detail-desc">' + p.description + '</p>' +
          '<div class="quantity-selector">' +
            '<span style="font-weight:600;color:var(--text)">Quantity:</span>' +
            '<button class="qty-btn" id="qty-minus">−</button>' +
            '<span class="qty-display" id="qty-display">1</span>' +
            '<button class="qty-btn" id="qty-plus">+</button>' +
          '</div>' +
          '<div class="product-detail-actions">' +
            '<button class="btn btn-primary btn-lg" id="add-to-cart-btn"' + (outOfStock ? ' disabled' : '') + '>' +
              '🛒 Add to Cart' +
            '</button>' +
            '<a href="cart.html" class="btn btn-secondary btn-lg">View Cart</a>' +
          '</div>' +
          '<div style="margin-top:1rem;padding:1rem;background:var(--bg);border-radius:var(--radius-sm);font-size:.85rem;color:var(--text-muted)">' +
            '🚚 Free shipping on orders over $100 &nbsp;|&nbsp; 🔄 30-day returns' +
          '</div>' +
        '</div>' +
      '</div>';

    // Quantity controls
    var qty        = 1;
    var qtyDisplay = document.getElementById('qty-display');
    var qtyMinus   = document.getElementById('qty-minus');
    var qtyPlus    = document.getElementById('qty-plus');

    if (qtyMinus) {
      qtyMinus.addEventListener('click', function () {
        if (qty > 1) { qty--; qtyDisplay.textContent = qty; }
      });
    }
    if (qtyPlus) {
      qtyPlus.addEventListener('click', function () {
        if (qty < p.stock) { qty++; qtyDisplay.textContent = qty; }
      });
    }

    var addBtn = document.getElementById('add-to-cart-btn');
    if (addBtn) {
      addBtn.addEventListener('click', function () {
        addToCart(p, qty);
        showToast(qty + '× "' + p.name + '" added to cart 🛒', 'success');
      });
    }

  } catch (err) {
    container.innerHTML =
      '<div class="empty-state">' +
        '<div class="empty-state-icon">⚠️</div>' +
        '<h3>Product not found</h3>' +
        '<p>' + err.message + '</p>' +
        '<a href="index.html" class="btn btn-primary mt-2">Back to Shop</a>' +
      '</div>';
  } finally {
    hideSpinner();
  }
}

/* ── Init ──────────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', function () {
  initProductListing();
  initProductDetail();
});
