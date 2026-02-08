// route.js
import STATE from "./state.js";
import renderNavbar from "./Navbar.js";
import renderFooter from "./footer.js";

import renderHome from "./home.js";
import renderCoursePage from "./coursePage.js";
import renderCourseDetail from "./courseDetail.js";
import renderCourseContent from "./courseContent.js";
import renderDashboard from "./dashboard.js";
import renderHelpCenter from "./helpCenter.js";
import renderInstructors from "./instructors.js";
import renderEnterprise from "./enterprise.js";
import renderSignIn from "./signIn.js";
import renderCheckout from "./checkout.js";
import renderForgotPassword from "./forgotPassword.js";
import renderChangePassword from "./changePassword.js";

import { resetPageStatesOnRoute } from "./helpers.js";
import renderPrivacy from "./privacy.js";
import renderTerms from "./terms.js";
import renderNotFound from "./notFound.js";

const $app = () => document.getElementById("app");

const cssEscape = (v) => {
  try {
    return CSS.escape(String(v));
  } catch {
    return String(v).replace(/"/g, '\\"');
  }
};

const captureActiveField = () => {
  const el = document.activeElement;
  if (!el) return null;

  const tag = (el.tagName || "").toLowerCase();
  if (tag !== "input" && tag !== "textarea") return null;

  const name = el.getAttribute("name");
  const field = el.getAttribute("data-field");
  const id = el.getAttribute("id");

  const key = name ? `name:${name}` : field ? `field:${field}` : id ? `id:${id}` : null;
  if (!key) return null;

  return {
    key,
    start: typeof el.selectionStart === "number" ? el.selectionStart : null,
    end: typeof el.selectionEnd === "number" ? el.selectionEnd : null,
  };
};

const restoreActiveField = (meta) => {
  if (!meta?.key) return;

  requestAnimationFrame(() => {
    let selector = "";

    if (meta.key.startsWith("name:")) {
      const v = meta.key.slice(5);
      selector = `input[name="${cssEscape(v)}"], textarea[name="${cssEscape(v)}"]`;
    } else if (meta.key.startsWith("field:")) {
      const v = meta.key.slice(6);
      selector = `input[data-field="${cssEscape(v)}"], textarea[data-field="${cssEscape(v)}"]`;
    } else if (meta.key.startsWith("id:")) {
      const v = meta.key.slice(3);
      selector = `#${cssEscape(v)}`;
    }

    const el = document.querySelector(selector);
    if (!el) return;

    el.focus({ preventScroll: true });
    if (typeof meta.start === "number" && typeof meta.end === "number" && el.setSelectionRange) {
      try {
        el.setSelectionRange(meta.start, meta.end);
      } catch {}
    }
  });
};

export const getPath = () => {
  const hash = window.location.hash || "#/";
  return hash.replace(/^#/, "") || "/";
};

export const renderRoute = (path) => {
  // Home
  if (path === "/" || path === "") return renderHome();

  // Course listing by level
  if (path === "/beginner") return renderCoursePage("beginner");
  if (path === "/intermediate") return renderCoursePage("intermediate");
  if (path === "/advanced") return renderCoursePage("advanced");

  // Course detail
  if (path.startsWith("/course/")) {
    const courseId = decodeURIComponent(path.replace("/course/", ""));
    return renderCourseDetail(courseId);
  }

  // Course content (this MUST match your dashboard links)
  if (path.startsWith("/course-content/")) {
    const courseId = decodeURIComponent(path.replace("/course-content/", ""));
    return renderCourseContent(courseId);
  }

  // Dashboard
  if (path === "/dashboard") return renderDashboard();
  if (path === "/help") return renderHelpCenter();
  if (path === "/instructors") return renderInstructors();
  if (path === "/enterprise") return renderEnterprise();

  // Auth
  if (path === "/signin") return renderSignIn();
  if (path === "/forgot-password") return renderForgotPassword();
  if (path === "/change-password") return renderChangePassword();

  // Checkout
  if (path.startsWith("/checkout/")) {
    const courseId = decodeURIComponent(path.replace("/checkout/", ""));
    return renderCheckout(courseId);
  }

  if (path === "/privacy") return renderPrivacy();
  if (path === "/terms") return renderTerms();

  // 404
  return renderNotFound();
};

let __lastPath = null;

export const render = () => {
  const app = $app();
  if (!app) return;

  const path = getPath();

  const shouldScrollTop = path !== __lastPath;
  __lastPath = path;

  const active = captureActiveField();
  resetPageStatesOnRoute(path);

  const pageHtml = renderRoute(path);

  app.innerHTML = `
    ${renderNavbar()}
    <main class="min-h-[calc(100vh-120px)] bg-slate-50">
      ${pageHtml}
    </main>
    ${renderFooter()}
  `;

  if (shouldScrollTop) {
    window.scrollTo({ top: 0, behavior: "auto" });
  }

  restoreActiveField(active);
};