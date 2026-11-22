const API_URL = 'api/index.php';
const state = { products: [], cart: [], sales: [] };
const $ = (id) => document.getElementById(id);

function formatRupiah(value) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(Number(value) || 0);
}
function escapeHTML(value) {
  return String(value ?? '').replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[char]));
}
function showToast(message, isError = false) {
  const toast = $('toast');
  toast.textContent = message;
  toast.style.background = isError ? '#b72f39' : '#24282e';
  toast.classList.add('show');
  window.clearTimeout(showToast.timer);
  showToast.timer = window.setTimeout(() => toast.classList.remove('show'), 3000);
}
async function apiGet(action) {
  const response = await fetch(`${API_URL}?action=${encodeURIComponent(action)}`, { headers: { Accept: 'application/json' } });
  const result = await response.json();
  if (!response.ok || !result.success) throw new Error(result.message || 'Permintaan gagal.');
  return result.data;
}
async function apiPost(payload) {
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(payload)
  });
  const result = await response.json();
  if (!response.ok || !result.success) throw new Error(result.message || 'Permintaan gagal.');
  return result;
}
function updateClock() {
  const now = new Date();
  $('clock').textContent = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
  $('today').textContent = now.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
}
function renderSummary(stats) {
  $('sales-today').textContent = formatRupiah(stats.sales_today);
  $('transactions-today').textContent = Number(stats.transactions_today || 0).toLocaleString('id-ID');
  $('product-total').textContent = Number(stats.product_total || 0).toLocaleString('id-ID');
  $('average-sale').textContent = formatRupiah(stats.average_sale);
}
function renderProducts() {
  const keyword = $('search').value.trim().toLowerCase();
  const filtered = state.products.filter((p) => `${p.name} ${p.category}`.toLowerCase().includes(keyword));
  $('products').innerHTML = filtered.length ? filtered.map((p) => `
    <button class="product" type="button" data-add-product="${p.id}" ${Number(p.stock) < 1 ? 'disabled' : ''}>
      <span class="product-icon">${escapeHTML((p.category || 'P').slice(0, 1).toUpperCase())}</span>
      <span><strong>${escapeHTML(p.name)}</strong><small>${formatRupiah(p.price)}</small><small class="subtle">Stok: ${Number(p.stock)}</small></span>
    </button>`).join('') : '<div class="empty-search">Produk tidak ditemukan.</div>';
}
function renderCart() {
  const count = state.cart.reduce((sum, item) => sum + item.qty, 0);
  const total = state.cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  $('item-count').textContent = `${count} item`;
  $('subtotal').textContent = formatRupiah(total);
  $('total').textContent = formatRupiah(total);
  const paid = Number($('paid').value || 0);
  $('change').textContent = formatRupiah(Math.max(0, paid - total));
  $('checkout').disabled = state.cart.length === 0;
  $('cart-list').innerHTML = state.cart.length ? state.cart.map((item) => `
    <div class="cart-item">
      <div><strong>${escapeHTML(item.name)}</strong><small>${formatRupiah(item.price)} × ${item.qty} = ${formatRupiah(item.price * item.qty)}</small></div>
      <div class="qty"><button type="button" data-qty="minus" data-id="${item.id}" aria-label="Kurangi">−</button><span>${item.qty}</span><button type="button" data-qty="plus" data-id="${item.id}" aria-label="Tambah">+</button></div>
    </div>`).join('') : '<div class="cart-empty">Keranjang masih kosong.<br>Pilih produk untuk memulai.</div>';
}
function renderProductTable() {
  $('product-table').innerHTML = state.products.length ? state.products.map((p) => `
    <tr>
      <td><strong>${escapeHTML(p.name)}</strong></td><td>${escapeHTML(p.category || '-')}</td><td>${formatRupiah(p.price)}</td>
      <td class="${Number(p.stock) < 5 ? 'stock-low' : ''}">${Number(p.stock)}</td>
      <td><div class="table-actions"><button class="btn-mini btn-edit" data-edit-product="${p.id}" type="button">Ubah</button><button class="btn-mini btn-delete" data-delete-product="${p.id}" type="button">Nonaktifkan</button></div></td>
    </tr>`).join('') : '<tr><td colspan="5" class="table-empty">Belum ada produk. Tambahkan produk melalui formulir di atas.</td></tr>';
}
function renderSales(sales) {
  $('sales-table').innerHTML = sales.length ? sales.map((s) => `
    <tr><td><strong>${escapeHTML(s.invoice_code)}</strong></td><td>${new Date(String(s.created_at).replace(' ', 'T')).toLocaleString('id-ID')}</td><td>${formatRupiah(s.total)}</td><td>${formatRupiah(s.paid)}</td><td>${formatRupiah(s.change_amount)}</td></tr>`).join('') : '<tr><td colspan="5" class="table-empty">Belum ada transaksi penjualan.</td></tr>';
}
async function loadDashboard() {
  try {
    const data = await apiGet('dashboard');
    state.products = data.products || [];
    state.sales = data.sales || [];
    renderSummary(data.stats || {});
    renderProducts();
    renderProductTable();
    renderSales(state.sales);
  } catch (error) {
    $('products').innerHTML = `<div class="empty-search">${escapeHTML(error.message)}<br>Pastikan Apache dan MySQL XAMPP aktif, lalu import SQL.</div>`;
    $('product-table').innerHTML = `<tr><td colspan="5" class="table-empty">${escapeHTML(error.message)}</td></tr>`;
    $('sales-table').innerHTML = `<tr><td colspan="5" class="table-empty">${escapeHTML(error.message)}</td></tr>`;
    showToast(error.message, true);
  }
}
function resetProductForm() {
  $('product-form').reset();
  $('product-id').value = '';
  $('save-product').textContent = 'Simpan Produk';
  $('cancel-edit').hidden = true;
}
function createReceipt(sale) {
  const date = new Date(String(sale.created_at).replace(' ', 'T')).toLocaleString('id-ID');
  $('receipt').innerHTML = `
    <h4>Transaksi Berhasil Disimpan</h4>
    <p><strong>Invoice:</strong> ${escapeHTML(sale.invoice_code)}</p>
    <p><strong>Waktu:</strong> ${escapeHTML(date)}</p>
    ${sale.items.map((item) => `<p>${escapeHTML(item.name)} × ${item.qty} — ${formatRupiah(item.subtotal)}</p>`).join('')}
    <p><strong>Total:</strong> ${formatRupiah(sale.total)}</p>
    <p><strong>Bayar:</strong> ${formatRupiah(sale.paid)}</p>
    <p><strong>Kembalian:</strong> ${formatRupiah(sale.change_amount)}</p>
    <div class="receipt-actions"><button class="btn btn-light" id="print-receipt" type="button">Cetak</button><button class="btn btn-light" id="close-receipt" type="button">Tutup</button></div>`;
  $('receipt').classList.add('show');
}

