// ==========================================
//   ADMIN.JS - ADMIN PANEL
// ==========================================

const API_URL = window.API_URL || 'https://mika-store-backend.onrender.com/api';

// ==========================================
//   CHECK AUTH
// ==========================================

async function checkAdminAuth() {
  try {
    const response = await fetch(`${API_URL}/auth/me`, {
      credentials: 'include'
    });
    
    if (!response.ok) {
      window.location.href = '/login.html';
      return null;
    }
    
    const data = await response.json();
    if (data.data.role !== 'admin' && data.data.role !== 'superadmin') {
      window.location.href = '/';
      return null;
    }
    return data.data;
  } catch (error) {
    window.location.href = '/login.html';
    return null;
  }
}

// ==========================================
//   LOAD DASHBOARD
// ==========================================

async function loadDashboard() {
  document.getElementById('adminTitle').textContent = '📊 Dashboard';
  
  try {
    // Load stats
    const [productsRes, ordersRes, usersRes] = await Promise.all([
      fetch(`${API_URL}/admin/stats/products`, { credentials: 'include' }),
      fetch(`${API_URL}/admin/stats/orders`, { credentials: 'include' }),
      fetch(`${API_URL}/admin/stats/users`, { credentials: 'include' })
    ]);
    
    const products = await productsRes.json();
    const orders = await ordersRes.json();
    const users = await usersRes.json();
    
    document.getElementById('statProducts').textContent = products.data?.total || 0;
    document.getElementById('statOrders').textContent = orders.data?.total || 0;
    document.getElementById('statUsers').textContent = users.data?.total || 0;
    document.getElementById('statRevenue').textContent = `Rp ${(orders.data?.revenue || 0).toLocaleString()}`;
    
    // Load recent orders
    const ordersListRes = await fetch(`${API_URL}/admin/orders?limit=10`, { credentials: 'include' });
    const ordersList = await ordersListRes.json();
    
    const container = document.getElementById('recentOrders');
    if (ordersList.status === 'success' && ordersList.data.length > 0) {
      container.innerHTML = `
        <table>
          <thead>
            <tr>
              <th>Order</th>
              <th>User</th>
              <th>Total</th>
              <th>Status</th>
              <th>Tanggal</th>
            </tr>
          </thead>
          <tbody>
            ${ordersList.data.map(order => `
              <tr>
                <td>${order.orderNumber}</td>
                <td>${order.user?.username || '-'}</td>
                <td>Rp ${order.totalAmount.toLocaleString()}</td>
                <td><span class="badge badge-${order.orderStatus === 'delivered' ? 'success' : order.orderStatus === 'cancelled' ? 'danger' : 'warning'}">${order.orderStatus}</span></td>
                <td>${new Date(order.createdAt).toLocaleDateString()}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `;
    } else {
      container.innerHTML = '<p style="color:var(--gray);">Belum ada pesanan</p>';
    }
  } catch (error) {
    console.error('Load dashboard error:', error);
  }
}

// ==========================================
//   LOAD PRODUCTS
// ==========================================

async function loadProducts() {
  document.getElementById('adminTitle').textContent = '📦 Manajemen Produk';
  const container = document.getElementById('adminContent');
  
  try {
    const response = await fetch(`${API_URL}/admin/products`, { credentials: 'include' });
    const data = await response.json();
    
    container.innerHTML = `
      <div style="margin-bottom:16px;">
        <button onclick="showAddProduct()" class="btn btn-primary">+ Tambah Produk</button>
      </div>
      <div class="table-responsive">
        <table>
          <thead>
            <tr>
              <th>Nama</th>
              <th>Harga</th>
              <th>Stok</th>
              <th>Kategori</th>
              <th>Status</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            ${data.data.map(product => `
              <tr>
                <td>${product.name}</td>
                <td>Rp ${product.price.toLocaleString()}</td>
                <td>${product.stock}</td>
                <td>${product.category}</td>
                <td><span class="badge badge-${product.isActive ? 'success' : 'danger'}">${product.isActive ? 'Aktif' : 'Nonaktif'}</span></td>
                <td>
                  <button onclick="editProduct('${product._id}')" class="btn btn-outline" style="padding:4px 12px;font-size:12px;">Edit</button>
                  <button onclick="toggleProduct('${product._id}')" class="btn btn-${product.isActive ? 'danger' : 'secondary'}" style="padding:4px 12px;font-size:12px;">${product.isActive ? 'Nonaktifkan' : 'Aktifkan'}</button>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  } catch (error) {
    console.error('Load products error:', error);
  }
}

// ==========================================
//   LOAD ORDERS
// ==========================================

async function loadOrders() {
  document.getElementById('adminTitle').textContent = '📋 Manajemen Pesanan';
  const container = document.getElementById('adminContent');
  
  try {
    const response = await fetch(`${API_URL}/admin/orders`, { credentials: 'include' });
    const data = await response.json();
    
    container.innerHTML = `
      <div class="table-responsive">
        <table>
          <thead>
            <tr>
              <th>Order</th>
              <th>User</th>
              <th>Items</th>
              <th>Total</th>
              <th>Pembayaran</th>
              <th>Status</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            ${data.data.map(order => `
              <tr>
                <td>${order.orderNumber}</td>
                <td>${order.user?.username || '-'}</td>
                <td>${order.items.length}</td>
                <td>Rp ${order.totalAmount.toLocaleString()}</td>
                <td><span class="badge badge-${order.paymentStatus === 'paid' ? 'success' : 'warning'}">${order.paymentStatus}</span></td>
                <td><span class="badge badge-${order.orderStatus === 'delivered' ? 'success' : order.orderStatus === 'cancelled' ? 'danger' : 'warning'}">${order.orderStatus}</span></td>
                <td>
                  <select onchange="updateOrderStatus('${order._id}', this.value)" class="form-control" style="padding:4px 8px;font-size:12px;width:auto;">
                    <option value="pending" ${order.orderStatus === 'pending' ? 'selected' : ''}>Pending</option>
                    <option value="processing" ${order.orderStatus === 'processing' ? 'selected' : ''}>Processing</option>
                    <option value="shipped" ${order.orderStatus === 'shipped' ? 'selected' : ''}>Shipped</option>
                    <option value="delivered" ${order.orderStatus === 'delivered' ? 'selected' : ''}>Delivered</option>
                    <option value="cancelled" ${order.orderStatus === 'cancelled' ? 'selected' : ''}>Cancelled</option>
                  </select>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  } catch (error) {
    console.error('Load orders error:', error);
  }
}

// ==========================================
//   LOAD USERS
// ==========================================

async function loadUsers() {
  document.getElementById('adminTitle').textContent = '👤 Manajemen User';
  const container = document.getElementById('adminContent');
  
  try {
    const response = await fetch(`${API_URL}/admin/users`, { credentials: 'include' });
    const data = await response.json();
    
    container.innerHTML = `
      <div class="table-responsive">
        <table>
          <thead>
            <tr>
              <th>Username</th>
              <th>Email</th>
              <th>Saldo</th>
              <th>Role</th>
              <th>Status</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            ${data.data.map(user => `
              <tr>
                <td>${user.username}</td>
                <td>${user.email}</td>
                <td>Rp ${(user.saldo || 0).toLocaleString()}</td>
                <td><span class="badge badge-${user.role === 'admin' ? 'warning' : 'info'}">${user.role}</span></td>
                <td><span class="badge badge-${user.isActive ? 'success' : 'danger'}">${user.isActive ? 'Aktif' : 'Nonaktif'}</span></td>
                <td>
                  <button onclick="toggleUser('${user._id}')" class="btn btn-${user.isActive ? 'danger' : 'secondary'}" style="padding:4px 12px;font-size:12px;">${user.isActive ? 'Nonaktifkan' : 'Aktifkan'}</button>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  } catch (error) {
    console.error('Load users error:', error);
  }
}

// ==========================================
//   SHOW ADD PRODUCT FORM
// ==========================================

function showAddProduct() {
  const container = document.getElementById('adminContent');
  container.innerHTML = `
    <div class="card">
      <h3>Tambah Produk</h3>
      <form onsubmit="handleAddProduct(event)">
        <div class="form-group">
          <label>Nama Produk</label>
          <input type="text" id="prodName" class="form-control" required>
        </div>
        <div class="form-group">
          <label>Deskripsi</label>
          <textarea id="prodDesc" class="form-control" rows="3" required></textarea>
        </div>
        <div class="form-group">
          <label>Harga</label>
          <input type="number" id="prodPrice" class="form-control" min="0" required>
        </div>
        <div class="form-group">
          <label>Stok</label>
          <input type="number" id="prodStock" class="form-control" min="0" required>
        </div>
        <div class="form-group">
          <label>Kategori</label>
          <select id="prodCategory" class="form-control">
            <option value="electronics">Electronics</option>
            <option value="fashion">Fashion</option>
            <option value="food">Food</option>
            <option value="digital">Digital</option>
            <option value="service">Service</option>
            <option value="other">Other</option>
          </select>
        </div>
        <button type="submit" class="btn btn-primary">Simpan</button>
        <button type="button" onclick="loadProducts()" class="btn btn-outline">Batal</button>
      </form>
    </div>
  `;
}

// ==========================================
//   HANDLE ADD PRODUCT
// ==========================================

async function handleAddProduct(e) {
  e.preventDefault();
  
  const name = document.getElementById('prodName').value;
  const description = document.getElementById('prodDesc').value;
  const price = parseInt(document.getElementById('prodPrice').value);
  const stock = parseInt(document.getElementById('prodStock').value);
  const category = document.getElementById('prodCategory').value;
  
  try {
    const response = await fetch(`${API_URL}/admin/products`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ name, description, price, stock, category })
    });
    
    const data = await response.json();
    
    if (data.status === 'success') {
      alert('✅ Produk berhasil ditambahkan');
      loadProducts();
    } else {
      alert(`❌ ${data.message}`);
    }
  } catch (error) {
    console.error('Add product error:', error);
    alert('❌ Gagal menambahkan produk');
  }
}

// ==========================================
//   TOGGLE PRODUCT
// ==========================================

async function toggleProduct(productId) {
  if (!confirm('Yakin ingin mengubah status produk ini?')) return;
  
  try {
    const response = await fetch(`${API_URL}/admin/products/${productId}/toggle`, {
      method: 'PUT',
      credentials: 'include'
    });
    
    const data = await response.json();
    if (data.status === 'success') {
      loadProducts();
    } else {
      alert(`❌ ${data.message}`);
    }
  } catch (error) {
    console.error('Toggle product error:', error);
    alert('❌ Gagal mengubah status');
  }
}

// ==========================================
//   UPDATE ORDER STATUS
// ==========================================

async function updateOrderStatus(orderId, status) {
  try {
    const response = await fetch(`${API_URL}/admin/orders/${orderId}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ status })
    });
    
    const data = await response.json();
    if (data.status !== 'success') {
      alert(`❌ ${data.message}`);
      loadOrders();
    }
  } catch (error) {
    console.error('Update order error:', error);
    alert('❌ Gagal mengupdate status');
  }
}

// ==========================================
//   TOGGLE USER
// ==========================================

async function toggleUser(userId) {
  if (!confirm('Yakin ingin mengubah status user ini?')) return;
  
  try {
    const response = await fetch(`${API_URL}/admin/users/${userId}/toggle`, {
      method: 'PUT',
      credentials: 'include'
    });
    
    const data = await response.json();
    if (data.status === 'success') {
      loadUsers();
    } else {
      alert(`❌ ${data.message}`);
    }
  } catch (error) {
    console.error('Toggle user error:', error);
    alert('❌ Gagal mengubah status');
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

document.addEventListener('DOMContentLoaded', async () => {
  const user = await checkAdminAuth();
  if (user) {
    loadDashboard();
  }
});

window.loadDashboard = loadDashboard;
window.loadProducts = loadProducts;
window.loadOrders = loadOrders;
window.loadUsers = loadUsers;
window.showAddProduct = showAddProduct;
window.handleAddProduct = handleAddProduct;
window.toggleProduct = toggleProduct;
window.updateOrderStatus = updateOrderStatus;
window.toggleUser = toggleUser;
window.logout = logout;