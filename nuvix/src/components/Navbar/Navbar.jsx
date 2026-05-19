export default function Navbar() {
  return (
    <nav className="w-full h-16 bg-white shadow-sm flex items-center justify-between px-8 border-b">
      
      {/* Logo */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-bold text-xl">
          N
        </div>

        <h1 className="text-2xl font-bold text-gray-800">
          NOW<span className="text-indigo-600">IX</span>
        </h1>
      </div>

      {/* Menu */}
      <div className="hidden md:flex items-center gap-8 text-gray-700 font-medium">
        <a href="#">Home</a>
        <a href="#">Store</a>
        <a href="#">Designer</a>
        <a href="#">Orders</a>
      </div>

      {/* Buttons */}
      <div className="flex items-center gap-4">
        <button className="px-5 py-2 rounded-xl border border-indigo-600 text-indigo-600">
          Login
        </button>

        <button className="px-5 py-2 rounded-xl bg-indigo-600 text-white">
          Register
        </button>
      </div>
    </nav>
  );
}