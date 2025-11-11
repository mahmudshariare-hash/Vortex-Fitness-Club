// catalog.js
import { state, emitRerender, setView } from "./state.js";
import { $, fmtBDT } from "./utils.js";

/* ---------- View ---------- */
export function viewCatalog() {
  const cnt = (state.products || []).length;
  return `
    <section class="max-w-6xl mx-auto px-4 pt-24 pb-12">
      <h1 class="text-3xl md:text-4xl font-extrabold mb-6">Product Catalog</h1>

      <p class="text-sm opacity-70 mb-4">Showing ${cnt} of ${cnt} products</p>

      <div id="catalog-grid" class="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        ${renderCards(state.products)}
      </div>
    </section>
  `;
}

/* ---------- Helpers ---------- */
function stockBadge(p) {
  if (!Number(p.stock) || p.stock <= 0) {
    return `<span class="badge-stock red">Out of stock</span>`;
  }
  if (p.stock <= 3) {
    return `<span class="badge-stock orange">Only ${p.stock} left!</span>`;
  }
  return `<span class="badge-stock green">${p.stock} in stock</span>`;
}

function renderCard(p) {
  const out = !Number(p.stock) || p.stock <= 0;
  return `
    <article class="product-card card-anim ${out ? "out-of-stock" : ""}" data-id="${p.id}">
      <div class="relative">
        <img src="${p.image}" alt="${p.name}" class="w-full h-56 object-contain rounded-t-lg">
        ${stockBadge(p)}
      </div>

      <div class="p-4">
        <div class="text-xs text-gray-400 mb-1">${p.brand || "—"}</div>

        <a href="#" class="product-title view-detail text-base font-semibold hover:underline" data-id="${p.id}">
          ${p.name}
        </a>

        <div class="mt-2 text-xs text-gray-400">${p.category}</div>

        <div class="mt-4 flex items-center justify-between">
          <div class="text-lg font-bold">${fmtBDT(p.price)}</div>
          ${
            out
              ? `<button class="btn-cart out" disabled>Out of Stock</button>`
              : `<button class="btn-cart add-cart" data-id="${p.id}">Add to Cart</button>`
          }
        </div>
      </div>
    </article>
  `;
}

function renderCards(items) {
  if (!items?.length) {
    return `<div class="col-span-full text-sm opacity-70">No products available.</div>`;
  }
  return items.map(renderCard).join("");
}

function animateGrid() {
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add("in");
          io.unobserve(e.target);
        }
      });
    },
    { threshold: 0.1 }
  );

  document.querySelectorAll(".card-anim").forEach((el) => io.observe(el));
}

/* ---------- Mount / Events ---------- */
export function mountCatalog(root) {
  const grid = $("#catalog-grid");
  if (!grid) return;

  // Animate on first mount
  animateGrid();

  // Single delegated listener: add-to-cart vs open details
  grid.addEventListener("click", (e) => {
    // Add to Cart
    const addBtn = e.target.closest(".add-cart");
    if (addBtn) {
      const id = addBtn.dataset.id;
      const prod = state.products.find((p) => String(p.id) === String(id));
      if (prod && prod.stock > 0) {
        const existing = state.cart.find((x) => String(x.id) === String(prod.id));
        if (existing) existing.quantity += 1;
        else
          state.cart.push({
            id: prod.id,
            name: prod.name,
            price: prod.price,
            stock: prod.stock,
            image: prod.image,
            quantity: 1,
          });
        emitRerender();
      }
      e.preventDefault();
      e.stopPropagation();
      return;
    }

    // Open product detail (card click excluding the button)
    const card = e.target.closest("[data-id]");
    if (card) {
      const pid = card.dataset.id;
      state.currentProductId = String(pid);
      setView("product-detail");
      e.preventDefault();
    }
  });
}
