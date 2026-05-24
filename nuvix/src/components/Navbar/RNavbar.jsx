import { useState } from "react";
import { ShoppingCart, UserRound } from "lucide-react";

export default function RNavbar() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="w-full bg-white shadow-sm sticky top-0 z-30">
      <div className="flex items-center justify-between px-4 md:px-8 py-1">
        
        {/* Logo */}
        <div className="flex items-center">
          <a href="/" className="shrink-0 p-0 m-0 leading-none">
            <img src="/images/Logo.png" alt="Logo" className="p-0 m-0 w-20 h-9 md:w-25 md:h-12 lg:w-40 lg:h-15" />
          </a>
        </div>

        {/* Desktop Menu */}
        <div className="hidden md:flex items-center gap-8 text-gray-700 font-medium">
          <a href="/" className="hover:text-indigo-600 transition">Home</a>
          <a href="#" className="hover:text-indigo-600 transition">Store</a>
          <a href="#" className="hover:text-indigo-600 transition">Track Order</a>
          <a href="#" className="hover:text-indigo-600 transition">Help</a>
        </div>

        {/* Desktop Actions */}
        <div className="hidden md:flex items-center gap-3">
          <button
            type="button"
            aria-label="Cart"
            className="inline-flex items-center justify-center rounded-xl border border-indigo-600 p-2 text-indigo-600 transition hover:bg-indigo-50"
          >
            <ShoppingCart className="h-5 w-5" />
          </button>
          <button
            type="button"
            aria-label="Account"
            className="inline-flex items-center justify-center rounded-xl bg-indigo-600 p-2 text-white transition hover:bg-indigo-700"
          >
            <UserRound className="h-5 w-5" />
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
          <a href="/" className="block text-gray-700 font-medium hover:text-indigo-600 transition bg-gray-50 hover:bg-indigo-50 rounded-lg px-3 py-2">Home</a>
          <a href="#" className="block text-gray-700 font-medium hover:text-indigo-600 transition bg-gray-50 hover:bg-indigo-50 rounded-lg px-3 py-2">Store</a>
          <a href="#" className="block text-gray-700 font-medium hover:text-indigo-600 transition bg-gray-50 hover:bg-indigo-50 rounded-lg px-3 py-2">3D Designer</a>
          <a href="#" className="block text-gray-700 font-medium hover:text-indigo-600 transition bg-gray-50 hover:bg-indigo-50 rounded-lg px-3 py-2">My Designs</a>
          <a href="#" className="block text-gray-700 font-medium hover:text-indigo-600 transition bg-gray-50 hover:bg-indigo-50 rounded-lg px-3 py-2">My Orders</a>
          <a href="#" className="block text-gray-700 font-medium hover:text-indigo-600 transition bg-gray-50 hover:bg-indigo-50 rounded-lg px-3 py-2">Cart</a>
          <a href="#" className="block text-gray-700 font-medium hover:text-indigo-600 transition bg-gray-50 hover:bg-indigo-50 rounded-lg px-3 py-2">Account</a>
          <a href="#" className="block text-gray-700 font-medium hover:text-indigo-600 transition bg-gray-50 hover:bg-indigo-50 rounded-lg px-3 py-2">Help</a>
          <div className="flex gap-2 pt-2">
            <button className="flex-1 px-4 py-2 rounded-xl border border-indigo-600 text-indigo-600 hover:bg-indigo-50 transition text-sm">
              Log out
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}