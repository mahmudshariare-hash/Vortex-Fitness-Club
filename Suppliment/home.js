import { ALL_PRODUCTS } from "./data.js";
import { $, icons } from "./utils.js";
import { addToCart, setView } from "./state.js";
import { mountQuiz, viewQuizWrapper } from "./quiz.js";

function categoriesSection() {
  const cats = [
    { id:"protein", name:"Protein", description:"Build lean muscle mass", color:"from-blue-400 to-blue-600", count: 2 },
    { id:"pre-workout", name:"Pre-Workout", description:"Energy & focus boosters", color:"from-orange-400 to-red-500", count: 1 },
    { id:"vitamins", name:"Vitamins", description:"Essential nutrients", color:"from-green-400 to-green-600", count: 1 },
    { id:"weight-loss", name:"Fat Burners", description:"Weight management", color:"from-red-400 to-red-600", count: 1 },
    { id:"recovery", name:"Recovery", description:"Electrolytes & repair", color:"from-pink-400 to-pink-600", count: 1 },
    { id:"muscle-building", name:"Creatine", description:"Strength & power", color:"from-cyan-400 to-cyan-600", count: 1 },
  ];
  return `
  <section class="py-20 bg-gray-800/50">
    <div class="container mx-auto px-4">
      <div class="text-center mb-16">
        <h2 class="text-4xl md:text-5xl font-bold mb-6">
          <span class="text-white">Shop by </span>
          <span class="bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">Category</span>
        </h2>
        <p class="text-xl text-gray-300 max-w-3xl mx-auto">Find the perfect supplements for your fitness goals and lifestyle</p>
      </div>
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        ${cats.map((c, i)=>`
          <div class="group relative p-8 rounded-2xl border border-gray-700/50 bg-white/5 hover:bg-white/10 backdrop-blur-sm cursor-pointer transform transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-white/5 animate-fade-in-up"
               style="animation-delay:${i*100}ms" data-action="category-${c.id}">
            <div class="relative z-10">
              <div class="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br ${c.color} mb-6 transform group-hover:scale-110 group-hover:rotate-6 transition-all duration-300"></div>
              <div class="mb-4">
                <div class="flex items-center justify-between mb-2">
                  <h3 class="text-2xl font-bold text-white group-hover:text-cyan-400 transition-colors duration-200">${c.name}</h3>
                  <span class="text-sm text-gray-400 bg-gray-700/50 px-3 py-1 rounded-full">${c.count} items</span>
                </div>
                <p class="text-gray-300 group-hover:text-white transition-colors duration-200">${c.description}</p>
              </div>
              <div class="transform transition-all duration-300 opacity-80 group-hover:translate-x-2">
                <span class="text-cyan-400 font-medium text-sm">Explore Products →</span>
              </div>
            </div>
            <div class="absolute inset-0 rounded-2xl border border-gradient-animated opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          </div>
        `).join("")}
      </div>
      <div class="text-center mt-12">
        <button data-action="view-all" class="group inline-flex items-center space-x-2 bg-gradient-to-r from-cyan-400 to-blue-500 text-white px-8 py-4 rounded-lg font-semibold text-lg hover:from-cyan-500 hover:to-blue-600 transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-cyan-400/25">
          <span>View All Products</span><span>→</span>
        </button>
      </div>
    </div>
  </section>`;
}

