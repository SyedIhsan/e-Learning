<?php
declare(strict_types=1);
require __DIR__ . "/auth.php";

$title = "Admin Dashboard";

// quick stats
$courseCount = (int)$conn->query("SELECT COUNT(*) c FROM courses")->fetch_assoc()["c"];
$videoCount  = (int)$conn->query("SELECT COUNT(*) c FROM course_videos")->fetch_assoc()["c"];
$ebookCount  = (int)$conn->query("SELECT COUNT(*) c FROM course_ebooks")->fetch_assoc()["c"];
$wbCount     = (int)$conn->query("SELECT COUNT(*) c FROM course_workbooks")->fetch_assoc()["c"];

include __DIR__ . "/partials/header.php";
include __DIR__ . "/partials/nav.php";
?>

<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
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

  <div class="mt-12 bg-slate-900 rounded-[3rem] p-10 text-white overflow-hidden relative">
    <div class="relative z-10">
      <h2 class="text-2xl font-black mb-2">Tip (supaya design kekal sama)</h2>
      <p class="text-slate-300">Guna class Tailwind yang sama: <span class="font-bold text-yellow-400">bg-slate-50 / rounded-3xl / shadow-xl / bg-yellow-500</span>.</p>
    </div>
    <div class="absolute top-0 right-0 w-64 h-64 bg-yellow-500/10 rounded-full blur-[80px] -mr-32 -mt-32"></div>
  </div>
</div>

<?php include __DIR__ . "/partials/footer.php"; ?>
