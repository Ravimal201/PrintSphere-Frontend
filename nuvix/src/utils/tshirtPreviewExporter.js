import { getColorValue, filterLayersForView } from "../components/TShirt2D";

/**
 * Load an image with CORS handling and timeout safety
 */
export const loadImageSafe = (src) => {
  return new Promise((resolve) => {
    if (!src || src === "/images/dumyImage.png") {
      resolve(null);
      return;
    }

    const img = new Image();
    img.crossOrigin = "anonymous";

    const timer = setTimeout(() => {
      // Timeout fallback: if crossOrigin blocked, try regular load without crossOrigin (for same-domain or base64)
      img.src = "";
      resolve(null);
    }, 6000);

    img.onload = () => {
      clearTimeout(timer);
      resolve(img);
    };

    img.onerror = () => {
      clearTimeout(timer);
      // Try fallback without crossOrigin for local/data URIs
      const fallbackImg = new Image();
      fallbackImg.onload = () => resolve(fallbackImg);
      fallbackImg.onerror = () => resolve(null);
      fallbackImg.src = src;
    };

    img.src = src;
  });
};

/**
 * Draw the realistic vector T-shirt body paths directly on HTML5 Canvas
 */
export const drawTShirtBodyToCanvas = (ctx, view, shirtColor, width, height) => {
  const normView = (view === "side" ? "left" : view || "front").toLowerCase();
  const finalColor = getColorValue(shirtColor) || "#ffffff";
  const isLightColor = finalColor.toLowerCase() === "#ffffff" || finalColor.toLowerCase() === "#fff" || finalColor.toLowerCase() === "#f3f4f6";

  ctx.save();
  // Scale the standard 100x100 coordinate system to canvas width/height
  const sx = width / 100;
  const sy = height / 100;
  ctx.scale(sx, sy);

  if (normView === "back") {
    // Soft shadow under shirt
    ctx.save();
    ctx.translate(1.5, 1.5);
    ctx.fillStyle = "rgba(0, 0, 0, 0.07)";
    ctx.beginPath();
    ctx.moveTo(30, 12);
    ctx.bezierCurveTo(38, 15, 47, 15, 55, 12);
    ctx.lineTo(75, 22);
    ctx.lineTo(66, 33);
    ctx.lineTo(60, 29);
    ctx.lineTo(60, 82);
    ctx.bezierCurveTo(60, 85, 58, 87, 55, 87);
    ctx.lineTo(30, 87);
    ctx.bezierCurveTo(27, 87, 25, 85, 25, 82);
    ctx.lineTo(25, 29);
    ctx.lineTo(19, 33);
    ctx.lineTo(10, 22);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // Main colored shirt body (Back)
    ctx.beginPath();
    ctx.moveTo(30, 12);
    ctx.bezierCurveTo(38, 15, 47, 15, 55, 12);
    ctx.lineTo(75, 22);
    ctx.lineTo(66, 33);
    ctx.lineTo(60, 29);
    ctx.lineTo(60, 82);
    ctx.bezierCurveTo(60, 85, 58, 87, 55, 87);
    ctx.lineTo(30, 87);
    ctx.bezierCurveTo(27, 87, 25, 85, 25, 82);
    ctx.lineTo(25, 29);
    ctx.lineTo(19, 33);
    ctx.lineTo(10, 22);
    ctx.closePath();
    ctx.fillStyle = finalColor;
    ctx.fill();
    ctx.strokeStyle = isLightColor ? "#cbd5e1" : "rgba(0, 0, 0, 0.22)";
    ctx.lineWidth = 1.2;
    ctx.stroke();

    // Back collar stitch line
    ctx.beginPath();
    ctx.moveTo(30, 12);
    ctx.bezierCurveTo(38, 15, 47, 15, 55, 12);
    ctx.strokeStyle = "rgba(0, 0, 0, 0.25)";
    ctx.lineWidth = 1.6;
    ctx.stroke();

    // Inside neck tag label
    ctx.fillStyle = "rgba(0, 0, 0, 0.12)";
    ctx.beginPath();
    ctx.roundRect ? ctx.roundRect(44, 14, 12, 5, 1) : ctx.rect(44, 14, 12, 5);
    ctx.fill();

    // Back shoulder yoke seam
    ctx.beginPath();
    ctx.moveTo(25, 29);
    ctx.bezierCurveTo(35, 32, 50, 32, 60, 29);
    ctx.setLineDash([2, 2]);
    ctx.strokeStyle = "rgba(0, 0, 0, 0.12)";
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.setLineDash([]);

    // Bottom hemline stitch
    ctx.beginPath();
    ctx.moveTo(26, 84);
    ctx.lineTo(59, 84);
    ctx.setLineDash([2, 2]);
    ctx.strokeStyle = "rgba(0, 0, 0, 0.15)";
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.setLineDash([]);

  } else if (normView === "left") {
    // Shadow
    ctx.save();
    ctx.translate(1.5, 1.5);
    ctx.fillStyle = "rgba(0, 0, 0, 0.07)";
    ctx.beginPath();
    ctx.moveTo(38, 12);
    ctx.bezierCurveTo(45, 15, 52, 15, 58, 16);
    ctx.lineTo(68, 26);
    ctx.lineTo(58, 36);
    ctx.lineTo(55, 82);
    ctx.bezierCurveTo(55, 85, 52, 87, 48, 87);
    ctx.lineTo(35, 87);
    ctx.bezierCurveTo(32, 87, 30, 85, 30, 82);
    ctx.lineTo(30, 35);
    ctx.lineTo(26, 30);
    ctx.lineTo(22, 20);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // Left Profile Body
    ctx.beginPath();
    ctx.moveTo(38, 12);
    ctx.bezierCurveTo(45, 15, 52, 15, 58, 16);
    ctx.lineTo(68, 26);
    ctx.lineTo(58, 36);
    ctx.lineTo(55, 82);
    ctx.bezierCurveTo(55, 85, 52, 87, 48, 87);
    ctx.lineTo(35, 87);
    ctx.bezierCurveTo(32, 87, 30, 85, 30, 82);
    ctx.lineTo(30, 35);
    ctx.lineTo(26, 30);
    ctx.lineTo(22, 20);
    ctx.closePath();
    ctx.fillStyle = finalColor;
    ctx.fill();
    ctx.strokeStyle = isLightColor ? "#cbd5e1" : "rgba(0, 0, 0, 0.22)";
    ctx.lineWidth = 1.2;
    ctx.stroke();

    // Left Sleeve outline
    ctx.beginPath();
    ctx.moveTo(35, 16);
    ctx.bezierCurveTo(45, 18, 55, 20, 68, 26);
    ctx.lineTo(58, 36);
    ctx.lineTo(42, 32);
    ctx.closePath();
    ctx.fillStyle = finalColor;
    ctx.fill();
    ctx.strokeStyle = "rgba(0, 0, 0, 0.2)";
    ctx.lineWidth = 1.2;
    ctx.stroke();

    // Armhole seam
    ctx.beginPath();
    ctx.moveTo(42, 32);
    ctx.bezierCurveTo(43, 50, 44, 65, 45, 87);
    ctx.setLineDash([2, 2]);
    ctx.strokeStyle = "rgba(0, 0, 0, 0.12)";
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.setLineDash([]);

  } else if (normView === "right") {
    // Mirrored right profile
    ctx.save();
    ctx.translate(100, 0);
    ctx.scale(-1, 1);

    // Shadow
    ctx.save();
    ctx.translate(1.5, 1.5);
    ctx.fillStyle = "rgba(0, 0, 0, 0.07)";
    ctx.beginPath();
    ctx.moveTo(38, 12);
    ctx.bezierCurveTo(45, 15, 52, 15, 58, 16);
    ctx.lineTo(68, 26);
    ctx.lineTo(58, 36);
    ctx.lineTo(55, 82);
    ctx.bezierCurveTo(55, 85, 52, 87, 48, 87);
    ctx.lineTo(35, 87);
    ctx.bezierCurveTo(32, 87, 30, 85, 30, 82);
    ctx.lineTo(30, 35);
    ctx.lineTo(26, 30);
    ctx.lineTo(22, 20);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // Body
    ctx.beginPath();
    ctx.moveTo(38, 12);
    ctx.bezierCurveTo(45, 15, 52, 15, 58, 16);
    ctx.lineTo(68, 26);
    ctx.lineTo(58, 36);
    ctx.lineTo(55, 82);
    ctx.bezierCurveTo(55, 85, 52, 87, 48, 87);
    ctx.lineTo(35, 87);
    ctx.bezierCurveTo(32, 87, 30, 85, 30, 82);
    ctx.lineTo(30, 35);
    ctx.lineTo(26, 30);
    ctx.lineTo(22, 20);
    ctx.closePath();
    ctx.fillStyle = finalColor;
    ctx.fill();
    ctx.strokeStyle = isLightColor ? "#cbd5e1" : "rgba(0, 0, 0, 0.22)";
    ctx.lineWidth = 1.2;
    ctx.stroke();

    // Sleeve
    ctx.beginPath();
    ctx.moveTo(35, 16);
    ctx.bezierCurveTo(45, 18, 55, 20, 68, 26);
    ctx.lineTo(58, 36);
    ctx.lineTo(42, 32);
    ctx.closePath();
    ctx.fillStyle = finalColor;
    ctx.fill();
    ctx.strokeStyle = "rgba(0, 0, 0, 0.2)";
    ctx.lineWidth = 1.2;
    ctx.stroke();

    // Armhole seam
    ctx.beginPath();
    ctx.moveTo(42, 32);
    ctx.bezierCurveTo(43, 50, 44, 65, 45, 87);
    ctx.setLineDash([2, 2]);
    ctx.strokeStyle = "rgba(0, 0, 0, 0.12)";
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.restore();

  } else {
    // Default: Front view
    // Soft shadow under shirt
    ctx.save();
    ctx.translate(1.5, 1.5);
    ctx.fillStyle = "rgba(0, 0, 0, 0.07)";
    ctx.beginPath();
    ctx.moveTo(30, 12);
    ctx.bezierCurveTo(38, 18, 47, 18, 55, 12);
    ctx.lineTo(75, 22);
    ctx.lineTo(66, 33);
    ctx.lineTo(60, 29);
    ctx.lineTo(60, 82);
    ctx.bezierCurveTo(60, 85, 58, 87, 55, 87);
    ctx.lineTo(30, 87);
    ctx.bezierCurveTo(27, 87, 25, 85, 25, 82);
    ctx.lineTo(25, 29);
    ctx.lineTo(19, 33);
    ctx.lineTo(10, 22);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // Main colored shirt body (Front)
    ctx.beginPath();
    ctx.moveTo(30, 12);
    ctx.bezierCurveTo(38, 18, 47, 18, 55, 12);
    ctx.lineTo(75, 22);
    ctx.lineTo(66, 33);
    ctx.lineTo(60, 29);
    ctx.lineTo(60, 82);
    ctx.bezierCurveTo(60, 85, 58, 87, 55, 87);
    ctx.lineTo(30, 87);
    ctx.bezierCurveTo(27, 87, 25, 85, 25, 82);
    ctx.lineTo(25, 29);
    ctx.lineTo(19, 33);
    ctx.lineTo(10, 22);
    ctx.closePath();
    ctx.fillStyle = finalColor;
    ctx.fill();
    ctx.strokeStyle = isLightColor ? "#cbd5e1" : "rgba(0, 0, 0, 0.22)";
    ctx.lineWidth = 1.2;
    ctx.stroke();

    // Front collar border line
    ctx.beginPath();
    ctx.moveTo(30, 12);
    ctx.bezierCurveTo(38, 18, 47, 18, 55, 12);
    ctx.strokeStyle = "rgba(0, 0, 0, 0.25)";
    ctx.lineWidth = 1.6;
    ctx.stroke();

    // Sleeve fold details
    ctx.beginPath();
    ctx.moveTo(28, 29);
    ctx.lineTo(32, 32);
    ctx.strokeStyle = "rgba(0, 0, 0, 0.08)";
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(60, 29);
    ctx.lineTo(56, 32);
    ctx.strokeStyle = "rgba(0, 0, 0, 0.08)";
    ctx.lineWidth = 1;
    ctx.stroke();

    // Bottom hemline stitch
    ctx.beginPath();
    ctx.moveTo(26, 84);
    ctx.lineTo(59, 84);
    ctx.setLineDash([2, 2]);
    ctx.strokeStyle = "rgba(0, 0, 0, 0.15)";
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.setLineDash([]);
  }

  ctx.restore();
};

