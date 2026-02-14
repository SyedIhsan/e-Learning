// forgotPassword.js
import STATE from "./state.js";
import { escapeHtml } from "./helpers.js";

export default function renderForgotPassword() {
  const fp = STATE.forgotPassword;

  const isRequestStage = fp.stage === "request";
  const title = isRequestStage ? "Forgot Password" : "Reset Password";

  const banner = fp.error
    ? `<div class="bg-red-50 border border-red-100 text-red-700 px-4 py-3 rounded-2xl text-sm font-semibold">${escapeHtml(fp.error)}</div>`
    : fp.message
    ? `<div class="bg-emerald-50 border border-emerald-100 text-emerald-700 px-4 py-3 rounded-2xl text-sm font-semibold">${escapeHtml(fp.message)}</div>`
    : "";

  const subtitle = isRequestStage
    ? "Demo mode: enter the email you used for purchase to get a verification code."
    : `Enter the verification code sent to ${escapeHtml(fp.email || "your email")}.`;

  return `
<div class="min-h-screen flex items-center justify-center bg-slate-50 px-4">
  <div class="max-w-md w-full bg-white rounded-[2rem] shadow-2xl shadow-slate-200 border border-slate-100 p-8 md:p-12">
    <div class="text-center mb-10">
      <div class="w-16 h-16 bg-yellow-500 rounded-lg flex items-center justify-center mx-auto mb-6">
        <svg class="h-14 w-14 object-contain" xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 512 512"><path fill="#ffffff" d="M256 89.61L22.486 177.18L256 293.937l111.22-55.61l-104.337-31.9A16 16 0 0 1 256 208a16 16 0 0 1-16-16a16 16 0 0 1 16-16l-2.646 8.602l18.537 5.703a16 16 0 0 1 .008.056l27.354 8.365L455 246.645v12.146a16 16 0 0 0-7 13.21a16 16 0 0 0 7.293 13.406C448.01 312.932 448 375.383 448 400c16 10.395 16 10.775 32 0c0-24.614-.008-87.053-7.29-114.584A16 16 0 0 0 480 272a16 16 0 0 0-7-13.227v-25.42L413.676 215.1l75.838-37.92L256 89.61zM119.623 249L106.5 327.74c26.175 3.423 57.486 18.637 86.27 36.627c16.37 10.232 31.703 21.463 44.156 32.36c7.612 6.66 13.977 13.05 19.074 19.337c5.097-6.288 11.462-12.677 19.074-19.337c12.453-10.897 27.785-22.128 44.156-32.36c28.784-17.99 60.095-33.204 86.27-36.627L392.375 249h-6.25L256 314.063L125.873 249h-6.25z"/></svg>
      </div>
      <h1 class="text-3xl font-extrabold text-slate-900 mb-2">${title}</h1>
      <p class="text-slate-500">${subtitle}</p>
    </div>

    ${banner ? `<div class="mb-6">${banner}</div>` : ""}

    ${
      isRequestStage
        ? `
      <form class="space-y-6" data-action="forgot-request">
        <div>
          <label class="block text-sm font-bold text-slate-700 mb-2">Email</label>
          <input
            class="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition-all"
            type="email"
            data-field="forgot-email"
            value="${escapeHtml(fp.email)}"
            placeholder="you@example.com"
            required
          />
          <p class="mt-2 text-xs text-slate-500">
            In demo mode, the code is shown on-screen (no email is sent).
          </p>
        </div>

        <button
          class="w-full py-4 bg-yellow-500 text-white font-bold rounded-2xl hover:bg-yellow-600 shadow-xl shadow-yellow-100 transition-all active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
          type="submit"
          ${fp.loading ? "disabled" : ""}
        >
          ${fp.loading ? "Sending..." : "Send Verification Code"}
        </button>

        <div class="pt-2 text-center">
          <a href="#/signin" class="text-yellow-500 font-bold hover:underline">Back to Sign In</a>
        </div>
      </form>
      `
        : `
      <form class="space-y-6" data-action="forgot-reset">
        <div>
          <label class="block text-sm font-bold text-slate-700 mb-2">Verification Code</label>
          <input
            class="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition-all"
            type="text"
            data-field="forgot-code"
            value="${escapeHtml(fp.code)}"
            placeholder="e.g. 123456"
            required
          />
        </div>

        <div>
          <label class="block text-sm font-bold text-slate-700 mb-2">New Password</label>
          <input
            class="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition-all"
            type="password"
            data-field="forgot-new"
            value="${escapeHtml(fp.newPassword)}"
            placeholder="New password"
            required
          />
        </div>

        <div>
          <label class="block text-sm font-bold text-slate-700 mb-2">Confirm New Password</label>
          <input
            class="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition-all"
            type="password"
            data-field="forgot-confirm"
            value="${escapeHtml(fp.confirmPassword)}"
            placeholder="Confirm new password"
            required
          />
        </div>

        <button
          class="w-full py-4 bg-yellow-500 text-white font-bold rounded-2xl hover:bg-yellow-600 shadow-xl shadow-yellow-100 transition-all active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
          type="submit"
          ${fp.loading ? "disabled" : ""}
        >
          ${fp.loading ? "Resetting..." : "Reset Password"}
        </button>

        <div class="flex items-center justify-between gap-3 pt-2">
          <button
            class="px-4 py-2 rounded-xl border border-slate-200 bg-white text-slate-700 font-semibold hover:bg-slate-50 active:scale-[0.99] transition"
            type="button"
            data-action="forgot-back"
          >
            Use different email
          </button>

          <a href="#/signin" class="text-yellow-500 font-bold hover:underline">Back to Sign In</a>
        </div>
      </form>
      `
    }
  </div>
</div>
  `;
}