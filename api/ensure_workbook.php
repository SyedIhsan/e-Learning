<?php
declare(strict_types=1);

header("Content-Type: application/json; charset=utf-8");
ini_set('display_errors', '0');
error_reporting(E_ALL);

require __DIR__ . "/../admin/bootstrap.php";
require_once __DIR__ . "/../admin/lib/google_oauth.php";
require_once __DIR__ . "/../admin/lib/drive_api.php";
require_once __DIR__ . "/../admin/secure/drive_config.php";

function json_fail(int $code, string $msg): never {
  http_response_code($code);
  echo json_encode(["ok" => false, "error" => $msg], JSON_UNESCAPED_SLASHES);
  exit;
}

function sanitize_drive_name(string $name): string {
  $n = trim($name);
  $n = preg_replace('~[\\\\/\\x00-\\x1F]~u', ' ', $n) ?? $n;
  $n = preg_replace('~\\s+~u', ' ', $n) ?? $n;
  $n = trim($n);

  if ($n === "") $n = "Untitled";
  if (mb_strlen($n) > 120) $n = mb_substr($n, 0, 120);
  return $n;
}

if (($_SERVER["REQUEST_METHOD"] ?? "") !== "POST") json_fail(405, "Method not allowed");

$raw = file_get_contents("php://input");
$payload = json_decode($raw ?: "", true);
if (!is_array($payload)) $payload = $_POST;

$courseId   = trim((string)($payload["course_id"] ?? ""));
$workbookId = trim((string)($payload["workbook_id"] ?? "")); // should match course_workbooks.content_id
$userId     = trim((string)($payload["user_id"] ?? ""));     // SDCEL0001
$email      = trim((string)($payload["user_email"] ?? ""));

if ($courseId === "" || $userId === "" || $email === "") json_fail(400, "Missing course_id / user_id / user_email");
if ($workbookId === "") json_fail(400, "Missing workbook_id");
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) json_fail(400, "Invalid email");

