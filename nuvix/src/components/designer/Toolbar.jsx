export default function Toolbar() {
  return (
    <div className="w-72 bg-white border-r p-4">

      <button className="w-full p-3 bg-gray-100 rounded mb-3">
        Upload Image
      </button>

      <button className="w-full p-3 bg-gray-100 rounded mb-3">
        Add Text
      </button>

      <button className="w-full p-3 bg-gray-100 rounded">
        Change Color
      </button>

    </div>
  );
}