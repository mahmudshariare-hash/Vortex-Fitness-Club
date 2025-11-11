// productDetail.js
import { state, emitRerender, setView } from "./state.js";
import { $, fmtBDT } from "./utils.js";

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

function getCartQty(productId) {
  const item = state.cart.find(i => String(i.id) === String(productId));
  return item ? Number(item.quantity) : 0;
}

function canAdd(product, wantQty) {
  const inCart = getCartQty(product.id);
  const maxAdd = Math.max(0, Number(product.stock) - inCart);
  return { allowed: Math.min(wantQty, maxAdd), maxAdd };
}

export function viewProductDetail() {
  const p = (state.products || []).find(
    x => String(x.id) === String(state.currentProductId)
  );

  if (!p) {
    return `<section class="max-w-6xl mx-auto px-4 pt-24 pb-20">
      <a href="#" class="text-sm opacity-70 hover:underline" id="pd-back">← Back to Products</a>
      <div class="mt-8 text-sm opacity-70">No product selected.</div>
    </section>`;
  }

  // suggestions: same category first; fallback to any others
  let suggestions = (state.products || [])
    .filter(x => String(x.id) !== String(p.id) && x.category === p.category);
  if (!suggestions.length) {
    suggestions = (state.products || []).filter(x => String(x.id) !== String(p.id));
  }
  suggestions = suggestions.slice(0, 8);

  const stockText = p.stock > 0 ? `In stock: ${p.stock}` : `Out of stock`;
  const outOfStock = Number(p.stock) <= 0;

  return `
  <section class="max-w-6xl mx-auto px-4 pt-24 pb-16" data-pid="${p.id}">
    <a href="#" class="text-sm opacity-70 hover:underline" id="pd-back">← Back to Products</a>

    <div class="grid md:grid-cols-2 gap-8 mt-6">
      <!-- Image -->
      <div class="rounded-xl bg-slate-800/40 border border-slate-600/40 p-4">
        <div class="aspect-square bg-slate-900/40 flex items-center justify-center rounded-lg overflow-hidden">
          <img class="max-h-[92%] object-contain" src="${p.image}" alt="${p.name}">
        </div>
      </div>

      <!-- Info -->
      <div>
        <div class="text-xs opacity-70 mb-1">${p.brand || "—"}</div>
        <h1 class="text-2xl md:text-3xl font-extrabold leading-tight">${p.name}</h1>

        <div class="mt-3 text-xl font-bold">${fmtBDT(p.price)}</div>
        <div id="pd-stockline" class="mt-1 text-xs ${outOfStock ? "text-rose-400" : "text-emerald-400"}">${stockText}</div>

        <div class="mt-6">
          <h2 class="font-semibold mb-2">Description</h2>
          <div class="text-sm opacity-85 whitespace-pre-line">
            ${p.description || "—"}
          </div>
        </div>

        <div class="mt-6 flex items-center gap-2">
          <button id="pd-qty-dec" class="px-3 py-1 rounded-md bg-slate-700/70 hover:bg-slate-600">−</button>
          <input id="pd-qty" class="w-14 text-center rounded-md bg-slate-800 border border-slate-600 p-1" type="number" min="1" step="1" value="${outOfStock ? 0 : 1}">
          <button id="pd-qty-inc" class="px-3 py-1 rounded-md bg-slate-700/70 hover:bg-slate-600">+</button>
        </div>

        <button id="pd-add" class="btn btn-lg btn-cart mt-4" ${outOfStock ? "disabled" : ""}>
          <span class="inline-block">🛒</span> <span class="ml-2">Add to Cart</span>
        </button>
        <div id="pd-help" class="mt-2 text-xs opacity-70"></div>
      </div>
    </div>

    <!-- Suggestions -->
    <div id="pd-suggest" class="mt-12">
      <h3 class="text-lg font-semibold mb-4">You may also like</h3>
      ${
        suggestions.length
          ? `<div class="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
              ${suggestions.map(s => {
                const sOOS = Number(s.stock) <= 0;
                return `
                <article class="rounded-xl bg-slate-800/40 border border-slate-600/40 hover:border-slate-500 transition p-3">
                  <a href="#" class="block view-suggest" data-id="${s.id}">
                    <div class="aspect-square bg-slate-900/40 rounded-lg flex items-center justify-center overflow-hidden ${sOOS ? 'opacity-60' : ''}">
                      <img src="${s.image}" alt="${s.name}" class="max-h-[90%] object-contain">
                    </div>
                    <div class="mt-3 text-xs opacity-70">${s.brand || "—"}</div>
                    <div class="font-semibold line-clamp-2">${s.name}</div>
                  </a>
                  <div class="mt-2 flex items-center justify-between">
                    <div class="text-sm font-bold">${fmtBDT(s.price)}</div>
                    <button class="btn btn-sm btn-cart sug-add" data-id="${s.id}" ${sOOS ? "disabled" : ""}>
                      Add to Cart
                    </button>
                  </div>
                  <div class="mt-1 text-[11px] ${sOOS ? 'text-rose-400' : 'text-emerald-400'}">${sOOS ? 'Out of stock' : `In stock: ${s.stock}`}</div>
                </article>`;
              }).join("")}
            </div>`
          : `<p class="text-sm opacity-70">No related products found.</p>`
      }
    </div>
  </section>`;
}

