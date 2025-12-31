import STATE from "./state.js";

const renderHome = () => {
    const user = STATE.user;

    return `
<div class="overflow-hidden">
  <section class="relative pt-20 pb-24 md:pt-32 md:pb-40 bg-white">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
      <div class="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-yellow-50 text-yellow-600 text-xs font-bold uppercase tracking-wider mb-6">
        <span class="flex h-2 w-2 rounded-full bg-yellow-500 animate-ping"></span>
        <span>Bundle Packs Released</span>
      </div>
      <h1 class="text-5xl md:text-7xl font-extrabold text-slate-900 tracking-tight mb-8">
        The Ultimate Learning <br />
        <span class="text-transparent bg-clip-text bg-gradient-to-r from-yellow-500 to-yellow-600">Ecosystem</span>
      </h1>
      <p class="max-w-2xl mx-auto text-xl text-slate-600 leading-relaxed mb-10">
        Premium masterclasses, interactive ebooks, and automated workbooks. Explore our specialized tracks for every skill level.
      </p>
      <div class="flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-4">
        ${
          user
            ? `
        <a href="#/dashboard" class="px-8 py-4 bg-yellow-500 text-white font-bold rounded-2xl shadow-xl shadow-yellow-200 hover:bg-yellow-600 transition-all hover:-translate-y-1">
          Go to Dashboard
        </a>
        `
            : `
        <a href="#/beginner" class="px-8 py-4 bg-yellow-500 text-white font-bold rounded-2xl shadow-xl shadow-yellow-200 hover:bg-yellow-600 transition-all hover:-translate-y-1">
          Browse Beginner Courses
        </a>
        <a href="#/signin" class="px-8 py-4 bg-white border border-slate-200 text-slate-700 font-bold rounded-2xl hover:bg-slate-50 transition-all">
          Sign In to Platform
        </a>
        `
        }
      </div>
    </div>

    <div class="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full pointer-events-none -z-0 opacity-10">
      <div class="absolute top-1/4 left-1/4 w-64 h-64 bg-yellow-400 rounded-full blur-[120px]"></div>
      <div class="absolute bottom-1/4 right-1/4 w-96 h-96 bg-violet-400 rounded-full blur-[120px]"></div>
    </div>
  </section>

  <section class="py-24 bg-slate-50">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="grid md:grid-cols-2 gap-16 items-center">
        <div>
          <h2 class="text-3xl md:text-4xl font-bold text-slate-900 mb-6">Specialized Tracks for Real Success</h2>
          <p class="text-lg text-slate-600 mb-8 leading-relaxed">
            We don't just sell courses; we provide comprehensive digital learning environments. Each level contains multiple specialized modules.
            Buy the specific course that fits your current needs and get instant, lifetime access.
          </p>
          <div class="grid grid-cols-2 gap-8">
            <div>
              <div class="text-3xl font-bold text-yellow-500 mb-1">9 Courses</div>
              <div class="text-sm text-slate-500 font-medium">Ready for Enrollment</div>
            </div>
            <div>
              <div class="text-3xl font-bold text-yellow-500 mb-1">Lifetime</div>
              <div class="text-sm text-slate-500 font-medium">Content Access</div>
            </div>
          </div>
        </div>
        <div class="relative">
          <div class="grid grid-cols-2 gap-4">
            <img src="https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&q=80&w=400" class="rounded-3xl shadow-lg" alt="Study 1" />
            <img src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&q=80&w=400" class="rounded-3xl shadow-lg mt-8" alt="Study 2" />
          </div>
        </div>
      </div>
    </div>
  </section>

  <section class="py-24 bg-white">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
      <h2 class="text-4xl font-black text-slate-900 mb-16">Explore Our Learning Tracks</h2>
      <div class="grid md:grid-cols-3 gap-8">
        ${["Beginner", "Intermediate", "Advanced"]
          .map((lvl) => {
            const path = lvl.toLowerCase();
            return `
          <a href="#/${path}" class="group bg-slate-50 rounded-[3rem] p-12 transition-all hover:bg-yellow-500 hover:-translate-y-2 text-center">
            <div class="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto mb-8 shadow-lg group-hover:scale-110 transition-transform">
              <span class="text-yellow-500 font-black text-xl">${lvl[0]}</span>
            </div>
            <h3 class="text-2xl font-black text-slate-900 group-hover:text-white mb-4">${lvl} Track</h3>
            <p class="text-slate-500 group-hover:text-yellow-50 text-sm mb-8">Discover 3 specialized products tailored for ${lvl} learners.</p>
            <span class="text-yellow-500 group-hover:text-white font-bold text-sm">View Catalog &rarr;</span>
          </a>`;
          })
          .join("")}
      </div>
    </div>
  </section>
</div>
`;
  };

export default renderHome;