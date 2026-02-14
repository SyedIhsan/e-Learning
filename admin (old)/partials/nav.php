<?php
declare(strict_types=1);

$path = $_SERVER["PHP_SELF"] ?? "";

function nav_active(string $needle, string $path): string {
  $active = str_contains($path, $needle);
  return $active
    ? "bg-yellow-50 text-yellow-700 border border-yellow-100"
    : "text-slate-700 hover:bg-slate-50 hover:text-slate-900 border border-transparent";
}

function nav_icon(string $name): string {
  return match ($name) {
    'home' => '<svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 11l9-8 9 8v10a2 2 0 0 1-2 2h-4a2 2 0 0 1-2-2v-4a2 2 0 0 0-2-2H9a2 2 0 0 0-2 2v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V11z"/></svg>',
    'courses' => '<svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6l-8 4 8 4 8-4-8-4z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 10v6l8 4 8-4v-6"/></svg>',
    'content' => '<svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 10h16M4 14h16M4 18h10"/></svg>',
    'progress' => '<svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3v18h18"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 14l3-3 3 2 5-6"/></svg>',
    'google' => '<svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 21a9 9 0 1 1 0-18 9 9 0 0 1 0 18z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h8"/></svg>',
    default => '<svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6l4 2"/></svg>',
  };
}

function sidebar_link(string $href, string $label, string $needle, string $icon, string $path): void {
  $cls = nav_active($needle, $path);
  echo '<a href="' . htmlspecialchars($href) . '" class="group flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-extrabold transition ' . $cls . '">'
    . '<span class="text-slate-400 group-hover:text-slate-600">' . nav_icon($icon) . '</span>'
    . '<span class="tracking-tight">' . htmlspecialchars($label) . '</span>'
    . '</a>';
}
?>

<!-- Admin layout shell (Sidebar Left) -->
<div class="min-h-screen flex">

  <!-- Desktop Sidebar -->
  <aside class="hidden md:flex w-72 shrink-0 flex-col bg-white border-r border-slate-200 sticky top-0 h-screen">
    <div class="px-6 py-6 border-b border-slate-100">
      <a href="index.php" class="flex items-center gap-3">
        <div class="w-10 h-10 bg-yellow-500 rounded-xl flex items-center justify-center shadow-lg shadow-yellow-100">
          <span class="text-white font-black text-lg">SDC</span>
        </div>
        <div>
          <div class="text-sm font-black text-slate-900 leading-4">Admin Panel</div>
          <div class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Control Center</div>
        </div>
      </a>
    </div>

    <div class="px-4 py-5 flex-1 overflow-y-auto">
      <div class="text-[10px] font-black text-slate-400 uppercase tracking-widest px-3 mb-3">Navigation</div>
      <div class="space-y-2">
        <?php sidebar_link('index.php', 'Dashboard', 'index.php', 'home', $path); ?>
        <?php sidebar_link('courses.php', 'Courses', 'courses.php', 'courses', $path); ?>
        <?php sidebar_link('contents.php', 'Content', 'contents.php', 'content', $path); ?>
        <?php sidebar_link('progress.php', 'Student Progress', 'progress.php', 'progress', $path); ?>
        <?php sidebar_link('google.php', 'Google', 'google.php', 'google', $path); ?>
      </div>
    </div>

    <div class="p-4 border-t border-slate-100">
      <a href="../#/dashboard" class="block w-full text-center px-4 py-3 rounded-2xl bg-slate-900 text-white font-black text-sm hover:bg-slate-800 transition">
        Open Student Site
      </a>
      <a href="logout.php" class="mt-3 block w-full text-center px-4 py-3 rounded-2xl bg-white border border-slate-200 text-slate-600 font-black text-sm hover:border-red-200 hover:text-red-600 hover:bg-red-50 transition">
        Logout
      </a>
    </div>
  </aside>

  <!-- Mobile Top Bar + Drawer -->
  <div class="flex-1 flex flex-col min-w-0">
    <div class="md:hidden sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200">
      <div class="h-16 px-4 flex items-center justify-between">
        <button type="button" onclick="window.__sdcToggleAdminDrawer?.()" class="inline-flex items-center justify-center w-11 h-11 rounded-2xl bg-white border border-slate-200 text-slate-700">
          <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/></svg>
        </button>
        <a href="index.php" class="font-black text-slate-900">SDC Admin</a>
        <a href="logout.php" class="text-sm font-black text-slate-500 hover:text-red-600">Logout</a>
      </div>
    </div>

    <div id="adminDrawer" class="md:hidden fixed inset-0 z-[60] hidden">
      <div class="absolute inset-0 bg-black/40" onclick="window.__sdcCloseAdminDrawer?.()"></div>
      <aside class="absolute left-0 top-0 h-full w-72 bg-white border-r border-slate-200 flex flex-col">
        <div class="px-6 py-6 border-b border-slate-100 flex items-center justify-between">
          <a href="index.php" class="flex items-center gap-3">
            <div class="w-10 h-10 bg-yellow-500 rounded-xl flex items-center justify-center">
              <span class="text-white font-black text-lg">SDC</span>
            </div>
            <div class="font-black text-slate-900">Admin Panel</div>
          </a>
          <button type="button" onclick="window.__sdcCloseAdminDrawer?.()" class="w-10 h-10 rounded-2xl border border-slate-200 text-slate-700">
            <svg class="w-5 h-5 mx-auto" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>
        <div class="px-4 py-5 flex-1 overflow-y-auto">
          <div class="text-[10px] font-black text-slate-400 uppercase tracking-widest px-3 mb-3">Navigation</div>
          <div class="space-y-2">
            <?php sidebar_link('index.php', 'Dashboard', 'index.php', 'home', $path); ?>
            <?php sidebar_link('courses.php', 'Courses', 'courses.php', 'courses', $path); ?>
            <?php sidebar_link('contents.php', 'Content', 'contents.php', 'content', $path); ?>
            <?php sidebar_link('progress.php', 'Student Progress', 'progress.php', 'progress', $path); ?>
            <?php sidebar_link('google.php', 'Google', 'google.php', 'google', $path); ?>
          </div>
        </div>
        <div class="p-4 border-t border-slate-100">
          <a href="../#/dashboard" class="block w-full text-center px-4 py-3 rounded-2xl bg-slate-900 text-white font-black text-sm">Open Student Site</a>
          <a href="logout.php" class="mt-3 block w-full text-center px-4 py-3 rounded-2xl bg-white border border-slate-200 text-slate-600 font-black text-sm hover:text-red-600">Logout</a>
        </div>
      </aside>
    </div>

    <!-- Main Content Area -->
    <main class="flex-1 px-4 sm:px-6 lg:px-8 py-10">