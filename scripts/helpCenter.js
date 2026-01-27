// helpCenter.js
// Rendered via route.js at #/help

const CATEGORIES = [
  {
    title: "Enrollment & Billing",
    icon: "💳",
    qas: [
      {
        q: "How do I get access after payment?",
        a: "Access is granted automatically after successful payment. Log in to your account and your purchased course will unlock instantly.",
      },
      {
        q: "I didn’t receive any email / receipt. What now?",
        a: "First, check your spam/junk folder. Then make sure you signed in using the same email used during checkout. If it’s still missing, contact support with your payment reference.",
      },
      {
        q: "Do you offer refunds?",
        a: "Because access is delivered immediately for digital education content, all purchases are final. Please read the course page details before enrolling.",
      },
    ],
  },
  {
    title: "Course Access",
    icon: "🔓",
    qas: [
      {
        q: "Is my access lifetime?",
        a: "Yes. Your access is lifetime for the course you purchased, including updates within the same track.",
      },
      {
        q: "Can I share my account?",
        a: "No. Account sharing is not allowed. Multiple device/IP abuse can trigger an automatic restriction to protect our intellectual property.",
      },
      {
        q: "I bought a course but it’s still locked",
        a: "Most cases happen when you’re logged in with a different email. Sign out, then sign in again using the purchase email and refresh the dashboard.",
      },
    ],
  },
  {
    title: "Technical Support",
    icon: "⚙️",
    qas: [
      {
        q: "Videos are not loading",
        a: "Use a modern browser like Chrome or Brave, disable strict ad-block rules for the site, and avoid corporate/firewall networks that block streaming.",
      },
      {
        q: "Workbook / dashboard not syncing",
        a: "Refresh the page and ensure cookies + JavaScript are enabled. If your workbook needs Google access, make sure you’re signed into a Google account.",
      },
      {
        q: "The site looks broken on mobile",
        a: "Try updating your browser, disable ‘Lite’ mode/data saver, and reload. If it persists, send us a screenshot + your device model.",
      },
    ],
  },
];

const escapeHtml = (s) =>
  String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");

const renderHelpCenter = () => {
  const cards = CATEGORIES.map((cat) => {
    const qas = cat.qas
      .map((qa) => {
        const haystack = (qa.q + " " + qa.a).toLowerCase();
        return `
          <div class="hc-item group p-8 bg-slate-50 rounded-[2rem] border border-slate-100 hover:bg-white hover:shadow-2xl hover:shadow-slate-200/50 transition-all" data-haystack="${escapeHtml(
            haystack
          )}">
            <h3 class="text-lg font-black text-slate-900 mb-4 flex items-start">
              <span class="text-amber-500 mr-2">Q:</span>
              ${escapeHtml(qa.q)}
            </h3>
            <p class="text-slate-500 leading-relaxed font-medium">${escapeHtml(qa.a)}</p>
          </div>
        `;
      })
      .join("");

    return `
      <div class="space-y-8">
        <div class="flex items-center space-x-4 mb-10">
          <div class="text-4xl">${cat.icon}</div>
          <h2 class="text-2xl font-black text-slate-900">${escapeHtml(cat.title)}</h2>
        </div>
        ${qas}
      </div>
    `;
  }).join("");

  return `
    <div class="bg-white min-h-screen">
      <!-- Search Header -->
      <section class="bg-slate-900 py-24 px-4 text-center relative overflow-hidden">
        <div class="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
          <div class="absolute top-0 right-0 w-96 h-96 bg-amber-500 rounded-full blur-[120px] -mr-48 -mt-48"></div>
        </div>

        <div class="max-w-3xl mx-auto relative z-10">
          <h1 class="text-4xl md:text-6xl font-black text-white mb-8 tracking-tighter">Support Terminal</h1>
          <div class="relative">
            <input
              id="hc-search"
              type="text"
              placeholder="Search for answers (e.g. 'access', 'payment', 'video')..."
              class="w-full bg-white/10 border border-white/20 rounded-3xl px-8 py-5 text-lg text-white placeholder:text-slate-500 focus:outline-none focus:ring-4 focus:ring-amber-500/20 backdrop-blur-xl transition-all"
            />
            <div class="absolute right-6 top-1/2 -translate-y-1/2 text-slate-500">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
              </svg>
            </div>
          </div>
        </div>
      </section>

      <!-- FAQ Grid -->
      <section class="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div id="hc-empty" class="hidden col-span-full py-20 text-center">
          <h2 id="hc-empty-title" class="text-2xl font-black text-slate-400">No results found</h2>
          <button data-action="hc-clear" class="mt-4 text-indigo-600 font-bold hover:underline">Clear search</button>
        </div>
        <div id="hc-grid" class="grid lg:grid-cols-3 gap-12">
          ${cards}
        </div>
      </section>

      <!-- Direct Contact Terminal -->
      <section class="pb-32 px-4">
        <div class="max-w-5xl mx-auto bg-slate-900 rounded-[3.5rem] p-12 md:p-20 text-center relative overflow-hidden border border-white/5">
          <div class="relative z-10">
            <span class="text-amber-500 font-black text-xs uppercase tracking-[0.3em] mb-6 block">Still need assistance?</span>
            <h2 class="text-4xl md:text-5xl font-black text-white mb-10 tracking-tight">Support Desk</h2>
            <div class="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto">
              <div class="p-8 bg-white/5 rounded-3xl border border-white/10 flex flex-col items-center">
                <div class="w-12 h-12 bg-indigo-500 rounded-2xl flex items-center justify-center mb-6">
                  <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"></path>
                  </svg>
                </div>
                <h4 class="text-white font-bold text-lg mb-2">Email Desk</h4>
                <p class="text-slate-400 text-sm mb-6">Business hours response</p>
                <a href="mailto:support@sdc.cx" class="text-amber-500 font-black hover:text-amber-400 transition-colors">support@sdc.cx</a>
              </div>

              <div class="p-8 bg-white/5 rounded-3xl border border-white/10 flex flex-col items-center">
                <div class="w-12 h-12 bg-emerald-500 rounded-2xl flex items-center justify-center mb-6">
                  <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"></path>
                  </svg>
                </div>
                <h4 class="text-white font-bold text-lg mb-2">WhatsApp Support</h4>
                <p class="text-slate-400 text-sm mb-6">Fastest response</p>
                <a target="_blank" rel="noopener noreferrer" href="https://wa.me/601116669604" class="text-amber-500 font-black hover:text-amber-400 transition-colors">Chat on WhatsApp</a>
              </div>
            </div>
          </div>
          <div class="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-[100px] -mr-40 -mt-40"></div>
          <div class="absolute bottom-0 left-0 w-80 h-80 bg-amber-500/10 rounded-full blur-[100px] -ml-40 -mb-40"></div>
        </div>
      </section>
    </div>
  `;
};

export default renderHelpCenter;