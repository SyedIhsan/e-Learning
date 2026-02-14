<?php
declare(strict_types=1);

/**
 * Minimal Google Drive API v3 helpers (Shared Drive compatible)
 * Requires: PHP cURL extension enabled
 */

function drive_api_request(string $method, string $url, string $accessToken, ?array $jsonBody = null): array {
  $ch = curl_init($url);
  if ($ch === false) throw new Exception("curl_init failed");

  $headers = [
    "Authorization: Bearer {$accessToken}",
    "Accept: application/json",
  ];

  if ($jsonBody !== null) {
    $headers[] = "Content-Type: application/json; charset=utf-8";
  }

  curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_CUSTOMREQUEST  => $method,
    CURLOPT_HTTPHEADER     => $headers,
    CURLOPT_TIMEOUT        => 30,
  ]);

  if ($jsonBody !== null) {
    $payload = json_encode($jsonBody, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
    if ($payload === false) throw new Exception("json_encode failed");
    curl_setopt($ch, CURLOPT_POSTFIELDS, $payload);
  }

  $raw = curl_exec($ch);
  if ($raw === false) {
    $err = curl_error($ch);
    curl_close($ch);
    throw new Exception("cURL error: " . $err);
  }

  $http = (int)curl_getinfo($ch, CURLINFO_HTTP_CODE);
  curl_close($ch);

  // Some Drive endpoints can return empty body on success.
  $data = [];
  if (trim($raw) !== "") {
    $decoded = json_decode($raw, true);
    if (is_array($decoded)) $data = $decoded;
  }

  if ($http >= 400) {
    $msg = "Drive API HTTP {$http}";
    // Best-effort error message from Google
    if (isset($data["error"]["message"])) $msg .= " - " . (string)$data["error"]["message"];
    elseif (isset($data["error_description"])) $msg .= " - " . (string)$data["error_description"];
    else $msg .= " - " . substr($raw, 0, 300);

    throw new Exception($msg);
  }

  return $data;
}

/**
 * Create folder under parent folder (Shared Drive safe)
 */
function drive_create_folder(string $accessToken, string $folderName, string $parentFolderId): string {
  $url = "https://www.googleapis.com/drive/v3/files?supportsAllDrives=true&fields=id";
  $res = drive_api_request("POST", $url, $accessToken, [
    "name" => $folderName,
    "mimeType" => "application/vnd.google-apps.folder",
    "parents" => [$parentFolderId],
  ]);

  if (empty($res["id"])) throw new Exception("Create folder failed (no id).");
  return (string)$res["id"];
}

/**
 * Copy a file into destination folder
 * Works for Google Sheets templates too.
 */
function drive_copy_file(string $accessToken, string $sourceFileId, string $newName, string $destFolderId): string {
  $url = "https://www.googleapis.com/drive/v3/files/" . rawurlencode($sourceFileId)
       . "/copy?supportsAllDrives=true&fields=id";

  $res = drive_api_request("POST", $url, $accessToken, [
    "name" => $newName,
    "parents" => [$destFolderId],
  ]);

  if (empty($res["id"])) throw new Exception("Copy failed (no id).");
  return (string)$res["id"];
}

/**
 * Share file to a user email as writer (editor)
 * sendNotificationEmail=false => tak spam user
 */
function drive_share_writer(string $accessToken, string $fileId, string $email): void {
  $url = "https://www.googleapis.com/drive/v3/files/" . rawurlencode($fileId)
       . "/permissions?supportsAllDrives=true&sendNotificationEmail=false";

  drive_api_request("POST", $url, $accessToken, [
    "type" => "user",
    "role" => "writer",
    "emailAddress" => $email,
  ]);
}