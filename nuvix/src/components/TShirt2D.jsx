import React, { forwardRef, useImperativeHandle, useRef } from "react";

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

export const getColorValue = (colorStr) => {
  if (!colorStr) return "#ffffff";
  if (colorStr.startsWith("#")) return colorStr;
  const lower = colorStr.toLowerCase().trim();
  return colorMap[lower] || colorStr;
};

// Filter layers that belong to the specified angle
export const filterLayersForView = (layers = [], view = "front") => {
  if (!layers || layers.length === 0) return [];
  const normalizedView = view.toLowerCase();

  return layers.filter((layer) => {
    if (layer.visible === false) return false;

    // Check layer positioning if 3D coordinates exist
    const pos = Array.isArray(layer.position) ? layer.position : [0, 0, 0];
    const rot = Array.isArray(layer.rotation) ? layer.rotation : [0, 0, 0];
    const yRot = rot[1] || 0;
    const zPos = pos[2] || 0;
    const xPos = pos[0] || 0;

    // Check explicit side or mesh name if tagged
    if (layer.side) {
      return layer.side.toLowerCase() === normalizedView;
    }

    if (normalizedView === "back") {
      // Back if z is negative or rotated towards back (~180 deg / Math.PI)
      const isBackAngle = Math.abs(yRot) > 2.0;
      const isBackZ = zPos < -0.03;
      return isBackAngle || isBackZ;
    }

    if (normalizedView === "left") {
      // Left side if x is negative or rotated towards +90 deg (~Math.PI/2)
      const isLeftAngle = yRot > 0.8 && yRot < 2.3;
      const isLeftX = xPos < -0.06;
      return isLeftAngle || isLeftX;
    }

    if (normalizedView === "right") {
      // Right side if x is positive or rotated towards -90 deg (~-Math.PI/2)
      const isRightAngle = yRot < -0.8 && yRot > -2.3;
      const isRightX = xPos > 0.06;
      return isRightAngle || isRightX;
    }

    // Default: Front view
    // Front if not explicitly back/left/right
    const isBack = Math.abs(yRot) > 2.0 || zPos < -0.03;
    const isSide = Math.abs(xPos) > 0.09 || (Math.abs(yRot) > 1.0 && Math.abs(yRot) < 2.2);
    if (isBack || isSide) return false;
    return true;
  });
};

