import { escapeHtml } from "./helpers.js";
import STATE from "./state.js";
import { COURSES, CourseLevel } from "../data/course.js";

const renderDashboard = () => {
    const user = STATE.user;

    // Safety check - dashboard should only be accessed by logged-in users
    if (!user) {
      return `<div class="p-20 text-center">Please log in to access your dashboard.</div>`;
    }

    const filters = ["All", CourseLevel.BEGINNER, CourseLevel.INTERMEDIATE, CourseLevel.ADVANCED];
    const filter = STATE.dashboard.filter;

    const getExploreLinkProps = (currentFilter) => {
      const f = String(currentFilter || "").toLowerCase();

      // All -> go home + auto scroll to #learning-tracks (same as footer)
      if (f === "all") {
        return { href: "#/", scroll: "learning-tracks" };
      }

      // Level-specific tracks
      if (f.includes("beginner")) return { href: "#/beginner" };
      if (f.includes("intermediate")) return { href: "#/intermediate" };
      if (f.includes("advanced")) return { href: "#/advanced" };

      // Fallback
      return { href: "#/" };
    };

    const { href: exploreHref, scroll: exploreScroll } = getExploreLinkProps(filter);

  const purchasedCourses = Object.values(COURSES).filter((course) =>
    user.purchasedCourses.includes(course.id)
  );

  const filteredCourses =
    filter === "All"
      ? purchasedCourses
      : purchasedCourses.filter((course) => course.level === filter);

    return `
<div class="bg-slate-50 min-h-screen py-16 overflow-x-hidden">
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <header class="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
      <div>
        <h1 class="text-3xl font-black text-slate-900 mb-2">My Learning Space</h1>
        <p class="text-slate-500">Welcome back, Student ID: <span class="text-yellow-500 font-bold">${escapeHtml(
          user.id
        )}</span></p>
      </div>

      <div class="flex bg-slate-200/50 p-1.5 rounded-2xl border border-slate-200 self-center md:self-auto overflow-x-auto whitespace-nowrap w-full max-w-full md:w-auto min-w-0 touch-pan-x justify-center">
        ${filters
          .map(
            (f) => `
          <button data-action="dashboard-filter" data-filter="${escapeHtml(f)}" class="flex-shrink-0 min-w-max px-4 sm:px-6 py-2 text-xs sm:text-sm font-black rounded-xl transition-all ${
              filter === f
                ? "bg-white text-yellow-500 shadow-sm"
                : "text-slate-500 hover:text-slate-900"
            }">${escapeHtml(f)}</button>`
          )
          .join("")}
      </div>
    </header>

    ${
      filteredCourses.length > 0
        ? `
    <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
      ${filteredCourses
        .map(
          (course) => `
      <div class="bg-white rounded-3xl overflow-hidden border border-slate-100 shadow-xl shadow-slate-200/40 group flex flex-col">
        <div class="relative h-48 overflow-hidden">
          <img src="${escapeHtml(course.image)}" alt="${escapeHtml(
            course.title
          )}" class="w-full h-full object-cover transition-transform group-hover:scale-105 duration-500" />
          <div class="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors"></div>
          <div class="absolute top-4 left-4">
            <span class="bg-white/90 backdrop-blur px-3 py-1 rounded-full text-[10px] font-black uppercase text-yellow-600">${escapeHtml(
              course.level
            )}</span>
          </div>
        </div>
        <div class="p-6 flex flex-col flex-grow">
          <h3 class="text-xl font-bold text-slate-900 mb-2">${escapeHtml(
            course.title
          )}</h3>
          <p class="text-slate-500 text-sm mb-6 line-clamp-2">Continue your learning journey where you left off.</p>
          <div class="space-y-3 mb-6 flex-grow">
            <div class="flex items-center text-xs text-slate-400 font-medium space-x-2">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path></svg>
              <span>HD Video Content</span>
            </div>
            <div class="flex items-center text-xs text-slate-400 font-medium space-x-2">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5s3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path></svg>
              <span>Interactive Ebook</span>
            </div>
          </div>
          <a href="#/course-content/${escapeHtml(
            course.id
          )}" class="block w-full text-center py-4 bg-yellow-500 text-white font-bold rounded-2xl hover:bg-yellow-600 transition-all shadow-lg shadow-yellow-100">
            Launch Course
          </a>
        </div>
      </div>
      `
        )
        .join("")}
    </div>
    `
        : `
    <div class="bg-white rounded-[3rem] p-16 text-center border border-dashed border-slate-200">
      <div class="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-8">
        <svg class="w-12 h-12 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M12 6v6m0 0v6m0-6h6m-6 0H6" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path></svg>
      </div>
      <h2 class="text-2xl font-bold text-slate-900 mb-2">${
        filter === "All" ? "No courses found" : `No ${escapeHtml(filter)} courses found`
      }</h2>
      <p class="text-slate-500 mb-8 max-w-sm mx-auto">${
        filter === "All"
          ? "Purchase your first course to unlock exclusive videos, ebooks, and workbooks."
          : `You haven't enrolled in any ${escapeHtml(String(filter).toLowerCase())} tracks yet.`
      }</p>
      <a
        href="${escapeHtml(exploreHref)}"
        ${exploreScroll ? `data-scroll="${escapeHtml(exploreScroll)}"` : ""}
        class="inline-block px-8 py-4 bg-yellow-500 text-white font-bold rounded-2xl"
      >
        Explore Courses
      </a>
    </div>
    `
    }
  </div>
</div>
`;
  };

export default renderDashboard;