import { useState } from "react";
import Scene from "../three/Scene";
import {
  FRONT_PRINT_AREA,
  BACK_PRINT_AREA,
} from "../config/printArea";

import {
  calculateCoverage,
} from "../utils/calculateCoverage";

import {
  calculateDTFCost,
} from "../utils/calculateDTFCost";

export default function DesignerPage() {
  const [shirtColor, setShirtColor] = useState("#7CFC00");

  const [activeSide, setActiveSide] = useState("front");

  const [frontDesign, setFrontDesign] = useState({
    texture: null,
    x: 0,
    y: 1.35,
    scale: 0.25,
    rotation: 0,
  });

  const [backDesign, setBackDesign] = useState({
    texture: null,
    x: 0,
    y: 1.35,
    scale: 0.25,
    rotation: 0,
  });

  const currentDesign =
    activeSide === "front"
      ? frontDesign
      : backDesign;
  
  const designWidth = currentDesign.scale * 20;

  const designHeight = currentDesign.scale * 20;

  const printableArea =
  activeSide === "front"
    ? FRONT_PRINT_AREA
    : BACK_PRINT_AREA;

  const areaData =
  calculateCoverage(
    designWidth,
    designHeight,
    printableArea.width,
    printableArea.height
  );

  const estimatedCost =
  calculateDTFCost(
    areaData.percentage
  );

  const updateCurrentDesign = (
    field,
    value
  ) => {
    if (activeSide === "front") {
      setFrontDesign({
        ...frontDesign,
        [field]: value,
      });
    } else {
      setBackDesign({
        ...backDesign,
        [field]: value,
      });
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];

    if (!file) return;

    const imageUrl =
      URL.createObjectURL(file);

    if (activeSide === "front") {
      setFrontDesign({
        ...frontDesign,
        texture: imageUrl,
      });
    } else {
      setBackDesign({
        ...backDesign,
        texture: imageUrl,
      });
    }
  };

  return (
    <div className="h-screen flex bg-gray-100">
      {/* Sidebar */}
      <div className="w-80 bg-white border-r p-5 overflow-y-auto">

        <h2 className="text-2xl font-bold mb-6">
          T-Shirt Designer
        </h2>

        {/* Side Switch */}
        <div className="mb-6">
          <h3 className="font-semibold mb-2">
            Design Side
          </h3>

          <div className="flex gap-2">
            <button
              onClick={() =>
                setActiveSide("front")
              }
              className={`px-4 py-2 rounded ${
                activeSide === "front"
                  ? "bg-blue-500 text-white"
                  : "bg-gray-200"
              }`}
            >
              Front
            </button>

            <button
              onClick={() =>
                setActiveSide("back")
              }
              className={`px-4 py-2 rounded ${
                activeSide === "back"
                  ? "bg-blue-500 text-white"
                  : "bg-gray-200"
              }`}
            >
              Back
            </button>
          </div>
        </div>

        {/* Shirt Color */}
        <div className="mb-6">
          <label className="block mb-2">
            Shirt Color
          </label>

          <input
            type="color"
            value={shirtColor}
            onChange={(e) =>
              setShirtColor(
                e.target.value
              )
            }
          />
        </div>

        {/* Upload */}
        <div className="mb-6">
          <label className="block mb-2">
            Upload Logo
          </label>

          <input
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
          />
        </div>

        {/* Size */}
        <div className="mb-6">
          <label>Logo Size</label>

          <input
            type="range"
            min="0.1"
            max="1"
            step="0.01"
            value={currentDesign.scale}
            onChange={(e) =>
              updateCurrentDesign(
                "scale",
                Number(e.target.value)
              )
            }
            className="w-full"
          />
        </div>

        {/* X */}
        <div className="mb-6">
          <label>Move Left / Right</label>

          <input
            type="range"
            min="-1"
            max="1"
            step="0.01"
            value={currentDesign.x}
            onChange={(e) =>
              updateCurrentDesign(
                "x",
                Number(e.target.value)
              )
            }
            className="w-full"
          />
        </div>

        {/* Y */}
        <div className="mb-6">
          <label>Move Up / Down</label>

          <input
            type="range"
            min="0.5"
            max="2"
            step="0.01"
            value={currentDesign.y}
            onChange={(e) =>
              updateCurrentDesign(
                "y",
                Number(e.target.value)
              )
            }
            className="w-full"
          />
        </div>

        {/* Rotation */}
        <div className="mb-6">
          <label>Rotation</label>

          <input
            type="range"
            min="-180"
            max="180"
            step="1"
            value={
              currentDesign.rotation
            }
            onChange={(e) =>
              updateCurrentDesign(
                "rotation",
                Number(e.target.value)
              )
            }
            className="w-full"
          />
        </div>
        <div className="mt-8 p-4 bg-gray-100 rounded-lg">
          <h3 className="font-bold text-lg mb-3">
            Print Area Analysis
          </h3>

          <p className="mb-2">
            Design Area:
            {" "}
            {areaData.designArea.toFixed(2)}
            cm²
          </p>

          <p className="mb-2">
            Printable Area:
            {" "}
            {areaData.printableArea.toFixed(2)}
            cm²
          </p>

          <p className="mb-2">
            Coverage:
            {" "}
            {areaData.percentage.toFixed(2)}
            %
          </p>

          <hr className="my-3" />

          <p className="text-green-600 font-bold text-lg">
            Estimated Print Cost:
            Rs. {estimatedCost}
          </p>
        </div>
      </div>

      {/* Viewer */}
      <div className="flex-1">
        <Scene
          shirtColor={shirtColor}
          activeSide={activeSide}
          frontDesign={frontDesign}
          backDesign={backDesign}
        />
      </div>
    </div>
  );
}