<?php
header('Content-Type: text/plain; charset=utf-8');

$token = preg_replace('/[^a-f0-9]/i', '', $_GET['t'] ?? '');
if (strlen($token) !== 64) { http_response_code(400); exit("Invalid link"); }

$try = [
  __DIR__ . '/db_router.php',
  __DIR__ . '/../../api/db_router.php',
  __DIR__ . '/db.php',
];
$included = false;
foreach ($try as $p) { if (is_file($p)) { require_once $p; $included = true; break; } }
if (!$included) { http_response_code(500); exit("Server error"); }

$cnn = null;
if (isset($conn_elearning) && $conn_elearning instanceof mysqli) $cnn = $conn_elearning;
elseif (isset($conn) && $conn instanceof mysqli) $cnn = $conn;
if (!$cnn) { http_response_code(500); exit("DB not ready"); }

try {
  $stmt = $cnn->prepare("
    UPDATE course_waitlist
    SET status='unsubscribed', unsubscribed_at=NOW()
    WHERE token=? LIMIT 1
  ");
  $stmt->bind_param("s", $token);
  $stmt->execute();
  $stmt->close();
  echo "You have been unsubscribed.";
} catch (Throwable $e) {
  http_response_code(500);
  echo "Server error";
}