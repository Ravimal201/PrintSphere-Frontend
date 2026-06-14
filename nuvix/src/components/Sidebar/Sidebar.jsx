import { Home, ShoppingCart, List, Image, UserRound, Layers, LifeBuoy, LogOut } from "lucide-react";

export default function Sidebar() {
  return (
    <aside className="flex-none w-72 bg-white shadow-sm hidden lg:flex lg:fixed lg:top-16 lg:left-0 lg:h-[calc(100vh-4rem)] overflow-y-auto flex-col p-6 gap-4">

      <button 
        onClick={() => window.location.href = '/'}
        className="w-full text-left px-5 py-3 rounded-2xl bg-gray-100 text-gray-800 inline-flex items-center gap-3 hover:bg-slate-50 transition"
      >
        <Home className="h-5 w-5" />
        <span>Home</span>
      </button>

      <button 
        onClick={() => window.location.href = '/customer-home'}
        className="w-full text-left px-5 py-3 rounded-2xl bg-gray-100 text-gray-800 inline-flex items-center gap-3 hover:bg-slate-50 transition"
      >
        <ShoppingCart className="h-5 w-5" />
        <span>Store</span>
      </button>

      <button 
        onClick={() => window.location.href = '/designer'}
        className="w-full text-left px-5 py-3 rounded-2xl bg-indigo-600 text-white inline-flex items-center gap-3 shadow-md transition"
      >
        <Layers className="h-5 w-5" />
        <span>3D Designer</span>
      </button>

      <button 
        onClick={() => window.location.href = '/customer-home'}
        className="w-full text-left px-5 py-3 rounded-2xl bg-gray-100 text-gray-800 inline-flex items-center gap-3 hover:bg-slate-50 transition"
      >
        <List className="h-5 w-5" />
        <span>My Orders</span>
      </button>

      <button 
        onClick={() => window.location.href = '/designer'}
        className="w-full text-left px-5 py-3 rounded-2xl bg-gray-100 text-gray-800 inline-flex items-center gap-3 hover:bg-slate-50 transition"
      >
        <Image className="h-5 w-5" />
        <span>My Designs</span>
      </button>
      <button 
        onClick={() => window.location.href = '/'}
        className="w-full text-left px-5 py-3 rounded-2xl bg-gray-100 text-gray-800 inline-flex items-center gap-3 hover:bg-slate-50 transition"
      >
        <UserRound className="h-5 w-5" />
        <span>Account</span>
      </button>

      <div className="mt-auto pt-4 border-t flex flex-col gap-3">
        <button className="w-full text-left px-5 py-3 rounded-2xl bg-gray-50 text-gray-800 inline-flex items-center gap-3">
          <LifeBuoy className="h-5 w-5 text-gray-600" />
          <span>Support</span>
        </button>

        <button 
          onClick={() => { localStorage.clear(); window.location.href = "/"; }}
          className="w-full text-left px-5 py-3 rounded-2xl bg-white border border-red-100 text-red-600 inline-flex items-center gap-3 hover:bg-red-50 transition"
        >
          <LogOut className="h-5 w-5" />
          <span>Log out</span>
        </button>
      </div>
    </aside>
  );
}