/**
 * Get placement bounding box on canvas (0..1 normalized coordinates) for decal layers
 */
export const getDecalBoundsForView = (view) => {
  const norm = (view === "side" ? "left" : view || "front").toLowerCase();
  if (norm === "back") {
    return { x: 0.32, y: 0.24, width: 0.36, height: 0.40 };
  }
  if (norm === "left") {
    return { x: 0.40, y: 0.22, width: 0.28, height: 0.30 };
  }
  if (norm === "right") {
    return { x: 0.32, y: 0.22, width: 0.28, height: 0.30 };
  }
  // Front
  return { x: 0.32, y: 0.28, width: 0.36, height: 0.40 };
};

/**
 * Render a complete high-resolution T-Shirt composite image with fabric color, decals, and text onto a Canvas
 */
export const renderTShirtCompositeToCanvas = async ({
  color = "#ffffff",
  layers = [],
  designUrl = "",
  view = "front",
  width = 1200,
  height = 1200,
  transparentBg = false
}) => {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  // Background
  if (!transparentBg) {
    // Subtle studio vignette background
    const bgGrad = ctx.createRadialGradient(width / 2, height / 2, width * 0.1, width / 2, height / 2, width * 0.7);
    bgGrad.addColorStop(0, "#f8fafc");
    bgGrad.addColorStop(1, "#e2e8f0");
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);
  } else {
    ctx.clearRect(0, 0, width, height);
  }

  // Draw the realistic T-Shirt base vector
  drawTShirtBodyToCanvas(ctx, view, color, width, height);

  const normView = (view === "side" ? "left" : view || "front").toLowerCase();
  const viewLayers = filterLayersForView(layers, normView);
  const bounds = getDecalBoundsForView(normView);

  const areaX = bounds.x * width;
  const areaY = bounds.y * height;
  const areaW = bounds.width * width;
  const areaH = bounds.height * height;
  const centerX = areaX + areaW / 2;
  const centerY = areaY + areaH / 2;

  // Render Decal Layers
  if (viewLayers.length > 0) {
    for (const layer of viewLayers) {
      if (layer.visible === false) continue;

      if (layer.type === "text") {
        const text = layer.text || layer.name || "";
        if (!text) continue;

        ctx.save();
        const fontSize = Math.round(areaW * 0.14);
        const fontStyle = [
          layer.italic ? "italic" : "normal",
          layer.bold ? "bold" : "normal",
          `${fontSize}px`,
          `"${layer.fontFamily || "Inter"}", system-ui, -apple-system, sans-serif`
        ].join(" ");

        ctx.font = fontStyle;
        ctx.fillStyle = layer.color || "#1e293b";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";

        // Subtle shadow for text
        ctx.shadowColor = "rgba(0, 0, 0, 0.15)";
        ctx.shadowBlur = 4;
        ctx.shadowOffsetX = 1;
        ctx.shadowOffsetY = 1;

        ctx.fillText(text, centerX, centerY);
        ctx.restore();

      } else {
        // Image / Logo layer
        const imgUrl = layer.url || layer.image || layer.src;
        if (!imgUrl || imgUrl === "/images/dumyImage.png") continue;

        const img = await loadImageSafe(imgUrl);
        if (img && img.width > 0 && img.height > 0) {
          ctx.save();
          // Calculate proportional fitting inside decal area
          const imgAspect = img.width / img.height;
          const areaAspect = areaW / areaH;
          let drawW, drawH;

          if (imgAspect > areaAspect) {
            drawW = areaW * 0.9;
            drawH = drawW / imgAspect;
          } else {
            drawH = areaH * 0.9;
            drawW = drawH * imgAspect;
          }

          const dx = centerX - drawW / 2;
          const dy = centerY - drawH / 2;

          // Apply layer rotation or flips if specified
          if (layer.flipX || layer.flipY) {
            ctx.translate(centerX, centerY);
            ctx.scale(layer.flipX ? -1 : 1, layer.flipY ? -1 : 1);
            ctx.translate(-centerX, -centerY);
          }

          // Subtle shadow under decal
          ctx.shadowColor = "rgba(0, 0, 0, 0.12)";
          ctx.shadowBlur = 6;
          ctx.shadowOffsetX = 1;
          ctx.shadowOffsetY = 2;

          ctx.drawImage(img, dx, dy, drawW, drawH);
          ctx.restore();
        }
      }
    }
  } else if (designUrl && designUrl !== "/images/dumyImage.png" && normView === "front") {
    // Single fallback designUrl on front view
    const img = await loadImageSafe(designUrl);
    if (img && img.width > 0 && img.height > 0) {
      ctx.save();
      const imgAspect = img.width / img.height;
      const areaAspect = areaW / areaH;
      let drawW, drawH;

      if (imgAspect > areaAspect) {
        drawW = areaW * 0.9;
        drawH = drawW / imgAspect;
      } else {
        drawH = areaH * 0.9;
        drawW = drawH * imgAspect;
      }

      const dx = centerX - drawW / 2;
      const dy = centerY - drawH / 2;

      ctx.shadowColor = "rgba(0, 0, 0, 0.12)";
      ctx.shadowBlur = 6;
      ctx.shadowOffsetX = 1;
      ctx.shadowOffsetY = 2;

      ctx.drawImage(img, dx, dy, drawW, drawH);
      ctx.restore();
    }
  }

  // Add watermarked / branded clean caption in the bottom left corner
  ctx.save();
  ctx.font = "bold 20px system-ui, -apple-system, sans-serif";
  ctx.fillStyle = "rgba(100, 116, 139, 0.75)";
  ctx.textAlign = "left";
  ctx.textBaseline = "bottom";
  const viewLabel = normView === "front" ? "Front View" : normView === "back" ? "Back View" : normView === "left" ? "Left Side View" : "Right Side View";
  ctx.fillText(`PrintSphere Studio • ${viewLabel}`, 30, height - 30);
  ctx.restore();

  return canvas;
};

