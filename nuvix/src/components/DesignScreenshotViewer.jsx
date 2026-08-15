import React, { useState, useRef } from "react";
import { Download, Sparkles, Eye, Grid, Layers, Camera, Check, ExternalLink, Image as ImageIcon } from "lucide-react";
import TShirt2D, { getColorValue } from "./TShirt2D";

/**
 * Utility to convert an SVG element to high-res PNG and trigger download
 */
export const downloadSvgAsPng = (svgElement, fileName = "tshirt-design.png", scale = 2) => {
  if (!svgElement) return;

  try {
    const svgData = new XMLSerializer().serializeToString(svgElement);
    const svgBlob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
    const DOMURL = window.URL || window.webkitURL || window;
    const url = DOMURL.createObjectURL(svgBlob);

    const image = new Image();
    image.onload = () => {
      const canvas = document.createElement("canvas");
      const bbox = svgElement.getBoundingClientRect();
      const width = (bbox.width || 300) * scale;
      const height = (bbox.height || 300) * scale;

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      
      // Transparent or slight background
      ctx.clearRect(0, 0, width, height);
      ctx.drawImage(image, 0, 0, width, height);

      DOMURL.revokeObjectURL(url);
      const pngUrl = canvas.toDataURL("image/png");

      const downloadLink = document.createElement("a");
      downloadLink.href = pngUrl;
      downloadLink.download = fileName;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
    };
    image.src = url;
  } catch (err) {
    console.error("Error converting SVG to PNG:", err);
  }
};

