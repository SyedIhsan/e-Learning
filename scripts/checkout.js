import { escapeHtml, navigate } from "./helpers.js";
import STATE from "./state.js";
import { COURSES } from "../data/course.js";

const SHOW_SANDBOX = location.hostname === "localhost" || location.hostname === "127.0.0.1";

// Price display helper (always show RM prefix)
const formatRM = (price) => {
  const s = String(price ?? "").trim();
  if (!s) return "";
  if (/^rm\s*/i.test(s)) return s.replace(/^rm\s*/i, "RM");
  return `RM${s}`;
};

// Route: #/checkout/:courseId
const renderCheckout = (courseId) => {
  const course = COURSES?.[courseId] || null;

  // If course not found, redirect away.
  if (!course) {
    navigate("/");
    return "";
  }

  const co = STATE.checkout;
  const user = STATE.user;

  const processing = !!co.processing;
  const success = !!co.success;

  const formData =
    co.formData || {
      fullName: "",
      email: user?.id ? `${user.id}@example.com` : "",
      phoneNumber: "",
      agreedTerms: false,
    };

  // Success UI
  if (success) {
    return `
<div class="min-h-[80vh] flex items-center justify-center bg-slate-50 px-4">
  <div class="max-w-md w-full bg-white rounded-[3rem] p-12 text-center shadow-2xl shadow-slate-200 border border-slate-100">
    <div class="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-8">
      <svg class="w-10 h-10 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7" />
      </svg>
    </div>
    <h2 class="text-3xl font-black text-slate-900 mb-4">Enrollment Complete!</h2>
    <p class="text-slate-500 mb-10 leading-relaxed">
      Congratulations! You now have lifetime access to <span class="font-bold text-slate-900">${escapeHtml(
        course.title
      )}</span>. Your access credentials have been sent to your email.
    </p>
    <a
      href="#/dashboard"
      class="block w-full py-5 bg-yellow-600 text-white rounded-2xl font-black text-lg hover:bg-yellow-700 shadow-xl shadow-yellow-100 transition-all"
    >
      Go to Dashboard
    </a>
  </div>
</div>
`;
  }

  const agreed = !!formData.agreedTerms;

  const btnClass = processing
    ? "bg-yellow-400 text-white cursor-wait"
    : !agreed
    ? "bg-slate-200 text-slate-400 cursor-not-allowed shadow-none"
    : "bg-yellow-500 text-white hover:bg-yellow-600 hover:scale-[1.02] shadow-yellow-100 active:scale-95";

  return `
<div class="bg-slate-50 min-h-screen py-16">
  <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
    <div class="flex flex-col lg:flex-row gap-12">

      <!-- Left: Enrollment Form -->
      <div class="lg:w-2/3">
        <div class="bg-white rounded-[2.5rem] p-8 md:p-12 shadow-xl shadow-slate-200/50 border border-slate-100">
          <h1 class="text-3xl font-black text-slate-900 mb-2">Complete Enrollment</h1>
          <p class="text-slate-500 mb-10">Provide your details to unlock your learning path.</p>

          <form data-action="checkout-submit" class="space-y-8">
            <div class="space-y-6">
              <h3 class="text-sm font-black text-slate-400 uppercase tracking-widest">Contact Information</h3>

              <div>
                <label class="block text-xs font-black text-slate-500 uppercase tracking-tighter mb-2">Full Name</label>
                <input
                  type="text"
                  name="fullName"
                  required
                  value="${escapeHtml(formData.fullName)}"
                  placeholder="Johnathan Doe"
                  class="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all"
                />
              </div>

              <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label class="block text-xs font-black text-slate-500 uppercase tracking-tighter mb-2">Email Address</label>
                  <input
                    type="email"
                    name="email"
                    required
                    value="${escapeHtml(formData.email)}"
                    placeholder="you@example.com"
                    class="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all"
                  />
                </div>
                <div>
                  <label class="block text-xs font-black text-slate-500 uppercase tracking-tighter mb-2">Phone Number</label>
                  <input
                    type="tel"
                    name="phoneNumber"
                    required
                    value="${escapeHtml(formData.phoneNumber)}"
                    placeholder="+1 (555) 000-0000"
                    class="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all"
                  />
                </div>
              </div>
            </div>

            <div class="pt-4">
              <label class="flex items-start space-x-4 cursor-pointer group">
                <div class="relative flex items-center">
                  <input
                    type="checkbox"
                    name="agreedTerms"
                    required
                    ${agreed ? "checked" : ""}
                    class="peer h-6 w-6 cursor-pointer appearance-none rounded-lg border border-slate-300 bg-white checked:bg-yellow-500 checked:border-yellow-500 focus:outline-none transition-all"
                  />
                  <svg class="absolute left-1 h-4 w-4 text-white opacity-0 peer-checked:opacity-100 pointer-events-none transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="4" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span class="text-sm text-slate-600 font-medium leading-relaxed group-hover:text-slate-900 transition-colors">
                  I certify that I am at least 18 years old and that I agree to the <a href="../../policy.html#rc" class="text-yellow-500 font-bold hover:underline">Terms &amp; Conditions</a> and <a href="../../policy.html#pc" class="text-yellow-500 font-bold hover:underline">Privacy Policy</a>.
                </span>
              </label>
            </div>

            <button
              type="submit"
              name="pay_mode"
              value="live"
              ${processing || !agreed ? "disabled" : ""}
              class="w-full py-5 rounded-2xl font-black text-xl shadow-2xl transition-all flex items-center justify-center space-x-3 ${btnClass}"
            >
              ${
                processing
                  ? `
                <svg class="animate-spin h-6 w-6 text-white" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Processing Enrollment...</span>
              `
                  : `<span>Complete Enrollment - ${escapeHtml(formatRM(course.price))}</span>`
              }
            </button>
            
            ${SHOW_SANDBOX ? `
            <button
              type="submit"
              name="pay_mode"
              value="sandbox"
              ${processing || !agreed ? "disabled" : ""}
              class="w-full py-4 rounded-2xl font-black text-sm shadow-lg transition-all flex items-center justify-center bg-white text-slate-900 border border-slate-200 hover:bg-slate-50 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Test Sandbox Payment - ${escapeHtml(formatRM(course.price))}
            </button>
            ` : ""}

            <p class="text-center text-[10px] text-slate-400 uppercase tracking-widest font-black">
              🛡️ Secure Digital Enrollment &amp; Content Protection
            </p>
          </form>
        </div>
      </div>

      <!-- Right: Order Summary -->
      <div class="lg:w-1/3">
        <div class="bg-slate-900 rounded-[2.5rem] p-8 text-white sticky top-28">
          <h2 class="text-xl font-black mb-8 border-b border-white/10 pb-4">Order Summary</h2>

          <div class="flex items-center space-x-4 mb-8">
            <div class="w-20 h-20 rounded-2xl overflow-hidden flex-shrink-0">
              <img src="${escapeHtml(course.image)}" alt="${escapeHtml(
                course.title
              )}" class="w-full h-full object-cover" />
            </div>
            <div>
              <h4 class="font-bold leading-tight mb-1">${escapeHtml(course.title)}</h4>
              <p class="text-xs text-slate-400 font-bold uppercase tracking-widest">${escapeHtml(
                course.level
              )} Level</p>
            </div>
          </div>

          <div class="space-y-4 mb-8">
            <div class="flex justify-between text-sm">
              <span class="text-slate-400">Course Fee</span>
              <span class="font-bold">${escapeHtml(formatRM(course.price))}</span>
            </div>
            <div class="flex justify-between text-sm">
              <span class="text-slate-400">Digital Processing</span>
              <span class="font-bold text-emerald-400">FREE</span>
            </div>
            <div class="pt-4 border-t border-white/10 flex justify-between">
              <span class="font-black text-lg">Total Due</span>
              <span class="font-black text-2xl text-yellow-400">${escapeHtml(
                formatRM(course.price)
              )}</span>
            </div>
          </div>

          <div class="bg-white/5 rounded-2xl p-4 space-y-3">
            <div class="flex items-center space-x-3 text-xs">
              <svg class="w-4 h-4 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"></path></svg>
              <span>Lifetime Access</span>
            </div>
            <div class="flex items-center space-x-3 text-xs">
              <svg class="w-4 h-4 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"></path></svg>
              <span>All Future Updates</span>
            </div>
            <div class="flex items-center space-x-3 text-xs">
              <svg class="w-4 h-4 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"></path></svg>
              <span>Direct Instructor Support</span>
            </div>
          </div>

          <div class="mt-8 text-center">
            <p class="text-[10px] text-slate-500 uppercase tracking-widest font-black mb-4">Refund Policy</p>
            <p class="text-[10px] text-slate-400 leading-relaxed">
              Due to the digital nature of our products, all sales are final. We provide extensive previews to ensure the track meets your expectations.
            </p>
          </div>
        </div>
      </div>

    </div>
  </div>
</div>
`;
};

export default renderCheckout;
