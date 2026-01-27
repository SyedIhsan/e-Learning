<?php
session_start();
header('Content-Type: application/json; charset=utf-8');

function respond_ok(array $extra = []): void {
  echo json_encode(array_merge(['ok' => true], $extra), JSON_UNESCAPED_UNICODE);
  exit;
}
function respond_fail(int $code, string $msg, array $extra = []): void {
  http_response_code($code);
  echo json_encode(array_merge(['ok' => false, 'error' => $msg], $extra), JSON_UNESCAPED_UNICODE);
  exit;
}

// ===== Debug gate (guna key yang sama macam login/change_password) =====
$DEBUG_KEY = 'nQ7vK3pX9mT2rL5sA8zH1cJ6uE0yW4bG7dF9kR2xV5sP8hN3qZ6tY1mC4aL7uS9';
$DEBUG = isset($_GET['debug'], $_GET['k']) && $_GET['debug'] === '1' && hash_equals($DEBUG_KEY, (string)$_GET['k']);
if ($DEBUG) { ini_set('display_errors', '1'); error_reporting(E_ALL); } else { ini_set('display_errors', '0'); }

mysqli_report(MYSQLI_REPORT_OFF);

// ===== Brevo settings =====
$BREVO_API_KEY = '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';
$BREVO_SENDER_NAME  = 'SDC Automated Operations';
$BREVO_SENDER_EMAIL = 'do-not-reply@sdc.cx';

// ===== Locate vendor/autoload.php safely =====
$autoload = __DIR__ . '/../../../api/sdcmailer/vendor/autoload.php';
$autoload_found = is_file($autoload);
if ($autoload_found) require_once $autoload;

// ===== send email helper (Brevo optional) =====
function sendEmailBrevo($apiKey, $senderName, $senderEmail, $toEmail, $subject, $html): bool {
  if (!$apiKey || strlen($apiKey) < 30) return false;

  // Brevo SDK may not exist even if autoload exists
  if (!class_exists('Brevo\\Client\\Configuration') || !class_exists('Brevo\\Client\\Api\\TransactionalEmailsApi')) {
    return false;
  }

  try {
    $config = Brevo\Client\Configuration::getDefaultConfiguration()->setApiKey('api-key', $apiKey);
    $api = new Brevo\Client\Api\TransactionalEmailsApi(new GuzzleHttp\Client(), $config);

    $mail = new Brevo\Client\Model\SendSmtpEmail([
      'subject' => $subject,
      'sender'  => ['name' => $senderName, 'email' => $senderEmail],
      'to'      => [['email' => $toEmail]],
      'htmlContent' => $html
    ]);

    $api->sendTransacEmail($mail);
    return true;
  } catch (Throwable $e) {
    error_log("Brevo send error: " . $e->getMessage());
    return false;
  }
}

// ===== include DB router/db safely =====
$router = __DIR__ . '/../../../api/db_router.php';
if (!is_file($router)) respond_ok($DEBUG ? ['debug' => ['db' => 'router_missing']] : []);
require_once $router;

// ===== pick correct DB connection (must have user.email) =====
$cands = [];
if (isset($conn) && $conn instanceof mysqli) $cands[] = $conn;
if (isset($conn_elearning) && $conn_elearning instanceof mysqli) $cands[] = $conn_elearning;
if (isset($conn_legacy) && $conn_legacy instanceof mysqli) $cands[] = $conn_legacy;

$preferredDb = 'dbyxrbeaeo77ih';

$best = null;
$bestScore = -1;

foreach ($cands as $c) {
  // nama DB current
  $currDb = '';
  $rr = $c->query("SELECT DATABASE()");
  if ($rr instanceof mysqli_result) $currDb = (string)($rr->fetch_row()[0] ?? '');

  // columns table user
  $r = $c->query("SHOW COLUMNS FROM `user`");
  if (!($r instanceof mysqli_result)) continue;

  $cols = [];
  while ($row = $r->fetch_assoc()) {
    $cols[strtolower((string)($row['Field'] ?? ''))] = true;
  }

  // minimum requirement
  if (!isset($cols['email'])) continue;

  // score schema: prefer e-Learning
  $score = 0;
  if ($currDb === $preferredDb) $score += 1000; // paling penting: force DB name
  if (isset($cols['id'])) $score += 50;
  if (isset($cols['access_id'])) $score += 20;
  if (isset($cols['must_change_password'])) $score += 10;
  if (isset($cols['password_hash'])) $score += 5;
  if (isset($cols['password'])) $score += 2;
  if (isset($cols['name'])) $score += 1;

  if ($score > $bestScore) {
    $bestScore = $score;
    $best = ['conn' => $c, 'db' => $currDb];
  }
}

if (!$best) {
  respond_ok($DEBUG ? ['debug' => ['db' => 'not_found']] : []);
}

$db = $best['conn'];
$dbName = $best['db'];

// ===== read request =====
$raw = file_get_contents('php://input') ?: '';
$payload = json_decode($raw, true);
if (!is_array($payload)) $payload = $_POST;

$email = trim((string)($payload['email'] ?? ''));
if ($email === '') respond_fail(400, 'Missing email.');

try {
  // Ensure table exists
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

  // Check if user exists (but ALWAYS respond ok)
  $exists = false;
  $stmt = $db->prepare("SELECT 1 FROM `user` WHERE email=? LIMIT 1");
  if ($stmt) {
    $stmt->bind_param('s', $email);
    $stmt->execute();
    $stmt->store_result();
    $exists = ($stmt->num_rows > 0);
    $stmt->close();
  }

  $sent = false;
  if ($exists) {
    $code = (string)random_int(100000, 999999);
    $codeHash = password_hash($code, PASSWORD_DEFAULT);

    $now = new DateTime('now', new DateTimeZone('Asia/Kuala_Lumpur'));
    $exp = (clone $now)->modify('+15 minutes');

    $nowStr = $now->format('Y-m-d H:i:s');
    $expStr = $exp->format('Y-m-d H:i:s');

    $ins = $db->prepare("INSERT INTO password_reset_codes (email, code_hash, expires_at, created_at) VALUES (?,?,?,?)");
    if ($ins) {
      $ins->bind_param('ssss', $email, $codeHash, $expStr, $nowStr);
      $ins->execute();
      $ins->close();
    }

    $subject = "Password Reset Verification Code";
    $html = "
      <html><body>
        <h3>Password Reset</h3>
        <p>Your verification code is:</p>
        <h2 style='letter-spacing:2px;'>$code</h2>
        <p>This code will expire in 15 minutes.</p>
        <p>If you did not request this, ignore this email.</p>
      </body></html>";

    $sent = sendEmailBrevo($BREVO_API_KEY, $BREVO_SENDER_NAME, $BREVO_SENDER_EMAIL, $email, $subject, $html);
  }

  // anti-enumeration: always ok
  if ($DEBUG) {
    respond_ok([
      'debug' => [
        'db' => $dbName,
        'autoload_found' => $autoload_found,
        'brevo_ready' => class_exists('Brevo\\Client\\Configuration'),
        'user_exists' => $exists,
        'email_sent' => $sent
      ]
    ]);
  }

  respond_ok();
} catch (Throwable $e) {
  error_log("forgot_password.php crash: ".$e->getMessage());
  if ($DEBUG) {
    respond_fail(500, 'Server error.', [
      'details' => $e->getMessage(),
      'autoload_found' => $autoload_found,
      'db' => $dbName
    ]);
  }
  // production: still ok (avoid enumeration)
  respond_ok();
}