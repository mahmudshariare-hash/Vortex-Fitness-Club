const SUPABASE_URL = 'https://ovxxnsrqzdlyzdmubwaw.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im92eHhuc3JxemRseXpkbXVid2F3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM5NzY4MTgsImV4cCI6MjA3OTU1MjgxOH0.uwU9aQGbUO7OEv4HI8Rtq7awANWNubt3yJTSUMZRAJU';

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const loading = document.getElementById('loading');
const analyticsContent = document.getElementById('analytics-content');
const noDataMsg = document.getElementById('no-data-msg');

const filterBtns = document.querySelectorAll('.filter-btn');
const dateRangePickerEl = document.getElementById('date-range-picker');

// Aggregate Elements
const totalRevenueEl = document.getElementById('total-revenue');
const totalOrdersEl = document.getElementById('total-orders');
const netProfitEl = document.getElementById('net-profit');
const lowStockCountEl = document.getElementById('low-stock-count');

// Sections
const cafeTransactionsEl = document.getElementById('cafe-transactions');
const suppTransactionsEl = document.getElementById('supp-transactions');

// Lists
const topSuppByRevenueEl = document.getElementById('top-supp-by-revenue');
const topSuppByUnitsEl = document.getElementById('top-supp-by-units');
const lowStockListEl = document.getElementById('low-stock-list');

// Forms
const expenseForm = document.getElementById('expense-form');
const expDescEl = document.getElementById('exp-description');
const expAmountEl = document.getElementById('exp-amount');
const expCategoryEl = document.getElementById('exp-category');
const expenseListEl = document.getElementById('expense-list');

const restockForm = document.getElementById('restock-form');
const restockProductSelect = document.getElementById('restock-product-select');
const restockQtyEl = document.getElementById('restock-qty');
const restockCostEl = document.getElementById('restock-cost');

// Filters and Search (Transactions)
const txSearchBox = document.getElementById('tx-search');
const txCategoryFilter = document.getElementById('tx-category-filter');

// Filters and Search (Expenses) - ADDED THESE FIXED VARIABLES
const expenseCatFilterEl = document.getElementById('expense-cat-filter');
const expenseSearchFilterEl = document.getElementById('expense-search-filter');

const exportCafeBtn = document.getElementById('export-cafe');
const exportSuppBtn = document.getElementById('export-supp');

let range = { from: null, to: null };
let cafeOrders = [];
let suppOrders = [];
let suppItems = [];
let supplementProductsById = {};
let expenses = [];
let cafeOrderItems = [];
let menuItemsById = {};

/* ---------- AUTH USING localStorage (from login.js) ---------- */

function requireAuth() {
  const raw = localStorage.getItem('vortex_user');

  if (!raw) {
    window.location.href = 'index.html';
    return null;
  }

  let user;
  try {
    user = JSON.parse(raw);
  } catch (e) {
    console.error('Failed to parse vortex_user from localStorage', e);
    localStorage.removeItem('vortex_user');
    window.location.href = 'index.html';
    return null;
  }

  if (user.email !== 'mahin@mail.com') {
    alert('You are not allowed to access the Owner Dashboard.');
    window.location.href = 'dashboard.html'; // staff portal
    return null;
  }

  return user;
}

/* ---------------------- UTILS ---------------------- */

async function deleteTransactionCascade(table, id) {
  try {
    if (table === 'orders') {
      await supabaseClient.from('payments').delete().eq('order_id', id);
      await supabaseClient.from('order_items').delete().eq('order_id', id);
      const { error } = await supabaseClient.from('orders').delete().eq('id', id);
      if (error) throw error;
    } else if (table === 'supplement_orders') {
      await supabaseClient.from('payments').delete().eq('supplement_order_id', id);
      await supabaseClient.from('supplement_order_items').delete().eq('order_id', id);
      const { error } = await supabaseClient.from('supplement_orders').delete().eq('id', id);
      if (error) throw error;
    } else if (table === 'expenses') {
      const { error } = await supabaseClient.from('expenses').delete().eq('id', id);
      if (error) throw error;
    } else {
      throw new Error(`Unsupported table for delete: ${table}`);
    }
    return { ok: true };
  } catch (error) {
    console.error('Failed to delete transaction:', error);
    return { ok: false, error };
  }
}

