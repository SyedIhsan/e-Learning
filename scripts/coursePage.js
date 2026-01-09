import { escapeHtml, getPurchasedList, encodeQS } from "./helpers.js";
import STATE from "./state.js";
import { COURSES_DATA } from "../data/course.js";

const renderCoursePage = (level) => {
    const user = STATE.user;
    const buyingId = STATE.coursePage.buyingId || null;
    const successId = STATE.coursePage.successId || null;
    const coursesForLevel = COURSES_DATA.filter(
      (c) => c.level.toLowerCase() === level
    );

    return `
<div class="bg-slate-50 min-h-screen pb-24">
  <div class="bg-white border-b border-slate-200 py-16 mb-12">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
      <nav class="flex items-center justify-center space-x-2 text-sm text-slate-400 mb-6 uppercase font-bold tracking-widest">
        <a href="#/" class="hover:text-yellow-500 transition-colors">Home</a>
        <span>/</span>
        <span class="text-yellow-500">${escapeHtml(level)} Track</span>
      </nav>
      <h1 class="text-4xl md:text-6xl font-black text-slate-900 mb-4 capitalize">${escapeHtml(level)} Learning Path</h1>
      <p class="max-w-2xl mx-auto text-lg text-slate-500">
        Expert-curated curriculum designed to take you from absolute zero to job-ready expertise in ${escapeHtml(level)} concepts.
      </p>
    </div>
  </div>

  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
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
          <img src="${escapeHtml(course.image)}" alt="${escapeHtml(course.title)}" class="absolute inset-0 w-full h-full object-cover" />
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
              <h2 class="text-3xl font-black text-slate-900 leading-tight flex-1">${escapeHtml(course.title)}</h2>
              <div class="text-2xl font-black text-yellow-500 mt-2 sm:mt-0">${escapeHtml(course.price)}</div>
            </div>
            <p class="text-slate-500 text-lg mb-8 leading-relaxed max-w-xl">${escapeHtml(course.description)}</p>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
              ${modules.slice(0, 4).map((mod) => `
                <div class="flex items-center space-x-3 text-slate-600">
                  <div class="w-5 h-5 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <svg class="w-3 h-3 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span class="text-sm font-semibold">${escapeHtml(mod)}</span>
                </div>
              `).join("")}
            </div>

            <div class="flex items-center space-x-4 mb-8 p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <img src="https://ui-avatars.com/api/?name=${encodeQS(course.instructor)}&background=random" class="w-10 h-10 rounded-full" alt="${escapeHtml(course.instructor)}" />
              <div class="text-sm">
                <span class="block font-black text-slate-900">${escapeHtml(course.instructor)}</span>
                <span class="text-slate-500">Industry Veteran</span>
              </div>
            </div>
          </div>

          <div class="flex flex-col sm:flex-row items-stretch gap-4">
            <a href="#/course/${escapeHtml(course.id)}" class="flex-1 py-4 sm:h-16 bg-yellow-50 text-yellow-700 rounded-2xl font-black text-lg hover:bg-yellow-500 hover:text-white transition-all duration-300 flex items-center justify-center space-x-2 group/details">
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
  </div>
</div>
`;
  };

export default renderCoursePage;
