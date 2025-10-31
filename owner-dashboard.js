// --- Supabase Client Setup ---
const SUPABASE_URL = 'https://ybrdqxetprlhscfuebyy.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlicmRxeGV0cHJsaHNjZnVlYnl5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE5MTg2NjksImV4cCI6MjA3NzQ5NDY2OX0.N7pxPNmi1ZowVd9Nik9KABhqTtp3NP-XlEcEiNlJ-8M';

const supabase = self.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// --- DOM Elements ---
const loading = document.getElementById('loading');
const analyticsContent = document.getElementById('analytics-content');
const noDataMsg = document.getElementById('no-data-msg');
const filterBtns = document.querySelectorAll('.filter-btn');
const totalRevenueEl = document.getElementById('total-revenue');
const totalOrdersEl = document.getElementById('total-orders');
const mostSoldList = document.getElementById('most-sold-list');
const leastSoldList = document.getElementById('least-sold-list');
const dateRangePickerEl = document.getElementById('date-range-picker');

// --- Date Picker Initialization ---
const datePicker = flatpickr(dateRangePickerEl, {
    mode: "range",
    dateFormat: "Y-m-d",
    onChange: function(selectedDates) {
        if (selectedDates.length === 2) {
            // Deactivate other filter buttons
            filterBtns.forEach(btn => btn.classList.remove('active'));
            fetchAndDisplayAnalytics(selectedDates[0], selectedDates[1]);
        }
    }
});

/**
 * Main function to fetch and process analytics data for a given date range.
 * @param {Date} startDate - The start of the date range.
 * @param {Date} endDate - The end of the date range (inclusive).
 */
async function fetchAndDisplayAnalytics(startDate, endDate) {
    loading.classList.remove('hidden');
    analyticsContent.classList.add('hidden');
    noDataMsg.classList.add('hidden');

    // Adjust endDate to include the entire day
    endDate.setHours(23, 59, 59, 999);

    try {
        // 1. Fetch completed orders within the date range
        const { data: orders, error: ordersError } = await supabase
            .from('orders')
            .select('id, total_amount')
            .eq('status', 'Delivery Complete')
            .gte('created_at', startDate.toISOString())
            .lte('created_at', endDate.toISOString());
        
        if (ordersError) throw ordersError;

        if (orders.length === 0) {
            noDataMsg.classList.remove('hidden');
            loading.classList.add('hidden');
            return;
        }

        // 2. Calculate summary stats
        const totalRevenue = orders.reduce((sum, order) => sum + order.total_amount, 0);
        const totalOrders = orders.length;

        totalRevenueEl.textContent = `৳${totalRevenue.toFixed(2)}`;
        totalOrdersEl.textContent = totalOrders;
        
        // 3. Fetch order items for the completed orders
        const orderIds = orders.map(order => order.id);
        const { data: items, error: itemsError } = await supabase
            .from('order_items')
            .select('item_name, quantity')
            .in('order_id', orderIds);

        if (itemsError) throw itemsError;

        // 4. Aggregate item sales
        const itemCounts = items.reduce((acc, item) => {
            acc[item.item_name] = (acc[item.item_name] || 0) + item.quantity;
            return acc;
        }, {});

        const sortedItems = Object.entries(itemCounts).sort((a, b) => b[1] - a[1]);

        // 5. Display most and least sold items
        renderSalesLists(sortedItems);

        // Show content
        analyticsContent.classList.remove('hidden');

    } catch (error) {
        console.error("Failed to fetch analytics:", error);
        noDataMsg.textContent = "Error loading data. Please try again.";
        noDataMsg.classList.remove('hidden');
    } finally {
        loading.classList.add('hidden');
    }
}

/**
 * Renders the lists of most and least sold items.
 * @param {Array} sortedItems - An array of [itemName, count] sorted by count descending.
 */
function renderSalesLists(sortedItems) {
    mostSoldList.innerHTML = '';
    leastSoldList.innerHTML = '';

    const mostSold = sortedItems.slice(0, 5); // Top 5
    const leastSold = sortedItems.slice(-5).reverse(); // Bottom 5

    mostSold.forEach(([name, count]) => {
        const li = document.createElement('li');
        li.innerHTML = `<span>${name}</span> <span>${count} sold</span>`;
        mostSoldList.appendChild(li);
    });

    leastSold.forEach(([name, count]) => {
        const li = document.createElement('li');
        li.innerHTML = `<span>${name}</span> <span>${count} sold</span>`;
        leastSoldList.appendChild(li);
    });
}

// --- Event Listeners for Filter Buttons ---
filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        // Update active button
        filterBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        datePicker.clear(); // Clear the date range picker

        const range = btn.dataset.range;
        const today = new Date();
        let startDate = new Date();
        
        if (range === 'today') {
            startDate.setHours(0, 0, 0, 0);
        } else if (range === 'week') {
            const dayOfWeek = today.getDay();
            startDate = new Date(today.setDate(today.getDate() - dayOfWeek));
            startDate.setHours(0, 0, 0, 0);
        } else if (range === 'month') {
            startDate = new Date(today.getFullYear(), today.getMonth(), 1);
            startDate.setHours(0, 0, 0, 0);
        }
        
        fetchAndDisplayAnalytics(startDate, new Date());
    });
});


// --- Initial Load ---
document.addEventListener('DOMContentLoaded', () => {
    // Load "Today's" data by default
    document.querySelector('.filter-btn[data-range="today"]').click();
    lucide.createIcons();
});