<?php
// /public_html/payment/start.php
declare(strict_types=1);
date_default_timezone_set('Asia/Kuala_Lumpur');

// ------------------------------------------------------------
// Resolve e-Learning DB file (always /public_html/e-Learning/admin/db.php)
// ------------------------------------------------------------
$publicRoot = realpath($_SERVER['DOCUMENT_ROOT'] ?? (__DIR__ . '/..')) ?: (realpath(__DIR__ . '/..') ?: dirname(__DIR__));
$elearningDbFile = $publicRoot . '/e-Learning/admin/db.php';

if (!file_exists($elearningDbFile)) {
  http_response_code(500);
  header('Content-Type: text/plain; charset=utf-8');
  exit("Missing e-Learning DB file: {$elearningDbFile}");
}

require_once $elearningDbFile;

// admin/db.php should provide $conn (mysqli)
if (!isset($conn) || !($conn instanceof mysqli)) {
  http_response_code(500);
  header('Content-Type: text/plain; charset=utf-8');
  exit("DB connection not found from: {$elearningDbFile}");
}

$conn->set_charset('utf8mb4');

// Optional: make mysqli throw exceptions (helps debugging)
// mysqli_report(MYSQLI_REPORT_ERROR | MYSQLI_REPORT_STRICT);

function safe_post(string $k): string {
  return isset($_POST[$k]) ? trim((string)$_POST[$k]) : '';
}

