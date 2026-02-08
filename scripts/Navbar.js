import { getPath } from "./helpers.js";
import STATE from "./state.js";

const renderNavbar = () => {
    const user = STATE.user;
    const path = getPath();
    const navLinks = [
      { name: "Beginner", path: "/beginner" },
      { name: "Intermediate", path: "/intermediate" },
      { name: "Advanced", path: "/advanced" },
    ];

    const isActive = (p) => path === p;
    const isLoggedIn = !!user;

    return `
<nav class="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200">
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <div class="flex justify-between items-center h-20">
      <div class="flex-shrink-0">
        <a href="${STATE.user ? '#/dashboard' : '#/'}" class="flex items-center space-x-2">
          <div class="h-10 w-10 bg-yellow-500 rounded-lg shrink-0 flex items-center justify-center">
            <svg class="h-8 w-8 object-contain" xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 512 512"><path fill="#ffffff" d="M256 89.61L22.486 177.18L256 293.937l111.22-55.61l-104.337-31.9A16 16 0 0 1 256 208a16 16 0 0 1-16-16a16 16 0 0 1 16-16l-2.646 8.602l18.537 5.703a16 16 0 0 1 .008.056l27.354 8.365L455 246.645v12.146a16 16 0 0 0-7 13.21a16 16 0 0 0 7.293 13.406C448.01 312.932 448 375.383 448 400c16 10.395 16 10.775 32 0c0-24.614-.008-87.053-7.29-114.584A16 16 0 0 0 480 272a16 16 0 0 0-7-13.227v-25.42L413.676 215.1l75.838-37.92L256 89.61zM119.623 249L106.5 327.74c26.175 3.423 57.486 18.637 86.27 36.627c16.37 10.232 31.703 21.463 44.156 32.36c7.612 6.66 13.977 13.05 19.074 19.337c5.097-6.288 11.462-12.677 19.074-19.337c12.453-10.897 27.785-22.128 44.156-32.36c28.784-17.99 60.095-33.204 86.27-36.627L392.375 249h-6.25L256 314.063L125.873 249h-6.25z"/></svg>
          </div>
          <span class="text-xl font-extrabold text-slate-900 tracking-tight hidden sm:block">e-Learning</span>
        </a>
      </div>

      ${!isLoggedIn ? `
      <div class="hidden md:flex flex-1 justify-center items-center space-x-8">
        ${navLinks.map((link) => `
          <a href="#${link.path}" class="text-sm font-semibold transition-colors duration-200 ${
            isActive(link.path) ? "text-yellow-500" : "text-slate-600 hover:text-yellow-400"
          }">${link.name}</a>
        `).join("")}
      </div>` : ""}

      <div class="flex items-center space-x-4">
        ${
          user
            ? `
          <div class="flex items-center space-x-6">
            <a href="#/dashboard" class="text-sm font-bold transition-colors ${
              path === "/dashboard" ? "text-yellow-500" : "text-slate-600 hover:text-yellow-500"
            }">My Dashboard</a>
            <button data-action="logout" class="text-sm font-semibold text-slate-500 hover:text-red-600 transition-colors">Logout</button>
          </div>`
            : `
          <a href="#/signin" class="hidden sm:block text-sm font-semibold text-slate-700 hover:text-yellow-500">Sign In</a>
          <a href="#/beginner" class="bg-yellow-500 text-white px-5 py-2.5 rounded-full text-sm font-bold shadow-md shadow-yellow-200 hover:bg-yellow-600 transition-all">Browse Courses</a>
          `
        }

        <div class="md:hidden flex items-center">
          <button data-action="nav-toggle" class="text-slate-600 hover:text-slate-900 focus:outline-none">
            <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              ${
                STATE.nav.isMenuOpen
                  ? `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />`
                  : `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16m-7 6h7" />`
              }
            </svg>
          </button>
        </div>
      </div>
    </div>
  </div>

  ${
    STATE.nav.isMenuOpen
      ? `
  <div class="md:hidden bg-white border-b border-slate-200 px-4 pt-2 pb-6 space-y-1" data-role="mobile-menu">
    ${
      !isLoggedIn
        ? navLinks
            .map(
              (link) => `
      <a href="#${link.path}" class="block px-3 py-4 text-base font-medium rounded-md ${
        isActive(link.path)
          ? "bg-yellow-50 text-yellow-700"
          : "text-slate-700 hover:bg-slate-50 hover:text-yellow-500"
      }" data-action="nav-close">${link.name}</a>`
            )
            .join("")
        : ""
    }
    <div class="pt-4 border-t border-slate-100 flex flex-col space-y-2">
      ${
        user
          ? `
        <a href="#/dashboard" data-action="nav-close" class="w-full text-center py-3 font-bold ${
          path === "/dashboard" ? "text-yellow-500" : "text-slate-700"
        }">My Dashboard</a>
        <button data-action="logout" class="w-full text-center py-3 text-red-600 font-semibold">Logout</button>
      `
          : `
        <a href="#/signin" data-action="nav-close" class="w-full text-center py-3 text-slate-700 font-semibold">Sign In</a>
      `
      }
    </div>
  </div>
  `
      : ""
  }
</nav>
`;
  };

export default renderNavbar;