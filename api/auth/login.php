<?php
session_start();
header('Content-Type: application/json; charset=utf-8');

function fail(int $code, string $msg, array $extra = []): void {
  http_response_code($code);
  echo json_encode(array_merge(['ok' => false, 'error' => $msg], $extra), JSON_UNESCAPED_UNICODE);
  exit;
}

$DEBUG_KEY = 'nQ7vK3pX9mT2rL5sA8zH1cJ6uE0yW4bG7dF9kR2xV5sP8hN3qZ6tY1mC4aL7uS9';
$DEBUG = isset($_GET['debug'], $_GET['k']) && $_GET['debug'] === '1' && hash_equals($DEBUG_KEY, (string)$_GET['k']);
if ($DEBUG) { ini_set('display_errors', '1'); error_reporting(E_ALL); } else { ini_set('display_errors', '0'); }

mysqli_report(MYSQLI_REPORT_OFF);

// ===== include DB router / db =====
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

// ===== collect candidate mysqli conns =====
$cands = [];
if (isset($conn) && $conn instanceof mysqli) $cands['conn'] = $conn;
if (isset($conn_elearning) && $conn_elearning instanceof mysqli) $cands['conn_elearning'] = $conn_elearning;
if (isset($conn_legacy) && $conn_legacy instanceof mysqli) $cands['conn_legacy'] = $conn_legacy;
if (!$cands) fail(500, 'No mysqli connection found.');

// ===== pick the RIGHT DB: must have table `user` with columns `id` + `email` =====
$best = null;
$bestScore = -1;
$diag = [];

foreach ($cands as $name => $c) {
  $dbName = '';
  $rr = $c->query("SELECT DATABASE()");
  if ($rr instanceof mysqli_result) $dbName = (string)($rr->fetch_row()[0] ?? '');

  $cols = [];
  $r = $c->query("SHOW COLUMNS FROM `user`");
  if ($r instanceof mysqli_result) {
    while ($row = $r->fetch_assoc()) $cols[strtolower($row['Field'] ?? '')] = true;
  } else {
    $diag[] = ['conn' => $name, 'db' => $dbName, 'ok' => false, 'why' => 'no `user` table'];
    continue;
  }

  // minimum auth requirement
  $hasEmail = isset($cols['email']);
  $hasPw = isset($cols['password_hash']) || isset($cols['password']);

  if (!$hasEmail || !$hasPw) {
    $diag[] = ['conn' => $name, 'db' => $dbName, 'ok' => false, 'why' => 'missing email/password cols'];
    continue;
  }

  // scoring: prefer e-Learning schema
  $score = 0;
  if (isset($cols['id'])) $score += 10;              // key point
  if (isset($cols['access_id'])) $score += 5;
  if (isset($cols['must_change_password'])) $score += 2;
  if (isset($cols['name'])) $score += 1;

  $hasPay = false;
  $t1 = $c->query("SHOW TABLES LIKE 'Payment'");
  if ($t1 instanceof mysqli_result && $t1->num_rows > 0) $hasPay = true;
  $t2 = $c->query("SHOW TABLES LIKE 'payment'");
  if ($t2 instanceof mysqli_result && $t2->num_rows > 0) $hasPay = true;
  if ($hasPay) $score += 8;

  $diag[] = ['conn' => $name, 'db' => $dbName, 'ok' => true, 'score' => $score];

  if ($score > $bestScore) {
    $bestScore = $score;
    $best = ['conn_name' => $name, 'db_name' => $dbName, 'cols' => $cols, 'conn' => $c];
  }
}

if (!$best) {
  fail(500, 'Server error.', $DEBUG ? ['details' => 'No suitable DB found', 'diag' => $diag] : []);
}

$db = $best['conn'];
$cols = $best['cols'];

if ($DEBUG && isset($_GET['ping']) && $_GET['ping'] === '1') {
  echo json_encode(['ok' => true, 'picked' => $best['conn_name'], 'db' => $best['db_name']], JSON_UNESCAPED_UNICODE);
  exit;
}

// ===== read request =====
$raw = file_get_contents('php://input') ?: '';
$payload = json_decode($raw, true);
if (!is_array($payload)) $payload = $_POST;

$email = trim((string)($payload['email'] ?? ''));
$password = (string)($payload['password'] ?? '');
if ($email === '' || $password === '') fail(400, 'Missing email or password.');

