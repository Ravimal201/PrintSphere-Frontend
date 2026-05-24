export default function Sidebar() {
  return (
    <aside className="w-72 bg-white shadow-sm hidden lg:flex flex-col p-6 gap-4">

      <h2 className="text-lg font-semibold text-gray-800 mb-4">
        Dashboard
      </h2>

      <button className="w-full text-left px-5 py-3 rounded-2xl bg-indigo-600 text-white">
        Overview
      </button>

      <button className="w-full text-left px-5 py-3 rounded-2xl bg-gray-100">
        3D Designer
      </button>

      <button className="w-full text-left px-5 py-3 rounded-2xl bg-gray-100">
        Products
      </button>

      <button className="w-full text-left px-5 py-3 rounded-2xl bg-gray-100">
        Orders
      </button>

      <button className="w-full text-left px-5 py-3 rounded-2xl bg-gray-100">
        Analytics
      </button>
    </aside>
  );
}