// notFound.js
let __nfMouseHandler = null;
let __nfGlitchTimer = null;
let __nfGlitchReset = null;

export default function renderNotFound() {
  // cleanup lama (kalau user masuk 404 lebih dari sekali)
  cleanupNotFound();

  // attach mouse move (parallax)
  __nfMouseHandler = (e) => {
    const bg = document.getElementById("nf-grid");
    if (!bg) return;

    const x = (e.clientX / window.innerWidth - 0.5) * 20;
    const y = (e.clientY / window.innerHeight - 0.5) * 20;

    bg.style.transform = `translate(${x}px, ${y}px)`;
  };

  window.addEventListener("mousemove", __nfMouseHandler);

  // glitch loop
  __nfGlitchTimer = setInterval(() => {
    const t = document.getElementById("nf-404");
    const ghost = document.getElementById("nf-404-ghost");
    if (!t || !ghost) return;

    t.classList.add("translate-x-1", "skew-x-12");
    t.style.textShadow = "2px 0 #ff00c1, -2px 0 #00fff9";
    ghost.classList.remove("hidden");

    __nfGlitchReset = setTimeout(() => {
      t.classList.remove("translate-x-1", "skew-x-12");
      t.style.textShadow = "0 0 40px rgba(99, 102, 241, 0.3)";
      ghost.classList.add("hidden");
    }, 200);
  }, 3000);

  return `
  <div class="relative min-h-screen bg-slate-950 flex items-center justify-center overflow-hidden font-mono">

    <!-- Background Grid -->
    <div
      id="nf-grid"
      class="absolute inset-0 opacity-20"
      style="
        background-image: radial-gradient(#334155 1px, transparent 1px);
        background-size: 30px 30px;
      ">
    </div>

    <!-- Floating Blobs -->
    <div class="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-600/20 rounded-full blur-[120px] animate-pulse"></div>
    <div class="absolute bottom-1/4 right-1/4 w-96 h-96 bg-amber-600/10 rounded-full blur-[120px] animate-pulse" style="animation-delay:1s"></div>

    <div class="relative z-10 text-center px-4">

      <!-- 404 -->
      <div class="relative inline-block mb-8">
        <h1
          id="nf-404"
          class="text-[12rem] md:text-[18rem] font-black leading-none tracking-tighter transition-transform duration-75"
          style="text-shadow:0 0 40px rgba(99,102,241,.3)"
        >
          <span class="text-transparent bg-clip-text bg-gradient-to-b from-white to-slate-800">
            404
          </span>
        </h1>

        <!-- Ghost -->
        <div
          id="nf-404-ghost"
          class="absolute inset-0 text-white opacity-50 flex items-center justify-center pointer-events-none hidden"
        >
          <span class="text-[12rem] md:text-[18rem] font-black -translate-y-2 translate-x-4">
            404
          </span>
        </div>
      </div>

      <!-- Status -->
      <div class="max-w-xl mx-auto space-y-8">
        <div class="space-y-2">
          <h2 class="text-2xl font-black text-white uppercase tracking-[0.2em]">
            Lost in the Void
          </h2>

          <div class="flex items-center justify-center space-x-2 text-indigo-400 font-bold text-xs uppercase tracking-widest">
            <span class="w-2 h-2 bg-red-500 rounded-full animate-ping"></span>
            <span>Connection De-synced from Mainnet</span>
          </div>
        </div>

        <!-- Terminal -->
        <div class="bg-white/5 border border-white/10 rounded-3xl p-6 backdrop-blur-md text-left text-sm text-slate-400 relative overflow-hidden">
          <div class="absolute top-0 left-0 w-1 h-full bg-indigo-500"></div>
          <div class="space-y-1">
            <p><span class="text-emerald-500">➜</span> <span class="text-slate-500">status:</span> ERR_PAGE_NOT_FOUND</p>
            <p><span class="text-emerald-500">➜</span> <span class="text-slate-500">location:</span> Unknown Sector</p>
            <p><span class="text-emerald-500">➜</span> <span class="text-slate-500">action:</span> Initializing recovery protocol...</p>
            <p class="animate-pulse"><span class="text-emerald-500">➜</span> _</p>
          </div>
        </div>

        <!-- Actions -->
        <div class="flex flex-col sm:flex-row items-center justify-center gap-4">
          <a href="#/" class="w-full sm:w-auto px-10 py-4 bg-white text-slate-950 font-black rounded-2xl hover:bg-indigo-400 hover:text-white transition-all shadow-xl shadow-white/5">
            Return Home
          </a>

          <a href="#/help" class="w-full sm:w-auto px-10 py-4 bg-white/5 border border-white/10 text-white font-black rounded-2xl hover:bg-white/10 transition-all">
            Contact Support
          </a>
        </div>
      </div>
    </div>

    <!-- Decorative SVGs -->
    <div class="absolute top-20 right-20 opacity-10 rotate-12 animate-bounce" style="animation-duration:4s">
      <svg class="w-24 h-24" viewBox="0 0 24 24" fill="white">
        <path d="M12.6,2.2l-2.6,0.3L6.8,11.3l2.8,1l3-8.8L12.6,2.2z M8.1,12.5l-2.8-1l-3.2,9.1l2.8,1L8.1,12.5z M13.4,4.5l-3,8.8l7.1,2.5l3-8.8L13.4,4.5z M10.4,13.3l-2.1,6.1l7.1,2.5l2.1-6.1L10.4,13.3z"/>
      </svg>
    </div>

    <div class="absolute bottom-20 left-20 opacity-10 -rotate-12 animate-bounce" style="animation-duration:6s;animation-delay:1s">
      <svg class="w-20 h-20" viewBox="0 0 24 24" fill="white">
        <path d="M12,2L4.5,20.29L5.21,21L12,18L18.79,21L19.5,20.29L12,2Z"/>
      </svg>
    </div>

    <style>
      @keyframes glitch {
        0% { transform: translate(0) }
        20% { transform: translate(-2px, 2px) }
        40% { transform: translate(-2px, -2px) }
        60% { transform: translate(2px, 2px) }
        80% { transform: translate(2px, -2px) }
        100% { transform: translate(0) }
      }
    </style>

  </div>
  `;
}

export function cleanupNotFound() {
  if (__nfMouseHandler) {
    window.removeEventListener("mousemove", __nfMouseHandler);
    __nfMouseHandler = null;
  }
  if (__nfGlitchTimer) {
    clearInterval(__nfGlitchTimer);
    __nfGlitchTimer = null;
  }
  if (__nfGlitchReset) {
    clearTimeout(__nfGlitchReset);
    __nfGlitchReset = null;
  }
}