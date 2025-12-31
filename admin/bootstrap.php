<?php
declare(strict_types=1);

require __DIR__ . "/db.php";

// Secure-ish session cookie defaults (works on shared hosting)
$secure = (!empty($_SERVER["HTTPS"]) && $_SERVER["HTTPS"] !== "off");
session_set_cookie_params([
  "lifetime" => 0,
  "path" => "/",
  "domain" => "",
  "secure" => $secure,
  "httponly" => true,
  "samesite" => "Lax",
]);

session_start();

function e(string $s): string {
  return htmlspecialchars($s, ENT_QUOTES | ENT_SUBSTITUTE, "UTF-8");
}

function redirect(string $path): never {
  header("Location: " . $path);
  exit;
}

function csrf_token(): string {
  if (empty($_SESSION["csrf"])) {
    $_SESSION["csrf"] = bin2hex(random_bytes(32));
  }
  return $_SESSION["csrf"];
}

function csrf_validate(): void {
  if ($_SERVER["REQUEST_METHOD"] !== "POST") return;
  $t = $_POST["csrf"] ?? "";
  if (!$t || empty($_SESSION["csrf"]) || !hash_equals($_SESSION["csrf"], $t)) {
    http_response_code(403);
    exit("CSRF blocked.");
  }
}

function is_admin(): bool {
  return !empty($_SESSION["admin_id"]);
}
