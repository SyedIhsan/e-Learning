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
const START_PAYMENT_URL = new URL("../payment/start.php", import.meta.url).toString();

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

  document.addEventListener("submit", async (e) => {
    const form = e.target?.closest?.('form[data-action="footer-subscribe-form"]');
    if (!form) return;

    e.preventDefault();
    e.stopImmediatePropagation();
    if (typeof form.reportValidity === "function" && !form.reportValidity()) return;

    const input = form.querySelector('input[type="email"]');
    const btn = form.querySelector('button[type="submit"]');
    const msg = form.querySelector('[data-role="footer-subscribe-msg"]');

    const email = (input?.value || "").trim();
    if (!email) return;

    const levels = ["beginner", "intermediate", "advanced"];

    const setMsg = (text, ok = true) => {
      if (!msg) return;
      msg.classList.remove("hidden");
      msg.textContent = text;
      msg.className = `text-xs text-center ${ok ? "text-emerald-300" : "text-rose-300"}`;
    };

    try {
      if (btn) { btn.disabled = true; btn.textContent = "SUBSCRIBING..."; }
      if (input) input.disabled = true;

      await Promise.all(
        levels.map(async (level) => {
          const res = await fetch("/e-Learning/api/waitlist_subscribe.php", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, level }),
          });
          const data = await res.json().catch(() => ({}));
          if (!res.ok || !data.ok) throw new Error(data.error || `Subscribe failed (${level})`);
        })
      );

      setMsg("Subscribed! You’ll get notified for any new course.", true);
      if (input) input.value = "";
    } catch (err) {
      setMsg(err?.message || "Something went wrong. Try again.", false);
    } finally {
      if (btn) { btn.disabled = false; btn.textContent = "SUBSCRIBE NOW"; }
      if (input) input.disabled = false;
    }
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
      const res = await fetch("/e-Learning/api/waitlist_subscribe.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, level }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) throw new Error(data.error || "Request failed");

      wl.isNotifying = false;
      wl.isNotified = true;
      render();
    } catch (err) {
      wl.isNotifying = false;
      wl.error = err?.message || "Something went wrong";
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

    // endpoints (match your api/auth folder)
    const AUTH_LOGIN_URL  = new URL("../api/auth/login.php", import.meta.url).toString();
    const AUTH_FORGOT_URL = new URL("../api/auth/forgot_password.php", import.meta.url).toString();
    const AUTH_RESET_URL  = new URL("../api/auth/reset_password.php", import.meta.url).toString();
    const AUTH_CHANGE_URL = new URL("../api/auth/change_password.php", import.meta.url).toString();

    // ===== Checkout submit =====
    if (action === "checkout-submit") {
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

      const submitter = e.submitter || document.activeElement;

      let payMode = "live";
      if (submitter && submitter.getAttribute) {
        const n = submitter.getAttribute("name");
        if (n === "pay_mode") {
          payMode = submitter.getAttribute("value") || submitter.value || "live";
        }
      }

      co.processing = true;
      render();
       
      const startUrl =
        payMode === "sandbox"
          ? `${START_PAYMENT_URL}${START_PAYMENT_URL.includes("?") ? "&" : "?"}sandbox=1`
          : START_PAYMENT_URL;
      
      const f = document.createElement("form");
      f.method = "POST";
      f.action = startUrl;

      const payload = { course_id: courseId, name: fullName, email, phone: phoneNumber };
      for (const [k, v] of Object.entries(payload)) {
        const i = document.createElement("input");
        i.type = "hidden";
        i.name = k;
        i.value = v;
        f.appendChild(i);
      }

      document.body.appendChild(f);
      f.submit();
      return;
    }

    // ===== Sign in =====
    if (action === "signin-submit") {
      e.preventDefault();

      const email = (STATE.signIn.email || "").trim();
      const pw = (STATE.signIn.password || "").trim();

      if (!email || !pw) {
        STATE.signIn.error = "Please enter your email and password.";
        render();
        return;
      }

      try {
        const resp = await fetch(AUTH_LOGIN_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password: pw }),
        });

        const data = await resp.json().catch(() => ({}));
        if (!resp.ok || !data?.ok) throw new Error(data?.error || "Login failed.");

        const u = data.user || {};
        localStorage.setItem("sdc_user", u.id || "");
        localStorage.setItem("sdc_user_email", u.email || email);
        localStorage.setItem("sdc_purchased", JSON.stringify(u.purchasedCourses || []));

        STATE.user = {
          id: u.id || "",
          email: u.email || email,
          purchasedCourses: u.purchasedCourses || [],
          must_change_password: !!u.must_change_password,
        };

        if (STATE.user.must_change_password) navigate("/change-password");
        else navigate("/dashboard");

        render();
      } catch (err) {
        STATE.signIn.error = err?.message || "Login failed.";
        render();
      }

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

      try {
        const res = await fetch(AUTH_FORGOT_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        });

        const data = await res.json().catch(() => ({}));
        if (!res.ok || data.ok === false) {
          throw new Error(data.error || "Failed to send verification code.");
        }

        STATE.forgotPassword.stage = "reset";
        STATE.forgotPassword.message = "Verification code sent. Please check your email.";
      } catch (err) {
        STATE.forgotPassword.error = err?.message || "Request failed.";
      } finally {
        STATE.forgotPassword.loading = false;
        render();
      }

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

      try {
        const res = await fetch(AUTH_RESET_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, code, new_password: p1 }),
        });

        const data = await res.json().catch(() => ({}));
        if (!res.ok || data.ok === false) {
          throw new Error(data.error || "Failed to reset password.");
        }

        STATE.forgotPassword.stage = "request";
        STATE.forgotPassword.code = "";
        STATE.forgotPassword.newPassword = "";
        STATE.forgotPassword.confirmPassword = "";
        STATE.forgotPassword.message = "Password updated. Please sign in.";
        navigate("/signin");
      } catch (err) {
        STATE.forgotPassword.error = err?.message || "Reset failed.";
      } finally {
        STATE.forgotPassword.loading = false;
        render();
      }

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

      try {
        const res = await fetch(AUTH_CHANGE_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, current_password: current, new_password: p1 }),
        });

        const data = await res.json().catch(() => ({}));
        if (!res.ok || data.ok === false) {
          throw new Error(data.error || "Failed to update password.");
        }

        STATE.user.must_change_password = false;

        STATE.changePassword.currentPassword = "";
        STATE.changePassword.newPassword = "";
        STATE.changePassword.confirmPassword = "";
        STATE.changePassword.message = "Password updated successfully.";

        navigate("/dashboard");
      } catch (err) {
        STATE.changePassword.error = err?.message || "Update failed.";
      } finally {
        STATE.changePassword.loading = false;
        render();
      }

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
