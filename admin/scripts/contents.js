import { loadCoursesFromDB, getCoursesArray } from "../../data/course.js";

await loadCoursesFromDB();

const STORE_KEY = "sdc_admin_contents_store_v1";

const CONTENT_SEED_VERSION = "v2";
const CONTENT_SEED_VER_KEY = `${STORE_KEY}__seed_ver`;

const year = document.getElementById("year");
if (year) year.textContent = String(new Date().getFullYear());

const readJSON = (k, fallback) => {
  try { return JSON.parse(localStorage.getItem(k) || ""); } catch { return fallback; }
};
const writeJSON = (k, v) => localStorage.setItem(k, JSON.stringify(v));

const qs = (key) => (new URLSearchParams(location.search).get(key) || "").trim();
const getCourseByIdLocal = (id) => getCoursesArray().find(c => c.id === id) || null;

const setText = (id, text) => {
  const el = document.getElementById(id);
  if (el) el.textContent = text;
};

const toggleHidden = (id, hide) => {
  const el = document.getElementById(id);
  if (!el) return;
  el.classList.toggle("hidden", !!hide);
};

const esc = (s) =>
  String(s ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

const toSheetsPreviewUrl = (rawUrl) => {
  const url = String(rawUrl || "").trim();
  if (!url) return "";
  if (url.includes("/preview")) return url;
  return url.replace(/\/edit(\?.*)?$/i, "/preview");
};

const normalize = (courseContent = {}) => {
  const videos = Array.isArray(courseContent.videos) ? courseContent.videos : [];
  const ebooks = Array.isArray(courseContent.ebooks) ? courseContent.ebooks : [];
  const workbooks = Array.isArray(courseContent.workbooks) ? courseContent.workbooks : [];

  return {
    videos: videos.map(v => ({
      id: String(v?.id || ""),
      title: String(v?.title || ""),
      url: String(v?.url || ""),
      description: String(v?.description || "")
    })),
    ebooks: ebooks.map(e => ({
      id: String(e?.id || ""),
      title: String(e?.title || ""),
      content: String(e?.content || "")
    })),
    workbooks: workbooks.map(w => {
      const url = String(w?.url || w?.embedUrl || "");
      return {
        id: String(w?.id || ""),
        title: String(w?.title || ""),
        url,
        embedUrl: String(w?.embedUrl || toSheetsPreviewUrl(url) || "")
      };
    })
  };
};

const ensureSeed = () => {
  const courses = getCoursesArray();

  let existing = readJSON(STORE_KEY, null);
  const validObject = existing && typeof existing === "object" && !Array.isArray(existing);

  const currentVer = localStorage.getItem(CONTENT_SEED_VER_KEY) || "";
  let changed = false;

  // kalau version berubah / store rosak -> reseed full (ini yang settle "data lama")
  if (!validObject || currentVer !== CONTENT_SEED_VERSION) {
    existing = {};
    changed = true;
  }

  for (const c of courses) {
    if (!existing[c.id]) {
      existing[c.id] = normalize(c?.content || {});
      changed = true;
    }
  }

  if (changed) {
    writeJSON(STORE_KEY, existing);
    localStorage.setItem(CONTENT_SEED_VER_KEY, CONTENT_SEED_VERSION);
  }

  return existing;
};

const videoRow = (v) => `
  <div class="p-5 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4 overflow-hidden">
    <div class="min-w-0">
      <div class="font-black text-slate-900 truncate">${esc(v.title)}</div>
      <div class="text-xs text-slate-500 break-all line-clamp-2">${esc(v.url)}</div>
      ${v.description ? `<div class="text-sm text-slate-600 mt-1">${esc(v.description)}</div>` : ``}
    </div>
    <button data-del="video" data-id="${esc(v.id)}"
      class="px-5 py-3 bg-white border border-red-200 text-red-600 rounded-2xl font-black hover:bg-red-50 transition">
      Delete
    </button>
  </div>
`;

const ebookRow = (e) => `
  <div class="p-5 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4 overflow-hidden">
    <div class="min-w-0">
      <div class="font-black text-slate-900">${esc(e.title)}</div>
      <div class="text-xs text-slate-500">Stored as HTML (LONGTEXT).</div>
    </div>
    <button data-del="ebook" data-id="${esc(e.id)}"
      class="px-5 py-3 bg-white border border-red-200 text-red-600 rounded-2xl font-black hover:bg-red-50 transition">
      Delete
    </button>
  </div>
`;

const workbookRow = (w) => `
  <div class="p-5 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4 overflow-hidden">
    <div class="min-w-0">
      <div class="font-black text-slate-900 truncate">${esc(w.title)}</div>
      <div class="text-xs text-slate-500 break-all line-clamp-2">${esc(w.url)}</div>
    </div>
    <button data-del="workbook" data-id="${esc(w.id)}"
      class="px-5 py-3 bg-white border border-red-200 text-red-600 rounded-2xl font-black hover:bg-red-50 transition">
      Delete
    </button>
  </div>
`;

const labelForCourse = (c) => `${c.level} • ${c.id} • ${c.title}`;

const initSearchableCourseSelect = () => {
  const wrap = document.getElementById("courseSelectWrap");
  const sel = document.getElementById("courseSelect");
  const btn = document.getElementById("courseSelectBtn");
  const label = document.getElementById("courseSelectLabel");
  const dd = document.getElementById("courseSelectDropdown");
  const search = document.getElementById("courseSelectSearch");
  const optBox = document.getElementById("courseSelectOptions");

  if (!wrap || !sel || !btn || !label || !dd || !search || !optBox) return;

  const courses = getCoursesArray();

  // populate hidden <select>
  const PLACEHOLDER = "Select a course";

  // populate hidden <select>
  sel.innerHTML =
    `<option value="">${PLACEHOLDER}</option>` +
    courses.map(c => `<option value="${esc(c.id)}">${esc(labelForCourse(c))}</option>`).join("");

  const setSelected = (courseId) => {
    const c = courses.find(x => x.id === courseId) || null;
    sel.value = c ? c.id : "";
    label.textContent = c ? labelForCourse(c) : PLACEHOLDER;
  };

  const renderOptions = (filterText = "") => {
    const ft = filterText.trim().toLowerCase();
    const selected = sel.value;

    const filtered = !ft ? courses : courses.filter(c => {
      const hay = `${c.level} ${c.id} ${c.title}`.toLowerCase();
      return hay.includes(ft);
    });

    optBox.innerHTML = filtered.length
      ? filtered.map(c => {
          const active = c.id === selected;
          return `
            <button type="button"
              class="w-full text-left px-4 py-3 font-bold ${active ? "bg-slate-50" : "bg-white"} hover:bg-slate-50 transition"
              data-course-id="${esc(c.id)}"
            >
              <div class="text-sm text-slate-900 truncate">${esc(labelForCourse(c))}</div>
            </button>
          `;
        }).join("")
      : `<div class="px-4 py-4 text-sm text-slate-500 font-semibold">No match.</div>`;
  };

  const open = () => {
    dd.classList.remove("hidden");
    search.value = "";
    renderOptions("");
    search.focus();
  };
  const close = () => dd.classList.add("hidden");
  const toggle = () => dd.classList.contains("hidden") ? open() : close();

  btn.addEventListener("click", toggle);

  search.addEventListener("input", () => renderOptions(search.value));

  optBox.addEventListener("click", (e) => {
    const b = e.target.closest("button[data-course-id]");
    if (!b) return;
    const id = b.getAttribute("data-course-id") || "";
    setSelected(id);
    close();
  });

  document.addEventListener("click", (e) => {
    if (!wrap.contains(e.target)) close();
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") close();
  });

  // init from querystring
  const cid = qs("course_id");
  if (cid && courses.some(c => c.id === cid)) setSelected(cid);
  else setSelected("");
};

const render = () => {
  const store = ensureSeed();
  const courses = getCoursesArray();
  const courseId = qs("course_id");
  const course = courseId ? getCourseByIdLocal(courseId) : null;

  if (!course) {
    toggleHidden("pickCourseEmpty", false);
    toggleHidden("coursePanel", true);
    return;
  }

  toggleHidden("pickCourseEmpty", true);
  toggleHidden("coursePanel", false);

  setText("courseMeta", `${course.level} • ${course.id}`);
  setText("courseTitle", course.title);

  const setVal = (id, v) => {
    const el = document.getElementById(id);
    if (el) el.value = v;
  };
  setVal("courseIdVideo", courseId);
  setVal("courseIdEbook", courseId);
  setVal("courseIdWorkbook", courseId);

  const content = store[courseId] || normalize({});

  setText("videosCount", String(content.videos.length));
  setText("ebooksCount", String(content.ebooks.length));
  setText("workbooksCount", String(content.workbooks.length));

  toggleHidden("videosEmpty", content.videos.length !== 0);
  toggleHidden("ebooksEmpty", content.ebooks.length !== 0);
  toggleHidden("workbooksEmpty", content.workbooks.length !== 0);

  const vList = document.getElementById("videosList");
  const eList = document.getElementById("ebooksList");
  const wList = document.getElementById("workbooksList");

  if (vList) vList.innerHTML = content.videos.map(videoRow).join("");
  if (eList) eList.innerHTML = content.ebooks.map(ebookRow).join("");
  if (wList) wList.innerHTML = content.workbooks.map(workbookRow).join("");
};

document.addEventListener("DOMContentLoaded", () => {
  initSearchableCourseSelect();
  render();

  const form = document.querySelector('form[action="contents.html"]');
  const sel = document.getElementById("courseSelect");

  if (form && sel) {
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const id = sel.value;

      const url = new URL(location.href);
      if (id) url.searchParams.set("course_id", id);
      else url.searchParams.delete("course_id");

      history.replaceState({}, "", url.toString());
      render();
    });
  }
});