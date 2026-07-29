// ==========================================
//   WALLET.JS - MANAJEMEN SALDO
// ==========================================

const API_URL = window.API_URL || 'https://mika-store-backend.onrender.com/api';

// ==========================================
//   LOAD SALDO
// ==========================================

async function loadSaldo() {
  try {
    const response = await fetch(`${API_URL}/wallet/balance`, {
      credentials: 'include'
    });
    const data = await response.json();
    
    if (data.status === 'success') {
      const display = document.getElementById('saldoDisplay');
      if (display) {
        display.textContent = `Rp ${data.data.saldo.toLocaleString()}`;
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
    result.innerHTML = `<div class="alert alert-danger">Minimal topup Rp10.000</div>`;
    return;
  }
  
  if (amount > 10000000) {
    result.innerHTML = `<div class="alert alert-danger">Maksimal topup Rp10.000.000</div>`;
    return;
  }
  
  result.innerHTML = `<div class="alert alert-info">⏳ Memproses topup...</div>`;
  
  try {
    const response = await fetch(`${API_URL}/wallet/topup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ amount })
    });
    
    const data = await response.json();
    
    if (data.status === 'success') {
      const d = data.data;
      result.innerHTML = `
        <div class="alert alert-success">
          <strong>✅ Topup berhasil dibuat!</strong>
          <p style="margin-top:8px;">
            Scan QRIS di bawah ini untuk menyelesaikan pembayaran.
          </p>
          <p style="margin-top:4px;font-size:13px;color:var(--gray);">
            Ref ID: ${d.reff_id}
          </p>
          <div style="margin:12px 0;text-align:center;">
            <img src="${d.qr_image}" alt="QRIS" style="max-width:250px;border-radius:8px;">
          </div>
          <p style="font-size:13px;color:var(--gray);">
            Total: Rp ${d.total.toLocaleString()} (termasuk fee Rp ${d.fee.toLocaleString()})
          </p>
          <p style="font-size:13px;color:var(--gray);">
            Expired: ${d.expired_at || '10 menit'}
          </p>
          <div style="margin-top:8px;">
            <button onclick="cekTopupStatus('${d.reff_id}')" class="btn btn-primary" style="padding:8px 20px;font-size:13px;">
              Cek Status
            </button>
          </div>
        </div>
      `;
      input.value = '';
    } else {
      result.innerHTML = `<div class="alert alert-danger">❌ ${data.message || 'Gagal topup'}</div>`;
    }
  } catch (error) {
    console.error('Topup error:', error);
    result.innerHTML = `<div class="alert alert-danger">❌ Gagal menghubungi server</div>`;
  }
}

// ==========================================
//   CEK STATUS TOPUP
// ==========================================

async function cekTopupStatus(reffId) {
  const result = document.getElementById('topupResult');
  if (!result) return;
  
  result.innerHTML = `<div class="alert alert-info">⏳ Mengecek status...</div>`;
  
  try {
    const response = await fetch(`${API_URL}/wallet/topup/status/${reffId}`, {
      credentials: 'include'
    });
    const data = await response.json();
    
    if (data.status === 'success') {
      const statusMap = {
        'pending': '⏳ Menunggu pembayaran',
        'success': '✅ Berhasil! Saldo sudah ditambahkan',
        'failed': '❌ Gagal',
        'expired': '⏰ Expired'
      };
      
      result.innerHTML = `
        <div class="alert alert-${data.data.status === 'success' ? 'success' : 'warning'}">
          <strong>Status: ${statusMap[data.data.status] || data.data.status}</strong>
          <p style="margin-top:4px;font-size:13px;color:var(--gray);">
            Jumlah: Rp ${data.data.amount.toLocaleString()}
          </p>
          <p style="font-size:13px;color:var(--gray);">
            Dibuat: ${new Date(data.data.createdAt).toLocaleString()}
          </p>
          ${data.data.completedAt ? `<p style="font-size:13px;color:var(--gray);">Selesai: ${new Date(data.data.completedAt).toLocaleString()}</p>` : ''}
        </div>
      `;
      
      if (data.data.status === 'success') {
        loadSaldo();
      }
    } else {
      result.innerHTML = `<div class="alert alert-danger">❌ ${data.message}</div>`;
    }
  } catch (error) {
    console.error('Cek status error:', error);
    result.innerHTML = `<div class="alert alert-danger">❌ Gagal cek status</div>`;
  }
}

// ==========================================
//   LOAD TRANSACTION HISTORY
// ==========================================

async function loadTransactionHistory() {
  const container = document.getElementById('transactionHistory');
  if (!container) return;
  
  try {
    const response = await fetch(`${API_URL}/wallet/history`, {
      credentials: 'include'
    });
    const data = await response.json();
    
    if (data.status === 'success' && data.data.transactions.length > 0) {
      const statusMap = {
        'pending': '⏳ Pending',
        'success': '✅ Berhasil',
        'failed': '❌ Gagal',
        'expired': '⏰ Expired'
      };
      
      container.innerHTML = data.data.transactions.map(t => `
        <div style="padding:12px 0;border-bottom:1px solid #E2E8F0;display:flex;justify-content:space-between;align-items:center;">
          <div>
            <div style="font-weight:600;">${t.type === 'topup' ? '💰 Topup' : t.type}</div>
            <div style="font-size:13px;color:var(--gray);">${new Date(t.createdAt).toLocaleString()}</div>
          </div>
          <div style="text-align:right;">
            <div style="font-weight:700;color:${t.type === 'topup' ? 'var(--secondary)' : 'var(--danger)'};">
              ${t.type === 'topup' ? '+' : '-'} Rp ${t.amount.toLocaleString()}
            </div>
            <div style="font-size:12px;">${statusMap[t.status] || t.status}</div>
          </div>
        </div>
      `).join('');
    } else {
      container.innerHTML = `<p style="color:var(--gray);">Belum ada transaksi</p>`;
    }
  } catch (error) {
    console.error('Load history error:', error);
    container.innerHTML = `<p style="color:var(--danger);">Gagal memuat riwayat</p>`;
  }
}

// ==========================================
//   INIT
// ==========================================

document.addEventListener('DOMContentLoaded', () => {
  loadSaldo();
  loadTransactionHistory();
});

// Export untuk digunakan di HTML
window.topupSaldo = topupSaldo;
window.cekTopupStatus = cekTopupStatus;