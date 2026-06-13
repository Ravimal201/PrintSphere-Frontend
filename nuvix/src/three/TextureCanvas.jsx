import * as THREE from "three";

/**
 * Generates a high-quality CanvasTexture for text decals.
 * @param {Object} layer - The text layer configurations.
 * @returns {THREE.CanvasTexture}
 */
export function createTextTexture(layer) {
  const canvas = document.createElement("canvas");
  
  // High resolution for sharp text rendering in 3D
  canvas.width = 1024;
  canvas.height = 256;
  
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  // Clear with transparent background
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Setup font styles
  const fontStyle = [
    layer.italic ? "italic" : "",
    layer.bold ? "bold" : "",
    "80px", // fixed base text size on canvas, decal scale governs actual dimensions on mesh
    `"${layer.fontFamily || "Inter"}", sans-serif`
  ]
    .filter(Boolean)
    .join(" ");

  ctx.font = fontStyle;
  ctx.fillStyle = layer.color || "#ffffff";
  ctx.textBaseline = "middle";
  ctx.textAlign = "center";

  // Optional: Subtle shadow for readability on light fabrics
  ctx.shadowColor = "rgba(0, 0, 0, 0.15)";
  ctx.shadowBlur = 4;
  ctx.shadowOffsetX = 1;
  ctx.shadowOffsetY = 1;

  // Render text centered in canvas
  ctx.fillText(layer.text || "", canvas.width / 2, canvas.height / 2);

  // Convert to CanvasTexture
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.needsUpdate = true;

  return texture;
}
