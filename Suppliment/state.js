// state.js
import { fmtBDT as formatCurrency } from "./utils.js";

export const state = {
  currentView: "home",
  selectedProduct: null,
  cart: [],
  isCartOpen: false,
  products: [],
};

export function setProducts(list) {
  state.products = list;
  window.dispatchEvent(new CustomEvent("app:rerender"));
}

export const emitRerender = () =>
  window.dispatchEvent(new CustomEvent("app:rerender"));

export function cartTotals() {
  const subtotal = state.cart.reduce((s, it) => s + it.price * it.quantity, 0);
  const shipping = subtotal > 50 ? 0 : 9.99;
  const total = subtotal + shipping;
  const count = state.cart.reduce((s, it) => s + it.quantity, 0);
  return { subtotal, shipping, total, count, formatCurrency };
}

export function setView(view, payload = null) {
  state.currentView = view;
  if (view === "product-detail") state.selectedProduct = payload;
  emitRerender();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

export function setCartOpen(v) {
  state.isCartOpen = !!v;
  emitRerender();
}

/**
 * Adds to cart, preserving stock and clamping quantity.
 * product must include: { id, name, price, image, stock? }
 */
export function addToCart(product, qty = 1) {
  const max = typeof product.stock === "number" ? product.stock : Infinity;
  const existing = state.cart.find((it) => it.id === product.id);

  if (existing) {
    existing.quantity = Math.min(existing.quantity + qty, max);
    // keep the latest stock value if provided
    if (typeof product.stock === "number") existing.stock = product.stock;
  } else {
    state.cart.push({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.image,
      stock: typeof product.stock === "number" ? product.stock : undefined,
      quantity: Math.min(qty, max < 1 ? 1 : qty),
    });
  }
  state.isCartOpen = true;
  emitRerender();
}

export function incCartQty(id) {
  const it = state.cart.find((x) => x.id === id);
  if (!it) return;
  const max = typeof it.stock === "number" ? it.stock : Infinity;
  it.quantity = Math.min(it.quantity + 1, max);
  emitRerender();
}

export function decCartQty(id) {
  const it = state.cart.find((x) => x.id === id);
  if (!it) return;
  it.quantity = Math.max(1, it.quantity - 1);
  emitRerender();
}

export function removeCartItem(id) {
  state.cart = state.cart.filter((it) => it.id !== id);
  emitRerender();
}
