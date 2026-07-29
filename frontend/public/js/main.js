// ==========================================
//   MAIN.JS - MIKA STORE
// ==========================================

const API_URL = window.API_URL || 'https://mika-store-backend.onrender.com/api';

// ==========================================
//   CHECK AUTH STATUS
// ==========================================

async function checkAuth() {
  try {
    const response = await fetch(`${API_URL}/auth/me`, {
      credentials: 'include'
    });
    
    if (response.ok) {
      const data = await response.json();
      return data.data;
    }
    return null;
  } catch (error) {
    console.error('Auth check error:', error);
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
      grid.innerHTML = data.data.map(product => `
        <div class="product-card">
          <div class="product-image" style="background:var(--light);display:flex;align-items:center;justify-content:center;font-size:48px;">
            📦
          </div>
          <div class="product-info">
            <h3 class="product-name">${product.name}</h3>
            <div class="product-price">Rp ${product.price.toLocaleString()}</div>
            <div class="product-stock ${product.stock > 0 ? 'in-stock' : 'out-of-stock'}">
              ${product.stock > 0 ? `✅ Stok: ${product.stock}` : '❌ Habis'}
            </div>
            <button onclick="buyProduct('${product._id}')" class="btn btn-primary" ${product.stock < 1 ? 'disabled' : ''}>
              Beli
            </button>
          </div>
        </div>
      `).join('');
    } else {
      grid.innerHTML = `<p style="grid-column:1/-1;text-align:center;color:var(--gray);">Belum ada produk</p>`;
    }
  } catch (error) {
    console.error('Load products error:', error);
    grid.innerHTML = `<p style="grid-column:1/-1;text-align:center;color:var(--danger);">Gagal memuat produk</p>`;
  }
}

// ==========================================
//   BUY PRODUCT
// ==========================================

async function buyProduct(productId) {
  const user = await checkAuth();
  if (!user) {
    alert('Silakan login terlebih dahulu');
    window.location.href = '/login.html';
    return;
  }
  
  const quantity = prompt('Masukkan jumlah yang ingin dibeli:', '1');
  if (!quantity || isNaN(quantity) || quantity < 1) return;
  
  try {
    const response = await fetch(`${API_URL}/orders/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        productId,
        quantity: parseInt(quantity)
      })
    });
    
    const data = await response.json();
    
    if (data.status === 'success') {
      alert('✅ Pesanan berhasil dibuat!');
      location.reload();
    } else {
      alert(`❌ ${data.message}`);
    }
  } catch (error) {
    console.error('Buy error:', error);
    alert('Gagal memproses pesanan');
  }
}

// ==========================================
//   UPDATE UI BASED ON AUTH
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
    
    // Ambil saldo
    try {
      const saldoRes = await fetch(`${API_URL}/wallet/balance`, {
        credentials: 'include'
      });
      const saldoData = await saldoRes.json();
      if (saldoData.status === 'success') {
        userSaldo.textContent = `💰 Rp ${saldoData.data.saldo.toLocaleString()}`;
      }
    } catch (e) {}
    
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
  try {
    await fetch(`${API_URL}/auth/logout`, {
      method: 'POST',
      credentials: 'include'
    });
    window.location.href = '/';
  } catch (error) {
    console.error('Logout error:', error);
  }
}

// ==========================================
//   INIT
// ==========================================

document.addEventListener('DOMContentLoaded', () => {
  loadProducts();
  updateUI();
});

// Export untuk digunakan di file lain
window.API_URL = API_URL;
window.checkAuth = checkAuth;
window.logout = logout;