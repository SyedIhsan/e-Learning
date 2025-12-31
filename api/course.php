<?php
declare(strict_types=1);

require __DIR__ . "/_bootstrap.php";

if (($_SERVER["REQUEST_METHOD"] ?? "") !== "GET") api_fail(405, "Method not allowed");

$id = trim((string)($_GET["id"] ?? ""));
if ($id === "") api_fail(400, "Missing id");

try {
  $stmt = $conn->prepare("SELECT id, level, title, description, price, duration, instructor, image, drive_folder_id
                          FROM courses WHERE id=? LIMIT 1");
  $stmt->bind_param("s", $id);
  $stmt->execute();
  $course = $stmt->get_result()->fetch_assoc();
  if (!$course) api_fail(404, "Course not found");

  $out = [
    "id" => (string)$course["id"],
    "level" => (string)$course["level"],
    "title" => (string)$course["title"],
    "description" => (string)$course["description"],
    "price" => (string)$course["price"],
    "duration" => (string)$course["duration"],
    "instructor" => (string)$course["instructor"],
    "image" => (string)$course["image"],
    "drive_folder_id" => (string)($course["drive_folder_id"] ?? ""),
    "content" => ["videos"=>[], "ebooks"=>[], "workbooks"=>[]],
  ];

  // videos
  $stmt = $conn->prepare("SELECT id, title, url, description FROM course_videos WHERE course_id=? ORDER BY id ASC");
  $stmt->bind_param("s", $id);
  $stmt->execute();
  $rs = $stmt->get_result();
  while ($r = $rs->fetch_assoc()) {
    $out["content"]["videos"][] = [
      "id" => (string)$r["id"],
      "title" => (string)($r["title"] ?? ""),
      "url" => (string)($r["url"] ?? ""),
      "description" => (string)($r["description"] ?? ""),
    ];
  }

  // ebooks
  $stmt = $conn->prepare("SELECT id, title, content FROM course_ebooks WHERE course_id=? ORDER BY id ASC");
  $stmt->bind_param("s", $id);
  $stmt->execute();
  $rs = $stmt->get_result();
  while ($r = $rs->fetch_assoc()) {
    $out["content"]["ebooks"][] = [
      "id" => (string)$r["id"],
      "title" => (string)($r["title"] ?? ""),
      "content" => (string)($r["content"] ?? ""),
    ];
  }

  // workbooks (detect optional columns)
  $hasTemplate = table_has_column($conn, "course_workbooks", "template_file_id");
  $hasContentId = table_has_column($conn, "course_workbooks", "content_id");

  $cols = "id, title, url";
  if ($hasTemplate) $cols .= ", template_file_id";
  if ($hasContentId) $cols .= ", content_id";

  $stmt = $conn->prepare("SELECT $cols FROM course_workbooks WHERE course_id=? ORDER BY id ASC");
  $stmt->bind_param("s", $id);
  $stmt->execute();
  $rs = $stmt->get_result();
  while ($r = $rs->fetch_assoc()) {
    $wbId = $hasContentId && !empty($r["content_id"]) ? (string)$r["content_id"] : (string)$r["id"];
    $wb = [
      "id" => $wbId,
      "db_id" => (string)$r["id"],
      "title" => (string)($r["title"] ?? ""),
      "url" => (string)($r["url"] ?? ""),
    ];
    if ($hasTemplate) $wb["template_file_id"] = (string)($r["template_file_id"] ?? "");
    if ($hasContentId) $wb["content_id"] = (string)($r["content_id"] ?? "");
    $out["content"]["workbooks"][] = $wb;
  }

  echo json_encode(["ok" => true, "course" => $out], JSON_UNESCAPED_SLASHES);
} catch (Throwable $e) {
  api_fail(500, $e->getMessage());
}
