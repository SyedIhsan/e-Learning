<?php
declare(strict_types=1);

/**
 * Isi lepas kau create OAuth Client (Web application) dalam Google Cloud.
 * REDIRECT_URI mesti EXACT match apa yang kau set kat Authorized redirect URIs.
 */

const GOOGLE_OAUTH_CLIENT_ID = "675153135318-p0h7s3gbmekau035s34am63uqk8b1pf5.apps.googleusercontent.com";
const GOOGLE_OAUTH_CLIENT_SECRET = "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";

// Localhost example:
const GOOGLE_OAUTH_REDIRECT_URI = "https://sdc.cx/e-Learning/admin/oauth_callback.php";

// Kalau production, tukar jadi contoh:
// const GOOGLE_OAUTH_REDIRECT_URI = "https://sdc.cx/e-Learning/admin/oauth_callback.php";

const GOOGLE_OAUTH_SCOPES = [
  "https://www.googleapis.com/auth/drive",
];
?>