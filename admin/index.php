<?php
declare(strict_types=1);
require __DIR__ . "/auth.php";

$title = "Admin Dashboard";

// quick stats
$courseCount = (int)$conn->query("SELECT COUNT(*) c FROM courses")->fetch_assoc()["c"];
$videoCount  = (int)$conn->query("SELECT COUNT(*) c FROM course_videos")->fetch_assoc()["c"];
$ebookCount  = (int)$conn->query("SELECT COUNT(*) c FROM course_ebooks")->fetch_assoc()["c"];
$wbCount     = (int)$conn->query("SELECT COUNT(*) c FROM course_workbooks")->fetch_assoc()["c"];

// ===== KPI (REAL DATA) =====

// Active learners = unique users who have at least 1 verified payment
$sqlActive = "
  SELECT COUNT(DISTINCT u.id) AS c
  FROM `user` u
  INNER JOIN `Payment` p ON p.email = u.email
  WHERE p.verified = 1
    AND u.usertype = 0
";
$activeLearners = (int)($conn->query($sqlActive)->fetch_assoc()["c"] ?? 0);

// Revenue = sum of verified payments
$sqlRevenue = "SELECT COALESCE(SUM(price), 0) AS s FROM `Payment` WHERE verified = 1";
$courseRevenue = (float)($conn->query($sqlRevenue)->fetch_assoc()["s"] ?? 0.0);
$revLabel = $courseRevenue >= 1000
  ? 'RM' . number_format($courseRevenue / 1000, 1) . 'k'
  : 'RM' . number_format($courseRevenue, 2);

// Avg completion = only possible if progress table exists (see section B)
$avgCompletion = null;
$chk = $conn->query("SHOW TABLES LIKE 'user_progress'");
if ($chk && $chk->num_rows > 0) {
  $sqlAvg = "
    SELECT ROUND(AVG(pct)) AS avg_pct
    FROM (
      SELECT up.user_id, up.course_id,
        (SUM(CASE WHEN up.completed=1 THEN 1 ELSE 0 END) /
         NULLIF(
           (SELECT COUNT(*) FROM course_videos   cv WHERE cv.course_id=up.course_id) +
           (SELECT COUNT(*) FROM course_ebooks   ce WHERE ce.course_id=up.course_id) +
           (SELECT COUNT(*) FROM course_workbooks cw WHERE cw.course_id=up.course_id)
         ,0)
        ) * 100 AS pct
      FROM user_progress up
      GROUP BY up.user_id, up.course_id
    ) t
  ";
  $avgCompletion = (int)($conn->query($sqlAvg)->fetch_assoc()["avg_pct"] ?? 0);
}

include __DIR__ . "/partials/header.php";
include __DIR__ . "/partials/nav.php";
?>

<div class="max-w-7xl mx-auto">
  <div class="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
    <div>
      <h1 class="text-4xl md:text-5xl font-black text-slate-900 mb-2">Admin Dashboard</h1>
      <p class="text-slate-500">Manage courses & learning content.</p>
    </div>
    <div class="flex gap-3">
      <a href="courses.php" class="px-6 py-3 bg-yellow-500 text-white font-bold rounded-2xl shadow-lg shadow-yellow-100 hover:bg-yellow-600 transition">Add / Edit Courses</a>
      <a href="contents.php" class="px-6 py-3 bg-white border border-slate-200 text-slate-700 font-bold rounded-2xl hover:bg-slate-50 transition">Manage Content</a>
    </div>
  </div>
  <!-- KPI Overview -->
  <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10 min-w-0">
    <div class="bg-white p-6 sm:p-8 rounded-[2rem] border border-slate-100 shadow-sm flex items-center justify-between min-w-0">
      <div class="min-w-0">
        <p class="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Active Learners</p>
        <p class="text-4xl font-black text-slate-900"><?= number_format($activeLearners) ?></p>
      </div>
      <div class="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg shrink-0">
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
        </svg>
      </div>
    </div>

    <div class="bg-white p-6 sm:p-8 rounded-[2rem] border border-slate-100 shadow-sm flex items-center justify-between min-w-0">
      <div class="min-w-0">
        <p class="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Avg. Completion</p>
        <p class="text-4xl font-black text-slate-900"><?= (int)$avgCompletion ?>%</p>
      </div>
      <div class="w-14 h-14 bg-amber-500 rounded-2xl flex items-center justify-center text-white shadow-lg shrink-0">
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
        </svg>
      </div>
    </div>

    <div class="bg-white p-6 sm:p-8 rounded-[2rem] border border-slate-100 shadow-sm flex items-center justify-between min-w-0">
      <div class="min-w-0">
        <p class="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Course Revenue</p>
        <p class="text-4xl font-black text-slate-900"><?= $revLabel ?></p>
      </div>
      <div class="w-14 h-14 bg-emerald-500 rounded-2xl flex items-center justify-center text-white shadow-lg shrink-0">
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
        </svg>
      </div>
    </div>
  </div>

  <div class="grid md:grid-cols-4 gap-6">
    <div class="bg-white rounded-3xl p-8 border border-slate-100 shadow-xl shadow-slate-200/40">
      <div class="text-xs font-black uppercase tracking-widest text-slate-400 mb-2">Courses</div>
      <div class="text-4xl font-black text-yellow-500"><?= $courseCount ?></div>
    </div>
    <div class="bg-white rounded-3xl p-8 border border-slate-100 shadow-xl shadow-slate-200/40">
      <div class="text-xs font-black uppercase tracking-widest text-slate-400 mb-2">Videos</div>
      <div class="text-4xl font-black text-yellow-500"><?= $videoCount ?></div>
    </div>
    <div class="bg-white rounded-3xl p-8 border border-slate-100 shadow-xl shadow-slate-200/40">
      <div class="text-xs font-black uppercase tracking-widest text-slate-400 mb-2">Ebooks</div>
      <div class="text-4xl font-black text-yellow-500"><?= $ebookCount ?></div>
    </div>
    <div class="bg-white rounded-3xl p-8 border border-slate-100 shadow-xl shadow-slate-200/40">
      <div class="text-xs font-black uppercase tracking-widest text-slate-400 mb-2">Workbooks</div>
      <div class="text-4xl font-black text-yellow-500"><?= $wbCount ?></div>
    </div>
  </div>
</div>

<?php include __DIR__ . "/partials/footer.php"; ?>