/**
 * Convert any Data URL (PNG, WebGL 3D, canvas) into target format (PNG, JPG, WebP)
 */
export const convertDataUrlToFormat = (dataUrl, format = "png", quality = 0.95, bgColor = "#ffffff") => {
  return new Promise((resolve) => {
    if (!dataUrl) {
      resolve(null);
      return;
    }

    const cleanFormat = (format || "png").toLowerCase().replace(".", "");
    if (cleanFormat === "png" && dataUrl.startsWith("data:image/png")) {
      resolve(dataUrl);
      return;
    }

    const mimeType = (cleanFormat === "jpg" || cleanFormat === "jpeg")
      ? "image/jpeg"
      : cleanFormat === "webp"
      ? "image/webp"
      : "image/png";

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width || 1200;
      canvas.height = img.height || 1200;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        resolve(dataUrl);
        return;
      }

      // If JPG, add clean white/solid background because JPG has no alpha transparency
      if (cleanFormat === "jpg" || cleanFormat === "jpeg") {
        ctx.fillStyle = bgColor;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }

      ctx.drawImage(img, 0, 0);

      try {
        const resultUrl = canvas.toDataURL(mimeType, quality);
        resolve(resultUrl);
      } catch (err) {
        console.error("Format conversion error:", err);
        resolve(dataUrl);
      }
    };

    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
};

