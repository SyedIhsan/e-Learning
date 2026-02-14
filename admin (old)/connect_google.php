<?php
declare(strict_types=1);
require __DIR__ . "/auth.php";
require_once __DIR__ . "/lib/google_oauth.php";

redirect(google_build_auth_url());
?>