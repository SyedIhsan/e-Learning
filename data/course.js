// Dynamic course catalog (loaded from DB via PHP API)
// Goal: keep existing app code working with minimal edits.
// Exports:
// - CourseLevel (enum-like)
// - COURSES (map by id)
// - COURSES_DATA (array view, for pages that iterate/filter)
// - loadCoursesFromDB()
// - getCoursesArray(), getCourseById()

export const CourseLevel = {
  BEGINNER: "Beginner",
  INTERMEDIATE: "Intermediate",
  ADVANCED: "Advanced",
};

export const COURSES = {};      // map: { [courseId]: courseObject }
export const COURSES_DATA = []; // array view for pages like coursePage/courseDetail

let _loadedOnce = false;
let _loading = null;

// Resolves to .../e-Learning/api/courses.php regardless of current hash route
const COURSES_API_URL = new URL("../api/courses.php", import.meta.url).toString();

const normalizeCourse = (c) => {
  const out = { ...(c || {}) };

  // Ensure required fields exist (avoid runtime crash on missing DB columns)
  if (!Array.isArray(out.modules)) out.modules = [];
  if (!out.content || typeof out.content !== "object") out.content = {};
  if (!Array.isArray(out.content.videos)) out.content.videos = [];
  if (!Array.isArray(out.content.ebooks)) out.content.ebooks = [];
  if (!Array.isArray(out.content.workbooks)) out.content.workbooks = [];

  // Basic string defaults
  out.id = String(out.id || "");
  out.level = String(out.level || CourseLevel.BEGINNER);
  out.title = String(out.title || "Untitled Course");
  out.description = String(out.description || "");
  out.price = String(out.price ?? "");
  out.duration = String(out.duration ?? "");
  out.instructor = String(out.instructor ?? "");
  out.image = String(out.image ?? "");

  return out;
};

export const syncCoursesArray = () => {
  COURSES_DATA.length = 0;
  for (const c of Object.values(COURSES)) COURSES_DATA.push(c);
  return COURSES_DATA;
};

export const loadCoursesFromDB = async (opts = {}) => {
  const { force = false } = opts;

  if (_loadedOnce && !force) return COURSES;
  if (_loading) return _loading;

  _loading = (async () => {
    const res = await fetch(COURSES_API_URL, { cache: "no-store" });
    const txt = await res.text();

    let data = null;
    try {
      data = JSON.parse(txt);
    } catch {
      throw new Error("Invalid JSON from courses API: " + txt.slice(0, 180));
    }

    if (!res.ok || !data || data.ok !== true) {
      throw new Error((data && data.error) ? data.error : "Failed to load courses.");
    }

    const incoming = data.courses || {};

    // Keep object reference stable (important for ES module imports)
    for (const k of Object.keys(COURSES)) delete COURSES[k];

    for (const [k, v] of Object.entries(incoming)) {
      const normalized = normalizeCourse(v);
      const id = normalized.id || k;
      normalized.id = id;
      COURSES[id] = normalized;
    }

    syncCoursesArray();
    _loadedOnce = true;
    return COURSES;
  })();

  try {
    return await _loading;
  } finally {
    _loading = null;
  }
};

export const getCoursesArray = () => syncCoursesArray();
export const getCourseById = (courseId) => COURSES[courseId] || null;
