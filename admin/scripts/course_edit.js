// Admin Edit Course (static) — match course_edit.php UI
// Uses same LocalStorage store as courses.js so edits reflect back on Courses page.

// ------------------------------
// Shared store (same as courses.js)
// ------------------------------
const STORE_KEY = "sdc_courses_v1";

// Bump this ONLY when you change seed data in ../../data/course.js
// (This forces reseed so you don't keep seeing old localStorage data.)
const COURSE_SEED_VERSION = "v2";
const COURSE_SEED_VER_KEY = `${STORE_KEY}__seed_ver`;

const year = document.getElementById("year");
if (year) year.textContent = String(new Date().getFullYear());

const readJSON = (k, fallback) => {
  try { return JSON.parse(localStorage.getItem(k) || ""); } catch { return fallback; }
};
const writeJSON = (k, v) => localStorage.setItem(k, JSON.stringify(v));

const qs = (key) => (new URLSearchParams(location.search).get(key) || "").trim();

const normalizePriceString = (p) => {
  const s = String(p ?? "").trim();
  if (!s) return "";
  const cleaned = s.replace(/[^\d.]/g, "");
  return cleaned || "";
};

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
  if (out.content && typeof out.content !== "object") delete out.content;
  return out;
};

// ------------------------------
// Load seed from ../../data/course.js
// ------------------------------
const importFirst = async (paths) => {
  let lastErr = null;
  for (const p of paths) {
    try { return await import(new URL(p, import.meta.url)); }
    catch (e) { lastErr = e; }
  }
  console.error(lastErr);
  throw lastErr || new Error("Cannot import course.js");
};

const courseMod = await importFirst(["../../data/course.js"]);
const { loadCoursesFromDB, getCoursesArray } = courseMod;
await loadCoursesFromDB();

const seedIfNeeded = () => {
  const existing = readJSON(STORE_KEY, null);
  const curVer = localStorage.getItem(COURSE_SEED_VER_KEY) || "";

  // reseed when:
  // - store missing/invalid
  // - seed version bumped (to clear old data)
  if (!Array.isArray(existing) || curVer !== COURSE_SEED_VERSION) {
    const base = getCoursesArray().map((c, i) => {
      const t = Date.now() - (i * 1000);
      return normalizeCourse({
        ...c,
        created_at: new Date(t).toISOString(),
        updated_at: new Date(t).toISOString(),
      });
    });
    writeJSON(STORE_KEY, base);
    localStorage.setItem(COURSE_SEED_VER_KEY, COURSE_SEED_VERSION);
    return base;
  }

  return existing.map(normalizeCourse);
};

const getAllCourses = () => seedIfNeeded();

const saveCourses = (arr) => {
  const out = (arr || []).map(normalizeCourse);
  writeJSON(STORE_KEY, out);
  return out;
};

const getCourse = (id) => getAllCourses().find(c => c.id === id) || null;

const upsertCourse = (course) => {
  const c = normalizeCourse(course);
  if (!c.id) return;

  const list = getAllCourses();
  const idx = list.findIndex(x => x.id === c.id);

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

// ------------------------------
// UI helpers (match PHP blocks)
// ------------------------------
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
  (arr || []).forEach(er => {
    const li = document.createElement("li");
    li.textContent = String(er);
    ul.appendChild(li);
  });

  wrap.classList.toggle("hidden", !(arr && arr.length));
};

const disableForm = () => {
  const form = document.getElementById("editForm");
  if (!form) return;
  form.classList.add("opacity-50", "pointer-events-none");
};

// ------------------------------
// Boot
// ------------------------------
document.addEventListener("DOMContentLoaded", () => {
  // seed store once on this page too
  seedIfNeeded();

  const id = qs("id");
  if (!id) {
    location.href = "courses.html";
    return;
  }

  const course = getCourse(id);
  if (!course) {
    showSuccess("");
    showErrors(["Course not found. Try from Courses page."]);
    disableForm();
    return;
  }

  // match PHP title behaviour
  document.title = `Edit Course ${course.id}`;

  const meta = document.getElementById("meta");
  if (meta) meta.textContent = `${course.level} • ${course.id}`;

  const btnContent = document.getElementById("btnContent");
  if (btnContent) btnContent.href = `contents.html?course_id=${encodeURIComponent(course.id)}`;

  // fill
  document.getElementById("level").value = course.level;
  document.getElementById("title").value = course.title;
  document.getElementById("description").value = course.description;
  document.getElementById("price").value = course.price;
  document.getElementById("duration").value = course.duration;
  document.getElementById("instructor").value = course.instructor;
  document.getElementById("image").value = course.image;

  document.getElementById("editForm").addEventListener("submit", (e) => {
    e.preventDefault();

    const updated = {
      ...course,
      level: (document.getElementById("level").value || "").trim(),
      title: (document.getElementById("title").value || "").trim(),
      description: (document.getElementById("description").value || "").trim(),
      price: (document.getElementById("price").value || "").trim(),
      duration: (document.getElementById("duration").value || "").trim(),
      instructor: (document.getElementById("instructor").value || "").trim(),
      image: (document.getElementById("image").value || "").trim(),
      updated_at: new Date().toISOString(),
    };

    const errors = [];
    if (!['Beginner','Intermediate','Advanced'].includes(updated.level)) errors.push('Invalid level.');
    if (!updated.title || !updated.description || !updated.price || !updated.duration || !updated.instructor || !updated.image) {
      errors.push('All fields are required.');
    }

    if (errors.length) {
      showSuccess("");
      showErrors(errors);
      return;
    }

    upsertCourse(updated);

    // re-read latest so meta reflects new level
    const fresh = getCourse(course.id) || updated;
    if (meta) meta.textContent = `${fresh.level} • ${fresh.id}`;

    showErrors([]);
    showSuccess("Saved.");
  });
});
