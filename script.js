const IS_LOCAL = ['localhost', '127.0.0.1'].includes(window.location.hostname);
const API_BASE = IS_LOCAL
  ? 'http://localhost:5000/api'
  : 'https://shopeasy-api-zeq2.onrender.com/api';
const RAZORPAY_KEY_ID = 'rzp_test_TdvtILWPKwz4zp'; // public test key id (safe in frontend)

// Placeholder image that works offline (no external site needed)
const NO_IMAGE = 'data:image/svg+xml;utf8,' + encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" width="220" height="140">' +
  '<rect width="100%" height="100%" fill="#eeeeee"/>' +
  '<text x="50%" y="50%" fill="#999999" font-family="sans-serif" font-size="14" ' +
  'text-anchor="middle" dominant-baseline="middle">No Image</text></svg>'
);

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

// ---------- 3D card tilt (this function was missing before) ----------
function initCardTilt() {
  document.querySelectorAll('.product-card').forEach(card => {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      card.style.transform =
        `perspective(800px) rotateY(${x * 12}deg) rotateX(${-y * 12}deg)`;
    });
    card.addEventListener('mouseleave', () => {
      card.style.transform = '';
    });
  });
}

// ---------- Product listing + search ----------
let allProducts = [];

function renderProducts(products) {
  const grid = document.getElementById('productGrid');
  if (!grid) return;

  if (products.length === 0) {
    grid.innerHTML = '<p>No products match your search.</p>';
    return;
  }

  grid.innerHTML = products.map(p => `
    <div class="product-card">
      <img src="${p.imageUrl || NO_IMAGE}" alt="${p.name}" onerror="this.onerror=null;this.src=NO_IMAGE">
      <div class="product-name">${p.name}</div>
      <div class="product-price">₹${p.price}</div>
      <div class="product-stock">${p.stock > 0 ? p.stock + ' in stock' : 'Out of stock'}</div>
      <button class="add-to-cart-btn" data-id="${p._id}" data-name="${p.name}" data-price="${p.price}">Add to Cart</button>
    </div>
  `).join('');

  grid.querySelectorAll('.add-to-cart-btn').forEach(btn => {
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

  // A tilt problem must never wipe out the product grid
  try {
    initCardTilt();
  } catch (err) {
    console.error('Card tilt failed:', err);
  }
}

function filterProducts() {
  const q = document.getElementById('searchInput').value.trim().toLowerCase();
  const filtered = allProducts.filter(p =>
    [p.name, p.description, p.category].some(field => (field || '').toLowerCase().includes(q))
  );
  renderProducts(filtered);
}

async function loadProducts() {
  const grid = document.getElementById('productGrid');
  if (!grid) return;

  let fetched;
  try {
    const res = await fetch(`${API_BASE}/products`);
    fetched = await res.json();
  } catch (err) {
    grid.innerHTML = '<p>Could not load products. The server may be waking up, so please refresh in a moment.</p>';
    console.error(err);
    return;
  }

  allProducts = Array.isArray(fetched) ? fetched : [];

  if (allProducts.length === 0) {
    grid.innerHTML = '<p>No products available yet.</p>';
    return;
  }

  renderProducts(allProducts);

  const searchInput = document.getElementById('searchInput');
  if (searchInput) searchInput.addEventListener('input', filterProducts);
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
        <img src="${p.imageUrl || NO_IMAGE}" alt="${p.name}" onerror="this.onerror=null;this.src=NO_IMAGE">
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

// ---------- AI Shopping Assistant (floating chat widget) ----------
let chatHistory = [];
let chatBusy = false;

function addChatMessage(role, text) {
  const box = document.getElementById('chatMessages');
  const msg = document.createElement('div');
  msg.className = 'chat-msg ' + (role === 'user' ? 'chat-user' : 'chat-bot');
  msg.textContent = text; // textContent, never innerHTML (safe against injected HTML)
  box.appendChild(msg);
  box.scrollTop = box.scrollHeight;
  return msg;
}

async function sendChatMessage() {
  if (chatBusy) return;

  const input = document.getElementById('chatInput');
  const sendBtn = document.getElementById('chatSend');
  const text = input.value.trim();
  if (!text) return;

  input.value = '';
  addChatMessage('user', text);
  chatHistory.push({ role: 'user', content: text });
  chatHistory = chatHistory.slice(-10);

  chatBusy = true;
  sendBtn.disabled = true;
  const thinking = addChatMessage('bot', 'Thinking…');

  try {
    const res = await fetch(`${API_BASE}/assistant`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: chatHistory }),
    });
    const data = await res.json();

    if (!res.ok) {
      thinking.textContent = data.message || 'Sorry, the assistant is unavailable right now.';
      chatHistory.pop(); // drop the unanswered question so the history stays valid
    } else {
      thinking.textContent = data.reply;
      chatHistory.push({ role: 'assistant', content: data.reply });
      chatHistory = chatHistory.slice(-10);
    }
  } catch (err) {
    thinking.textContent = 'Could not reach the server. It may be waking up, so please try again in a moment.';
    chatHistory.pop();
    console.error(err);
  } finally {
    chatBusy = false;
    sendBtn.disabled = false;
    const box = document.getElementById('chatMessages');
    box.scrollTop = box.scrollHeight;
    input.focus();
  }
}