/**
 * Download a 3D snapshot dataUrl in target format (PNG, JPG, WebP)
 */
export const download3DSnapshotWithFormat = async (dataUrl, baseFileName = "3d-tshirt-preview", format = "png", quality = 0.95) => {
  if (!dataUrl) return false;
  const cleanFormat = (format || "png").toLowerCase().replace(".", "");
  const finalExt = cleanFormat === "jpeg" ? "jpg" : cleanFormat;
  const fileName = baseFileName.toLowerCase().endsWith(`.${finalExt}`)
    ? baseFileName
    : `${baseFileName}.${finalExt}`;

  const convertedUrl = await convertDataUrlToFormat(dataUrl, cleanFormat, quality);
  if (!convertedUrl) return false;

  try {
    const link = document.createElement("a");
    link.download = fileName;
    link.href = convertedUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    return true;
  } catch (err) {
    console.error("Error triggering snapshot download:", err);
    return false;
  }
};

/**
 * Export complete technical design spec as downloadable JSON file
 */
export const downloadDesignAsJson = (designData, fileName = "tshirt-design-spec.json") => {
  if (!designData) return false;
  try {
    const jsonStr = JSON.stringify(designData, null, 2);
    const blob = new Blob([jsonStr], { type: "application/json;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.download = fileName.endsWith(".json") ? fileName : `${fileName}.json`;
    link.href = url;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 2000);
    return true;
  } catch (err) {
    console.error("Error downloading design JSON:", err);
    return false;
  }
};

/**
 * Trigger download of a canvas as a file (PNG, JPG, WebP)
 */
export const triggerCanvasDownload = (canvas, fileName = "tshirt-design.png", format = "png", quality = 0.95) => {
  if (!canvas) return;
  const cleanFormat = (format || "png").toLowerCase().replace(".", "");
  const mimeType = (cleanFormat === "jpg" || cleanFormat === "jpeg")
    ? "image/jpeg"
    : cleanFormat === "webp"
    ? "image/webp"
    : "image/png";

  try {
    canvas.toBlob((blob) => {
      if (!blob) {
        // Fallback to dataURL
        const dataUrl = canvas.toDataURL(mimeType, quality);
        const link = document.createElement("a");
        link.download = fileName;
        link.href = dataUrl;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        return;
      }
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.download = fileName;
      link.href = url;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(url), 2000);
    }, mimeType, quality);
  } catch (err) {
    console.error("Error triggering canvas download:", err);
  }
};

