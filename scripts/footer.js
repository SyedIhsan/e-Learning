const renderFooter = () => {
    const year = new Date().getFullYear();
    return `
<footer class="bg-slate-900 text-slate-400 py-12">
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <div class="grid grid-cols-1 md:grid-cols-4 gap-8">
      <div class="col-span-1 md:col-span-2 text-center md:text-left">
        <div class="flex items-center space-x-2 mb-4 md:justify-start justify-center">
          <div class="w-8 h-8 bg-yellow-500 rounded flex items-center justify-center">
            <span class="text-white font-bold text-sm">SDC</span>
          </div>
          <span class="text-xl font-bold text-white">e-Learning</span>
        </div>
        <p class="max-w-xs text-sm leading-relaxed mx-auto md:mx-0">
          Empowering learners worldwide with cutting-edge technical education and career-ready skills.
        </p>
      </div>
      <div class="text-center">
        <h3 class="text-white font-semibold mb-4">Platform</h3>
        <ul class="space-y-2 text-sm">
          <li><a href="#" class="hover:text-white transition-colors">Courses</a></li>
          <li><a href="#" class="hover:text-white transition-colors">Instructors</a></li>
          <li><a href="#" class="hover:text-white transition-colors">Enterprise</a></li>
        </ul>
      </div>
      <div class="text-center">
        <h3 class="text-white font-semibold mb-4">Support</h3>
        <ul class="space-y-2 text-sm">
          <li><a href="#" class="hover:text-white transition-colors">Help Center</a></li>
          <li><a href="#" class="hover:text-white transition-colors">Terms of Service</a></li>
          <li><a href="#" class="hover:text-white transition-colors">Privacy Policy</a></li>
        </ul>
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
