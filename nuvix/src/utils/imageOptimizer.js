/**
 * Image Optimization & Storage Helpers for PrintSphere Studio
 * Prevents localStorage quota exceeded errors, browser freezing, and network payload issues
 * when users upload high-quality/high-resolution images.
 */

/**
 * Optimizes an image (File, Blob, or Data URL) for 2D/3D decal layers.
 * Retains high visual sharpness while scaling down extreme dimensions (e.g. 4000x3000 -> max 1600px)
 * and compressing data URL size (e.g. 20MB -> ~200KB-500KB).
 *
 * @param {File | Blob | string} source - File, Blob, or base64 Data URL
 * @param {object} options
 * @param {number} [options.maxDimension=1600] - Max width or height in pixels
 * @param {number} [options.quality=0.90] - JPEG/WebP quality (0 to 1)
 * @returns {Promise<{ dataUrl: string, width: number, height: number, aspectRatio: number }>}
 */
export const optimizeImageForLayer = async (source, options = {}) => {
  const { maxDimension = 1600, quality = 0.90 } = options;

  let dataUrl = "";
  let isPngOrTransparent = false;

  if (typeof source === "string") {
    dataUrl = source;
    if (dataUrl.startsWith("data:image/png") || dataUrl.startsWith("data:image/webp") || dataUrl.startsWith("data:image/svg")) {
      isPngOrTransparent = true;
    }
  } else if (source instanceof Blob || source instanceof File) {
    if (source.type === "image/png" || source.type === "image/webp" || source.type === "image/svg+xml") {
      isPngOrTransparent = true;
    }
    dataUrl = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(source);
    });
  } else {
    throw new Error("Invalid image source provided to optimizeImageForLayer");
  }

  // If SVG or small preset URL, return as is
  if (dataUrl.startsWith("/images/") || dataUrl.startsWith("/logos/") || dataUrl.startsWith("http://") || dataUrl.startsWith("https://")) {
    return { dataUrl, width: 512, height: 512, aspectRatio: 1 };
  }

  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";

    img.onload = () => {
      const origW = img.naturalWidth || img.width || 1;
      const origH = img.naturalHeight || img.height || 1;
      const aspect = origW / origH;
      const validAspect = isFinite(aspect) && aspect > 0 ? aspect : 1;

      // Check if image is already small enough in dimension and payload
      const maxSide = Math.max(origW, origH);
      const isShortDataUrl = dataUrl.length < 350000; // < ~250KB

      if (maxSide <= maxDimension && isShortDataUrl) {
        resolve({
          dataUrl,
          width: origW,
          height: origH,
          aspectRatio: validAspect
        });
        return;
      }

      // Calculate new scaled dimensions
      let targetW = origW;
      let targetH = origH;
      if (maxSide > maxDimension) {
        if (origW >= origH) {
          targetW = maxDimension;
          targetH = Math.round(maxDimension / validAspect);
        } else {
          targetH = maxDimension;
          targetW = Math.round(maxDimension * validAspect);
        }
      }

      const canvas = document.createElement("canvas");
      canvas.width = targetW;
      canvas.height = targetH;
      const ctx = canvas.getContext("2d");

      if (!ctx) {
        resolve({
          dataUrl,
          width: origW,
          height: origH,
          aspectRatio: validAspect
        });
        return;
      }

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(img, 0, 0, targetW, targetH);

      // Check if image actually has transparent pixels
      let hasAlpha = isPngOrTransparent;
      if (isPngOrTransparent) {
        try {
          const imgData = ctx.getImageData(0, 0, Math.min(targetW, 100), Math.min(targetH, 100)).data;
          let transparentPixelCount = 0;
          for (let i = 3; i < imgData.length; i += 4) {
            if (imgData[i] < 250) {
              transparentPixelCount++;
              break;
            }
          }
          hasAlpha = transparentPixelCount > 0;
        } catch {
          hasAlpha = isPngOrTransparent;
        }
      }

      let optimizedUrl = "";
      if (hasAlpha) {
        // Transparent image -> PNG
        optimizedUrl = canvas.toDataURL("image/png");
      } else {
        // Opaque image -> High quality JPEG for massive size savings
        optimizedUrl = canvas.toDataURL("image/jpeg", quality);
      }

      // Clean up canvas
      canvas.width = 0;
      canvas.height = 0;

      resolve({
        dataUrl: optimizedUrl || dataUrl,
        width: targetW,
        height: targetH,
        aspectRatio: validAspect
      });
    };

    img.onerror = () => {
      // Fallback to original
      resolve({
        dataUrl,
        width: 512,
        height: 512,
        aspectRatio: 1
      });
    };

    img.src = dataUrl;
  });
};

/**
 * Creates a lightweight, high-performance thumbnail (max 320px, ~15-30KB)
 * for saving to database, carts, and order history.
 *
 * @param {Array} layerList - List of design layers
 * @param {number} [maxSize=320]
 * @returns {string} Compact Data URL or fallback path
 */
