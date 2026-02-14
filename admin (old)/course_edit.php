<?php
declare(strict_types=1);
require __DIR__ . "/auth.php";

$id = (string)($_GET["id"] ?? "");
if ($id === "") redirect("courses.php");

$stmt = $conn->prepare("SELECT * FROM courses WHERE id=? LIMIT 1");
$stmt->bind_param("s", $id);
$stmt->execute();
$course = $stmt->get_result()->fetch_assoc();
if (!$course) redirect("courses.php");

$errors = [];
$success = "";

if ($_SERVER["REQUEST_METHOD"] === "POST") {
  csrf_validate();

  $lvl = (string)($_POST["level"] ?? "");
  $title = trim((string)($_POST["title"] ?? ""));
  $desc = trim((string)($_POST["description"] ?? ""));
  $price = trim((string)($_POST["price"] ?? ""));
  $duration = trim((string)($_POST["duration"] ?? ""));
  $instructor = trim((string)($_POST["instructor"] ?? ""));
  $image = trim((string)($_POST["image"] ?? ""));

  if (!in_array($lvl, ["Beginner","Intermediate","Advanced"], true)) $errors[] = "Invalid level.";
  if ($title===""||$desc===""||$price===""||$duration===""||$instructor===""||$image==="") $errors[] = "All fields are required.";

  if (!$errors) {
    $stmt = $conn->prepare("UPDATE courses SET level=?, title=?, description=?, price=?, duration=?, instructor=?, image=?, updated_at=NOW() WHERE id=?");
    $stmt->bind_param("ssssssss", $lvl, $title, $desc, $price, $duration, $instructor, $image, $id);
    $stmt->execute();
    $success = "Saved.";
    // refresh
    $stmt = $conn->prepare("SELECT * FROM courses WHERE id=? LIMIT 1");
    $stmt->bind_param("s", $id);
    $stmt->execute();
    $course = $stmt->get_result()->fetch_assoc();
  }
}

$title = "Edit Course " . $id;
include __DIR__ . "/partials/header.php";
include __DIR__ . "/partials/nav.php";
?>
<div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
  <div class="mb-10">
    <div class="text-xs font-black uppercase tracking-widest text-slate-400 mb-2"><?= e($course["level"]) ?> • <?= e($course["id"]) ?></div>
    <h1 class="text-4xl font-black">Edit Course</h1>
    <p class="text-slate-500 mt-2">Update details. Content manage dekat halaman Content.</p>
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

  <div class="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/40 p-8">
    <form method="POST" class="space-y-5">
      <input type="hidden" name="csrf" value="<?= e(csrf_token()) ?>">

      <div>
        <label class="block text-sm font-bold text-slate-700 mb-2">Level</label>
        <select name="level" class="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl">
          <?php foreach (["Beginner","Intermediate","Advanced"] as $opt): ?>
            <option <?= $course["level"]===$opt ? "selected" : "" ?>><?= e($opt) ?></option>
          <?php endforeach; ?>
        </select>
      </div>

      <div>
        <label class="block text-sm font-bold text-slate-700 mb-2">Title</label>
        <input name="title" value="<?= e($course["title"]) ?>" class="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl">
      </div>

      <div>
        <label class="block text-sm font-bold text-slate-700 mb-2">Description</label>
        <textarea name="description" rows="5" class="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl"><?= e($course["description"]) ?></textarea>
      </div>

      <div class="grid grid-cols-2 gap-4">
        <div>
          <label class="block text-sm font-bold text-slate-700 mb-2">Price</label>
          <input name="price" value="<?= e($course["price"]) ?>" class="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl">
        </div>
        <div>
          <label class="block text-sm font-bold text-slate-700 mb-2">Duration</label>
          <input name="duration" value="<?= e($course["duration"]) ?>" class="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl">
        </div>
      </div>

      <div>
        <label class="block text-sm font-bold text-slate-700 mb-2">Instructor</label>
        <input name="instructor" value="<?= e($course["instructor"]) ?>" class="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl">
      </div>

      <div>
        <label class="block text-sm font-bold text-slate-700 mb-2">Image URL</label>
        <input name="image" value="<?= e($course["image"]) ?>" class="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl">
      </div>

      <div class="flex gap-3">
        <button class="px-8 py-4 bg-yellow-500 text-white font-bold rounded-2xl hover:bg-yellow-600 shadow-lg shadow-yellow-100 transition active:scale-95">Save</button>
        <a href="courses.php" class="px-8 py-4 bg-white border border-slate-200 text-slate-700 font-bold rounded-2xl hover:bg-slate-50 transition">Back</a>
        <a href="contents.php?course_id=<?= e($course["id"]) ?>" class="ml-auto px-8 py-4 bg-slate-900 text-white font-bold rounded-2xl hover:bg-slate-800 transition">Manage Content</a>
      </div>
    </form>
  </div>
</div>

<?php include __DIR__ . "/partials/footer.php"; ?>
