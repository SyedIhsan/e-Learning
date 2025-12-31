<?php
declare(strict_types=1);

header("Content-Type: application/json; charset=utf-8");

// Reuse the same DB connection as admin (read-only endpoint)
require __DIR__ . "/../admin/db.php";

function json_fail(int $code, string $msg): never {
  http_response_code($code);
  echo json_encode(["ok" => false, "error" => $msg], JSON_UNESCAPED_SLASHES);
  exit;
}

function has_column(mysqli $conn, string $table, string $col): bool {
  $t = $conn->real_escape_string($table);
  $c = $conn->real_escape_string($col);
  $res = $conn->query("SHOW COLUMNS FROM `{$t}` LIKE '{$c}'");
  return $res && $res->num_rows > 0;
}

try {
  $hasDriveFolder = has_column($conn, "courses", "drive_folder_id");
  $hasModules = has_column($conn, "courses", "modules_json");

  $coursesSql = "SELECT id, level, title, description, price, duration, instructor, image"
    . ($hasDriveFolder ? ", drive_folder_id" : "")
    . ($hasModules ? ", modules_json" : "")
    . " FROM courses ORDER BY created_at DESC";

  $courseRows = $conn->query($coursesSql)->fetch_all(MYSQLI_ASSOC);

  // Preload content tables
  $videoRows = $conn->query("SELECT id, course_id, title, url, description FROM course_videos ORDER BY id ASC")
    ->fetch_all(MYSQLI_ASSOC);

  $ebookRows = $conn->query("SELECT id, course_id, title, content FROM course_ebooks ORDER BY id ASC")
    ->fetch_all(MYSQLI_ASSOC);

  $hasWbContentId = has_column($conn, "course_workbooks", "content_id");
  $hasTemplateId = has_column($conn, "course_workbooks", "template_file_id");

  $wbSql = "SELECT id, course_id, title"
    . ($hasWbContentId ? ", content_id" : "")
    . ", url"
    . ($hasTemplateId ? ", template_file_id" : "")
    . " FROM course_workbooks ORDER BY id ASC";

  $workbookRows = $conn->query($wbSql)->fetch_all(MYSQLI_ASSOC);

  // Group content by course
  $videosBy = [];
  foreach ($videoRows as $r) {
    $cid = (string)$r["course_id"];
    $videosBy[$cid][] = [
      "id" => $cid . "-v" . (string)$r["id"],
      "title" => (string)$r["title"],
      "url" => (string)$r["url"],
      "description" => (string)($r["description"] ?? ""),
    ];
  }

  $ebooksBy = [];
  foreach ($ebookRows as $r) {
    $cid = (string)$r["course_id"];
    $ebooksBy[$cid][] = [
      "id" => $cid . "-e" . (string)$r["id"],
      "title" => (string)$r["title"],
      "content" => (string)$r["content"],
    ];
  }

  $wbsBy = [];
  foreach ($workbookRows as $r) {
    $cid = (string)$r["course_id"];
    $wbId = "";
    if ($hasWbContentId) $wbId = (string)($r["content_id"] ?? "");
    if ($wbId === "") $wbId = $cid . "-w" . (string)$r["id"];

    $wbsBy[$cid][] = [
      "id" => $wbId,
      "title" => (string)$r["title"],
      "url" => (string)($r["url"] ?? ""),
      // keep template_file_id for admin / debugging (optional)
      "template_file_id" => $hasTemplateId ? (string)($r["template_file_id"] ?? "") : "",
    ];
  }

  // Build final map
  $courses = [];
  foreach ($courseRows as $c) {
    $id = (string)$c["id"];
    $modules = [];
    if ($hasModules && !empty($c["modules_json"])) {
      $decoded = json_decode((string)$c["modules_json"], true);
      if (is_array($decoded)) $modules = $decoded;
    }

    $courses[$id] = [
      "id" => $id,
      "level" => (string)$c["level"],
      "title" => (string)$c["title"],
      "description" => (string)$c["description"],
      "price" => (string)$c["price"],
      "duration" => (string)$c["duration"],
      "modules" => $modules, // keep array for UI compatibility
      "instructor" => (string)$c["instructor"],
      "image" => (string)$c["image"],
      "content" => [
        "videos" => $videosBy[$id] ?? [],
        "workbooks" => $wbsBy[$id] ?? [],
        "ebooks" => $ebooksBy[$id] ?? [],
      ],
    ];

    if ($hasDriveFolder) {
      $courses[$id]["drive_folder_id"] = (string)($c["drive_folder_id"] ?? "");
    }
  }

  echo json_encode([
    "ok" => true,
    "generated_at" => gmdate("c"),
    "courses" => $courses,
  ], JSON_UNESCAPED_SLASHES);

} catch (Throwable $e) {
  json_fail(500, $e->getMessage());
}
