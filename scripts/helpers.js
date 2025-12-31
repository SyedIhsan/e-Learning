// -----------------------------
// Helpers
// -----------------------------

import STATE from "./state.js";
import { COURSES } from "../data/course.js";

export const $app = () => document.getElementById("app");

export const escapeHtml = (s) => {
    if (s == null) return "";
    return String(s)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  };

export const encodeQS = (s) => encodeURIComponent(String(s || ""));

export const getPurchasedList = () =>
    JSON.parse(localStorage.getItem("sdc_purchased") || "[]");

export const loadUserFromStorage = () => {
  const savedUser = localStorage.getItem("sdc_user");
  const savedEmail = localStorage.getItem("sdc_user_email") || "";
  const purchased = localStorage.getItem("sdc_purchased") || "[]";
  if (savedUser) {
    STATE.user = {
      id: savedUser,
      email: savedEmail,
      purchasedCourses: JSON.parse(purchased),
    };
  }
};

export const handleLogin = (userId, email = "") => {
  const purchased = JSON.parse(localStorage.getItem("sdc_purchased") || "[]");
  STATE.user = { id: userId, email: email || "", purchasedCourses: purchased };
  localStorage.setItem("sdc_user", userId);
  localStorage.setItem("sdc_user_email", email || "");
};

export const handleLogout = () => {
  STATE.user = null;
  localStorage.removeItem("sdc_user");
  localStorage.removeItem("sdc_user_email");
};

export const getPath = () => {
    const raw = window.location.hash || "#/";
    let p = raw.startsWith("#") ? raw.slice(1) : raw;
    if (!p.startsWith("/")) p = "/" + p;
    // normalize
    if (p.length > 1 && p.endsWith("/")) p = p.slice(0, -1);
    return p;
  };

export const navigate = (path) => {
    if (!path.startsWith("/")) path = "/" + path;
    window.location.hash = "#" + path;
  };

