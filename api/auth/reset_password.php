<?php
session_start();
header('Content-Type: application/json; charset=utf-8');

function fail(int $code, string $msg, array $extra = []): void {
  http_response_code($code);
  echo json_encode(array_merge(['ok' => false, 'error' => $msg], $extra), JSON_UNESCAPED_UNICODE);
  exit;
}

mysqli_report(MYSQLI_REPORT_OFF);

// ==== include DB router/db ====
$tryIncludes = [
  __DIR__ . '/../../../api/db_router.php',
  __DIR__ . '/../db_router.php',
  __DIR__ . '/../db.php',
  __DIR__ . '/../../admin/db.php',
];

$included = false;
foreach ($tryIncludes as $p) {
  if (is_file($p)) { require_once $p; $included = true; break; }
}
if (!$included) fail(500, 'Server error.');

$cands = [];
if (isset($conn) && $conn instanceof mysqli) $cands[] = $conn;
if (isset($conn_elearning) && $conn_elearning instanceof mysqli) $cands[] = $conn_elearning;
if (isset($conn_legacy) && $conn_legacy instanceof mysqli) $cands[] = $conn_legacy;

// pick DB that has `user.email`
$preferredDb = 'dbyxrbeaeo77ih';

$best = null;
$bestScore = -1;
$bestCols = [];

foreach ($cands as $c) {
  $currDb = '';
  $rr = $c->query("SELECT DATABASE()");
  if ($rr instanceof mysqli_result) $currDb = (string)($rr->fetch_row()[0] ?? '');

  $r = $c->query("SHOW COLUMNS FROM `user`");
  if (!($r instanceof mysqli_result)) continue;

  $cols = [];
  while ($row = $r->fetch_assoc()) $cols[strtolower((string)$row['Field'])] = true;

  if (!isset($cols['email'])) continue;

  $score = 0;
  if ($currDb === $preferredDb) $score += 1000;
  if (isset($cols['id'])) $score += 50;
  if (isset($cols['access_id'])) $score += 20;
  if (isset($cols['must_change_password'])) $score += 10;
  if (isset($cols['password_hash'])) $score += 5;
  if (isset($cols['password'])) $score += 2;

  if ($score > $bestScore) {
    $bestScore = $score;
    $best = ['conn' => $c, 'db' => $currDb];
    $bestCols = $cols;
  }
}

if (!$best) fail(500, 'Server error.');

$db = $best['conn'];
$hasPasswordHashCol = isset($bestCols['password_hash']);
$hasPasswordCol     = isset($bestCols['password']);
$hasMustChange      = isset($bestCols['must_change_password']);

if (!$db) fail(500, 'Server error.');

// ==== ensure reset table exists (kalau user call reset dulu) ====
$db->query("CREATE TABLE IF NOT EXISTS `password_reset_codes` (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  email VARCHAR(190) NOT NULL,
  code_hash VARCHAR(255) NOT NULL,
  expires_at DATETIME NOT NULL,
  attempts INT UNSIGNED NOT NULL DEFAULT 0,
  used_at DATETIME NULL,
  created_at DATETIME NOT NULL,
  PRIMARY KEY (id),
  KEY idx_email (email),
  KEY idx_expires (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");

// ==== read request ====
$raw = file_get_contents('php://input') ?: '';
$payload = json_decode($raw, true);
if (!is_array($payload)) $payload = $_POST;

$email = trim((string)($payload['email'] ?? ''));
$code  = trim((string)($payload['code'] ?? ''));
$new   = (string)($payload['new_password'] ?? '');

if ($email === '' || $code === '' || $new === '') fail(400, 'Missing email, code, or new_password.');
if (strlen($new) < 8) fail(400, 'New password must be at least 8 characters.');

$now = new DateTime('now', new DateTimeZone('Asia/Kuala_Lumpur'));
$nowStr = $now->format('Y-m-d H:i:s');

try {
  // get latest unused code row
  $stmt = $db->prepare("
    SELECT id, code_hash, attempts, expires_at
    FROM password_reset_codes
    WHERE email=? AND used_at IS NULL
    ORDER BY id DESC
    LIMIT 1
  ");
  if (!$stmt) fail(500, 'Server error.');

  $stmt->bind_param('s', $email);
  $stmt->execute();
  $stmt->store_result();
  if ($stmt->num_rows === 0) fail(400, 'Invalid code or expired.');

  $stmt->bind_result($resetId, $codeHash, $attempts, $expiresAt);
  $stmt->fetch();
  $stmt->close();

  $resetId = (int)$resetId;
  $attempts = (int)$attempts;
  $expiresAt = (string)$expiresAt;

  if ($attempts >= 5) fail(429, 'Too many attempts. Request a new code.');
  if ($expiresAt < $nowStr) fail(400, 'Code expired. Request a new code.');

  if (!password_verify($code, (string)$codeHash)) {
    $attempts++;
    $u1 = $db->prepare("UPDATE password_reset_codes SET attempts=? WHERE id=? LIMIT 1");
    if ($u1) {
      $u1->bind_param('ii', $attempts, $resetId);
      $u1->execute();
      $u1->close();
    }
    fail(400, 'Invalid code.');
  }

  // update password (IMPORTANT: update both columns kalau wujud)
  $newHash = password_hash($new, PASSWORD_DEFAULT);
  if (!$newHash) fail(500, 'Server error.');

  $set = [];
  $types = '';
  $params = [];

  if ($hasPasswordHashCol) { $set[] = "password_hash=?"; $types .= 's'; $params[] = $newHash; }
  if ($hasPasswordCol)     { $set[] = "password=?";      $types .= 's'; $params[] = $newHash; } // keep consistent
  if ($hasMustChange)      { $set[] = "must_change_password=0"; }

  if (!$set) fail(500, 'Server error.');

  $sqlU = "UPDATE `user` SET ".implode(',', $set)." WHERE email=? LIMIT 1";
  $types .= 's';
  $params[] = $email;

  $u = $db->prepare($sqlU);
  if (!$u) fail(500, 'Server error.');

  $bind = [];
  $bind[] = $types;
  foreach ($params as $i => $p) $bind[] = &$params[$i];
  call_user_func_array([$u, 'bind_param'], $bind);

  $u->execute();
  $u->close();

  // mark used
  $u2 = $db->prepare("UPDATE password_reset_codes SET used_at=? WHERE id=? LIMIT 1");
  if ($u2) {
    $u2->bind_param('si', $nowStr, $resetId);
    $u2->execute();
    $u2->close();
  }

  echo json_encode(['ok' => true], JSON_UNESCAPED_UNICODE);
} catch (Throwable $e) {
  error_log("reset_password.php crash: ".$e->getMessage());
  fail(500, 'Server error.');
}