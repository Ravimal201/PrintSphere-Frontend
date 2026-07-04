import { useState, useEffect } from "react";
import { ChevronDown, ShoppingCart, UserRound } from "lucide-react";

export default function RNavbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [user, setUser] = useState({ name: "Customer", role: "Customer" });

  useEffect(() => {
    const userStr = localStorage.getItem("user");
    if (userStr) {
      try {
        const parsed = JSON.parse(userStr);
        if (parsed.name) {
          setUser(parsed);
        }
      } catch (e) {
        console.error("Failed to parse user in RNavbar:", e);
      }
    }
  }, []);

  return (
    <nav className="w-full bg-white shadow-sm sticky top-0 z-30">
      <div className="flex items-center justify-between px-4 md:px-8 py-2">
        
        {/* Logo */}
        <div className="flex items-center">
          <a href="/customer-home" className="shrink-0 p-0 m-0 leading-none">
            <img src="/images/Logo.png" alt="Logo" className="p-0 m-0 w-20 h-9 md:w-25 md:h-12 lg:w-40 lg:h-15" />
          </a>
        </div>

        {/* Desktop Menu */}
        <div className="hidden md:flex items-center gap-8 text-gray-700 font-medium">
          <a href="/about" className="hover:text-indigo-600 transition">About</a>
          <a href="/store" className="hover:text-indigo-600 transition">Store</a>
          <a href="/my-orders" className="hover:text-indigo-600 transition">Track Order</a>
          <a href="/contact" className="hover:text-indigo-600 transition">Contact Us</a>
        </div>

        {/* Desktop Actions */}
        <div className="hidden md:flex items-center gap-3">
          <button
            type="button"
            aria-label="Cart"
            onClick={() => { window.location.href = "/cart"; }}
            className="inline-flex items-center justify-center rounded-xl border border-indigo-600 p-2 text-indigo-600 transition hover:bg-indigo-55"
          >
            <ShoppingCart className="h-5 w-5" />
          </button>
          <button
            type="button"
            aria-label="Account menu"
            onClick={() => { window.location.href = "/account"; }}
            className="inline-flex items-center gap-3 px-3 py-2 text-left hover:bg-slate-50 rounded-2xl transition"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100 text-indigo-600">
              <UserRound className="h-5 w-5" />
            </span>

            <span className="flex flex-col items-start leading-tight">
              <span className="text-sm font-semibold text-gray-900">{user.name}</span>
              <span className="text-xs text-gray-500">{user.role}</span>
            </span>

            <ChevronDown className="h-4 w-4 text-gray-400" />
          </button>
        </div>

        {/* Mobile Menu Button */}
        <button 
          onClick={() => setIsOpen(!isOpen)}
          className="md:hidden flex flex-col gap-1.5 p-2"
        >
          <span className={`w-5 h-0.5 bg-gray-700 transition-all ${isOpen ? 'rotate-45 translate-y-2' : ''}`}></span>
          <span className={`w-5 h-0.5 bg-gray-700 transition-all ${isOpen ? 'opacity-0' : ''}`}></span>
          <span className={`w-5 h-0.5 bg-gray-700 transition-all ${isOpen ? '-rotate-45 -translate-y-2' : ''}`}></span>
        </button>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden bg-white px-4 py-4 space-y-3">
          <a href="/customer-home" className="block text-gray-700 font-medium hover:text-indigo-600 transition bg-gray-50 hover:bg-indigo-50 rounded-lg px-3 py-2">Home</a>
          <a href="/store" className="block text-gray-700 font-medium hover:text-indigo-600 transition bg-gray-50 hover:bg-indigo-50 rounded-lg px-3 py-2">Store</a>
          <a href="/designer" className="block text-gray-700 font-medium hover:text-indigo-600 transition bg-gray-50 hover:bg-indigo-50 rounded-lg px-3 py-2">3D Designer</a>
          <a href="/my-designs" className="block text-gray-700 font-medium hover:text-indigo-600 transition bg-gray-50 hover:bg-indigo-50 rounded-lg px-3 py-2">My Designs</a>
          <a href="/my-orders" className="block text-gray-700 font-medium hover:text-indigo-600 transition bg-gray-50 hover:bg-indigo-50 rounded-lg px-3 py-2">My Orders</a>
          <a href="/cart" className="block text-gray-700 font-medium hover:text-indigo-600 transition bg-gray-50 hover:bg-indigo-50 rounded-lg px-3 py-2">Cart</a>
          <a href="/account" className="block text-gray-700 font-medium hover:text-indigo-600 transition bg-gray-50 hover:bg-indigo-50 rounded-lg px-3 py-2">Account</a>
          <a href="/support" className="block text-gray-700 font-medium hover:text-indigo-600 transition bg-gray-50 hover:bg-indigo-50 rounded-lg px-3 py-2">Help</a>
          <div className="flex gap-2 pt-2">
            <button 
              onClick={() => { localStorage.clear(); window.location.href = "/"; }}
              className="flex-1 px-4 py-2 rounded-xl border border-indigo-600 text-indigo-600 hover:bg-indigo-50 transition text-sm text-center"
            >
              Log out
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}