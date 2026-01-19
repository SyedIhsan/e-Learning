<?php
declare(strict_types=1);
?>

    </main>

    <footer class="px-4 sm:px-6 lg:px-8 py-10 text-center text-xs text-slate-400">
      © <?= date("Y") ?> SDC Admin.
    </footer>
  </div>
</div>

<script>
  (function () {
    const drawer = document.getElementById('adminDrawer');
    function openDrawer(){ drawer && drawer.classList.remove('hidden'); }
    function closeDrawer(){ drawer && drawer.classList.add('hidden'); }
    function toggleDrawer(){
      if (!drawer) return;
      drawer.classList.contains('hidden') ? openDrawer() : closeDrawer();
    }

    window.__sdcToggleAdminDrawer = toggleDrawer;
    window.__sdcCloseAdminDrawer = closeDrawer;
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeDrawer();
    });
  })();
</script>

</body>
</html>