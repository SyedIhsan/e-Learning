// enterprise.js
// Rendered via route.js at #/enterprise

const SOLUTIONS = [
  {
    title: "Hedge Fund & Desk Training",
    desc: "Equip your trading desk with proprietary macro-economic models and institutional-grade risk management frameworks.",
    features: ["Advanced Delta Neutral Strategies", "Portfolio Optimization", "Proprietary Alpha Signals"],
    icon: "🏦",
  },
  {
    title: "Fintech & Engineering",
    desc: "Accelerate your development team's proficiency in smart contract architecture and secure on-chain infrastructure.",
    features: ["Smart Contract Auditing", "MEV Prevention Logic", "Protocol Design"],
    icon: "🏗️",
  },
  {
    title: "Compliance & Risk",
    desc: "Training for legal and compliance teams on AML/KYC for blockchain assets and on-chain forensic tracking.",
    features: ["On-Chain Forensics", "Regulatory Frameworks", "Asset Tracking"],
    icon: "⚖️",
  },
];

const renderEnterprise = () => {
  return `
    <div class="bg-slate-950 min-h-screen text-white">

      <!-- Hero Section -->
      <section class="relative pt-32 pb-40 px-4 overflow-hidden border-b border-white/5">
        <div class="max-w-7xl mx-auto text-center relative z-10">
          <span class="inline-block px-4 py-1.5 bg-indigo-500/10 border border-indigo-500/20 rounded-full text-indigo-400 text-[10px] font-black uppercase tracking-[0.4em] mb-8">
            Institutional Grade Education
          </span>

          <h1 class="text-5xl md:text-8xl font-black mb-10 tracking-tighter">
            DEMO <span class="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-amber-400">Enterprise</span>
          </h1>

          <p class="max-w-3xl mx-auto text-xl text-slate-400 font-medium leading-relaxed mb-12">
            The world's leading firms trust us to train their next generation of digital asset professionals. Custom curriculums for funds, desks, and protocols.
          </p>

          <div class="flex flex-col sm:flex-row justify-center gap-6">
            <button type="button" class="px-10 py-5 bg-yellow-500 text-white font-black rounded-2xl hover:bg-yellow-600 transition-all shadow-2xl shadow-indigo-900/40">
              Request Consultation
            </button>

            <button type="button" class="px-10 py-5 bg-white/5 border border-white/10 text-white font-black rounded-2xl hover:bg-white/10 transition-all">
              Download Program Guide
            </button>
          </div>
        </div>

        <!-- Animated grid background -->
        <div class="absolute top-0 left-0 w-full h-full opacity-20 pointer-events-none">
          <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-indigo-500 rounded-full blur-[150px] opacity-20"></div>
          <div class="w-full h-full"
            style="background-image: radial-gradient(circle, #334155 1px, transparent 1px); background-size: 40px 40px;">
          </div>
        </div>
      </section>

      <!-- Solutions Grid -->
      <section class="py-32 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="grid lg:grid-cols-3 gap-10">
          ${SOLUTIONS.map((sol) => `
            <div class="group p-10 bg-white/5 rounded-[3rem] border border-white/10 hover:border-indigo-500/50 hover:bg-white/[0.07] transition-all flex flex-col">
              <div class="text-5xl mb-8">${sol.icon}</div>
              <h3 class="text-2xl font-black mb-6 group-hover:text-indigo-400 transition-colors">${sol.title}</h3>
              <p class="text-slate-400 mb-10 font-medium leading-relaxed flex-grow">
                ${sol.desc}
              </p>

              <ul class="space-y-4 mb-10">
                ${sol.features.map((feat) => `
                  <li class="flex items-center space-x-3 text-sm font-bold text-slate-300">
                    <svg class="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M5 13l4 4L19 7" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"></path>
                    </svg>
                    <span>${feat}</span>
                  </li>
                `).join("")}
              </ul>
            </div>
          `).join("")}
        </div>
      </section>

      <!-- Team Dashboard Preview -->
      <section class="py-32 bg-white text-slate-900 overflow-hidden">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="flex flex-col lg:flex-row items-center gap-24">

            <div class="lg:w-1/2">
              <span class="text-yellow-500 font-black text-xs uppercase tracking-widest mb-6 block">Management Terminal</span>
              <h2 class="text-4xl md:text-6xl font-black mb-8 tracking-tighter">
                Measure Team <br />Proficiency.
              </h2>
              <p class="text-xl text-slate-500 leading-relaxed font-medium mb-10">
                Enterprise accounts include a centralized admin dashboard. Monitor enrollment progress, skill certifications, and knowledge retention across your entire organization.
              </p>

              <div class="space-y-6">
                <div class="flex items-start gap-6 p-6 bg-slate-50 rounded-3xl border border-slate-100">
                  <div class="w-12 h-12 bg-yellow-500 text-white rounded-2xl flex items-center justify-center font-bold text-xl flex-shrink-0">1</div>
                  <p class="text-slate-600 font-bold">Bulk Seat Management & One-Click Onboarding</p>
                </div>
                <div class="flex items-start gap-6 p-6 bg-slate-50 rounded-3xl border border-slate-100">
                  <div class="w-12 h-12 bg-yellow-500 text-white rounded-2xl flex items-center justify-center font-bold text-xl flex-shrink-0">2</div>
                  <p class="text-slate-600 font-bold">LMS Integration (SCORM/xAPI Support)</p>
                </div>
              </div>
            </div>

            <div class="lg:w-1/2 relative">
              <div class="absolute inset-0 bg-indigo-600/10 blur-[80px] rounded-full"></div>
              <img
                src="https://miro.medium.com/v2/resize:fit:1400/1*rQ3d_dKG7V2JhX8SrUjs6g.png"
                class="relative rounded-[3rem] shadow-2xl shadow-slate-300 border border-slate-200"
                alt="Dashboard Preview"
                loading="lazy"
              />
            </div>

          </div>
        </div>
      </section>

      <!-- Inquiry Form -->
      <section class="py-32 px-4 bg-slate-950">
        <div class="max-w-4xl mx-auto bg-white/5 rounded-[4rem] p-12 md:p-24 border border-white/10">
          <div class="text-center mb-16">
            <h2 class="text-4xl font-black mb-6">Partner with DEMO</h2>
            <p class="text-slate-400 font-medium">Connect with our institutional accounts team to build your training program.</p>
          </div>

          <!-- NOTE: button type=button so it won't reload page in static demo -->
          <form class="grid md:grid-cols-2 gap-8" autocomplete="on">
            <div class="space-y-2">
              <label class="text-[10px] font-black text-slate-500 uppercase tracking-widest">Company Name</label>
              <input type="text" class="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="Capital Mgmt LLC" />
            </div>

            <div class="space-y-2">
              <label class="text-[10px] font-black text-slate-500 uppercase tracking-widest">Expected Seats</label>
              <input type="text" class="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="10 - 50" />
            </div>

            <div class="md:col-span-2 space-y-2">
              <label class="text-[10px] font-black text-slate-500 uppercase tracking-widest">Team Goal</label>
              <textarea class="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 focus:ring-2 focus:ring-indigo-500 outline-none h-32" placeholder="Tell us about your team's specific objectives..."></textarea>
            </div>

            <button type="button" class="md:col-span-2 py-5 bg-white text-slate-950 font-black rounded-2xl hover:bg-indigo-400 transition-all text-lg">
              Initialize Consultation
            </button>
          </form>
        </div>
      </section>

    </div>
  `;
};

export default renderEnterprise;