/**
 * Download a high-res single angle T-Shirt image
 */
export const downloadTShirtPreviewAsPng = async ({
  color = "#ffffff",
  layers = [],
  designUrl = "",
  view = "front",
  fileName,
  title = "tshirt-design",
  orderShortId = "order",
  format = "png"
}) => {
  const normView = (view === "side" ? "left" : view || "front").toLowerCase();
  const safeTitle = (title || "tshirt").replace(/[^a-z0-9]/gi, "-").toLowerCase();
  const cleanFormat = (format || "png").toLowerCase().replace(".", "");
  const ext = cleanFormat === "jpeg" ? "jpg" : cleanFormat;
  const finalFileName = fileName || `${orderShortId}-${safeTitle}-${normView}-view.${ext}`;

  const canvas = await renderTShirtCompositeToCanvas({
    color,
    layers,
    designUrl,
    view: normView,
    width: 1200,
    height: 1200,
    transparentBg: cleanFormat === "png"
  });

  if (canvas) {
    triggerCanvasDownload(canvas, finalFileName, cleanFormat);
    return true;
  }
  return false;
};

/**
 * Download all 4 angles (Front, Back, Left, Right) sequentially with progress feedback
 */
export const downloadAllTShirtAngles = async ({
  color = "#ffffff",
  layers = [],
  designUrl = "",
  title = "tshirt-design",
  orderShortId = "order",
  format = "png",
  onProgress
}) => {
  const safeTitle = (title || "tshirt").replace(/[^a-z0-9]/gi, "-").toLowerCase();
  const cleanFormat = (format || "png").toLowerCase().replace(".", "");
  const ext = cleanFormat === "jpeg" ? "jpg" : cleanFormat;
  const angles = [
    { id: "front", label: "Front" },
    { id: "back", label: "Back" },
    { id: "left", label: "Left Side" },
    { id: "right", label: "Right Side" }
  ];

  for (let i = 0; i < angles.length; i++) {
    const angle = angles[i];
    if (onProgress) {
      onProgress(`Generating ${angle.label} view (${i + 1}/${angles.length})...`);
    }

    const canvas = await renderTShirtCompositeToCanvas({
      color,
      layers,
      designUrl,
      view: angle.id,
      width: 1200,
      height: 1200,
      transparentBg: cleanFormat === "png"
    });

    if (canvas) {
      triggerCanvasDownload(canvas, `${orderShortId}-${safeTitle}-${angle.id}-view.${ext}`, cleanFormat);
    }

    // Brief delay between downloads so the browser handles each cleanly
    await new Promise((res) => setTimeout(res, 350));
  }

  if (onProgress) {
    onProgress("All 4 angles downloaded successfully!");
  }
  return true;
};

/**
 * Download raw uploaded graphic asset file (handles cross-origin blob fetch safely)
 */
export const downloadDirectAsset = async (url, fileName = "graphic-asset.png") => {
  if (!url) return;
  try {
    const response = await fetch(url);
    const blob = await response.blob();
    const blobUrl = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = blobUrl;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(blobUrl), 2000);
  } catch {
    // Direct link fallback
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    link.target = "_blank";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};
