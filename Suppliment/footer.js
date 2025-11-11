import { icons } from "./utils.js";
export function renderFooter() {
  const year = new Date().getFullYear();
  return `
  <footer class="bg-gray-900 border-t border-gray-800">
    <div class="border-b border-gray-800">
      <div class="container mx-auto px-4 py-12 text-center">
        <h3 class="text-3xl font-bold text-white mb-4">Stay Updated with the Latest in Fitness</h3>
        <p class="text-gray-300 mb-8">Get exclusive offers, new product launches, and expert fitness tips.</p>
        <div class="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
          <input type="email" placeholder="Enter your email address" class="flex-1 px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 transition-all duration-200" />
          <button class="bg-gradient-to-r from-cyan-400 to-blue-500 text-white px-6 py-3 rounded-lg font-semibold hover:from-cyan-500 hover:to-blue-600 transition-all duration-200">Subscribe</button>
        </div>
      </div>
    </div>

    <div class="container mx-auto px-4 py-10 border-t border-gray-800/50">
      <div class="flex flex-col lg:flex-row justify-between items-center space-y-4 lg:space-y-0">
        <div class="text-gray-400 text-sm">© ${year} SupplementStore. All rights reserved.</div>
        <div class="flex items-center space-x-4 text-gray-400">
          <a class="hover:text-cyan-400" href="#">Privacy</a>
          <a class="hover:text-cyan-400" href="#">Terms</a>
          <a class="hover:text-cyan-400" href="#">Cookies</a>
        </div>
      </div>
    </div>
  </footer>`;
}
export function mountFooter() { icons(); }