export function mountProductDetail(root) {
  const section = root.querySelector("section[data-pid]");
  const pid = section?.dataset?.pid;
  if (!pid) return;

  const product = state.products.find(x => String(x.id) === String(pid));
  if (!product) return;

  const qtyInput = $("#pd-qty");
  const addBtn = $("#pd-add");
  const help = $("#pd-help");
  const stockLine = $("#pd-stockline");

  function refreshAddState() {
    const inCart = getCartQty(product.id);
    const left = Math.max(0, Number(product.stock) - inCart);

    if (Number(product.stock) <= 0) {
      addBtn?.setAttribute("disabled", "true");
      qtyInput && (qtyInput.value = "0");
      help.textContent = "This product is currently out of stock.";
      stockLine.textContent = "Out of stock";
      stockLine.classList.remove("text-emerald-400");
      stockLine.classList.add("text-rose-400");
      return;
    }

    let q = parseInt(qtyInput?.value || "1", 10);
    q = isNaN(q) ? 1 : q;
    q = clamp(q, left === 0 ? 0 : 1, Math.max(1, left));
    if (qtyInput) qtyInput.value = String(q);

    addBtn?.toggleAttribute("disabled", left === 0);
    help.textContent = left === 0
      ? "You already have the maximum available quantity in your cart."
      : `You can add up to ${left} more.`;
    stockLine.textContent = `In stock: ${product.stock} (left to add: ${left})`;
    stockLine.classList.remove("text-rose-400");
    stockLine.classList.add("text-emerald-400");
  }

  $("#pd-back")?.addEventListener("click", (e) => {
    e.preventDefault();
    setView("catalog");
  });

  $("#pd-qty-inc")?.addEventListener("click", () => {
    let v = parseInt(qtyInput.value || "1", 10);
    if (isNaN(v)) v = 1;
    v += 1;
    qtyInput.value = String(v);
    refreshAddState();
  });
  $("#pd-qty-dec")?.addEventListener("click", () => {
    let v = parseInt(qtyInput.value || "1", 10);
    if (isNaN(v)) v = 1;
    v -= 1;
    qtyInput.value = String(v);
    refreshAddState();
  });
  qtyInput?.addEventListener("input", refreshAddState);
  qtyInput?.addEventListener("blur", refreshAddState);

  // ✅ Add to cart (main) — FIXED
  addBtn?.addEventListener("click", () => {
    const want = Math.max(1, parseInt(qtyInput.value || "1", 10));
    const { allowed, maxAdd } = canAdd(product, want);

    if (allowed <= 0) {
      alert("No more stock available to add.");
      refreshAddState();
      return;
    }

    const existing = state.cart.find(i => String(i.id) === String(product.id));
    if (existing) existing.quantity += allowed;
    else state.cart.push({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.image,
      stock: product.stock,
      quantity: allowed
    });

    if (allowed < want) {
      alert(`Only ${maxAdd} more could be added due to stock limits.`);
    }

    // 👇 FIX: open cart after adding
    state.isCartOpen = true;

    emitRerender();
    refreshAddState();
  });

  $("#pd-suggest")?.addEventListener("click", (e) => {
    const a = e.target.closest(".view-suggest");
    if (a) {
      e.preventDefault();
      state.currentProductId = String(a.dataset.id);
      setView("product-detail");
      return;
    }

    const btn = e.target.closest(".sug-add");
    if (btn) {
      const id = btn.dataset.id;
      const s = state.products.find(x => String(x.id) === String(id));
      if (!s) return;

      const { allowed } = canAdd(s, 1);
      if (allowed <= 0) {
        alert("No more stock available to add.");
        return;
      }

      const ex = state.cart.find(i => String(i.id) === String(s.id));
      if (ex) ex.quantity += 1;
      else state.cart.push({
        id: s.id, name: s.name, price: s.price, image: s.image, stock: s.stock, quantity: 1
      });

      emitRerender();
      if (String(s.id) === String(product.id)) {
        refreshAddState();
      }
    }
  });

  refreshAddState();
}