try {
  // build SELECT list based on existing columns (avoid Unknown column)
  $want = ['id','name','email','access_id','password_hash','password','must_change_password'];
  $select = [];
  $keys = [];
  foreach ($want as $k) {
    if (isset($cols[$k])) { $select[] = "`$k`"; $keys[] = $k; }
  }
  if (!in_array('email', $keys, true)) fail(500, 'Server error.', $DEBUG ? ['details' => 'Picked user table has no email'] : []);

  $sql = "SELECT ".implode(',', $select)." FROM `user` WHERE `email` = ? LIMIT 1";
  $stmt = $db->prepare($sql);
  if (!$stmt) fail(500, 'Server error.', $DEBUG ? ['details' => 'Prepare failed: '.$db->error, 'picked' => $best['conn_name'], 'db' => $best['db_name']] : []);

  $stmt->bind_param('s', $email);
  if (!$stmt->execute()) fail(500, 'Server error.', $DEBUG ? ['details' => 'Execute failed: '.$stmt->error] : []);

  $stmt->store_result();
  if ($stmt->num_rows === 0) fail(401, 'Invalid credentials.');

  // dynamic bind_result
  $vals = array_fill(0, count($keys), null);
  $refs = [];
  foreach ($vals as $i => &$v) $refs[$i] = &$v;
  call_user_func_array([$stmt, 'bind_result'], $refs);
  $stmt->fetch();
  $stmt->close();

  $user = array_combine($keys, $vals) ?: [];

  $hash = (string)($user['password_hash'] ?? '');
  $passCol = (string)($user['password'] ?? '');

  $ok = false;
  if ($hash !== '') $ok = password_verify($password, $hash);
  else {
    if (preg_match('/^\$2y\$/', $passCol) || preg_match('/^\$argon2/i', $passCol)) $ok = password_verify($password, $passCol);
    else $ok = hash_equals($passCol, $password);
  }
  if (!$ok) fail(401, 'Invalid credentials.');

  // ===== detect payment table name in this DB =====
  $paymentTable = null;

  $q = $db->query("SHOW TABLES LIKE 'Payment'");
  if ($q instanceof mysqli_result && $q->num_rows > 0) $paymentTable = 'Payment';

  if ($paymentTable === null) {
    $q2 = $db->query("SHOW TABLES LIKE 'payment'");
    if ($q2 instanceof mysqli_result && $q2->num_rows > 0) $paymentTable = 'payment';
  }

  $purchased = [];
  if ($paymentTable !== null) {

    // ✅ check column "verified" exists (avoid Unknown column)
    $hasVerified = false;
    $cr = $db->query("SHOW COLUMNS FROM `$paymentTable` LIKE 'verified'");
    if ($cr instanceof mysqli_result && $cr->num_rows > 0) $hasVerified = true;

    // ✅ ONLY verified=1 unlock courses
    $pSql = $hasVerified
      ? "SELECT DISTINCT item FROM `$paymentTable` WHERE LOWER(TRIM(email)) = LOWER(?) AND verified = 1"
      : "SELECT DISTINCT item FROM `$paymentTable` WHERE LOWER(TRIM(email)) = LOWER(?)";

    $pStmt = $db->prepare($pSql);
    if ($pStmt) {
      $pStmt->bind_param('s', $email);
      if ($pStmt->execute()) {
        $pStmt->bind_result($item);
        while ($pStmt->fetch()) {
          $item = strtolower(trim((string)$item)); // ✅ trim to be safe
          if (preg_match('/^(beg|int|adv)-\d+$/', $item)) $purchased[] = $item;
        }
      }
      $pStmt->close();
    }
  }

  $_SESSION['user_email'] = (string)($user['email'] ?? $email);
  if (isset($user['access_id'])) $_SESSION['access_id'] = (string)$user['access_id'];
  if (isset($user['id'])) $_SESSION['user_db_id'] = (int)$user['id'];

  echo json_encode([
    'ok' => true,
    'user' => [
      'id' => (string)($user['access_id'] ?? ''), // frontend pakai access_id
      'name' => (string)($user['name'] ?? ''),
      'email' => (string)($user['email'] ?? $email),
      'must_change_password' => (int)($user['must_change_password'] ?? 0) === 1,
      'purchasedCourses' => $purchased
    ],
    'debug' => $DEBUG ? [
      'picked' => $best['conn_name'],
      'db' => $best['db_name'],
      'paymentTable' => $paymentTable,
      'purchasedCourses' => $purchased
    ] : null
  ], JSON_UNESCAPED_UNICODE);

} catch (Throwable $e) {
  error_log('login.php crash: '.$e->getMessage().' @ '.$e->getFile().':'.$e->getLine());
  fail(500, 'Server error.', $DEBUG ? ['details' => $e->getMessage(), 'picked' => $best['conn_name'], 'db' => $best['db_name']] : []);
}
