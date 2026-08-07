import GUserPage from "./pages/GUserPage";
import CustomerHomePage from "./pages/CustomerHomePage";
import EtiterPage from "./pages/editer.jsx";
import DesignerPage from "./pages/DesignerPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import AdminPage from "./pages/AdminPage";
import ManagerPage from "./pages/ManagerPage";
import EmployeePage from "./pages/EmployeePage";
import StorePage from "./pages/StorePage";
import AccountPage from "./pages/AccountPage";
import MyDesignsPage from "./pages/MyDesignsPage";
import MyOrdersPage from "./pages/MyOrdersPage";
import SupportPage from "./pages/SupportPage";
import AboutUsPage from "./pages/AboutUsPage";
import ContactUsPage from "./pages/ContactUsPage";
import HowItWorksPage from "./pages/HowItWorksPage";
import CartPage from "./pages/CartPage";
import PaymentPage from "./pages/PaymentPage";
import PaymentSuccess from "./pages/PaymentSuccess";
import PaymentCancel from "./pages/PaymentCancel";

function App() {
  const path = window.location.pathname;

  if (path === "/payment" || path.startsWith("/payment?") || path === "/payment/checkout") {
    const token = localStorage.getItem("token");
    const isAuthenticated = token && token !== "null" && token !== "undefined";
    if (!isAuthenticated) {
      window.location.href = "/login?redirect=/payment";
      return null;
    }
    return <PaymentPage />;
  }

  if (path === "/login") {
    return <LoginPage />;
  }

  if (path === "/register") {
    return <RegisterPage />;
  }

  if (path === "/admin") {
    return <AdminPage />;
  }

  if (path === "/manager") {
    return <ManagerPage />;
  }

  if (path === "/employee") {
    return <EmployeePage />;
  }

  if (path === "/store") {
    return <StorePage />;
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
    const isAuthenticated = token && token !== "null" && token !== "undefined";
    if (!isAuthenticated) {
      window.location.href = "/login";
      return null;
    }
    return <CustomerHomePage />;
  }

  if (path === "/account") {
    const token = localStorage.getItem("token");
    const isAuthenticated = token && token !== "null" && token !== "undefined";
    if (!isAuthenticated) {
      window.location.href = "/login?redirect=/account";
      return null;
    }
    return <AccountPage />;
  }

  if (path === "/cart") {
    return <CartPage />;
  }

  if (path === "/payment/success" || path.startsWith("/payment/success")) {
    return <PaymentSuccess />;
  }

  if (path === "/payment/cancel" || path.startsWith("/payment/cancel")) {
    return <PaymentCancel />;
  }

  if (path === "/my-designs") {
    const token = localStorage.getItem("token");
    const isAuthenticated = token && token !== "null" && token !== "undefined";
    if (!isAuthenticated) {
      window.location.href = "/login?redirect=/my-designs";
      return null;
    }
    return <MyDesignsPage />;
  }

  if (path === "/my-orders") {
    const token = localStorage.getItem("token");
    const isAuthenticated = token && token !== "null" && token !== "undefined";
    if (!isAuthenticated) {
      window.location.href = "/login?redirect=/my-orders";
      return null;
    }
    return <MyOrdersPage />;
  }

  if (path === "/support") {
    return <SupportPage />;
  }

  if (path === "/about") {
    return <AboutUsPage />;
  }

  if (path === "/contact") {
    return <ContactUsPage />;
  }

  if (path === "/how-it-works" || path === "/how-is-work") {
    return <HowItWorksPage />;
  }

  return <GUserPage />;
}

export default App;