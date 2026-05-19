export default function Footer() {
  return (
    <footer className="bg-white border-t py-6 px-8">
      <div className="flex items-center justify-between">

        <div>
          <h2 className="text-lg font-bold text-gray-800">
            NOWIX
          </h2>

          <p className="text-gray-500 text-sm">
            Web-Based 3D T-Shirt Customization Platform
          </p>
        </div>

        <div className="flex gap-6 text-gray-600">
          <a href="#">Privacy</a>
          <a href="#">Terms</a>
          <a href="#">Support</a>
        </div>

      </div>
    </footer>
  );
}