function filterAndRenderExpenses() {
  // Guard clause in case elements aren't found in HTML
  if (!expenseCatFilterEl || !expenseSearchFilterEl) return;

  const cat = expenseCatFilterEl.value; // 'all', 'Cafe', etc.
  const text = expenseSearchFilterEl.value.toLowerCase();

  // Filter the GLOBAL 'expenses' array
  const filtered = expenses.filter(e => {
    // 1. Check Category
    const categoryMatch = (cat === 'all') || (e.category === cat);
    
    // 2. Check Text (Description OR Date string)
    const dateStr = new Date(e.created_at).toLocaleDateString().toLowerCase();
    const descStr = (e.description || '').toLowerCase();
    const textMatch = descStr.includes(text) || dateStr.includes(text);

    return categoryMatch && textMatch;
  });

  renderExpenses(filtered);
}

function formatBDT(n) {
  return (
    '৳' +
    Number(n || 0).toLocaleString('en-BD', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  );
}

function prettyPaymentMethod(m) {
  if (!m) return '—';
  const val = String(m).toLowerCase();
  if (val === 'bkash') return 'bKash';
  if (val === 'card') return 'Card';
  if (val === 'cash') return 'Cash';
  return 'Other';
}

function getPaymentBreakdown(orders) {
  const totals = { cash: 0, bkash: 0, card: 0, other: 0 };
  orders.forEach((o) => {
    const payments = o.payments || [];
    if (!payments.length) return;
    const last = payments[payments.length - 1];
    const method = (last.method || '').toLowerCase();
    const amt = Number(o.total_amount || 0);

    if (method === 'cash') totals.cash += amt;
    else if (method === 'bkash') totals.bkash += amt;
    else if (method === 'card') totals.card += amt;
    else totals.other += amt;
  });
  return totals;
}

function startOfDay(d) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function endOfDay(d) {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
}

function applyQuickRange(code) {
  const now = new Date();
  if (code === 'today') {
    range = { from: startOfDay(now), to: endOfDay(now) };
  } else if (code === '7d') {
    const from = new Date(now);
    from.setDate(from.getDate() - 6);
    range = { from: startOfDay(from), to: endOfDay(now) };
  } else if (code === '30d') {
    const from = new Date(now);
    from.setDate(from.getDate() - 29);
    range = { from: startOfDay(from), to: endOfDay(now) };
  }
}

const iso = (d) => d.toISOString();

function initDatePicker() {
  flatpickr(dateRangePickerEl, {
    mode: 'range',
    dateFormat: 'Y-m-d',
    onClose: (selectedDates) => {
      if (selectedDates.length === 2) {
        range = {
          from: startOfDay(selectedDates[0]),
          to: endOfDay(selectedDates[1]),
        };
        refresh();
      }
    },
  });
}

/* ---------------------- SUPABASE FETCHES ---------------------- */

async function fetchCafeOrders() {
  const { data, error } = await supabaseClient
    .from('orders')
    .select('*, payments(*)')
    .eq('status', 'Delivery Complete')
    .gte('created_at', iso(range.from))
    .lte('created_at', iso(range.to))
    .order('created_at', { ascending: false });
  if (error) return [];
  return data || [];
}

async function fetchCafeOrderItems(orderIds) {
  if (!orderIds.length) return [];
  const { data, error } = await supabaseClient
    .from('order_items')
    .select('order_id,menu_item_id,quantity,price_at_order')
    .in('order_id', orderIds);
  if (error) return [];
  return data || [];
}

async function fetchMenuItems() {
  const { data, error } = await supabaseClient
    .from('menu_items')
    .select('id,name,category');
  if (error) return {};
  const map = {};
  (data || []).forEach((item) => (map[item.id] = item));
  return map;
}

async function fetchSuppOrders() {
  const { data, error } = await supabaseClient
    .from('supplement_orders')
    .select('*, payments:payments_supplement_order_id_fkey(*)')
    .eq('status', 'Completed')
    .gte('created_at', iso(range.from))
    .lte('created_at', iso(range.to))
    .order('created_at', { ascending: false });
  if (error) return [];
  return data || [];
}

async function fetchSuppOrderItemsFor(ids) {
  if (!ids.length) return [];
  const { data, error } = await supabaseClient
    .from('supplement_order_items')
    .select('order_id,supplement_product_id,quantity,price_at_order')
    .in('order_id', ids);
  if (error) return [];
  return data || [];
}

async function fetchSuppProductsMap() {
  // Added 'variants' to the select query
  const { data, error } = await supabaseClient
    .from('supplement_products')
    .select('id,name,brand,buying_price,stock,variants'); 
  if (error) return {};
  const map = {};
  (data || []).forEach((p) => (map[p.id] = p));
  return map;
}

async function fetchExpenses() {
  const { data, error } = await supabaseClient
    .from('expenses')
    .select('*')
    .gte('created_at', iso(range.from))
    .lte('created_at', iso(range.to))
    .order('created_at', { ascending: false });
  if (error) return [];
  return data || [];
}

async function fetchLowStock() {
  const { data, error } = await supabaseClient
    .from('supplement_products')
    .select('id,name,brand,stock')
    .lte('stock', 5)
    .order('stock', { ascending: true })
    .limit(12);
  if (error) return [];
  return data || [];
}

/* ---------------------- RENDER HELPERS ---------------------- */

function renderTransactionsList(target, rows, kind) {
  target.innerHTML = '';
  if (!rows.length) {
    target.innerHTML = `<p class="empty-message">No ${kind} transactions found.</p>`;
    return;
  }
  const display = rows.slice(0, 10);
  display.forEach((tx) => {
    const el = document.createElement('div');
    el.className = 'tx-item';
    el.innerHTML = `
      <div class="tx-left">
        <span class="tx-title">${tx.customer_name || 'Walk-in'}</span>
        <span class="tx-sub">${new Date(tx.created_at).toLocaleString()} • ${kind === 'cafe' ? 'Cafe #' : 'Supp #'}${String(tx.id).slice(0, 6).toUpperCase()}</span>
      </div>
      <div class="tx-amount">${formatBDT(tx.total_amount)}</div>
    `;
    target.appendChild(el);
  });
}

function renderCafeStats() {
  // 1. Calculate Total Sales
  const totalSales = cafeOrders.reduce((s, o) => s + Number(o.total_amount || 0), 0);
  
  // 2. Calculate Café Specific Expenses
  // Filter expenses where category is exactly 'Cafe'
  const cafeExpenses = expenses
    .filter(e => e.category === 'Cafe')
    .reduce((sum, e) => sum + Number(e.amount || 0), 0);

  // 3. Calculate Profit
  const cafeProfit = totalSales - cafeExpenses;

  // 4. Update DOM Elements
  document.getElementById('cafe-total-sales').textContent = formatBDT(totalSales);
  
  // Update the new Profit Card (Middle Card)
  const profitEl = document.getElementById('cafe-net-profit');
  if (profitEl) {
      profitEl.textContent = formatBDT(cafeProfit);
      // Optional: Make text red if negative
      profitEl.style.color = cafeProfit < 0 ? '#ef4444' : '';
  }

  // 5. Payment Breakdown (Right Card - Kept as requested)
  const cafePay = getPaymentBreakdown(cafeOrders);
  let cafeBreakdown = `Cash: ${formatBDT(cafePay.cash)} • bKash: ${formatBDT(cafePay.bkash)} • Card: ${formatBDT(cafePay.card)}`;
  if (cafePay.other > 0) cafeBreakdown += ` • Other: ${formatBDT(cafePay.other)}`;
  document.getElementById('cafe-avg-order').textContent = cafeBreakdown;

  // --- (Rest of the function for Most/Least sold items remains exactly the same) ---
  const itemStats = {};
  cafeOrderItems.forEach((item) => {
    const menuId = item.menu_item_id;
    if (!itemStats[menuId]) itemStats[menuId] = { quantity: 0, revenue: 0 };
    itemStats[menuId].quantity += Number(item.quantity || 0);
    itemStats[menuId].revenue += Number(item.price_at_order || 0) * Number(item.quantity || 0);
  });

  const sortedByRevenue = Object.entries(itemStats).sort((a, b) => b[1].revenue - a[1].revenue);
  const mostSold = sortedByRevenue.slice(0, 5);
  const leastSold = sortedByRevenue.slice(-5).reverse();

  const mostSoldEl = document.getElementById('cafe-most-sold');
  mostSoldEl.innerHTML = mostSold.length ? mostSold.map(([id, stats]) => {
        const menuItem = menuItemsById[id] || {};
        return `
        <div class="product-card">
          <div class="product-info">
            <h3>${menuItem.name || 'Unknown Item'}</h3>
            <p>${menuItem.category || 'Uncategorized'}</p>
          </div>
          <div class="product-stats">
            <p class="product-stat">${formatBDT(stats.revenue)}</p>
            <p class="product-stat-label">${stats.quantity} sold</p>
          </div>
        </div>`;
      }).join('') : '<p class="empty-message">No sales data available.</p>';

  const leastSoldEl = document.getElementById('cafe-least-sold');
  leastSoldEl.innerHTML = leastSold.length ? leastSold.map(([id, stats]) => {
        const menuItem = menuItemsById[id] || {};
        return `
        <div class="product-card">
          <div class="product-info">
            <h3>${menuItem.name || 'Unknown Item'}</h3>
            <p>${menuItem.category || 'Uncategorized'}</p>
          </div>
          <div class="product-stats">
            <p class="product-stat">${formatBDT(stats.revenue)}</p>
            <p class="product-stat-label">${stats.quantity} sold</p>
          </div>
        </div>`;
      }).join('') : '<p class="empty-message">No sales data available.</p>';

  const allItemsEl = document.getElementById('cafe-all-items');
  allItemsEl.innerHTML = sortedByRevenue.length ? sortedByRevenue.map(([id, stats]) => {
        const menuItem = menuItemsById[id] || {};
        return `
        <div class="tx-item">
          <div class="tx-left">
            <span class="tx-title">${menuItem.name || 'Unknown Item'}</span>
            <span class="tx-sub">${menuItem.category || 'Uncategorized'} • ${stats.quantity} units sold</span>
          </div>
          <div class="tx-amount">${formatBDT(stats.revenue)}</div>
        </div>`;
      }).join('') : '<p class="empty-message">No menu items sold in this period.</p>';
}

function renderSupplementStats() {
  // 1. Calculate Total Sales (Revenue)
  const totalSales = suppOrders.reduce((s, o) => s + Number(o.total_amount || 0), 0);

  // 2. Calculate Supplement Expenses (Buying Price / Restocking Cost)
  // We filter expenses to only find those labeled 'Supplement'
  const suppExpenses = expenses
    .filter(e => e.category === 'Supplement')
    .reduce((sum, e) => sum + Number(e.amount || 0), 0);

  // 3. Calculate Net Profit (Sales - Cost of Goods Bought)
  const netProfit = totalSales - suppExpenses;

  // 4. Update DOM Elements
  document.getElementById('supp-total-sales').textContent = formatBDT(totalSales);
  
  // Update the new Profit Card
  const profitEl = document.getElementById('supp-net-profit');
  if (profitEl) {
    profitEl.textContent = formatBDT(netProfit);
    // Optional: Make text red if negative (meaning you bought more stock than you sold)
    profitEl.style.color = netProfit < 0 ? '#ef4444' : '';
  }

  // 5. Payment Breakdown (Unchanged)
  const suppPay = getPaymentBreakdown(suppOrders);
  let suppBreakdown = `Cash: ${formatBDT(suppPay.cash)} • bKash: ${formatBDT(suppPay.bkash)} • Card: ${formatBDT(suppPay.card)}`;
  if (suppPay.other > 0) suppBreakdown += ` • Other: ${formatBDT(suppPay.other)}`;
  document.getElementById('supp-profit-margin').textContent = suppBreakdown;
}

function renderTopSupplements(items, prodMap) {
  const revenueById = {};
  const unitsById = {};
  (items || []).forEach((it) => {
    const id = it.supplement_product_id;
    const qty = Number(it.quantity || 0);
    const sale = Number(it.price_at_order || 0) * qty;
    revenueById[id] = (revenueById[id] || 0) + sale;
    unitsById[id] = (unitsById[id] || 0) + qty;
  });

  const topRev = Object.entries(revenueById).sort((a, b) => b[1] - a[1]).slice(0, 8);
  const topQty = Object.entries(unitsById).sort((a, b) => b[1] - a[1]).slice(0, 8);
  const leastQty = Object.entries(unitsById).sort((a, b) => a[1] - b[1]).slice(0, 8);

  topSuppByRevenueEl.innerHTML = topRev.length
    ? topRev.map(([id, amt]) => {
          const p = prodMap[id] || {};
          return `<li><span>${p.name || 'Unknown'} <span class="tx-sub">(${p.brand || '—'})</span></span><span class="badge badge-success">${formatBDT(amt)}</span></li>`;
        }).join('')
    : `<li class="tx-sub">No supplement revenue in this period.</li>`;

  topSuppByUnitsEl.innerHTML = topQty.length
    ? topQty.map(([id, qty]) => {
          const p = prodMap[id] || {};
          return `<li><span>${p.name || 'Unknown'} <span class="tx-sub">(${p.brand || '—'})</span></span><span class="badge badge-info">${qty} pcs</span></li>`;
        }).join('')
    : `<li class="tx-sub">No supplement units in this period.</li>`;

  const leastSuppEl = document.getElementById('least-supp-by-units');
  if (leastSuppEl) {
    leastSuppEl.innerHTML = leastQty.length
      ? leastQty.map(([id, qty]) => {
            const p = prodMap[id] || {};
            return `<li><span>${p.name || 'Unknown'} <span class="tx-sub">(${p.brand || '—'})</span></span><span class="badge badge-warning">${qty} pcs</span></li>`;
          }).join('')
      : `<li class="tx-sub">No supplement data available.</li>`;
  }
}

function renderLowStock(list) {
  lowStockListEl.innerHTML = list.length
    ? list.map(p => `<li><span>${p.name} <span class="tx-sub">(${p.brand || '—'})</span></span><span class="badge badge-danger">${p.stock} left</span></li>`).join('')
    : `<li class="tx-sub">All good. No low-stock items.</li>`;
  lowStockCountEl.textContent = list.length;
  
  const suppLowStockEl = document.getElementById('supp-low-stock-list');
  if (suppLowStockEl) suppLowStockEl.innerHTML = lowStockListEl.innerHTML;
}

function renderExpenses(list) {
  expenseListEl.innerHTML = list.length
    ? list.map(e => `
      <li>
        <span>${e.description} <span class="tx-sub">(${e.category || 'General'}) • ${new Date(e.created_at).toLocaleDateString()}</span></span>
        <span class="badge badge-danger">-${formatBDT(e.amount)}</span>
      </li>`).join('')
    : `<li class="tx-sub">No expenses logged for this period.</li>`;

  const expTotal = list.reduce((s, e) => s + Number(e.amount || 0), 0);
  const expCount = list.length;
  const expAvg = expCount > 0 ? expTotal / expCount : 0;

  document.getElementById('exp-total').textContent = formatBDT(expTotal);
  document.getElementById('exp-count').textContent = String(expCount);
  document.getElementById('exp-avg').textContent = formatBDT(expAvg);
}

// Populate Product Dropdown for Restock Form
// Variable to store the currently selected product for easy access
let selectedRestockProduct = null;

function populateRestockDropdown() {
    const restockSelect = document.getElementById('restock-product-select');
    const variantSelect = document.getElementById('restock-variant-select');
    
    // Clear existing
    restockSelect.innerHTML = '<option value="">Select Product...</option>';
    variantSelect.innerHTML = '<option value="">Select Option...</option>';
    variantSelect.classList.add('hidden');

    const products = Object.values(supplementProductsById).sort((a,b) => a.name.localeCompare(b.name));
    
    products.forEach(p => {
        const opt = document.createElement('option');
        opt.value = p.id;
        // Show total stock
        opt.textContent = `${p.name} (${p.brand || 'No Brand'}) - Total Stock: ${p.stock}`;
        restockSelect.appendChild(opt);
    });

    // Listen for changes
    restockSelect.onchange = (e) => {
        const productId = e.target.value;
        variantSelect.innerHTML = '<option value="">Select Option...</option>';
        variantSelect.classList.add('hidden');
        variantSelect.removeAttribute('required');

        if (!productId) {
            selectedRestockProduct = null;
            return;
        }

        selectedRestockProduct = supplementProductsById[productId];

        // Check for variants
        if (selectedRestockProduct.variants && selectedRestockProduct.variants.length > 0) {
            variantSelect.classList.remove('hidden');
            variantSelect.setAttribute('required', 'true'); // Make it mandatory if variants exist

            selectedRestockProduct.variants.forEach((v, idx) => {
                const opt = document.createElement('option');
                opt.value = idx; // We use the index of the array
                opt.textContent = `${v.name} (Current Stock: ${v.stock})`;
                variantSelect.appendChild(opt);
            });
        }
    };
}

/* ---------------------- DELETE HANDLERS ---------------------- */

function attachDeleteHandlers() {
  const tbody = document.getElementById('all-transactions-body');
  if (!tbody) return;
  const buttons = tbody.querySelectorAll('.delete-tx-btn');

  buttons.forEach((btn) => {
    btn.onclick = async () => {
      const table = btn.dataset.table;
      const id = btn.dataset.id;
      if (!table || !id) return;
      if (!window.confirm('Are you sure you want to permanently delete this transaction?')) return;

      const { ok, error } = await deleteTransactionCascade(table, id);
      if (!ok) {
        alert('Failed to delete transaction. See console.');
        return;
      }
      refresh();
    };
  });
}

function renderAllTransactions() {
  // 1. Gather all data
  const allTx = [];

  // Cafe Income
  cafeOrders.forEach((order) => {
    const payments = order.payments || [];
    const last = payments[payments.length - 1] || null;
    allTx.push({
      date: new Date(order.created_at),
      type: 'Café',
      category: 'Cafe',
      customer: last ? prettyPaymentMethod(last.method) : '—',
      orderId: String(order.id).slice(0, 8).toUpperCase(),
      amount: Number(order.total_amount || 0),
      table: 'orders',
      recordId: order.id,
    });
  });

  // Supplement Income
  suppOrders.forEach((order) => {
    const payments = order.payments || [];
    const last = payments[payments.length - 1] || null;
    allTx.push({
      date: new Date(order.created_at),
      type: 'Supplement',
      category: 'Supplement',
      customer: last ? prettyPaymentMethod(last.method) : '—',
      orderId: String(order.id).slice(0, 8).toUpperCase(),
      amount: Number(order.total_amount || 0),
      table: 'supplement_orders',
      recordId: order.id,
    });
  });

  // Expenses (Outflow)
  expenses.forEach((exp) => {
    allTx.push({
      date: new Date(exp.created_at),
      type: 'Expense',
      category: exp.category || 'General',
      customer: exp.category || 'General',
      orderId: exp.description,
      amount: -Number(exp.amount || 0), // Negative for display logic
      table: 'expenses',
      recordId: exp.id,
    });
  });

  allTx.sort((a, b) => b.date - a.date);

  // 2. Calculation Logic (Corrected)
  // Revenue = All Positive Inflows (Cafe + Supp Sales)
  // Expenses = All explicit Expenses (Rent, Bills, Buying Goods)
  // Net Profit = Revenue - Expenses

  const cafeRevenue = cafeOrders.reduce((s, o) => s + Number(o.total_amount || 0), 0);
  const suppRevenue = suppOrders.reduce((s, o) => s + Number(o.total_amount || 0), 0);
  const totalRevenue = cafeRevenue + suppRevenue;

  const totalExpenses = expenses.reduce((s, e) => s + Number(e.amount || 0), 0);
  const netIncome = totalRevenue - totalExpenses;

  // Update Top Cards
  document.getElementById('all-tx-count').textContent = String(allTx.length);
  document.getElementById('all-tx-revenue').textContent = formatBDT(totalRevenue);
  document.getElementById('all-tx-expenses').textContent = formatBDT(totalExpenses);
  document.getElementById('all-tx-net').textContent = formatBDT(netIncome);

  // Update Global Summary Cards (Header)
  totalRevenueEl.textContent = formatBDT(totalRevenue);
  totalOrdersEl.textContent = String(cafeOrders.length + suppOrders.length);
  netProfitEl.textContent = formatBDT(netIncome);

  // 3. Render Table with Filters
  const tbody = document.getElementById('all-transactions-body');
  
  const filterAndRender = () => {
    const query = txSearchBox.value.toLowerCase();
    const catFilter = txCategoryFilter.value; // 'all', 'Cafe', 'Supplement', 'Expense'

    const filtered = allTx.filter((tx) => {
        // Text Search
        const matchesText = 
            tx.customer.toLowerCase().includes(query) ||
            tx.orderId.toLowerCase().includes(query) ||
            tx.type.toLowerCase().includes(query);
        
        // Category Filter
        let matchesCat = true;
        if (catFilter !== 'all') {
            if (catFilter === 'Expense') {
                matchesCat = (tx.type === 'Expense');
            } else {
                // For Cafe or Supplement, we want positive transactions OR expenses of that category
                // Logic: If filter is "Cafe", show Cafe Sales AND Cafe Expenses
                const txCat = (tx.category || '').toLowerCase(); // 'cafe', 'supplement', 'general'
                const filterLower = catFilter.toLowerCase();
                
                // If the transaction type matches (e.g. Type 'Café') OR the expense category matches
                if (tx.type.toLowerCase() === filterLower) matchesCat = true;
                else if (tx.type === 'Expense' && txCat === filterLower) matchesCat = true;
                else matchesCat = false;
            }
        }
        return matchesText && matchesCat;
    });

    tbody.innerHTML = filtered.map((tx) => `
      <tr>
        <td>${tx.date.toLocaleString()}</td>
        <td><span class="badge ${tx.type === 'Expense' ? 'badge-danger' : 'badge-info'}">${tx.type}</span></td>
        <td>${tx.customer}</td>
        <td>${tx.orderId}</td>
        <td class="${tx.amount < 0 ? 'tx-amount negative' : 'tx-amount'}">${formatBDT(Math.abs(tx.amount))}</td>
        <td>
          <button class="delete-tx-btn" data-table="${tx.table}" data-id="${tx.recordId}">Delete</button>
        </td>
      </tr>`).join('');
      
    attachDeleteHandlers();
  };

  // Attach listeners
  txSearchBox.oninput = filterAndRender;
  txCategoryFilter.onchange = filterAndRender;
  
  // Initial render
  filterAndRender();
}

function toCSV(rows) {
  if (!rows.length) return '';
  const cols = Object.keys(rows[0]);
  const head = cols.join(',');
  const body = rows.map((r) => cols.map((c) => JSON.stringify(r[c] ?? '')).join(',')).join('\n');
  return head + '\n' + body;
}

function download(filename, text) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([text], { type: 'text/csv' }));
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  URL.revokeObjectURL(a.href);
  document.body.removeChild(a);
}

