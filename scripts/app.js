/* SDC e-Learning (Vanilla HTML/CSS/JS) - ported 1:1 from the provided TSX pages.
   Routing style: HashRouter (e.g. #/beginner, #/course/beg-101)
*/

import { render } from "./route.js";
import STATE from "./state.js";
import { COURSES, loadCoursesFromDB } from "../data/course.js";
import {
  navigate,
  getPurchasedList,
  handleLogout,
  handleLogin,
  toggleCompletion,
  loadUserFromStorage,
} from "./helpers.js";

const WORKBOOK_API_URL = new URL("../api/ensure_workbook.php", import.meta.url).toString();

(async function () {
  "use strict";

  let __scrollLock = { locked: false, y: 0 };

  function lockBodyScroll() {
    if (__scrollLock.locked) return;
    __scrollLock.locked = true;

    __scrollLock.y = window.scrollY || 0;

    // freeze page without jumping
    document.body.style.position = "fixed";
    document.body.style.top = `-${__scrollLock.y}px`;
    document.body.style.left = "0";
    document.body.style.right = "0";
    document.body.style.width = "100%";
  }

  function unlockBodyScroll() {
    if (!__scrollLock.locked) return;
    __scrollLock.locked = false;

    const y = __scrollLock.y;

    document.body.style.position = "";
    document.body.style.top = "";
    document.body.style.left = "";
    document.body.style.right = "";
    document.body.style.width = "";

    window.scrollTo(0, y);
  }

  // Workbook: create/reuse per-user Google Sheet on demand (when Workbook tab clicked)
  const ensureWorkbookForSelection = async () => {
    try {
      const user = STATE.user;
      const courseId = STATE.courseContent.courseId;
      const workbookId = STATE.courseContent.selectedWorkbookId;
      if (!user || !courseId || !workbookId) return;

      const key = `${courseId}:${workbookId}`;
      if (STATE.courseContent.workbookSheetUrls?.[key]) return;

      const email = (user.email || "").trim();
      if (!email) {
        STATE.courseContent.workbookError = "The user email is empty. Please sign in again using the purchase email.";
        render();
        return;
      }

      STATE.courseContent.workbookLoadingKey = key;
      STATE.courseContent.workbookError = "";
      render();

      const resp = await fetch(WORKBOOK_API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          course_id: courseId,
          workbook_id: workbookId,
          user_id: user.id,
          user_email: email,
        }),
      });

      const txt = await resp.text();
      let data;
      try { data = JSON.parse(txt); } catch { data = { error: txt || "Invalid response" }; }

      if (!resp.ok || !data?.embed_url) throw new Error(data?.error || "Failed to prepare workbook.");

      STATE.courseContent.workbookSheetUrls = STATE.courseContent.workbookSheetUrls || {};
      STATE.courseContent.workbookSheetUrls[key] = data.embed_url;
    } catch (err) {
      STATE.courseContent.workbookError = err?.message || "Workbook error.";
    } finally {
      STATE.courseContent.workbookLoadingKey = null;
      render();
    }
  };

  const goNextVideo = (currentId) => {
    const cc = STATE.courseContent;
    const course = COURSES[cc.courseId];
    const videos = course?.content?.videos || [];
    if (!videos.length) return;

    const idx = videos.findIndex((v) => v.id === currentId);
    if (idx === -1) return;

    const next = videos[idx + 1];
    if (!next) return;

    cc.activeTab = "video";
    cc.selectedVideoId = next.id;
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // -----------------------------
  // Event delegation (click, submit, input, contextmenu)
  // -----------------------------
  document.addEventListener("submit", (e) => {
    const form = e.target?.closest?.('form[data-action="waitlist-form"]');
    if (!form) return;
   
    e.preventDefault();
   
    // trigger native validation (required email)
    if (typeof form.reportValidity === "function" && !form.reportValidity()) return;
   
    const level = form.getAttribute("data-level") || "";
    if (!STATE.coursePage) STATE.coursePage = {};
   
    // sync state ikut level
    if (STATE.coursePage.waitlistLevel !== level) {
      STATE.coursePage.waitlistLevel = level;
      STATE.coursePage.waitlist = { isNotifying: false, isNotified: false };
    }
    if (!STATE.coursePage.waitlist) {
      STATE.coursePage.waitlist = { isNotifying: false, isNotified: false };
    }
   
    const wl = STATE.coursePage.waitlist;
    if (wl.isNotifying || wl.isNotified) return;
   
    wl.isNotifying = true;
    render(); // guna render() existing kau
   
    setTimeout(() => {
      wl.isNotifying = false;
      wl.isNotified = true;
      render();
    }, 1500);
  });

  document.addEventListener(
    "pointerover",
    (e) => {
      const iframe = e.target?.closest?.('iframe[data-scroll-lock="worksheet"]');
      if (iframe) lockBodyScroll();
    },
    true
  );

  document.addEventListener(
    "pointerout",
    (e) => {
      const iframe = e.target?.closest?.('iframe[data-scroll-lock="worksheet"]');
      if (iframe) unlockBodyScroll();
    },
    true
  );

  document.addEventListener("click", (e) => {
    const target = e.target;
    const el = target.closest("[data-action]");
    if (!el) return;

    const action = el.getAttribute("data-action");

    if (action === "nav-toggle") {
      STATE.nav.isMenuOpen = !STATE.nav.isMenuOpen;
      render();
      return;
    }

    if (action === "nav-close") {
      STATE.nav.isMenuOpen = false;
      render();
      return;
    }

    if (action === "logout") {
      handleLogout();
      STATE.nav.isMenuOpen = false;
      navigate("/");
      render();
      return;
    }

    if (action === "course-buy") {
      const courseId = el.getAttribute("data-course-id");
      if (!courseId || !COURSES[courseId]) return;

      // Optional: reset state lama supaya tak tinggal "success" badge
      STATE.coursePage.buyingId = null;
      STATE.coursePage.successId = null;

      navigate(`/checkout/${courseId}`);
      render();
      return;
    }

    if (action === "detail-buy") {
      const courseId = el.getAttribute("data-course-id");
      if (!courseId || !COURSES[courseId]) return;

      // Optional reset
      STATE.courseDetail.buying = false;
      STATE.courseDetail.success = false;

      navigate(`/checkout/${courseId}`);
      render();
      return;
    }

    if (action === "dashboard-filter") {
      const f = el.getAttribute("data-filter");
      if (!f) return;
      STATE.dashboard.filter = f;
      render();
      return;
    }

    if (action === "content-tab") {
      const tab = el.getAttribute("data-tab");
      if (!tab) return;
      STATE.courseContent.activeTab = tab;
      render();
      if (tab === "workbook") ensureWorkbookForSelection();
      return;
    }
    
    if (action === "content-select") {
      const type = el.getAttribute("data-type");
      const id = el.getAttribute("data-id");
      if (!type || !id) return;
      if (type === "video") STATE.courseContent.selectedVideoId = id;
      if (type === "ebook") STATE.courseContent.selectedEbookId = id;
      if (type === "workbook") STATE.courseContent.selectedWorkbookId = id;
      render();
      if (type === "workbook" && STATE.courseContent.activeTab === "workbook") {
        ensureWorkbookForSelection();
      }
      return;
    }

    if (action === "workbook-ensure") {
      ensureWorkbookForSelection();
      return;
    }
    
    if (action === "content-toggle") {
      const type = el.getAttribute("data-type"); // videos | ebooks | workbooks
      const id = el.getAttribute("data-id");
      if (!type || !id) return;

      const cc = STATE.courseContent;
      const wasDone = (cc.completion?.[type] || []).includes(id);
      const isCurrentVideo = type === "videos" && cc.activeTab === "video" && cc.selectedVideoId === id;

      toggleCompletion(type, id);

      // kalau baru sahaja mark watched untuk video yang sedang dimainkan → auto next
      if (isCurrentVideo && !wasDone) {
        goNextVideo(id);
      }

      render();
      return;
    }
  });

  document.addEventListener("submit", (e) => {
    const checkoutForm = e.target.closest('form[data-action="checkout-submit"]');
    if (checkoutForm) {
      e.preventDefault();

      const co = STATE.checkout;
      const courseId = co.courseId;
      if (!courseId || !COURSES[courseId]) {
        navigate("/");
        render();
        return;
      }

      const fullName = String(co.formData?.fullName || "").trim();
      const email = String(co.formData?.email || "").trim();
      const phoneNumber = String(co.formData?.phoneNumber || "").trim();
      const agreedTerms = !!co.formData?.agreedTerms;

      if (!fullName || !email || !phoneNumber || !agreedTerms || co.processing) return;

      co.processing = true;
      render();

      setTimeout(() => {
        const existingPurchased = getPurchasedList();
        if (!existingPurchased.includes(courseId)) {
          existingPurchased.push(courseId);
          localStorage.setItem("sdc_purchased", JSON.stringify(existingPurchased));
        }

        // TSX behavior: if not logged in, create temporary user session
        if (!localStorage.getItem("sdc_user")) {
          const rand = Math.floor(1000 + Math.random() * 9000);
          handleLogin(`STUDENT-${rand}`, email);
        } else {
          localStorage.setItem("sdc_user_email", email);
          loadUserFromStorage();
        }

        if (STATE.user) STATE.user.purchasedCourses = existingPurchased;

        co.processing = false;
        co.success = true;
        render();
      }, 2500);

      return;
    }

    const form = e.target.closest('form[data-action="signin-submit"]');
    if (!form) return;

    e.preventDefault();

    const id = (STATE.signIn.id || "").trim();
    const email = (STATE.signIn.email || "").trim();
    const pw = (STATE.signIn.password || "").trim();

    if (!id || !email || !pw) {
      STATE.signIn.error = "Please enter your Access ID, email and password.";
      render();
      return;
    }

    // Simulate auth (same as TSX): any non-empty credentials pass
    handleLogin(id, email);
    navigate("/dashboard");
    render();
  });

  document.addEventListener("input", (e) => {
    const t = e.target;
    if (!(t instanceof HTMLInputElement)) return;

    // Checkout controlled inputs (ported from Checkout.tsx)
    const checkoutForm = t.closest('form[data-action="checkout-submit"]');
    if (checkoutForm) {
      const name = t.getAttribute("name") || "";
      const co = STATE.checkout;

      co.formData = co.formData || {
        fullName: "",
        email: "",
        phoneNumber: "",
        agreedTerms: false,
      };

      if (name === "fullName") co.formData.fullName = t.value;
      if (name === "email") co.formData.email = t.value;
      if (name === "phoneNumber") co.formData.phoneNumber = t.value;

      if (name === "agreedTerms") {
        co.formData.agreedTerms = !!t.checked;
        render(); // penting untuk enable/disable button ikut checkbox
      }

      return; // stop sini supaya tak jatuh ke sign-in handler
    }

    // Sign-in controlled inputs (existing)
    const field = t.getAttribute("data-field");
    if (!field) return;

    if (field === "signin-id") {
      STATE.signIn.id = t.value;
      if (STATE.signIn.error) STATE.signIn.error = "";
    }

    if (field === "signin-email") {
      STATE.signIn.email = t.value;
      if (STATE.signIn.error) STATE.signIn.error = "";
    }

    if (field === "signin-password") {
      STATE.signIn.password = t.value;
      if (STATE.signIn.error) STATE.signIn.error = "";
    }
  });

  // Content protection: disable context menu on CourseContent root (mirrors TSX onContextMenu)
  document.addEventListener("contextmenu", (e) => {
    const root = document.getElementById("course-content-root");
    if (root && root.contains(e.target)) {
      e.preventDefault();
    }
  });

  // Close mobile menu when clicking any hash-link (like React onClick close)
  document.addEventListener("click", (e) => {
    const a = e.target.closest("a");
    if (!a) return;
    const href = a.getAttribute("href") || "";
    if (href.startsWith("#/") && STATE.nav.isMenuOpen) {
      STATE.nav.isMenuOpen = false;
      // let hashchange render; but also immediate rerender helps
      setTimeout(() => render(), 0);
    }
  });

  window.addEventListener("hashchange", () => render());

    // boot
  loadUserFromStorage();

  try {
    // load courses from DB (so admin-added courses appear here)
    await loadCoursesFromDB();
  } catch (e) {
    console.error("Failed to load courses from DB:", e);
    // Keep app usable (it will show empty / fallback UI)
  }

  if (!window.location.hash) window.location.hash = "#/";
  render();

  // -----------------------------
  // Auto mark completed when video ends
  // -----------------------------
  const autoMarkIfNeeded = (type, id) => {
    const list = (STATE.courseContent?.completion?.[type]) || [];
    if (list.includes(id)) return false;
    toggleCompletion(type, id);
    return true;
  };

  // 1) HTML5 <video> ended (works for direct mp4/webm/ogg)
  document.addEventListener(
    "ended",
    (e) => {
      const el = e.target;
      if (!(el instanceof HTMLVideoElement)) return;

      const type = el.getAttribute("data-autocomplete-type");
      const id = el.getAttribute("data-autocomplete-id");
      if (!type || !id) return;

      autoMarkIfNeeded(type, id);
      goNextVideo(id);
      render();
    },
    true // capture (media events may not bubble)
  );

  // 2) YouTube iframe ended (needs YouTube Iframe API)
  let __ytApiPromise = null;
  const __ytPlayers = new Map();

  const loadYouTubeAPI = () => {
    if (window.YT && window.YT.Player) return Promise.resolve();
    if (__ytApiPromise) return __ytApiPromise;

    __ytApiPromise = new Promise((resolve) => {
      const tag = document.createElement("script");
      tag.src = "https://www.youtube.com/iframe_api";
      document.head.appendChild(tag);

      // called by the API
      window.onYouTubeIframeAPIReady = () => resolve();
    });

    return __ytApiPromise;
  };

  const syncYouTubeAutoComplete = async () => {
    const iframes = Array.from(document.querySelectorAll('iframe[data-yt-autocomplete="1"]'));
    const ytIframes = iframes.filter((f) =>
      /youtube(?:-nocookie)?\.com\/embed\//.test(f.getAttribute("src") || "")
    );
    if (ytIframes.length === 0) return;

    await loadYouTubeAPI();

    // cleanup removed iframes
    for (const [el, player] of __ytPlayers.entries()) {
      if (!document.body.contains(el)) {
        try { player.destroy(); } catch {}
        __ytPlayers.delete(el);
      }
    }

    // init new players
    for (const iframe of ytIframes) {
      if (__ytPlayers.has(iframe)) continue;

      const itemId = iframe.getAttribute("data-autocomplete-id") || "";
      const player = new window.YT.Player(iframe, {
        events: {
          onStateChange: (ev) => {
            // 0 = ended
            if (ev.data === 0 && itemId) {
              autoMarkIfNeeded("videos", itemId);
              goNextVideo(itemId);
              render();
            }
          },
        },
      });

      __ytPlayers.set(iframe, player);
    }
  };

  // Call sync after each render (SPA) via MutationObserver
  let __afterRenderQueued = false;
  const queueAfterRender = () => {
    if (__afterRenderQueued) return;
    __afterRenderQueued = true;
    requestAnimationFrame(() => {
      __afterRenderQueued = false;
      syncYouTubeAutoComplete();
    });
  };

  const appRoot = document.getElementById("app");
  if (appRoot) {
    const mo = new MutationObserver(queueAfterRender);
    mo.observe(appRoot, { childList: true, subtree: true });
    queueAfterRender();
  }
})();
