import { Home, ShoppingCart, List, Image, UserRound, Layers, LifeBuoy, LogOut } from "lucide-react";

export default function Sidebar() {
  return (
    <aside className="w-72 bg-white shadow-sm hidden lg:flex flex-col p-6 gap-4">

      <button className="w-full text-left px-5 py-3 rounded-2xl bg-indigo-600 text-white inline-flex items-center gap-3">
        <Home className="h-5 w-5" />
        <span>Home</span>
      </button>

      <button className="w-full text-left px-5 py-3 rounded-2xl bg-gray-100 text-gray-800 inline-flex items-center gap-3">
        <ShoppingCart className="h-5 w-5" />
        <span>Store</span>
      </button>

      <button className="w-full text-left px-5 py-3 rounded-2xl bg-gray-100 text-gray-800 inline-flex items-center gap-3">
        <Layers className="h-5 w-5" />
        <span>3D Designer</span>
      </button>

      <button className="w-full text-left px-5 py-3 rounded-2xl bg-gray-100 text-gray-800 inline-flex items-center gap-3">
        <List className="h-5 w-5" />
        <span>My Orders</span>
      </button>

      <button className="w-full text-left px-5 py-3 rounded-2xl bg-gray-100 text-gray-800 inline-flex items-center gap-3">
        <Image className="h-5 w-5" />
        <span>My Designs</span>
      </button>
      <button className="w-full text-left px-5 py-3 rounded-2xl bg-gray-100 text-gray-800 inline-flex items-center gap-3">
        <UserRound className="h-5 w-5" />
        <span>Account</span>
      </button>

      <div className="mt-auto pt-4 border-t flex flex-col gap-3">
        <button className="w-full text-left px-5 py-3 rounded-2xl bg-gray-50 text-gray-800 inline-flex items-center gap-3">
          <LifeBuoy className="h-5 w-5 text-gray-600" />
          <span>Support</span>
        </button>

        <button className="w-full text-left px-5 py-3 rounded-2xl bg-white border border-red-100 text-red-600 inline-flex items-center gap-3">
          <LogOut className="h-5 w-5" />
          <span>Log out</span>
        </button>
      </div>
    </aside>
  );
}