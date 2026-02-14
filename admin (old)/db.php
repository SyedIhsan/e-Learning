<?php
// e-Learning/admin/db.php (e-Learning DB only)

$servername = 'sgp42.siteground.asia';
$username   = 'ugqyxdzz6cljt';
$password   = '2)(Ak(<n@1c1';
$dbname     = 'dbyxrbeaeo77ih';

ini_set('display_errors', 0);
ini_set('log_errors', 1);
error_reporting(E_ALL);

mysqli_report(MYSQLI_REPORT_ERROR | MYSQLI_REPORT_STRICT);

try {
  $conn = new mysqli($servername, $username, $password, $dbname);
  $conn->set_charset('utf8mb4');

  // IMPORTANT: provide a dedicated variable for router usage
  $conn_elearning = $conn;

} catch (mysqli_sql_exception $e) {
  http_response_code(500);
  header('Content-Type: text/plain; charset=utf-8');
  exit('DB connection failed (e-Learning).');
}