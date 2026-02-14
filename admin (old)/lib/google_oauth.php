<?php
declare(strict_types=1);

require_once __DIR__ . "/../bootstrap.php";
require_once __DIR__ . "/../secure/oauth_config.php";

function google_build_auth_url(): string {
  $state = bin2hex(random_bytes(16));
  $_SESSION["google_oauth_state"] = $state;

  $params = [
    "client_id" => GOOGLE_OAUTH_CLIENT_ID,
    "redirect_uri" => GOOGLE_OAUTH_REDIRECT_URI,
    "response_type" => "code",
    "scope" => implode(" ", GOOGLE_OAUTH_SCOPES),
    "access_type" => "offline",
    "prompt" => "consent",
    "include_granted_scopes" => "true",
    "state" => $state,
  ];

  return "https://accounts.google.com/o/oauth2/v2/auth?" . http_build_query($params);
}

function google_exchange_code_for_tokens(string $code): array {
  $post = http_build_query([
    "code" => $code,
    "client_id" => GOOGLE_OAUTH_CLIENT_ID,
    "client_secret" => GOOGLE_OAUTH_CLIENT_SECRET,
    "redirect_uri" => GOOGLE_OAUTH_REDIRECT_URI,
    "grant_type" => "authorization_code",
  ]);

  $ch = curl_init("https://oauth2.googleapis.com/token");
  curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_POST => true,
    CURLOPT_HTTPHEADER => ["Content-Type: application/x-www-form-urlencoded"],
    CURLOPT_POSTFIELDS => $post,
  ]);
  $res = curl_exec($ch);
  if ($res === false) throw new Exception("Curl error: " . curl_error($ch));
  $json = json_decode($res, true);
  if (!is_array($json) || empty($json["access_token"])) {
    throw new Exception("Token exchange failed: " . $res);
  }
  return $json;
}

function google_access_token_from_refresh(string $refreshToken): array {
  $post = http_build_query([
    "client_id" => GOOGLE_OAUTH_CLIENT_ID,
    "client_secret" => GOOGLE_OAUTH_CLIENT_SECRET,
    "refresh_token" => $refreshToken,
    "grant_type" => "refresh_token",
  ]);

  $ch = curl_init("https://oauth2.googleapis.com/token");
  curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_POST => true,
    CURLOPT_HTTPHEADER => ["Content-Type: application/x-www-form-urlencoded"],
    CURLOPT_POSTFIELDS => $post,
  ]);
  $res = curl_exec($ch);
  if ($res === false) throw new Exception("Curl error: " . curl_error($ch));
  $json = json_decode($res, true);
  if (!is_array($json) || empty($json["access_token"])) {
    throw new Exception("Refresh failed: " . $res);
  }
  return $json;
}

function google_revoke_token(string $token): void {
  $post = http_build_query(["token" => $token]);
  $ch = curl_init("https://oauth2.googleapis.com/revoke");
  curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_POST => true,
    CURLOPT_HTTPHEADER => ["Content-Type: application/x-www-form-urlencoded"],
    CURLOPT_POSTFIELDS => $post,
  ]);
  $res = curl_exec($ch);
  if ($res === false) throw new Exception("Curl error: " . curl_error($ch));
}

/** DB store helpers */
function google_token_get_refresh(): ?string {
  global $conn;
  $stmt = $conn->prepare("SELECT refresh_token FROM google_oauth_tokens WHERE id=1 AND provider='google' LIMIT 1");
  $stmt->execute();
  $row = $stmt->get_result()->fetch_assoc();
  return $row ? (string)$row["refresh_token"] : null;
}

function google_token_save_refresh(string $refreshToken, ?string $scopes = null): void {
  global $conn;
  $stmt = $conn->prepare("INSERT INTO google_oauth_tokens (id, provider, refresh_token, scopes, updated_at)
                          VALUES (1,'google',?,?,NOW())
                          ON DUPLICATE KEY UPDATE refresh_token=VALUES(refresh_token), scopes=VALUES(scopes), updated_at=NOW()");
  $stmt->bind_param("ss", $refreshToken, $scopes);
  $stmt->execute();
}

function google_token_delete(): void {
  global $conn;
  $conn->query("DELETE FROM google_oauth_tokens WHERE id=1 AND provider='google'");
}
?>