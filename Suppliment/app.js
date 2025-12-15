// --- Configuration ---
const SUPABASE_URL = 'https://ovxxnsrqzdlyzdmubwaw.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im92eHhuc3JxemRseXpkbXVid2F3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM5NzY4MTgsImV4cCI6MjA3OTU1MjgxOH0.uwU9aQGbUO7OEv4HI8Rtq7awANWNubt3yJTSUMZRAJU';

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const state = {
    products: [],
    cart: JSON.parse(localStorage.getItem('vortex_cart')) || [],
    filters: {
        category: 'All',
        sort: 'default', // default, low-high, high-low
        availability: 'any' // any, in-stock, out-of-stock
    }
};

const app = {
    init: async () => {
        app.updateCartUI();
        await app.fetchProducts();
        app.renderShop(document.getElementById('app'));
    },

    fetchProducts: async () => {
        // Fetch all products, we handle availability filtering in JS
        const { data, error } = await supabase
            .from('supplement_products')
            .select('*');

        if (error) {
            console.error(error);
            document.getElementById('app').innerHTML = '<p style="text-align:center; padding:50px;">Failed to load products.</p>';
        } else {
            state.products = data;
        }
    },

    // Router handles just the main view for now
    router: (view) => {
        if (view === 'home') app.renderShop(document.getElementById('app'));
    },

    // --- RENDER LOGIC ---

    renderShop: (container) => {
        // Unique Categories
        const categories = ['All', ...new Set(state.products.map(p => p.category))];

        container.innerHTML = `
            <div class="container">
                <div class="filter-container">
                    <div class="filter-row">
                        <div class="filter-group">
                            <label>Sort by Price</label>
                            <select class="filter-select" onchange="app.updateFilters('sort', this.value)">
                                <option value="default">Default</option>
                                <option value="low-high">Low to High</option>
                                <option value="high-low">High to Low</option>
                            </select>
                        </div>
                        <div class="filter-group">
                            <label>Availability</label>
                            <select class="filter-select" onchange="app.updateFilters('availability', this.value)">
                                <option value="any">Any</option>
                                <option value="in-stock">In Stock</option>
                                <option value="out-of-stock">Out of Stock</option>
                            </select>
                        </div>
                    </div>
                    
                    <div class="filter-group">
                        <label>Categories</label>
                        <div class="category-scroll">
                            ${categories.map(cat => `
                                <button class="cat-pill ${state.filters.category === cat ? 'active' : ''}" 
                                    onclick="app.setCategory('${cat}')">
                                    ${cat}
                                </button>
                            `).join('')}
                        </div>
                    </div>
                </div>

                <div class="product-grid" id="shop-grid"></div>
            </div>
        `;
        app.renderGrid();
    },

    renderGrid: () => {
        const grid = document.getElementById('shop-grid');
        let filtered = [...state.products];

        // 1. Filter by Category
        if (state.filters.category !== 'All') {
            filtered = filtered.filter(p => p.category === state.filters.category);
        }

        // 2. Filter by Availability
        if (state.filters.availability === 'in-stock') {
            filtered = filtered.filter(p => p.stock > 0);
        } else if (state.filters.availability === 'out-of-stock') {
            filtered = filtered.filter(p => p.stock <= 0);
        }

        // 3. Sort
        if (state.filters.sort === 'low-high') {
            filtered.sort((a, b) => a.price - b.price);
        } else if (state.filters.sort === 'high-low') {
            filtered.sort((a, b) => b.price - a.price);
        }

        // Render Cards
        grid.innerHTML = filtered.map(p => {
            const isOutOfStock = p.stock <= 0;
            const isLowStock = p.stock === 1;
            
            return `
            <div class="product-card">
                ${isOutOfStock ? '<span class="badge out">Out of stock</span>' : ''}
                ${!isOutOfStock && isLowStock ? '<span class="badge low">Only 1 left!</span>' : ''}
                
                <div class="card-img-box" onclick="app.openProductModal('${p.id}')" style="cursor: pointer;">
                    <img src="${p.image_url || 'https://placehold.co/300x300/png?text=' + p.name}" alt="${p.name}">
                </div>
                
                <div>
                    <div class="brand-name">${p.brand || 'Vortex'}</div>
                    <div class="prod-title">${p.name}</div>
                    <div class="prod-cat">${p.category}</div>
                </div>
                
                <div class="card-footer">
                    <div class="price">৳${Number(p.price).toLocaleString()}</div>
                    <button class="add-btn ${isOutOfStock ? 'disabled' : ''}" 
                        onclick="${isOutOfStock ? '' : `app.addToCart('${p.id}')`}">
                        ${isOutOfStock ? 'Out of Stock' : 'Add to Cart'}
                    </button>
                </div>
            </div>
            `;
        }).join('');
    },

    // --- ACTION HANDLERS ---

    updateFilters: (key, value) => {
        state.filters[key] = value;
        app.renderGrid();
    },

    setCategory: (cat) => {
        state.filters.category = cat;
        // Re-render whole shop to update Pill active states
        app.renderShop(document.getElementById('app')); 
    },

    // --- PRODUCT MODAL ---

    openProductModal: (id) => {
        const product = state.products.find(p => p.id === id);
        if (!product) return;

        // 1. Populate Data
        document.getElementById('pm-img').src = product.image_url || 'https://placehold.co/300';
        document.getElementById('pm-title').innerText = product.name;
        document.getElementById('pm-brand').innerText = product.brand || 'Vortex';
        document.getElementById('pm-cat').innerText = product.category;
        document.getElementById('pm-desc').innerText = product.description || 'No description available for this product.';
        document.getElementById('pm-price').innerText = '৳' + Number(product.price).toLocaleString();

        // 2. Handle Add to Cart Button Logic (Stock check)
        const actionArea = document.getElementById('pm-action-area');
        const isOutOfStock = product.stock <= 0;

        if (isOutOfStock) {
            actionArea.innerHTML = `<button class="btn btn-secondary" disabled>Out of Stock</button>`;
        } else {
            // We use a wrapper function in onclick to pass the ID correctly
            actionArea.innerHTML = `<button class="btn btn-primary" onclick="app.addToCart('${product.id}'); app.closeProductModal();">Add to Cart</button>`;
        }

        // 3. Show Modal
        document.getElementById('product-modal').classList.remove('hidden');
    },

    closeProductModal: () => {
        document.getElementById('product-modal').classList.add('hidden');
    },

    // --- CART & DB LOGIC ---

    toggleCart: () => {
        document.getElementById('cart-sidebar').classList.toggle('active');
        document.getElementById('overlay').classList.toggle('active');
    },

  addToCart: (productId) => {
        const product = state.products.find(p => p.id === productId);
        const existing = state.cart.find(i => i.id === productId);
        
        // --- NEW VALIDATION ---
        const currentQtyInCart = existing ? existing.qty : 0;
        
        if (currentQtyInCart + 1 > product.stock) {
            alert(`Sorry, we only have ${product.stock} of these in stock!`);
            return; 
        }
        // ----------------------

        if (existing) {
            existing.qty += 1;
        } else {
            // Store the CURRENT stock in the cart item to help with calculations later
            state.cart.push({ ...product, qty: 1 });
        }
        app.saveCart();
        app.showToast();
    },

    removeFromCart: (id) => {
        state.cart = state.cart.filter(i => i.id !== id);
        app.saveCart();
    },

    saveCart: () => {
        localStorage.setItem('vortex_cart', JSON.stringify(state.cart));
        app.updateCartUI();
    },

    updateCartUI: () => {
        const container = document.getElementById('cart-items');
        document.getElementById('cart-count').innerText = state.cart.reduce((s, i) => s + i.qty, 0);
        const total = state.cart.reduce((s, i) => s + (i.price * i.qty), 0);
        document.getElementById('cart-total-price').innerText = '৳' + total.toLocaleString();

        if (state.cart.length === 0) {
            container.innerHTML = '<p style="text-align:center; color:#888; margin-top:20px;">Cart is empty</p>';
            return;
        }

        container.innerHTML = state.cart.map(item => `
            <div class="cart-item">
                <img src="${item.image_url || 'https://placehold.co/100'}" alt="img">
                <div style="flex:1;">
                    <div style="font-weight:bold; font-size:0.9rem;">${item.name}</div>
                    <div style="color:var(--primary); font-weight:bold;">৳${item.price} x ${item.qty}</div>
                </div>
                <button onclick="app.removeFromCart('${item.id}')" style="background:none; border:none; color:red; cursor:pointer;"><i class="ph ph-trash"></i></button>
            </div>
        `).join('');
    },

    showToast: () => {
        const t = document.getElementById('toast');
        t.classList.remove('hidden');
        setTimeout(() => t.classList.add('hidden'), 2000);
    },

    // --- CHECKOUT (DB WRITE) ---

    checkoutModal: () => {
        if (state.cart.length === 0) return alert("Your cart is empty.");
        document.getElementById('checkout-modal').classList.remove('hidden');
        app.toggleCart();
    },

    closeModal: () => {
        document.getElementById('checkout-modal').classList.add('hidden');
    },

    submitOrder: async (e) => {
        e.preventDefault();
        const btn = e.target.querySelector('button[type="submit"]');
        btn.innerText = 'Processing...';
        btn.disabled = true;

        const form = {
            name: document.getElementById('cust-name').value,
            phone: document.getElementById('cust-phone').value,
            notes: document.getElementById('cust-notes').value,
            total: state.cart.reduce((sum, item) => sum + (item.price * item.qty), 0)
        };

        try {
            // 1. Create Order
            const { data: order, error: orderErr } = await supabase
                .from('supplement_orders')
                .insert([{
                    customer_name: form.name,
                    customer_phone: form.phone,
                    total_amount: form.total,
                    notes: form.notes,
                    status: 'Pending'
                }])
                .select()
                .single();

            if (orderErr) throw orderErr;

            // 2. Create Order Items
            const items = state.cart.map(item => ({
                order_id: order.id,
                supplement_product_id: item.id,
                quantity: item.qty,
                price_at_order: item.price,
                item_name: item.name
            }));

            const { error: itemsErr } = await supabase
                .from('supplement_order_items')
                .insert(items);

            if (itemsErr) throw itemsErr;

            // --- NEW STEP 3: UPDATE INVENTORY ---
            // Decrement stock for each item bought
            for (const item of state.cart) {
                const newStock = item.stock - item.qty;
                const { error: stockErr } = await supabase
                    .from('supplement_products')
                    .update({ stock: newStock })
                    .eq('id', item.id);
                
                if (stockErr) console.error('Error updating stock for:', item.name, stockErr);
            }
            // ------------------------------------

            // Success
            alert('Order Placed Successfully!');
            state.cart = [];
            app.saveCart();
            app.closeModal();
            
            // Refresh products to show new stock levels immediately
            await app.fetchProducts();
            app.renderShop(document.getElementById('app'));

        } catch (err) {
            console.error('Checkout Error:', err);
            alert('There was an error placing your order. Please try again.');
        } finally {
            btn.innerText = 'Place Order';
            btn.disabled = false;
        }
    }
};

document.addEventListener('DOMContentLoaded', app.init);
document.getElementById('checkout-form').addEventListener('submit', app.submitOrder);