$('search').addEventListener('input', renderProducts);
$('paid').addEventListener('input', renderCart);
$('products').addEventListener('click', (event) => {
  const button = event.target.closest('[data-add-product]');
  if (!button) return;
  const product = state.products.find((p) => Number(p.id) === Number(button.dataset.addProduct));
  if (!product) return;
  const existing = state.cart.find((item) => item.id === Number(product.id));
  if (existing) {
    if (existing.qty >= Number(product.stock)) return showToast('Jumlah melebihi stok yang tersedia.', true);
    existing.qty += 1;
  } else state.cart.push({ id: Number(product.id), name: product.name, price: Number(product.price), stock: Number(product.stock), qty: 1 });
  $('receipt').classList.remove('show');
  renderCart();
});
$('cart-list').addEventListener('click', (event) => {
  const button = event.target.closest('[data-qty]');
  if (!button) return;
  const item = state.cart.find((x) => x.id === Number(button.dataset.id));
  if (!item) return;
  if (button.dataset.qty === 'plus') {
    if (item.qty >= item.stock) return showToast('Jumlah melebihi stok yang tersedia.', true);
    item.qty += 1;
  } else item.qty -= 1;
  state.cart = state.cart.filter((x) => x.qty > 0);
  renderCart();
});
$('checkout').addEventListener('click', async () => {
  const items = state.cart.map((item) => ({ product_id: item.id, qty: item.qty }));
  try {
    $('checkout').disabled = true;
    const result = await apiPost({ action: 'checkout', items, paid: Number($('paid').value || 0) });
    state.cart = [];
    $('paid').value = '';
    renderCart();
    createReceipt(result.data);
    await loadDashboard();
    showToast('Transaksi berhasil disimpan.');
  } catch (error) {
    showToast(error.message, true);
    $('checkout').disabled = false;
  }
});
$('product-form').addEventListener('submit', async (event) => {
  event.preventDefault();
  const payload = {
    action: 'save_product', id: $('product-id').value,
    name: $('product-name').value.trim(), category: $('product-category').value.trim(),
    price: Number($('product-price').value), stock: Number($('product-stock').value)
  };
  try {
    const result = await apiPost(payload);
    showToast(result.message);
    resetProductForm();
    await loadDashboard();
  } catch (error) { showToast(error.message, true); }
});
$('product-table').addEventListener('click', async (event) => {
  const edit = event.target.closest('[data-edit-product]');
  const remove = event.target.closest('[data-delete-product]');
  if (edit) {
    const product = state.products.find((p) => Number(p.id) === Number(edit.dataset.editProduct));
    if (!product) return;
    $('product-id').value = product.id;
    $('product-name').value = product.name;
    $('product-category').value = product.category;
    $('product-price').value = product.price;
    $('product-stock').value = product.stock;
    $('save-product').textContent = 'Perbarui Produk';
    $('cancel-edit').hidden = false;
    $('products-panel').scrollIntoView({ behavior: 'smooth' });
  }
  if (remove) {
    const product = state.products.find((p) => Number(p.id) === Number(remove.dataset.deleteProduct));
    if (!product || !confirm(`Nonaktifkan produk "${product.name}"?`)) return;
    try { const result = await apiPost({ action: 'delete_product', id: product.id }); showToast(result.message); await loadDashboard(); }
    catch (error) { showToast(error.message, true); }
  }
});
$('cancel-edit').addEventListener('click', resetProductForm);
$('refresh-data').addEventListener('click', loadDashboard);
document.body.addEventListener('click', (event) => {
  const scrollButton = event.target.closest('[data-scroll]');
  if (scrollButton) document.getElementById(scrollButton.dataset.scroll)?.scrollIntoView({ behavior: 'smooth' });
  if (event.target.id === 'print-receipt') window.print();
  if (event.target.id === 'close-receipt') $('receipt').classList.remove('show');
});

updateClock();
setInterval(updateClock, 30000);
renderCart();
loadDashboard();
