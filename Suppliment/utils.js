// utils.js

// DOM helpers
export const $ = (sel, root = document) => root.querySelector(sel);
export const $all = (sel, root = document) => Array.from(root.querySelectorAll(sel));

// BDT currency formatter
export const fmtBDT = n => {
  if (n == null || isNaN(n)) return '৳0.00';
  return `৳${Number(n).toLocaleString('en-BD', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;
};

// USD currency formatter (alias)
export const fmtUSD = fmtBDT;

// Icon loader (Lucide)
export const icons = () => (
  window.lucide && window.lucide.createIcons && window.lucide.createIcons()
);