// tables
$conn->query("CREATE TABLE IF NOT EXISTS drive_meta (
  meta_key VARCHAR(80) PRIMARY KEY,
  meta_value VARCHAR(255) NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");

$conn->query("CREATE TABLE IF NOT EXISTS user_course_folders (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id VARCHAR(50) NOT NULL,
  course_id VARCHAR(50) NOT NULL,
  folder_id VARCHAR(120) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uniq_user_course (user_id, course_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");

$conn->query("CREATE TABLE IF NOT EXISTS user_workbooks (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id VARCHAR(50) NOT NULL,
  course_id VARCHAR(50) NOT NULL,
  workbook_id VARCHAR(80) NOT NULL,
  user_email VARCHAR(255) NOT NULL,
  user_file_id VARCHAR(120) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uniq_user_course_wb (user_id, course_id, workbook_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");

// Token must exist (admin already connected)
$refresh = google_token_get_refresh();
if (!$refresh) json_fail(500, "Google belum connected. Admin kena connect dekat /admin/google.php dulu.");

try {
  $tok = google_access_token_from_refresh($refresh);
  $access = (string)$tok["access_token"];

  // 1) Get course title + level + drive_folder_id
  $stmt = $conn->prepare("SELECT id, title, level, drive_folder_id FROM courses WHERE id=? LIMIT 1");
  $stmt->bind_param("s", $courseId);
  $stmt->execute();
  $course = $stmt->get_result()->fetch_assoc();
  if (!$course) json_fail(404, "Course not found");

  $level = sanitize_drive_name((string)($course["level"] ?? "Beginner"));
  $courseTitle = sanitize_drive_name((string)($course["title"] ?? $courseId));

  // 2) Ensure Level folder under USERS_ROOT_FOLDER_ID
  $levelKey = "level:" . $level;
  $stmt = $conn->prepare("SELECT meta_value FROM drive_meta WHERE meta_key=? LIMIT 1");
  $stmt->bind_param("s", $levelKey);
  $stmt->execute();
  $meta = $stmt->get_result()->fetch_assoc();
  $levelFolderId = $meta ? (string)$meta["meta_value"] : "";

  if ($levelFolderId === "") {
    $levelFolderId = drive_create_folder($access, $level, USERS_ROOT_FOLDER_ID);
    $ins = $conn->prepare("INSERT INTO drive_meta (meta_key, meta_value) VALUES (?,?)");
    $ins->bind_param("ss", $levelKey, $levelFolderId);
    $ins->execute();
  }

  // 3) Ensure Course Title folder under Level folder
  $courseFolderId = (string)($course["drive_folder_id"] ?? "");
  if ($courseFolderId === "") {
    $courseFolderId = drive_create_folder($access, $courseTitle, $levelFolderId);
    $up = $conn->prepare("UPDATE courses SET drive_folder_id=? WHERE id=?");
    $up->bind_param("ss", $courseFolderId, $courseId);
    $up->execute();
  }

  // 4) Ensure User folder under Course folder (name = userId)
  $stmt = $conn->prepare("SELECT folder_id FROM user_course_folders WHERE user_id=? AND course_id=? LIMIT 1");
  $stmt->bind_param("ss", $userId, $courseId);
  $stmt->execute();
  $uf = $stmt->get_result()->fetch_assoc();
  $userFolderId = $uf ? (string)$uf["folder_id"] : "";

  if ($userFolderId === "") {
    $userFolderId = drive_create_folder($access, sanitize_drive_name($userId), $courseFolderId);
    $ins = $conn->prepare("INSERT INTO user_course_folders (user_id, course_id, folder_id) VALUES (?,?,?)");
    $ins->bind_param("sss", $userId, $courseId, $userFolderId);
    $ins->execute();
  }

  // 5) Reuse file if already created (mapping)
  $stmt = $conn->prepare("SELECT user_file_id FROM user_workbooks WHERE user_id=? AND course_id=? AND workbook_id=? LIMIT 1");
  $stmt->bind_param("sss", $userId, $courseId, $workbookId);
  $stmt->execute();
  $map = $stmt->get_result()->fetch_assoc();
  if ($map) {
    $fileId = (string)$map["user_file_id"];
  } else {
    // 6) Get template + workbook title (match by content_id)
    $row = null;
    try {
      $stmt = $conn->prepare("SELECT template_file_id, title FROM course_workbooks
                              WHERE course_id=? AND content_id=? AND template_file_id IS NOT NULL AND template_file_id<>'' 
                              ORDER BY id ASC LIMIT 1");
      $stmt->bind_param("ss", $courseId, $workbookId);
      $stmt->execute();
      $row = $stmt->get_result()->fetch_assoc();
    } catch (Throwable $e) {
      // fallback if column content_id not exists yet
      $row = null;
    }

    if (!$row) {
      // fallback: first workbook template
      $stmt = $conn->prepare("SELECT template_file_id, title FROM course_workbooks
                              WHERE course_id=? AND template_file_id IS NOT NULL AND template_file_id<>'' 
                              ORDER BY id ASC LIMIT 1");
      $stmt->bind_param("s", $courseId);
      $stmt->execute();
      $row = $stmt->get_result()->fetch_assoc();
    }

    if (!$row) json_fail(500, "Template belum set untuk workbook ni. Admin kena isi template_file_id (dan content_id).");

    $templateId = (string)$row["template_file_id"];
    $workbookTitle = sanitize_drive_name((string)($row["title"] ?? "Workbook"));

    // 7) Copy template into user folder, file name = Workbook Title
  $fileName = sanitize_drive_name($workbookTitle) . " - " . sanitize_drive_name($userId);
  $fileId = drive_copy_file($access, $templateId, $fileName, $userFolderId);

    // 8) Share editor to user email
    drive_share_writer($access, $fileId, $email);

    // 9) Save mapping
    $ins = $conn->prepare("INSERT INTO user_workbooks (user_id, course_id, workbook_id, user_email, user_file_id) VALUES (?,?,?,?,?)");
    $ins->bind_param("sssss", $userId, $courseId, $workbookId, $email, $fileId);
    $ins->execute();
  }

  $editUrl  = "https://docs.google.com/spreadsheets/d/" . $fileId . "/edit";
  $embedUrl = $editUrl . "?rm=minimal";

  echo json_encode([
    "ok" => true,
    "file_id" => $fileId,
    "url" => $editUrl,
    "embed_url" => $embedUrl,
    "folder" => [
      "level" => $level,
      "course_title" => $courseTitle,
      "user_id" => $userId
    ]
  ], JSON_UNESCAPED_SLASHES);

} catch (Throwable $e) {
  json_fail(500, $e->getMessage());
}