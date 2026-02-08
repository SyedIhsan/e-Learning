// Static DEMO course catalog (no DB / no PHP / no JSON fetch)
// Goal: keep existing app code working with minimal edits.
// Exports:
// - CourseLevel (enum-like)
// - COURSES (map by id)
// - COURSES_DATA (array view)
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

// ---------- DEMO DATA (embedded) ----------

// Helper: strip currency if someone accidentally leaves "$49.99"
const normalizePriceString = (p) => {
  const s = String(p ?? "").trim();
  if (!s) return "";
  // keep digits and dot only
  const cleaned = s.replace(/[^\d.]/g, "");
  return cleaned || "";
};

// Convert Google Sheets "edit" link -> embeddable "preview" link
const toSheetsPreviewUrl = (rawUrl) => {
  const url = String(rawUrl || "").trim();
  if (!url) return "";
  // If already preview, keep
  if (url.includes("/preview")) return url;
  // Convert /edit?... to /preview
  return url.replace(/\/edit(\?.*)?$/i, "/preview");
};

// Helper for generating standard mock content with multiple workbooks
const createMockContent = (id, title) => {
  const commonVideos = [
    {
      id: `${id}-v1`,
      title: `Understanding ${title}`,
      url: "https://youtu.be/rYQgy8QDEBI?si=iSaoxxd-UaJonLf-",
      description: "Core financial concepts and blockchain overview.",
    },
    {
      id: `${id}-v2`,
      title: `Executing ${title} Strategies`,
      url: "https://youtu.be/kis7l0y1JUg?si=mWrcBtNyqAdm59sU",
      description: "Live market walk-through and execution steps.",
    },
  ];

  const commonEbooks = [
    {
      id: `${id}-e1`,
      title: `The ${title} Blueprint`,
      content: `
        <h2>Mastering ${title}</h2>
        <p>
          This blueprint is designed as a practical, step-by-step guide to help you build clarity, discipline, and repeatable
          decision-making in crypto. It focuses on process, risk control, and consistent execution—so you can survive volatility
          and compound skill over time.
        </p>

        <h3>1) What You’re Really Learning</h3>
        <p>
          Most people think crypto is about “finding the next big coin.” Professionals know it’s about running a system:
          <strong>risk → entries → exits → review</strong>. You are not paid for being right—you are paid for managing uncertainty.
        </p>
        <ul>
          <li><strong>Risk Management:</strong> staying in the game long enough to win.</li>
          <li><strong>Market Structure:</strong> understanding trend, range, and volatility regimes.</li>
          <li><strong>Execution:</strong> entries/exits based on rules, not emotions.</li>
          <li><strong>Review:</strong> measuring what works and removing what doesn’t.</li>
        </ul>

        <h3>2) The Core Framework (A Simple Professional System)</h3>
        <p>
          Use this framework every time you open a chart. If you skip steps, you increase randomness.
        </p>
        <ol>
          <li><strong>Context:</strong> What market regime is this (trend, range, breakout, mean-revert)?</li>
          <li><strong>Levels:</strong> Identify support/resistance, liquidity zones, and key swing points.</li>
          <li><strong>Plan:</strong> Define entry trigger, stop-loss, and take-profit before you trade.</li>
          <li><strong>Position Size:</strong> Set your size based on risk, not based on excitement.</li>
          <li><strong>Post-Trade Review:</strong> Log outcome + decision quality (not just profit).</li>
        </ol>

        <h3>3) Risk Rules That Keep You Alive</h3>
        <p>
          If you adopt only one concept from this ebook, adopt this: <strong>your risk is your strategy</strong>.
          A decent strategy with excellent risk control outperforms a great strategy with reckless sizing.
        </p>
        <ul>
          <li><strong>Risk per trade:</strong> 0.5%–2% of account value (pick one and stay consistent).</li>
          <li><strong>Max daily loss:</strong> stop trading after 2–3 losing trades or a fixed % drawdown.</li>
          <li><strong>No revenge trading:</strong> losses are feedback, not an insult.</li>
          <li><strong>Always use a stop:</strong> a stop is not “being wrong”—it’s the cost of staying solvent.</li>
        </ul>

        <h3>4) A Beginner-Friendly Trade Plan Template</h3>
        <p>Copy/paste this into your notes and fill it before every position:</p>
        <ul>
          <li><strong>Asset:</strong> </li>
          <li><strong>Reason (setup):</strong> Trend continuation / Breakout / Range bounce / News catalyst</li>
          <li><strong>Entry trigger:</strong> e.g., break + retest, candle close above resistance, reclaim a level</li>
          <li><strong>Invalidation (stop-loss):</strong> the level that proves your idea is wrong</li>
          <li><strong>Targets:</strong> TP1 / TP2 / runner (if applicable)</li>
          <li><strong>Risk per trade:</strong> </li>
          <li><strong>Position size:</strong> </li>
          <li><strong>Notes:</strong> what would make you NOT take this trade?</li>
        </ul>

        <h3>5) Market Psychology (Why Most People Lose)</h3>
        <p>
          Crypto punishes impulsive behavior. Your brain is wired to chase and to avoid pain—both are expensive in trading.
          The goal is not to “control emotions,” it’s to <strong>remove decision-making pressure</strong> with rules.
        </p>
        <ul>
          <li><strong>FOMO:</strong> chasing green candles after the move is mostly done.</li>
          <li><strong>Panic selling:</strong> selling red candles at the worst possible time.</li>
          <li><strong>Overtrading:</strong> trading because you are bored, not because the setup exists.</li>
          <li><strong>Confirmation bias:</strong> only reading opinions that match your position.</li>
        </ul>

        <h3>6) Mini Case Study: A Simple Breakout Plan</h3>
        <p>
          Imagine price has been consolidating in a tight range for days. Volume is decreasing. This often sets up a breakout.
          Here’s a basic plan:
        </p>
        <ol>
          <li>Mark the range high and range low.</li>
          <li>Wait for a clean breakout candle close above range high.</li>
          <li>Wait for a retest of the breakout level.</li>
          <li>Enter on confirmation (e.g., higher low + reclaim).</li>
          <li>Stop below the retest low (invalidation).</li>
          <li>Targets: next resistance zone(s) + partials along the way.</li>
        </ol>
        <p>
          This is not magic. It’s a repeatable process. Your edge comes from executing the plan the same way across many attempts.
        </p>

        <h3>7) Common Mistakes Checklist</h3>
        <p>Before you place an order, verify you are not doing any of the following:</p>
        <ul>
          <li>Entering without a defined stop-loss.</li>
          <li>Increasing size because the last trade was a loser.</li>
          <li>Trading a setup you can’t explain in one sentence.</li>
          <li>Taking a trade just because someone tweeted it.</li>
          <li>Holding a loser and hoping it “comes back.”</li>
        </ul>

        <h3>8) Glossary (Quick Reference)</h3>
        <ul>
          <li><strong>Support/Resistance:</strong> zones where price historically reacts.</li>
          <li><strong>Liquidity:</strong> areas where many stops/orders sit (often around highs/lows).</li>
          <li><strong>Breakout:</strong> price leaving a range with momentum.</li>
          <li><strong>Retest:</strong> price revisiting a broken level before continuing.</li>
          <li><strong>Invalidation:</strong> the condition that proves your trade idea is wrong.</li>
        </ul>

        <h3>9) Quick Quiz (Self-Check)</h3>
        <ol>
          <li>What is the single most important job of risk management?</li>
          <li>What should be defined before you enter a trade?</li>
          <li>Why is “being right” less important than having a process?</li>
          <li>What is an invalidation level?</li>
        </ol>

        <h3>10) Next Steps</h3>
        <p>
          The next module will convert this blueprint into a repeatable workflow: identifying setups, calculating risk,
          and executing with discipline. Keep your focus on process—not on fast results.
        </p>
      `,
    },
  ];

  const baseSheet =
    "https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit?usp=sharing";

  // Base workbooks
  let workbooks = [
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

  // Add third workbook for specific tracks
  if (id.includes("adv")) {
    workbooks.push({
      id: `${id}-w3`,
      title: "On-Chain Signal Log",
      url: baseSheet,
      embedUrl: toSheetsPreviewUrl(baseSheet),
    });
  } else if (id.includes("int")) {
    workbooks.push({
      id: `${id}-w3`,
      title: "Altcoin Research Template",
      url: baseSheet,
      embedUrl: toSheetsPreviewUrl(baseSheet),
    });
  } else {
    workbooks.push({
      id: `${id}-w3`,
      title: "Wallet Setup Checklist",
      url: baseSheet,
      embedUrl: toSheetsPreviewUrl(baseSheet),
    });
  }

  return {
    videos: commonVideos,
    ebooks: commonEbooks,
    workbooks: workbooks,
  };
};

// Your DEMO courses (converted to plain JS + price normalized)
const DEMO_COURSES_LIST = [
  // BEGINNER
  {
    id: "beg-crypto-101",
    level: CourseLevel.BEGINNER,
    title: "Crypto Foundations",
    description:
      "Learn how to securely buy, store, and transfer digital assets. Master the basics of Bitcoin and Ethereum.",
    price: "49.99",
    duration: "3 Weeks",
    modules: ["Wallet Security", "CEX vs DEX", "Blockchain Basics"],
    instructor: "Marcus Thorne",
    image:
      "https://images.unsplash.com/photo-1621761191319-c6fb62004040?auto=format&fit=crop&q=80&w=800",
    content: createMockContent("beg-crypto-101", "Crypto Foundations"),
  },
  {
    id: "beg-crypto-102",
    level: CourseLevel.BEGINNER,
    title: "DeFi for Beginners",
    description:
      "Enter the world of decentralized finance. Learn about lending, borrowing, and stablecoins.",
    price: "59.99",
    duration: "4 Weeks",
    modules: ["Stablecoin Logic", "Liquidity Pools", "Uniswap Basics"],
    instructor: "Sarah Jenkins",
    image:
      "https://images.unsplash.com/photo-1639762681485-074b7f938ba0?auto=format&fit=crop&q=80&w=800",
    content: createMockContent("beg-crypto-102", "DeFi Basics"),
  },

  // INTERMEDIATE
  {
    id: "int-trade-201",
    level: CourseLevel.INTERMEDIATE,
    title: "Technical Analysis Pro",
    description:
      "Master candlestick patterns, RSI, MACD, and Fibonacci retracements to predict market moves.",
    price: "99.99",
    duration: "6 Weeks",
    modules: ["Chart Patterns", "Risk Management", "Order Flow"],
    instructor: "Alex Rivera",
    image:
      "https://rjofutures.rjobrien.com/wp-content/uploads/2024/11/stock-charts-on-the-monitor-close-up-finance-and-2023-11-27-05-27-27-utc-1024x683.jpg",
    content: createMockContent("int-trade-201", "Technical Analysis"),
  },
  {
    id: "int-trade-202",
    level: CourseLevel.INTERMEDIATE,
    title: "Altcoin Research",
    description:
      "Learn to evaluate whitepapers, tokenomics, and team transparency to find the next 10x gem.",
    price: "89.99",
    duration: "5 Weeks",
    modules: ["Fundamental Analysis", "Circulating Supply", "Vesting Schedules"],
    instructor: "Marcus Thorne",
    image:
      "https://blog.nanovest.io/wp-content/uploads/2023/07/Kamus-Investasi-Nanovest-Istilah-Altcoin.webp",
    content: createMockContent("int-trade-202", "Altcoin Research"),
  },

  // ADVANCED
  {
    id: "adv-quant-301",
    level: CourseLevel.ADVANCED,
    title: "Algorithmic Trading",
    description:
      "Build and deploy automated trading bots using Python and PineScript for 24/7 market execution.",
    price: "199.99",
    duration: "10 Weeks",
    modules: ["API Integration", "Backtesting", "Execution Logic"],
    instructor: "Dr. Chen Wei",
    image:
      "https://quantalgo.yolasite.com/ws/media-library/84d30846c86643e2a42fac7193f99fd5/algotrading.png",
    content: createMockContent("adv-quant-301", "Quant Trading"),
  },
  {
    id: "adv-quant-302",
    level: CourseLevel.ADVANCED,
    title: "On-Chain Forensics",
    description:
      'Use Glassnode and Dune Analytics to track "Whale" movements and predict macro market tops.',
    price: "179.99",
    duration: "8 Weeks",
    modules: ["Dune SQL", "Exchange Inflow/Outflow", "HODL Waves"],
    instructor: "Elena Rodriguez",
    image:
      "https://images.unsplash.com/photo-1639322537228-f710d846310a?auto=format&fit=crop&q=80&w=800",
    content: createMockContent("adv-quant-302", "On-Chain Analysis"),
  },
];

// ---------- Normalization / compatibility ----------

const normalizeCourse = (c) => {
  const out = { ...(c || {}) };

  // Ensure required fields exist (avoid runtime crash)
  if (!Array.isArray(out.modules)) out.modules = [];
  if (!out.content || typeof out.content !== "object") out.content = {};
  if (!Array.isArray(out.content.videos)) out.content.videos = [];
  if (!Array.isArray(out.content.ebooks)) out.content.ebooks = [];
  if (!Array.isArray(out.content.workbooks)) out.content.workbooks = [];

  // Fix workbook embedUrl if missing (app.js might use url or embedUrl)
  out.content.workbooks = out.content.workbooks.map((w) => {
    const wb = { ...(w || {}) };
    wb.id = String(wb.id || "");
    wb.title = String(wb.title || "Workbook");
    wb.url = String(wb.url || wb.embedUrl || "");
    wb.embedUrl = String(wb.embedUrl || toSheetsPreviewUrl(wb.url) || "");
    return wb;
  });

  // Basic string defaults
  out.id = String(out.id || "");
  out.level = String(out.level || CourseLevel.BEGINNER);
  out.title = String(out.title || "Untitled Course");
  out.description = String(out.description || "");
  out.price = normalizePriceString(out.price);
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

const seedCourses = (list) => {
  // Keep object reference stable (important for ES module imports)
  for (const k of Object.keys(COURSES)) delete COURSES[k];

  for (const item of list || []) {
    const normalized = normalizeCourse(item);
    if (!normalized.id) continue;
    COURSES[normalized.id] = normalized;
  }

  syncCoursesArray();
};

// Public loader (kept name for compatibility with existing app)
export const loadCoursesFromDB = async (opts = {}) => {
  const { force = false } = opts;

  if (_loadedOnce && !force) return COURSES;
  if (_loading) return _loading;

  _loading = (async () => {
    seedCourses(DEMO_COURSES_LIST);
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