export const createDesignThumbnail = (layerList, maxSize = 320) => {
  const visibleLayers = (layerList || []).filter((l) => l.visible !== false);
  const imgLayer = visibleLayers.find(
    (l) => (l.type === "image" || l.type === "logo") && l.url && l.url !== "/images/dumyImage.png"
  );

  if (imgLayer && imgLayer.url) {
    // If it's already an external/static path, return it directly
    if (imgLayer.url.startsWith("/images/") || imgLayer.url.startsWith("/logos/")) {
      return imgLayer.url;
    }

    try {
      const img = new Image();
      img.src = imgLayer.url;
      if (img.complete && img.naturalWidth > 0) {
        const canvas = document.createElement("canvas");
        const aspect = (img.naturalWidth || 1) / (img.naturalHeight || 1);
        const w = aspect >= 1 ? maxSize : Math.round(maxSize * aspect);
        const h = aspect >= 1 ? Math.round(maxSize / aspect) : maxSize;
        canvas.width = Math.max(32, w);
        canvas.height = Math.max(32, h);
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = "high";
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          const thumb = canvas.toDataURL("image/jpeg", 0.82);
          canvas.width = 0;
          canvas.height = 0;
          return thumb;
        }
      }
    } catch (e) {
      console.warn("Error downscaling image thumbnail:", e);
    }
    // If sync downscaling didn't complete, check if url is reasonably sized
    if (imgLayer.url.length < 500000) {
      return imgLayer.url;
    }
  }

  const textLayer = visibleLayers.find((l) => l.type === "text" && l.text);
  if (textLayer) {
    try {
      const canvas = document.createElement("canvas");
      canvas.width = 400;
      canvas.height = 200;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.clearRect(0, 0, 400, 200);
        const fontStyle = [
          textLayer.italic ? "italic" : "",
          textLayer.bold ? "bold" : "",
          "38px",
          `"${textLayer.fontFamily || "Inter"}", sans-serif`
        ]
          .filter(Boolean)
          .join(" ");
        ctx.font = fontStyle;
        ctx.fillStyle = textLayer.color || "#1e293b";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(textLayer.text.substring(0, 30), 200, 100);
        const thumb = canvas.toDataURL("image/png");
        canvas.width = 0;
        canvas.height = 0;
        return thumb;
      }
    } catch (err) {
      console.error("Error creating text thumbnail:", err);
    }
  }

  return "/images/dumyImage.png";
};

/**
 * Safely saves data to localStorage without crashing the application on QuotaExceededError.
 * Automatically clears non-critical caches and trims lists if quota is tight.
 *
 * @param {string} key
 * @param {any} value
 * @returns {boolean} Whether the item was saved successfully
 */
export const safeLocalStorage = {
  getItem: (key, fallback = null) => {
    try {
      if (typeof window === "undefined") return fallback;
      const item = localStorage.getItem(key);
      if (!item) return fallback;
      try {
        return JSON.parse(item);
      } catch {
        return item;
      }
    } catch (err) {
      console.error(`safeLocalStorage.getItem error for key ${key}:`, err);
      return fallback;
    }
  },

  setItem: (key, value) => {
    if (typeof window === "undefined") return false;
    const stringVal = typeof value === "string" ? value : JSON.stringify(value);

    try {
      localStorage.setItem(key, stringVal);
      return true;
    } catch (primaryErr) {
      console.warn(`localStorage quota warning on setting key "${key}". Attempting cleanup...`, primaryErr);

      // 1. Clean up known non-critical heavy caches
      try {
        localStorage.removeItem("printsphere_user_images_guest");
        // Clean any stale custom designs
        localStorage.removeItem("load_custom_design");
      } catch {}

      // 2. Retry direct set
      try {
        localStorage.setItem(key, stringVal);
        return true;
      } catch (retryErr) {
        console.warn(`Secondary write failed for key "${key}". Trimming further...`, retryErr);
      }

      // 3. If saving printsphere_cart, strip heavy redundant fields from cart items if needed
      if (key === "printsphere_cart" && Array.isArray(value)) {
        try {
          const leanCart = value.map((item) => {
            if (!item.layers) return item;
            return {
              ...item,
              // Keep thumbnail image compact
              image: item.image?.length > 200000 ? "/images/dumyImage.png" : item.image,
              layers: item.layers.map((l) => ({
                id: l.id,
                type: l.type,
                name: l.name,
                url: l.url?.length > 400000 ? l.url.substring(0, 400000) : l.url,
                text: l.text,
                fontFamily: l.fontFamily,
                color: l.color,
                bold: l.bold,
                italic: l.italic,
                visible: l.visible,
                locked: l.locked,
                position: l.position,
                rotation: l.rotation,
                scale: l.scale,
                aspectRatio: l.aspectRatio
              }))
            };
          });
          localStorage.setItem(key, JSON.stringify(leanCart));
          return true;
        } catch (cartErr) {
          console.error("Failed to save even pruned cart:", cartErr);
        }
      }

      return false;
    }
  },

  removeItem: (key) => {
    try {
      if (typeof window !== "undefined") {
        localStorage.removeItem(key);
      }
    } catch (err) {
      console.error(`safeLocalStorage.removeItem error for key ${key}:`, err);
    }
  }
};
