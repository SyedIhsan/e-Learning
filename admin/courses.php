<?php
declare(strict_types=1);
require __DIR__ . "/auth.php";
require_once __DIR__ . '/db.php';
require_once __DIR__ . '/waitlist_notify_lib.php';

$level = $_GET["level"] ?? "All";
$q = trim((string)($_GET["q"] ?? ""));

$errors = [];
$success = "";

// Create
if ($_SERVER["REQUEST_METHOD"] === "POST" && ($_POST["action"] ?? "") === "create") {
  csrf_validate();

  $id = trim((string)($_POST["id"] ?? ""));
  $lvl = (string)($_POST["level"] ?? "");
  $title = trim((string)($_POST["title"] ?? ""));
  $desc = trim((string)($_POST["description"] ?? ""));
  $price = trim((string)($_POST["price"] ?? ""));
  $duration = trim((string)($_POST["duration"] ?? ""));
  $instructor = trim((string)($_POST["instructor"] ?? ""));
  $image = trim((string)($_POST["image"] ?? ""));

  if ($id === "" || $title === "" || $desc === "" || $price === "" || $duration === "" || $instructor === "" || $image === "") {
    $errors[] = "All fields are required.";
  }
  if (!in_array($lvl, ["Beginner","Intermediate","Advanced"], true)) {
    $errors[] = "Invalid level.";
  }

  if (!$errors) {
    $stmt = $conn->prepare("INSERT INTO courses (id, level, title, description, price, duration, instructor, image) VALUES (?,?,?,?,?,?,?,?)");
    $stmt->bind_param("ssssssss", $id, $lvl, $title, $desc, $price, $duration, $instructor, $image);
    try {
      $stmt->execute();
      $success = "Course created.";

      // queue email notification (guna course id yang admin isi, contoh beg-101)
      $courseKey = $id;                       // "beg-101"
      $levelKey  = strtolower(trim($lvl));    // "beginner" / "intermediate" / "advanced"
      $courseUrl = "https://sdc.cx/e-Learning/#/course/" . rawurlencode($courseKey);

      queue_course_notification($conn, $levelKey, $courseKey, $title, $courseUrl);

    } catch (Throwable $e) {
      $errors[] = "Failed to create. Maybe duplicate course id?";
    }
  }
}

// Delete
if ($_SERVER["REQUEST_METHOD"] === "POST" && ($_POST["action"] ?? "") === "delete") {
  csrf_validate();
  $id = (string)($_POST["id"] ?? "");
  if ($id) {
    $stmt = $conn->prepare("DELETE FROM courses WHERE id=?");
    $stmt->bind_param("s", $id);
    $stmt->execute();
    $success = "Course deleted.";
  }
}

$where = "1=1";
$params = [];
$types = "";

if ($level !== "All" && in_array($level, ["Beginner","Intermediate","Advanced"], true)) {
  $where .= " AND level=?";
  $params[] = $level;
  $types .= "s";
}
if ($q !== "") {
  $where .= " AND (id LIKE ? OR title LIKE ? OR instructor LIKE ?)";
  $like = "%" . $q . "%";
  $params[] = $like; $params[] = $like; $params[] = $like;
  $types .= "sss";
}

$sql = "SELECT * FROM courses WHERE $where ORDER BY created_at DESC";
$stmt = $conn->prepare($sql);
if ($params) $stmt->bind_param($types, ...$params);
$stmt->execute();
$courses = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);

$title = "Manage Courses";
include __DIR__ . "/partials/header.php";
include __DIR__ . "/partials/nav.php";
?>

