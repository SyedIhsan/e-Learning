import { escapeHtml, getPurchasedList, encodeQS } from "./helpers.js";
import STATE from "./state.js";
import { COURSES_DATA } from "../data/course.js";

const ensureWaitlistState = (level) => {
  if (!STATE.coursePage) STATE.coursePage = {};
  if (STATE.coursePage.waitlistLevel !== level) {
    STATE.coursePage.waitlistLevel = level;
    STATE.coursePage.waitlist = { isNotifying: false, isNotified: false };
  }
  if (!STATE.coursePage.waitlist) {
    STATE.coursePage.waitlist = { isNotifying: false, isNotified: false };
  }
  return STATE.coursePage.waitlist;
};

const renderComingSoon = (level, wait) => {
  const disabled = wait.isNotified || wait.isNotifying;

  const buttonInner = wait.isNotifying
    ? `
      <svg class="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
    `
    : wait.isNotified
    ? `
      <div class="flex items-center space-x-2">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7" />
        </svg>
        <span>Notified!</span>
      </div>
    `
    : "Notify Me";

  const buttonClass = wait.isNotified
    ? "bg-emerald-500 text-white shadow-emerald-100"
    : "bg-yellow-500 text-white hover:bg-yellow-600 shadow-yellow-100";

  return `
  <div class="flex items-center justify-center py-10">
    <div class="max-w-3xl w-full">
      <div class="bg-white rounded-[3rem] p-10 md:p-16 text-center shadow-xl shadow-slate-200/50 border border-slate-100 relative overflow-hidden">
        <div class="absolute top-0 right-0 w-64 h-64 bg-yellow-50 rounded-full -mr-32 -mt-32 opacity-50"></div>
        <div class="absolute bottom-0 left-0 w-48 h-48 bg-slate-50 rounded-full -ml-24 -mb-24 opacity-50"></div>

        <div class="relative z-10 flex flex-col items-center">
          <div class="w-20 h-20 bg-yellow-100 text-yellow-600 rounded-3xl flex items-center justify-center mb-8 shadow-lg shadow-yellow-50">
            <svg class="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>

          <h2 class="text-4xl font-black text-slate-900 mb-4">Content Coming Soon</h2>
          <p class="text-slate-500 text-lg mb-10 leading-relaxed max-w-md">
            Our team is crafting the perfect <span class="text-yellow-500 font-bold capitalize">${escapeHtml(
              level
            )}</span> curriculum. We'll be live shortly.
          </p>

          <div class="bg-slate-50 p-6 md:p-10 rounded-[2.5rem] border border-slate-100 w-full max-w-lg mb-10">
            <h3 class="text-xs font-black text-slate-400 uppercase tracking-widest mb-6">Join the Waitlist</h3>

            <form class="flex flex-col sm:flex-row gap-3 mb-6" data-action="waitlist-form" data-level="${escapeHtml(
              level
            )}">
              <input
                type="email"
                required
                ${disabled ? "disabled" : ""}
                placeholder="your@email.com"
                class="flex-grow px-6 py-4 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-yellow-500 focus:outline-none transition-all bg-white text-sm font-medium disabled:bg-slate-50 disabled:text-slate-400"
              />
              <button
                type="submit"
                ${disabled ? "disabled" : ""}
                class="px-8 py-4 rounded-2xl font-black text-sm transition-all shadow-xl whitespace-nowrap active:scale-95 flex items-center justify-center min-w-[140px] ${buttonClass}"
              >
                ${buttonInner}
              </button>
            </form>

            <div class="flex items-center justify-center space-x-2 text-[10px] text-slate-400 font-black uppercase tracking-tighter">
              <svg class="w-3 h-3 text-emerald-500" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 4.946-2.597 9.29-6.5 11.854a11.954 11.954 0 01-3.5-2.564A11.952 11.952 0 012 7.001c0-.681.056-1.35.166-2.002zm11.714 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
              </svg>
              <span>No spam. Only early-bird launch invites.</span>
            </div>
          </div>

          <a href="#/" class="inline-flex items-center space-x-2 text-yellow-600 font-black hover:text-yellow-700 transition-colors group px-6 py-3 rounded-2xl hover:bg-yellow-50">
            <svg class="w-5 h-5 transition-transform group-hover:-translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span>Back to Homepage</span>
          </a>
        </div>
      </div>
    </div>
  </div>
  `;
};

