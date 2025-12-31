<?php
declare(strict_types=1);

require __DIR__ . "/_bootstrap.php";

if (($_SERVER["REQUEST_METHOD"] ?? "") !== "GET") api_fail(405, "Method not allowed");

header("Cache-Control: no-store, no-cache, must-revalidate, max-age=0");
header("Pragma: no-cache");

try {
  // --- courses ---
  $courses = [];
  $ids = [];

  $res = $conn->query("SELECT id, level, title, description, price, duration, instructor, image, drive_folder_id
                       FROM courses
                       ORDER BY FIELD(level,'Beginner','Intermediate','Advanced'), title ASC");

  while ($row = $res->fetch_assoc()) {
    $id = (string)$row["id"];
    $ids[] = $id;

    $courses[$id] = [
      "id" => $id,
      "level" => (string)($row["level"] ?? ""),
      "title" => (string)($row["title"] ?? ""),
      "description" => (string)($row["description"] ?? ""),
      "price" => (string)($row["price"] ?? ""),
      "duration" => (string)($row["duration"] ?? ""),
      "instructor" => (string)($row["instructor"] ?? ""),
      "image" => (string)($row["image"] ?? ""),
      "drive_folder_id" => (string)($row["drive_folder_id"] ?? ""),
      "content" => [
        "videos" => [],
        "ebooks" => [],
        "workbooks" => [],
      ],
    ];
  }

  if (!$ids) {
    echo json_encode(["ok" => true, "courses" => new stdClass()], JSON_UNESCAPED_SLASHES);
    exit;
  }

  // Build "IN (...)" safely
  $placeholders = implode(",", array_fill(0, count($ids), "?"));
  $types = str_repeat("s", count($ids));

  // --- videos ---
  $sql = "SELECT id, course_id, title, url, description
          FROM course_videos
          WHERE course_id IN ($placeholders)
          ORDER BY id ASC";
  $stmt = $conn->prepare($sql);
  stmt_bind_params($stmt, $types, $ids);
  $stmt->execute();
  $rs = $stmt->get_result();
  while ($r = $rs->fetch_assoc()) {
    $cid = (string)$r["course_id"];
    if (!isset($courses[$cid])) continue;
    $courses[$cid]["content"]["videos"][] = [
      "id" => (string)$r["id"],
      "title" => (string)($r["title"] ?? ""),
      "url" => (string)($r["url"] ?? ""),
      "description" => (string)($r["description"] ?? ""),
    ];
  }

  // --- ebooks ---
  $sql = "SELECT id, course_id, title, content
          FROM course_ebooks
          WHERE course_id IN ($placeholders)
          ORDER BY id ASC";
  $stmt = $conn->prepare($sql);
  stmt_bind_params($stmt, $types, $ids);
  $stmt->execute();
  $rs = $stmt->get_result();
  while ($r = $rs->fetch_assoc()) {
    $cid = (string)$r["course_id"];
    if (!isset($courses[$cid])) continue;
    $courses[$cid]["content"]["ebooks"][] = [
      "id" => (string)$r["id"],
      "title" => (string)($r["title"] ?? ""),
      "content" => (string)($r["content"] ?? ""),
    ];
  }

  // --- workbooks ---
  $hasTemplate = table_has_column($conn, "course_workbooks", "template_file_id");
  $hasContentId = table_has_column($conn, "course_workbooks", "content_id");

  $cols = "id, course_id, title, url";
  if ($hasTemplate) $cols .= ", template_file_id";
  if ($hasContentId) $cols .= ", content_id";

  $sql = "SELECT $cols
          FROM course_workbooks
          WHERE course_id IN ($placeholders)
          ORDER BY id ASC";
  $stmt = $conn->prepare($sql);
  stmt_bind_params($stmt, $types, $ids);
  $stmt->execute();
  $rs = $stmt->get_result();
  while ($r = $rs->fetch_assoc()) {
    $cid = (string)$r["course_id"];
    if (!isset($courses[$cid])) continue;

    $wbId = $hasContentId && !empty($r["content_id"]) ? (string)$r["content_id"] : (string)$r["id"];

    $wb = [
      "id" => $wbId,
      "db_id" => (string)$r["id"],
      "title" => (string)($r["title"] ?? ""),
      "url" => (string)($r["url"] ?? ""),
    ];
    if ($hasTemplate) $wb["template_file_id"] = (string)($r["template_file_id"] ?? "");
    if ($hasContentId) $wb["content_id"] = (string)($r["content_id"] ?? "");

    $courses[$cid]["content"]["workbooks"][] = $wb;
  }

  echo json_encode(["ok" => true, "courses" => $courses], JSON_UNESCAPED_SLASHES);

} catch (Throwable $e) {
  api_fail(500, $e->getMessage());
}
