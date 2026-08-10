import React, { useState } from "react";
import TShirt2D from "./TShirt2D";

export default function Store3DCardPreview({ product, activeColor, onClick }) {
  const [viewAngle, setViewAngle] = useState("front"); // "front", "back", "side"
  const [isHovered, setIsHovered] = useState(false);

  const getLayers = () => {
    if (!product) return [];
    if (product.layers && product.layers.length > 0) {
      return product.layers;
    }
    return [];
  };

  const shirtColor = activeColor || product.colors?.[0] || "#ffffff";
  const designImg = product.images?.[0];

  return (
    <div
      className="relative rounded-2xl bg-gradient-to-b from-slate-50 to-slate-100/70 h-52 w-full overflow-hidden border border-slate-200/80 cursor-pointer group/card select-none shadow-2xs hover:border-indigo-300 transition duration-300 flex items-center justify-center p-4"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onClick}
    >
      {/* 3 View Buttons Overlay at top of card on hover */}
      <div
        className={`absolute top-2.5 inset-x-0 z-30 flex justify-center items-center transition-all duration-300 ${
          isHovered
            ? "opacity-100 translate-y-0 pointer-events-auto"
            : "opacity-0 -translate-y-2 pointer-events-none"
        }`}
      >
        <div className="bg-slate-900/85 backdrop-blur-md px-1.5 py-1 rounded-xl shadow-lg flex items-center gap-1 border border-white/15">
          {[
            { id: "front", label: "Front" },
            { id: "back", label: "Back" },
            { id: "side", label: "Side" },
          ].map((view) => {
            const isActive = viewAngle === view.id;
            return (
              <button
                key={view.id}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setViewAngle(view.id);
                }}
                className={`px-2.5 py-0.5 text-[10px] font-black uppercase rounded-lg transition-all duration-150 cursor-pointer ${
                  isActive
                    ? "bg-indigo-600 text-white shadow-xs"
                    : "text-slate-300 hover:text-white hover:bg-white/15"
                }`}
              >
                {view.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* High-Performance 2D View Preview */}
      <div className="w-full h-full flex items-center justify-center pointer-events-none transition-transform duration-300 group-hover/card:scale-105">
        <TShirt2D
          color={shirtColor}
          designUrl={designImg}
          layers={getLayers()}
          view={viewAngle}
          className="h-44 w-44 drop-shadow-lg"
        />
      </div>

      {/* View Badge Tag */}
      <div className="absolute bottom-2 right-2 z-10 pointer-events-none">
        <span className="px-2 py-0.5 bg-slate-900/60 backdrop-blur-xs text-slate-200 text-[9px] font-bold rounded-md uppercase tracking-wider border border-white/10 flex items-center gap-1">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400"></span>
          {viewAngle.toUpperCase()} VIEW
        </span>
      </div>
    </div>
  );
}
