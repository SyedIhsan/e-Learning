<?php
// /public_html/e-Learning/admin/notify_waitlist.php
// SECURITY: make sure only admin can run this
session_start();
if (empty($_SESSION['admin_logged_in'])) { http_response_code(403); exit('Forbidden'); }

require_once __DIR__ . '/db.php'; // e-Learning DB ($conn)

// PHPMailer
require_once __DIR__ . '/../../api/sdcmailer/vendor/autoload.php';
use PHPMailer\PHPMailer\PHPMailer;

$level = strtolower(trim($_POST['level'] ?? $_GET['level'] ?? ''));
$courseTitle = trim($_POST['course_title'] ?? $_GET['course_title'] ?? '');
$courseUrl = trim($_POST['course_url'] ?? $_GET['course_url'] ?? '');
$courseKey = trim($_POST['course_key'] ?? $_GET['course_key'] ?? '');

if (!in_array($level, ['beginner','intermediate','advanced'], true)) exit('Invalid level');
if ($courseTitle === '' || $courseUrl === '' || $courseKey === '') exit('Missing params');

$SMTP_HOST = getenv('SMTP_HOST');
$SMTP_USER = getenv('SMTP_USER');
$SMTP_PASS = getenv('SMTP_PASS');
$SMTP_PORT = getenv('SMTP_PORT') ?: 587;
$FROM_EMAIL = getenv('FROM_EMAIL') ?: 'no-reply@sdc.cx';
$FROM_NAME  = getenv('FROM_NAME') ?: 'SDC e-Learning';

if (!$SMTP_HOST || !$SMTP_USER || !$SMTP_PASS) exit('SMTP not configured');

mysqli_report(MYSQLI_REPORT_ERROR | MYSQLI_REPORT_STRICT);

$stmt = $conn->prepare("
  SELECT email, token
  FROM course_waitlist
  WHERE level=? AND status='subscribed'
    AND (last_notified_course_key IS NULL OR last_notified_course_key <> ?)
");
$stmt->bind_param("ss", $level, $courseKey);
$stmt->execute();
$res = $stmt->get_result();

$sent = 0;
$failed = 0;

while ($row = $res->fetch_assoc()) {
  $email = $row['email'];
  $token = $row['token'];
  $unsub = "https://sdc.cx/e-Learning/api/waitlist_unsubscribe.php?t=" . $token;

  $mail = new PHPMailer(true);
  try {
    $mail->isSMTP();
    $mail->Host = $SMTP_HOST;
    $mail->SMTPAuth = true;
    $mail->Username = $SMTP_USER;
    $mail->Password = $SMTP_PASS;
    $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
    $mail->Port = (int)$SMTP_PORT;

    $mail->setFrom($FROM_EMAIL, $FROM_NAME);
    $mail->addAddress($email);

    $mail->Subject = "New course is live: " . $courseTitle;

    $safeTitle = htmlspecialchars($courseTitle, ENT_QUOTES, 'UTF-8');
    $safeUrl   = htmlspecialchars($courseUrl, ENT_QUOTES, 'UTF-8');
    $safeUnsub = htmlspecialchars($unsub, ENT_QUOTES, 'UTF-8');

    $mail->isHTML(true);
    $mail->Body = "
      <div style='font-family:Arial,sans-serif;line-height:1.6'>
        <h2 style='margin:0 0 12px'>Good news — new course is live 🎉</h2>
        <p><b>{$safeTitle}</b> is now available for the <b>{$level}</b> track.</p>
        <p><a href='{$safeUrl}' style='display:inline-block;padding:12px 16px;border-radius:12px;background:#eab308;color:#111827;text-decoration:none;font-weight:700'>
          View course
        </a></p>
        <p style='color:#6b7280;font-size:12px;margin-top:24px'>
          If you don’t want these emails, you can <a href='{$safeUnsub}'>unsubscribe</a>.
        </p>
      </div>
    ";

    $mail->AltBody = "New course live: {$courseTitle}\n{$courseUrl}\nUnsubscribe: {$unsub}";

    $mail->send();
    $sent++;

    // mark notified
    $u = $conn->prepare("
      UPDATE course_waitlist
      SET last_notified_at=NOW(), last_notified_course_key=?
      WHERE email=? AND level=?
      LIMIT 1
    ");
    $u->bind_param("sss", $courseKey, $email, $level);
    $u->execute();
    $u->close();

  } catch (Throwable $e) {
    $failed++;
  }
}

$stmt->close();

header('Content-Type: application/json; charset=utf-8');
echo json_encode(['ok'=>true,'sent'=>$sent,'failed'=>$failed], JSON_UNESCAPED_UNICODE);