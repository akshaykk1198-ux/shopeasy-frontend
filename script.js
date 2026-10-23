const IS_LOCAL = ['localhost', '127.0.0.1'].includes(window.location.hostname);
const API_BASE = IS_LOCAL
  ? 'http://localhost:5000/api'
  : 'https://shopeasy-api-zeq2.onrender.com/api';
const RAZORPAY_KEY_ID = 'rzp_test_TdvtILWPKwz4zp'; // replace with your actual Key ID

// ---------- Navbar ----------
function updateNavbar() {
  const token = localStorage.getItem('token');
  const userName = localStorage.getItem('userName');
  const isAdmin = localStorage.getItem('isAdmin') === 'true';

  const loginLink = document.getElementById('loginLink');
  const registerLink = document.getElementById('registerLink');
  const logoutLink = document.getElementById('logoutLink');
  const userGreeting = document.getElementById('userGreeting');
  const adminLink = document.getElementById('adminLink');

  if (token) {
    if (loginLink) loginLink.style.display = 'none';
    if (registerLink) registerLink.style.display = 'none';
    if (logoutLink) logoutLink.style.display = 'inline';
    if (userGreeting) userGreeting.textContent = `Hi, ${userName}`;
    if (adminLink) adminLink.style.display = isAdmin ? 'inline' : 'none';
  } else {
    if (loginLink) loginLink.style.display = 'inline';
    if (registerLink) registerLink.style.display = 'inline';
    if (logoutLink) logoutLink.style.display = 'none';
    if (userGreeting) userGreeting.textContent = '';
    if (adminLink) adminLink.style.display = 'none';
  }
}

function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('userName');
  localStorage.removeItem('userId');
  localStorage.removeItem('isAdmin');
  window.location.href = 'index.html';
}

