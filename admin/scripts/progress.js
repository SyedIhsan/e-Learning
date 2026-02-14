(function () {
  const A = window.SDC_ADMIN;
  if (!A) return;

  const tbody = document.getElementById("tbody");
  const qInput = document.getElementById("qInput");
  const exportBtn = document.getElementById("exportCsv");
  const year = document.getElementById("year");
  if (year) year.textContent = String(new Date().getFullYear());

  const clampPct = (done, total) => {
    if (!total || total <= 0) return 0;
    const p = Math.round((done / total) * 100);
    return Math.max(0, Math.min(100, p));
  };

  function getQ() {
    return (A.qs("q") || "").trim();
  }
  function setQ(q) {
    const usp = new URLSearchParams(location.search);
    if (q) usp.set("q", q);
    else usp.delete("q");
    const qs = usp.toString();
    const url = qs ? `${location.pathname}?${qs}` : location.pathname;
    history.replaceState({}, "", url);
  }

  function studentRow(s) {
    const courseId = String(s.course_id || "");
    const course = A.getCourse(courseId);
    const title = (course && course.title) ? course.title : (courseId || "Unknown");
    const level = (course && course.level) ? course.level : "";
    const done = s.done || { video: 0, ebook: 0, workbook: 0 };
    const total = A.totalsForCourse(courseId);

    const videosPct = clampPct(Number(done.video||0), Number(total.video||0));
    const ebooksPct = clampPct(Number(done.ebook||0), Number(total.ebook||0));
    const workbooksPct = clampPct(Number(done.workbook||0), Number(total.workbook||0));

    const lastIso = s.last_ts || s.enrolled_at || null;
    const lastHuman = A.timeAgo(lastIso);

    const name = String(s.name || "");
    const studentId = String(s.student_id || (s.user_id ? `USER-${s.user_id}` : ""));
    const initial = (name || "U").trim().slice(0,1).toUpperCase();

    const cont = A.getContents(courseId);
    const wbs = (cont.workbooks || []);
    const wbsShow = wbs.slice(0, 3);

    const wbsHtml = !wbs.length
      ? `<span class="text-[10px] text-slate-400 font-bold italic">No workbooks</span>`
      : `
        ${wbsShow.map(wb => `
          <a
            href="${String(wb.url || "#")}"
            target="_blank"
            rel="noopener noreferrer"
            class="group inline-flex items-center justify-between px-3 py-2 bg-slate-50 border border-slate-100 text-slate-700 rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-slate-900 hover:text-white transition-all w-full"
          >
            <span class="truncate max-w-[160px]">${String(wb.title || "Workbook")}</span>
            <svg class="w-3 h-3 text-slate-400 group-hover:text-amber-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
        `).join("")}
        ${wbs.length > 3 ? `<span class="text-[10px] text-slate-400 font-bold">+${wbs.length - 3} more</span>` : ``}
      `;

    return `
      <tr class="hover:bg-slate-50/50 transition-colors align-top">
        <td class="px-8 py-6">
          <div class="flex items-center space-x-4">
            <div class="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-500">
              ${initial}
            </div>
            <div class="min-w-0">
              <div class="text-sm font-black text-slate-900">${name}</div>
              <div class="text-[10px] font-bold text-slate-400">${studentId}</div>
            </div>
          </div>
        </td>

        <td class="px-8 py-6">
          <div class="text-xs font-bold text-slate-700">${title}</div>
          ${level ? `<div class="text-[9px] font-black text-indigo-500 uppercase">${level}</div>` : ``}
        </td>

        <td class="px-8 py-6">
          <div class="space-y-3 w-48">
            <div>
              <div class="flex justify-between text-[8px] font-black uppercase mb-1">
                <span class="text-indigo-500">Videos</span><span>${videosPct}%</span>
              </div>
              <div class="h-1 w-full bg-slate-100 rounded-full overflow-hidden">
                <div class="h-full bg-indigo-500" style="width: ${videosPct}%"></div>
              </div>
            </div>
            <div>
              <div class="flex justify-between text-[8px] font-black uppercase mb-1">
                <span class="text-emerald-500">E-books</span><span>${ebooksPct}%</span>
              </div>
              <div class="h-1 w-full bg-slate-100 rounded-full overflow-hidden">
                <div class="h-full bg-emerald-500" style="width: ${ebooksPct}%"></div>
              </div>
            </div>
            <div>
              <div class="flex justify-between text-[8px] font-black uppercase mb-1">
                <span class="text-amber-500">Workbook</span><span>${workbooksPct}%</span>
              </div>
              <div class="h-1 w-full bg-slate-100 rounded-full overflow-hidden">
                <div class="h-full bg-amber-500" style="width: ${workbooksPct}%"></div>
              </div>
            </div>
          </div>
        </td>

        <td class="px-8 py-6">
          <div class="flex flex-col gap-2">
            ${wbsHtml}
          </div>
        </td>

        <td class="px-8 py-6">
          <div class="text-[10px] font-black text-slate-400 uppercase tracking-tighter">
            ${lastHuman}
          </div>
        </td>
      </tr>
    `;
  }

  function render() {
    const q = getQ();
    if (qInput) qInput.value = q;

    const list = A.getProgress()
      .slice()
      .sort((a,b) => new Date(b.enrolled_at || 0) - new Date(a.enrolled_at || 0));

    const qq = q.toLowerCase();
    const filtered = qq
      ? list.filter(s => {
          const studentId = String(s.student_id || "");
          const name = String(s.name || "");
          const email = String(s.email || "");
          return studentId.toLowerCase().includes(qq) || name.toLowerCase().includes(qq) || email.toLowerCase().includes(qq);
        })
      : list;

    if (!tbody) return;

    if (filtered.length === 0) {
      tbody.innerHTML = `<tr><td colspan="5" class="p-16 text-center text-slate-400 font-bold">No students found.</td></tr>`;
      return;
    }

    tbody.innerHTML = filtered.map(studentRow).join("");
  }

  function exportCSV() {
    const q = getQ().toLowerCase();
    const list = A.getProgress()
      .slice()
      .sort((a,b) => new Date(b.enrolled_at || 0) - new Date(a.enrolled_at || 0));
    const filtered = q
      ? list.filter(s => {
          const studentId = String(s.student_id || "");
          const name = String(s.name || "");
          const email = String(s.email || "");
          return studentId.toLowerCase().includes(q) || name.toLowerCase().includes(q) || email.toLowerCase().includes(q);
        })
      : list;

    const rows = [
      ["student_id","name","email","course_id","course_title","course_level","videos_pct","ebooks_pct","workbooks_pct","last_activity"]
    ];

    filtered.forEach(s => {
      const courseId = String(s.course_id || "");
      const course = A.getCourse(courseId);
      const contTotal = A.totalsForCourse(courseId);
      const done = s.done || { video: 0, ebook: 0, workbook: 0 };
      const videosPct = clampPct(Number(done.video||0), Number(contTotal.video||0));
      const ebooksPct = clampPct(Number(done.ebook||0), Number(contTotal.ebook||0));
      const workbooksPct = clampPct(Number(done.workbook||0), Number(contTotal.workbook||0));
      const lastIso = s.last_ts || s.enrolled_at || "";

      rows.push([
        String(s.student_id || ""),
        String(s.name || ""),
        String(s.email || ""),
        courseId,
        String((course && course.title) ? course.title : ""),
        String((course && course.level) ? course.level : ""),
        String(videosPct),
        String(ebooksPct),
        String(workbooksPct),
        String(lastIso)
      ]);
    });

    A.csvDownload("student_progress.csv", rows);
  }

  if (qInput) {
    qInput.addEventListener("input", (e) => {
      setQ(e.target.value.trim());
      render();
    });
  }

  if (exportBtn) {
    exportBtn.addEventListener("click", (e) => {
      e.preventDefault();
      exportCSV();
    });
  }

  // support ?export=1 like PHP (auto download)
  if (A.qs("export") === "1") {
    exportCSV();
    const usp = new URLSearchParams(location.search);
    usp.delete("export");
    const url = usp.toString() ? `${location.pathname}?${usp}` : location.pathname;
    history.replaceState({}, "", url);
  }

  document.addEventListener("DOMContentLoaded", render);
  setTimeout(render, 0);
})();