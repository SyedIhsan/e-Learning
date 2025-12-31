<?php
declare(strict_types=1);
require __DIR__ . "/auth.php";
require_once __DIR__ . "/lib/google_oauth.php";

$msg = (string)($_GET["msg"] ?? "");
$refresh = google_token_get_refresh();

$title = "Google Drive Connect";
include __DIR__ . "/partials/header.php";
include __DIR__ . "/partials/nav.php";

function ui_msg(string $msg): array {
  return match ($msg) {
    "connected" => ["ok", "Connected! Refresh token saved."],
    "connected_already" => ["ok", "Already connected (token exists)."],
    "no_refresh" => ["warn", "Google tak bagi refresh_token. Tekan Connect lagi. Kalau masih sama, Disconnect dan connect semula."],
    "bad_state" => ["err", "State mismatch (security). Try connect again."],
    "missing_code" => ["err", "Missing code. Try connect again."],
    "failed" => ["err", "OAuth failed. Check Client ID/Secret/Redirect URI."],
    "error" => ["err", "OAuth denied/cancelled."],
    "disconnected" => ["ok", "Disconnected. Token deleted."],
    default => ["", ""],
  };
}
[$type,$text] = ui_msg($msg);
?>

<div class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
  <div class="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
    <div>
      <h1 class="text-4xl font-black mb-2">Google Drive Connection</h1>
      <p class="text-slate-500">Connect akaun Google company sekali je untuk automation workbook.</p>
    </div>
  </div>

  <?php if ($text): ?>
    <div class="mb-6 px-4 py-3 rounded-2xl font-semibold
      <?= $type==="ok" ? "bg-emerald-50 border border-emerald-100 text-emerald-700" : "" ?>
      <?= $type==="warn" ? "bg-yellow-50 border border-yellow-100 text-yellow-800" : "" ?>
      <?= $type==="err" ? "bg-red-50 border border-red-100 text-red-600" : "" ?>
    "><?= e($text) ?></div>
  <?php endif; ?>

  <div class="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/40 p-8">
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-6">
      <div>
        <div class="text-xs font-black uppercase tracking-widest text-slate-400 mb-2">Status</div>
        <?php if ($refresh): ?>
          <div class="text-2xl font-black text-emerald-700">CONNECTED</div>
          <p class="text-slate-500 mt-2">Refresh token stored in DB: <span class="font-bold">google_oauth_tokens</span></p>
        <?php else: ?>
          <div class="text-2xl font-black text-red-600">NOT CONNECTED</div>
          <p class="text-slate-500 mt-2">Tekan connect dan login guna akaun Google company.</p>
        <?php endif; ?>
      </div>

      <div class="flex gap-3">
        <a href="connect_google.php"
          class="px-8 py-4 bg-yellow-500 text-white font-black rounded-2xl hover:bg-yellow-600 shadow-lg shadow-yellow-100 transition active:scale-95">
          Connect Google
        </a>

        <?php if ($refresh): ?>
          <form method="POST" action="google_disconnect.php" onsubmit="return confirm('Disconnect Google?');">
            <input type="hidden" name="csrf" value="<?= e(csrf_token()) ?>">
            <button class="px-8 py-4 bg-white border border-red-200 text-red-600 font-black rounded-2xl hover:bg-red-50 transition">
              Disconnect
            </button>
          </form>
        <?php endif; ?>
      </div>
    </div>
  </div>
</div>

<?php include __DIR__ . "/partials/footer.php"; ?>
