import React, { useState, useMemo, useCallback, useRef } from "react";
import { Download, Sparkles, Layers, Check, Loader2, Image as ImageIcon, FileCode } from "lucide-react";
import Store3DCardPreview, {
  snapshotCache,
  get3DSnapshotCacheKey
} from "./Store3DCardPreview";
import {
  downloadDirectAsset,
  download3DSnapshotWithFormat,
  downloadDesignAsJson
} from "../utils/tshirtPreviewExporter";
import { render3DDesignToDataUrl } from "../utils/tshirt3DExporter";

export default function DesignScreenshotViewer({
  item,
  orderId,
  onOpen3DModal
}) {
  const [activeAngle, setActiveAngle] = useState("all"); // "front" | "back" | "left" | "right" | "all"
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

  // Normalized product data structure for Store3DCardPreview & 3D Inspector & JSON Export
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

  // Retrieve cached 3D snapshot or generate true 3D render on-demand
  const getOrGenerate3DSnapshot = async (angle) => {
    if (capturedSnapshots[angle] && capturedSnapshots[angle].length > 5000) {
      return capturedSnapshots[angle];
    }
    const cacheKey = get3DSnapshotCacheKey(productData, color, angle);
    const cached = snapshotCache.get(cacheKey);
    if (cached && cached.length > 5000) {
      return cached;
    }

    // Generate high-definition true 3D render using Three.js WebGL Offscreen engine
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

  // Download single angle real 3D design snapshot
  const handleDownloadSingle3DAngle = async (angle) => {
    setIsDownloading(true);
    setDownloadProgress(`Rendering 3D ${angle.toUpperCase()} (${downloadFormat.toUpperCase()})...`);

    const baseName = `${orderShortId}-${safeTitle}-${angle}-3d-view`;
    const dataUrl = await getOrGenerate3DSnapshot(angle);

    if (dataUrl) {
      await download3DSnapshotWithFormat(dataUrl, baseName, downloadFormat);
      setDownloadSuccessMsg(`Downloaded real 3D ${angle.toUpperCase()} (${downloadFormat.toUpperCase()}) design!`);
      setTimeout(() => setDownloadSuccessMsg(""), 3000);
    } else {
      alert("Error generating 3D design render. Please try again.");
    }

    setIsDownloading(false);
    setDownloadProgress("");
  };

  // Download all 4 angles (Front, Back, Left Side, Right Side) real 3D design snapshots
  const handleDownloadAll3DAngles = async () => {
    setIsDownloading(true);
    setDownloadProgress(`Generating 4-angle 3D pack in ${downloadFormat.toUpperCase()}...`);

    const angles = [
      { id: "front", label: "Front" },
      { id: "back", label: "Back" },
      { id: "left", label: "Left Side" },
      { id: "right", label: "Right Side" }
    ];

    try {
      for (let i = 0; i < angles.length; i++) {
        const { id, label } = angles[i];
        setDownloadProgress(`Rendering 3D ${label} (${downloadFormat.toUpperCase()}) (${i + 1}/4)...`);

        const dataUrl = await getOrGenerate3DSnapshot(id);
        const baseName = `${orderShortId}-${safeTitle}-${id}-3d-view`;

        if (dataUrl) {
          await download3DSnapshotWithFormat(dataUrl, baseName, downloadFormat);
        }
        await new Promise((res) => setTimeout(res, 300));
      }

      setDownloadSuccessMsg(`Downloaded all 4 real 3D angle views (${downloadFormat.toUpperCase()})!`);
      setTimeout(() => setDownloadSuccessMsg(""), 3500);
    } catch (err) {
      console.error("Batch 3D angle download error:", err);
      alert("Error downloading 3D angle pack.");
    } finally {
      setIsDownloading(false);
      setDownloadProgress("");
    }
  };

  // Download complete design specification JSON
  const handleDownloadJsonSpec = () => {
    const success = downloadDesignAsJson(productData, `${orderShortId}-${safeTitle}-blueprint.json`);
    if (success) {
      setDownloadSuccessMsg("Downloaded design blueprint specification JSON!");
      setTimeout(() => setDownloadSuccessMsg(""), 3000);
    }
  };

  const anglesList = [
    { id: "front", label: "Front (3D)" },
    { id: "back", label: "Back (3D)" },
    { id: "left", label: "Left Side (3D)" },
    { id: "right", label: "Right Side (3D)" },
    { id: "all", label: "All Angles (4 Views)" }
  ];

  return (
    <div ref={containerRef} className="bg-slate-50/80 border border-slate-200/90 rounded-2xl p-3.5 space-y-3.5 select-none">
      
      {/* Header with Angle Selectors, Format Selection & Actions */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 border-b border-slate-200/80 pb-2.5">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider mr-1 flex items-center gap-1">
            <ImageIcon className="h-3 w-3 text-indigo-500" />
            3D Views:
          </span>
          {anglesList.map((a) => (
            <button
              key={a.id}
              onClick={() => setActiveAngle(a.id)}
              className={`px-2.5 py-1 text-[10px] font-black uppercase rounded-lg border transition cursor-pointer ${
                activeAngle === a.id
                  ? "bg-indigo-600 border-indigo-700 text-white shadow-xs"
                  : "bg-white border-slate-200 text-slate-600 hover:bg-slate-100"
              }`}
            >
              {a.label}
            </button>
          ))}
        </div>

        {/* Format Selector & Global Download Actions */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Format selector */}
          <div className="flex items-center bg-white border border-slate-200 rounded-lg p-0.5 text-[10px] font-bold text-slate-600 shadow-2xs">
            <span className="px-1.5 text-[9px] text-slate-400 font-extrabold uppercase">Format:</span>
            {["png", "jpg", "webp"].map((fmt) => (
              <button
                key={fmt}
                onClick={() => setDownloadFormat(fmt)}
                className={`px-2 py-0.5 rounded-md uppercase font-black transition cursor-pointer ${
                  downloadFormat === fmt
                    ? "bg-slate-900 text-white shadow-2xs"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                }`}
              >
                {fmt}
              </button>
            ))}
          </div>

          {/* Export JSON Spec */}
          <button
            onClick={handleDownloadJsonSpec}
            className="inline-flex items-center gap-1 px-2.5 py-1 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 text-[10px] font-bold rounded-lg transition shadow-2xs cursor-pointer"
            title="Download full 3D design blueprint JSON file with layer coordinates and specs"
          >
            <FileCode className="h-3 w-3 text-slate-500" />
            JSON Spec
          </button>

          {onOpen3DModal && (
            <button
              onClick={() => onOpen3DModal(productData)}
              className="inline-flex items-center gap-1 px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-700 text-[10px] font-bold rounded-lg transition cursor-pointer"
              title="Open interactive 3D model inspector"
            >
              <Sparkles className="h-3 w-3 text-indigo-600 animate-pulse" />
              3D Inspector
            </button>
          )}

          <button
            disabled={isDownloading}
            onClick={handleDownloadAll3DAngles}
            className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-white text-[10px] font-bold rounded-lg transition shadow-2xs disabled:opacity-50 cursor-pointer"
            title={`Download all 4 real 3D frozen snapshots as .${downloadFormat}`}
          >
            {isDownloading ? (
              <Loader2 className="h-3 w-3 animate-spin text-indigo-400" />
            ) : (
              <Download className="h-3 w-3" />
            )}
            Download All 3D ({downloadFormat.toUpperCase()})
          </button>
        </div>
      </div>

      {/* Main 3D Multi-Angle Display Area */}
      {activeAngle === "all" ? (
        /* 4 Columns: Front, Back, Left Side, Right Side 3D Previews */
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {/* Front 3D */}
          <div className="bg-white p-2 rounded-xl border border-slate-200 flex flex-col items-center justify-between group hover:border-indigo-300 transition shadow-2xs">
            <div className="w-full flex items-center justify-between text-[10px] font-extrabold text-slate-600 mb-1 px-1">
              <span>Front (3D)</span>
              <button
                disabled={isDownloading}
                onClick={() => handleDownloadSingle3DAngle("front")}
                className="p-1 text-indigo-600 hover:bg-indigo-50 rounded-md transition cursor-pointer disabled:opacity-50"
                title={`Download real 3D Front View (.${downloadFormat})`}
              >
                <Download className="h-3 w-3" />
              </button>
            </div>
            <div className="h-32 w-full flex items-center justify-center overflow-hidden rounded-lg bg-slate-50/50">
              <Store3DCardPreview
                product={productData}
                activeColor={color}
                fixedView="front"
                showControls={false}
                hideBadge={true}
                className="h-full w-full !border-0 !shadow-none !bg-transparent !p-1 cursor-default"
                onSnapshotReady={handleSnapshotReady}
              />
            </div>
            <button
              disabled={isDownloading}
              onClick={() => handleDownloadSingle3DAngle("front")}
              className="mt-1.5 w-full py-1 bg-slate-50 hover:bg-indigo-50 border border-slate-100 hover:border-indigo-200 text-indigo-600 text-[9px] font-bold rounded-lg transition flex items-center justify-center gap-1 cursor-pointer disabled:opacity-50"
            >
              <Download className="h-2.5 w-2.5" /> Download Front (3D)
            </button>
          </div>

          {/* Back 3D */}
          <div className="bg-white p-2 rounded-xl border border-slate-200 flex flex-col items-center justify-between group hover:border-indigo-300 transition shadow-2xs">
            <div className="w-full flex items-center justify-between text-[10px] font-extrabold text-slate-600 mb-1 px-1">
              <span>Back (3D)</span>
              <button
                disabled={isDownloading}
                onClick={() => handleDownloadSingle3DAngle("back")}
                className="p-1 text-indigo-600 hover:bg-indigo-50 rounded-md transition cursor-pointer disabled:opacity-50"
                title={`Download real 3D Back View (.${downloadFormat})`}
              >
                <Download className="h-3 w-3" />
              </button>
            </div>
            <div className="h-32 w-full flex items-center justify-center overflow-hidden rounded-lg bg-slate-50/50">
              <Store3DCardPreview
                product={productData}
                activeColor={color}
                fixedView="back"
                showControls={false}
                hideBadge={true}
                className="h-full w-full !border-0 !shadow-none !bg-transparent !p-1 cursor-default"
                onSnapshotReady={handleSnapshotReady}
              />
            </div>
            <button
              disabled={isDownloading}
              onClick={() => handleDownloadSingle3DAngle("back")}
              className="mt-1.5 w-full py-1 bg-slate-50 hover:bg-indigo-50 border border-slate-100 hover:border-indigo-200 text-indigo-600 text-[9px] font-bold rounded-lg transition flex items-center justify-center gap-1 cursor-pointer disabled:opacity-50"
            >
              <Download className="h-2.5 w-2.5" /> Download Back (3D)
            </button>
          </div>

          {/* Left Side 3D */}
          <div className="bg-white p-2 rounded-xl border border-slate-200 flex flex-col items-center justify-between group hover:border-indigo-300 transition shadow-2xs">
            <div className="w-full flex items-center justify-between text-[10px] font-extrabold text-slate-600 mb-1 px-1">
              <span>Left Side (3D)</span>
              <button
                disabled={isDownloading}
                onClick={() => handleDownloadSingle3DAngle("left")}
                className="p-1 text-indigo-600 hover:bg-indigo-50 rounded-md transition cursor-pointer disabled:opacity-50"
                title={`Download real 3D Left Side View (.${downloadFormat})`}
              >
                <Download className="h-3 w-3" />
              </button>
            </div>
            <div className="h-32 w-full flex items-center justify-center overflow-hidden rounded-lg bg-slate-50/50">
              <Store3DCardPreview
                product={productData}
                activeColor={color}
                fixedView="left"
                showControls={false}
                hideBadge={true}
                className="h-full w-full !border-0 !shadow-none !bg-transparent !p-1 cursor-default"
                onSnapshotReady={handleSnapshotReady}
              />
            </div>
            <button
              disabled={isDownloading}
              onClick={() => handleDownloadSingle3DAngle("left")}
              className="mt-1.5 w-full py-1 bg-slate-50 hover:bg-indigo-50 border border-slate-100 hover:border-indigo-200 text-indigo-600 text-[9px] font-bold rounded-lg transition flex items-center justify-center gap-1 cursor-pointer disabled:opacity-50"
            >
              <Download className="h-2.5 w-2.5" /> Download Left (3D)
            </button>
          </div>

          {/* Right Side 3D */}
          <div className="bg-white p-2 rounded-xl border border-slate-200 flex flex-col items-center justify-between group hover:border-indigo-300 transition shadow-2xs">
            <div className="w-full flex items-center justify-between text-[10px] font-extrabold text-slate-600 mb-1 px-1">
              <span>Right Side (3D)</span>
              <button
                disabled={isDownloading}
                onClick={() => handleDownloadSingle3DAngle("right")}
                className="p-1 text-indigo-600 hover:bg-indigo-50 rounded-md transition cursor-pointer disabled:opacity-50"
                title={`Download real 3D Right Side View (.${downloadFormat})`}
              >
                <Download className="h-3 w-3" />
              </button>
            </div>
            <div className="h-32 w-full flex items-center justify-center overflow-hidden rounded-lg bg-slate-50/50">
              <Store3DCardPreview
                product={productData}
                activeColor={color}
                fixedView="right"
                showControls={false}
                hideBadge={true}
                className="h-full w-full !border-0 !shadow-none !bg-transparent !p-1 cursor-default"
                onSnapshotReady={handleSnapshotReady}
              />
            </div>
            <button
              disabled={isDownloading}
              onClick={() => handleDownloadSingle3DAngle("right")}
              className="mt-1.5 w-full py-1 bg-slate-50 hover:bg-indigo-50 border border-slate-100 hover:border-indigo-200 text-indigo-600 text-[9px] font-bold rounded-lg transition flex items-center justify-center gap-1 cursor-pointer disabled:opacity-50"
            >
              <Download className="h-2.5 w-2.5" /> Download Right (3D)
            </button>
          </div>
        </div>
      ) : (
        /* Single Focused 3D View */
        <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center justify-center h-48 w-48 bg-slate-50/50 rounded-xl border border-slate-100 overflow-hidden relative">
            <Store3DCardPreview
              product={productData}
              activeColor={color}
              fixedView={activeAngle}
              showControls={false}
              hideBadge={false}
              className="h-full w-full !border-0 !shadow-none !bg-transparent !p-1 cursor-default"
              onSnapshotReady={handleSnapshotReady}
            />
          </div>

          {/* Single View Specs & Actions */}
          <div className="flex-1 space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <h5 className="font-extrabold text-slate-900 uppercase tracking-wide text-xs flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-indigo-600" />
                3D {activeAngle === "front" ? "Front" : activeAngle === "back" ? "Back" : activeAngle === "left" ? "Left Side" : "Right Side"} Frozen Preview
              </h5>
              <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[10px] font-bold">
                {item.selectedSize || item.size || "Size M"}
              </span>
            </div>

            <p className="text-slate-500 text-[11px] leading-tight">
              Real 3D model render with fabric mesh, realistic lighting, and custom decals applied for production and printing alignment.
            </p>

            <div className="flex flex-wrap gap-2 pt-2">
              <button
                disabled={isDownloading}
                onClick={() => handleDownloadSingle3DAngle(activeAngle)}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl transition shadow-xs disabled:opacity-50 cursor-pointer"
              >
                {isDownloading ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Download className="h-3.5 w-3.5" />
                )}
                Download 3D {activeAngle.toUpperCase()} ({downloadFormat.toUpperCase()})
              </button>

              <button
                disabled={isDownloading}
                onClick={handleDownloadAll3DAngles}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition disabled:opacity-50 cursor-pointer"
              >
                <Download className="h-3.5 w-3.5" />
                Download All 4 Views
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Progress / Loading Indicator */}
      {isDownloading && (
        <div className="p-2.5 bg-indigo-50 border border-indigo-200 text-indigo-800 text-xs font-bold rounded-xl flex items-center gap-2 animate-pulse">
          <Loader2 className="h-4 w-4 animate-spin text-indigo-600" />
          <span>{downloadProgress || "Generating real 3D preview render..."}</span>
        </div>
      )}

      {/* Download Success Toast */}
      {downloadSuccessMsg && (
        <div className="p-2.5 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold rounded-xl flex items-center justify-between animate-in fade-in duration-200">
          <span className="flex items-center gap-1.5">
            <Check className="h-4 w-4 text-emerald-600" />
            {downloadSuccessMsg}
          </span>
        </div>
      )}

      {/* Original Decal Graphic Source Downloads (if custom decals exist) */}
      {(() => {
        const imgLayers = productData.layers.filter((l) => (l.type === "image" || l.type === "logo") && l.url && l.url !== "/images/dumyImage.png");
        if (imgLayers.length === 0) return null;

        return (
          <div className="pt-2 border-t border-dashed border-slate-200/80 space-y-1.5">
            <span className="text-[10px] font-black uppercase text-slate-400 tracking-wide flex items-center gap-1">
              <Layers className="h-3 w-3 text-slate-400" />
              Original Graphic Assets ({imgLayers.length}):
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
              {imgLayers.map((layer, lIdx) => (
                <div
                  key={lIdx}
                  className="flex items-center justify-between bg-white px-2.5 py-1.5 rounded-lg border border-slate-200/80 text-[10px]"
                >
                  <div className="flex items-center gap-2 min-w-0 pr-1">
                    <img
                      src={layer.url}
                      alt={layer.name || "Asset"}
                      className="h-5 w-5 object-contain bg-slate-50 rounded border"
                      onError={(e) => (e.target.style.display = "none")}
                    />
                    <span className="font-semibold text-slate-800 truncate max-w-[120px]">
                      {layer.name || `Graphic Asset #${lIdx + 1}`}
                    </span>
                  </div>
                  <button
                    onClick={() => downloadDirectAsset(layer.url, `${orderShortId}-graphic-asset-${lIdx + 1}.png`)}
                    className="text-indigo-600 hover:text-indigo-800 font-bold flex items-center gap-1 hover:underline shrink-0 bg-indigo-50 px-2 py-0.5 rounded cursor-pointer"
                    title="Download original high-res asset file"
                  >
                    <Download className="h-2.5 w-2.5" /> Download
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