const renderCoursePage = (level) => {
  const user = STATE.user;
  const buyingId = STATE.coursePage.buyingId || null;
  const successId = STATE.coursePage.successId || null;

  const coursesForLevel = COURSES_DATA.filter((c) => c.level.toLowerCase() === level);
  const wait = ensureWaitlistState(level);

  const heroDesc =
    coursesForLevel.length > 0
      ? `Expert-curated curriculum designed to take you from absolute zero to job-ready expertise in ${escapeHtml(
          level
        )} concepts.`
      : `Our specialized ${escapeHtml(level)} curriculum is currently under development by industry experts.`;

  return `
<div class="bg-slate-50 min-h-screen pb-24">
  <div class="bg-white border-b border-slate-200 py-16 mb-12">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
      <nav class="flex items-center justify-center space-x-2 text-sm text-slate-400 mb-6 uppercase font-bold tracking-widest">
        <a href="#/" class="hover:text-yellow-500 transition-colors">Home</a>
        <span>/</span>
        <span class="text-yellow-500">${escapeHtml(level)} Track</span>
      </nav>
      <h1 class="text-4xl md:text-6xl font-black text-slate-900 mb-4 capitalize">${escapeHtml(
        level
      )} Learning Path</h1>
      <p class="max-w-2xl mx-auto text-lg text-slate-500">
        ${heroDesc}
      </p>
    </div>
  </div>

  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    ${
      coursesForLevel.length > 0
        ? `
    <div class="space-y-16">
      ${coursesForLevel
        .map((course) => {
          const modules = Array.isArray(course.modules) ? course.modules : [];
          const isOwned =
            (user && user.purchasedCourses.includes(course.id)) ||
            getPurchasedList().includes(course.id);
          const isCurrentSuccess = successId === course.id;

          return `
      <div class="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/40 overflow-hidden flex flex-col lg:flex-row transition-all hover:shadow-2xl hover:shadow-yellow-100/50">
        <div class="lg:w-2/5 relative min-h-[300px]">
          <img src="${escapeHtml(course.image)}" alt="${escapeHtml(
            course.title
          )}" class="absolute inset-0 w-full h-full object-cover" />
          <div class="absolute inset-0 bg-gradient-to-r from-slate-900/40 to-transparent"></div>
          <div class="absolute bottom-8 left-8">
            <span class="px-4 py-1.5 bg-white/95 backdrop-blur rounded-full text-xs font-black text-yellow-600 uppercase tracking-tighter">
              ${escapeHtml(course.duration)} Masterclass
            </span>
          </div>
        </div>

        <div class="lg:w-3/5 p-8 lg:p-12 flex flex-col justify-between">
          <div>
            <div class="flex flex-col sm:flex-row sm:items-start sm:justify-between sm:gap-4 mb-4">
              <h2 class="text-3xl font-black text-slate-900 leading-tight flex-1">${escapeHtml(
                course.title
              )}</h2>
              <div class="text-2xl font-black text-yellow-500 mt-2 sm:mt-0">${escapeHtml(
                course.price
              )}</div>
            </div>
            <p class="text-slate-500 text-lg mb-8 leading-relaxed max-w-xl">${escapeHtml(
              course.description
            )}</p>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
              ${modules
                .slice(0, 4)
                .map(
                  (mod) => `
                <div class="flex items-center space-x-3 text-slate-600">
                  <div class="w-5 h-5 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <svg class="w-3 h-3 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span class="text-sm font-semibold">${escapeHtml(mod)}</span>
                </div>
              `
                )
                .join("")}
            </div>

            <div class="flex items-center space-x-4 mb-8 p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <img src="https://ui-avatars.com/api/?name=${encodeQS(
                course.instructor
              )}&background=random" class="w-10 h-10 rounded-full" alt="${escapeHtml(
            course.instructor
          )}" />
              <div class="text-sm">
                <span class="block font-black text-slate-900">${escapeHtml(
                  course.instructor
                )}</span>
                <span class="text-slate-500">Industry Veteran</span>
              </div>
            </div>
          </div>

          <div class="flex flex-col sm:flex-row items-stretch gap-4">
            <a href="#/course/${escapeHtml(
              course.id
            )}" class="flex-1 py-4 sm:h-16 bg-yellow-50 text-yellow-700 rounded-2xl font-black text-lg hover:bg-yellow-500 hover:text-white transition-all duration-300 flex items-center justify-center space-x-2 group/details">
              <span class="relative">View Details</span>
              <svg class="w-5 h-5 transition-transform duration-300 group-hover/details:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </a>

            ${
              isCurrentSuccess
                ? `
            <div class="flex-[1.5] py-4 sm:h-16 bg-emerald-50 border border-emerald-100 px-6 rounded-2xl flex items-center justify-between">
              <div class="flex items-center space-x-3">
                <div class="w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <p class="font-black text-emerald-900 text-sm hidden sm:block">Purchased!</p>
              </div>
              <a href="#/signin" class="h-10 px-4 bg-emerald-600 text-white font-bold rounded-xl text-sm flex items-center hover:bg-emerald-700 transition-all">
                Sign In
              </a>
            </div>
            `
                : isOwned
                ? `
            <a href="#/dashboard" class="flex-[1.5] py-4 sm:h-16 flex items-center justify-center space-x-3 bg-slate-900 text-white rounded-2xl font-black text-lg hover:bg-slate-800 transition-all group shadow-xl">
              <span>Access Product</span>
              <svg class="w-5 h-5 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path d="M17 8l4 4m0 0l-4 4m4-4H3" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path>
              </svg>
            </a>
            `
                : `
            <button data-action="course-buy" data-course-id="${escapeHtml(course.id)}" ${
                    buyingId !== null ? "disabled" : ""
                  } class="flex-[1.5] py-4 sm:h-16 rounded-2xl font-black text-lg shadow-xl transition-all flex items-center justify-center space-x-3 ${
                    buyingId === course.id
                      ? "bg-yellow-400 text-white cursor-wait"
                      : "bg-yellow-500 text-white hover:bg-yellow-600 hover:shadow-yellow-200/50 hover:scale-[1.02] active:scale-95 shadow-yellow-100"
                  }">
              ${
                buyingId === course.id
                  ? `
                <svg class="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Securing...</span>
              `
                  : `<span>Enroll - ${escapeHtml(course.price)}</span>`
              }
            </button>
            `
            }
          </div>
        </div>
      </div>
      `;
        })
        .join("")}
    </div>
    `
        : renderComingSoon(level, wait)
    }
  </div>
</div>
`;
};

export default renderCoursePage;
