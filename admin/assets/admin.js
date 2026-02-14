/* SDC Admin Demo (static) */
(function () {
  const KEY_AUTH = "sdc_admin_auth_v1";
  const KEY_USER = "sdc_admin_user_v1";
  const KEY_COURSES = "sdc_courses_v1";
  const KEY_CONTENTS = "sdc_contents_v1";
  const KEY_PROGRESS = "sdc_progress_v1";
  const KEY_PAYMENTS = "sdc_payments_v1";

  const $ = (sel, root=document) => root.querySelector(sel);
  const $$ = (sel, root=document) => Array.from(root.querySelectorAll(sel));

  function studentLandingHref() {
    // Student site simpan user di localStorage: "sdc_user"
    const raw = localStorage.getItem("sdc_user");
    const base = "../index.html";

    if (!raw) return `${base}#/signin`;

    // kalau ada sdc_user walaupun string pelik, treat as logged in
    try {
      const u = JSON.parse(raw);
      if (u && (u.email || u.id)) return `${base}#/dashboard`;
      return `${base}#/dashboard`;
    } catch {
      return `${base}#/dashboard`;
    }
  }

  function bindOpenStudentSiteLinks() {
    document.querySelectorAll('[data-action="open-student-site"]').forEach((a) => {
      a.href = studentLandingHref();
      a.addEventListener("click", () => {
        a.href = studentLandingHref();
      });
    });
  }

  function nowISO() {
    return new Date().toISOString();
  }

  function readJSON(key, fallback) {
    try {
      const v = localStorage.getItem(key);
      return v ? JSON.parse(v) : fallback;
    } catch (e) {
      return fallback;
    }
  }
  function writeJSON(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }

  function isAuthed() {
    return localStorage.getItem(KEY_AUTH) === "1";
  }
  function requireAuth() {
    const need = document.body?.dataset?.requiresAuth === "1";
    if (need && !isAuthed()) {
      const here = location.pathname.split("/").pop() || "dashboard.html";
      location.replace(`login.html?next=${encodeURIComponent(here + location.search)}`);
    }
  }

  function login(username) {
    localStorage.setItem(KEY_AUTH, "1");
    localStorage.setItem(KEY_USER, username || "admin");
  }
  function logout() {
    localStorage.removeItem(KEY_AUTH);
    localStorage.removeItem(KEY_USER);
  }
  function getAdminUser() {
    return localStorage.getItem(KEY_USER) || "admin";
  }

  function seedIfNeeded() {
    const courses = readJSON(KEY_COURSES, null);
    if (!Array.isArray(courses) || courses.length === 0) {
      writeJSON(KEY_COURSES, [
        {
          id: "beg-101",
          level: "Beginner",
          title: "Crypto 101: From Zero to Wallet",
          description: "Asas crypto, wallet, CEX vs DEX, dan cara avoid common scam.",
          price: "99",
          duration: "2 Weeks",
          instructor: "Cikgu Kripto",
          image: "https://images.unsplash.com/photo-1639152201720-5e536d254d81?auto=format&fit=crop&w=1200&q=80",
          created_at: nowISO(),
          updated_at: nowISO()
        },
        {
          id: "beg-102",
          level: "Beginner",
          title: "Risk Management for Retail",
          description: "Position sizing, stop loss, dan mindset supaya tak burn account.",
          price: "129",
          duration: "3 Weeks",
          instructor: "Cikgu Kripto",
          image: "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=1200&q=80",
          created_at: nowISO(),
          updated_at: nowISO()
        },
        {
          id: "int-201",
          level: "Intermediate",
          title: "On-chain Basics & Wallet Hygiene",
          description: "Approve/revoke, token approvals, EVM basics, dan secure ops.",
          price: "199",
          duration: "4 Weeks",
          instructor: "Cikgu Kripto",
          image: "https://images.unsplash.com/photo-1640340434855-6084b1f4901c?auto=format&fit=crop&w=1200&q=80",
          created_at: nowISO(),
          updated_at: nowISO()
        },
        {
          id: "adv-301",
          level: "Advanced",
          title: "DEX Hunting & Liquidity Tactics",
          description: "Cara scan narrative, volume, LP risk, dan exit plan (tanpa cope).",
          price: "299",
          duration: "6 Weeks",
          instructor: "Cikgu Kripto",
          image: "https://images.unsplash.com/photo-1621264448270-9ef00e88a7de?auto=format&fit=crop&w=1200&q=80",
          created_at: nowISO(),
          updated_at: nowISO()
        }
      ]);
    }

    // Seed / migrate contents (ensure every course has 3 demo spreadsheets)
    const baseSheet =
      "https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit?usp=sharing";

    const toSheetsPreviewUrl = (rawUrl) => {
      const url = String(rawUrl || "").trim();
      if (!url) return "";
      if (url.includes("/preview")) return url;
      return url.replace(/\/edit(\?.*)?$/i, "/preview");
    };

    const demoWorkbooksForCourse = (courseId, courseTitle) => {
      const id = String(courseId || "");
      const title = String(courseTitle || "Workbook");

      const wbs = [
        {
          id: `${id}-w1`,
          title: `${title} Main Tracker`,
          url: baseSheet,
          embedUrl: toSheetsPreviewUrl(baseSheet),
        },
        {
          id: `${id}-w2`,
          title: "Risk Management Calculator",
          url: baseSheet,
          embedUrl: toSheetsPreviewUrl(baseSheet),
        },
      ];

      if (id.includes("adv")) {
        wbs.push({
          id: `${id}-w3`,
          title: "On-Chain Signal Log",
          url: baseSheet,
          embedUrl: toSheetsPreviewUrl(baseSheet),
        });
      } else if (id.includes("int")) {
        wbs.push({
          id: `${id}-w3`,
          title: "Altcoin Research Template",
          url: baseSheet,
          embedUrl: toSheetsPreviewUrl(baseSheet),
        });
      } else {
        wbs.push({
          id: `${id}-w3`,
          title: "Wallet Setup Checklist",
          url: baseSheet,
          embedUrl: toSheetsPreviewUrl(baseSheet),
        });
      }

      return wbs;
    };

    const contentsRaw = readJSON(KEY_CONTENTS, null);
    const contents = contentsRaw && typeof contentsRaw === "object" ? contentsRaw : {};
    const coursesForSeed = readJSON(KEY_COURSES, []) || [];

    // Ensure every existing course has a content bucket with 3 workbook examples
    (coursesForSeed || []).forEach((c) => {
      const cid = String(c?.id || "");
      if (!cid) return;

      if (!contents[cid] || typeof contents[cid] !== "object") {
        contents[cid] = { videos: [], ebooks: [], workbooks: [] };
      }

      contents[cid].videos = Array.isArray(contents[cid].videos) ? contents[cid].videos : [];
      contents[cid].ebooks = Array.isArray(contents[cid].ebooks) ? contents[cid].ebooks : [];
      contents[cid].workbooks = Array.isArray(contents[cid].workbooks) ? contents[cid].workbooks : [];

      const desired = demoWorkbooksForCourse(cid, c?.title);

      // Keep user-added items, but top up until we have at least 3 workbooks
      const byId = new Set(contents[cid].workbooks.map((w) => String(w?.id || "")));
      desired.forEach((w) => {
        if (contents[cid].workbooks.length >= 3) return;
        if (!byId.has(w.id)) {
          contents[cid].workbooks.push(w);
          byId.add(w.id);
        }
      });
    });

    // Optional: kalau kau nak still ada starter vids/ebook untuk beg-101 (macam demo lama)
    if (!contents["beg-101"] || (contents["beg-101"].videos || []).length === 0) {
      contents["beg-101"] = contents["beg-101"] || { videos: [], ebooks: [], workbooks: [] };
      contents["beg-101"].videos = [
        { id: "v1", title: "Intro & Setup Wallet", url: "https://example.com/video/1", minutes: 18 },
        { id: "v2", title: "CEX Basics: Order Types", url: "https://example.com/video/2", minutes: 22 },
      ];
      contents["beg-101"].ebooks = [
        { id: "e1", title: "Cheat Sheet: Security Checklist", url: "https://example.com/ebook/1" },
      ];

      const desired = demoWorkbooksForCourse("beg-101", (coursesForSeed.find(x=>x.id==="beg-101")||{}).title);
      const byId = new Set((contents["beg-101"].workbooks || []).map(w => String(w?.id || "")));
      contents["beg-101"].workbooks = Array.isArray(contents["beg-101"].workbooks) ? contents["beg-101"].workbooks : [];
      desired.forEach(w => {
        if (contents["beg-101"].workbooks.length >= 3) return;
        if (!byId.has(w.id)) contents["beg-101"].workbooks.push(w);
      });
    }

    writeJSON(KEY_CONTENTS, contents);


    const progress = readJSON(KEY_PROGRESS, null);
    if (!Array.isArray(progress) || progress.length === 0) {
      writeJSON(KEY_PROGRESS, [
        {
          user_id: 1,
          student_id: "USER-1",
          name: "Aiman",
          email: "aiman@example.com",
          course_id: "beg-101",
          enrolled_at: "2026-01-10T09:00:00.000Z",
          paid_price: 99,
          done: { video: 1, ebook: 1, workbook: 0 },
          last_ts: "2026-02-05T12:15:00.000Z"
        },
        {
          user_id: 2,
          student_id: "USER-2",
          name: "Siti",
          email: "siti@example.com",
          course_id: "beg-102",
          enrolled_at: "2026-01-22T11:30:00.000Z",
          paid_price: 129,
          done: { video: 1, ebook: 0, workbook: 0 },
          last_ts: "2026-02-07T08:00:00.000Z"
        },
        {
          user_id: 3,
          student_id: "USER-3",
          name: "Kumar",
          email: "kumar@example.com",
          course_id: "int-201",
          enrolled_at: "2026-02-01T15:20:00.000Z",
          paid_price: 199,
          done: { video: 0, ebook: 0, workbook: 0 },
          last_ts: null
        }
      ]);
    }

    const payments = readJSON(KEY_PAYMENTS, null);
    if (!Array.isArray(payments) || payments.length === 0) {
      // keep it simple for KPI (verified = true)
      writeJSON(KEY_PAYMENTS, [
        { email: "aiman@example.com", course_id: "beg-101", price: 99, verified: true, created_at: "2026-01-10T08:59:00.000Z" },
        { email: "siti@example.com", course_id: "beg-102", price: 129, verified: true, created_at: "2026-01-22T11:29:00.000Z" },
        { email: "kumar@example.com", course_id: "int-201", price: 199, verified: true, created_at: "2026-02-01T15:19:00.000Z" }
      ]);
    }
  }

  function getCourses() {
    seedIfNeeded();
    return readJSON(KEY_COURSES, []);
  }
  function setCourses(arr) {
    writeJSON(KEY_COURSES, arr);
  }
  function getCourse(id) {
    return getCourses().find(c => c.id === id) || null;
  }
  function upsertCourse(course) {
    const all = getCourses();
    const idx = all.findIndex(c => c.id === course.id);
    if (idx >= 0) all[idx] = course;
    else all.unshift(course);
    setCourses(all);
  }
  function deleteCourse(id) {
    setCourses(getCourses().filter(c => c.id !== id));
    const contents = readJSON(KEY_CONTENTS, {});
    delete contents[id];
    writeJSON(KEY_CONTENTS, contents);
    // also remove progress/payments for that course (demo)
    writeJSON(KEY_PROGRESS, readJSON(KEY_PROGRESS, []).filter(p => p.course_id !== id));
    writeJSON(KEY_PAYMENTS, readJSON(KEY_PAYMENTS, []).filter(p => p.course_id !== id));
  }

  function getContents(courseId) {
    seedIfNeeded();
    const all = readJSON(KEY_CONTENTS, {});
    return all[courseId] || { videos: [], ebooks: [], workbooks: [] };
  }
  function setContents(courseId, payload) {
    const all = readJSON(KEY_CONTENTS, {});
    all[courseId] = payload;
    writeJSON(KEY_CONTENTS, all);
  }
  function addContent(courseId, type, item) {
    const c = getContents(courseId);
    c[type] = Array.isArray(c[type]) ? c[type] : [];
    c[type].unshift(item);
    setContents(courseId, c);
  }
  function removeContent(courseId, type, id) {
    const c = getContents(courseId);
    c[type] = (c[type] || []).filter(x => x.id !== id);
    setContents(courseId, c);
  }

  function getProgress() {
    seedIfNeeded();
    return readJSON(KEY_PROGRESS, []);
  }
  function getPayments() {
    seedIfNeeded();
    return readJSON(KEY_PAYMENTS, []);
  }

  function totalsForCourse(courseId) {
    const cont = getContents(courseId);
    return {
      video: (cont.videos || []).length,
      ebook: (cont.ebooks || []).length,
      workbook: (cont.workbooks || []).length
    };
  }

  function percent(done, total) {
    const t = (total.video + total.ebook + total.workbook);
    const d = (done.video + done.ebook + done.workbook);
    if (!t) return 0;
    const p = Math.round((d / t) * 100);
    return Math.max(0, Math.min(100, p));
  }

  function timeAgo(iso) {
    if (!iso) return "—";
    const ts = new Date(iso).getTime();
    if (!isFinite(ts)) return "—";
    const diff = Date.now() - ts;
    const s = Math.floor(diff / 1000);
    if (s < 60) return "just now";
    const m = Math.floor(s / 60);
    if (m < 60) return `${m} mins ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h} hours ago`;
    const d = Math.floor(h / 24);
    if (d < 30) return `${d} days ago`;
    return new Date(ts).toISOString().slice(0,10);
  }

  function setupDrawer() {
    const drawer = document.getElementById("adminDrawer");
    if (!drawer) return;

    function openDrawer(){ drawer.classList.remove("hidden"); }
    function closeDrawer(){ drawer.classList.add("hidden"); }
    function toggleDrawer(){ drawer.classList.contains("hidden") ? openDrawer() : closeDrawer(); }

    window.__sdcToggleAdminDrawer = toggleDrawer;
    window.__sdcCloseAdminDrawer = closeDrawer;

    window.addEventListener("keydown", (e) => {
      if (e.key === "Escape") closeDrawer();
    });
  }

  function setupActiveNav() {
    const page = document.body?.dataset?.page || "";
    $$("[data-nav]").forEach(a => {
      const key = a.getAttribute("data-nav");
      const active = key === page;
      a.classList.toggle("bg-yellow-50", active);
      a.classList.toggle("text-yellow-700", active);
      a.classList.toggle("border-yellow-100", active);
      a.classList.toggle("border", active);

      if (!active) {
        a.classList.add("text-slate-700", "border-transparent");
      }
    });

    const u = $("#adminUser");
    if (u) u.textContent = getAdminUser();
  }

  function qs(name) {
    return new URLSearchParams(location.search).get(name);
  }

  function csvDownload(filename, rows) {
    const esc = (v) => {
      const s = String(v ?? "");
      if (/[",\n]/.test(s)) return `"${s.replaceAll('"','""')}"`;
      return s;
    };
    const csv = rows.map(r => r.map(esc).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  // Expose API
  window.SDC_ADMIN = {
    $, $$,
    qs,
    requireAuth,
    login, logout, isAuthed,
    seedIfNeeded,
    getCourses, setCourses, getCourse, upsertCourse, deleteCourse,
    getContents, setContents, addContent, removeContent,
    getProgress, getPayments,
    totalsForCourse, percent, timeAgo,
    csvDownload,
    setupDrawer, setupActiveNav,
  };

  // bootstrap
  document.addEventListener("DOMContentLoaded", () => {
    seedIfNeeded();
    setupDrawer();
    setupActiveNav();
    requireAuth();
    bindOpenStudentSiteLinks();
  });
})();
