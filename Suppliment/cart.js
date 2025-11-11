// cart.js
import { $, fmtBDT } from "./utils.js";
import { state, emitRerender } from "./state.js";

/* PUBLIC API */
export function renderCart() {
  const items = state.cart || [];
  const subtotal = items.reduce((s, it) => s + Number(it.price) * Number(it.quantity), 0);

  return `
  <aside id="cart-panel" class="cart-panel ${state.isCartOpen ? "open" : ""}" aria-label="Shopping Cart">
    <div class="cart-header">
      <h3>Shopping Cart</h3>
      <button id="cart-close" class="icon-btn" aria-label="Close cart">✕</button>
    </div>

    <div class="cart-body">
      ${items.length === 0 ? `
        <div class="cart-empty">Your cart is empty.</div>
      ` : `
        <div class="cart-items">
          ${items.map(it => cartItemRow(it)).join("")}
        </div>
      `}
    </div>

    <div class="cart-footer">
      <div class="cart-summary">
        <div class="row"><span>Subtotal (${items.length} ${items.length === 1 ? "item" : "items"})</span><strong>${fmtBDT(subtotal)}</strong></div>
        <div class="row"><span>Shipping</span><span>FREE</span></div>
      </div>
      <button id="cart-checkout" class="btn btn-primary" ${items.length ? "" : "disabled"}>Proceed to Checkout</button>
    </div>
  </aside>

  <div id="cart-backdrop" class="cart-backdrop ${state.isCartOpen ? "open" : ""}"></div>
  `;
}

export function mountCart(root) {
  // scope queries to the mount node so we always find the exact elements we rendered
  const panel = root.querySelector("#cart-panel");
  const backdrop = root.querySelector("#cart-backdrop");
  if (!panel || !backdrop) return;

  // close cart
  root.querySelector("#cart-close")?.addEventListener("click", () => {
    state.isCartOpen = false;
    emitRerender();
  });
  backdrop.addEventListener("click", () => {
    state.isCartOpen = false;
    emitRerender();
  });

  // item interactions (delegation) — delegate on the panel element
  panel.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-action]");
    if (!btn) return;

    const id = btn.dataset.id;
    const action = btn.dataset.action;
    const item = state.cart.find(x => String(x.id) === String(id));
    if (!item) return;

    if (action === "inc") {
      const maxQty = Number(item.stock ?? 0);
      if (item.quantity < maxQty) item.quantity += 1;
    }
    if (action === "dec") {
      if (item.quantity > 1) item.quantity -= 1;
    }
    if (action === "remove") {
      state.cart = state.cart.filter(x => String(x.id) !== String(id));
    }
    emitRerender();
  });

  // proceed to checkout — scope to root
  root.querySelector("#cart-checkout")?.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    document.dispatchEvent(new CustomEvent("cart:checkout"));
  });
}

/* helpers */
function cartItemRow(it) {
  const canDec = it.quantity > 1;
  const canInc = it.quantity < Number(it.stock ?? 0);

  return `
  <div class="cart-item" data-id="${it.id}">
    <img class="cart-thumb" src="${it.image}" alt="${it.name}">
    <div class="cart-meta">
      <div class="cart-name">${it.name}</div>
      <div class="cart-price">${fmtBDT(it.price)}</div>
      <div class="cart-qty">
        <button class="qty-btn" data-action="dec" data-id="${it.id}" ${!canDec ? "disabled" : ""}>−</button>
        <span class="qty-val">${it.quantity}</span>
        <button class="qty-btn" data-action="inc" data-id="${it.id}" ${!canInc ? "disabled" : ""}>+</button>
        <span class="qty-stock">${Number(it.stock ?? 0) - it.quantity} left</span>
      </div>
    </div>
    <button class="icon-btn danger" data-action="remove" data-id="${it.id}" aria-label="Remove">🗑</button>
  </div>`;
}
