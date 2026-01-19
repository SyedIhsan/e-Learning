// changePassword.js
import STATE from "./state.js";
import { escapeHtml } from "./helpers.js";

export default function renderChangePassword() {
  const cp = STATE.changePassword;

  const banner = cp.error
    ? `<div class="bg-red-50 border border-red-100 text-red-700 px-4 py-3 rounded-2xl text-sm font-semibold">${escapeHtml(cp.error)}</div>`
    : cp.message
    ? `<div class="bg-emerald-50 border border-emerald-100 text-emerald-700 px-4 py-3 rounded-2xl text-sm font-semibold">${escapeHtml(cp.message)}</div>`
    : "";

  const email = STATE.user?.email || "";

  return `
<div class="min-h-screen flex items-center justify-center bg-slate-50 px-4">
  <div class="max-w-md w-full bg-white rounded-[2rem] shadow-2xl shadow-slate-200 border border-slate-100 p-8 md:p-12">
    <div class="text-center mb-10">
      <div class="w-16 h-16 bg-yellow-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-yellow-100">
        <span class="text-white font-bold text-2xl">SDC</span>
      </div>
      <h1 class="text-3xl font-extrabold text-slate-900 mb-2">Change Password</h1>
      <p class="text-slate-500">For security, you must change your temporary password before continuing.</p>
    </div>

    ${
      email
        ? `<div class="mb-6 text-sm text-slate-600 bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3">
            Signed in as <strong class="text-slate-900">${escapeHtml(email)}</strong>
          </div>`
        : ""
    }

    ${banner ? `<div class="mb-6">${banner}</div>` : ""}

    <form class="space-y-6" data-action="change-password-submit">
      <div>
        <label class="block text-sm font-bold text-slate-700 mb-2">Current Password</label>
        <input
          class="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition-all"
          type="password"
          data-field="change-current"
          value="${escapeHtml(cp.currentPassword)}"
          placeholder="Current password"
          required
        />
      </div>

      <div>
        <label class="block text-sm font-bold text-slate-700 mb-2">New Password</label>
        <input
          class="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition-all"
          type="password"
          data-field="change-new"
          value="${escapeHtml(cp.newPassword)}"
          placeholder="New password"
          required
        />
      </div>

      <div>
        <label class="block text-sm font-bold text-slate-700 mb-2">Confirm New Password</label>
        <input
          class="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition-all"
          type="password"
          data-field="change-confirm"
          value="${escapeHtml(cp.confirmPassword)}"
          placeholder="Confirm new password"
          required
        />
      </div>

      <button
        class="w-full py-4 bg-yellow-500 text-white font-bold rounded-2xl hover:bg-yellow-600 shadow-xl shadow-yellow-100 transition-all active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
        type="submit"
        ${cp.loading ? "disabled" : ""}
      >
        ${cp.loading ? "Updating..." : "Update Password"}
      </button>

      <div class="pt-2 text-center">
        <a href="#/dashboard" class="text-yellow-500 font-bold hover:underline">Back to Dashboard</a>
      </div>
    </form>
  </div>
</div>
  `;
}