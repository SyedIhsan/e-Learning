<?php
declare(strict_types=1);
require __DIR__ . "/auth.php";

$title = "Student Progress";

$q = trim((string)($_GET["q"] ?? ""));
$export = (string)($_GET["export"] ?? "") === "1";

function table_exists(mysqli $conn, string $name): bool {
  $sql = "SELECT 1
          FROM information_schema.tables
          WHERE table_schema = DATABASE()
            AND table_name = ?
          LIMIT 1";
  $stmt = $conn->prepare($sql);
  if (!$stmt) return false;
  $stmt->bind_param("s", $name);
  $stmt->execute();
  $stmt->store_result();
  $ok = $stmt->num_rows > 0;
  $stmt->close();
  return $ok;
}

function column_exists(mysqli $conn, string $table, string $col): bool {
  $sql = "SELECT 1
          FROM information_schema.columns
          WHERE table_schema = DATABASE()
            AND table_name = ?
            AND column_name = ?
          LIMIT 1";
  $stmt = $conn->prepare($sql);
  if (!$stmt) return false;
  $stmt->bind_param("ss", $table, $col);
  $stmt->execute();
  $stmt->store_result();
  $ok = $stmt->num_rows > 0;
  $stmt->close();
  return $ok;
}

function bind_params(mysqli_stmt $stmt, string $types, array $params): void {
  $refs = [];
  $refs[] = &$types;
  foreach ($params as $k => $v) {
    $refs[] = &$params[$k];
  }
  call_user_func_array([$stmt, "bind_param"], $refs);
}

function time_ago(?string $dt): string {
  if (!$dt) return "—";
  $ts = strtotime($dt);
  if (!$ts) return "—";
  $diff = time() - $ts;
  if ($diff < 60) return "just now";
  if ($diff < 3600) return floor($diff / 60) . " mins ago";
  if ($diff < 86400) return floor($diff / 3600) . " hours ago";
  if ($diff < 2592000) return floor($diff / 86400) . " days ago";
  return date("Y-m-d", $ts);
}

function pct(int $done, int $total): int {
  if ($total <= 0) return 0;
  $p = (int)round(($done / $total) * 100);
  if ($p < 0) return 0;
  if ($p > 100) return 100;
  return $p;
}

/** detect Payment table name */
$paymentTable = null;
if (table_exists($conn, "Payment")) $paymentTable = "Payment";
else if (table_exists($conn, "payment")) $paymentTable = "payment";

$students = [];
$workbooksByCourse = [];
$stats = [
  "active_learners" => 0,
  "avg_completion"  => 0,
  "revenue"         => 0.0,
];

