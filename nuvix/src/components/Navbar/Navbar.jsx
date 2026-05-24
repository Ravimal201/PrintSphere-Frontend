import { useState } from "react";

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="w-full bg-white shadow-sm border-b sticky top-0 z-30">
      <div className="flex items-center justify-between px-4 md:px-8 py-1">
        
        {/* Logo */}
        <div className="flex items-center">
          <a href="/" className="flex-shrink-0 p-0 m-0 leading-none">
            <img src="/images/Logo.png" alt="Logo" className="p-0 m-0 w-12 h-12 md:w-16 md:h-16 lg:w-60 lg:h-25" />
          </a>
        </div>

        {/* Desktop Menu */}
        <div className="hidden md:flex items-center gap-8 text-gray-700 font-medium">
          <a href="/" className="hover:text-indigo-600 transition">Home</a>
          <a href="#" className="hover:text-indigo-600 transition">Store</a>
          <a href="#" className="hover:text-indigo-600 transition">Designer</a>
          <a href="#" className="hover:text-indigo-600 transition">Orders</a>
        </div>

        {/* Desktop Buttons */}
        <div className="hidden md:flex items-center gap-3">
          <button className="px-5 py-2 rounded-xl border border-indigo-600 text-indigo-600 hover:bg-indigo-50 transition">
            Login
          </button>
          <button className="px-5 py-2 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 transition">
            Register
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
        <div className="md:hidden bg-white border-t px-4 py-4 space-y-3">
          <a href="/" className="block text-gray-700 font-medium hover:text-indigo-600 transition">Home</a>
          <a href="#" className="block text-gray-700 font-medium hover:text-indigo-600 transition">Store</a>
          <a href="#" className="block text-gray-700 font-medium hover:text-indigo-600 transition">Designer</a>
          <a href="#" className="block text-gray-700 font-medium hover:text-indigo-600 transition">Orders</a>
          <div className="flex gap-2 pt-2">
            <button className="flex-1 px-4 py-2 rounded-xl border border-indigo-600 text-indigo-600 hover:bg-indigo-50 transition text-sm">
              Login
            </button>
            <button className="flex-1 px-4 py-2 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 transition text-sm">
              Register
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}