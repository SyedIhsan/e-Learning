const renderFooter = () => {
  const year = new Date().getFullYear();

  return `
<footer class="bg-slate-900 text-slate-400 py-12">
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <div class="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
      <div class="md:col-span-5 text-center md:text-left">
        <div class="flex items-center space-x-2 mb-4 md:justify-start justify-center">
          <div class="h-8 w-8 shrink-0 flex items-center justify-center">
            <img
              src="../img/sdc_logo.png"
              alt="SDC"
              class="h-8 w-8 object-contain"
              loading="lazy"
            />
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
          <li><a href="../../policy.html#rc" class="hover:text-white transition-colors">Terms of Service</a></li>
          <li><a href="../../policy.html#pc" class="hover:text-white transition-colors">Privacy Policy</a></li>
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
      © ${year} SDC e-Learning. All rights reserved.
    </div>
  </div>
</footer>
`;
};

export default renderFooter;