const API_BASE = 'https://shopeasy-api-zeq2.onrender.com/api';

let allProducts = [];

// ---------- Fetch and Display Products ----------
async function fetchProducts() {
  const grid = document.getElementById('productGrid');
  if (!grid) return;

  try {
    const res = await fetch(`${API_BASE}/products`);
    allProducts = await res.json();
    displayProducts(allProducts);
  } catch (err) {
    console.error("Failed to load products:", err);
    grid.innerHTML = `<p style="color: red;">Failed to load products. Please check back later.</p>`;
  }
}

function displayProducts(products) {
  const grid = document.getElementById('productGrid');
  if (!grid) return;

  if (!products.length) {
    grid.innerHTML = `<p>No products found.</p>`;
    return;
  }

  grid.innerHTML = products.map(p => `
    <div class="product-card" style="background: white; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; display: flex; flex-direction: column; gap: 8px;">
      <h3 style="font-size: 18px; font-weight: 600;">${p.name}</h3>
      <p style="color: #4b5563; font-size: 14px;">${p.description || 'No description available.'}</p>
      <div style="font-weight: bold; color: #111827;">₹${p.price}</div>
      <div style="font-size: 12px; color: ${p.stock > 0 ? '#059669' : '#dc2626'};">
        ${p.stock > 0 ? `${p.stock} in stock` : 'Out of stock'}
      </div>
    </div>
  `).join('');
}

// ---------- Search Bar Logic (Filters products as you type) ----------
const searchInput = document.getElementById('searchInput');
if (searchInput) {
  searchInput.addEventListener('input', (e) => {
    const query = e.target.value.toLowerCase().trim();
    const filtered = allProducts.filter(p => 
      p.name.toLowerCase().includes(query) || 
      (p.category && p.category.toLowerCase().includes(query)) ||
      (p.description && p.description.toLowerCase().includes(query))
    );
    displayProducts(filtered);
  });
}

// ---------- Floating AI Chat Widget ----------
function initAiChatWidget() {
  const widgetHtml = `
    <div id="aiChatContainer" style="position: fixed; bottom: 20px; right: 20px; z-index: 1000; font-family: sans-serif;">
      <button id="aiToggleBtn" style="background: #1a1d23; color: white; border: none; border-radius: 50px; padding: 12px 18px; cursor: pointer; box-shadow: 0 4px 12px rgba(0,0,0,0.15); font-weight: 600;">
        💬 Ask AI Assistant
      </button>
      <div id="aiChatBox" style="display: none; width: 320px; height: 400px; background: white; border-radius: 12px; box-shadow: 0 5px 20px rgba(0,0,0,0.2); flex-direction: column; overflow: hidden; margin-bottom: 10px;">
        <div style="background: #1a1d23; color: white; padding: 12px; display: flex; justify-content: space-between; align-items: center;">
          <span>ShopEasy Assistant</span>
          <button id="aiCloseBtn" style="background: none; border: none; color: white; cursor: pointer; font-size: 16px;">✕</button>
        </div>
        <div id="aiMessages" style="flex: 1; padding: 12px; overflow-y: auto; display: flex; flex-direction: column; gap: 8px; font-size: 14px; background: #f9f9f9;">
          <div style="background: #e5e7eb; padding: 8px 12px; border-radius: 8px; max-width: 80%;">Hello! Ask me anything about our products.</div>
        </div>
        <div style="padding: 10px; border-top: 1px solid #eee; display: flex; gap: 6px;">
          <input type="text" id="aiInput" placeholder="Type a question..." style="flex: 1; padding: 8px; border: 1px solid #ddd; border-radius: 6px; outline: none;">
          <button id="aiSendBtn" style="background: #1a1d23; color: white; border: none; padding: 8px 12px; border-radius: 6px; cursor: pointer;">Send</button>
        </div>
      </div>
    </div>
  `;

  document.body.insertAdjacentHTML('beforeend', widgetHtml);

  const toggleBtn = document.getElementById('aiToggleBtn');
  const closeBtn = document.getElementById('aiCloseBtn');
  const chatBox = document.getElementById('aiChatBox');
  const sendBtn = document.getElementById('aiSendBtn');
  const aiInput = document.getElementById('aiInput');
  const messagesContainer = document.getElementById('aiMessages');

  toggleBtn.addEventListener('click', () => {
    chatBox.style.display = 'flex';
    toggleBtn.style.display = 'none';
  });

  closeBtn.addEventListener('click', () => {
    chatBox.style.display = 'none';
    toggleBtn.style.display = 'block';
  });

  async function handleSend() {
    const text = aiInput.value.trim();
    if (!text) return;

    messagesContainer.innerHTML += `<div style="background: #2563eb; color: white; padding: 8px 12px; border-radius: 8px; max-width: 80%; align-self: flex-end;">${text}</div>`;
    aiInput.value = '';
    messagesContainer.scrollTop = messagesContainer.scrollHeight;

    try {
      const res = await fetch(`${API_BASE}/assistant`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [{ role: 'user', content: text }] })
      });
      const data = await res.json();
      const reply = data.reply || data.message || "Sorry, I couldn't reach the assistant.";

      messagesContainer.innerHTML += `<div style="background: #e5e7eb; padding: 8px 12px; border-radius: 8px; max-width: 80%;">${reply}</div>`;
    } catch (err) {
      messagesContainer.innerHTML += `<div style="background: #fee2e2; color: #b91c1c; padding: 8px 12px; border-radius: 8px; max-width: 80%;">Error connecting to assistant.</div>`;
    }
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }

  sendBtn.addEventListener('click', handleSend);
  aiInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') handleSend();
  });
}

// ---------- Initialize on Page Load ----------
document.addEventListener('DOMContentLoaded', () => {
  fetchProducts();
  initAiChatWidget();
});
