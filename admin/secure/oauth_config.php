<?php
declare(strict_types=1);

/**
 * Isi lepas kau create OAuth Client (Web application) dalam Google Cloud.
 * REDIRECT_URI mesti EXACT match apa yang kau set kat Authorized redirect URIs.
 */

const GOOGLE_OAUTH_CLIENT_ID = "GOOGLE_CLIENT_ID";
const GOOGLE_OAUTH_CLIENT_SECRET = "GOOGLE_CLIENT_SECRET";

// Localhost example:
const GOOGLE_OAUTH_REDIRECT_URI = "GOOGLE_REDIRECT_URI";

const GOOGLE_OAUTH_SCOPES = [
  "https://www.googleapis.com/auth/drive",
];
?>