<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
  <div class="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
    <div>
      <h1 class="text-4xl font-black mb-2">Courses</h1>
      <p class="text-slate-500">Add / edit courses. Course ID should follow a format like <span class="font-bold">beg-101</span>.</p>
    </div>
    <a href="contents.php" class="px-6 py-3 bg-white border border-slate-200 text-slate-700 font-bold rounded-2xl hover:bg-slate-50 transition">Manage Content →</a>
  </div>

  <?php if ($success): ?>
    <div class="mb-6 bg-emerald-50 border border-emerald-100 text-emerald-700 px-4 py-3 rounded-2xl font-semibold"><?= e($success) ?></div>
  <?php endif; ?>
  <?php if ($errors): ?>
    <div class="mb-6 bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-2xl">
      <ul class="list-disc pl-5 space-y-1">
        <?php foreach ($errors as $er): ?><li><?= e($er) ?></li><?php endforeach; ?>
      </ul>
    </div>
  <?php endif; ?>

  <div class="grid lg:grid-cols-3 gap-8">
    <!-- Create form -->
    <div class="lg:col-span-1">
      <div class="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/40 p-8">
        <h2 class="text-xl font-black mb-6">Add New Course</h2>
        <form method="POST" class="space-y-4">
          <input type="hidden" name="csrf" value="<?= e(csrf_token()) ?>">
          <input type="hidden" name="action" value="create">

          <div>
            <label class="block text-sm font-bold text-slate-700 mb-2">Course ID</label>
            <input name="id" placeholder="beg-104 / int-204 / adv-304"
              class="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-yellow-400 outline-none">
          </div>

          <div>
            <label class="block text-sm font-bold text-slate-700 mb-2">Level</label>
            <select name="level" class="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl">
              <option>Beginner</option>
              <option>Intermediate</option>
              <option>Advanced</option>
            </select>
          </div>

          <div>
            <label class="block text-sm font-bold text-slate-700 mb-2">Title</label>
            <input name="title" class="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl">
          </div>

          <div>
            <label class="block text-sm font-bold text-slate-700 mb-2">Description</label>
            <textarea name="description" rows="4" class="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl"></textarea>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-bold text-slate-700 mb-2">Price</label>
              <input name="price" placeholder="$49.99" class="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl">
            </div>
            <div>
              <label class="block text-sm font-bold text-slate-700 mb-2">Duration</label>
              <input name="duration" placeholder="4 Weeks" class="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl">
            </div>
          </div>

          <div>
            <label class="block text-sm font-bold text-slate-700 mb-2">Instructor</label>
            <input name="instructor" class="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl">
          </div>

          <div>
            <label class="block text-sm font-bold text-slate-700 mb-2">Image URL</label>
            <input name="image" placeholder="https://images.unsplash.com/..." class="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl">
          </div>

          <button class="w-full py-4 bg-yellow-500 text-white font-bold rounded-2xl hover:bg-yellow-600 shadow-lg shadow-yellow-100 transition active:scale-95">
            Create Course
          </button>
        </form>
      </div>
    </div>

    <!-- List -->
    <div class="lg:col-span-2 space-y-6">
      <div class="bg-white rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/40 p-6">
        <form method="GET" class="flex flex-col md:flex-row gap-3">
          <input name="q" value="<?= e($q) ?>" placeholder="Search by id/title/instructor..."
            class="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl">
          <select name="level" class="px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl">
            <?php foreach (["All","Beginner","Intermediate","Advanced"] as $opt): ?>
              <option <?= $level===$opt ? "selected" : "" ?>><?= e($opt) ?></option>
            <?php endforeach; ?>
          </select>
          <button class="px-6 py-3 bg-slate-900 text-white font-bold rounded-2xl hover:bg-slate-800 transition">Filter</button>
        </form>
      </div>

      <?php if (!$courses): ?>
        <div class="bg-white rounded-[3rem] p-16 text-center border border-dashed border-slate-200">
          <h2 class="text-2xl font-bold text-slate-900 mb-2">No courses yet</h2>
          <p class="text-slate-500">Add your first course on the left.</p>
        </div>
      <?php endif; ?>

      <div class="space-y-6">
        <?php foreach ($courses as $c): ?>
          <div class="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/40 overflow-hidden">
            <div class="flex flex-col md:flex-row">
              <div class="md:w-2/5 relative min-h-[220px]">
                <img src="<?= e($c["image"]) ?>" class="absolute inset-0 w-full h-full object-cover" alt="">
                <div class="absolute inset-0 bg-gradient-to-r from-slate-900/50 to-transparent"></div>
                <div class="absolute bottom-4 left-4">
                  <span class="px-3 py-1.5 bg-white/95 rounded-full text-xs font-black text-yellow-600 uppercase tracking-tighter"><?= e($c["duration"]) ?></span>
                </div>
              </div>

              <div class="md:w-3/5 p-8 flex flex-col gap-4">
                <div class="flex items-start justify-between gap-4">
                  <div>
                    <div class="text-[10px] font-black uppercase tracking-widest text-slate-400"><?= e($c["level"]) ?> • <?= e($c["id"]) ?></div>
                    <h3 class="text-2xl font-black text-slate-900"><?= e($c["title"]) ?></h3>
                    <p class="text-slate-500 mt-2"><?= nl2br(e($c["description"])) ?></p>
                  </div>
                  <div class="text-2xl font-black text-yellow-500">RM<?= e($c["price"]) ?></div>
                </div>

                <div class="flex flex-wrap gap-3">
                  <a href="course_edit.php?id=<?= e($c["id"]) ?>" class="px-5 py-3 bg-yellow-50 text-yellow-700 rounded-2xl font-black hover:bg-yellow-500 hover:text-white transition">
                    Edit
                  </a>
                  <a href="contents.php?course_id=<?= e($c["id"]) ?>" class="px-5 py-3 bg-slate-900 text-white rounded-2xl font-black hover:bg-slate-800 transition">
                    Content
                  </a>
                  <form method="POST" onsubmit="return confirm('Delete course <?= e($c["id"]) ?> ? This also deletes its content.');">
                    <input type="hidden" name="csrf" value="<?= e(csrf_token()) ?>">
                    <input type="hidden" name="action" value="delete">
                    <input type="hidden" name="id" value="<?= e($c["id"]) ?>">
                    <button class="px-5 py-3 bg-white border border-red-200 text-red-600 rounded-2xl font-black hover:bg-red-50 transition">
                      Delete
                    </button>
                  </form>
                </div>

                <div class="text-xs text-slate-400 font-semibold">Instructor: <?= e($c["instructor"]) ?></div>
              </div>
            </div>
          </div>
        <?php endforeach; ?>
      </div>

    </div>
  </div>
</div>

<?php include __DIR__ . "/partials/footer.php"; ?>
