const API_URL = window.API_URL || window.location.origin + '/api';

// ==========================================
//   LOAD SALDO
// ==========================================

async function loadSaldo() {
  try {
    const token = localStorage.getItem('token');
    if (!token) return;
    
    const response = await fetch(`${API_URL}/wallet/balance`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await response.json();
    
    if (data.status === 'success') {
      const display = document.getElementById('saldoDisplay');
      if (display) {
        display.textContent = `Rp ${data.data.saldo.toLocaleString()}`;
        display.style.animation = 'none';
        setTimeout(() => display.style.animation = 'pulseSaldo 2s ease-in-out infinite', 10);
      }
    }
  } catch (error) {
    console.error('Load saldo error:', error);
  }
}

// ==========================================
//   TOPUP SALDO
// ==========================================

async function topupSaldo() {
  const input = document.getElementById('topupAmount');
  const result = document.getElementById('topupResult');
  
  if (!input) return;
  
  const amount = parseInt(input.value);
  
  if (!amount || amount < 10000) {
    result.innerHTML = `<div class="alert alert-danger">🌸 Minimal topup Rp10.000</div>`;
    window.showToast('Minimal topup Rp10.000', 'error');
    return;
  }
  
  if (amount > 10000000) {
    result.innerHTML = `<div class="alert alert-danger">🌸 Maksimal topup Rp10.000.000</div>`;
    window.showToast('Maksimal topup Rp10.000.000', 'error');
    return;
  }
  
  result.innerHTML = `<div class="alert alert-info">⏳ Memproses topup...</div>`;
  window.showToast('⏳ Memproses topup...', 'info');
  
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/wallet/topup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ amount })
    });
    
    const data = await response.json();
    
    if (data.status === 'success') {
      const d = data.data;
      result.innerHTML = `
        <div class="alert alert-success">
          <strong>✅ Topup berhasil dibuat!</strong>
          <p style="margin-top:8px;">🌸 Scan QRIS di bawah ini untuk menyelesaikan pembayaran.</p>
          <p style="font-size:13px;color:var(--pink-light);">🆔 Ref ID: ${d.reff_id}</p>
          <div style="margin:12px 0;text-align:center;">
            <img src="${d.qr_image}" alt="QRIS" style="max-width:250px;border-radius:12px;box-shadow:var(--shadow);">
          </div>
          <p style="font-size:13px;color:var(--pink-light);">
            💰 Total: Rp ${d.total.toLocaleString()} (termasuk fee Rp ${d.fee.toLocaleString()})
          </p>
          <p style="font-size:13px;color:var(--pink-light);">⏳ Expired: ${d.expired_at || '10 menit'}</p>
        </div>
      `;
      input.value = '';
      window.showToast('✅ QRIS berhasil digenerate!', 'success');
    } else {
      result.innerHTML = `<div class="alert alert-danger">❌ ${data.message || 'Gagal topup'}</div>`;
      window.showToast(`❌ ${data.message || 'Gagal topup'}`, 'error');
    }
  } catch (error) {
    console.error('Topup error:', error);
    result.innerHTML = `<div class="alert alert-danger">❌ Gagal menghubungi server</div>`;
    window.showToast('❌ Gagal menghubungi server', 'error');
  }
}

// ==========================================
//   LOAD TRANSACTION HISTORY
// ==========================================

async function loadTransactionHistory() {
  const container = document.getElementById('transactionHistory');
  if (!container) return;
  
  try {
    const token = localStorage.getItem('token');
    if (!token) return;
    
    const response = await fetch(`${API_URL}/wallet/history`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await response.json();
    
    if (data.status === 'success' && data.data.length > 0) {
      container.innerHTML = data.data.map(t => `
        <div class="transaction-item">
          <div class="info">
            <span class="type">${t.type === 'topup' ? '🌸 Topup' : t.type}</span>
            <span class="date">${new Date(t.createdAt).toLocaleString()}</span>
          </div>
          <div class="amount ${t.type === 'topup' ? 'positive' : 'negative'}">
            ${t.type === 'topup' ? '+' : '-'} Rp ${t.amount.toLocaleString()}
          </div>
        </div>
      `).join('');
    } else {
      container.innerHTML = '<p class="empty-state">🌸 Belum ada transaksi</p>';
    }
  } catch (error) {
    console.error('Load history error:', error);
    container.innerHTML = '<p class="empty-state" style="color:#f44336;">❌ Gagal memuat riwayat</p>';
  }
}

// ==========================================
//   INIT
// ==========================================

document.addEventListener('DOMContentLoaded', () => {
  loadSaldo();
  loadTransactionHistory();
});

// ==========================================
//   EXPOSE FUNCTIONS TO WINDOW
// ==========================================

window.topupSaldo = topupSaldo;
window.loadSaldo = loadSaldo;
