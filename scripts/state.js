// -----------------------------
// State (mirrors React component state)
// -----------------------------
const STATE = {
  user: null, // { id, email, purchasedCourses }
  nav: { isMenuOpen: false },

  // Page states (reset on mount/unmount like React)
  coursePage: { level: null, buyingId: null, successId: null },
  courseDetail: { active: false, buying: false, success: false, lastCourseId: null },
  signIn: { active: false, id: "", email: "", password: "", error: "" },
  dashboard: { active: false, filter: "All" },
  checkout: {
    active: false,
    courseId: null,
    processing: false,
    success: false,
    formData: {
      fullName: "",
      email: "",
      phoneNumber: "",
      agreedTerms: false,
    },
  },
  courseContent: {
    active: false,
    courseId: null,
    activeTab: "video",
    selectedVideoId: null,
    selectedEbookId: null,
    selectedWorkbookId: null,
    completion: { videos: [], ebooks: [], workbooks: [] },

    // Workbook (Google Sheets) on-demand per user
    workbookSheetUrls: {}, // key: `${courseId}:${workbookId}` => embedUrl
    workbookLoadingKey: null,
    workbookError: "",
  },

  prevPath: null,
};

export default STATE;