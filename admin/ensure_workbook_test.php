<?php
declare(strict_types=1);
require __DIR__ . "/auth.php";

require_once __DIR__ . "/lib/google_oauth.php";
require_once __DIR__ . "/lib/drive_api.php";
require_once __DIR__ . "/secure/drive_config.php";

$title = "Ensure Workbook (Test)";
include __DIR__ . "/partials/header.php";
include __DIR__ . "/partials/nav.php";

$refresh = google_token_get_refresh();
if (!$refresh) {
  echo "<div class='max-w-4xl mx-auto p-8'><div class='bg-white p-6 rounded-3xl border'>Google belum connected. Pergi google.php dulu.</div></div>";
  include __DIR__ . "/partials/footer.php"; exit;
}

$out = null;
$err = null;

if ($_SERVER["REQUEST_METHOD"] === "POST") {
  csrf_validate();

    $courseId    = trim((string)($_POST["course_id"] ?? ""));
  $workbookId  = trim((string)($_POST["workbook_id"] ?? "")); // e.g. beg-101-1
  $userId      = trim((string)($_POST["user_id"] ?? ""));     // e.g. SDCEL0001
  $email       = trim((string)($_POST["user_email"] ?? ""));

  // small helper
  $sanitize = function(string $name): string {
    $n = trim($name);
    $n = preg_replace('/[\\\\\\/\\x00-\\x1F]/u', " ", $n) ?? $n;
    $n = preg_replace('/\\s+/u', " ", $n) ?? $n;
    $n = trim($n);
    return $n !== "" ? $n : "Untitled";
  };

  try {
    if ($courseId==="" || $userId==="" || $email==="") throw new Exception("Missing fields");
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) throw new Exception("Invalid email");

    // 1) access token
    $tok = google_access_token_from_refresh($refresh);
    $access = (string)$tok["access_token"];

    // 2) ensure helper tables (for folder caching + mapping)
    $conn->query("CREATE TABLE IF NOT EXISTS drive_meta (
      meta_key VARCHAR(80) PRIMARY KEY,
      meta_value VARCHAR(255) NOT NULL,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");

    $conn->query("CREATE TABLE IF NOT EXISTS user_course_folders (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id VARCHAR(50) NOT NULL,
      course_id VARCHAR(50) NOT NULL,
      folder_id VARCHAR(120) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY uniq_user_course (user_id, course_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");

    $conn->query("CREATE TABLE IF NOT EXISTS user_workbooks (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id VARCHAR(50) NOT NULL,
      course_id VARCHAR(50) NOT NULL,
      workbook_id VARCHAR(80) NOT NULL,
      user_email VARCHAR(255) NOT NULL,
      user_file_id VARCHAR(120) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY uniq_user_course_wb (user_id, course_id, workbook_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");

// --- schema upgrade (kalau table lama wujud tanpa workbook_id) ---
try {
  $col = $conn->query("SHOW COLUMNS FROM user_workbooks LIKE 'workbook_id'");
  if ($col && $col->num_rows === 0) {
    // add column with default for existing rows
    $conn->query("ALTER TABLE user_workbooks ADD COLUMN workbook_id VARCHAR(80) NOT NULL DEFAULT '__first__' AFTER course_id");
    $conn->query("UPDATE user_workbooks SET workbook_id='__first__' WHERE workbook_id='' OR workbook_id IS NULL");
  }

  // ensure unique index (drop old one if exists)
  $idx1 = $conn->query("SHOW INDEX FROM user_workbooks WHERE Key_name='uniq_user_course'");
  if ($idx1 && $idx1->num_rows > 0) {
    $conn->query("ALTER TABLE user_workbooks DROP INDEX uniq_user_course");
  }
  $idx2 = $conn->query("SHOW INDEX FROM user_workbooks WHERE Key_name='uniq_user_course_wb'");
  if (!$idx2 || $idx2->num_rows === 0) {
    $conn->query("ALTER TABLE user_workbooks ADD UNIQUE KEY uniq_user_course_wb (user_id, course_id, workbook_id)");
  }
} catch (Throwable $e) {
  // ignore (test page)
}


    // 3) get course title + level + drive_folder_id
    $stmt = $conn->prepare("SELECT id, title, level, drive_folder_id FROM courses WHERE id=? LIMIT 1");
    $stmt->bind_param("s", $courseId);
    $stmt->execute();
    $course = $stmt->get_result()->fetch_assoc();
    if (!$course) throw new Exception("Course not found");

    $level = $sanitize((string)($course["level"] ?? "Beginner"));     // Beginner/Intermediate/Advanced
    $courseTitle = $sanitize((string)($course["title"] ?? $courseId)); // Course Title

    // 4) ensure Level folder under USERS_ROOT
    $levelKey = "level:" . $level;
    $stmt = $conn->prepare("SELECT meta_value FROM drive_meta WHERE meta_key=? LIMIT 1");
    $stmt->bind_param("s", $levelKey);
    $stmt->execute();
    $meta = $stmt->get_result()->fetch_assoc();
    $levelFolderId = $meta ? (string)$meta["meta_value"] : "";

    if ($levelFolderId === "") {
      $levelFolderId = drive_create_folder($access, $level, USERS_ROOT_FOLDER_ID);
      $ins = $conn->prepare("INSERT INTO drive_meta (meta_key, meta_value) VALUES (?,?)");
      $ins->bind_param("ss", $levelKey, $levelFolderId);
      $ins->execute();
    }

    // 5) ensure Course Title folder under Level folder (store in courses.drive_folder_id)
    $courseFolderId = (string)($course["drive_folder_id"] ?? "");
    if ($courseFolderId === "") {
      $courseFolderId = drive_create_folder($access, $courseTitle, $levelFolderId);
      $up = $conn->prepare("UPDATE courses SET drive_folder_id=? WHERE id=?");
      $up->bind_param("ss", $courseFolderId, $courseId);
      $up->execute();
    }

    // 6) ensure UserID folder under Course folder
    $stmt = $conn->prepare("SELECT folder_id FROM user_course_folders WHERE user_id=? AND course_id=? LIMIT 1");
    $stmt->bind_param("ss", $userId, $courseId);
    $stmt->execute();
    $uf = $stmt->get_result()->fetch_assoc();
    $userFolderId = $uf ? (string)$uf["folder_id"] : "";

    if ($userFolderId === "") {
      $userFolderId = drive_create_folder($access, $sanitize($userId), $courseFolderId);
      $ins = $conn->prepare("INSERT INTO user_course_folders (user_id, course_id, folder_id) VALUES (?,?,?)");
      $ins->bind_param("sss", $userId, $courseId, $userFolderId);
      $ins->execute();
    }

    // 7) reuse if mapping exists (per workbook_id)
    $wbKey = $workbookId !== "" ? $workbookId : "__first__";
    $stmt = $conn->prepare("SELECT user_file_id FROM user_workbooks WHERE user_id=? AND course_id=? AND workbook_id=? LIMIT 1");
    $stmt->bind_param("sss", $userId, $courseId, $wbKey);
    $stmt->execute();
    $map = $stmt->get_result()->fetch_assoc();

    if ($map) {
      $fileId = (string)$map["user_file_id"];
    } else {
      // 8) pick template + title
      $t = null;

      if ($workbookId !== "") {
        // match by content_id
        try {
          $stmt = $conn->prepare("SELECT template_file_id, title FROM course_workbooks
                                  WHERE course_id=? AND content_id=? AND template_file_id<>'' LIMIT 1");
          $stmt->bind_param("ss", $courseId, $workbookId);
          $stmt->execute();
          $t = $stmt->get_result()->fetch_assoc();
        } catch (Throwable $e) { /* ignore */ }
      }

      if (!$t) {
        // fallback: first template
        $stmt = $conn->prepare("SELECT template_file_id, title FROM course_workbooks
                                WHERE course_id=? AND template_file_id<>'' LIMIT 1");
        $stmt->bind_param("s", $courseId);
        $stmt->execute();
        $t = $stmt->get_result()->fetch_assoc();
      }

      if (!$t) throw new Exception("Template belum set. Isi template_file_id dekat course_workbooks.");

      $templateId = (string)$t["template_file_id"];
      $wbTitle = $sanitize((string)($t["title"] ?? "Workbook"));

      // 9) copy into User folder, file name = Workbook Title
      $fileName = $wbTitle . " - " . $sanitize($userId); // "Workbook Beginner - SDCEL0001"
      $fileId = drive_copy_file($access, $templateId, $fileName, $userFolderId);
      drive_share_writer($access, $fileId, $email);

      // 10) save mapping
      $ins = $conn->prepare("INSERT INTO user_workbooks (user_id, course_id, workbook_id, user_email, user_file_id) VALUES (?,?,?,?,?)");
      $ins->bind_param("sssss", $userId, $courseId, $wbKey, $email, $fileId);
      $ins->execute();
    }

    $out = ["fileId"=>$fileId, "url"=>"https://docs.google.com/spreadsheets/d/$fileId/edit"];

  } catch (Throwable $e) {
    $err = $e->getMessage();
  }
}

// courses dropdown
$courses = $conn->query("SELECT id, title, level FROM courses ORDER BY created_at DESC")->fetch_all(MYSQLI_ASSOC);
?>

<div class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
  <h1 class="text-4xl font-black mb-8">Ensure Workbook (Admin Test)</h1>

  <?php if ($err): ?>
    <div class="mb-6 bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-2xl font-semibold"><?= e($err) ?></div>
  <?php endif; ?>

  <?php if ($out): ?>
    <div class="mb-6 bg-emerald-50 border border-emerald-100 text-emerald-700 px-4 py-3 rounded-2xl font-semibold">
      Done ✅ <a class="underline font-black" target="_blank" href="<?= e($out["url"]) ?>">Open Sheet</a>
    </div>
  <?php endif; ?>

  <div class="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/40 p-8">
    <form method="POST" class="space-y-4">
      <input type="hidden" name="csrf" value="<?= e(csrf_token()) ?>">

      <div>
        <label class="block text-sm font-black text-slate-700 mb-2">Course</label>
        <select name="course_id" class="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl">
          <?php foreach ($courses as $c): ?>
            <option value="<?= e($c["id"]) ?>"><?= e($c["level"]) ?> • <?= e($c["id"]) ?> • <?= e($c["title"]) ?></option>
          <?php endforeach; ?>
        </select>
      </div>

      <div>
        <label class="block text-sm font-black text-slate-700 mb-2">Workbook ID</label>
        <input name="workbook_id" placeholder="beg-101-1" class="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl">
        <p class="mt-2 text-xs text-slate-400 font-semibold">Mesti match course_workbooks.content_id (kalau kosong, dia fallback ambik template pertama).</p>
      </div>

      <div class="grid md:grid-cols-2 gap-4">
        <div>
          <label class="block text-sm font-black text-slate-700 mb-2">User ID</label>
          <input name="user_id" placeholder="SDC-0001" class="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl">
        </div>
        <div>
          <label class="block text-sm font-black text-slate-700 mb-2">User Google Email</label>
          <input name="user_email" placeholder="user@gmail.com" class="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl">
        </div>
      </div>

      <button class="w-full py-4 bg-yellow-500 text-white font-black rounded-2xl hover:bg-yellow-600 transition">
        Create/Reuse Workbook
      </button>
    </form>
  </div>
</div>

<?php include __DIR__ . "/partials/footer.php"; ?>