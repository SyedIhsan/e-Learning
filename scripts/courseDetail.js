import { escapeHtml, getPurchasedList, encodeQS } from "./helpers.js";
import STATE from "./state.js";
import { COURSES_DATA } from "../data/course.js";

const renderCourseDetail = (courseId) => {
    const user = STATE.user;
    const course = COURSES_DATA.find((c) => c.id === courseId);
    const modules = course && Array.isArray(course.modules) ? course.modules : [];

    if (!course) {
      return `
<div class="min-h-screen flex items-center justify-center p-8">
  <div class="text-center">
    <h1 class="text-3xl font-black text-slate-900 mb-4">Course Not Found</h1>
    <a href="#/" class="text-yellow-500 font-bold hover:underline">Return to Home</a>
  </div>
</div>`;
    }

    const isOwned =
      (user && user.purchasedCourses && user.purchasedCourses.includes(course.id)) ||
      getPurchasedList().includes(course.id);

    const buying = STATE.courseDetail.buying;
    const success = STATE.courseDetail.success;

    return `
<div class="bg-white min-h-screen">
  <section class="relative h-[60vh] min-h-[500px] flex items-end">
    <img src="${escapeHtml(course.image)}" alt="${escapeHtml(course.title)}" class="absolute inset-0 w-full h-full object-cover" />
    <div class="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent"></div>
    <div class="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16 w-full">
      <div class="max-w-3xl">
        <nav class="flex items-center space-x-2 text-yellow-500 text-sm font-black uppercase tracking-widest mb-6">
          <a href="#/" class="hover:text-white transition-colors">Home</a>
          <span>/</span>
          <a href="#/${course.level.toLowerCase()}" class="hover:text-white transition-colors">${escapeHtml(course.level)} Path</a>
        </nav>
        <h1 class="text-5xl md:text-7xl font-black text-white mb-6 leading-tight">${escapeHtml(course.title)}</h1>
        <div class="flex flex-wrap items-center gap-6 text-slate-300">
          <div class="flex items-center space-x-2">
            <svg class="w-5 h-5 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M12 8v4l3 3" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path></svg>
            <span class="font-bold">${escapeHtml(course.duration)}</span>
          </div>
          <div class="flex items-center space-x-2">
            <svg class="w-5 h-5 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h10a2 2 0 012 2v14a2 2 0 01-2 2z" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path></svg>
            <span class="font-bold">${modules.length} Detailed Modules</span>
          </div>
          <div class="flex items-center space-x-2">
            <svg class="w-5 h-5 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path></svg>
            <span class="font-bold">Led by ${escapeHtml(course.instructor)}</span>
          </div>
        </div>
      </div>
    </div>
  </section>

  <section class="py-20">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="grid lg:grid-cols-3 gap-16">

        <div class="lg:col-span-2 space-y-16">
          <div>
            <h2 class="text-3xl font-black text-slate-900 mb-8 pb-4 border-b-4 border-yellow-500 inline-block">Course Introduction</h2>
            <div class="prose prose-slate prose-lg max-w-none">
              <p class="text-xl text-slate-600 leading-relaxed mb-6">
                ${escapeHtml(course.description)} This comprehensive curriculum is the result of years of industry experience, designed specifically to help you bridge the gap between theory and real-world execution.
              </p>
              <p class="text-slate-600 leading-relaxed">
                Throughout this course, you will not only learn the technical syntax but also the underlying architecture that separates junior developers from senior engineers. We focus on best practices, scalability, and performance-driven development.
              </p>
            </div>
          </div>

          <div>
            <h2 class="text-3xl font-black text-slate-900 mb-10">What's Inside the Curriculum?</h2>
            <div class="grid gap-6">
              ${modules
                .map(
                  (mod, i) => `
                <div class="group flex items-start space-x-6 p-8 bg-slate-50 rounded-3xl border border-slate-100 transition-all hover:bg-white hover:shadow-xl hover:shadow-yellow-50 hover:-translate-y-1">
                  <div class="flex-shrink-0 w-12 h-12 bg-yellow-500 text-white rounded-2xl flex items-center justify-center font-black text-xl shadow-lg shadow-yellow-100">${i + 1}</div>
                  <div>
                    <h4 class="text-xl font-black text-slate-900 mb-2">${escapeHtml(mod)}</h4>
                    <p class="text-slate-500 leading-relaxed">
                      Deep dive into the core principles of ${escapeHtml(mod.toLowerCase())}. We'll explore advanced patterns, common pitfalls, and architectural standards used at top tech companies.
                    </p>
                  </div>
                </div>`
                )
                .join("")}
            </div>
          </div>

          <div class="bg-slate-900 rounded-[3rem] p-12 text-white overflow-hidden relative">
            <div class="relative z-10">
              <h3 class="text-2xl font-black mb-10">Interactive Learning Materials</h3>
              <div class="grid md:grid-cols-3 gap-8">
                <div class="p-6 bg-white/5 rounded-2xl border border-white/10 backdrop-blur-sm">
                  <div class="text-yellow-500 mb-4">
                    <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path></svg>
                  </div>
                  <h4 class="font-black text-xl mb-2">Video Masterclasses</h4>
                  <p class="text-sm text-slate-400">Over ${course.content.videos.length} high-definition video modules with interactive timestamps.</p>
                </div>

                <div class="p-6 bg-white/5 rounded-2xl border border-white/10 backdrop-blur-sm">
                  <div class="text-yellow-500 mb-4">
                    <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5s3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path></svg>
                  </div>
                  <h4 class="font-black text-xl mb-2">Detailed E-Books</h4>
                  <p class="text-sm text-slate-400">Lifetime access to ${course.content.ebooks.length} premium digital guides and cheat sheets.</p>
                </div>

                <div class="p-6 bg-white/5 rounded-2xl border border-white/10 backdrop-blur-sm">
                  <div class="text-yellow-500 mb-4">
                    <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path></svg>
                  </div>
                  <h4 class="font-black text-xl mb-2">Interactive Workbooks</h4>
                  <p class="text-sm text-slate-400">Practice your skills with ${course.content.workbooks.length} custom-built automated Google Sheet workbooks.</p>
                </div>
              </div>
            </div>
            <div class="absolute top-0 right-0 w-64 h-64 bg-yellow-500/10 rounded-full blur-[80px] -mr-32 -mt-32"></div>
          </div>
        </div>

        <div class="lg:col-span-1">
          <div class="sticky top-28 space-y-8">
            <div class="bg-white rounded-[2.5rem] border border-slate-100 shadow-2xl shadow-slate-200/60 p-10 overflow-hidden relative">
              <div class="relative z-10">
                <div class="flex items-center justify-between mb-8">
                  <span class="text-sm font-black text-slate-400 uppercase tracking-widest">Enrollment Fee</span>
                  <span class="px-3 py-1 bg-green-100 text-green-700 text-[10px] font-black rounded-full">ONE-TIME ACCESS</span>
                </div>
                <div class="text-5xl font-black text-slate-900 mb-2">RM${escapeHtml(course.price)}</div>
                <p class="text-slate-500 text-sm font-medium mb-10">Instant digital delivery. Lifetime platform access.</p>

                <div class="space-y-4 mb-10">
                  ${[
                    "Certificate of Completion",
                    "Source Code Access",
                    "Expert Instructor Support",
                    "Mobile-Ready Dashboard",
                    "Interactive Workbook Suite",
                  ]
                    .map(
                      (feature) => `
                  <div class="flex items-center space-x-3 text-slate-600 font-semibold">
                    <svg class="w-5 h-5 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"></path></svg>
                    <span class="text-sm">${escapeHtml(feature)}</span>
                  </div>`
                    )
                    .join("")}
                </div>

                ${
                  success
                    ? `
                <div class="space-y-4">
                  <div class="bg-emerald-50 border border-emerald-100 p-6 rounded-2xl text-center">
                    <p class="text-emerald-900 font-black mb-1">Enrollment Successful!</p>
                    <p class="text-xs text-emerald-600">ID: ${escapeHtml(course.id.toUpperCase())}-ACCESS</p>
                  </div>
                  <a href="#/signin" class="w-full py-5 bg-yellow-500 text-white rounded-2xl font-black text-xl hover:bg-yellow-600 shadow-xl shadow-yellow-100 transition-all flex items-center justify-center space-x-2">
                    Sign In to Start
                  </a>
                </div>
                `
                    : isOwned
                    ? `
                <a href="#/dashboard" class="w-full py-5 bg-slate-900 text-white rounded-2xl font-black text-xl hover:bg-slate-800 shadow-xl transition-all flex items-center justify-center space-x-2">
                  Launch Dashboard
                </a>
                `
                    : `
                <button data-action="detail-buy" data-course-id="${escapeHtml(course.id)}" ${
                  buying ? "disabled" : ""
                } class="w-full py-6 md:py-5 rounded-2xl font-black text-xl shadow-2xl transition-all flex items-center justify-center space-x-3 ${
                  buying
                    ? "bg-yellow-400 text-white cursor-wait"
                    : "bg-yellow-500 text-white hover:bg-yellow-600 hover:scale-105 shadow-yellow-200"
                }">
                  ${
                    buying
                      ? `
                    <svg class="animate-spin h-6 w-6 text-white" fill="none" viewBox="0 0 24 24">
                      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Processing...</span>
                  `
                      : `<span>Buy Course Now</span>`
                  }
                </button>
                `
                }
              </div>
              <div class="absolute top-0 right-0 w-32 h-32 bg-yellow-50 rounded-full -mr-16 -mt-16"></div>
            </div>

            <div class="bg-slate-50 rounded-3xl p-8 border border-slate-100 text-center">
              <div class="flex items-center justify-center space-x-4 mb-4">
                <img src="https://ui-avatars.com/api/?name=Sarah+J&background=random" class="w-12 h-12 rounded-full ring-2 ring-white" alt="User" />
                <img src="https://ui-avatars.com/api/?name=Mike+C&background=random" class="w-12 h-12 rounded-full ring-2 ring-white -ml-4" alt="User" />
                <img src="https://ui-avatars.com/api/?name=Elena+R&background=random" class="w-12 h-12 rounded-full ring-2 ring-white -ml-4" alt="User" />
                <div class="w-12 h-12 bg-white rounded-full flex items-center justify-center text-xs font-black text-slate-400 ring-2 ring-white -ml-4 shadow-sm">+1k</div>
              </div>
              <p class="text-slate-500 text-sm font-semibold">Join 1,200+ students who mastered ${escapeHtml(course.title)} this year.</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  </section>

  <section class="py-24 bg-slate-50">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="bg-white rounded-[3rem] p-12 md:p-20 shadow-xl shadow-slate-200/50 flex flex-col md:flex-row items-center gap-16">
        <div class="md:w-1/3">
          <img src="https://ui-avatars.com/api/?name=${encodeQS(course.instructor)}&size=512&background=eab308&color=fff" class="w-full aspect-square object-cover rounded-[2.5rem] shadow-2xl shadow-yellow-100" alt="${escapeHtml(course.instructor)}" />
        </div>
        <div class="md:w-2/3">
          <span class="text-yellow-500 font-black uppercase tracking-widest text-sm mb-4 block">Meet Your Instructor</span>
          <h2 class="text-4xl md:text-5xl font-black text-slate-900 mb-6">${escapeHtml(course.instructor)}</h2>
          <p class="text-xl text-slate-500 leading-relaxed mb-8 italic">
            "My mission is to transform students into top-tier engineers by teaching not just the 'how', but the 'why' behind modern software architecture."
          </p>
          <div class="grid grid-cols-2 gap-8">
            <div>
              <div class="text-2xl font-black text-slate-900">10+ Years</div>
              <div class="text-slate-400 text-sm font-bold">Experience</div>
            </div>
            <div>
              <div class="text-2xl font-black text-slate-900">50k+</div>
              <div class="text-slate-400 text-sm font-bold">Global Students</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>

  <section class="py-20 border-t border-slate-100">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex flex-wrap justify-center items-center gap-12 grayscale opacity-40">
        <div class="text-2xl font-black text-slate-900">STRIPE</div>
        <div class="text-2xl font-black text-slate-900">GOOGLE</div>
        <div class="text-2xl font-black text-slate-900">AWS</div>
        <div class="text-2xl font-black text-slate-900">MICROSOFT</div>
        <div class="text-2xl font-black text-slate-900">DIGITALOCEAN</div>
      </div>
    </div>
  </section>
</div>
`;
  };

export default renderCourseDetail;
