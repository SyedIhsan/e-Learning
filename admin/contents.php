<?php
declare(strict_types=1);
require __DIR__ . "/auth.php";

function extract_google_sheet_id(string $input): string {
  $s = trim($input);

  // if user just pastes ID
  if (preg_match('~^[a-zA-Z0-9_-]{20,}$~', $s)) {
    return $s;
  }

  $patterns = [
    // Google Sheets standard
    '~https?://docs\.google\.com/spreadsheets/d/([a-zA-Z0-9_-]+)~',
    // Drive file link
    '~https?://drive\.google\.com/file/d/([a-zA-Z0-9_-]+)~',
    // open?id=...
    '~[?&]id=([a-zA-Z0-9_-]+)~',
  ];

  foreach ($patterns as $p) {
    if (preg_match($p, $s, $m)) return $m[1];
  }

  return "";
}

$courseId = (string)($_GET["course_id"] ?? "");

// Fetch courses for dropdown
$allCourses = $conn->query("SELECT id, title, level FROM courses ORDER BY created_at DESC")->fetch_all(MYSQLI_ASSOC);

function must_course(string $courseId): array {
  global $conn;
  if ($courseId === "") return [];
  $stmt = $conn->prepare("SELECT * FROM courses WHERE id=? LIMIT 1");
  $stmt->bind_param("s", $courseId);
  $stmt->execute();
  $c = $stmt->get_result()->fetch_assoc();
  return $c ?: [];
}

$course = $courseId ? must_course($courseId) : [];
$errors = [];
$success = "";

