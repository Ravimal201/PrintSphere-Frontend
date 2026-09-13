import { Home, ShoppingCart, List, Image, UserRound, Layers, LifeBuoy, LogOut } from "lucide-react";

export default function Sidebar() {
  const currentPath = typeof window !== "undefined" ? window.location.pathname : "";

  const navItems = [
    {
      name: "Home",
      href: "/customer-home",
      icon: Home,
      isActive: (path) => path === "/customer-home" || path === "/",
    },
    {
      name: "Store",
      href: "/store",
      icon: ShoppingCart,
      isActive: (path) => path === "/store" || path.startsWith("/store"),
    },
    {
      name: "3D Designer",
      href: "/designer",
      icon: Layers,
      isActive: (path) =>
        path === "/designer" ||
        path.startsWith("/designer") ||
        path === "/editer" ||
        path.startsWith("/editer") ||
        path === "/3d-customization",
    },
    {
      name: "My Orders",
      href: "/my-orders",
      icon: List,
      isActive: (path) => path === "/my-orders" || path.startsWith("/my-orders"),
    },
    {
      name: "My Designs",
      href: "/my-designs",
      icon: Image,
      isActive: (path) => path === "/my-designs" || path.startsWith("/my-designs"),
    },
    {
      name: "Account",
      href: "/account",
      icon: UserRound,
      isActive: (path) => path === "/account" || path.startsWith("/account"),
    },
  ];

  const isSupportActive = currentPath === "/support" || currentPath.startsWith("/support");

  return (
    <aside className="flex-none w-72 bg-white shadow-sm hidden lg:flex lg:fixed lg:top-16 lg:left-0 lg:h-[calc(100vh-4rem)] overflow-y-auto flex-col p-6 gap-3">
      {navItems.map((item) => {
        const active = item.isActive(currentPath);
        const IconComponent = item.icon;
        return (
          <button
            key={item.name}
            onClick={() => {
              window.location.href = item.href;
            }}
            className={`w-full text-left px-5 py-3 rounded-2xl inline-flex items-center gap-3 transition-all duration-150 ${
              active
                ? "bg-indigo-600 text-white font-medium shadow-md shadow-indigo-200"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200/70 hover:text-gray-900 font-medium"
            }`}
          >
            <IconComponent className={`h-5 w-5 ${active ? "text-white" : "text-gray-500"}`} />
            <span>{item.name}</span>
          </button>
        );
      })}

      <div className="mt-auto pt-4 border-t flex flex-col gap-3">
        <button
          onClick={() => {
            window.location.href = "/support";
          }}
          className={`w-full text-left px-5 py-3 rounded-2xl inline-flex items-center gap-3 transition-all duration-150 cursor-pointer ${
            isSupportActive
              ? "bg-indigo-600 text-white font-medium shadow-md shadow-indigo-200"
              : "bg-gray-50 text-gray-700 hover:bg-slate-100 hover:text-gray-900 font-medium"
          }`}
        >
          <LifeBuoy className={`h-5 w-5 ${isSupportActive ? "text-white" : "text-gray-600"}`} />
          <span>Support</span>
        </button>

        <button
          onClick={() => {
            localStorage.clear();
            window.location.href = "/";
          }}
          className="w-full text-left px-5 py-3 rounded-2xl bg-white border border-red-100 text-red-600 inline-flex items-center gap-3 hover:bg-red-50 hover:border-red-200 transition font-medium cursor-pointer"
        >
          <LogOut className="h-5 w-5" />
          <span>Log out</span>
        </button>
      </div>
    </aside>
  );
}