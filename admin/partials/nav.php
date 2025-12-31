<?php
declare(strict_types=1);
$path = $_SERVER["PHP_SELF"] ?? "";
function nav_active(string $needle, string $path): string {
  return str_contains($path, $needle) ? "text-yellow-500" : "text-slate-600 hover:text-yellow-500";
}
?>
<nav class="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200">
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <div class="flex justify-between items-center h-20">
      <a href="index.php" class="flex items-center space-x-2">
        <div class="w-10 h-10 bg-yellow-500 rounded-lg flex items-center justify-center">
          <span class="text-white font-bold text-xl">SDC</span>
        </div>
        <span class="text-xl font-extrabold text-slate-900 tracking-tight hidden sm:block">Admin</span>
      </a>

      <div class="hidden md:flex items-center space-x-8">
        <a href="courses.php" class="text-sm font-semibold transition-colors <?= nav_active("courses.php", $path) ?>">Courses</a>
        <a href="contents.php" class="text-sm font-semibold transition-colors <?= nav_active("contents.php", $path) ?>">Content</a>
        <a href="google.php" class="text-sm font-semibold transition-colors <?= nav_active("google.php", $path) ?>">Google</a>
      </div>

      <div class="flex items-center space-x-4">
        <a href="../#/dashboard" class="hidden sm:block text-sm font-semibold text-slate-700 hover:text-yellow-500">Student Site</a>
        <a href="logout.php" class="text-sm font-semibold text-slate-500 hover:text-red-600 transition-colors">Logout</a>
      </div>
    </div>
  </div>
</nav>
