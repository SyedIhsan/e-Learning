<?php
// /e-Learning/admin/cron_notify_waitlist.php

if (php_sapi_name() !== 'cli') { http_response_code(403); exit("CLI only"); }

$lockFile = sys_get_temp_dir() . '/sdc_cron_notify_waitlist.lock';
$lockFp = fopen($lockFile, 'c');
if (!$lockFp || !flock($lockFp, LOCK_EX | LOCK_NB)) exit("Another cron is running\n");

$autoload = __DIR__ . '/../../api/sdcmailer/vendor/autoload.php';
if (!is_file($autoload)) exit("Missing autoload: $autoload\n");
require_once $autoload;

if (!class_exists(\PHPMailer\PHPMailer\PHPMailer::class)) {
  exit("PHPMailer not found after autoload. Check vendor packages.\n");
}

$dbfile = __DIR__ . '/db.php';
if (!is_file($dbfile)) exit("Missing db.php: $dbfile\n");
require_once $dbfile;

$SMTP_HOST = 'smtp-relay.brevo.com';
$SMTP_USER = '8408c0001@smtp-brevo.com';
$SMTP_PASS = 'xsmtpsib-e399e7bc24bb2ba9492ab629c418fac0f740c70fdc6e6184223b267dd0af8fcf-3pG0kvzFiPtGvfNf';
$SMTP_PORT = 587;

$FROM_EMAIL = 'no-reply@sdc.cx';
$FROM_NAME  = 'SDC e-Learning';

if (!$SMTP_HOST || !$SMTP_USER || !$SMTP_PASS) {
  exit("SMTP not configured\n");
}

mysqli_report(MYSQLI_REPORT_ERROR | MYSQLI_REPORT_STRICT);

$BATCH = 50;

// pick 1 pending job (oldest)
$job = null;
$res = $conn->query("SELECT * FROM course_notify_jobs WHERE status='pending' ORDER BY created_at ASC LIMIT 1");
if ($res && ($row = $res->fetch_assoc())) $job = $row;

if (!$job) {
  // No pending job. (Optional) you can also resume 'sending' job.
  $res2 = $conn->query("SELECT * FROM course_notify_jobs WHERE status='sending' ORDER BY created_at ASC LIMIT 1");
  if ($res2 && ($row2 = $res2->fetch_assoc())) $job = $row2;
}

if (!$job) exit("No jobs\n");

// move pending -> sending (idempotent)
if ($job['status'] === 'pending') {
  $st = $conn->prepare("UPDATE course_notify_jobs SET status='sending', started_at=NOW() WHERE id=? AND status='pending'");
  $st->bind_param("i", $job['id']);
  $st->execute();
  $st->close();
  // refetch
  $job['status'] = 'sending';
}

$level     = $job['level'];
$courseKey = $job['course_key'];
$title     = $job['course_title'];
$courseUrl = $job['course_url'];
$cursorId  = (int)($job['cursor_id'] ?? 0);

$st = $conn->prepare("
  SELECT id, email, token
  FROM course_waitlist
  WHERE level=? AND status='subscribed'
    AND (last_notified_course_key IS NULL OR last_notified_course_key <> ?)
    AND id > ?
  ORDER BY id ASC
  LIMIT ?
");
$st->bind_param("ssii", $level, $courseKey, $cursorId, $BATCH);
$st->execute();
$list = $st->get_result()->fetch_all(MYSQLI_ASSOC);
$st->close();

if (!$list) {
  $done = $conn->prepare("UPDATE course_notify_jobs SET status='done', finished_at=NOW() WHERE id=? LIMIT 1");
  $done->bind_param("i", $job['id']);
  $done->execute();
  $done->close();
  exit("Job done\n");
}

$sent = 0;
$failed = 0;
$lastId = $cursorId;

foreach ($list as $r) {
  $lastId = (int)$r['id'];
  $email = $r['email'];
  $token = $r['token'];
  $unsub = "https://sdc.cx/e-Learning/api/waitlist_unsubscribe.php?t=" . $token;

  try {
    $mail = new \PHPMailer\PHPMailer\PHPMailer(true);
    $mail->CharSet = 'UTF-8';

    $mail->isSMTP();
    $mail->Host = $SMTP_HOST;
    $mail->SMTPAuth = true;
    $mail->Username = $SMTP_USER;
    $mail->Password = $SMTP_PASS;
    $mail->SMTPSecure = \PHPMailer\PHPMailer\PHPMailer::ENCRYPTION_STARTTLS;
    $mail->Port = $SMTP_PORT;

    $mail->setFrom($FROM_EMAIL, $FROM_NAME);
    $mail->addAddress($email);

    $mail->Subject = "New course is live: " . $title;

    $safeTitle = htmlspecialchars($title, ENT_QUOTES, 'UTF-8');
    $safeUrl   = htmlspecialchars($courseUrl, ENT_QUOTES, 'UTF-8');
    $safeUnsub = htmlspecialchars($unsub, ENT_QUOTES, 'UTF-8');

    $mail->isHTML(true);
    $mail->Body = "
      <div style='font-family:Arial,sans-serif;line-height:1.6'>
        <h2 style='margin:0 0 12px'>New course is live 🎉</h2>
        <p><b>{$safeTitle}</b> is now available for the <b>{$level}</b> track.</p>
        <p><a href='{$safeUrl}' style='display:inline-block;padding:12px 16px;border-radius:12px;background:#eab308;color:#111827;text-decoration:none;font-weight:700'>
          View course
        </a></p>
        <p style='color:#6b7280;font-size:12px;margin-top:24px'>
          Unsubscribe: <a href='{$safeUnsub}'>click here</a>
        </p>
      </div>
    ";
    $mail->AltBody = "New course live: {$title}\n{$courseUrl}\nUnsubscribe: {$unsub}";

    $mail->send();
    $sent++;

    // mark this subscriber as notified for this course
    $u = $conn->prepare("
      UPDATE course_waitlist
      SET last_notified_at=NOW(), last_notified_course_key=?
      WHERE id=? LIMIT 1
    ");
    $u->bind_param("si", $courseKey, $r['id']);
    $u->execute();
    $u->close();

  } catch (Throwable $e) {
    $failed++;

    $errMsg = substr($e->getMessage(), 0, 2000);
    $err = $conn->prepare("UPDATE course_notify_jobs SET last_error=? WHERE id=? LIMIT 1");
    $err->bind_param("si", $errMsg, $job['id']);
    $err->execute();
    $err->close();
  }
}

// update job cursor + counts
$upd = $conn->prepare("
  UPDATE course_notify_jobs
  SET cursor_id=?, sent_count=sent_count+?, fail_count=fail_count+?
  WHERE id=? LIMIT 1
");
$upd->bind_param("iiii", $lastId, $sent, $failed, $job['id']);
$upd->execute();
$upd->close();

echo "Batch sent={$sent}, failed={$failed}, cursor={$lastId}\n";