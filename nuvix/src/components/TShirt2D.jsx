import React from "react";

const colorMap = {
  white: "#ffffff",
  black: "#111827",
  charcoal: "#4b5563",
  "navy blue": "#1e3a8a",
  navy: "#1e3a8a",
  red: "#dc2626",
  gold: "#fbbf24",
  yellow: "#fbbf24",
  green: "#16a34a",
  violet: "#6d28d9",
  purple: "#6d28d9",
  pink: "#f472b6",
  beige: "#f5f5dc",
  "light grey": "#e5e7eb",
  "light gray": "#e5e7eb",
  grey: "#9ca3af",
  gray: "#9ca3af",
  "light blue": "#93c5fd",
  blue: "#3b82f6",
  brown: "#78350f"
};

const getColorValue = (colorStr) => {
  if (!colorStr) return "#ffffff";
  if (colorStr.startsWith("#")) return colorStr;
  const lower = colorStr.toLowerCase().trim();
  return colorMap[lower] || colorStr;
};

export default function TShirt2D({ color = "#ffffff", designUrl, layers = [], className = "h-36 w-36" }) {
  const finalColor = getColorValue(color);
  const visibleLayers = (layers || []).filter(l => l.visible !== false);
  const hasLayers = visibleLayers.length > 0;
  // Determine if designUrl is a valid URL and not a default placeholder
  const hasDesign = !hasLayers && designUrl && designUrl !== "/images/dumyImage.png";

  return (
    <div className={`relative flex items-center justify-center ${className}`}>
      {/* 2D T-Shirt SVG */}
      <svg
        viewBox="0 0 100 100"
        className="w-full h-full drop-shadow-md filter brightness-95"
      >
        {/* Soft shadow under shirt for depth */}
        <path
          d="M 30,12 C 38,18 47,18 55,12 L 75,22 L 66,33 L 60,29 L 60,82 C 60,85 58,87 55,87 L 30,87 C 27,87 25,85 25,82 L 25,29 L 19,33 L 10,22 Z"
          fill="rgba(0,0,0,0.08)"
          transform="translate(1.5, 1.5)"
        />
        {/* Main colored T-Shirt path */}
        <path
          d="M 30,12 C 38,18 47,18 55,12 L 75,22 L 66,33 L 60,29 L 60,82 C 60,85 58,87 55,87 L 30,87 C 27,87 25,85 25,82 L 25,29 L 19,33 L 10,22 Z"
          fill={finalColor}
          stroke={finalColor === "#ffffff" ? "#cbd5e1" : "rgba(0,0,0,0.15)"}
          strokeWidth="1"
        />
        {/* Collar border line */}
        <path
          d="M 30,12 C 38,18 47,18 55,12"
          fill="none"
          stroke="rgba(0,0,0,0.15)"
          strokeWidth="1.5"
        />
        {/* Fold lines/Details for premium aesthetics */}
        <path
          d="M 28,29 L 32,32"
          stroke="rgba(0,0,0,0.05)"
          strokeWidth="1"
        />
        <path
          d="M 60,29 L 56,32"
          stroke="rgba(0,0,0,0.05)"
          strokeWidth="1"
        />
      </svg>

      {/* Render decal layers if provided */}
      {hasLayers && (
        <div 
          className="absolute pointer-events-none select-none flex flex-col items-center justify-center overflow-hidden"
          style={{
            top: "28%",
            left: "32%",
            width: "36%",
            height: "38%"
          }}
        >
          {visibleLayers.map((layer, idx) => {
            if (layer.type === "text") {
              return (
                <div
                  key={layer.id || idx}
                  className="truncate text-center max-w-full leading-tight drop-shadow-sm px-1 my-0.5"
                  style={{
                    fontFamily: layer.fontFamily || "Inter",
                    color: layer.color || "#1e293b",
                    fontWeight: layer.bold ? "bold" : "normal",
                    fontStyle: layer.italic ? "italic" : "normal",
                    fontSize: "11px"
                  }}
                >
                  {layer.text || layer.name}
                </div>
              );
            }
            if (layer.url && layer.url !== "/images/dumyImage.png") {
              return (
                <img
                  key={layer.id || idx}
                  src={layer.url}
                  alt={layer.name || "Decal"}
                  className="max-w-full max-h-[70%] object-contain my-0.5"
                  onError={(e) => { e.target.style.display = "none"; }}
                />
              );
            }
            return null;
          })}
        </div>
      )}

      {/* Fallback Single Decal Overlay on the chest area */}
      {hasDesign && (
        <div 
          className="absolute pointer-events-none select-none flex items-center justify-center overflow-hidden"
          style={{
            top: "32%",
            left: "37%",
            width: "26%",
            height: "26%"
          }}
        >
          <img
            src={designUrl}
            alt="Design Decal"
            className="max-w-full max-h-full object-contain"
            onError={(e) => { e.target.style.display = "none"; }}
          />
        </div>
      )}
    </div>
  );
}