if ($_SERVER["REQUEST_METHOD"] === "POST") {
  csrf_validate();
  $action = (string)($_POST["action"] ?? "");
  $courseId = (string)($_POST["course_id"] ?? $courseId);

  if ($courseId === "") $errors[] = "Pick a course first.";
  else {
    if ($action === "add_video") {
      $title = trim((string)($_POST["title"] ?? ""));
      $url = trim((string)($_POST["url"] ?? ""));
      $desc = trim((string)($_POST["description"] ?? ""));
      if ($title===""||$url==="") $errors[] = "Video title & URL required.";
      if (!$errors) {
        $stmt = $conn->prepare("INSERT INTO course_videos (course_id,title,url,description) VALUES (?,?,?,?)");
        $stmt->bind_param("ssss", $courseId, $title, $url, $desc);
        $stmt->execute();
        $success = "Video added.";
      }
    }

    if ($action === "add_ebook") {
      $title = trim((string)($_POST["title"] ?? ""));
      $content = (string)($_POST["content"] ?? "");
      if ($title===""||trim($content)==="") $errors[] = "Ebook title & HTML content required.";
      if (!$errors) {
        $stmt = $conn->prepare("INSERT INTO course_ebooks (course_id,title,content) VALUES (?,?,?)");
        $stmt->bind_param("sss", $courseId, $title, $content);
        $stmt->execute();
        $success = "Ebook added.";
      }
    }

    if ($action === "add_workbook") {
      $title = trim((string)($_POST["title"] ?? ""));
      $contentId = trim((string)($_POST["content_id"] ?? ""));
      $urlInput = trim((string)($_POST["url"] ?? ""));

      if ($title === "" || $urlInput === "") {
        $errors[] = "Workbook title & Google Sheet URL required.";
      }

      $templateId = extract_google_sheet_id($urlInput);
      if (!$errors && $templateId === "") {
        $errors[] = "Cannot extract Google Sheet File ID. Make sure link is like: https://docs.google.com/spreadsheets/d/<FILE_ID>/edit";
      }

      function next_workbook_content_id(mysqli $conn, string $courseId): string {
        // Ambil nombor paling besar dari content_id format: <courseId>-<n>
        $stmt = $conn->prepare("
          SELECT MAX(CAST(SUBSTRING_INDEX(content_id, '-', -1) AS UNSIGNED)) AS mx
          FROM course_workbooks
          WHERE course_id=? AND content_id LIKE CONCAT(?, '-%')
        ");
        $stmt->bind_param("ss", $courseId, $courseId);
        $stmt->execute();
        $row = $stmt->get_result()->fetch_assoc();
        $mx = (int)($row["mx"] ?? 0);

        return $courseId . "-" . ($mx + 1);
      }

      if (!$errors) {
        // normalize url to be consistent
$normalizedUrl = "https://docs.google.com/spreadsheets/d/" . $templateId . "/edit";

// content_id: required if one course has multiple workbooks (match with workbook.id in frontend)
// normalize url supaya consistent
$normalizedUrl = "https://docs.google.com/spreadsheets/d/" . $templateId . "/edit";

// Auto-generate content_id kalau kosong: beg-101-1, beg-101-2, ...
$cid = trim($contentId);
if ($cid === "") {
  $cid = next_workbook_content_id($conn, $courseId);
}

try {
  // retry sikit kalau collision (rare, tapi solid)
  for ($i = 0; $i < 3; $i++) {
    try {
      $stmt = $conn->prepare("INSERT INTO course_workbooks (course_id,content_id,title,url,template_file_id) VALUES (?,?,?,?,?)");
      $stmt->bind_param("sssss", $courseId, $cid, $title, $normalizedUrl, $templateId);
      $stmt->execute();
      break;
    } catch (mysqli_sql_exception $e) {
      // duplicate content_id (1062) => regen kalau auto
      if ($e->getCode() == 1062 && trim($contentId) === "") {
        $cid = next_workbook_content_id($conn, $courseId);
        continue;
      }
      throw $e;
    }
  }
} catch (Throwable $e) {
  // fallback kalau column content_id belum wujud
  $stmt = $conn->prepare("INSERT INTO course_workbooks (course_id,title,url,template_file_id) VALUES (?,?,?,?)");
  $stmt->bind_param("ssss", $courseId, $title, $normalizedUrl, $templateId);
  $stmt->execute();
}

$success = "Workbook template added (File ID captured).";
$success = "Workbook template added (File ID captured).";
      }
    }

    if ($action === "del_video") {
      $id = (int)($_POST["id"] ?? 0);
      $stmt = $conn->prepare("DELETE FROM course_videos WHERE id=? AND course_id=?");
      $stmt->bind_param("is", $id, $courseId);
      $stmt->execute();
      $success = "Video deleted.";
    }

    if ($action === "del_ebook") {
      $id = (int)($_POST["id"] ?? 0);
      $stmt = $conn->prepare("DELETE FROM course_ebooks WHERE id=? AND course_id=?");
      $stmt->bind_param("is", $id, $courseId);
      $stmt->execute();
      $success = "Ebook deleted.";
    }

    if ($action === "del_workbook") {
      $id = (int)($_POST["id"] ?? 0);
      $stmt = $conn->prepare("DELETE FROM course_workbooks WHERE id=? AND course_id=?");
      $stmt->bind_param("is", $id, $courseId);
      $stmt->execute();
      $success = "Workbook deleted.";
    }

    // redirect to keep GET course_id consistent
    redirect("contents.php?course_id=" . urlencode($courseId));
  }
}

$course = $courseId ? must_course($courseId) : [];

$videos = [];
$ebooks = [];
$workbooks = [];

if ($courseId) {
  $stmt = $conn->prepare("SELECT * FROM course_videos WHERE course_id=? ORDER BY id ASC");
  $stmt->bind_param("s", $courseId);
  $stmt->execute();
  $videos = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);

  $stmt = $conn->prepare("SELECT * FROM course_ebooks WHERE course_id=? ORDER BY id ASC");
  $stmt->bind_param("s", $courseId);
  $stmt->execute();
  $ebooks = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);

  $stmt = $conn->prepare("SELECT * FROM course_workbooks WHERE course_id=? ORDER BY id ASC");
  $stmt->bind_param("s", $courseId);
  $stmt->execute();
  $workbooks = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
}

$title = "Manage Content";
include __DIR__ . "/partials/header.php";
include __DIR__ . "/partials/nav.php";
?>

