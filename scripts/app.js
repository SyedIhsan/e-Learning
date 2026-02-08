import { render } from "./route.js";
import STATE from "./state.js";
import { COURSES, loadCoursesFromDB } from "../data/course.js";
import {
  navigate,
  handleLogout,
  toggleCompletion,
  loadUserFromStorage,
} from "./helpers.js";

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

  function wrapEbookTablesForScroll() {
    const root = document.getElementById("ebook-html");
    if (!root) return;

    root.querySelectorAll("table").forEach((tbl) => {
      if (tbl.closest(".table-scroll")) return;

      const wrap = document.createElement("div");
      wrap.className = "table-scroll";
      tbl.parentNode.insertBefore(wrap, tbl);
      wrap.appendChild(tbl);
    });
  }

  // Workbook: create/reuse per-user Google Sheet on demand (when Workbook tab clicked)
  const ensureWorkbookForSelection = () => {
    const cc = STATE.courseContent;
    const course = COURSES[cc.courseId];
    const wb = course?.content?.workbooks?.find(w => w.id === cc.selectedWorkbookId);

    const key = `${cc.courseId}:${cc.selectedWorkbookId}`;
    const raw = wb?.embedUrl || wb?.url || "";
    const url = String(raw || "").replace(/\/edit(\?.*)?$/i, "/preview");

    cc.workbookSheetUrls = cc.workbookSheetUrls || {};
    cc.workbookLoadingKey = null;

    if (!url) { cc.workbookError = "Workbook URL not set."; render(); return; }

    cc.workbookError = "";
    cc.workbookSheetUrls[key] = url;
    render();
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

  let __pendingEbookTop = false;

  const forceEbookTop = () => {
    const scroller = document.getElementById("ebook-scroll");
    if (scroller) {
      scroller.scrollTop = 0;
      scroller.scrollTo({ top: 0, behavior: "auto" });
    }
    window.scrollTo({ top: 0, behavior: "auto" });
  };

  const goNextEbook = (currentId) => {
    const cc = STATE.courseContent;
    const course = COURSES[cc.courseId];
    const ebooks = course?.content?.ebooks || [];
    if (!ebooks.length) return false;

    const idx = ebooks.findIndex((e) => e.id === currentId);
    if (idx === -1) return false;

    const next = ebooks[idx + 1];
    if (!next) return false;

    cc.activeTab = "ebook";
    cc.selectedEbookId = next.id;
    return true;
  };

  // -----------------------------
  // Event delegation (click, submit, input, contextmenu)
  // -----------------------------
  document.addEventListener(
    "click",
    (e) => {
      const a = e.target.closest?.("#ebook-html a");
      if (!a) return;

      const href = (a.getAttribute("href") || "").trim();
      if (!href) return;

      // jangan kacau router / external links
      if (href.startsWith("#/")) return;
      if (/^(https?:)?\/\//i.test(href)) return;
      if (href.startsWith("mailto:") || href.startsWith("tel:")) return;

      // kita handle anchor/TOC sahaja
      const raw = href.startsWith("#") ? href.slice(1) : href;

      // map "bab5" / "Bab 5" / "bab-5" -> "bab-5"
      const m = raw.match(/^bab\s*-?\s*([0-9]+)$/i);
      const id = m ? `bab-${m[1]}` : raw;

      // IMPORTANT: block browser daripada tukar hash
      e.preventDefault();
      e.stopImmediatePropagation();

      const target = document.getElementById(id) || document.getElementById(raw);
      if (target) {
        target.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    },
    true // capture mode: intercept sebelum benda lain
  );

  document.addEventListener("submit", (e) => {
    const form = e.target?.closest?.('form[data-action="footer-subscribe-form"]');
    if (!form) return;

    e.preventDefault();
    e.stopImmediatePropagation();
    if (typeof form.reportValidity === "function" && !form.reportValidity()) return;

    const input = form.querySelector('input[type="email"]');
    const btn = form.querySelector('button[type="submit"]');
    const msg = form.querySelector('[data-role="footer-subscribe-msg"]');

    const email = (input?.value || "").trim();
    if (!email || !btn || !input) return;

    // Prevent spam click while loading/success (React behaviour)
    const current = form.dataset.subStatus || "idle";
    if (current !== "idle") return;

    // Optional: simple email check (reportValidity dah buat basic check)
    const okEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    if (!okEmail) {
      if (msg) {
        msg.classList.remove("hidden");
        msg.className = "text-xs text-center text-rose-300";
        msg.textContent = "Email tak valid. Cuba lagi.";
      }
      return;
    }

    // Save original UI once (so we can restore)
    if (!btn.dataset.baseHtml) btn.dataset.baseHtml = btn.innerHTML;
    if (!btn.dataset.baseClass) btn.dataset.baseClass = btn.className;
    if (!input.dataset.baseClass) input.dataset.baseClass = input.className;

    const setMsg = (text, ok = true) => {
      if (!msg) return;
      msg.classList.remove("hidden");
      msg.className = `text-xs text-center ${ok ? "text-emerald-300" : "text-rose-300"}`;
      msg.textContent = text;
    };

    const setStatus = (status) => {
      form.dataset.subStatus = status;

      // disable input/button bila bukan idle
      const disabled = status !== "idle";
      input.disabled = disabled;
      btn.disabled = disabled;

      if (status === "idle") {
        // restore default
        btn.className = btn.dataset.baseClass;
        btn.innerHTML = btn.dataset.baseHtml || "SUBSCRIBE NOW";
        // optional: hide msg balik
        if (msg) msg.classList.add("hidden");
        return;
      }

      if (status === "loading") {
        // loading spinner + text
        btn.className =
          "w-full h-12 rounded-2xl bg-white text-slate-900 font-black text-sm tracking-widest uppercase transition-all flex items-center justify-center gap-2 shadow-lg shadow-amber-900/20 opacity-90 cursor-not-allowed";
        btn.innerHTML = `
          <svg class="animate-spin h-4 w-4 text-slate-900" fill="none" viewBox="0 0 24 24" aria-hidden="true">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span>SUBSCRIBING...</span>
        `;
        return;
      }

      if (status === "success") {
        btn.className =
          "w-full h-12 rounded-2xl bg-emerald-500 text-white font-black text-sm tracking-widest uppercase transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/20";
        btn.innerHTML = `
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7" />
          </svg>
          <span>Subscribed!</span>
        `;
        return;
      }
    };

    // Start: loading
    setStatus("loading");

    // Simulate API call (React: 1500ms)
    setTimeout(() => {
      // DEMO: store local
      const key = "demo_footer_subscribers";
      const list = JSON.parse(localStorage.getItem(key) || "[]");
      const lower = email.toLowerCase();
      if (!list.includes(lower)) list.push(lower);
      localStorage.setItem(key, JSON.stringify(list));

      // Success
      setStatus("success");
      input.value = "";
      setMsg("Subscribed! You’ll get notified about new courses.", true);

      // Reset back to idle after 3 seconds
      setTimeout(() => {
        setStatus("idle");
      }, 3000);
    }, 1500);
  });

  document.addEventListener("submit", async (e) => {
    const form = e.target?.closest?.('form[data-action="waitlist-form"]');
    if (!form) return;

    e.preventDefault();
    if (typeof form.reportValidity === "function" && !form.reportValidity()) return;

    const level = form.getAttribute("data-level") || "";
    const email = (form.querySelector('input[type="email"]')?.value || "").trim();

    if (!STATE.coursePage) STATE.coursePage = {};
    if (STATE.coursePage.waitlistLevel !== level) {
      STATE.coursePage.waitlistLevel = level;
      STATE.coursePage.waitlist = { isNotifying: false, isNotified: false, error: "" };
    }
    if (!STATE.coursePage.waitlist) STATE.coursePage.waitlist = { isNotifying:false, isNotified:false, error:"" };

    const wl = STATE.coursePage.waitlist;
    if (wl.isNotifying || wl.isNotified) return;

    wl.isNotifying = true;
    wl.error = "";
    render();

    try {
      await new Promise((r) => setTimeout(r, 700));

      const key = `demo_waitlist_${level || "unknown"}`;
      const list = JSON.parse(localStorage.getItem(key) || "[]");
      const lower = email.toLowerCase();
      if (!list.includes(lower)) list.push(lower);
      localStorage.setItem(key, JSON.stringify(list));

      wl.isNotifying = false;
      wl.isNotified = true;
      render();
    } catch (err) {
      wl.isNotifying = false;
      wl.error = "Something went wrong";
      render();
    }
  });

  const canHoverFinePointer = () =>
    window.matchMedia && window.matchMedia("(hover: hover) and (pointer: fine)").matches;

  document.addEventListener(
    "pointerover",
    (e) => {
      if (!canHoverFinePointer()) return; // ✅ desktop mouse sahaja
      const iframe = e.target?.closest?.('iframe[data-scroll-lock="worksheet"]');
      if (iframe) lockBodyScroll();
    },
    true
  );

  document.addEventListener(
    "pointerout",
    (e) => {
      if (!canHoverFinePointer()) return; // ✅ desktop mouse sahaja
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

    // Help Center: clear search
    if (action === "hc-clear") {
      const input = document.getElementById("hc-search");
      if (input && input instanceof HTMLInputElement) {
        input.value = "";
        input.dispatchEvent(new Event("input", { bubbles: true }));
        input.focus();
      }
      return;
    }

    if (action === "access-product") {
      e.preventDefault();

      // optional: refresh state from storage kalau kau nak betul-betul robust
      // loadUserFromStorage();

      if (STATE.user) {
        navigate("/dashboard");
      } else {
        navigate("/signin");
      }

      render();
      return;
    }

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
      const isCurrentEbook = type === "ebooks" && cc.activeTab === "ebook" && cc.selectedEbookId === id;

      toggleCompletion(type, id);

      // kalau baru sahaja mark watched untuk video yang sedang dimainkan → auto next
      if (isCurrentVideo && !wasDone) {
        goNextVideo(id);
      }

      // ebook: bila baru tekan "I've Finished Reading"
      if (isCurrentEbook && !wasDone) {
        // stop browser “keep focus at bottom”
        document.activeElement?.blur?.();

        // cuba pergi next ebook kalau ada
        goNextEbook(id);

        // apa pun, paksa scroll top lepas render
        __pendingEbookTop = true;

        // optional: paksa top sebelum render juga (lagi cepat rasa dia)
        forceEbookTop();
      }

      render();
      return;
    }

    if (action === "forgot-back") {
      STATE.forgotPassword.stage = "request";
      STATE.forgotPassword.code = "";
      STATE.forgotPassword.newPassword = "";
      STATE.forgotPassword.confirmPassword = "";
      STATE.forgotPassword.error = "";
      STATE.forgotPassword.message = "";
      render();
      return;
    }
  });

  // --- ONE submit handler only ---
  document.addEventListener("submit", async (e) => {
    const form = e.target.closest("form");
    if (!form) return;

    const action = form.getAttribute("data-action");
    if (!action) return;

    // ===== Checkout submit =====
    if (action === "checkout-submit") {
      e.preventDefault();

      const co = STATE.checkout;
      const courseId = co.courseId;
      if (!courseId || !COURSES[courseId]) { navigate("/"); render(); return; }

      const fullName = String(co.formData?.fullName || "").trim();
      const email = String(co.formData?.email || "").trim();
      const phoneNumber = String(co.formData?.phoneNumber || "").trim();
      const agreedTerms = !!co.formData?.agreedTerms;

      if (!fullName || !email || !phoneNumber || !agreedTerms || co.processing) return;

      co.processing = true;
      co.success = false; // reset kalau user back & submit lagi
      render();

      // simulate payment processing
      setTimeout(() => {
        // 1) Always store the purchased list (guest-safe)
        const purchased = JSON.parse(localStorage.getItem("sdc_purchased") || "[]");
        if (!purchased.includes(courseId)) purchased.push(courseId);
        localStorage.setItem("sdc_purchased", JSON.stringify(purchased));

        // 2) Do NOT auto-login after checkout
        // Remove/avoid setting "sdc_user" and STATE.user here.
        // Optionally keep the checkout email for prefilling the sign-in form.
        localStorage.setItem("sdc_checkout_email", (email || "").toLowerCase());

        // 3) If the user is already logged in (edge case), update their in-memory purchases
        if (STATE.user) {
          STATE.user.purchasedCourses = purchased;
        }

        co.processing = false;
        co.success = true;

        window.scrollTo({ top: 0, behavior: "auto" });
        render();
      }, 1800);

      return;
    }

    // ===== Sign in =====
    if (action === "signin-submit") {
      e.preventDefault();

      const email = (STATE.signIn.email || "").trim();
      const pw = (STATE.signIn.password || "").trim();
      if (!email || !pw) { STATE.signIn.error = "Isi email & password."; render(); return; }

      const userId = email.toLowerCase();
      const purchased = JSON.parse(localStorage.getItem("sdc_purchased") || "[]");

      localStorage.setItem("sdc_user", userId);
      localStorage.setItem("sdc_user_email", email);

      STATE.user = { id: userId, email, purchasedCourses: purchased, must_change_password: false };
      navigate("/dashboard");
      render();
      return;
    }

    // ===== Forgot Password (request code) =====
    if (action === "forgot-request") {
      e.preventDefault();

      const email = (STATE.forgotPassword.email || "").trim().toLowerCase();
      if (!email) {
        STATE.forgotPassword.error = "Email is required.";
        render();
        return;
      }

      STATE.forgotPassword.loading = true;
      STATE.forgotPassword.error = "";
      STATE.forgotPassword.message = "";
      render();

      STATE.forgotPassword.stage = "reset";
      STATE.forgotPassword.message = "Verification code sent. (Use: 123456)";
      STATE.forgotPassword.loading = false;
      render();
      return;
    }

    // ===== Forgot Password (reset) =====
    if (action === "forgot-reset") {
      e.preventDefault();

      const email = (STATE.forgotPassword.email || "").trim().toLowerCase();
      const code = (STATE.forgotPassword.code || "").trim();
      const p1 = STATE.forgotPassword.newPassword || "";
      const p2 = STATE.forgotPassword.confirmPassword || "";

      if (!email || !code || !p1 || !p2) {
        STATE.forgotPassword.error = "All fields are required.";
        render();
        return;
      }
      if (p1 !== p2) {
        STATE.forgotPassword.error = "Passwords do not match.";
        render();
        return;
      }

      STATE.forgotPassword.loading = true;
      STATE.forgotPassword.error = "";
      STATE.forgotPassword.message = "";
      render();

      if (code !== "123456") {
        STATE.forgotPassword.loading = false;
        STATE.forgotPassword.error = "Invalid code. Try 123456.";
        render();
        return;
      }

      STATE.forgotPassword.stage = "request";
      STATE.forgotPassword.code = "";
      STATE.forgotPassword.newPassword = "";
      STATE.forgotPassword.confirmPassword = "";
      STATE.forgotPassword.message = "Password updated. Please sign in.";
      STATE.forgotPassword.loading = false;

      navigate("/signin");
      render();
      return;
    }

    // ===== Change Password (first-login enforce) =====
    if (action === "change-password-submit") {
      e.preventDefault();

      if (!STATE.user) {
        navigate("/signin");
        render();
        return;
      }

      const email = (STATE.user.email || "").trim().toLowerCase();
      const current = STATE.changePassword.currentPassword || "";
      const p1 = STATE.changePassword.newPassword || "";
      const p2 = STATE.changePassword.confirmPassword || "";

      if (!current || !p1 || !p2) {
        STATE.changePassword.error = "All fields are required.";
        render();
        return;
      }
      if (p1 !== p2) {
        STATE.changePassword.error = "Passwords do not match.";
        render();
        return;
      }

      STATE.changePassword.loading = true;
      STATE.changePassword.error = "";
      STATE.changePassword.message = "";
      render();

      STATE.user.must_change_password = false;

      STATE.changePassword.currentPassword = "";
      STATE.changePassword.newPassword = "";
      STATE.changePassword.confirmPassword = "";
      STATE.changePassword.message = "Password updated successfully.";
      STATE.changePassword.loading = false;

      navigate("/dashboard");
      render();
      return;
    }
  });

  document.addEventListener("input", (e) => {
    const t = e.target;
    if (!(t instanceof HTMLInputElement)) return;

    // Help Center search (simple client-side filter)
    if (t.id === "hc-search") {
      const q = (t.value || "").toLowerCase().trim();

      const items = Array.from(document.querySelectorAll(".hc-item"));
      let visibleCount = 0;

      items.forEach((el) => {
        const hay = (el.getAttribute("data-haystack") || "").toLowerCase();
        const show = !q || hay.includes(q);
        el.classList.toggle("hidden", !show);
        if (show) visibleCount += 1;
      });

      // Hide empty columns (category wrappers)
      const cols = Array.from(document.querySelectorAll("#hc-grid > div"));
      cols.forEach((col) => {
        const anyVisible = !!col.querySelector(".hc-item:not(.hidden)");
        col.classList.toggle("hidden", !anyVisible);
      });

      const empty = document.getElementById("hc-empty");
      const grid = document.getElementById("hc-grid");
      if (empty && grid) {
        const showEmpty = visibleCount === 0;
        empty.classList.toggle("hidden", !showEmpty);
        grid.classList.toggle("hidden", showEmpty);

        const title = document.getElementById("hc-empty-title");
        if (title) title.textContent = showEmpty ? `No results found for "${t.value}"` : "";
      }

      return;
    }

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

    // Sign-in / Forgot / Change inputs
    const field = t.getAttribute("data-field");
    if (!field) return;

    const value = t.type === "checkbox" ? t.checked : t.value;

    if (field === "signin-email") {
      STATE.signIn.email = value;
      if (STATE.signIn.error) STATE.signIn.error = "";
    }

    if (field === "signin-password") {
      STATE.signIn.password = value;
      if (STATE.signIn.error) STATE.signIn.error = "";
    }

    // Forgot password fields
    if (field === "forgot-email") STATE.forgotPassword.email = value;
    if (field === "forgot-code") STATE.forgotPassword.code = value;
    if (field === "forgot-new") STATE.forgotPassword.newPassword = value;
    if (field === "forgot-confirm") STATE.forgotPassword.confirmPassword = value;

    // Change password fields
    if (field === "change-current") STATE.changePassword.currentPassword = value;
    if (field === "change-new") STATE.changePassword.newPassword = value;
    if (field === "change-confirm") STATE.changePassword.confirmPassword = value;

    if (STATE.forgotPassword.error) STATE.forgotPassword.error = "";
    if (STATE.changePassword.error) STATE.changePassword.error = "";
  });

  // Content protection: disable context menu on CourseContent root (mirrors TSX onContextMenu)
  document.addEventListener("contextmenu", (e) => {
    const root = document.getElementById("course-content-root");
    if (root && root.contains(e.target)) {
      e.preventDefault();
    }
  });

  // Footer / any link: route + scroll to section
  document.addEventListener("click", (e) => {
    const a = e.target.closest("a");
    if (!a) return;

    const scrollId = a.getAttribute("data-scroll");
    const href = a.getAttribute("href") || "";

    if (scrollId && href.startsWith("#/")) {
      STATE.__pendingScrollId = scrollId;

      const current = window.location.hash || "#/";

      if (current !== href) {
        window.location.hash = href; // 🔥 trigger hashchange + render
      } else {
        render(); // already on same route
      }

      return;
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

  window.addEventListener("hashchange", () => {
    // default: scroll to top on route change
    if (!STATE.__pendingScrollId) {
      window.scrollTo({ top: 0, behavior: "auto" });
    }
    render();
  });

    // boot
  loadUserFromStorage();

  try {
    // load courses (DEMO/static)
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
      wrapEbookTablesForScroll();

      if (__pendingEbookTop) {
        __pendingEbookTop = false;
        forceEbookTop();
        requestAnimationFrame(forceEbookTop);
      }

      // After render: perform pending scroll (for footer "Courses" -> section)
      if (STATE.__pendingScrollId) {
        const id = STATE.__pendingScrollId;
        const el = document.getElementById(id);

        if (el) {
          // bagi layout settle dulu
          requestAnimationFrame(() => {
            el.scrollIntoView({ behavior: "smooth", block: "start" });
          });
          STATE.__pendingScrollId = null;
        }
      }
    });
  };

  const appRoot = document.getElementById("app");
  if (appRoot) {
    const mo = new MutationObserver(queueAfterRender);
    mo.observe(appRoot, { childList: true, subtree: true });
    queueAfterRender();
  }
})();
