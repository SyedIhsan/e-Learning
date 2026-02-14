// admin/scripts/courses.js
// Static demo Courses admin page.
// - UI classes/DOM match courses.php
// - Seeds from /data/course.js, then persists edits in localStorage

// ------------------------------
// Utilities
// ------------------------------
const year = document.getElementById("year");
if (year) year.textContent = String(new Date().getFullYear());

const esc = (s) => String(s ?? "")
  .replaceAll("&", "&amp;")
  .replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;")
  .replaceAll('"', "&quot;")
  .replaceAll("'", "&#039;");

const nl2br = (s) => esc(s).replaceAll("\n", "<br>");

const normalizePriceString = (p) => {
  const s = String(p ?? "").trim();
  if (!s) return "";
  const cleaned = s.replace(/[^\d.]/g, "");
  return cleaned || "";
};

const showSuccess = (msg) => {
  const box = document.getElementById("successBox");
  if (!box) return;
  box.textContent = msg || "";
  box.classList.toggle("hidden", !msg);
};

const showErrors = (arr) => {
  const wrap = document.getElementById("errorBox");
  const ul = document.getElementById("errorList");
  if (!wrap || !ul) return;
  ul.innerHTML = "";
  (arr || []).forEach((er) => {
    const li = document.createElement("li");
    li.textContent = String(er);
    ul.appendChild(li);
  });
  wrap.classList.toggle("hidden", !(arr && arr.length));
};

const qs = (key) => (new URLSearchParams(location.search).get(key) || "").trim();

const setQS = (patch = {}) => {
  const url = new URL(location.href);
  for (const [k, v] of Object.entries(patch)) {
    const val = String(v ?? "").trim();
    if (val) url.searchParams.set(k, val);
    else url.searchParams.delete(k);
  }
  history.replaceState({}, "", url.toString());
};

// ------------------------------
// Module loader helper
// ------------------------------
const importFirst = async (paths) => {
  let lastErr = null;
  for (const p of paths) {
    try {
      return await import(new URL(p, import.meta.url));
    } catch (e) {
      lastErr = e;
    }
  }
  console.error(lastErr);
  throw lastErr || new Error("Cannot import module");
};

// ------------------------------
// Load courses from shared student data
// ------------------------------
const courseMod = await importFirst([
  "../../data/course.js", // expected: /admin/scripts -> /data
  "../data/course.js",     // fallback
]);

const { loadCoursesFromDB, getCoursesArray } = courseMod;
await loadCoursesFromDB();

// ------------------------------
// Instructors (datalist suggestions)
// ------------------------------
let instructorNames = [];
try {
  const instMod = await importFirst(["../../scripts/instructors.js"]);

  // Prefer a named export
  if (Array.isArray(instMod.INSTRUCTORS)) {
    instructorNames = instMod.INSTRUCTORS.map((x) => x?.name).filter(Boolean);
  }
} catch {
  instructorNames = [];
}

const dl = document.getElementById("instructorList");
if (dl && instructorNames.length) {
  dl.innerHTML = instructorNames.map((n) => `<option value="${esc(n)}"></option>`).join("");
}

// ------------------------------
// LocalStorage store
// ------------------------------
const STORE_KEY = "sdc_courses_v1";

// IMPORTANT:
// Kalau kau ubah DEMO list dalam /data/course.js dan kau nak admin page auto ambil data baru,
// simply tukar SEED_VERSION ni (bump string dia). Ini akan force reseed & override data lama dalam localStorage.
const SEED_VERSION = "2026-02-13";
const SEED_VERSION_KEY = `${STORE_KEY}__seed_version`;

const readJSON = (k, fallback) => {
  try {
    return JSON.parse(localStorage.getItem(k) || "");
  } catch {
    return fallback;
  }
};

const writeJSON = (k, v) => localStorage.setItem(k, JSON.stringify(v));

const normalizeCourse = (c = {}) => {
  const out = { ...(c || {}) };
  out.id = String(out.id || "").trim();
  out.level = String(out.level || "Beginner").trim();
  out.title = String(out.title || "").trim();
  out.description = String(out.description || "");
  out.price = normalizePriceString(out.price);
  out.duration = String(out.duration || "").trim();
  out.instructor = String(out.instructor || "").trim();
  out.image = String(out.image || "").trim();
  out.created_at = out.created_at ? String(out.created_at) : new Date().toISOString();
  out.updated_at = out.updated_at ? String(out.updated_at) : out.created_at;
  // keep content if exists
  if (out.content && typeof out.content !== "object") delete out.content;
  return out;
};

