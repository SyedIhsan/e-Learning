<?php
// /public_html/api/waitlist_subscribe.php
header('Content-Type: application/json; charset=utf-8');

function out($code, $payload) {
  http_response_code($code);
  echo json_encode($payload, JSON_UNESCAPED_UNICODE);
  exit;
}

$raw = file_get_contents('php://input');
$body = json_decode($raw, true);
$email = trim($body['email'] ?? '');
$level = strtolower(trim($body['level'] ?? ''));

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) out(400, ['ok'=>false,'error'=>'Invalid email']);
if (!in_array($level, ['beginner','intermediate','advanced'], true)) out(400, ['ok'=>false,'error'=>'Invalid level']);

mysqli_report(MYSQLI_REPORT_ERROR | MYSQLI_REPORT_STRICT);

// include DB router
$try = [
  __DIR__ . '/db_router.php',
  __DIR__ . '/../../api/db_router.php',
  __DIR__ . '/db.php',
];
$included = false;
foreach ($try as $p) { if (is_file($p)) { require_once $p; $included = true; break; } }
if (!$included) out(500, ['ok'=>false,'error'=>'Server error']);

$cnn = null;
if (isset($conn_elearning) && $conn_elearning instanceof mysqli) $cnn = $conn_elearning;
elseif (isset($conn) && $conn instanceof mysqli) $cnn = $conn;
if (!$cnn) out(500, ['ok'=>false,'error'=>'DB not ready']);

try {
  // check existing token if exists
  $token = null;
  $stmt = $cnn->prepare("SELECT token FROM course_waitlist WHERE email=? AND level=? LIMIT 1");
  $stmt->bind_param("ss", $email, $level);
  $stmt->execute();
  $res = $stmt->get_result();
  if ($row = $res->fetch_assoc()) $token = $row['token'];
  $stmt->close();

  if (!$token) $token = hash('sha256', random_bytes(32));

  $stmt = $cnn->prepare("
    INSERT INTO course_waitlist (email, level, token, status)
    VALUES (?, ?, ?, 'subscribed')
    ON DUPLICATE KEY UPDATE
      status='subscribed',
      unsubscribed_at=NULL
  ");
  $stmt->bind_param("sss", $email, $level, $token);
  $stmt->execute();
  $stmt->close();

  out(200, ['ok'=>true]);
} catch (Throwable $e) {
  out(500, ['ok'=>false,'error'=>'Server error']);
}