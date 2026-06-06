import GUserPage from "./pages/GUserPage";
import CustomerHomePage from "./pages/CustomerHomePage";

import EtiterPage from "./pages/editer.jsx";


function App() {
  const path = window.location.pathname;

  if (path === "/etiter" || path.startsWith("/etiter/")) {
    return <EtiterPage />;
  }

  if (path === "/customer-home" || path.startsWith("/customer-home/")) {
    return <CustomerHomePage />;
  }

  return <GUserPage />;
}

export default App;