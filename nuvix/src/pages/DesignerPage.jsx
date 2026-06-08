import { useState } from "react";
import Scene from "../three/Scene";

export default function DesignerPage() {
  const [shirtColor, setShirtColor] = useState("#7CFC00");

  const [logoTexture, setLogoTexture] = useState(null);

  const [logoScale, setLogoScale] = useState(0.25);

  const [logoX, setLogoX] = useState(0);
  const [logoY, setLogoY] = useState(1.35);

  const [logoRotation, setLogoRotation] = useState(0);

  const handleImageUpload = (e) => {
    const file = e.target.files[0];

    if (!file) return;

    const imageUrl = URL.createObjectURL(file);

    setLogoTexture(imageUrl);
  };

  return (
    <div className="h-screen flex bg-gray-100">
      {/* LEFT PANEL */}
      <div className="w-80 bg-white border-r p-5 overflow-y-auto">

        <h2 className="text-2xl font-bold mb-6">
          Design Tools
        </h2>

        {/* Shirt Color */}
        <div className="mb-6">
          <label className="block mb-2 font-medium">
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

        {/* Upload */}
        <div className="mb-6">
          <label className="block mb-2 font-medium">
            Upload Logo
          </label>

          <input
            type="file"
            accept="image/png,image/jpeg,image/jpg"
            onChange={handleImageUpload}
          />
        </div>

        {/* Size */}
        <div className="mb-6">
          <label className="block mb-2 font-medium">
            Logo Size
          </label>

          <input
            type="range"
            min="0.1"
            max="1"
            step="0.01"
            value={logoScale}
            onChange={(e) =>
              setLogoScale(Number(e.target.value))
            }
            className="w-full"
          />

          <p>{logoScale}</p>
        </div>

        {/* X */}
        <div className="mb-6">
          <label className="block mb-2 font-medium">
            Move Left / Right
          </label>

          <input
            type="range"
            min="-1"
            max="1"
            step="0.01"
            value={logoX}
            onChange={(e) =>
              setLogoX(Number(e.target.value))
            }
            className="w-full"
          />

          <p>{logoX}</p>
        </div>

        {/* Y */}
        <div className="mb-6">
          <label className="block mb-2 font-medium">
            Move Up / Down
          </label>

          <input
            type="range"
            min="0.5"
            max="2"
            step="0.01"
            value={logoY}
            onChange={(e) =>
              setLogoY(Number(e.target.value))
            }
            className="w-full"
          />

          <p>{logoY}</p>
        </div>

        {/* Rotation */}
        <div className="mb-6">
          <label className="block mb-2 font-medium">
            Rotation
          </label>

          <input
            type="range"
            min="-180"
            max="180"
            step="1"
            value={logoRotation}
            onChange={(e) =>
              setLogoRotation(Number(e.target.value))
            }
            className="w-full"
          />

          <p>{logoRotation}°</p>
        </div>

      </div>

      {/* 3D VIEWER */}
      <div className="flex-1">
        <Scene
          shirtColor={shirtColor}
          logoTexture={logoTexture}
          logoScale={logoScale}
          logoX={logoX}
          logoY={logoY}
          logoRotation={logoRotation}
        />
      </div>
    </div>
  );
}