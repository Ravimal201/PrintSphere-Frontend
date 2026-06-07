import { useState } from "react";
import Scene from "../three/Scene";

export default function DesignerPage() {
  const [shirtColor, setShirtColor] = useState("#ffffff");
  const [logoTexture, setLogoTexture] = useState(null);
  const [logoScale, setLogoScale] = useState(0.4);

  const handleImageUpload = (e) => {
    const file = e.target.files[0];

    if (!file) return;

    const imageUrl = URL.createObjectURL(file);

    setLogoTexture(imageUrl);
  };

  return (
    <div className="h-screen flex bg-gray-100">

      {/* Left Panel */}
      <div className="w-80 bg-white border-r p-5">

        <h2 className="text-2xl font-bold mb-6">
          Design Tools
        </h2>

        <div className="mb-6">
          <label className="block mb-2">
            Shirt Color
          </label>

          <input
            type="color"
            value={shirtColor}
            onChange={(e) =>
              setShirtColor(e.target.value)
            }
            className="w-full h-12"
          />
        </div>

        <div className="mb-6">
          <label className="block mb-2">
            Upload Logo
          </label>

          <input
            type="file"
            accept="image/png,image/jpeg,image/jpg"
            onChange={handleImageUpload}
          />
        </div>

        <div className="mb-6">
          <label className="block mb-2">
            Logo Size
          </label>

          <input
            type="range"
            min="0.1"
            max="1.5"
            step="0.05"
            value={logoScale}
            onChange={(e) =>
              setLogoScale(Number(e.target.value))
            }
            className="w-full"
          />

          <p className="mt-2">
            {logoScale}
          </p>
        </div>

      </div>

      {/* Viewer */}
      <div className="flex-1">

        <Scene
          shirtColor={shirtColor}
          logoTexture={logoTexture}
          logoScale={logoScale}
        />

      </div>

    </div>
  );
}