<?php
declare(strict_types=1);

/**
 * SiteGround DB credentials:
 * - DB_HOST: usually "localhost"
 * - DB_NAME, DB_USER, DB_PASS: from Site Tools > MySQL > Databases/Users
 *
 * Tip: keep this file not world-readable if possible.
 */

mysqli_report(MYSQLI_REPORT_ERROR | MYSQLI_REPORT_STRICT);

$DB_HOST = "localhost";
$DB_NAME = "sdc_elearning";
$DB_USER = "root";
$DB_PASS = "";

$conn = new mysqli($DB_HOST, $DB_USER, $DB_PASS, $DB_NAME);
$conn->set_charset("utf8mb4");
