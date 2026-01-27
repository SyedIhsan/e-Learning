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

  // 1) standard form POST
  $t = (string)($_POST["csrf"] ?? "");

  // 2) allow header token for fetch/json
  if ($t === "" && !empty($_SERVER["HTTP_X_CSRF_TOKEN"])) {
    $t = (string)$_SERVER["HTTP_X_CSRF_TOKEN"];
  }

  // 3) allow json body token (optional)
  if ($t === "" && (($_SERVER["CONTENT_TYPE"] ?? "") !== "") && str_contains($_SERVER["CONTENT_TYPE"], "application/json")) {
    $raw = file_get_contents("php://input");
    $in = json_decode($raw, true);
    if (is_array($in) && !empty($in["csrf"])) $t = (string)$in["csrf"];
  }

  if ($t === "" || empty($_SESSION["csrf"]) || !hash_equals((string)$_SESSION["csrf"], $t)) {
    http_response_code(403);
    exit("CSRF blocked.");
  }
}

function is_admin(): bool {
  return !empty($_SESSION["admin_id"]);
}