function ensureElearningPaymentTable(mysqli $conn): void {
  // Match your latest schema (transaction_ref nullable, verified default 0)
  mysqli_query($conn, "
    CREATE TABLE IF NOT EXISTS `Payment` (
      `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
      `sid` VARCHAR(32) NULL,
      `order_id` VARCHAR(120) NOT NULL,
      `name` VARCHAR(150) NOT NULL,
      `email` VARCHAR(190) NOT NULL,
      `phone` VARCHAR(40) NOT NULL,
      `item` VARCHAR(120) NOT NULL,
      `created_at` DATETIME NOT NULL,
      `price` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
      `transaction_ref` VARCHAR(120) NULL DEFAULT NULL,
      `verified` TINYINT(1) NOT NULL DEFAULT 0,
      PRIMARY KEY (`id`),
      UNIQUE KEY `uq_order_id` (`order_id`),
      UNIQUE KEY `uq_transaction_ref` (`transaction_ref`),
      KEY `idx_email` (`email`),
      KEY `idx_item` (`item`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  ");
}

ensureElearningPaymentTable($conn);

// ------------------------------------------------------------
// Input
// ------------------------------------------------------------
$courseId = safe_post('course_id');   // beg-101
$name     = safe_post('name');
$email    = safe_post('email');
$phone    = safe_post('phone');

// Validate course id pattern (e-Learning)
if ($courseId === '' || preg_match('/^(beg|int|adv)-\d+$/i', $courseId) !== 1) {
  header('Location: /e-Learning/#/');
  exit;
}

// Email is required for e-Learning
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
  header('Location: /e-Learning/#/signin');
  exit;
}

if ($name === '') $name = 'Customer';
if ($phone === '') $phone = '';

// ------------------------------------------------------------
// Fetch course from DB
// ------------------------------------------------------------
$stmt = $conn->prepare("SELECT id, title, price FROM courses WHERE id = ? LIMIT 1");
$stmt->bind_param("s", $courseId);
$stmt->execute();
$res = $stmt->get_result();
$course = $res ? $res->fetch_assoc() : null;

if (!$course) {
  header('Location: /e-Learning/#/');
  exit;
}

$title    = (string)($course['title'] ?? $courseId);
$rawPrice = (string)($course['price'] ?? '0');

// Clean price (remove RM, commas, spaces etc.)
$cleanPrice = preg_replace('/[^0-9.]/', '', $rawPrice);

if ($cleanPrice === '' || !is_numeric($cleanPrice)) {
  http_response_code(500);
  header('Content-Type: text/plain; charset=utf-8');
  exit('Invalid course price in DB: ' . htmlspecialchars($rawPrice, ENT_QUOTES, 'UTF-8'));
}

$amount = number_format((float)$cleanPrice, 2, '.', '');
$amountFloat = (float)$amount;

// SenangPay minimum amount
if ($amountFloat < 2) {
  http_response_code(400);
  header('Content-Type: text/plain; charset=utf-8');
  exit("Minimum amount is RM2.00 (SenangPay restriction). amount={$amount}");
}

// Make detail safe for SenangPay
$detail = preg_replace('/[^A-Za-z0-9\.\,\-\_]/', '', str_replace(' ', '_', $title));
$detail = substr($detail, 0, 200);
if ($detail === '') $detail = $courseId;

// ------------------------------------------------------------
// Create unique order_id
// ------------------------------------------------------------
$order_id = $courseId . "-oid-" . date('YmdHis') . random_int(1000, 9999);
$order_id = substr($order_id, 0, 120);

// ------------------------------------------------------------
// Insert pending Payment row (source of truth for callback)
// ------------------------------------------------------------
$createdAt = date('Y-m-d H:i:s');

$stmt = $conn->prepare("
  INSERT INTO `Payment`
    (sid, order_id, name, email, phone, item, created_at, price, transaction_ref, verified)
  VALUES
    (NULL, ?, ?, ?, ?, ?, ?, ?, NULL, 0)
  ON DUPLICATE KEY UPDATE
    name = VALUES(name),
    email = VALUES(email),
    phone = VALUES(phone),
    item = VALUES(item),
    created_at = VALUES(created_at),
    price = VALUES(price)
");

$stmt->bind_param(
  "ssssssd",
  $order_id,
  $name,
  $email,
  $phone,
  $courseId,
  $createdAt,
  $amountFloat
);

$stmt->execute();

// ------------------------------------------------------------
// SenangPay config
// ------------------------------------------------------------
$isSandbox = isset($_GET['sandbox']) && $_GET['sandbox'] === '1';

if ($isSandbox) {
  $MERCHANT_ID = "717172619832027";
  $SECRET_KEY  = "7051-1448236144";
  $baseUrl     = "https://sandbox.senangpay.my/payment/";
} else {
  $MERCHANT_ID = "221172552850991";
  $SECRET_KEY  = "42436-845";
  $baseUrl     = "https://app.senangpay.my/payment/";
}

$payUrl = $baseUrl . $MERCHANT_ID;

// HMAC SHA256 hash (as per your setup)
$str  = $SECRET_KEY . $detail . $amount . $order_id;
$hash = hash_hmac('sha256', $str, $SECRET_KEY);

// URLs
$returnUrl   = "https://sdc.cx/sresult1.php";
$callbackUrl = "https://sdc.cx/process-payment.php";
?>
<!doctype html>
<html>
  <body onload="document.forms[0].submit()">
    <form method="POST" action="<?= htmlspecialchars($payUrl, ENT_QUOTES, 'UTF-8') ?>">
      <input type="hidden" name="detail" value="<?= htmlspecialchars($detail, ENT_QUOTES, 'UTF-8') ?>">
      <input type="hidden" name="amount" value="<?= htmlspecialchars($amount, ENT_QUOTES, 'UTF-8') ?>">
      <input type="hidden" name="order_id" value="<?= htmlspecialchars($order_id, ENT_QUOTES, 'UTF-8') ?>">
      <input type="hidden" name="hash" value="<?= htmlspecialchars($hash, ENT_QUOTES, 'UTF-8') ?>">

      <!-- optional prefill -->
      <input type="hidden" name="name" value="<?= htmlspecialchars($name, ENT_QUOTES, 'UTF-8') ?>">
      <input type="hidden" name="email" value="<?= htmlspecialchars($email, ENT_QUOTES, 'UTF-8') ?>">
      <input type="hidden" name="phone" value="<?= htmlspecialchars($phone, ENT_QUOTES, 'UTF-8') ?>">

      <!-- URLs -->
      <input type="hidden" name="return_url" value="<?= htmlspecialchars($returnUrl, ENT_QUOTES, 'UTF-8') ?>">
      <input type="hidden" name="callback_url" value="<?= htmlspecialchars($callbackUrl, ENT_QUOTES, 'UTF-8') ?>">
    </form>
  </body>
</html>