if ($paymentTable) {
  $hasVerified = column_exists($conn, $paymentTable, "verified");
  $hasSid = column_exists($conn, $paymentTable, "sid");
  $hasAccessId = table_exists($conn, "user") && column_exists($conn, "user", "access_id");

  $verWhere = $hasVerified ? " AND verified = 1 " : "";

  $hasUserProgress = table_exists($conn, "user_progress");
  $upTsCol = null;
  if ($hasUserProgress) {
    if (column_exists($conn, "user_progress", "updated_at")) $upTsCol = "updated_at";
    else if (column_exists($conn, "user_progress", "created_at")) $upTsCol = "created_at";
  }

  // progress subquery (optional)
  $upSelect = "0 AS v_done, 0 AS e_done, 0 AS w_done, NULL AS last_ts";
  $upJoin = "";
  if ($hasUserProgress) {
    $tsExpr = $upTsCol ? "MAX($upTsCol)" : "NULL";
    $upSelect = "COALESCE(up.v_done,0) AS v_done, COALESCE(up.e_done,0) AS e_done, COALESCE(up.w_done,0) AS w_done, up.last_ts";
    $upJoin = "
      LEFT JOIN (
        SELECT
          user_id,
          course_id,
          SUM(CASE WHEN completed=1 AND content_type='video' THEN 1 ELSE 0 END) AS v_done,
          SUM(CASE WHEN completed=1 AND content_type='ebook' THEN 1 ELSE 0 END) AS e_done,
          SUM(CASE WHEN completed=1 AND content_type='workbook' THEN 1 ELSE 0 END) AS w_done,
          $tsExpr AS last_ts
        FROM user_progress
        GROUP BY user_id, course_id
      ) up ON up.user_id = u.id AND up.course_id = p.item
    ";
  }

  // latest payment per user (prefer sid if exists)
  $joinLatestSid = "";
  $pidExpr = "pe.pid";
  if ($hasSid && $hasAccessId) {
    $joinLatestSid = "
      LEFT JOIN (
        SELECT sid, MAX(id) AS pid
        FROM `$paymentTable`
        WHERE sid IS NOT NULL AND sid <> '' $verWhere
        GROUP BY sid
      ) ps ON ps.sid = u.access_id
    ";
    $pidExpr = "COALESCE(ps.pid, pe.pid)";
  }

  $sql = "
    SELECT
      u.id AS user_id,
      COALESCE(NULLIF(u.access_id,''), CONCAT('USER-', u.id)) AS student_id,
      u.name,
      u.email,

      p.item AS course_id,
      p.created_at AS enrolled_at,
      p.price AS paid_price,

      c.title AS course_title,
      c.level AS course_level,

      COALESCE(cv.total_videos, 0) AS total_videos,
      COALESCE(ce.total_ebooks, 0) AS total_ebooks,
      COALESCE(cw.total_workbooks, 0) AS total_workbooks,

      $upSelect
    FROM `user` u

    $joinLatestSid

    LEFT JOIN (
      SELECT LOWER(TRIM(email)) AS em, MAX(id) AS pid
      FROM `$paymentTable`
      WHERE email IS NOT NULL AND email <> '' $verWhere
      GROUP BY em
    ) pe ON pe.em = LOWER(TRIM(u.email))

    JOIN `$paymentTable` p ON p.id = $pidExpr

    LEFT JOIN courses c ON c.id = p.item

    LEFT JOIN (
      SELECT course_id, COUNT(*) AS total_videos
      FROM course_videos
      GROUP BY course_id
    ) cv ON cv.course_id = p.item

    LEFT JOIN (
      SELECT course_id, COUNT(*) AS total_ebooks
      FROM course_ebooks
      GROUP BY course_id
    ) ce ON ce.course_id = p.item

    LEFT JOIN (
      SELECT course_id, COUNT(*) AS total_workbooks
      FROM course_workbooks
      GROUP BY course_id
    ) cw ON cw.course_id = p.item

    $upJoin

    WHERE 1=1
  ";

  $params = [];
  $types = "";

  if ($q !== "") {
    $like = "%" . $q . "%";
    $sql .= " AND (u.name LIKE ? OR u.email LIKE ? ";
    $params[] = $like; $types .= "s";
    $params[] = $like; $types .= "s";

    if ($hasAccessId) {
      $sql .= " OR u.access_id LIKE ? ";
      $params[] = $like; $types .= "s";
    }
    $sql .= ") ";
  }

  $sql .= " ORDER BY p.created_at DESC LIMIT 200 ";

  $stmt = $conn->prepare($sql);
  if ($stmt) {
    if ($types !== "") bind_params($stmt, $types, $params);
    $stmt->execute();
    $res = $stmt->get_result();
    if ($res instanceof mysqli_result) {
      while ($row = $res->fetch_assoc()) {
        $row["videos_pct"] = pct((int)$row["v_done"], (int)$row["total_videos"]);
        $row["ebooks_pct"] = pct((int)$row["e_done"], (int)$row["total_ebooks"]);
        $row["workbooks_pct"] = pct((int)$row["w_done"], (int)$row["total_workbooks"]);

        $last = $row["last_ts"] ?: $row["enrolled_at"];
        $row["last_human"] = time_ago($last);

        $students[] = $row;
      }
    }
    $stmt->close();
  }

  // Workbooks monitor (fetch only for displayed courses)
  $courseIds = [];
  foreach ($students as $s) $courseIds[] = (string)$s["course_id"];
  $courseIds = array_values(array_unique(array_filter($courseIds)));

  if (count($courseIds) > 0 && table_exists($conn, "course_workbooks")) {
    $in = implode(",", array_fill(0, count($courseIds), "?"));
    $stmtW = $conn->prepare("SELECT course_id, id, title, url FROM course_workbooks WHERE course_id IN ($in) ORDER BY course_id, id ASC");
    if ($stmtW) {
      $t = str_repeat("s", count($courseIds));
      bind_params($stmtW, $t, $courseIds);
      $stmtW->execute();
      $resW = $stmtW->get_result();
      if ($resW instanceof mysqli_result) {
        while ($wb = $resW->fetch_assoc()) {
          $cid = (string)$wb["course_id"];
          if (!isset($workbooksByCourse[$cid])) $workbooksByCourse[$cid] = [];
          $workbooksByCourse[$cid][] = $wb;
        }
      }
      $stmtW->close();
    }
  }

  // Stats (based on displayed list)
  $stats["active_learners"] = count($students);

  $sumDone = 0; $sumTotal = 0; $sumRevenue = 0.0;
  foreach ($students as $s) {
    $done = (int)$s["v_done"] + (int)$s["e_done"] + (int)$s["w_done"];
    $total = (int)$s["total_videos"] + (int)$s["total_ebooks"] + (int)$s["total_workbooks"];
    $sumDone += $done;
    $sumTotal += $total;
    $sumRevenue += (float)($s["paid_price"] ?? 0);
  }
  $stats["avg_completion"] = $sumTotal > 0 ? (int)round(($sumDone / $sumTotal) * 100) : 0;
  $stats["revenue"] = $sumRevenue;

  // Export CSV
  if ($export) {
    header("Content-Type: text/csv; charset=utf-8");
    header("Content-Disposition: attachment; filename=student_progress.csv");
    $out = fopen("php://output", "w");
    fputcsv($out, ["student_id","name","email","course_id","course_title","course_level","videos_pct","ebooks_pct","workbooks_pct","last_activity"]);
    foreach ($students as $s) {
      fputcsv($out, [
        (string)$s["student_id"],
        (string)($s["name"] ?? ""),
        (string)($s["email"] ?? ""),
        (string)($s["course_id"] ?? ""),
        (string)($s["course_title"] ?? ""),
        (string)($s["course_level"] ?? ""),
        (int)$s["videos_pct"],
        (int)$s["ebooks_pct"],
        (int)$s["workbooks_pct"],
        (string)($s["last_ts"] ?: $s["enrolled_at"] ?: ""),
      ]);
    }
    fclose($out);
    exit;
  }
}