// ---------- Registration ----------
async function handleRegister(e) {
  e.preventDefault();
  const name = document.getElementById('name').value;
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  const messageEl = document.getElementById('registerMessage');

  try {
    const res = await fetch(`${API_BASE}/users/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password }),
    });

    const data = await res.json();

    if (!res.ok) {
      messageEl.textContent = data.message || 'Registration failed';
      return;
    }

    localStorage.setItem('token', data.token);
    localStorage.setItem('userName', data.name);
    localStorage.setItem('userId', data._id);
    localStorage.setItem('isAdmin', data.isAdmin);

    window.location.href = 'index.html';
  } catch (err) {
    messageEl.textContent = 'Could not connect to server.';
    console.error(err);
  }
}

// ---------- Login ----------
async function handleLogin(e) {
  e.preventDefault();
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  const messageEl = document.getElementById('loginMessage');

  try {
    const res = await fetch(`${API_BASE}/users/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();

    if (!res.ok) {
      messageEl.textContent = data.message || 'Login failed';
      return;
    }

    localStorage.setItem('token', data.token);
    localStorage.setItem('userName', data.name);
    localStorage.setItem('userId', data._id);
    localStorage.setItem('isAdmin', data.isAdmin);

    window.location.href = 'index.html';
  } catch (err) {
    messageEl.textContent = 'Could not connect to server.';
    console.error(err);
  }
}

// ---------- Cart (localStorage-based) ----------
function getCart() {
  const cart = localStorage.getItem('cart');
  return cart ? JSON.parse(cart) : [];
}

function saveCart(cart) {
  localStorage.setItem('cart', JSON.stringify(cart));
  updateCartBadge();
}

function addToCart(product) {
  const cart = getCart();
  const existing = cart.find(item => item._id === product._id);

  if (existing) {
    existing.qty += 1;
  } else {
    cart.push({
      _id: product._id,
      name: product.name,
      price: product.price,
      qty: 1,
    });
  }

  saveCart(cart);
}

function updateCartBadge() {
  const badge = document.getElementById('cartBadge');
  if (!badge) return;
  const cart = getCart();
  const totalItems = cart.reduce((sum, item) => sum + item.qty, 0);
  badge.textContent = totalItems > 0 ? totalItems : '';
}

function renderCart() {
  const container = document.getElementById('cartContainer');
  if (!container) return;

  const cart = getCart();

  if (cart.length === 0) {
    container.innerHTML = '<p>Your cart is empty. <a href="index.html">Browse products</a>.</p>';
    return;
  }

  const total = cart.reduce((sum, item) => sum + item.price * item.qty, 0);

  container.innerHTML = `
    <div class="cart-list">
      ${cart.map(item => `
        <div class="cart-row" data-id="${item._id}">
          <div class="cart-item-name">${item.name}</div>
          <div class="cart-item-price">₹${item.price}</div>
          <div class="cart-qty-controls">
            <button class="qty-btn decrease-btn" data-id="${item._id}">−</button>
            <span class="qty-value">${item.qty}</span>
            <button class="qty-btn increase-btn" data-id="${item._id}">+</button>
          </div>
          <div class="cart-item-subtotal">₹${item.price * item.qty}</div>
          <button class="remove-btn" data-id="${item._id}">Remove</button>
        </div>
      `).join('')}
    </div>
    <div class="cart-total">Total: ₹${total}</div>
    <button class="checkout-btn" id="checkoutBtn">Proceed to Checkout</button>
  `;

  container.querySelectorAll('.increase-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const cart = getCart();
      const item = cart.find(i => i._id === btn.dataset.id);
      item.qty += 1;
      saveCart(cart);
      renderCart();
    });
  });

  container.querySelectorAll('.decrease-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      let cart = getCart();
      const item = cart.find(i => i._id === btn.dataset.id);
      item.qty -= 1;
      if (item.qty <= 0) {
        cart = cart.filter(i => i._id !== btn.dataset.id);
      }
      saveCart(cart);
      renderCart();
    });
  });

  container.querySelectorAll('.remove-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const cart = getCart().filter(i => i._id !== btn.dataset.id);
      saveCart(cart);
      renderCart();
    });
  });

  const checkoutBtn = document.getElementById('checkoutBtn');
  if (checkoutBtn) {
    checkoutBtn.addEventListener('click', handleCheckout);
  }
}
// ---------- Checkout (Razorpay) ----------
async function handleCheckout() {
  const token = localStorage.getItem('token');

  if (!token) {
    alert('Please log in to checkout.');
    window.location.href = 'login.html';
    return;
  }

  const cart = getCart();
  if (cart.length === 0) return;

  const orderItems = cart.map(item => ({
    name: item.name,
    quantity: item.qty,
    price: item.price,
    product: item._id,
  }));

  const totalPrice = cart.reduce((sum, item) => sum + item.price * item.qty, 0);

  try {
    // Step 1: Create our own MongoDB order first (unpaid)
    const orderRes = await fetch(`${API_BASE}/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ orderItems, totalPrice }),
    });

    const mongoOrder = await orderRes.json();

    if (!orderRes.ok) {
      alert(mongoOrder.message || 'Could not create order.');
      return;
    }

    // Step 2: Create a Razorpay payment order
    const paymentRes = await fetch(`${API_BASE}/orders/create-payment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ amount: totalPrice }),
    });

    const razorpayOrder = await paymentRes.json();

    if (!paymentRes.ok) {
      alert(razorpayOrder.message || 'Could not initiate payment.');
      return;
    }

    // Step 3: Open Razorpay checkout popup
    const options = {
      key: RAZORPAY_KEY_ID,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      name: 'ShopEasy',
      description: 'Order Payment',
      order_id: razorpayOrder.id,
      handler: async function (response) {
        // Step 4: Verify payment on our backend
        const verifyRes = await fetch(`${API_BASE}/orders/verify-payment`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature,
            orderId: mongoOrder._id,
          }),
        });

        const verifyData = await verifyRes.json();

        if (verifyRes.ok) {
          localStorage.removeItem('cart');
          alert('Payment successful! Order confirmed.');
          window.location.href = 'myorders.html';
        } else {
          alert('Payment verification failed: ' + (verifyData.message || 'Unknown error'));
        }
      },
      prefill: {
        name: localStorage.getItem('userName') || '',
      },
      theme: {
        color: '#e0a458',
      },
      modal: {
        ondismiss: function () {
          alert('Payment cancelled.');
        },
      },
    };

    const rzp = new Razorpay(options);
    rzp.open();
  } catch (err) {
    alert('Could not connect to server.');
    console.error(err);
  }
}

