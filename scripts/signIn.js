import { escapeHtml } from "./helpers.js";
import STATE from "./state.js";

const renderSignIn = () => {
    const { error, email, password } = STATE.signIn;

    return `
<div class="min-h-screen flex items-center justify-center bg-slate-50 px-4">
  <div class="max-w-md w-full bg-white rounded-[2rem] shadow-2xl shadow-slate-200 border border-slate-100 p-8 md:p-12">
    <div class="text-center mb-10">
      <div class="w-16 h-16 bg-yellow-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-yellow-100">
        <span class="text-white font-bold text-2xl">SDC</span>
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