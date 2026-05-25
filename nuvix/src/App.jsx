import GUserPage from "./pages/GUserPage";
import CustomerHomePage from "./pages/CustomerHomePage";

function App() {
  const path = window.location.pathname;

  if (path === "/customer-home" || path.startsWith("/customer-home/")) {
    return <CustomerHomePage />;
  }

  return <GUserPage />;
}

export default App;