const TShirt2D = forwardRef(function TShirt2D(
  {
    color = "#ffffff",
    designUrl,
    layers = [],
    view = "front", // "front", "back", "left", "right", "side"
    className = "h-36 w-36",
    id
  },
  ref
) {
  const containerRef = useRef(null);
  const finalColor = getColorValue(color);
  const normalizedView = (view === "side" ? "left" : view).toLowerCase();

  const viewLayers = filterLayersForView(layers, normalizedView);
  const hasLayers = viewLayers.length > 0;
  const hasDesign = !hasLayers && designUrl && designUrl !== "/images/dumyImage.png" && normalizedView === "front";

  useImperativeHandle(ref, () => ({
    getSvgElement: () => containerRef.current?.querySelector("svg"),
    getContainer: () => containerRef.current
  }));

  const renderSvgBody = () => {
    if (normalizedView === "back") {
      return (
        <g>
          {/* Soft Shadow */}
          <path
            d="M 30,12 C 38,15 47,15 55,12 L 75,22 L 66,33 L 60,29 L 60,82 C 60,85 58,87 55,87 L 30,87 C 27,87 25,85 25,82 L 25,29 L 19,33 L 10,22 Z"
            fill="rgba(0,0,0,0.08)"
            transform="translate(1.5, 1.5)"
          />
          {/* Main colored T-Shirt path - back view */}
          <path
            d="M 30,12 C 38,15 47,15 55,12 L 75,22 L 66,33 L 60,29 L 60,82 C 60,85 58,87 55,87 L 30,87 C 27,87 25,85 25,82 L 25,29 L 19,33 L 10,22 Z"
            fill={finalColor}
            stroke={finalColor === "#ffffff" ? "#cbd5e1" : "rgba(0,0,0,0.18)"}
            strokeWidth="1.2"
          />
          {/* Back collar stitch line */}
          <path
            d="M 30,12 C 38,15 47,15 55,12"
            fill="none"
            stroke="rgba(0,0,0,0.22)"
            strokeWidth="1.6"
          />
          {/* Inside neck tag label detail */}
          <rect
            x="44"
            y="14"
            width="12"
            height="5"
            rx="1"
            fill="rgba(0,0,0,0.12)"
          />
          {/* Back shoulder yoke seam */}
          <path
            d="M 25,29 C 35,32 50,32 60,29"
            fill="none"
            stroke="rgba(0,0,0,0.08)"
            strokeWidth="1"
            strokeDasharray="2 2"
          />
          {/* Bottom hemline stitch */}
          <path
            d="M 26,84 L 59,84"
            stroke="rgba(0,0,0,0.1)"
            strokeWidth="1"
            strokeDasharray="2 2"
          />
        </g>
      );
    }

    if (normalizedView === "right") {
      // Right side profile (facing left)
      return (
        <g transform="translate(100, 0) scale(-1, 1)">
          {/* Shadow */}
          <path
            d="M 38,12 C 45,15 52,15 58,16 L 68,26 L 58,36 L 55,82 C 55,85 52,87 48,87 L 35,87 C 32,87 30,85 30,82 L 30,35 L 26,30 L 22,20 Z"
            fill="rgba(0,0,0,0.08)"
            transform="translate(-1.5, 1.5)"
          />
          {/* Side Profile Body */}
          <path
            d="M 38,12 C 45,15 52,15 58,16 L 68,26 L 58,36 L 55,82 C 55,85 52,87 48,87 L 35,87 C 32,87 30,85 30,82 L 30,35 L 26,30 L 22,20 Z"
            fill={finalColor}
            stroke={finalColor === "#ffffff" ? "#cbd5e1" : "rgba(0,0,0,0.18)"}
            strokeWidth="1.2"
          />
          {/* Sleeve outline */}
          <path
            d="M 35,16 C 45,18 55,20 68,26 L 58,36 L 42,32 Z"
            fill={finalColor}
            stroke="rgba(0,0,0,0.18)"
            strokeWidth="1.2"
          />
          {/* Armhole seam line */}
          <path
            d="M 42,32 C 43,50 44,65 45,87"
            fill="none"
            stroke="rgba(0,0,0,0.12)"
            strokeWidth="1"
            strokeDasharray="2 2"
          />
        </g>
      );
    }

    if (normalizedView === "left") {
      // Left side profile (facing right)
      return (
        <g>
          {/* Shadow */}
          <path
            d="M 38,12 C 45,15 52,15 58,16 L 68,26 L 58,36 L 55,82 C 55,85 52,87 48,87 L 35,87 C 32,87 30,85 30,82 L 30,35 L 26,30 L 22,20 Z"
            fill="rgba(0,0,0,0.08)"
            transform="translate(1.5, 1.5)"
          />
          {/* Side Profile Body */}
          <path
            d="M 38,12 C 45,15 52,15 58,16 L 68,26 L 58,36 L 55,82 C 55,85 52,87 48,87 L 35,87 C 32,87 30,85 30,82 L 30,35 L 26,30 L 22,20 Z"
            fill={finalColor}
            stroke={finalColor === "#ffffff" ? "#cbd5e1" : "rgba(0,0,0,0.18)"}
            strokeWidth="1.2"
          />
          {/* Sleeve outline */}
          <path
            d="M 35,16 C 45,18 55,20 68,26 L 58,36 L 42,32 Z"
            fill={finalColor}
            stroke="rgba(0,0,0,0.18)"
            strokeWidth="1.2"
          />
          {/* Armhole seam line */}
          <path
            d="M 42,32 C 43,50 44,65 45,87"
            fill="none"
            stroke="rgba(0,0,0,0.12)"
            strokeWidth="1"
            strokeDasharray="2 2"
          />
        </g>
      );
    }

    // Default: Front view
    return (
      <g>
        {/* Soft shadow under shirt */}
        <path
          d="M 30,12 C 38,18 47,18 55,12 L 75,22 L 66,33 L 60,29 L 60,82 C 60,85 58,87 55,87 L 30,87 C 27,87 25,85 25,82 L 25,29 L 19,33 L 10,22 Z"
          fill="rgba(0,0,0,0.08)"
          transform="translate(1.5, 1.5)"
        />
        {/* Main colored T-Shirt path */}
        <path
          d="M 30,12 C 38,18 47,18 55,12 L 75,22 L 66,33 L 60,29 L 60,82 C 60,85 58,87 55,87 L 30,87 C 27,87 25,85 25,82 L 25,29 L 19,33 L 10,22 Z"
          fill={finalColor}
          stroke={finalColor === "#ffffff" ? "#cbd5e1" : "rgba(0,0,0,0.18)"}
          strokeWidth="1.2"
        />
        {/* Collar border line */}
        <path
          d="M 30,12 C 38,18 47,18 55,12"
          fill="none"
          stroke="rgba(0,0,0,0.18)"
          strokeWidth="1.6"
        />
        {/* Fold lines/Details */}
        <path d="M 28,29 L 32,32" stroke="rgba(0,0,0,0.06)" strokeWidth="1" />
        <path d="M 60,29 L 56,32" stroke="rgba(0,0,0,0.06)" strokeWidth="1" />
        {/* Bottom hemline stitch */}
        <path
          d="M 26,84 L 59,84"
          stroke="rgba(0,0,0,0.1)"
          strokeWidth="1"
          strokeDasharray="2 2"
        />
      </g>
    );
  };

  // Adjust placement container based on view
  const getDecalContainerStyle = () => {
    if (normalizedView === "back") {
      return {
        top: "24%",
        left: "32%",
        width: "36%",
        height: "40%"
      };
    }
    if (normalizedView === "left") {
      return {
        top: "22%",
        left: "40%",
        width: "28%",
        height: "30%"
      };
    }
    if (normalizedView === "right") {
      return {
        top: "22%",
        left: "32%",
        width: "28%",
        height: "30%"
      };
    }
    return {
      top: "28%",
      left: "32%",
      width: "36%",
      height: "40%"
    };
  };

  return (
    <div
      ref={containerRef}
      id={id}
      className={`relative flex items-center justify-center ${className} select-none`}
    >
      {/* 2D T-Shirt SVG */}
      <svg
        viewBox="0 0 100 100"
        className="w-full h-full drop-shadow-md filter brightness-95 transition-all duration-300"
      >
        {renderSvgBody()}
      </svg>

      {/* Render decal layers if provided */}
      {hasLayers && (
        <div
          className="absolute pointer-events-none select-none flex flex-col items-center justify-center overflow-hidden"
          style={getDecalContainerStyle()}
        >
          {viewLayers.map((layer, idx) => {
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
                    fontSize: normalizedView === "front" || normalizedView === "back" ? "11px" : "9px"
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
                  className="max-w-full max-h-[75%] object-contain my-0.5 drop-shadow-xs"
                  onError={(e) => {
                    e.target.style.display = "none";
                  }}
                />
              );
            }
            return null;
          })}
        </div>
      )}

      {/* Fallback Single Decal Overlay on chest area */}
      {hasDesign && (
        <div
          className="absolute pointer-events-none select-none flex items-center justify-center overflow-hidden"
          style={getDecalContainerStyle()}
        >
          <img
            src={designUrl}
            alt="Design Decal"
            className="max-w-full max-h-full object-contain drop-shadow-xs"
            onError={(e) => {
              e.target.style.display = "none";
            }}
          />
        </div>
      )}
    </div>
  );
});

export default TShirt2D;
