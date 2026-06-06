import GUserPage from "./pages/GUserPage";
import CustomerHomePage from "./pages/CustomerHomePage";
import EtiterPage from "./pages/editer";

function App() {
  const path = window.location.pathname;

  if (path === "/editer" || path.startsWith("/editer/")) {
    return <EtiterPage />;
  }

  if (path === "/customer-home" || path.startsWith("/customer-home/")) {
    return <CustomerHomePage />;
  }

  return <GUserPage />;
}

export default App;