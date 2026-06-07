import Scene from "../three/Scene";

export default function DesignerPage() {
  return (
    <div className="h-screen bg-gray-100">

      <div className="h-full flex">

        {/* Left Sidebar */}

        <div className="w-64 bg-white border-r p-4">

          <h2 className="text-xl font-bold">
            Design Tools
          </h2>

        </div>

        {/* 3D Viewer */}

        <div className="flex-1">

          <Scene />

        </div>

        {/* Right Sidebar */}

        <div className="w-64 bg-white border-l p-4">

          <h2 className="text-xl font-bold">
            Summary
          </h2>

        </div>

      </div>

    </div>
  );
}