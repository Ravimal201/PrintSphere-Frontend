import Toolbar from "../components/editor/Toolbar";
import Scene from "../three/Scene";

export default function DesignerPage() {
  return (
    <div className="h-screen flex">

      <Toolbar />

      <div className="flex-1">
        <Scene />
      </div>

      <div className="w-72 border-l p-4">

        <h2 className="font-bold text-xl mb-4">
          Design Summary
        </h2>

        <p>Print Area : 0 cm²</p>
        <p>Price : Rs. 0.00</p>

      </div>

    </div>
  );
}