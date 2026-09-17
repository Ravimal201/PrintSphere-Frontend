import React, { useState, useMemo, useCallback, useRef } from "react";
import { Download, Sparkles, Layers, Check, Loader2, Image as ImageIcon } from "lucide-react";
import Store3DCardPreview, {
  snapshotCache,
  get3DSnapshotCacheKey
} from "./Store3DCardPreview";
import {
  downloadDirectAsset,
  download3DSnapshotWithFormat
} from "../utils/tshirtPreviewExporter";
import { render3DDesignToDataUrl } from "../utils/tshirt3DExporter";

export default function DesignScreenshotViewer({
  item,
  orderId,
  onOpen3DModal
}) {
  const [downloadFormat, setDownloadFormat] = useState("png"); // "png" | "jpg" | "webp"
  const [downloadSuccessMsg, setDownloadSuccessMsg] = useState("");
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState("");
  const [capturedSnapshots, setCapturedSnapshots] = useState({});

  const containerRef = useRef(null);

  const isCustom = item.itemType === "Customized" || Boolean(item.designId);
  const design = (typeof item.designId === "object" && item.designId !== null) ? item.designId : {};
  const product = (typeof item.productId === "object" && item.productId !== null) ? item.productId : {};

  const color = design.fabricColor || item.selectedColor || item.color || "#ffffff";
  const layers = design.layers?.length ? design.layers : (item.layers || []);
  const thumbnail = design.thumbnailUrl || product.images?.[0] || item.image || item.designUrl || "/images/dumyImage.png";
  const title = isCustom ? (design.tShirtType || item.tShirtStyle || "Custom T-Shirt") : (product.title || item.tShirtStyle || "T-Shirt");
  const orderShortId = orderId ? orderId.slice(-6) : "order";
  const safeTitle = title.toLowerCase().replace(/[^a-z0-9]/gi, "-");

  const productData = useMemo(() => {
    return {
      _id: isCustom ? (design._id || `custom-${item._id || orderId}`) : (product._id || `prod-${item._id || orderId}`),
      title: title,
      tShirtType: design.tShirtType || item.tShirtStyle || product.title || "Crew Neck T-Shirt",
      modelPath: design.modelPath || item.modelPath || product.modelPath || "/images/models/male normal t-shirt1.glb",
      fabricColor: color,
      material: design.material || item.gsm || item.material || "180GSM Cotton",
      size: item.selectedSize || item.size || "M",
      layers: layers.length > 0 ? layers : (thumbnail && thumbnail !== "/images/dumyImage.png" ? [
        {
          id: "logo-layer",
          type: "image",
          name: "Custom Logo",
          url: thumbnail,
          visible: true,
          position: [0, 0.1, 0.15],
          rotation: [0, 0, 0],
          scale: [0.35, 0.35, 0.35]
        }
      ] : []),
      thumbnailUrl: thumbnail,
      images: thumbnail ? [thumbnail] : [],
      colors: [color]
    };
  }, [design, item, orderId, product, isCustom, title, color, layers, thumbnail]);

  const handleSnapshotReady = useCallback((angle, dataUrl) => {
    if (dataUrl && dataUrl.length > 5000) {
      setCapturedSnapshots((prev) => ({ ...prev, [angle]: dataUrl }));
    }
  }, []);

  const getOrGenerate3DSnapshot = async (angle) => {
    if (capturedSnapshots[angle] && capturedSnapshots[angle].length > 5000) {
      return capturedSnapshots[angle];
    }
    const cacheKey = get3DSnapshotCacheKey(productData, color, angle);
    const cached = snapshotCache.get(cacheKey);
    if (cached && cached.length > 5000) {
      return cached;
    }

    const renderedUrl = await render3DDesignToDataUrl({
      modelPath: productData.modelPath,
      fabricColor: color,
      layers: productData.layers,
      viewAngle: angle,
      width: 1400,
      height: 1400,
      transparentBg: downloadFormat === "png"
    });

    if (renderedUrl && renderedUrl.length > 5000) {
      snapshotCache.set(cacheKey, renderedUrl);
      setCapturedSnapshots((prev) => ({ ...prev, [angle]: renderedUrl }));
      return renderedUrl;
    }

    return null;
  };

  const handleDownloadAll3DAngles = async () => {
    setIsDownloading(true);
    setDownloadProgress(`Preparing 3D views (${downloadFormat.toUpperCase()})...`);

    const anglesToDownload = [
      { id: "front", label: "Front" },
      { id: "back", label: "Back" },
      { id: "left", label: "Left Side" },
      { id: "right", label: "Right Side" }
    ];

    try {
      for (let i = 0; i < anglesToDownload.length; i++) {
        const { id, label } = anglesToDownload[i];
        setDownloadProgress(`Rendering ${label} [${i + 1}/4]...`);

        const dataUrl = await getOrGenerate3DSnapshot(id);
        const baseName = `${orderShortId}-${safeTitle}-${id}-3d-view`;

        if (dataUrl) {
          await download3DSnapshotWithFormat(dataUrl, baseName, downloadFormat);
        }
        await new Promise((res) => setTimeout(res, 200));
      }

      setDownloadSuccessMsg(`Downloaded all 4 3D views (${downloadFormat.toUpperCase()})!`);
      setTimeout(() => setDownloadSuccessMsg(""), 3000);
    } catch (err) {
      console.error("3D views download error:", err);
      alert("Error downloading 3D views. Please try again.");
    } finally {
      setIsDownloading(false);
      setDownloadProgress("");
    }
  };

  const angles = [
    { id: "front", label: "Front" },
    { id: "back", label: "Back" },
    { id: "left", label: "Left" },
    { id: "right", label: "Right" }
  ];

  return (
    <div ref={containerRef} className="bg-slate-50/70 border border-slate-200/80 rounded-xl p-2.5 space-y-2.5 select-none">
      
      {/* Compact Header: 3D Views Title + Format Pill + Download All Button */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200/70 pb-2">
        <div className="flex items-center gap-1.5">
          <ImageIcon className="h-3.5 w-3.5 text-indigo-600" />
          <span className="text-[11px] font-extrabold text-slate-800 uppercase tracking-wide">
            3D Views
          </span>
          <span className="text-[10px] text-slate-400 font-medium">
            (4 angles)
          </span>
        </div>

        {/* Action controls */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {/* Format selector */}
          <div className="flex items-center bg-white border border-slate-200 rounded-lg p-0.5 text-[9px] font-bold text-slate-600 shadow-2xs">
            <span className="px-1 text-[8px] text-slate-400 font-extrabold uppercase">Fmt:</span>
            {["png", "jpg", "webp"].map((fmt) => (
              <button
                key={fmt}
                type="button"
                onClick={() => setDownloadFormat(fmt)}
                className={`px-1.5 py-0.5 rounded text-[9px] uppercase font-black transition cursor-pointer ${
                  downloadFormat === fmt
                    ? "bg-slate-900 text-white shadow-2xs"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                }`}
              >
                {fmt}
              </button>
            ))}
          </div>

          {onOpen3DModal && (
            <button
              type="button"
              onClick={() => onOpen3DModal(productData)}
              className="inline-flex items-center gap-1 px-2 py-1 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-700 text-[10px] font-bold rounded-lg transition cursor-pointer"
              title="Open interactive 3D model inspector"
            >
              <Sparkles className="h-3 w-3 text-indigo-600 animate-pulse" />
              <span>Inspector</span>
            </button>
          )}

          {/* Download all views button */}
          <button
            type="button"
            disabled={isDownloading}
            onClick={handleDownloadAll3DAngles}
            className="inline-flex items-center gap-1 px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white text-[10px] font-extrabold rounded-lg transition shadow-2xs disabled:opacity-50 cursor-pointer"
            title={`Download all 4 views as .${downloadFormat}`}
          >
            {isDownloading ? (
              <Loader2 className="h-3 w-3 animate-spin text-white" />
            ) : (
              <Download className="h-3 w-3" />
            )}
            <span>Download All ({downloadFormat.toUpperCase()})</span>
          </button>
        </div>
      </div>

      {/* 4 Small, Compact 3D View Thumbnails in a single row */}
      <div className="grid grid-cols-4 gap-1.5">
        {angles.map(({ id, label }) => (
          <div
            key={id}
            className="bg-white p-1 rounded-lg border border-slate-200/80 flex flex-col items-center justify-between shadow-2xs hover:border-indigo-300 transition"
          >
            <span className="text-[9px] font-extrabold text-slate-500 uppercase tracking-tight mb-0.5">
              {label}
            </span>
            <div className="h-20 w-full flex items-center justify-center overflow-hidden rounded bg-slate-50/50">
              <Store3DCardPreview
                product={productData}
                activeColor={color}
                fixedView={id}
                showControls={false}
                hideBadge={true}
                className="h-full w-full !border-0 !shadow-none !bg-transparent !p-0.5 cursor-default"
                onSnapshotReady={handleSnapshotReady}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Downloading / Success Message */}
      {isDownloading && (
        <div className="p-1.5 bg-indigo-50 border border-indigo-200 text-indigo-800 text-[10px] font-bold rounded-lg flex items-center gap-1.5 animate-pulse">
          <Loader2 className="h-3 w-3 animate-spin text-indigo-600" />
          <span>{downloadProgress || "Rendering 3D views..."}</span>
        </div>
      )}

      {downloadSuccessMsg && (
        <div className="p-1.5 bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-bold rounded-lg flex items-center justify-between animate-in fade-in duration-200">
          <span className="flex items-center gap-1">
            <Check className="h-3 w-3 text-emerald-600" />
            {downloadSuccessMsg}
          </span>
        </div>
      )}

      {/* Original Decal Graphic Source Downloads (if custom decals exist) */}
      {(() => {
        const imgLayers = productData.layers.filter((l) => (l.type === "image" || l.type === "logo") && l.url && l.url !== "/images/dumyImage.png");
        if (imgLayers.length === 0) return null;

        return (
          <div className="pt-1.5 border-t border-dashed border-slate-200 space-y-1">
            <span className="text-[9px] font-black uppercase text-slate-400 tracking-wide flex items-center gap-1">
              <Layers className="h-2.5 w-2.5 text-slate-400" />
              Graphic Decals ({imgLayers.length}):
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
              {imgLayers.map((layer, lIdx) => (
                <div
                  key={lIdx}
                  className="flex items-center justify-between bg-white px-2 py-1 rounded border border-slate-200/80 text-[9px]"
                >
                  <div className="flex items-center gap-1.5 min-w-0 pr-1">
                    <img
                      src={layer.url}
                      alt={layer.name || "Asset"}
                      className="h-4 w-4 object-contain bg-slate-50 rounded border shrink-0"
                      onError={(e) => (e.target.style.display = "none")}
                    />
                    <span className="font-semibold text-slate-700 truncate max-w-[100px]">
                      {layer.name || `Asset #${lIdx + 1}`}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => downloadDirectAsset(layer.url, `${orderShortId}-graphic-asset-${lIdx + 1}.png`)}
                    className="text-indigo-600 hover:text-indigo-800 font-bold flex items-center gap-0.5 hover:underline shrink-0 bg-indigo-50 px-1.5 py-0.5 rounded cursor-pointer"
                    title="Download original high-res asset file"
                  >
                    <Download className="h-2 w-2" /> Decal
                  </button>
                </div>
              ))}
            </div>
          </div>
        );
      })()}
    </div>
  );
}
