<?php
declare(strict_types=1);
require __DIR__ . "/../../admin/bootstrap.php";
header('Content-Type: application/json; charset=utf-8');

$userId = (int)($_SESSION['user_db_id'] ?? 0);
if ($userId <= 0) {
  http_response_code(401);
  echo json_encode(['ok'=>false,'error'=>'Unauthenticated']);
  exit;
}

$raw = file_get_contents('php://input');
$in = json_decode($raw, true);

if (!is_array($in)) {
  http_response_code(400);
  echo json_encode(['ok'=>false,'error'=>'Invalid JSON']);
  exit;
}

$courseId = trim((string)($in['course_id'] ?? ''));
$type     = (string)($in['content_type'] ?? '');
$contentId= trim((string)($in['content_id'] ?? ''));
$completed= (int)!!($in['completed'] ?? false);

$allowed = ['video','ebook','workbook'];
if ($courseId==='' || $contentId==='' || !in_array($type, $allowed, true)) {
  http_response_code(400);
  echo json_encode(['ok'=>false,'error'=>'Bad payload']);
  exit;
}

$stmt = $conn->prepare("
  INSERT INTO user_progress (user_id, course_id, content_type, content_id, completed)
  VALUES (?,?,?,?,?)
  ON DUPLICATE KEY UPDATE completed=VALUES(completed), updated_at=NOW()
");

if (!$stmt) {
  http_response_code(500);
  echo json_encode(['ok'=>false,'error'=>'DB prepare failed']);
  exit;
}

$stmt->bind_param("isssi", $userId, $courseId, $type, $contentId, $completed);
$stmt->execute();

echo json_encode(['ok'=>true]);