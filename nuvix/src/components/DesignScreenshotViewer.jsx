import React, { useState, useMemo } from "react";
import { Download, Sparkles, Layers, Check, Loader2, Type, Image as ImageIcon, FolderDown } from "lucide-react";
import {
  downloadDirectAsset,
  downloadAllDecalsAsZip,
  renderTextLayerToBlob
} from "../utils/tshirtPreviewExporter";
import { alertAction } from "../context/ConfirmContext";

export default function DesignScreenshotViewer({
  item,
  orderId,
  onOpen3DModal
}) {
  const [downloadSuccessMsg, setDownloadSuccessMsg] = useState("");
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState("");
  const [downloadingLayerId, setDownloadingLayerId] = useState(null);

  const isCustom = item.itemType === "Customized" || Boolean(item.designId);
  const design = (typeof item.designId === "object" && item.designId !== null) ? item.designId : {};
  const product = (typeof item.productId === "object" && item.productId !== null) ? item.productId : {};

  const color = design.fabricColor || item.selectedColor || item.color || "#ffffff";
  const rawLayers = design.layers?.length ? design.layers : (item.layers || []);
  const thumbnail = design.thumbnailUrl || product.images?.[0] || item.image || item.designUrl || "/images/dumyImage.png";
  const title = isCustom ? (design.tShirtType || item.tShirtStyle || "Custom T-Shirt") : (product.title || item.tShirtStyle || "T-Shirt");
  const orderShortId = orderId ? orderId.slice(-6) : "order";
  const safeTitle = title.toLowerCase().replace(/[^a-z0-9]/gi, "-");

  // Normalized decal layers list
  const decalLayers = useMemo(() => {
    if (rawLayers && rawLayers.length > 0) {
      return rawLayers.filter((l) => l && l.visible !== false);
    }
    if (thumbnail && thumbnail !== "/images/dumyImage.png") {
      return [
        {
          id: "primary-graphic",
          type: "image",
          name: "Custom Graphic Artwork",
          url: thumbnail,
          view: "front"
        }
      ];
    }
    return [];
  }, [rawLayers, thumbnail]);

  const productData = useMemo(() => {
    return {
      _id: isCustom ? (design._id || `custom-${item._id || orderId}`) : (product._id || `prod-${item._id || orderId}`),
      title: title,
      tShirtType: design.tShirtType || item.tShirtStyle || product.title || "Crew Neck T-Shirt",
      modelPath: design.modelPath || item.modelPath || product.modelPath || "/images/models/male normal t-shirt1.glb",
      fabricColor: color,
      material: design.material || item.gsm || item.material || "180GSM Cotton",
      size: item.selectedSize || item.size || "M",
      layers: decalLayers,
      thumbnailUrl: thumbnail,
      images: thumbnail ? [thumbnail] : [],
      colors: [color]
    };
  }, [design, item, orderId, product, isCustom, title, color, decalLayers, thumbnail]);

  // Handle single decal download
  const handleDownloadSingleDecal = async (layer, idx) => {
    const layerKey = layer.id || `layer-${idx}`;
    setDownloadingLayerId(layerKey);

    try {
      const view = layer.view || "front";
      const layerName = (layer.name || `decal-${idx + 1}`).replace(/[^a-z0-9]/gi, "-").toLowerCase();

      if (layer.type === "text") {
        const textBlob = await renderTextLayerToBlob(layer);
        if (textBlob) {
          const url = URL.createObjectURL(textBlob);
          const link = document.createElement("a");
          link.href = url;
          link.download = `${orderShortId}-${view}-${layerName}-text.png`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          setTimeout(() => URL.revokeObjectURL(url), 2000);
        }
      } else {
        const imgUrl = layer.url || layer.image || layer.src || thumbnail;
        if (imgUrl && imgUrl !== "/images/dumyImage.png") {
          await downloadDirectAsset(imgUrl, `${orderShortId}-${view}-${layerName}-graphic.png`);
        }
      }
    } catch (err) {
      console.error("Error downloading decal:", err);
      alertAction({
        title: "Download Failed",
        message: "Failed to download this graphic asset. Please try again.",
        type: "danger"
      });
    } finally {
      setDownloadingLayerId(null);
    }
  };

  // Handle downloading all decals packed into a ZIP folder
  const handleDownloadAllDecals = async () => {
    if (decalLayers.length === 0) {
      alertAction({
        title: "No Decals Available",
        message: "There are no graphic or text decal assets to download for this garment.",
        type: "info"
      });
      return;
    }

    setIsDownloading(true);
    setDownloadProgress("Packaging decals folder...");

    try {
      await downloadAllDecalsAsZip({
        layers: decalLayers,
        designUrl: thumbnail,
        title: safeTitle,
        orderShortId,
        onProgress: (msg) => setDownloadProgress(msg)
      });

      setDownloadSuccessMsg(`Decals folder downloaded (${decalLayers.length} assets)!`);
      setTimeout(() => setDownloadSuccessMsg(""), 3500);
    } catch (err) {
      console.error("Download all decals error:", err);
      alertAction({
        title: "Decals Download Failed",
        message: err.message || "Failed to download decals zip package.",
        type: "danger"
      });
    } finally {
      setIsDownloading(false);
      setDownloadProgress("");
    }
  };

  return (
    <div className="bg-slate-50/80 border border-slate-200/80 rounded-2xl p-3 space-y-3 select-none shadow-2xs">
      
      {/* Header: Decals Title + Inspector + Download All Decals Button */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200/70 pb-2.5">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-indigo-100/70 text-indigo-700 rounded-lg">
            <Layers className="h-4 w-4" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-black text-slate-900 uppercase tracking-wide">
                Graphic Decals
              </span>
              <span className="px-2 py-0.2 bg-indigo-50 border border-indigo-200 text-indigo-700 text-[10px] font-black rounded-full">
                {decalLayers.length} {decalLayers.length === 1 ? "Asset" : "Assets"}
              </span>
            </div>
            <p className="text-[10px] text-slate-500 font-medium">
              High-resolution print artwork & 3D model
            </p>
          </div>
        </div>

        {/* Action Buttons: Inspector & Download All Decals Folder */}
        <div className="flex items-center gap-1.5">
          {onOpen3DModal && (
            <button
              type="button"
              onClick={() => onOpen3DModal(productData)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 active:scale-95 border border-indigo-200 text-indigo-700 text-xs font-bold rounded-xl transition cursor-pointer shadow-2xs"
              title="Open interactive 3D model inspector"
            >
              <Sparkles className="h-3.5 w-3.5 text-indigo-600 animate-pulse" />
              <span>Inspector</span>
            </button>
          )}

          {decalLayers.length > 0 && (
            <button
              type="button"
              disabled={isDownloading}
              onClick={handleDownloadAllDecals}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white text-xs font-extrabold rounded-xl transition shadow-2xs disabled:opacity-50 cursor-pointer"
              title="Download all decal files in a single zip folder"
            >
              {isDownloading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin text-white" />
              ) : (
                <FolderDown className="h-3.5 w-3.5" />
              )}
              <span>Download All Decals (ZIP)</span>
            </button>
          )}
        </div>
      </div>

      {/* Decals List */}
      {decalLayers.length === 0 ? (
        <div className="py-3 px-4 bg-white rounded-xl border border-slate-200/60 text-center text-xs text-slate-400 italic">
          No graphic or text decals applied to this product.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {decalLayers.map((layer, idx) => {
            const layerKey = layer.id || `layer-${idx}`;
            const isText = layer.type === "text";
            const isLayerDownloading = downloadingLayerId === layerKey;
            const viewTag = (layer.view || "front").toUpperCase();
            const displayName = layer.name || (isText ? `Text: "${layer.text}"` : `Decal Graphic ${idx + 1}`);

            return (
              <div
                key={layerKey}
                className="bg-white p-2.5 rounded-xl border border-slate-200/80 shadow-2xs hover:border-indigo-200 transition flex items-center justify-between gap-2.5"
              >
                {/* Thumbnail / Icon */}
                <div className="h-11 w-11 rounded-lg bg-slate-50 border border-slate-200/80 flex items-center justify-center overflow-hidden shrink-0 relative">
                  {isText ? (
                    <div className="flex flex-col items-center justify-center p-1 text-center">
                      <Type className="h-4 w-4 text-indigo-600" />
                      <span className="text-[7px] font-black text-slate-600 uppercase tracking-tighter truncate max-w-full">
                        Text
                      </span>
                    </div>
                  ) : (
                    <img
                      src={layer.url || layer.image || layer.src || thumbnail}
                      alt={displayName}
                      className="h-full w-full object-contain p-0.5"
                      onError={(e) => {
                        e.currentTarget.src = "/images/dumyImage.png";
                      }}
                    />
                  )}
                </div>

                {/* Layer Details */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="px-1.5 py-0.2 bg-slate-100 border border-slate-200 text-slate-700 text-[9px] font-black rounded-md uppercase">
                      {viewTag}
                    </span>
                    <p className="font-extrabold text-slate-900 text-xs truncate capitalize" title={displayName}>
                      {displayName}
                    </p>
                  </div>
                  <p className="text-[10px] text-slate-400 font-semibold truncate mt-0.5">
                    {isText
                      ? `Font: ${layer.fontFamily || "Inter"}`
                      : "High-Res Graphic PNG"}
                  </p>
                </div>

                {/* Individual Download Button */}
                <button
                  type="button"
                  disabled={isLayerDownloading}
                  onClick={() => handleDownloadSingleDecal(layer, idx)}
                  className="p-1.5 bg-slate-50 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 text-slate-600 hover:text-indigo-600 rounded-lg text-xs font-bold transition flex items-center justify-center shrink-0 cursor-pointer disabled:opacity-50"
                  title="Download this decal asset"
                >
                  {isLayerDownloading ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-indigo-600" />
                  ) : (
                    <Download className="h-3.5 w-3.5" />
                  )}
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Progress & Success Alerts */}
      {isDownloading && (
        <div className="p-2 bg-indigo-50 border border-indigo-200 text-indigo-800 text-xs font-bold rounded-xl flex items-center gap-2 animate-pulse">
          <Loader2 className="h-4 w-4 animate-spin text-indigo-600 shrink-0" />
          <span>{downloadProgress || "Packaging all decals folder..."}</span>
        </div>
      )}

      {downloadSuccessMsg && (
        <div className="p-2 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold rounded-xl flex items-center justify-between animate-in fade-in duration-200">
          <div className="flex items-center gap-1.5">
            <Check className="h-4 w-4 text-emerald-600 shrink-0" />
            <span>{downloadSuccessMsg}</span>
          </div>
        </div>
      )}
    </div>
  );
}
