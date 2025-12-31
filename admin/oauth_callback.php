<?php
declare(strict_types=1);
require __DIR__ . "/auth.php";
require_once __DIR__ . "/lib/google_oauth.php";

$code  = (string)($_GET["code"] ?? "");
$state = (string)($_GET["state"] ?? "");
$err   = (string)($_GET["error"] ?? "");

if ($err) redirect("google.php?msg=error");

if (!$code) redirect("google.php?msg=missing_code");

if (empty($_SESSION["google_oauth_state"]) || !hash_equals((string)$_SESSION["google_oauth_state"], $state)) {
  redirect("google.php?msg=bad_state");
}

try {
  $tokens = google_exchange_code_for_tokens($code);

  $refresh = (string)($tokens["refresh_token"] ?? "");
  $scopes  = (string)($tokens["scope"] ?? "");

  // Kalau Google tak bagi refresh_token (kadang-kadang jadi bila pernah connect)
  if ($refresh === "") {
    if (google_token_get_refresh()) redirect("google.php?msg=connected_already");
    redirect("google.php?msg=no_refresh");
  }

  google_token_save_refresh($refresh, $scopes);
  redirect("google.php?msg=connected");
} catch (Throwable $e) {
  redirect("google.php?msg=failed");
}
?>