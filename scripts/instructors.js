// instructors.js
// Rendered via route.js at #/instructors

const INSTRUCTORS = [
  {
    name: "Haziq Farhan",
    role: "Founder & Lead Instructor",
    bio: "Mohd. Haziq Farhan a.k.a Cikgu Kripto is a visionary leader and a self-made crypto millionaire. As the founder of Six Digit Club (SDC), he has spearheaded crypto education and innovation in Malaysia, establishing a strong reputation as a leading influencer and entrepreneur in the digital asset space.\n\nSince entering the crypto market in 2012, Haziq Farhan has guided and mentored over 20 individuals within the SDC community to achieve millionaire status. Under his leadership, SDC has emerged as a key force in advancing financial literacy and shaping the future of crypto through progressive social innovation.",
    expertise: [
      "Crypto Market Cycles",
      "Risk Management Frameworks",
      "Portfolio Strategy",
      "DEX & CEX Execution",
      "Investor Psychology",
    ],
    image: "https://sdc.cx/img/Cikgu.png",
    quote:
      "In crypto, success doesn’t belong to the fastest — it belongs to those who can survive the longest.",
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
            The SDC Faculty
          </span>

          <h1 class="text-5xl md:text-8xl font-black text-white mb-8 tracking-tighter">
            Built in the Market, <br />
            <span class="text-transparent bg-clip-text bg-gradient-to-r from-slate-400 to-white">
              Proven Through Cycles
            </span>
          </h1>

          <p class="max-w-2xl mx-auto text-slate-400 text-xl font-medium leading-relaxed">
            Our instructors are not theoretical lecturers. They are active market participants who trade, analyze,
            and manage risk in real market conditions — and translate that experience into practical education.
          </p>
        </div>

        <div class="absolute top-0 right-0 w-1/2 h-full bg-indigo-600/10 blur-[120px] rounded-full -mr-1/4 -mt-24"></div>
      </section>

      <!-- Instructors Section -->
      <section class="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="space-y-32">
          ${INSTRUCTORS.map((teacher) => `
            <div class="flex flex-col lg:flex-row items-center gap-16 lg:gap-24">

              <!-- Image -->
              <div class="w-full lg:w-2/5">
                <div class="relative group">
                  <div class="absolute -inset-4 bg-slate-100 rounded-[3rem] -rotate-2 transition-transform group-hover:rotate-0"></div>
                  <img
                    src="${teacher.image}"
                    alt="${escapeHtml(teacher.name)}"
                    class="relative w-full aspect-square object-cover rounded-[2.5rem] shadow-2xl border-8 border-white"
                  />
                </div>
              </div>

              <!-- Content -->
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
                      Areas of Expertise
                    </h4>
                    <div class="flex flex-wrap gap-2">
                      ${teacher.expertise
                        .map(
                          (skill) => `
                          <span class="text-xs font-bold text-slate-700 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">
                            ${escapeHtml(skill)}
                          </span>`
                        )
                        .join("")}
                    </div>
                  </div>
                </div>

                <div class="p-8 bg-slate-50 rounded-[2rem] border border-slate-100 italic">
                  <p class="text-slate-600 text-lg leading-relaxed font-medium">
                    “${escapeHtml(teacher.quote)}”
                  </p>
                </div>
              </div>
            </div>
          `).join("")}
        </div>
      </section>
    </div>
  `;
};

export default renderInstructors;