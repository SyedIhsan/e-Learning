const readJSON = (k, fallback) => {
  try { return JSON.parse(localStorage.getItem(k) || ""); } catch { return fallback; }
};

const safeNum = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

const moneyLabelLikePHP = (rm) => {
  const n = safeNum(rm);
  // mimic number_format(2) and k-style
  if (n >= 1000) return "RM" + (n / 1000).toFixed(1) + "k";
  return "RM" + n.toFixed(2);
};

const countTotalsForCourse = (courseId, contentsStoreObj) => {
  const c = (contentsStoreObj && contentsStoreObj[courseId]) || {};
  const v = Array.isArray(c.videos) ? c.videos.length : 0;
  const e = Array.isArray(c.ebooks) ? c.ebooks.length : 0;
  const w = Array.isArray(c.workbooks) ? c.workbooks.length : 0;
  return { video: v, ebook: e, workbook: w };
};

const percent = (done = {}, total = {}) => {
  const d = safeNum(done.video) + safeNum(done.ebook) + safeNum(done.workbook);
  const t = safeNum(total.video) + safeNum(total.ebook) + safeNum(total.workbook);
  if (!t) return 0;
  return Math.round((d / t) * 100);
};

document.addEventListener('DOMContentLoaded', () => {
  // footer year (match PHP)
  const y = document.getElementById('year');
  if (y) y.textContent = new Date().getFullYear();

  // Prefer the same stores used by courses.js / contents.js.
  // Fallback to SDC_ADMIN if you still use it elsewhere.
  const courses = readJSON('sdc_courses_v1', null)
    || (window.SDC_ADMIN?.getCourses?.() || []);

  const contentsStore = readJSON('sdc_admin_contents_store_v1', null)
    || readJSON('sdc_contents_v1', null)
    || null;

  // totals
  let videos = 0, ebooks = 0, workbooks = 0;

  if (contentsStore && typeof contentsStore === 'object' && !Array.isArray(contentsStore)) {
    for (const c of courses) {
      const t = countTotalsForCourse(c.id, contentsStore);
      videos += t.video;
      ebooks += t.ebook;
      workbooks += t.workbook;
    }
  } else if (window.SDC_ADMIN?.getContents) {
    for (const c of courses) {
      const cont = window.SDC_ADMIN.getContents(c.id) || {};
      videos += Array.isArray(cont.videos) ? cont.videos.length : 0;
      ebooks += Array.isArray(cont.ebooks) ? cont.ebooks.length : 0;
      workbooks += Array.isArray(cont.workbooks) ? cont.workbooks.length : 0;
    }
  }

  // payments
  const payments = readJSON('sdc_payments_v1', null)
    || (window.SDC_ADMIN?.getPayments?.() || []);

  const verified = (payments || []).filter(p => p && (p.verified === true || p.status === 'verified'));
  const activeLearners = new Set(
    verified
      .map(p => String(p.email || '').toLowerCase().trim())
      .filter(Boolean)
  ).size;

  const revenue = verified.reduce((sum, p) => sum + safeNum(p.price), 0);

  // avg completion
  const progress = readJSON('sdc_progress_v1', null)
    || (window.SDC_ADMIN?.getProgress?.() || []);

  const pcts = (progress || []).map(r => {
    const cid = r?.course_id || r?.courseId || '';
    const done = r?.done || r?.completed || { video: 0, ebook: 0, workbook: 0 };

    let totals = { video: 0, ebook: 0, workbook: 0 };
    if (contentsStore && typeof contentsStore === 'object' && !Array.isArray(contentsStore)) {
      totals = countTotalsForCourse(cid, contentsStore);
    } else if (window.SDC_ADMIN?.totalsForCourse) {
      totals = window.SDC_ADMIN.totalsForCourse(cid);
    } else if (window.SDC_ADMIN?.getContents) {
      const cont = window.SDC_ADMIN.getContents(cid) || {};
      totals = {
        video: Array.isArray(cont.videos) ? cont.videos.length : 0,
        ebook: Array.isArray(cont.ebooks) ? cont.ebooks.length : 0,
        workbook: Array.isArray(cont.workbooks) ? cont.workbooks.length : 0,
      };
    }

    if (window.SDC_ADMIN?.percent) return window.SDC_ADMIN.percent(done, totals);
    return percent(done, totals);
  });

  const avgCompletion = pcts.length
    ? Math.round(pcts.reduce((a, b) => a + safeNum(b), 0) / pcts.length)
    : 0;

  // paint
  document.getElementById('kpiActive').textContent = activeLearners.toLocaleString();
  document.getElementById('kpiAvg').textContent = avgCompletion + '%';
  document.getElementById('kpiRev').textContent = moneyLabelLikePHP(revenue);

  document.getElementById('statCourses').textContent = Array.isArray(courses) ? courses.length : 0;
  document.getElementById('statVideos').textContent = videos;
  document.getElementById('statEbooks').textContent = ebooks;
  document.getElementById('statWorkbooks').textContent = workbooks;
});