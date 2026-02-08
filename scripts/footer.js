const renderFooter = () => {
  const year = new Date().getFullYear();

  return `
<footer class="bg-slate-900 text-slate-400 py-12">
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <div class="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
      <div class="md:col-span-5 text-center md:text-left">
        <div class="flex items-center space-x-2 mb-4 md:justify-start justify-center">
          <div class="h-8 w-8 bg-yellow-500 rounded-lg shrink-0 flex items-center justify-center">
            <svg class="h-6 w-6 object-contain" xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 512 512"><path fill="#ffffff" d="M256 89.61L22.486 177.18L256 293.937l111.22-55.61l-104.337-31.9A16 16 0 0 1 256 208a16 16 0 0 1-16-16a16 16 0 0 1 16-16l-2.646 8.602l18.537 5.703a16 16 0 0 1 .008.056l27.354 8.365L455 246.645v12.146a16 16 0 0 0-7 13.21a16 16 0 0 0 7.293 13.406C448.01 312.932 448 375.383 448 400c16 10.395 16 10.775 32 0c0-24.614-.008-87.053-7.29-114.584A16 16 0 0 0 480 272a16 16 0 0 0-7-13.227v-25.42L413.676 215.1l75.838-37.92L256 89.61zM119.623 249L106.5 327.74c26.175 3.423 57.486 18.637 86.27 36.627c16.37 10.232 31.703 21.463 44.156 32.36c7.612 6.66 13.977 13.05 19.074 19.337c5.097-6.288 11.462-12.677 19.074-19.337c12.453-10.897 27.785-22.128 44.156-32.36c28.784-17.99 60.095-33.204 86.27-36.627L392.375 249h-6.25L256 314.063L125.873 249h-6.25z"/></svg>
          </div>
          <span class="text-xl font-bold text-white">e-Learning</span>
        </div>
        <p class="max-w-xs text-sm leading-relaxed mx-auto md:mx-0">
          Empowering individuals with institutional-grade cryptocurrency trading education and blockchain mastery.
        </p>
      </div>

      <div class="md:col-span-2 text-center md:text-left">
        <h3 class="text-white font-semibold mb-4">Platform</h3>
        <ul class="space-y-2 text-sm">
          <li><a href="#/" data-scroll="learning-tracks" class="hover:text-white transition-colors">Courses</a></li>
          <li><a href="#/instructors" class="hover:text-white transition-colors">Instructors</a></li>
          <li><a href="#/enterprise" class="hover:text-white transition-colors">Enterprise</a></li>
        </ul>
      </div>

      <div class="md:col-span-2 text-center md:text-left">
        <h3 class="text-white font-semibold mb-4">Support</h3>
        <ul class="space-y-2 text-sm">
          <li><a href="#/help" class="hover:text-white transition-colors">Help Center</a></li>
          <li><a href="#/terms" class="hover:text-white transition-colors">Terms of Service</a></li>
          <li><a href="#/privacy" class="hover:text-white transition-colors">Privacy Policy</a></li>
        </ul>
      </div>

      <!-- Stay Notified Card -->
      <div class="md:col-span-3">
        <div class="max-w-sm mx-auto md:ml-auto rounded-2xl border border-slate-700/60 bg-slate-800/40 p-6">
          <h3 class="text-white font-black text-sm tracking-widest uppercase mb-3 text-center md:text-left">STAY NOTIFIED</h3>
          <p class="text-slate-300 text-sm leading-relaxed mb-5 text-center md:text-left">
            Get notified about new courses, level updates, and exclusive early-bird discounts.
          </p>

          <form data-action="footer-subscribe-form" class="space-y-3">
            <input
              type="email"
              required
              autocomplete="email"
              placeholder="Enter your email"
              class="w-full px-5 py-4 rounded-2xl bg-slate-900/40 border border-slate-700/70 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-slate-600"
            />

            <button
              type="submit"
              class="w-full h-12 rounded-2xl bg-white text-slate-900 font-black text-sm tracking-widest uppercase hover:bg-slate-100 transition active:scale-[0.99]"
            >
              SUBSCRIBE NOW
            </button>

            <p data-role="footer-subscribe-msg" class="text-xs text-slate-400 text-center hidden"></p>
          </form>
        </div>
      </div>
    </div>

    <div class="mt-12 pt-8 border-t border-slate-800 text-center text-xs">
      © ${year} DEMO e-Learning. All rights reserved.
    </div>
  </div>
</footer>
`;
};

export default renderFooter;