/* ---------------------- MAIN REFRESH ---------------------- */

async function refresh() {
  loading.classList.add('visible');
  analyticsContent.classList.add('hidden');
  noDataMsg.classList.add('hidden');

  const [cafe, supp, exp, prodMap, menuMap] = await Promise.all([
    fetchCafeOrders(),
    fetchSuppOrders(),
    fetchExpenses(),
    fetchSuppProductsMap(),
    fetchMenuItems(),
  ]);
  
  cafeOrders = cafe;
  suppOrders = supp;
  expenses = exp;
  supplementProductsById = prodMap;
  menuItemsById = menuMap;

  suppItems = await fetchSuppOrderItemsFor(suppOrders.map((o) => o.id));
  cafeOrderItems = await fetchCafeOrderItems(cafeOrders.map((o) => o.id));

  // Render everything
  renderTransactionsList(cafeTransactionsEl, cafeOrders, 'cafe');
  renderTransactionsList(suppTransactionsEl, suppOrders, 'supplements');
  renderTopSupplements(suppItems, supplementProductsById);
  renderCafeStats();
  renderSupplementStats();
  
  // Populate dropdowns that depend on data
  populateRestockDropdown();

  const lowStock = await fetchLowStock();
  renderLowStock(lowStock);
  
  // CHANGED: Use filterAndRenderExpenses instead of plain renderExpenses
  // to ensure filters are respected on load/refresh
  filterAndRenderExpenses();
  
  // Crucial: This now handles all aggregate math
  renderAllTransactions();

  const hasAny = cafeOrders.length || suppOrders.length || expenses.length;
  noDataMsg.classList.toggle('hidden', !!hasAny);
  loading.classList.remove('visible');
  analyticsContent.classList.remove('hidden');

  if (window.lucide) lucide.createIcons();
}

