import { cartTotals, setView, state, emitRerender } from "./state.js";
import { icons } from "./utils.js";

export function renderHeader() {
  const { count } = cartTotals();
  return `
  <header class="fixed top-0 left-0 right-0 z-50 transition-all duration-300 bg-gray-900/95 backdrop-blur-md">
    <div class="container mx-auto px-4 py-4">
      <div class="flex items-center justify-between">
        <div class="flex items-center space-x-2 cursor-pointer group" data-action="nav-home">
          <div class="w-8 h-8 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-lg flex items-center justify-center transform group-hover:scale-110 transition-transform duration-200">
            <span class="text-white font-bold text-lg">S</span>
          </div>
          <span class="text-xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
            SupplementStore
          </span>
        </div>

        <nav class="hidden md:flex items-center space-x-8">
          ${[["Home","home"],["Products","catalog"],["Quiz","quiz"]].map(([label, view]) => `
            <button data-action="nav-${view}" class="relative px-3 py-2 text-sm font-medium transition-colors duration-200 hover:text-cyan-400 ${state.currentView===view?"text-cyan-400":"text-white"}">
              ${label}
              ${state.currentView===view?'<div class="absolute -bottom-1 left-0 right-0 h-0.5 bg-gradient-to-r from-cyan-400 to-blue-500 animate-pulse"></div>':""}
            </button>
          `).join("")}
        </nav>

        <div class="flex items-center space-x-4">
          <button class="relative p-2 hover:text-cyan-400 transition-colors duration-200" data-action="toggle-cart">
            <i data-lucide="shopping-cart" class="w-5 h-5"></i>
            ${count>0?`<span class="absolute -top-1 -right-1 bg-gradient-to-r from-orange-400 to-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center animate-pulse">${count}</span>`:""}
          </button>
        </div>
      </div>
    </div>
  </header>`;
}

export function mountHeader(root) {
  root.addEventListener("click", (e) => {
    const el = e.target.closest("[data-action]");
    if (!el) return;
    const action = el.getAttribute("data-action");
    if (action === "toggle-cart") {
      state.isCartOpen = !state.isCartOpen;
      emitRerender();
    } else if (action === "nav-home") {
      setView("home");
    } else if (action.startsWith("nav-")) {
      setView(action.replace("nav-",""));
    }
  });
  icons();
}
