(function () {
  const KEY = "sdc_google_refresh_demo_v1";
  const $ = (sel, root = document) => root.querySelector(sel);

  const params = new URLSearchParams(location.search);
  const msg = (params.get("msg") || "").trim();

  function ui_msg(m) {
    switch (m) {
      case "connected":
        return ["ok", "Connected! Refresh token saved."];
      case "connected_already":
        return ["ok", "Already connected (token exists)."];
      case "no_refresh":
        return ["warn", "Google does not provide refresh_token. Click Connect again. If still the same, Disconnect and reconnect."];
      case "bad_state":
        return ["err", "State mismatch (security). Try connect again."];
      case "missing_code":
        return ["err", "Missing code. Try connect again."];
      case "failed":
        return ["err", "OAuth failed. Check Client ID/Secret/Redirect URI."];
      case "error":
        return ["err", "OAuth denied/cancelled."];
      case "disconnected":
        return ["ok", "Disconnected. Token deleted."];
      default:
        return ["", ""];
    }
  }

  const setConnected = (v) => localStorage.setItem(KEY, v ? "1" : "0");
  const isConnected = () => localStorage.getItem(KEY) === "1";

  // Simulate server redirect effects (so UI behaves like google.php)
  if (msg === "connected" || msg === "connected_already") setConnected(true);
  if (msg === "disconnected") setConnected(false);

  function render() {
    const refresh = isConnected();

    // Status blocks
    const yes = $("#googleStatusConnected");
    const no = $("#googleStatusNotConnected");
    if (yes) yes.classList.toggle("hidden", !refresh);
    if (no) no.classList.toggle("hidden", refresh);

    // Disconnect button only when connected
    const disForm = $("#googleDisconnectForm");
    if (disForm) disForm.classList.toggle("hidden", !refresh);

    // ✅ NEW: Disable Connect when already connected
    const connectBtn = $("#googleConnectBtn") || document.querySelector('[data-action="google-connect"]');
    if (connectBtn) {
      if (refresh) {
        connectBtn.setAttribute("aria-disabled", "true");
        connectBtn.classList.add("pointer-events-none", "opacity-50");
        connectBtn.textContent = "Connected";
        connectBtn.removeAttribute("href");
      } else {
        connectBtn.removeAttribute("aria-disabled");
        connectBtn.classList.remove("pointer-events-none", "opacity-50");
        connectBtn.textContent = "Connect";
        connectBtn.setAttribute("href", "google.html?msg=connected");
      }
    }

    const year = document.getElementById("year");
    if (year) year.textContent = String(new Date().getFullYear());

    // Flash message
    const msgEl = $("#googleMsg");
    const [type, text] = ui_msg(msg);

    if (msgEl) {
      if (text) {
        msgEl.classList.remove("hidden");
        msgEl.className = "mb-6 px-4 py-3 rounded-2xl font-semibold";

        if (type === "ok") msgEl.classList.add("bg-emerald-50", "border", "border-emerald-100", "text-emerald-700");
        if (type === "warn") msgEl.classList.add("bg-yellow-50", "border", "border-yellow-100", "text-yellow-800");
        if (type === "err") msgEl.classList.add("bg-red-50", "border", "border-red-100", "text-red-600");

        msgEl.textContent = text;
      } else {
        msgEl.classList.add("hidden");
      }
    }
  }

  document.addEventListener("DOMContentLoaded", () => {
    render();

    // Connect (simulate oauth redirect)
    const connect = document.querySelector('[data-action="google-connect"]');
    if (connect) {
      connect.addEventListener("click", (e) => {
        e.preventDefault();
        location.href = isConnected()
          ? "google.html?msg=connected_already"
          : "google.html?msg=connected";
      });
    }

    // Disconnect (simulate POST + confirm)
    const disForm = $("#googleDisconnectForm");
    if (disForm) {
      disForm.addEventListener("submit", (e) => {
        e.preventDefault();
        if (!confirm("Disconnect Google?")) return;
        location.href = "google.html?msg=disconnected";
      });
    }
  });
})();