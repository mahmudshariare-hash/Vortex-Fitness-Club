// --- Configuration ---
const SUPABASE_URL = 'https://ovxxnsrqzdlyzdmubwaw.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im92eHhuc3JxemRseXpkbXVid2F3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM5NzY4MTgsImV4cCI6MjA3OTU1MjgxOH0.uwU9aQGbUO7OEv4HI8Rtq7awANWNubt3yJTSUMZRAJU';

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const state = {
    products: [],
    cart: JSON.parse(localStorage.getItem('vortex_cart')) || [],
    filters: {
        category: 'All',
        sort: 'default',
        availability: 'any'
    }
};

const app = {
    init: async () => {
        app.updateCartUI();
        await app.fetchProducts();
        app.renderShop(document.getElementById('app'));
    },

    fetchProducts: async () => {
        const { data, error } = await supabaseClient
            .from('supplement_products')
            .select('*');

        if (error) {
            console.error(error);
            document.getElementById('app').innerHTML = '<p style="text-align:center; padding:50px;">Failed to load products.</p>';
        } else {
            state.products = data;
        }
    },

    router: (view) => {
        if (view === 'home') app.renderShop(document.getElementById('app'));
    },

    renderShop: (container) => {
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
                </div>

                <div class="product-grid" id="shop-grid"></div>
            </div>
        `;
        app.renderGrid();
    },

    renderGrid: () => {
        const grid = document.getElementById('shop-grid');
        let filtered = [...state.products];
        
        // 1. FILTER BY CATEGORY
        if (state.filters.category !== 'All') {
            filtered = filtered.filter(p => p.category === state.filters.category);
        }

        // 2. FILTER BY AVAILABILITY (Using Database Stock)
        if (state.filters.availability === 'in-stock') {
            filtered = filtered.filter(p => p.stock > 0);
        } else if (state.filters.availability === 'out-of-stock') {
            filtered = filtered.filter(p => p.stock <= 0);
        }

        // 3. SORT BY PRICE
        if (state.filters.sort === 'low-high') {
            filtered.sort((a, b) => Number(a.price) - Number(b.price));
        } else if (state.filters.sort === 'high-low') {
            filtered.sort((a, b) => Number(b.price) - Number(a.price));
        }

        if (filtered.length === 0) {
            grid.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: #888; padding: 40px;">No products found matching your filters.</p>';
            return;
        }

        grid.innerHTML = filtered.map(p => {
            // Calculate REAL availability: (DB Stock - Qty In Cart)
            const qtyInCart = state.cart
                .filter(item => item.id === p.id)
                .reduce((sum, item) => sum + item.qty, 0);
            
            const realStock = p.stock - qtyInCart;
            const isOutOfStock = realStock <= 0;
            
            // Logic to show price range (From X)
            let priceDisplay = `৳${Number(p.price).toLocaleString()}`;
            if (p.variants && p.variants.length > 0) {
                const prices = p.variants.map(v => Number(v.price));
                const minP = Math.min(...prices);
                const maxP = Math.max(...prices);
                if (minP !== maxP) {
                    priceDisplay = `<span style="font-size:0.8em; color:#666;">From</span> ৳${minP.toLocaleString()}`;
                } else {
                    priceDisplay = `৳${minP.toLocaleString()}`;
                }
            }

            // NEW: Stock Display Badge
            const stockColor = realStock < 10 ? '#ef4444' : '#6b7280';
            const stockText = realStock > 0 ? `${realStock} left` : 'Out of Stock';
            
            return `
            <div class="product-card">
                ${isOutOfStock ? '<span class="badge out">Out of stock</span>' : ''}
                
                <div class="card-img-box" onclick="${isOutOfStock ? '' : `app.openProductModal('${p.id}')`}" style="cursor: pointer;">
                    <img src="${p.image_url || 'https://placehold.co/300'}" alt="${p.name}" style="${isOutOfStock ? 'opacity:0.5' : ''}">
                </div>
                
                <div>
                    <div class="brand-name">${p.brand || 'Vortex'}</div>
                    <div class="prod-title">${p.name}</div>
                    <div class="prod-cat">${p.category}</div>
                    <div style="font-size: 0.85rem; color: ${stockColor}; margin-top: 4px; font-weight: 500;">
                        ${stockText}
                    </div>
                </div>
                
                <div class="card-footer">
                    <div class="price">${priceDisplay}</div>
                    <button class="add-btn ${isOutOfStock ? 'disabled' : ''}" 
                        onclick="${isOutOfStock ? '' : `app.openProductModal('${p.id}')`}">
                        ${isOutOfStock ? 'Out of Stock' : (p.variants?.length ? 'Select Option' : 'Add to Cart')}
                    </button>
                </div>
            </div>
            `;
        }).join('');
    },

    updateFilters: (key, value) => {
        state.filters[key] = value;
        app.renderGrid();
    },

    setCategory: (cat) => {
        state.filters.category = cat;
        app.renderShop(document.getElementById('app')); 
    },

    openProductModal: (id) => {
        const product = state.products.find(p => p.id === id);
        if (!product) return;

        document.getElementById('pm-img').src = product.image_url || 'https://placehold.co/300';
        document.getElementById('pm-title').innerText = product.name;
        document.getElementById('pm-brand').innerText = product.brand || 'Vortex';
        document.getElementById('pm-cat').innerText = product.category;
        document.getElementById('pm-desc').innerText = product.description || 'No description available.';
        
        const priceEl = document.getElementById('pm-price');
        const actionArea = document.getElementById('pm-action-area');
        
        let selectedVariant = null;
        let currentPrice = Number(product.price);
        let currentStock = Number(product.stock);

        // Remove old dropdown
        const oldSel = document.getElementById('variant-select-container');
        if(oldSel) oldSel.remove();

        // --- HANDLE VARIANTS ---
        if (product.variants && product.variants.length > 0) {
            // Default to first variant
            selectedVariant = product.variants[0];
            currentPrice = Number(selectedVariant.price);
            currentStock = Number(selectedVariant.stock);

            // Create Dropdown
            const wrapper = document.createElement('div');
            wrapper.id = 'variant-select-container';
            wrapper.style.marginBottom = '20px';
            wrapper.style.marginTop = '10px';
            wrapper.innerHTML = `<label style="font-weight:bold; display:block; margin-bottom:8px; color:#374151;">Select Option:</label>`;
            
            const select = document.createElement('select');
            select.className = 'filter-select';
            select.style.width = '100%';

            product.variants.forEach((v, idx) => {
                const opt = document.createElement('option');
                opt.value = idx;

                // Calculate Cart Qty for this specific variant
                const variantCartId = `${product.id}-${v.name}`;
                const cartItem = state.cart.find(i => i.cartId === variantCartId);
                const inCartQty = cartItem ? cartItem.qty : 0;
                const available = Number(v.stock) - inCartQty;

                // NEW: Show exact stock count in dropdown
                const stockMsg = available > 0 ? `${available} left` : 'Out of Stock';
                opt.text = `${v.name} - ৳${v.price} (${stockMsg})`;
                
                if(available <= 0) opt.disabled = true;
                select.appendChild(opt);
            });

            select.onchange = (e) => {
                const idx = e.target.value;
                selectedVariant = product.variants[idx];
                currentPrice = Number(selectedVariant.price);
                currentStock = Number(selectedVariant.stock);
                priceEl.innerText = '৳' + currentPrice.toLocaleString();
                updateButton();
            };

            wrapper.appendChild(select);
            const footer = document.querySelector('.pm-footer');
            footer.parentNode.insertBefore(wrapper, footer);
            
            // Auto-select first available option
            if (select.options[0].disabled) {
                 for (let i = 0; i < select.options.length; i++) {
                     if (!select.options[i].disabled) {
                         select.selectedIndex = i;
                         select.dispatchEvent(new Event('change'));
                         break;
                     }
                 }
            }
        }

        priceEl.innerText = '৳' + currentPrice.toLocaleString();

        const updateButton = () => {
            // Calculate Available Stock taking Cart into account
            let variantName = selectedVariant ? selectedVariant.name : '';
            const cartItemId = variantName ? `${product.id}-${variantName}` : product.id;
            const existing = state.cart.find(i => i.cartId === cartItemId);
            const inCart = existing ? existing.qty : 0;
            
            const available = currentStock - inCart;

             if (available <= 0) {
                actionArea.innerHTML = `<button class="btn btn-secondary" style="width:100%" disabled>Out of Stock (In Cart)</button>`;
            } else {
                actionArea.innerHTML = `<button class="btn btn-primary" style="width:100%" onclick="app.addToCart('${product.id}', '${variantName}', ${currentPrice})">Add to Cart</button>`;
            }
        };
        
        updateButton();
        document.getElementById('product-modal').classList.remove('hidden');
    },

    closeProductModal: () => {
        document.getElementById('product-modal').classList.add('hidden');
    },

    toggleCart: () => {
        document.getElementById('cart-sidebar').classList.toggle('active');
        document.getElementById('overlay').classList.toggle('active');
    },

    addToCart: (productId, variantName, variantPrice) => {
        const product = state.products.find(p => p.id === productId);
        if(!product) return;

        const cartItemId = variantName ? `${productId}-${variantName}` : productId;
        const existing = state.cart.find(i => i.cartId === cartItemId);
        
        // Find DB Stock for this variant/product
        let dbStock = Number(product.stock);
        if(variantName && product.variants) {
            const v = product.variants.find(v => v.name === variantName);
            if(v) dbStock = Number(v.stock);
        }

        const currentQtyInCart = existing ? existing.qty : 0;
        
        // Validation
        if (currentQtyInCart + 1 > dbStock) {
            alert(`Sorry, we only have ${dbStock} units available!`);
            return; 
        }

        if (existing) {
            existing.qty += 1;
        } else {
            state.cart.push({ 
                cartId: cartItemId, 
                id: product.id, 
                name: product.name + (variantName ? ` (${variantName})` : ''),
                price: Number(variantPrice),
                image_url: product.image_url,
                qty: 1,
                variantName: variantName
            });
        }
        
        app.saveCart();
        app.showToast();
        app.closeProductModal();
        app.renderGrid();
    },

    removeFromCart: (cartId) => {
        const itemIndex = state.cart.findIndex(i => i.cartId === cartId); 
        if(itemIndex > -1) {
            state.cart.splice(itemIndex, 1);
            app.saveCart();
            app.renderGrid(); 
        }
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
                <button onclick="app.removeFromCart('${item.cartId}')" 
                    style="background: #fee2e2; border: none; color: #dc2626; cursor: pointer; width: 40px; height: 40px; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 1.4rem; transition: 0.2s;">
                    <i class="ph ph-trash"></i>
                </button>
            </div>
        `).join('');
    },

    showToast: () => {
        const t = document.getElementById('toast');
        t.classList.remove('hidden');
        setTimeout(() => t.classList.add('hidden'), 2000);
    },

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
        btn.disabled = true; 
        btn.innerText = 'Processing...';

        const form = {
            name: document.getElementById('cust-name').value,
            phone: document.getElementById('cust-phone').value,
            notes: document.getElementById('cust-notes').value,
            total: state.cart.reduce((sum, item) => sum + (item.price * item.qty), 0)
        };

        try {
            // 1. Create Order
            const { data: order, error: orderErr } = await supabaseClient
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

            // 2. Add Items
            const items = state.cart.map(item => ({
                order_id: order.id,
                supplement_product_id: item.id,
                quantity: item.qty,
                price_at_order: item.price,
                item_name: item.name
            }));
            const { error: itemsErr } = await supabaseClient.from('supplement_order_items').insert(items);
            if (itemsErr) throw itemsErr;

            // 3. DEDUCT STOCK
            for (const item of state.cart) {
                const { data: currentProd } = await supabaseClient
                    .from('supplement_products')
                    .select('*')
                    .eq('id', item.id)
                    .single();
                
                if (!currentProd) continue;

                if (item.variantName && currentProd.variants) {
                    const updatedVariants = currentProd.variants.map(v => {
                        if (v.name === item.variantName) {
                            return { ...v, stock: Number(v.stock) - item.qty };
                        }
                        return v;
                    });
                    const newTotal = updatedVariants.reduce((sum, v) => sum + Number(v.stock), 0);

                    await supabaseClient
                        .from('supplement_products')
                        .update({ stock: newTotal, variants: updatedVariants })
                        .eq('id', item.id);
                } else {
                    await supabaseClient
                        .from('supplement_products')
                        .update({ stock: Number(currentProd.stock) - item.qty })
                        .eq('id', item.id);
                }
            }

            alert('Order Placed Successfully!');
            state.cart = [];
            app.saveCart();
            app.closeModal();
            await app.fetchProducts();
            app.renderShop(document.getElementById('app'));

        } catch (err) {
            console.error(err);
            alert('Error placing order.');
        } finally {
            btn.innerText = 'Place Order';
            btn.disabled = false;
        }
    }
};

document.addEventListener('DOMContentLoaded', app.init);
document.getElementById('checkout-form').addEventListener('submit', app.submitOrder);