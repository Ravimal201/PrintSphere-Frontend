import { removeBackground } from "@imgly/background-removal";

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
    const config = {
      progress: (key, current, total) => {
        if (typeof onProgress === "function") {
          onProgress({ key, current, total, percentage: total > 0 ? Math.round((current / total) * 100) : 0 });
        }
      },
      ...options
    };

    const blob = await removeBackground(imageSource, config);
    const dataUrl = await blobToDataURL(blob);
    return dataUrl;
  } catch (error) {
    console.error("AI Background Removal Error:", error);
    throw error;
  }
};