function initChatWidget() {
  if (document.getElementById('chatToggle')) return; // already added

  // Styles live here so only script.js needs to change
  const style = document.createElement('style');
  style.textContent = `
    .chat-toggle {
      position: fixed; right: 24px; bottom: 24px; z-index: 1000;
      width: 56px; height: 56px; border-radius: 50%; border: none;
      background: #1a1d23; color: #fff; font-size: 1.5rem; cursor: pointer;
      box-shadow: 0 6px 20px rgba(0,0,0,0.3); transition: background 0.15s ease, transform 0.15s ease;
    }
    .chat-toggle:hover { background: #e0a458; transform: scale(1.06); }
    .chat-panel {
      position: fixed; right: 24px; bottom: 92px; z-index: 1000;
      width: 340px; max-width: calc(100vw - 32px); height: 460px; max-height: calc(100vh - 120px);
      background: #fff; border-radius: 12px; box-shadow: 0 12px 40px rgba(0,0,0,0.25);
      display: none; flex-direction: column; overflow: hidden;
    }
    .chat-panel.open { display: flex; }
    .chat-header {
      background: #1a1d23; color: #e0a458; padding: 14px 16px; font-weight: 700;
      display: flex; justify-content: space-between; align-items: center;
    }
    .chat-close { background: none; border: none; color: #fff; font-size: 1.1rem; cursor: pointer; }
    .chat-messages {
      flex: 1; overflow-y: auto; padding: 14px; display: flex; flex-direction: column;
      gap: 10px; background: #f7f7f9;
    }
    .chat-msg {
      max-width: 85%; padding: 9px 13px; border-radius: 12px; font-size: 0.9rem;
      line-height: 1.4; white-space: pre-wrap; word-wrap: break-word;
    }
    .chat-user { align-self: flex-end; background: #e0a458; color: #14161b; border-bottom-right-radius: 3px; }
    .chat-bot { align-self: flex-start; background: #fff; color: #1a1a1a; border: 1px solid #e5e7eb; border-bottom-left-radius: 3px; }
    .chat-form { display: flex; gap: 8px; padding: 10px; border-top: 1px solid #eee; background: #fff; }
    .chat-form input {
      flex: 1; padding: 10px 12px; border: 1px solid #ddd; border-radius: 8px; font-size: 0.9rem;
    }
    .chat-form input:focus { outline: 2px solid #e0a458; border-color: transparent; }
    .chat-form button {
      background: #1a1d23; color: #fff; border: none; padding: 0 16px; border-radius: 8px;
      font-weight: 600; cursor: pointer;
    }
    .chat-form button:hover { background: #e0a458; color: #14161b; }
    .chat-form button:disabled { opacity: 0.5; cursor: not-allowed; }
    .chat-note { font-size: 0.7rem; color: #9ca3af; text-align: center; padding: 0 10px 8px; background: #fff; }
  `;
  document.head.appendChild(style);

  const toggle = document.createElement('button');
  toggle.id = 'chatToggle';
  toggle.className = 'chat-toggle';
  toggle.type = 'button';
  toggle.setAttribute('aria-label', 'Open shopping assistant');
  toggle.textContent = '💬';

  const panel = document.createElement('div');
  panel.id = 'chatPanel';
  panel.className = 'chat-panel';
  panel.innerHTML = `
    <div class="chat-header">
      <span>ShopEasy Assistant</span>
      <button type="button" class="chat-close" id="chatClose" aria-label="Close">✕</button>
    </div>
    <div class="chat-messages" id="chatMessages"></div>
    <form class="chat-form" id="chatForm">
      <input type="text" id="chatInput" placeholder="Ask about our products..." maxlength="500" autocomplete="off">
      <button type="submit" id="chatSend">Send</button>
    </form>
    <div class="chat-note">AI answers may be wrong. Please don't share personal details.</div>
  `;

  document.body.appendChild(toggle);
  document.body.appendChild(panel);

  let greeted = false;
  toggle.addEventListener('click', () => {
    panel.classList.toggle('open');
    if (panel.classList.contains('open')) {
      if (!greeted) {
        addChatMessage('bot', 'Hi! I can help you find products. What are you looking for?');
        greeted = true;
      }
      document.getElementById('chatInput').focus();
    }
  });

  document.getElementById('chatClose').addEventListener('click', () => {
    panel.classList.remove('open');
  });

  document.getElementById('chatForm').addEventListener('submit', (e) => {
    e.preventDefault();
    sendChatMessage();
  });
}

// ---------- Init (runs once, on every page) ----------
document.addEventListener('DOMContentLoaded', () => {
  updateNavbar();
  loadProducts();
  updateCartBadge();
  renderCart();
  loadMyOrders();
  initAdminPanel();
  initChatWidget();

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