/* ---------------------- UI SETUP ---------------------- */

function setupTabs() {
  const tabBtns = document.querySelectorAll('.tab-btn');
  const tabContents = document.querySelectorAll('.tab-content');

  tabBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      const targetTab = btn.dataset.tab;
      tabBtns.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      tabContents.forEach((content) => content.classList.remove('active'));
      const targetContent = document.getElementById(`tab-${targetTab}`);
      if (targetContent) targetContent.classList.add('active');
      if (window.lucide) lucide.createIcons();
    });
  });
}

function setupEvents() {
  // 1. Dashboard Date Range Filters (Top Bar)
  filterBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      filterBtns.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      const r = btn.dataset.range;
      if (r === 'custom') return;
      applyQuickRange(r);
      refresh();
    });
  });

  // Set default range
  applyQuickRange('today');

  // 2. Export CSV Buttons
  exportCafeBtn.addEventListener('click', () => {
    if (!cafeOrders.length) return alert('No Café transactions to export.');
    download(`cafe-transactions-${new Date().toISOString().slice(0, 10)}.csv`, toCSV(cafeOrders));
  });

  exportSuppBtn.addEventListener('click', () => {
    if (!suppOrders.length) return alert('No Supplements transactions to export.');
    download(`supp-transactions-${new Date().toISOString().slice(0, 10)}.csv`, toCSV(suppOrders));
  });

  // 3. EXPENSE FORM SUBMIT (Manual Add)
  expenseForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const payload = {
      description: expDescEl.value.trim(),
      amount: parseFloat(expAmountEl.value),
      category: expCategoryEl.value || 'General',
    };
    if (!payload.description || isNaN(payload.amount)) return;

    const { error } = await supabaseClient.from('expenses').insert([payload]);
    if (error) {
      console.error(error);
      alert('Failed to add expense.');
      return;
    }
    // Clear and refresh
    expDescEl.value = '';
    expAmountEl.value = '';
    refresh();
  });

  // 4. RESTOCK FORM SUBMIT (Buying Goods + Auto Expense)
  // Replace the existing restockForm event listener
  restockForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const productId = restockProductSelect.value;
    const variantIdx = document.getElementById('restock-variant-select').value; // Get selected variant index
    const qty = parseInt(restockQtyEl.value);
    const cost = parseFloat(restockCostEl.value);

    if (!productId || !qty || !cost) {
      alert("Please fill all fields correctly.");
      return;
    }

    const product = supplementProductsById[productId];
    if (!product) return;

    const unitCost = cost / qty;
    let newTotalStock = (product.stock || 0) + qty;
    let newVariants = product.variants; // Get current variants array
    let itemNameForLog = product.name;

    // --- LOGIC: Handle Variant vs Standard ---
    if (newVariants && newVariants.length > 0) {
        if (variantIdx === "") {
            alert("Please select a variant option (e.g., Flavoured/Unflavoured).");
            return;
        }
        
        // 1. Update the specific variant
        const idx = parseInt(variantIdx);
        const targetVariant = newVariants[idx];
        
        targetVariant.stock = (parseInt(targetVariant.stock) || 0) + qty;
        targetVariant.buying_price = unitCost; // Update buying price for this variant
        
        // Update the name for the expense log
        itemNameForLog = `${product.name} (${targetVariant.name})`;

        // 2. Recalculate Total Stock (Sanity check)
        newTotalStock = newVariants.reduce((sum, v) => sum + (parseInt(v.stock) || 0), 0);
        
    } else {
        // Standard Product (No variants) update
        // (This logic stays the same as before, just included here for completeness)
    }

    if (!confirm(`Confirm Restock?\n\nItem: ${itemNameForLog}\nQty: +${qty}\nTotal Cost: ৳${cost}\n\nThis will add an Expense entry.`)) {
      return;
    }

    // A. Update Product (Variants JSON + Total Stock + Buying Price)
    // We update 'buying_price' column too as a fallback/average
    const { error: prodError } = await supabaseClient
      .from('supplement_products')
      .update({ 
          stock: newTotalStock, 
          buying_price: unitCost,
          variants: newVariants 
      })
      .eq('id', productId);

    if (prodError) {
      alert("Failed to update product stock.");
      console.error(prodError);
      return;
    }

    // B. Add Expense Record
    const { error: expError } = await supabaseClient
      .from('expenses')
      .insert([{
        description: `Restock: ${itemNameForLog}`,
        amount: cost,
        category: 'Supplement'
      }]);

    if (expError) {
      alert("Stock updated, but failed to log expense.");
    } else {
      alert("Stock updated and Expense logged successfully!");
      restockQtyEl.value = '';
      restockCostEl.value = '';
      document.getElementById('restock-variant-select').value = '';
      document.getElementById('restock-variant-select').classList.add('hidden');
      restockProductSelect.value = '';
      refresh();
    }
  });

  // 5. NEW: Listeners for Expense History Filters
  // Checks if elements exist to prevent errors
  if (expenseCatFilterEl && expenseSearchFilterEl) {
    expenseCatFilterEl.addEventListener('change', filterAndRenderExpenses);
    expenseSearchFilterEl.addEventListener('input', filterAndRenderExpenses);
  }

  // 6. Init External Libraries
  initDatePicker();
  setupTabs();
}

/* ---------------------- BOOTSTRAP ---------------------- */

document.addEventListener('DOMContentLoaded', () => {
  const user = requireAuth();
  if (!user) return;
  setupEvents();
  refresh();
  if (window.lucide) lucide.createIcons();
});