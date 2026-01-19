<?php
session_start();
header('Content-Type: application/json; charset=utf-8');

function fail(int $code, string $msg, array $extra = []): void {
  http_response_code($code);
  echo json_encode(array_merge(['ok' => false, 'error' => $msg], $extra), JSON_UNESCAPED_UNICODE);
  exit;
}

// ==== Debug gate (guna key yang sama macam login.php) ====
$DEBUG_KEY = 'nQ7vK3pX9mT2rL5sA8zH1cJ6uE0yW4bG7dF9kR2xV5sP8hN3qZ6tY1mC4aL7uS9';
$DEBUG = isset($_GET['debug'], $_GET['k']) && $_GET['debug'] === '1' && hash_equals($DEBUG_KEY, (string)$_GET['k']);
if ($DEBUG) { ini_set('display_errors', '1'); error_reporting(E_ALL); } else { ini_set('display_errors', '0'); }

mysqli_report(MYSQLI_REPORT_OFF);

// ==== Include DB router/db ====
$tryIncludes = [
  __DIR__ . '/../../../api/db_router.php', // /public_html/api/db_router.php
  __DIR__ . '/../db_router.php',
  __DIR__ . '/../db.php',
  __DIR__ . '/../../admin/db.php',
];

$included = false;
foreach ($tryIncludes as $p) {
  if (is_file($p)) { require_once $p; $included = true; break; }
}
if (!$included) fail(500, 'DB include failed.');

// ==== Collect candidate mysqli conns ====
$cands = [];
if (isset($conn) && $conn instanceof mysqli) $cands['conn'] = $conn;
if (isset($conn_elearning) && $conn_elearning instanceof mysqli) $cands['conn_elearning'] = $conn_elearning;
if (isset($conn_legacy) && $conn_legacy instanceof mysqli) $cands['conn_legacy'] = $conn_legacy;
if (!$cands) fail(500, 'No mysqli connection found.');

// ==== Pick correct DB: must have `user` with `email` + (`password_hash` or `password`) ====
$best = null;
$bestScore = -1;
$diag = [];

foreach ($cands as $name => $c) {
  $dbName = '';
  $rr = $c->query("SELECT DATABASE()");
  if ($rr instanceof mysqli_result) $dbName = (string)($rr->fetch_row()[0] ?? '');

  $cols = [];
  $r = $c->query("SHOW COLUMNS FROM `user`");
  if (!($r instanceof mysqli_result)) {
    $diag[] = ['conn' => $name, 'db' => $dbName, 'ok' => false, 'why' => 'no user table'];
    continue;
  }
  while ($row = $r->fetch_assoc()) $cols[strtolower($row['Field'] ?? '')] = true;

  $hasEmail = isset($cols['email']);
  $hasPw = isset($cols['password_hash']) || isset($cols['password']);
  if (!$hasEmail || !$hasPw) {
    $diag[] = ['conn' => $name, 'db' => $dbName, 'ok' => false, 'why' => 'missing email/password cols'];
    continue;
  }

  $score = 0;
  if (isset($cols['id'])) $score += 10;
  if (isset($cols['access_id'])) $score += 5;
  if (isset($cols['must_change_password'])) $score += 2;

  $diag[] = ['conn' => $name, 'db' => $dbName, 'ok' => true, 'score' => $score];

  if ($score > $bestScore) {
    $bestScore = $score;
    $best = ['conn_name' => $name, 'db_name' => $dbName, 'cols' => $cols, 'conn' => $c];
  }
}

if (!$best) fail(500, 'Server error.', $DEBUG ? ['details' => 'No suitable DB found', 'diag' => $diag] : []);

$db = $best['conn'];
$cols = $best['cols'];

// ==== Read request JSON ====
$raw = file_get_contents('php://input') ?: '';
$payload = json_decode($raw, true);
if (!is_array($payload)) $payload = $_POST;

$email = trim((string)($payload['email'] ?? ''));
$current = (string)($payload['current_password'] ?? '');
$new = (string)($payload['new_password'] ?? '');

if ($email === '' || $current === '' || $new === '') fail(400, 'Missing fields.');
if (strlen($new) < 8) fail(400, 'New password must be at least 8 characters.');

