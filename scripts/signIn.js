import { escapeHtml } from "./helpers.js";
import STATE from "./state.js";

const renderSignIn = () => {
    const { error, email, password } = STATE.signIn;

    return `
<div class="min-h-screen flex items-center justify-center bg-slate-50 px-4">
  <div class="max-w-md w-full bg-white rounded-[2rem] shadow-2xl shadow-slate-200 border border-slate-100 p-8 md:p-12">
    <div class="text-center mb-10">
      <div class="w-16 h-16 bg-yellow-500 rounded-lg flex items-center justify-center mx-auto mb-6">
        <svg class="h-14 w-14 object-contain" xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 512 512"><path fill="#ffffff" d="M256 89.61L22.486 177.18L256 293.937l111.22-55.61l-104.337-31.9A16 16 0 0 1 256 208a16 16 0 0 1-16-16a16 16 0 0 1 16-16l-2.646 8.602l18.537 5.703a16 16 0 0 1 .008.056l27.354 8.365L455 246.645v12.146a16 16 0 0 0-7 13.21a16 16 0 0 0 7.293 13.406C448.01 312.932 448 375.383 448 400c16 10.395 16 10.775 32 0c0-24.614-.008-87.053-7.29-114.584A16 16 0 0 0 480 272a16 16 0 0 0-7-13.227v-25.42L413.676 215.1l75.838-37.92L256 89.61zM119.623 249L106.5 327.74c26.175 3.423 57.486 18.637 86.27 36.627c16.37 10.232 31.703 21.463 44.156 32.36c7.612 6.66 13.977 13.05 19.074 19.337c5.097-6.288 11.462-12.677 19.074-19.337c12.453-10.897 27.785-22.128 44.156-32.36c28.784-17.99 60.095-33.204 86.27-36.627L392.375 249h-6.25L256 314.063L125.873 249h-6.25z"/></svg>
      </div>
      <h2 class="text-3xl font-extrabold text-slate-900 mb-2">Welcome Back</h2>
      <p class="text-slate-500">Sign in with your purchase email and password.</p>
    </div>

    <form data-action="signin-submit" class="space-y-6">
      ${
        error
          ? `<div class="bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-xl text-sm font-medium">${escapeHtml(
              error
            )}</div>`
          : ""
      }

<div>
  <label class="block text-sm font-bold text-slate-700 mb-2">Email</label>
  <input data-field="signin-email" type="email" value="${escapeHtml(
    email
  )}" placeholder="e.g. you@email.com"
    class="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition-all" />
</div>

      <div>
        <label class="block text-sm font-bold text-slate-700 mb-2">Password</label>
        <input data-field="signin-password" type="password" value="${escapeHtml(
          password
        )}" placeholder="Your secure password"
          class="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition-all" />
          <a href="#/forgot-password" class="text-yellow-500 text-sm font-bold hover:underline">Forgot password?</a>
      </div>

      <button type="submit"
        class="w-full py-4 bg-yellow-500 text-white font-bold rounded-2xl hover:bg-yellow-600 shadow-xl shadow-yellow-100 transition-all active:scale-95">
        Access Platform
      </button>
    </form>

    <div class="mt-8 pt-8 border-t border-slate-50 text-center">
      <p class="text-sm text-slate-500">
        Haven't purchased a course yet? <br />
        <a href="#/" class="text-yellow-500 font-bold hover:underline">Explore Our Courses</a>
      </p>
    </div>
  </div>
</div>
`;
  };

export default renderSignIn;