include __DIR__ . "/partials/header.php";
include __DIR__ . "/partials/nav.php";
?>

<div class="bg-slate-50 min-h-screen py-12">
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

    <header class="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
      <div>
        <h1 class="text-4xl font-black text-slate-900 mb-2">Student Progress Monitoring</h1>
        <p class="text-slate-500 font-medium">Track student progress, monitor activity, and export reports to CSV.</p>
      </div>

      <form method="get" class="relative w-full md:w-auto">
        <input
          name="q"
          value="<?= e($q) ?>"
          type="text"
          placeholder="Search Student ID or Name..."
          class="pl-12 pr-6 py-3 bg-white border border-slate-200 rounded-2xl focus:ring-2 focus:ring-amber-500 w-full md:w-80 transition-all outline-none text-sm shadow-sm"
        />
        <svg class="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </form>
    </header>

    <?php if (!$paymentTable): ?>
      <div class="bg-white rounded-3xl p-10 border border-slate-100 shadow-xl text-slate-700">
        Payment table not found. Expected <code>Payment</code> or <code>payment</code>.
      </div>
      <?php include __DIR__ . "/partials/footer.php"; exit; ?>
    <?php endif; ?>

    <div class="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl overflow-hidden">
      <div class="p-8 border-b border-slate-50 flex items-center justify-between">
        <h2 class="text-xl font-black text-slate-900">Progress Overview</h2>
        <a href="?export=1&q=<?= urlencode($q) ?>" class="text-xs font-black text-amber-600 uppercase tracking-widest hover:text-amber-700 transition-colors">Export CSV</a>
      </div>

      <div class="overflow-x-auto">
        <table class="w-full text-left">
          <thead>
            <tr class="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest">
              <th class="px-8 py-4">Student Details</th>
              <th class="px-8 py-4">Enrolled Course</th>
              <th class="px-8 py-4">Progress Matrix</th>
              <th class="px-8 py-4">Workbooks Monitor</th>
              <th class="px-8 py-4">Last Activity</th>
            </tr>
          </thead>

          <tbody class="divide-y divide-slate-50">
            <?php foreach ($students as $s): ?>
              <?php
                $courseId = (string)($s["course_id"] ?? "");
                $wbs = $workbooksByCourse[$courseId] ?? [];
                $wbsShow = array_slice($wbs, 0, 3);
              ?>
              <tr class="hover:bg-slate-50/50 transition-colors align-top">
                <td class="px-8 py-6">
                  <div class="flex items-center space-x-4">
                    <div class="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-500">
                      <?= e(mb_substr((string)($s["name"] ?? "U"), 0, 1)) ?>
                    </div>
                    <div class="min-w-0">
                      <div class="text-sm font-black text-slate-900"><?= e((string)($s["name"] ?? "")) ?></div>
                      <div class="text-[10px] font-bold text-slate-400"><?= e((string)($s["student_id"] ?? "")) ?></div>
                    </div>
                  </div>
                </td>

                <td class="px-8 py-6">
                  <div class="text-xs font-bold text-slate-700"><?= e((string)($s["course_title"] ?: $courseId ?: "Unknown")) ?></div>
                  <?php if (!empty($s["course_level"])): ?>
                    <div class="text-[9px] font-black text-indigo-500 uppercase"><?= e((string)$s["course_level"]) ?></div>
                  <?php endif; ?>
                </td>

                <td class="px-8 py-6">
                  <div class="space-y-3 w-48">
                    <div>
                      <div class="flex justify-between text-[8px] font-black uppercase mb-1">
                        <span class="text-indigo-500">Videos</span><span><?= (int)$s["videos_pct"] ?>%</span>
                      </div>
                      <div class="h-1 w-full bg-slate-100 rounded-full overflow-hidden">
                        <div class="h-full bg-indigo-500" style="width: <?= (int)$s["videos_pct"] ?>%"></div>
                      </div>
                    </div>
                    <div>
                      <div class="flex justify-between text-[8px] font-black uppercase mb-1">
                        <span class="text-emerald-500">E-books</span><span><?= (int)$s["ebooks_pct"] ?>%</span>
                      </div>
                      <div class="h-1 w-full bg-slate-100 rounded-full overflow-hidden">
                        <div class="h-full bg-emerald-500" style="width: <?= (int)$s["ebooks_pct"] ?>%"></div>
                      </div>
                    </div>
                    <div>
                      <div class="flex justify-between text-[8px] font-black uppercase mb-1">
                        <span class="text-amber-500">Workbook</span><span><?= (int)$s["workbooks_pct"] ?>%</span>
                      </div>
                      <div class="h-1 w-full bg-slate-100 rounded-full overflow-hidden">
                        <div class="h-full bg-amber-500" style="width: <?= (int)$s["workbooks_pct"] ?>%"></div>
                      </div>
                    </div>
                  </div>
                </td>

                <td class="px-8 py-6">
                  <div class="flex flex-col gap-2">
                    <?php if (!$wbs): ?>
                      <span class="text-[10px] text-slate-400 font-bold italic">No workbooks</span>
                    <?php else: ?>
                      <?php foreach ($wbsShow as $wb): ?>
                        <a
                          href="<?= e((string)$wb["url"]) ?>"
                          target="_blank"
                          rel="noopener noreferrer"
                          class="group inline-flex items-center justify-between px-3 py-2 bg-slate-50 border border-slate-100 text-slate-700 rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-slate-900 hover:text-white transition-all w-full"
                        >
                          <span class="truncate max-w-[160px]"><?= e((string)$wb["title"]) ?></span>
                          <svg class="w-3 h-3 text-slate-400 group-hover:text-amber-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                        </a>
                      <?php endforeach; ?>

                      <?php if (count($wbs) > 3): ?>
                        <span class="text-[10px] text-slate-400 font-bold">+<?= count($wbs) - 3 ?> more</span>
                      <?php endif; ?>
                    <?php endif; ?>
                  </div>
                </td>

                <td class="px-8 py-6">
                  <div class="text-[10px] font-black text-slate-400 uppercase tracking-tighter">
                    <?= e((string)$s["last_human"]) ?>
                  </div>
                </td>
              </tr>
            <?php endforeach; ?>

            <?php if (count($students) === 0): ?>
              <tr><td colspan="5" class="p-16 text-center text-slate-400 font-bold">No students found.</td></tr>
            <?php endif; ?>
          </tbody>
        </table>
      </div>
    </div>

  </div>
</div>

<?php include __DIR__ . "/partials/footer.php"; ?>