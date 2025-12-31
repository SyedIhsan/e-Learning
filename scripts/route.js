import { getPath, resetPageStatesOnRoute, navigate } from "./helpers.js";
import STATE from "./state.js";
import renderHome from "./home.js";
import renderCoursePage from "./coursePage.js";
import renderCourseDetail from "./courseDetail.js";
import renderSignIn from "./signIn.js";
import renderDashboard from "./dashboard.js";
import renderCourseContent from "./courseContent.js";
import renderNavbar from "./Navbar.js";
import renderFooter from "./footer.js";
import { $app } from "./helpers.js";
import renderCheckout from "./checkout.js";

const renderRoute = (path) => {
    const user = STATE.user;

    if (path === "/") return renderHome();
    if (path === "/beginner") return renderCoursePage("beginner");
    if (path === "/intermediate") return renderCoursePage("intermediate");
    if (path === "/advanced") return renderCoursePage("advanced");

    if (path.startsWith("/course/")) {
      const id = path.split("/")[2] || "";
      return renderCourseDetail(id);
    }

    if (path.startsWith("/checkout/")) {
      const id = path.split("/")[2] || "";
      return renderCheckout(id);
    }

    if (path === "/signin") return renderSignIn();

    // Protected routes
    if (path === "/dashboard") {
      if (!user) {
        navigate("/signin");
        return "";
      }
      return renderDashboard();
    }

    if (path.startsWith("/course-content/")) {
      if (!user) {
        navigate("/signin");
        return "";
      }
      const id = path.split("/")[2] || "";
      return renderCourseContent(id);
    }

    // Not Found
    return `
<div class="min-h-screen flex items-center justify-center p-8">
  <div class="text-center">
    <h1 class="text-3xl font-black text-slate-900 mb-4">Page Not Found</h1>
    <a href="#/" class="text-yellow-500 font-bold hover:underline">Return to Home</a>
  </div>
</div>`;
  };

export const render = () => {
    const path = getPath();
    resetPageStatesOnRoute(path);

    const html = `
<div class="flex flex-col min-h-screen">
  ${renderNavbar()}
  <main class="flex-grow">
    ${renderRoute(path)}
  </main>
  ${renderFooter()}
</div>
`;
    $app().innerHTML = html;
    STATE.prevPath = path;
  };

export default renderRoute;