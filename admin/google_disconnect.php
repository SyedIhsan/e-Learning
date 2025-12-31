<?php
declare(strict_types=1);
require __DIR__ . "/auth.php";
require_once __DIR__ . "/lib/google_oauth.php";

if ($_SERVER["REQUEST_METHOD"] !== "POST") redirect("google.php");
csrf_validate();

$refresh = google_token_get_refresh();
if ($refresh) {
  try { google_revoke_token($refresh); } catch (Throwable $e) {}
}
google_token_delete();
redirect("google.php?msg=disconnected");
?>