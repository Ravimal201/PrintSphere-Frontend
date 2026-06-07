import GUserPage from "./pages/GUserPage";
import CustomerHomePage from "./pages/CustomerHomePage";
import EtiterPage from "./pages/editer";
import DesignerPage from "./pages/DesignerPage";

function App() {
  const path = window.location.pathname;

  if (path === "/editer" || path.startsWith("/editer/")) {
    return <EtiterPage />;
  }

  if (path === "/customer-home" || path.startsWith("/customer-home/")) {
    return <CustomerHomePage />;
  }
  if (path === "/designerPage" || path.startsWith("/designerPage/")) {
    return <DesignerPage />;
  }

  return <GUserPage />;
}

export default App;