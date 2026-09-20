import { removeBackground } from "@imgly/background-removal";
import { optimizeImageForLayer } from "./imageOptimizer";

/**
 * Converts a Blob to a base64 Data URL
 * @param {Blob} blob 
 * @returns {Promise<string>}
 */
export const blobToDataURL = (blob) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

/**
 * Removes the background of an image using client-side AI (WebAssembly/ONNX)
 * @param {string | Blob | File | HTMLImageElement} imageSource - URL, base64 DataURL, Blob, or File
 * @param {object} options - Optional configuration options for imgly
 * @param {function} [onProgress] - Optional progress callback (key, current, total)
 * @returns {Promise<string>} Transparent PNG base64 Data URL
 */
export const removeImageBackground = async (imageSource, options = {}, onProgress = null) => {
  try {
    let preprocessedSource = imageSource;

    // Pre-scale extremely high-res images to max 1600px so ONNX doesn't run out of memory
    if (typeof imageSource === "string" && imageSource.startsWith("data:image")) {
      const opt = await optimizeImageForLayer(imageSource, { maxDimension: 1600 });
      preprocessedSource = opt.dataUrl;
    }

    const config = {
      progress: (key, current, total) => {
        if (typeof onProgress === "function") {
          onProgress({ key, current, total, percentage: total > 0 ? Math.round((current / total) * 100) : 0 });
        }
      },
      ...options
    };

    const blob = await removeBackground(preprocessedSource, config);
    const dataUrl = await blobToDataURL(blob);
    
    // Optimize the resulting transparent PNG to keep storage and layers light
    const finalOpt = await optimizeImageForLayer(dataUrl, { maxDimension: 1600 });
    return finalOpt.dataUrl || dataUrl;
  } catch (error) {
    console.error("AI Background Removal Error:", error);
    throw error;
  }
};

