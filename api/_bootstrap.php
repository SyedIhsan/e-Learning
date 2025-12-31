<?php
declare(strict_types=1);

header("Content-Type: application/json; charset=utf-8");

// Reuse the same DB config as admin
require __DIR__ . "/../admin/db.php";

function api_fail(int $code, string $msg): never {
  http_response_code($code);
  echo json_encode(["ok" => false, "error" => $msg], JSON_UNESCAPED_SLASHES);
  exit;
}

function table_has_column(mysqli $conn, string $table, string $col): bool {
  // MariaDB can be picky with prepared SHOW statements, so use INFORMATION_SCHEMA instead.
  $sql = "SELECT 1
          FROM INFORMATION_SCHEMA.COLUMNS
          WHERE TABLE_SCHEMA = DATABASE()
            AND TABLE_NAME = ?
            AND COLUMN_NAME = ?
          LIMIT 1";
  $stmt = $conn->prepare($sql);
  $stmt->bind_param("ss", $table, $col);
  $stmt->execute();
  $r = $stmt->get_result();
  return $r && $r->num_rows > 0;
}

/**
 * mysqli bind_param needs references; this helper binds an array safely.
 */
function stmt_bind_params(mysqli_stmt $stmt, string $types, array $params): void {
  $params = array_values($params);
  $bind = [];
  $bind[] = $types;
  for ($i = 0; $i < count($params); $i++) {
    $bind[] = &$params[$i];
  }
  call_user_func_array([$stmt, "bind_param"], $bind);
}

function string_id($v): string {
  return (string)$v;
}