export const resetPageStatesOnRoute = (path) => {
    // CoursePage mount reset when entering a different level
    if (path === "/beginner" || path === "/intermediate" || path === "/advanced") {
      const lvl = path.slice(1);
      if (STATE.coursePage.level !== lvl) {
        STATE.coursePage.level = lvl;
        STATE.coursePage.buyingId = null;
        STATE.coursePage.successId = null;
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    } else {
      // leaving course pages resets level like React unmount
      if (STATE.coursePage.level !== null) {
        STATE.coursePage.level = null;
        STATE.coursePage.buyingId = null;
        STATE.coursePage.successId = null;
      }
    }

    // CourseDetail mount/unmount behavior:
    // - Unmount resets state when leaving /course/*
    // - Param change keeps state (matches React), but triggers scrollTo(0,0)
    const isCourseDetail = path.startsWith("/course/");
    if (isCourseDetail) {
      const courseId = path.split("/")[2] || null;
      if (!STATE.courseDetail.active) {
        STATE.courseDetail.active = true;
        STATE.courseDetail.buying = false;
        STATE.courseDetail.success = false;
        STATE.courseDetail.lastCourseId = courseId;
        window.scrollTo(0, 0);
      } else if (STATE.courseDetail.lastCourseId !== courseId) {
        STATE.courseDetail.lastCourseId = courseId;
        window.scrollTo(0, 0);
      }
    } else if (STATE.courseDetail.active) {
      STATE.courseDetail.active = false;
      STATE.courseDetail.buying = false;
      STATE.courseDetail.success = false;
      STATE.courseDetail.lastCourseId = null;
    }

    // SignIn mount/unmount resets
    if (path === "/signin") {
      if (!STATE.signIn.active) {
        STATE.signIn.active = true;
        STATE.signIn.id = "";
        STATE.signIn.email = "";
        STATE.signIn.password = "";
        STATE.signIn.error = "";
      }
    } else if (STATE.signIn.active) {
      STATE.signIn.active = false;
      STATE.signIn.id = "";
      STATE.signIn.email = "";
      STATE.signIn.password = "";
      STATE.signIn.error = "";
    }

    // Dashboard mount/unmount resets
    if (path === "/dashboard") {
      if (!STATE.dashboard.active) {
        STATE.dashboard.active = true;
        STATE.dashboard.filter = "All";
      }
    } else if (STATE.dashboard.active) {
      STATE.dashboard.active = false;
      STATE.dashboard.filter = "All";
    }

    // Checkout mount/unmount + param change initialization
    const isCheckout = path.startsWith("/checkout/");
    if (isCheckout) {
      const courseId = path.split("/")[2] || null;
      const user = STATE.user;

      const initForm = () => {
        STATE.checkout.processing = false;
        STATE.checkout.success = false;
        STATE.checkout.formData = {
          fullName: "",
          email: user?.id ? `${user.id}@example.com` : "",
          phoneNumber: "",
          agreedTerms: false,
        };
      };

      if (!STATE.checkout.active) {
        STATE.checkout.active = true;
        STATE.checkout.courseId = courseId;
        initForm();
        window.scrollTo(0, 0);
      } else if (STATE.checkout.courseId !== courseId) {
        STATE.checkout.courseId = courseId;
        initForm();
        window.scrollTo(0, 0);
      }
    } else if (STATE.checkout.active) {
      STATE.checkout.active = false;
      STATE.checkout.courseId = null;
      STATE.checkout.processing = false;
      STATE.checkout.success = false;
      STATE.checkout.formData = {
        fullName: "",
        email: "",
        phoneNumber: "",
        agreedTerms: false,
      };
    }

    // CourseContent mount/unmount + param change initialization
    const isCourseContent = path.startsWith("/course-content/");
    if (isCourseContent) {
      const courseId = path.split("/")[2] || null;
      if (!STATE.courseContent.active) {
        STATE.courseContent.active = true;
        STATE.courseContent.courseId = courseId;
        initCourseContent(courseId);
      } else if (STATE.courseContent.courseId !== courseId) {
        STATE.courseContent.courseId = courseId;
        initCourseContent(courseId);
      }
    } else if (STATE.courseContent.active) {
      STATE.courseContent.active = false;
      STATE.courseContent.courseId = null;
      STATE.courseContent.activeTab = "video";
      STATE.courseContent.selectedVideoId = null;
      STATE.courseContent.selectedEbookId = null;
      STATE.courseContent.selectedWorkbookId = null;
      STATE.courseContent.completion = { videos: [], ebooks: [], workbooks: [] };
      STATE.courseContent.workbookSheetUrls = {};
      STATE.courseContent.workbookLoadingKey = null;
      STATE.courseContent.workbookError = "";
    }
  };

export const initCourseContent = (courseId) => {
    const user = STATE.user;
    const course = COURSES[courseId];
    STATE.courseContent.activeTab = "video";
    STATE.courseContent.selectedVideoId = course?.content?.videos?.[0]?.id || null;
    STATE.courseContent.selectedEbookId = course?.content?.ebooks?.[0]?.id || null;
    STATE.courseContent.selectedWorkbookId = course?.content?.workbooks?.[0]?.id || null;

    // reset workbook runtime cache for this course view
    STATE.courseContent.workbookSheetUrls = {};
    STATE.courseContent.workbookLoadingKey = null;
    STATE.courseContent.workbookError = "";

    if (user && courseId) {
      const saved = localStorage.getItem(`sdc_course_progress_${user.id}_${courseId}`);
      if (saved) {
        try {
          STATE.courseContent.completion = JSON.parse(saved);
        } catch {
          STATE.courseContent.completion = { videos: [], ebooks: [], workbooks: [] };
      STATE.courseContent.workbookSheetUrls = {};
      STATE.courseContent.workbookLoadingKey = null;
      STATE.courseContent.workbookError = "";
        }
      } else {
        STATE.courseContent.completion = { videos: [], ebooks: [], workbooks: [] };
      STATE.courseContent.workbookSheetUrls = {};
      STATE.courseContent.workbookLoadingKey = null;
      STATE.courseContent.workbookError = "";
      }
    }
  };

export const toggleCompletion = (type, itemId) => {
    const cc = STATE.courseContent;
    const list = cc.completion[type] || [];
    const exists = list.includes(itemId);
    const updated = exists ? list.filter((x) => x !== itemId) : [...list, itemId];
    cc.completion = { ...cc.completion, [type]: updated };
    const user = STATE.user;
    const courseId = cc.courseId;
    if (user && courseId) {
      localStorage.setItem(
        `sdc_course_progress_${user.id}_${courseId}`,
        JSON.stringify(cc.completion)
      );
    }
  };

export const isCompleted = (type, itemId) => {
    const list = STATE.courseContent.completion[type] || [];
    return list.includes(itemId);
  };

export const calculateProgress = (type) => {
    const courseId = STATE.courseContent.courseId;
    const course = COURSES[courseId];
    if (!course) return 0;
    const total =
      type === "videos"
        ? course.content.videos.length
        : type === "ebooks"
        ? course.content.ebooks.length
        : course.content.workbooks.length;
    if (total === 0) return 0;
    const done = (STATE.courseContent.completion[type] || []).length;
    return Math.round((done / total) * 100);
  };