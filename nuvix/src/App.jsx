import GUserPage from "./pages/GUserPage";
import CustomerHomePage from "./pages/CustomerHomePage";
import EtiterPage from "./pages/editer";
import DesignerPage from "./pages/DesignerPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import AdminPage from "./pages/AdminPage";

function App() {
  const path = window.location.pathname;

  if (path === "/login") {
    return <LoginPage />;
  }

  if (path === "/register") {
    return <RegisterPage />;
  }

  if (path === "/admin") {
    return <AdminPage />;
  }

  if (path === "/designer" || path.startsWith("/designer/")) {
    return <DesignerPage />;
  }

  if (path === "/editer" || path.startsWith("/editer/")) {
    return <EtiterPage />;
  }

  if (path === "/customer-home" || path.startsWith("/customer-home/")) {
    // Redirect to login if customer attempts to access without token
    const token = localStorage.getItem("token");
    if (!token) {
      window.location.href = "/login";
      return null;
    }
    return <CustomerHomePage />;
  }

  return <GUserPage />;
}

export default App;