const seedFromCourseJS = () => {
  const base = getCoursesArray().map((c, i) => {
    // fake created_at so sort feels like SQL ORDER BY created_at DESC
    const t = Date.now() - i * 1000;
    const iso = new Date(t).toISOString();
    return normalizeCourse({ ...c, created_at: iso, updated_at: iso });
  });
  writeJSON(STORE_KEY, base);
  localStorage.setItem(SEED_VERSION_KEY, SEED_VERSION);
  return base;
};

const seedIfNeeded = () => {
  const prevVer = localStorage.getItem(SEED_VERSION_KEY);
  const existing = readJSON(STORE_KEY, null);

  // 1) first-time / corrupted store
  // 2) version bump -> force reseed (ini jawapan untuk "still showing data lama")
  if (prevVer !== SEED_VERSION || !Array.isArray(existing)) {
    return seedFromCourseJS();
  }

  // Optional safety: kalau course.js ada course baru, add into store tanpa overwrite admin edits
  const list = existing.map(normalizeCourse);
  const byId = new Set(list.map((x) => x.id));
  let changed = false;
  for (const c of getCoursesArray()) {
    if (c?.id && !byId.has(c.id)) {
      list.push(normalizeCourse({ ...c, created_at: new Date().toISOString(), updated_at: new Date().toISOString() }));
      changed = true;
    }
  }
  if (changed) writeJSON(STORE_KEY, list);

  return list;
};

const getAllCourses = () => seedIfNeeded();

const saveCourses = (arr) => {
  const out = (arr || []).map(normalizeCourse);
  writeJSON(STORE_KEY, out);
  return out;
};

const upsertCourse = (course) => {
  const c = normalizeCourse(course);
  if (!c.id) return;

  const list = getAllCourses();
  const idx = list.findIndex((x) => x.id === c.id);

  if (idx >= 0) {
    c.created_at = list[idx].created_at || c.created_at;
    c.updated_at = new Date().toISOString();
    list[idx] = { ...list[idx], ...c };
  } else {
    c.created_at = new Date().toISOString();
    c.updated_at = c.created_at;
    list.unshift(c);
  }

  saveCourses(list);
};

const deleteCourse = (id) => {
  const list = getAllCourses().filter((c) => c.id !== id);
  saveCourses(list);

  // also delete its content if any (best-effort across keys)
  const keys = ["sdc_admin_contents_store_v1", "sdc_contents_v1", "sdc_contents_store_v1"]; // align with your other pages
  for (const k of keys) {
    const obj = readJSON(k, null);
    if (obj && typeof obj === "object" && !Array.isArray(obj) && obj[id]) {
      delete obj[id];
      writeJSON(k, obj);
    }
  }
};

// ------------------------------
// Render (match courses.php markup)
// ------------------------------
const cardHTML = (c) => {
  return `
    <div class="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/40 overflow-hidden">
      <div class="flex flex-col md:flex-row">
        <div class="md:w-2/5 relative min-h-[220px]">
          <img src="${esc(c.image)}" class="absolute inset-0 w-full h-full object-cover" alt="">
          <div class="absolute inset-0 bg-gradient-to-r from-slate-900/50 to-transparent"></div>
          <div class="absolute bottom-4 left-4">
            <span class="px-3 py-1.5 bg-white/95 rounded-full text-xs font-black text-yellow-600 uppercase tracking-tighter">${esc(c.duration)}</span>
          </div>
        </div>

        <div class="md:w-3/5 p-8 flex flex-col gap-4">
          <div class="flex items-start justify-between gap-4">
            <div>
              <div class="text-[10px] font-black uppercase tracking-widest text-slate-400">${esc(c.level)} • ${esc(c.id)}</div>
              <h3 class="text-2xl font-black text-slate-900">${esc(c.title)}</h3>
              <p class="text-slate-500 mt-2">${nl2br(c.description)}</p>
            </div>
            <div class="text-2xl font-black text-yellow-500">RM${esc(c.price)}</div>
          </div>

          <div class="flex flex-wrap gap-3">
            <a href="course_edit.html?id=${encodeURIComponent(c.id)}" class="px-5 py-3 bg-yellow-50 text-yellow-700 rounded-2xl font-black hover:bg-yellow-500 hover:text-white transition">
              Edit
            </a>
            <a href="contents.html?course_id=${encodeURIComponent(c.id)}" class="px-5 py-3 bg-slate-900 text-white rounded-2xl font-black hover:bg-slate-800 transition">
              Content
            </a>
            <form data-del-form="1" data-course-id="${esc(c.id)}">
              <button class="px-5 py-3 bg-white border border-red-200 text-red-600 rounded-2xl font-black hover:bg-red-50 transition">
                Delete
              </button>
            </form>
          </div>

          <div class="text-xs text-slate-400 font-semibold">Instructor: ${esc(c.instructor)}</div>
        </div>
      </div>
    </div>
  `;
};