try {
  // ==== Fetch current password fields (mysqlnd-free) ====
  $select = ['`email`'];
  if (isset($cols['id'])) $select[] = '`id`';
  if (isset($cols['password_hash'])) $select[] = '`password_hash`';
  if (isset($cols['password'])) $select[] = '`password`';
  if (isset($cols['must_change_password'])) $select[] = '`must_change_password`';

  $sql = "SELECT " . implode(',', $select) . " FROM `user` WHERE `email` = ? LIMIT 1";
  $stmt = $db->prepare($sql);
  if (!$stmt) fail(500, 'Server error.', $DEBUG ? ['details' => 'Prepare failed: '.$db->error] : []);

  $stmt->bind_param('s', $email);
  if (!$stmt->execute()) fail(500, 'Server error.', $DEBUG ? ['details' => 'Execute failed: '.$stmt->error] : []);

  $stmt->store_result();
  if ($stmt->num_rows === 0) fail(401, 'Invalid credentials.');

  // dynamic bind_result
  $colCount = count($select);
  $vals = array_fill(0, $colCount, null);
  $refs = [];
  foreach ($vals as $i => &$v) $refs[$i] = &$v;
  call_user_func_array([$stmt, 'bind_result'], $refs);
  $stmt->fetch();
  $stmt->close();

  // map back (strip backticks)
  $keys = array_map(fn($x) => trim($x, '`'), $select);
  $user = array_combine($keys, $vals) ?: [];

  $storedHash = (string)($user['password_hash'] ?? '');
  $storedPass = (string)($user['password'] ?? '');

  // ==== Verify current password ====
  $ok = false;
  if ($storedHash !== '') {
    $ok = password_verify($current, $storedHash);
  } else {
    if (preg_match('/^\$2y\$/', $storedPass) || preg_match('/^\$argon2/i', $storedPass)) {
      $ok = password_verify($current, $storedPass);
    } else {
      $ok = hash_equals($storedPass, $current);
    }
  }
  if (!$ok) fail(401, 'Invalid credentials.');

  // ==== Update to NEW HASH (bcrypt/argon via PASSWORD_DEFAULT) ====
  $newHash = password_hash($new, PASSWORD_DEFAULT);
  if (!$newHash) fail(500, 'Server error.', $DEBUG ? ['details' => 'password_hash failed'] : []);

  // Build UPDATE safely based on existing columns
  $set = [];
  $types = '';
  $params = [];

  if (isset($cols['password_hash'])) { $set[] = "`password_hash`=?"; $types .= 's'; $params[] = $newHash; }
  if (isset($cols['password']))      { $set[] = "`password`=?";      $types .= 's'; $params[] = $newHash; } // penting sebab column password NOT NULL
  if (isset($cols['must_change_password'])) { $set[] = "`must_change_password`=0"; }

  if (!$set) fail(500, 'Server error.', $DEBUG ? ['details' => 'No password columns to update'] : []);

  $sqlU = "UPDATE `user` SET " . implode(',', $set) . " WHERE `email`=? LIMIT 1";
  $types .= 's';
  $params[] = $email;

  $u = $db->prepare($sqlU);
  if (!$u) fail(500, 'Server error.', $DEBUG ? ['details' => 'Update prepare failed: '.$db->error] : []);

  // bind_param dynamic
  $bind = [];
  $bind[] = $types;
  foreach ($params as $i => $p) $bind[] = &$params[$i];
  call_user_func_array([$u, 'bind_param'], $bind);

  if (!$u->execute()) fail(500, 'Server error.', $DEBUG ? ['details' => 'Update execute failed: '.$u->error] : []);
  $u->close();

  echo json_encode(['ok' => true], JSON_UNESCAPED_UNICODE);

} catch (Throwable $e) {
  error_log('change_password.php crash: '.$e->getMessage().' @ '.$e->getFile().':'.$e->getLine());
  fail(500, 'Server error.', $DEBUG ? [
    'details' => $e->getMessage(),
    'file' => basename($e->getFile()),
    'line' => $e->getLine(),
    'picked' => $best['conn_name'],
    'db' => $best['db_name'],
  ] : []);
}