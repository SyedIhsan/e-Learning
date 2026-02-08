// instructors.js
// Rendered via route.js at #/instructors

const INSTRUCTORS = [
  {
    name: "Marcus Thorne",
    role: "Lead Macro Strategist",
    bio: "Former institutional desk trader with over a decade of experience in legacy forex and emerging digital asset markets. Marcus specializes in the intersection of global liquidity and Bitcoin cycles.",
    expertise: ["Macro Cycles", "Risk Parity", "Capital Preservation"],
    image:
      "https://ui-avatars.com/api/?name=Marcus+Thorne&size=512&background=0f172a&color=fff",
    quote:
      "The market is a mechanism for transferring wealth from the impatient to the disciplined.",
  },
  {
    name: "Dr. Chen Wei",
    role: "Head of Quantitative Research",
    bio: "Ph.D. in Computational Mathematics. Dr. Wei leads our algorithmic track, focusing on high-frequency execution and automated delta-neutral strategies.",
    expertise: ["Python Mastery", "Backtesting", "MEV Logic"],
    image:
      "https://ui-avatars.com/api/?name=Chen+Wei&size=512&background=0f172a&color=fff",
    quote: "In God we trust; all others must bring data.",
  },
  {
    name: "Elena Rodriguez",
    role: "On-Chain Forensic Lead",
    bio: 'Elena is a pioneer in behavioral on-chain analysis. She specializes in tracking whale distribution phases and exchange flows to predict macro trend reversals.',
    expertise: ["Dune Analytics", "Glassnode Mastery", "Whale Tracking"],
    image:
      "https://ui-avatars.com/api/?name=Elena+Rodriguez&size=512&background=0f172a&color=fff",
    quote:
      "The blockchain never lies. Human emotion is the only variable that does.",
  },
  {
    name: "Sarah Jenkins",
    role: "DeFi Protocol Architect",
    bio: "Former smart contract auditor turned educator. Sarah breaks down complex liquidity provision and yield farming strategies into actionable institutional frameworks.",
    expertise: ["Liquidity Logic", "Yield Optimization", "Protocol Risk"],
    image:
      "https://ui-avatars.com/api/?name=Sarah+Jenkins&size=512&background=0f172a&color=fff",
    quote: "Code is law, but risk management is the jury.",
  },
];

const escapeHtml = (s) =>
  String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");

const renderInstructors = () => {
  return `
    <div class="bg-white min-h-screen">

      <!-- Hero Header -->
      <section class="bg-slate-950 py-32 relative overflow-hidden">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <span class="text-amber-500 font-black text-xs uppercase tracking-[0.4em] mb-6 block">
            Meet Our Instructors
          </span>

          <h1 class="text-5xl md:text-8xl font-black text-white mb-8 tracking-tighter">
            Elite Market <br />
            <span class="text-transparent bg-clip-text bg-gradient-to-r from-slate-400 to-white">
              Intelligence
            </span>
          </h1>

          <p class="max-w-2xl mx-auto text-slate-400 text-xl font-medium leading-relaxed">
            Our instructors aren't just teachers; they are active market participants and institutional architects bringing real-world alpha to your terminal.
          </p>
        </div>

        <!-- Abstract Background -->
        <div class="absolute top-0 right-0 w-1/2 h-full bg-indigo-600/10 blur-[120px] rounded-full -mr-1/4 -mt-24"></div>
      </section>

      <!-- Instructors Grid -->
      <section class="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="space-y-32">
          ${INSTRUCTORS.map((teacher, i) => `
            <div class="flex flex-col ${i % 2 === 0 ? "lg:flex-row" : "lg:flex-row-reverse"} items-center gap-16 lg:gap-24">

              <!-- Image Side -->
              <div class="w-full lg:w-2/5">
                <div class="relative group">
                  <div class="absolute -inset-4 bg-slate-100 rounded-[3rem] -rotate-2 transition-transform group-hover:rotate-0"></div>

                  <img
                    src="${teacher.image}"
                    alt="${escapeHtml(teacher.name)}"
                    class="relative w-full aspect-square object-cover rounded-[2.5rem] shadow-2xl border-8 border-white"
                  />

                  <div class="absolute bottom-8 right-8 bg-amber-500 text-white p-4 rounded-2xl shadow-xl">
                    <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M14.017 21L14.017 18C14.017 16.8954 13.1216 16 12.017 16C10.9124 16 10.017 16.8954 10.017 18L10.017 21M10.017 21H3V11.5L12 3L21 11.5V21H14.017Z"
                        stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none" />
                    </svg>
                  </div>
                </div>
              </div>

              <!-- Content Side -->
              <div class="w-full lg:w-3/5">
                <div class="mb-8">
                  <span class="text-indigo-600 font-black text-xs uppercase tracking-widest bg-indigo-50 px-4 py-1.5 rounded-full mb-4 inline-block">
                    ${escapeHtml(teacher.role)}
                  </span>

                  <h2 class="text-4xl md:text-6xl font-black text-slate-900 tracking-tight mb-6">
                    ${escapeHtml(teacher.name)}
                  </h2>

                  <p class="text-xl text-slate-500 leading-relaxed font-medium mb-8 whitespace-pre-line">
                    ${escapeHtml(teacher.bio)}
                  </p>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
                  <div class="space-y-4">
                    <h4 class="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      Specialized Matrix
                    </h4>
                    <div class="flex flex-wrap gap-2">
                      ${teacher.expertise
                        .map(
                          (skill) => `
                            <span class="text-xs font-bold text-slate-700 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">
                              ${escapeHtml(skill)}
                            </span>
                          `
                        )
                        .join("")}
                    </div>
                  </div>
                </div>

                <div class="p-8 bg-slate-50 rounded-[2rem] border border-slate-100 italic">
                  <p class="text-slate-600 text-lg leading-relaxed font-medium">
                    "${escapeHtml(teacher.quote)}"
                  </p>
                </div>
              </div>
            </div>
          `).join("")}
        </div>
      </section>

      <!-- Join the Faculty CTA -->
      <section class="py-24 bg-indigo-600">
        <div class="max-w-4xl mx-auto px-4 text-center">
          <h2 class="text-3xl md:text-5xl font-black text-white mb-8 tracking-tight">
            Interested in contributing to the Academy?
          </h2>
          <p class="text-indigo-100 text-lg mb-10 font-medium">
            We are always looking for institutional-grade traders and blockchain developers to expand our curriculum.
          </p>
          <button class="px-10 py-5 bg-white text-indigo-600 font-black rounded-2xl hover:bg-slate-50 transition-all shadow-xl">
            Apply for Faculty
          </button>
        </div>
      </section>

    </div>
  `;
};

export default renderInstructors;