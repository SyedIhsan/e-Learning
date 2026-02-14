<?php
declare(strict_types=1);
require __DIR__ . "/bootstrap.php";

if (is_admin()) {
  redirect("index.php");
}

$error = "";

if ($_SERVER["REQUEST_METHOD"] === "POST") {
  csrf_validate();
  $username = trim((string)($_POST["username"] ?? ""));
  $password = (string)($_POST["password"] ?? "");

  if ($username === "" || $password === "") {
    $error = "Please fill in username & password.";
  } else {
    $stmt = $conn->prepare("SELECT id, password FROM admins WHERE username=? LIMIT 1");
    $stmt->bind_param("s", $username);
    $stmt->execute();
    $row = $stmt->get_result()->fetch_assoc();

    if ($row && password_verify($password, (string)$row["password"])) {
      session_regenerate_id(true);
      $_SESSION["admin_id"] = (int)$row["id"];
      redirect("index.php");
    } else {
      $error = "Invalid credentials.";
    }
  }
}

$title = "Admin Login";
include __DIR__ . "/partials/header.php";
?>
<div class="min-h-screen flex items-center justify-center px-4">
  <div class="max-w-md w-full bg-white rounded-[2rem] shadow-2xl shadow-slate-200 border border-slate-100 p-8 md:p-12">
    <div class="text-center mb-10">
      <div class="w-16 h-16 bg-yellow-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-yellow-100">
        <span class="text-white font-bold text-2xl">SDC</span>
      </div>
      <h2 class="text-3xl font-extrabold text-slate-900 mb-2">Admin Sign In</h2>
      <p class="text-slate-500">Restricted area. Authorized staff only.</p>
    </div>

    <form method="POST" class="space-y-6">
      <input type="hidden" name="csrf" value="<?= e(csrf_token()) ?>" />
      <?php if ($error): ?>
        <div class="bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-xl text-sm font-medium"><?= e($error) ?></div>
      <?php endif; ?>

      <div>
        <label class="block text-sm font-bold text-slate-700 mb-2">Username</label>
        <input name="username" type="text" autocomplete="username"
          class="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition-all" />
      </div>

      <div>
        <label class="block text-sm font-bold text-slate-700 mb-2">Password</label>
        <input name="password" type="password" autocomplete="current-password"
          class="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition-all" />
      </div>

      <button type="submit"
        class="w-full py-4 bg-yellow-500 text-white font-bold rounded-2xl hover:bg-yellow-600 shadow-xl shadow-yellow-100 transition-all active:scale-95">
        Login
      </button>
    </form>
  </div>
</div>
<?php include __DIR__ . "/partials/footer.php"; ?>