export default function DesignScreenshotViewer({
  item,
  orderId,
  onOpen3DModal
}) {
  const [activeAngle, setActiveAngle] = useState("all"); // "front" | "back" | "left" | "right" | "all"
  const [downloadSuccessMsg, setDownloadSuccessMsg] = useState("");

  const frontRef = useRef(null);
  const backRef = useRef(null);
  const leftRef = useRef(null);
  const rightRef = useRef(null);

  const isCustom = item.itemType === "Customized" || Boolean(item.designId);
  const design = item.designId || {};
  const product = item.productId || {};

  const color = design.fabricColor || item.selectedColor || item.color || "#ffffff";
  const layers = design.layers || [];
  const thumbnail = design.thumbnailUrl || product.images?.[0] || item.image || "/images/dumyImage.png";
  const title = isCustom ? (design.tShirtType || item.tShirtStyle || "Custom T-Shirt") : (product.title || item.tShirtStyle || "T-Shirt");
  const orderShortId = orderId ? orderId.slice(-6) : "order";

  // Individual angle download handler
  const handleDownloadSingleAngle = (angle) => {
    let targetRef = null;
    if (angle === "front") targetRef = frontRef;
    else if (angle === "back") targetRef = backRef;
    else if (angle === "left") targetRef = leftRef;
    else if (angle === "right") targetRef = rightRef;

    const svg = targetRef?.current?.getSvgElement();
    if (svg) {
      downloadSvgAsPng(svg, `${orderShortId}-${title.toLowerCase().replace(/\s+/g, "-")}-${angle}-view.png`, 3);
      setDownloadSuccessMsg(`Downloaded ${angle} screenshot`);
      setTimeout(() => setDownloadSuccessMsg(""), 2500);
    } else if (thumbnail && thumbnail !== "/images/dumyImage.png") {
      const link = document.createElement("a");
      link.href = thumbnail;
      link.download = `${orderShortId}-${angle}-view.png`;
      link.target = "_blank";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  // Download all 4 angles sequentially
  const handleDownloadAllAngles = () => {
    const angles = [
      { id: "front", ref: frontRef },
      { id: "back", ref: backRef },
      { id: "left", ref: leftRef },
      { id: "right", ref: rightRef }
    ];

    angles.forEach(({ id, ref }, idx) => {
      setTimeout(() => {
        const svg = ref?.current?.getSvgElement();
        if (svg) {
          downloadSvgAsPng(svg, `${orderShortId}-${title.toLowerCase().replace(/\s+/g, "-")}-${id}-view.png`, 3);
        }
      }, idx * 250);
    });

    setDownloadSuccessMsg("Downloaded all 4 angle screenshots!");
    setTimeout(() => setDownloadSuccessMsg(""), 3000);
  };

  const anglesList = [
    { id: "front", label: "Front" },
    { id: "back", label: "Back" },
    { id: "left", label: "Left Side" },
    { id: "right", label: "Right Side" },
    { id: "all", label: "All Angles (Both Sides)" }
  ];

  return (
    <div className="bg-slate-50/80 border border-slate-200/90 rounded-2xl p-3.5 space-y-3.5 select-none">
      
      {/* Header with Angle Selectors & Quick Download All */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200/80 pb-2.5">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider mr-1">
            Angle Views:
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

        <div className="flex items-center gap-2">
          {isCustom && onOpen3DModal && (
            <button
              onClick={() => onOpen3DModal(design)}
              className="inline-flex items-center gap-1 px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-700 text-[10px] font-bold rounded-lg transition cursor-pointer"
              title="Open full interactive 3D model"
            >
              <Sparkles className="h-3 w-3 text-indigo-600 animate-pulse" />
              3D Inspector
            </button>
          )}

          <button
            onClick={handleDownloadAllAngles}
            className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-white text-[10px] font-bold rounded-lg transition shadow-2xs cursor-pointer"
            title="Download all screenshots (Front, Back, Left Side, Right Side)"
          >
            <Download className="h-3 w-3" />
            Download All (4 Angles)
          </button>
        </div>
      </div>

      {/* Main Multi-Angle Display Area */}
      {activeAngle === "all" ? (
        /* Grid / Both Sides Strip Layout (Front, Back, Left Side, Right Side) */
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {/* Front View */}
          <div className="bg-white p-2.5 rounded-xl border border-slate-200 flex flex-col items-center justify-between group hover:border-indigo-300 transition shadow-2xs">
            <div className="w-full flex items-center justify-between text-[10px] font-extrabold text-slate-500 mb-1">
              <span>Front View</span>
              <button
                onClick={() => handleDownloadSingleAngle("front")}
                className="p-1 text-indigo-600 hover:bg-indigo-50 rounded-md transition cursor-pointer"
                title="Download Front Screenshot"
              >
                <Download className="h-3 w-3" />
              </button>
            </div>
            <div className="h-28 w-28 flex items-center justify-center">
              <TShirt2D
                ref={frontRef}
                color={color}
                designUrl={thumbnail}
                layers={layers}
                view="front"
                className="h-28 w-28"
              />
            </div>
            <button
              onClick={() => handleDownloadSingleAngle("front")}
              className="mt-1.5 w-full py-1 bg-slate-50 hover:bg-indigo-50 border border-slate-100 hover:border-indigo-200 text-indigo-600 text-[9px] font-bold rounded-lg transition flex items-center justify-center gap-1 cursor-pointer"
            >
              <Download className="h-2.5 w-2.5" /> Download Front
            </button>
          </div>

          {/* Back View */}
          <div className="bg-white p-2.5 rounded-xl border border-slate-200 flex flex-col items-center justify-between group hover:border-indigo-300 transition shadow-2xs">
            <div className="w-full flex items-center justify-between text-[10px] font-extrabold text-slate-500 mb-1">
              <span>Back View</span>
              <button
                onClick={() => handleDownloadSingleAngle("back")}
                className="p-1 text-indigo-600 hover:bg-indigo-50 rounded-md transition cursor-pointer"
                title="Download Back Screenshot"
              >
                <Download className="h-3 w-3" />
              </button>
            </div>
            <div className="h-28 w-28 flex items-center justify-center">
              <TShirt2D
                ref={backRef}
                color={color}
                designUrl={thumbnail}
                layers={layers}
                view="back"
                className="h-28 w-28"
              />
            </div>
            <button
              onClick={() => handleDownloadSingleAngle("back")}
              className="mt-1.5 w-full py-1 bg-slate-50 hover:bg-indigo-50 border border-slate-100 hover:border-indigo-200 text-indigo-600 text-[9px] font-bold rounded-lg transition flex items-center justify-center gap-1 cursor-pointer"
            >
              <Download className="h-2.5 w-2.5" /> Download Back
            </button>
          </div>

          {/* Left Side View */}
          <div className="bg-white p-2.5 rounded-xl border border-slate-200 flex flex-col items-center justify-between group hover:border-indigo-300 transition shadow-2xs">
            <div className="w-full flex items-center justify-between text-[10px] font-extrabold text-slate-500 mb-1">
              <span>Left Side</span>
              <button
                onClick={() => handleDownloadSingleAngle("left")}
                className="p-1 text-indigo-600 hover:bg-indigo-50 rounded-md transition cursor-pointer"
                title="Download Left Side Screenshot"
              >
                <Download className="h-3 w-3" />
              </button>
            </div>
            <div className="h-28 w-28 flex items-center justify-center">
              <TShirt2D
                ref={leftRef}
                color={color}
                designUrl={thumbnail}
                layers={layers}
                view="left"
                className="h-28 w-28"
              />
            </div>
            <button
              onClick={() => handleDownloadSingleAngle("left")}
              className="mt-1.5 w-full py-1 bg-slate-50 hover:bg-indigo-50 border border-slate-100 hover:border-indigo-200 text-indigo-600 text-[9px] font-bold rounded-lg transition flex items-center justify-center gap-1 cursor-pointer"
            >
              <Download className="h-2.5 w-2.5" /> Download Left
            </button>
          </div>

          {/* Right Side View */}
          <div className="bg-white p-2.5 rounded-xl border border-slate-200 flex flex-col items-center justify-between group hover:border-indigo-300 transition shadow-2xs">
            <div className="w-full flex items-center justify-between text-[10px] font-extrabold text-slate-500 mb-1">
              <span>Right Side</span>
              <button
                onClick={() => handleDownloadSingleAngle("right")}
                className="p-1 text-indigo-600 hover:bg-indigo-50 rounded-md transition cursor-pointer"
                title="Download Right Side Screenshot"
              >
                <Download className="h-3 w-3" />
              </button>
            </div>
            <div className="h-28 w-28 flex items-center justify-center">
              <TShirt2D
                ref={rightRef}
                color={color}
                designUrl={thumbnail}
                layers={layers}
                view="right"
                className="h-28 w-28"
              />
            </div>
            <button
              onClick={() => handleDownloadSingleAngle("right")}
              className="mt-1.5 w-full py-1 bg-slate-50 hover:bg-indigo-50 border border-slate-100 hover:border-indigo-200 text-indigo-600 text-[9px] font-bold rounded-lg transition flex items-center justify-center gap-1 cursor-pointer"
            >
              <Download className="h-2.5 w-2.5" /> Download Right
            </button>
          </div>
        </div>
      ) : (
        /* Single Focused View with Larger Canvas & Download Details */
        <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center justify-center h-44 w-44 bg-slate-50/50 rounded-xl border border-slate-100">
            <TShirt2D
              ref={
                activeAngle === "front"
                  ? frontRef
                  : activeAngle === "back"
                  ? backRef
                  : activeAngle === "left"
                  ? leftRef
                  : rightRef
              }
              color={color}
              designUrl={thumbnail}
              layers={layers}
              view={activeAngle}
              className="h-40 w-40"
            />
          </div>

          {/* Single View Specs & Actions */}
          <div className="flex-1 space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <h5 className="font-extrabold text-slate-900 uppercase tracking-wide text-xs">
                {activeAngle === "front"
                  ? "Front View"
                  : activeAngle === "back"
                  ? "Back View"
                  : activeAngle === "left"
                  ? "Left Side Profile"
                  : "Right Side Profile"}
              </h5>
              <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[10px] font-bold">
                {item.selectedSize || item.size || "Size M"}
              </span>
            </div>

            <p className="text-slate-500 text-[11px] leading-tight">
              Detailed printable composite for printing operator inspection and alignment.
            </p>

            <div className="flex flex-wrap gap-2 pt-2">
              <button
                onClick={() => handleDownloadSingleAngle(activeAngle)}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl transition shadow-xs cursor-pointer"
              >
                <Download className="h-3.5 w-3.5" />
                Download {activeAngle.toUpperCase()} Screenshot (PNG)
              </button>

              <button
                onClick={handleDownloadAllAngles}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition cursor-pointer"
              >
                <Download className="h-3.5 w-3.5" />
                Download All 4 Angles
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Download Success Toast */}
      {downloadSuccessMsg && (
        <div className="p-2 bg-emerald-50 border border-emerald-200 text-emerald-700 text-[11px] font-bold rounded-xl flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <Check className="h-3.5 w-3.5 text-emerald-600" />
            {downloadSuccessMsg}
          </span>
        </div>
      )}

      {/* Original Decal Graphic Source Downloads (if custom decals exist) */}
      {(() => {
        const imgLayers = layers.filter((l) => (l.type === "image" || l.type === "logo") && l.url && l.url !== "/images/dumyImage.png");
        if (imgLayers.length === 0) return null;

        return (
          <div className="pt-2 border-t border-dashed border-slate-200/80 space-y-1.5">
            <span className="text-[10px] font-black uppercase text-slate-400 tracking-wide flex items-center gap-1">
              <Layers className="h-3 w-3 text-slate-400" />
              Source Graphic Assets ({imgLayers.length}):
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
                    <span className="font-semibold text-slate-800 truncate max-w-[110px]">
                      {layer.name || `Graphic #${lIdx + 1}`}
                    </span>
                  </div>
                  <a
                    href={layer.url}
                    download={`${orderShortId}-graphic-${lIdx + 1}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-indigo-600 hover:text-indigo-800 font-bold flex items-center gap-0.5 hover:underline shrink-0"
                  >
                    <Download className="h-2.5 w-2.5" /> Download
                  </a>
                </div>
              ))}
            </div>
          </div>
        );
      })()}
    </div>
  );
}