// ---------- My Orders ----------
async function loadMyOrders() {
  const container = document.getElementById('ordersContainer');
  if (!container) return;

  const token = localStorage.getItem('token');

  if (!token) {
    container.innerHTML = '<p>Please <a href="login.html">log in</a> to see your orders.</p>';
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/orders/myorders`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    const orders = await res.json();

    if (!res.ok) {
      container.innerHTML = `<p>${orders.message || 'Could not load orders.'}</p>`;
      return;
    }

    if (orders.length === 0) {
      container.innerHTML = '<p>You have no orders yet. <a href="index.html">Start shopping</a>.</p>';
      return;
    }

    orders.reverse();

    container.innerHTML = orders.map(order => `
      <div class="order-card">
        <div class="order-header">
          <span class="order-id">Order #${order._id.slice(-6).toUpperCase()}</span>
          <span class="order-date">${new Date(order.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}</span>
        </div>
        <div class="order-items">
          ${order.orderItems.map(item => `
            <div class="order-item-row">
              <span>${item.name} × ${item.quantity}</span>
              <span>₹${item.price * item.quantity}</span>
            </div>
          `).join('')}
        </div>
        <div class="order-footer">
          <span class="order-status ${order.isPaid ? 'status-paid' : 'status-pending'}">
            ${order.isPaid ? 'Paid' : 'Payment Pending'}
          </span>
          <span class="order-total">Total: ₹${order.totalPrice}</span>
        </div>
      </div>
    `).join('');
  } catch (err) {
    container.innerHTML = '<p>Could not connect to server.</p>';
    console.error(err);
  }
}

// ---------- Product listing ----------
async function loadProducts() {
  const grid = document.getElementById('productGrid');
  if (!grid) return;

  try {
    const res = await fetch(`${API_BASE}/products`);
    const products = await res.json();

    if (products.length === 0) {
      grid.innerHTML = '<p>No products available yet.</p>';
      return;
    }

    grid.innerHTML = products.map(p => `
      <div class="product-card">
        <img src="${p.imageUrl || 'https://via.placeholder.com/220x140?text=No+Image'}" alt="${p.name}">
        <div class="product-name">${p.name}</div>
        <div class="product-price">₹${p.price}</div>
        <div class="product-stock">${p.stock > 0 ? p.stock + ' in stock' : 'Out of stock'}</div>
        <button class="add-to-cart-btn" data-id="${p._id}" data-name="${p.name}" data-price="${p.price}">Add to Cart</button>
      </div>
    `).join('');

    document.querySelectorAll('.add-to-cart-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        addToCart({
          _id: btn.dataset.id,
          name: btn.dataset.name,
          price: Number(btn.dataset.price),
        });
        btn.textContent = 'Added ✓';
        setTimeout(() => { btn.textContent = 'Add to Cart'; }, 1000);
      });
    });

    initCardTilt();
  } catch (err) {
    grid.innerHTML = '<p>Could not load products. Is the backend server running?</p>';
    console.error(err);
  }
}

// ---------- 3D tilt effect on product cards ----------
function initCardTilt() {
  document.querySelectorAll('.product-card').forEach(card => {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const centerX = rect.width / 2;
      const centerY = rect.height / 2;

      const rotateX = ((y - centerY) / centerY) * -8;
      const rotateY = ((x - centerX) / centerX) * 8;

      card.style.transform = `perspective(700px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.03, 1.03, 1.03)`;
    });

    card.addEventListener('mouseleave', () => {
      card.style.transform = 'perspective(700px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)';
    });
  });
}

// ---------- Admin Panel ----------
async function initAdminPanel() {
  const guard = document.getElementById('adminGuard');
  const content = document.getElementById('adminContent');
  if (!guard || !content) return; // not on admin.html

  const token = localStorage.getItem('token');
  const isAdmin = localStorage.getItem('isAdmin') === 'true';

  if (!token || !isAdmin) {
    guard.innerHTML = '<p>You must be an admin to view this page.</p>';
    return;
  }

  content.style.display = 'block';
  loadAdminProducts();

  const form = document.getElementById('productForm');
  form.addEventListener('submit', handleProductFormSubmit);

  document.getElementById('cancelEditBtn').addEventListener('click', resetProductForm);
}

async function loadAdminProducts() {
  const listEl = document.getElementById('adminProductList');
  try {
    const res = await fetch(`${API_BASE}/products`);
    const products = await res.json();

    if (products.length === 0) {
      listEl.innerHTML = '<p>No products yet.</p>';
      return;
    }

    listEl.innerHTML = products.map(p => `
      <div class="admin-product-row">
        <img src="${p.imageUrl || 'https://via.placeholder.com/60x60?text=No+Image'}" alt="${p.name}">
        <div class="admin-product-info">
          <div class="admin-product-name">${p.name}</div>
          <div class="admin-product-meta">₹${p.price} · ${p.stock} in stock</div>
        </div>
        <button class="edit-btn" data-id="${p._id}">Edit</button>
        <button class="delete-btn" data-id="${p._id}">Delete</button>
      </div>
    `).join('');

    listEl.querySelectorAll('.edit-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const product = products.find(p => p._id === btn.dataset.id);
        fillProductForm(product);
      });
    });

    listEl.querySelectorAll('.delete-btn').forEach(btn => {
      btn.addEventListener('click', () => handleDeleteProduct(btn.dataset.id));
    });
  } catch (err) {
    listEl.innerHTML = '<p>Could not load products.</p>';
    console.error(err);
  }
}

function fillProductForm(product) {
  document.getElementById('formTitle').textContent = 'Edit Product';
  document.getElementById('productId').value = product._id;
  document.getElementById('p_name').value = product.name || '';
  document.getElementById('p_description').value = product.description || '';
  document.getElementById('p_price').value = product.price || '';
  document.getElementById('p_category').value = product.category || '';
  document.getElementById('p_stock').value = product.stock || 0;
  document.getElementById('p_imageUrl').value = product.imageUrl || '';
  document.getElementById('submitBtn').textContent = 'Update Product';
  document.getElementById('cancelEditBtn').style.display = 'inline';
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function resetProductForm() {
  document.getElementById('formTitle').textContent = 'Add New Product';
  document.getElementById('productForm').reset();
  document.getElementById('productId').value = '';
  document.getElementById('submitBtn').textContent = 'Add Product';
  document.getElementById('cancelEditBtn').style.display = 'none';
}

async function handleProductFormSubmit(e) {
  e.preventDefault();
  const token = localStorage.getItem('token');
  const messageEl = document.getElementById('adminMessage');

  const id = document.getElementById('productId').value;
  const productData = {
    name: document.getElementById('p_name').value,
    description: document.getElementById('p_description').value,
    price: Number(document.getElementById('p_price').value),
    category: document.getElementById('p_category').value,
    stock: Number(document.getElementById('p_stock').value) || 0,
    imageUrl: document.getElementById('p_imageUrl').value,
  };

  const isEdit = Boolean(id);
  const url = isEdit ? `${API_BASE}/products/${id}` : `${API_BASE}/products`;
  const method = isEdit ? 'PUT' : 'POST';

  try {
    const res = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(productData),
    });

    const data = await res.json();

    if (!res.ok) {
      messageEl.textContent = data.message || 'Something went wrong.';
      return;
    }

    messageEl.textContent = isEdit ? 'Product updated!' : 'Product added!';
    resetProductForm();
    loadAdminProducts();
  } catch (err) {
    messageEl.textContent = 'Could not connect to server.';
    console.error(err);
  }
}

async function handleDeleteProduct(id) {
  if (!confirm('Delete this product?')) return;

  const token = localStorage.getItem('token');

  try {
    const res = await fetch(`${API_BASE}/products/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    const data = await res.json();

    if (!res.ok) {
      alert(data.message || 'Delete failed.');
      return;
    }

    loadAdminProducts();
  } catch (err) {
    alert('Could not connect to server.');
    console.error(err);
  }
}

// ---------- Init (runs once, on every page) ----------
document.addEventListener('DOMContentLoaded', () => {
  updateNavbar();
  loadProducts();
  updateCartBadge();
  renderCart();
  loadMyOrders();
  initAdminPanel();

  const logoutLink = document.getElementById('logoutLink');
  if (logoutLink) {
    logoutLink.addEventListener('click', (e) => {
      e.preventDefault();
      logout();
    });
  }

  const registerForm = document.getElementById('registerForm');
  if (registerForm) {
    registerForm.addEventListener('submit', handleRegister);
  }

  const loginForm = document.getElementById('loginForm');
  if (loginForm) {
    loginForm.addEventListener('submit', handleLogin);
  }
});