const render = () => {
  // hydrate filter inputs from URL (like PHP)
  const q = qs("q");
  const level = qs("level") || "All";

  const qEl = document.getElementById("q");
  const levelEl = document.getElementById("level");
  if (qEl) qEl.value = q;
  if (levelEl) levelEl.value = ["All", "Beginner", "Intermediate", "Advanced"].includes(level) ? level : "All";

  let courses = getAllCourses();

  // mimic SQL ORDER BY created_at DESC
  courses = courses
    .slice()
    .sort((a, b) => String(b.created_at || "").localeCompare(String(a.created_at || "")));

  if (level !== "All" && ["Beginner", "Intermediate", "Advanced"].includes(level)) {
    courses = courses.filter((c) => c.level === level);
  }

  if (q) {
    const qq = q.toLowerCase();
    courses = courses.filter((c) =>
      (c.id || "").toLowerCase().includes(qq) ||
      (c.title || "").toLowerCase().includes(qq) ||
      (c.instructor || "").toLowerCase().includes(qq)
    );
  }

  const cards = document.getElementById("courseCards");
  const empty = document.getElementById("emptyState");
  if (!cards || !empty) return;

  if (!courses.length) {
    empty.classList.remove("hidden");
    cards.innerHTML = "";
    return;
  }

  empty.classList.add("hidden");
  cards.innerHTML = courses.map(cardHTML).join("");

  // bind delete confirms like PHP
  cards.querySelectorAll('form[data-del-form="1"]').forEach((form) => {
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const id = form.getAttribute("data-course-id") || "";
      if (!id) return;
      if (!confirm(`Delete course ${id} ? This also deletes its content.`)) return;
      deleteCourse(id);
      showErrors([]);
      showSuccess("Course deleted.");
      render();
    });
  });
};

// ------------------------------
// Events
// ------------------------------
document.getElementById("filterForm")?.addEventListener("submit", (e) => {
  e.preventDefault();
  const q = (document.getElementById("q")?.value || "").trim();
  const level = (document.getElementById("level")?.value || "All").trim();
  setQS({ q, level: level === "All" ? "" : level });
  showSuccess("");
  showErrors([]);
  render();
});

document.getElementById("createForm")?.addEventListener("submit", (e) => {
  e.preventDefault();

  const id = (document.getElementById("c_id")?.value || "").trim();
  const level = (document.getElementById("c_level")?.value || "").trim();
  const title = (document.getElementById("c_title")?.value || "").trim();
  const description = (document.getElementById("c_desc")?.value || "").trim();
  const price = (document.getElementById("c_price")?.value || "").trim();
  const duration = (document.getElementById("c_duration")?.value || "").trim();
  const instructor = (document.getElementById("c_instructor")?.value || "").trim();
  const image = (document.getElementById("c_image")?.value || "").trim();

  const errors = [];
  if (!id || !title || !description || !price || !duration || !instructor || !image) {
    errors.push("All fields are required.");
  }
  if (!['Beginner', 'Intermediate', 'Advanced'].includes(level)) {
    errors.push("Invalid level.");
  }
  if (getAllCourses().some((c) => c.id === id)) {
    errors.push("Failed to create. Maybe duplicate course id?");
  }

  if (errors.length) {
    showSuccess("");
    showErrors(errors);
    return;
  }

  upsertCourse({ id, level, title, description, price, duration, instructor, image });
  showErrors([]);
  showSuccess("Course created.");
  e.target.reset();
  render();
});

// first paint
render();
