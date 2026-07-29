const API_URL = window.API_URL || window.location.origin + '/api';

// ==========================================
//   FLOATING HEARTS BACKGROUND
// ==========================================

function createHearts() {
  const container = document.getElementById('floatingHearts');
  if (!container) return;
  
  const emojis = ['🌸', '💖', '✨', '🦋', '🌺', '💕'];
  
  for (let i = 0; i < 15; i++) {
    const heart = document.createElement('div');
    heart.className = 'heart';
    heart.textContent = emojis[Math.floor(Math.random() * emojis.length)];
    heart.style.left = Math.random() * 100 + '%';
    heart.style.fontSize = (Math.random() * 20 + 14) + 'px';
    heart.style.animationDuration = (Math.random() * 15 + 10) + 's';
    heart.style.animationDelay = (Math.random() * 20) + 's';
    container.appendChild(heart);
  }
}

// ==========================================
//   TOAST NOTIFICATION
// ==========================================

function showToast(message, type = 'info', duration = 4000) {
  const toast = document.getElementById('toast');
  if (!toast) return;
  
  toast.textContent = message;
  toast.className = 'toast ' + type;
  toast.classList.add('show');
  
  clearTimeout(toast._timeout);
  toast._timeout = setTimeout(() => {
    toast.classList.remove('show');
  }, duration);
}

// ==========================================
//   NAVBAR SCROLL EFFECT
// ==========================================

document.addEventListener('scroll', () => {
  const navbar = document.getElementById('navbar');
  if (!navbar) return;
  
  if (window.scrollY > 50) {
    navbar.classList.add('scrolled');
  } else {
    navbar.classList.remove('scrolled');
  }
});

// ==========================================
//   GET TOKEN
// ==========================================

function getToken() {
  return localStorage.getItem('token');
}

// ==========================================
//   CHECK AUTH
// ==========================================