<div class="max-w-7xl mx-auto w-full py-6 min-w-0">
  <div class="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
    <div>
      <h1 class="text-4xl font-black mb-2">Content</h1>
      <p class="text-slate-500">Manage videos / ebooks / workbooks. Make sure URL follows format that student page iframe can load.</p>
    </div>
    <a href="courses.php" class="px-6 py-3 bg-white border border-slate-200 text-slate-700 font-bold rounded-2xl hover:bg-slate-50 transition">← Back to Courses</a>
  </div>

  <?php if ($errors): ?>
    <div class="mb-6 bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-2xl">
      <ul class="list-disc pl-5 space-y-1">
        <?php foreach ($errors as $er): ?><li><?= e($er) ?></li><?php endforeach; ?>
      </ul>
    </div>
  <?php endif; ?>

  <div class="bg-white rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/40 p-6 mb-8">
    <form method="GET" class="flex flex-col md:flex-row gap-3 items-stretch md:items-center">
      <label class="text-sm font-black text-slate-700 md:w-40">Select Course</label>
      <select name="course_id" class="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl">
        <option value="">-- choose --</option>
        <?php foreach ($allCourses as $c): ?>
          <option value="<?= e($c["id"]) ?>" <?= $courseId===$c["id"] ? "selected" : "" ?>>
            <?= e($c["level"]) ?> • <?= e($c["id"]) ?> • <?= e($c["title"]) ?>
          </option>
        <?php endforeach; ?>
      </select>
      <button class="px-6 py-3 bg-slate-900 text-white font-bold rounded-2xl hover:bg-slate-800 transition">Load</button>
    </form>
  </div>

  <?php if (!$courseId): ?>
    <div class="bg-white rounded-[3rem] p-16 text-center border border-dashed border-slate-200">
      <h2 class="text-2xl font-bold text-slate-900 mb-2">Pick a course</h2>
      <p class="text-slate-500">After selecting, you can add video/ebook/workbook.</p>
    </div>
    <?php include __DIR__ . "/partials/footer.php"; exit; ?>
  <?php endif; ?>

  <div class="bg-slate-900 rounded-[3rem] p-10 text-white mb-10 relative overflow-hidden">
    <div class="relative z-10">
      <div class="text-xs font-black uppercase tracking-widest text-slate-300 mb-2"><?= e($course["level"]) ?> • <?= e($course["id"]) ?></div>
      <h2 class="text-2xl md:text-3xl font-black"><?= e($course["title"]) ?></h2>
      <p class="text-slate-300 mt-2">Student UI will reflect this content when you migrate fetch later.</p>
    </div>
    <div class="absolute top-0 right-0 w-64 h-64 bg-yellow-500/10 rounded-full blur-[80px] -mr-32 -mt-32"></div>
  </div>

  <div class="grid lg:grid-cols-3 gap-8 min-w-0">
    <!-- Add forms -->
    <div class="lg:col-span-1 space-y-8 min-w-0">
      <div class="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/40 p-8">
        <h3 class="text-lg font-black mb-4">Add Video</h3>
        <form method="POST" class="space-y-3">
          <input type="hidden" name="csrf" value="<?= e(csrf_token()) ?>">
          <input type="hidden" name="action" value="add_video">
          <input type="hidden" name="course_id" value="<?= e($courseId) ?>">
          <input name="title" placeholder="Video title" class="w-full min-w-0 px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl">
          <input name="url" placeholder="YouTube embed URL (https://www.youtube.com/embed/...)" class="w-full min-w-0 px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl">
          <textarea name="description" rows="3" placeholder="Optional description" class="w-full min-w-0 px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl"></textarea>
          <button class="w-full py-3 bg-yellow-500 text-white font-bold rounded-2xl hover:bg-yellow-600 transition">Add Video</button>
        </form>
      </div>

      <div class="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/40 p-8">
        <h3 class="text-lg font-black mb-4">Add Ebook</h3>
        <form method="POST" class="space-y-3">
          <input type="hidden" name="csrf" value="<?= e(csrf_token()) ?>">
          <input type="hidden" name="action" value="add_ebook">
          <input type="hidden" name="course_id" value="<?= e($courseId) ?>">
          <input name="title" placeholder="Ebook title" class="w-full min-w-0 px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl">
          <textarea name="content" rows="8" placeholder="HTML content (e.g. <h2>Title</h2><p>...</p>)" class="w-full min-w-0 px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl font-mono text-sm"></textarea>
          <button class="w-full py-3 bg-yellow-500 text-white font-bold rounded-2xl hover:bg-yellow-600 transition">Add Ebook</button>
        </form>
        <p class="text-xs text-slate-400 mt-3">Student page renders ebook content as HTML (same pattern as current data).</p>
      </div>

      <div class="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/40 p-8">
        <h3 class="text-lg font-black mb-4">Add Workbook</h3>
        <form method="POST" class="space-y-3">
          <input type="hidden" name="csrf" value="<?= e(csrf_token()) ?>">
          <input type="hidden" name="action" value="add_workbook">
          <input type="hidden" name="course_id" value="<?= e($courseId) ?>">
          <input name="content_id" placeholder="Workbook ID (e.g. beg-101-1)" class="w-full min-w-0 px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl">
          <input name="title" placeholder="Workbook title" class="w-full min-w-0 px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl">
          <input name="url" placeholder="Google Sheet share URL / embed URL" class="w-full min-w-0 px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl">
          <button class="w-full py-3 bg-yellow-500 text-white font-bold rounded-2xl hover:bg-yellow-600 transition">Add Workbook</button>
        </form>
      </div>
    </div>

    <!-- Lists -->
    <div class="lg:col-span-2 space-y-8 min-w-0">

      <div class="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/40 p-8">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-xl font-black">Videos</h3>
          <span class="text-xs font-black text-slate-400 uppercase tracking-widest"><?= count($videos) ?> items</span>
        </div>
        <?php if (!$videos): ?>
          <p class="text-slate-500">No videos yet.</p>
        <?php endif; ?>
        <div class="space-y-4">
          <?php foreach ($videos as $v): ?>
            <div class="p-5 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4 overflow-hidden">
              <div class="min-w-0">
                <div class="font-black text-slate-900 truncate"><?= e($v["title"]) ?></div>
                <div class="text-xs text-slate-500 break-all line-clamp-2"><?= e($v["url"]) ?></div>
                <?php if (!empty($v["description"])): ?>
                  <div class="text-sm text-slate-600 mt-1"><?= e((string)$v["description"]) ?></div>
                <?php endif; ?>
              </div>
              <form method="POST" onsubmit="return confirm('Delete this video?');">
                <input type="hidden" name="csrf" value="<?= e(csrf_token()) ?>">
                <input type="hidden" name="action" value="del_video">
                <input type="hidden" name="course_id" value="<?= e($courseId) ?>">
                <input type="hidden" name="id" value="<?= (int)$v["id"] ?>">
                <button class="px-5 py-3 bg-white border border-red-200 text-red-600 rounded-2xl font-black hover:bg-red-50 transition">Delete</button>
              </form>
            </div>
          <?php endforeach; ?>
        </div>
      </div>

      <div class="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/40 p-8">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-xl font-black">Ebooks</h3>
          <span class="text-xs font-black text-slate-400 uppercase tracking-widest"><?= count($ebooks) ?> items</span>
        </div>
        <?php if (!$ebooks): ?>
          <p class="text-slate-500">No ebooks yet.</p>
        <?php endif; ?>
        <div class="space-y-4">
          <?php foreach ($ebooks as $e): ?>
            <div class="p-5 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4 overflow-hidden">
              <div class="min-w-0">
                <div class="font-black text-slate-900"><?= e($e["title"]) ?></div>
                <div class="text-xs text-slate-500">Stored as HTML (LONGTEXT).</div>
              </div>
              <form method="POST" onsubmit="return confirm('Delete this ebook?');">
                <input type="hidden" name="csrf" value="<?= e(csrf_token()) ?>">
                <input type="hidden" name="action" value="del_ebook">
                <input type="hidden" name="course_id" value="<?= e($courseId) ?>">
                <input type="hidden" name="id" value="<?= (int)$e["id"] ?>">
                <button class="px-5 py-3 bg-white border border-red-200 text-red-600 rounded-2xl font-black hover:bg-red-50 transition">Delete</button>
              </form>
            </div>
          <?php endforeach; ?>
        </div>
      </div>

      <div class="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/40 p-8">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-xl font-black">Workbooks</h3>
          <span class="text-xs font-black text-slate-400 uppercase tracking-widest"><?= count($workbooks) ?> items</span>
        </div>
        <?php if (!$workbooks): ?>
          <p class="text-slate-500">No workbooks yet.</p>
        <?php endif; ?>
        <div class="space-y-4">
          <?php foreach ($workbooks as $w): ?>
            <div class="p-5 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4 overflow-hidden">
              <div class="min-w-0">
                <div class="font-black text-slate-900 truncate"><?= e($w["title"]) ?></div>
                <div class="text-xs text-slate-500 break-all line-clamp-2"><?= e($w["url"]) ?></div>
              </div>
              <form method="POST" onsubmit="return confirm('Delete this workbook?');">
                <input type="hidden" name="csrf" value="<?= e(csrf_token()) ?>">
                <input type="hidden" name="action" value="del_workbook">
                <input type="hidden" name="course_id" value="<?= e($courseId) ?>">
                <input type="hidden" name="id" value="<?= (int)$w["id"] ?>">
                <button class="px-5 py-3 bg-white border border-red-200 text-red-600 rounded-2xl font-black hover:bg-red-50 transition">Delete</button>
              </form>
            </div>
          <?php endforeach; ?>
        </div>
      </div>

    </div>
  </div>
</div>

<?php include __DIR__ . "/partials/footer.php"; ?>