function showcaseSection() {
  const items = ALL_PRODUCTS.slice(0,6);
  return `
  <section class="py-20 bg-gray-900">
    <div class="container mx-auto px-4">
      <div class="text-center mb-16">
        <h2 class="text-4xl md:text-5xl font-bold mb-6">
          <span class="text-white">Featured </span>
          <span class="bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">Products</span>
        </h2>
        <p class="text-xl text-gray-300 max-w-3xl mx-auto">Discover our top-rated supplements trusted by thousands</p>
      </div>
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        ${items.map((p, idx)=>`
          <div class="group relative bg-gray-800/50 rounded-2xl border border-gray-700/50 overflow-hidden cursor-pointer transform transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl hover:shadow-cyan-400/10 animate-fade-in-up" style="animation-delay:${idx*150}ms" data-action="open-product" data-id="${p.id}">
            <div class="relative aspect-square overflow-hidden">
              <img src="${p.image}" alt="${p.name}" class="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-500" />
              <div class="absolute top-4 left-4 flex flex-col space-y-2">
                ${p.isNew?`<span class="bg-gradient-to-r from-green-400 to-green-600 text-white text-xs font-bold px-3 py-1 rounded-full animate-pulse">NEW</span>`:""}
                ${p.isBestseller?`<span class="bg-gradient-to-r from-orange-400 to-red-500 text-white text-xs font-bold px-3 py-1 rounded-full">BESTSELLER</span>`:""}
                ${p.originalPrice?`<span class="bg-gradient-to-r from-red-500 to-pink-600 text-white text-xs font-bold px-3 py-1 rounded-full">SALE</span>`:""}
              </div>
              ${p.stock<=10?`<div class="absolute top-4 right-4"><div class="bg-red-500/90 backdrop-blur-sm text-white text-xs font-bold px-3 py-1 rounded-full animate-pulse">Only ${p.stock} left!</div></div>`:""}
              <div class="absolute inset-0 bg-black/50 flex items-center justify-center space-x-4 opacity-0 group-hover:opacity-100 transition-all duration-300">
                <button class="bg-white/20 backdrop-blur-sm text-white p-3 rounded-full hover:bg-cyan-400 transition-colors duration-200 transform hover:scale-110" data-action="open-product" data-id="${p.id}"><i data-lucide="eye" class="w-5 h-5"></i></button>
                <button class="bg-gradient-to-r from-cyan-400 to-blue-500 text-white p-3 rounded-full hover:from-cyan-500 hover:to-blue-600 transition-all duration-200 transform hover:scale-110 shadow-lg" data-action="add-to-cart" data-id="${p.id}"><i data-lucide="shopping-cart" class="w-5 h-5"></i></button>
              </div>
            </div>
            <div class="p-6">
              <div class="flex items-center justify-between mb-2">
                <span class="text-cyan-400 text-sm font-medium">${p.brand}</span>
                <span class="text-gray-400 text-xs bg-gray-700 px-2 py-1 rounded-full">${p.category}</span>
              </div>
              <h3 class="text-white text-lg font-bold mb-3 group-hover:text-cyan-400 transition-colors duration-200">${p.name}</h3>
              <div class="flex items-center justify-between">
                <div class="flex items-center space-x-2">
                  <span class="text-white text-xl font-bold">$${p.price.toFixed(2)}</span>
                  ${p.originalPrice?`<span class="text-gray-500 text-sm line-through">$${p.originalPrice.toFixed(2)}</span>`:""}
                </div>
                <button class="bg-gradient-to-r from-cyan-400 to-blue-500 text-white px-4 py-2 rounded-lg font-medium text-sm hover:from-cyan-500 hover:to-blue-600 transform hover:scale-105 transition-all duration-200 shadow-lg" data-action="add-to-cart" data-id="${p.id}">Add to Cart</button>
              </div>
            </div>
          </div>
        `).join("")}
      </div>
      <div class="text-center mt-12">
        <button data-action="go-catalog" class="group inline-flex items-center space-x-2 border-2 border-cyan-400 text-cyan-400 px-8 py-4 rounded-lg font-semibold text-lg hover:bg-cyan-400 hover:text-white transition-all duration-200">
          <span>View All Products</span><span>→</span>
        </button>
      </div>
    </div>
  </section>`;
}

export function viewHome() {
  return categoriesSection() + showcaseSection() + viewQuizWrapper();
}

export function mountHome(root) {
  root.addEventListener("click", (e)=>{
    const el = e.target.closest("[data-action]");
    if (!el) return;
    const act = el.getAttribute("data-action");
    if (act==="view-all" || act==="go-catalog") return setView("catalog");
    if (act && act.startsWith("category-")) {
      const cat = act.replace("category-","");
      setView("catalog");
      // category select happens after catalog renders (handled in main)
    }
  });

  root.addEventListener("click", (e)=>{
    const el = e.target.closest("[data-action]");
    if (!el) return;
    const act = el.getAttribute("data-action");
    const id = parseInt(el.getAttribute("data-id")||"0",10);
    if (act==="open-product" && id) {
      const prod = ALL_PRODUCTS.find(p=>p.id===id);
      setView("product-detail", prod);
    }
    if (act==="add-to-cart" && id) {
      const prod = ALL_PRODUCTS.find(p=>p.id===id);
      addToCart(prod);
    }
  });

  mountQuiz(root);
  icons();
}