async function checkAuth() {
  try {
    const token = getToken();
    if (!token) return null;
    
    const response = await fetch(`${API_URL}/auth/me`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (response.ok) {
      const data = await response.json();
      return data.data;
    }
    return null;
  } catch (error) {
    return null;
  }
}

// ==========================================
//   LOAD PRODUCTS
// ==========================================

async function loadProducts() {
  const grid = document.getElementById('productGrid');
  if (!grid) return;
  
  try {
    const response = await fetch(`${API_URL}/products`);
    const data = await response.json();
    
    if (data.status === 'success' && data.data.length > 0) {
      grid.innerHTML = data.data.map(p => `
        <div class="product-card" onclick="showProductDetail('${p._id}')">
          <div class="product-image">📦</div>
          <div class="product-info">
            <div class="product-name">${p.name}</div>
            <div class="product-price">Rp ${p.price.toLocaleString()}</div>
            <div class="product-stock ${p.stock > 0 ? 'in-stock' : 'out-of-stock'}">
              ${p.stock > 0 ? `✅ Stok: ${p.stock}` : '❌ Habis'}
            </div>
            <button onclick="event.stopPropagation(); buyProduct('${p._id}')" class="btn-buy" ${p.stock < 1 ? 'disabled' : ''}>
              ${p.stock > 0 ? '🛍️ Beli Sekarang' : '⛔ Habis'}
            </button>
          </div>
        </div>
      `).join('');
    } else {
      grid.innerHTML = '<p class="empty-state">🌸 Belum ada produk yang tersedia</p>';
    }
  } catch (error) {
    grid.innerHTML = '<p class="empty-state" style="color:#f44336;">❌ Gagal memuat produk</p>';
    showToast('Gagal memuat produk', 'error');
  }
}

// ==========================================
//   SHOW PRODUCT DETAIL (MODAL)
// ==========================================

async function showProductDetail(productId) {
  try {
    const response = await fetch(`${API_URL}/products/${productId}`);
    const data = await response.json();
    
    if (data.status === 'success') {
      const p = data.data;
      const modalBody = document.getElementById('modalBody');
      const modalTitle = document.getElementById('modalTitle');
      
      modalTitle.textContent = '🌸 ' + p.name;
      modalBody.innerHTML = `
        <div style="text-align:center;font-size:64px;margin:12px 0;">📦</div>
        <p><strong>📝 Deskripsi:</strong> ${p.description || 'Tidak ada deskripsi'}</p>
        <p><strong>💰 Harga:</strong> Rp ${p.price.toLocaleString()}</p>
        <p><strong>📊 Stok:</strong> ${p.stock}</p>
        <p><strong>📂 Kategori:</strong> ${p.category || 'Lainnya'}</p>
        <button onclick="closeModal(); buyProduct('${p._id}')" class="btn btn-pink" style="width:100%;margin-top:16px;padding:12px;">
          🛍️ Beli Sekarang
        </button>
      `;
      
      document.getElementById('modalOverlay').classList.add('active');
    }
  } catch (error) {
    showToast('Gagal mengambil detail produk', 'error');
  }
}

function closeModal() {
  document.getElementById('modalOverlay').classList.remove('active');
}

// Click outside modal to close
document.getElementById('modalOverlay')?.addEventListener('click', (e) => {
  if (e.target === e.currentTarget) {
    closeModal();
  }
});

// ==========================================
//   BUY PRODUCT
// ==========================================

async function buyProduct(productId) {
  const user = await checkAuth();
  if (!user) {
    showToast('🌸 Silakan login terlebih dahulu', 'warning');
    setTimeout(() => window.location.href = '/login.html', 1500);
    return;
  }
  
  const quantity = prompt('🌸 Masukkan jumlah:', '1');
  if (!quantity || isNaN(quantity) || quantity < 1) return;
  
  try {
    const token = getToken();
    const response = await fetch(`${API_URL}/orders/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        productId,
        quantity: parseInt(quantity),
        paymentMethod: 'qris'
      })
    });
    
    const data = await response.json();
    
    if (data.status === 'success') {
      showToast('✅ Pesanan berhasil dibuat!', 'success');
      setTimeout(() => location.reload(), 1500);
    } else {
      showToast(`❌ ${data.message}`, 'error');
    }
  } catch (error) {
    showToast('❌ Gagal memproses pesanan', 'error');
  }
}

// ==========================================
//   UPDATE UI
// ==========================================

async function updateUI() {
  const user = await checkAuth();
  const authLinks = document.getElementById('authLinks');
  const userLinks = document.getElementById('userLinks');
  const userName = document.getElementById('userName');
  const userSaldo = document.getElementById('userSaldo');
  const walletNav = document.getElementById('walletNav');
  const adminNav = document.getElementById('adminNav');
  
  if (user) {
    authLinks.style.display = 'none';
    userLinks.style.display = 'flex';
    userName.textContent = user.username;
    
    try {
      const token = getToken();
      const saldoRes = await fetch(`${API_URL}/wallet/balance`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const saldoData = await saldoRes.json();
      if (saldoData.status === 'success') {
        userSaldo.textContent = `💰 Rp ${saldoData.data.saldo.toLocaleString()}`;
      }
    } catch (e) {
      console.error('Load saldo error:', e);
    }
    
    walletNav.style.display = 'block';
    if (user.role === 'admin' || user.role === 'superadmin') {
      adminNav.style.display = 'block';
    }
  } else {
    authLinks.style.display = 'flex';
    userLinks.style.display = 'none';
    walletNav.style.display = 'none';
    adminNav.style.display = 'none';
  }
}

// ==========================================
//   LOGOUT
// ==========================================

async function logout() {
  localStorage.removeItem('token');
  showToast('🌸 Berhasil logout', 'success');
  setTimeout(() => window.location.href = '/', 1000);
}

// ==========================================
//   INIT
// ==========================================

document.addEventListener('DOMContentLoaded', () => {
  createHearts();
  loadProducts();
  updateUI();
});

// ==========================================
//   EXPOSE FUNCTIONS TO WINDOW
// ==========================================

window.API_URL = API_URL;
window.getToken = getToken;
window.checkAuth = checkAuth;
window.logout = logout;
window.buyProduct = buyProduct;
window.showProductDetail = showProductDetail;
window.closeModal = closeModal;
window.showToast = showToast;
