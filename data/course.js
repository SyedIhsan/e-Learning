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

export const createMockContent = (id, title) => ({
    videos: [
      {
        id: `${id}-v1`,
        title: `Introduction to ${title}`,
        url: "https://www.youtube.com/embed/EerdGm-ehJQ",
        description: "Core concepts and overview.",
      },
      {
        id: `${id}-v2`,
        title: `Practical Application`,
        url: "https://www.youtube.com/embed/SccSCuHhbcM",
        description: "Hands-on walk-through.",
      },
    ],
    workbooks: [
      {
        id: `${id}-w1`,
        title: `${title} Exercise Sheet`,
        url: "https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit?usp=sharing",
      },
    ],
    ebooks: [
      {
        id: `${id}-e1`,
        title: `${title} Master Guide`,
        content: `<h2>The ${title} Guide</h2><p>Comprehensive documentation for mastering these skills.</p>`,
      },
    ],
  });

export const COURSES_DATA = [
    // BEGINNER
    {
      id: "beg-101",
      level: CourseLevel.BEGINNER,
      title: "Web Foundations",
      description: "Master HTML5 and CSS3 from scratch. The essential starting point.",
      price: "$49.99",
      duration: "4 Weeks",
      modules: ["HTML Semantic Tags", "CSS Layouts", "Responsive Design"],
      instructor: "Sarah Jenkins",
      image:
        "https://images.unsplash.com/photo-1547658719-da2b51169166?auto=format&fit=crop&q=80&w=800",
      content: createMockContent("beg-101", "Web Foundations"),
    },
    {
      id: "beg-102",
      level: CourseLevel.BEGINNER,
      title: "JavaScript Basics",
      description: "Learn logic, variables, and DOM manipulation for the modern web.",
      price: "$59.99",
      duration: "5 Weeks",
      modules: ["Variables & Types", "Functions", "Event Listeners"],
      instructor: "Michael Chen",
      image:
        "https://images.unsplash.com/photo-1579468118864-1b9ea3c0db4a?auto=format&fit=crop&q=80&w=800",
      content: createMockContent("beg-102", "JavaScript Basics"),
    },
    {
      id: "beg-103",
      level: CourseLevel.BEGINNER,
      title: "UI Design Fundamentals",
      description: "Design beautiful interfaces using Figma and core design principles.",
      price: "$39.99",
      duration: "3 Weeks",
      modules: ["Color Theory", "Typography", "Prototyping"],
      instructor: "Elena Rodriguez",
      image:
        "https://images.unsplash.com/photo-1586717791821-3f44a563eb4c?auto=format&fit=crop&q=80&w=800",
      content: createMockContent("beg-103", "UI Design Fundamentals"),
    },

    // INTERMEDIATE
    {
      id: "int-201",
      level: CourseLevel.INTERMEDIATE,
      title: "React Professional",
      description:
        "Build complex SPAs with React, Hooks, and modern state management.",
      price: "$89.99",
      duration: "8 Weeks",
      modules: ["Custom Hooks", "Context API", "Performance Tuning"],
      instructor: "Michael Chen",
      image:
        "https://images.unsplash.com/photo-1633356122544-f134324a6cee?auto=format&fit=crop&q=80&w=800",
      content: createMockContent("int-201", "React Professional"),
    },
    {
      id: "int-202",
      level: CourseLevel.INTERMEDIATE,
      title: "Node.js & Express",
      description: "Create robust backend APIs and manage databases with ease.",
      price: "$79.99",
      duration: "6 Weeks",
      modules: ["Middleware", "RESTful APIs", "MongoDB Integration"],
      instructor: "Sarah Jenkins",
      image:
        "https://images.unsplash.com/photo-1537432376769-00f5c2f4c8d2?auto=format&fit=crop&q=80&w=800",
      content: createMockContent("int-202", "Node.js & Express"),
    },
    {
      id: "int-203",
      level: CourseLevel.INTERMEDIATE,
      title: "TypeScript for Devs",
      description:
        "Scale your applications with types. Essential for enterprise development.",
      price: "$69.99",
      duration: "4 Weeks",
      modules: ["Interfaces", "Generics", "React + TS"],
      instructor: "Dr. Elena Rodriguez",
      image:
        "https://images.unsplash.com/photo-1516116216624-53e697fedbea?auto=format&fit=crop&q=80&w=800",
      content: createMockContent("int-203", "TypeScript"),
    },

    // ADVANCED
    {
      id: "adv-301",
      level: CourseLevel.ADVANCED,
      title: "Cloud Architecture",
      description: "Scale systems globally using AWS, Docker, and Kubernetes.",
      price: "$149.99",
      duration: "10 Weeks",
      modules: ["Microservices", "EKS Deployment", "Cloud Security"],
      instructor: "Dr. Elena Rodriguez",
      image:
        "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&q=80&w=800",
      content: createMockContent("adv-301", "Cloud Architecture"),
    },
    {
      id: "adv-302",
      level: CourseLevel.ADVANCED,
      title: "Machine Learning Ops",
      description: "Deploy and monitor ML models in production environments.",
      price: "$199.99",
      duration: "12 Weeks",
      modules: ["Model Versioning", "Pipeline Automation", "A/B Testing"],
      instructor: "Sarah Jenkins",
      image:
        "https://images.unsplash.com/photo-1555949963-aa79dcee981c?auto=format&fit=crop&q=80&w=800",
      content: createMockContent("adv-302", "ML Ops"),
    },
    {
      id: "adv-303",
      level: CourseLevel.ADVANCED,
      title: "Cybersecurity Expert",
      description:
        "Advanced penetration testing and enterprise defense strategies.",
      price: "$179.99",
      duration: "8 Weeks",
      modules: ["Ethical Hacking", "SOC Operations", "Zero Trust"],
      instructor: "Michael Chen",
      image:
        "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&q=80&w=800",
      content: createMockContent("adv-303", "Cybersecurity"),
    },
  ];

export const COURSES = COURSES_DATA.reduce((acc, course) => {
    acc[course.id] = course;
    return acc;
  }, {});

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
