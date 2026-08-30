import React, { useState } from "react";
import { Edit2, Trash2, Layers, Check } from "lucide-react";
import Store3DCardPreview from "./Store3DCardPreview";

export default function TShirtStyleCard({ style, onEdit, onDelete }) {
  const defaultColor =
    style.colors && style.colors.length > 0
      ? typeof style.colors[0] === "string"
        ? style.colors[0]
        : style.colors[0].value
      : "#ffffff";

  const [activeColor, setActiveColor] = useState(defaultColor);

  const styleProductObj = {
    _id: style._id,
    id: style._id,
    title: style.name || style.type || "T-Shirt Style",
    name: style.name || style.type || "T-Shirt Style",
    tShirtType: style.name || style.type || "Crew Neck",
    path: style.path,
    modelPath: style.path,
    colors: (style.colors || []).map((c) =>
      typeof c === "string" ? c : c.value,
    ),
  };

  const gsmList =
    style.gsmPrices && style.gsmPrices.length > 0
      ? style.gsmPrices
      : (style.gsms || []).map((g) => ({
          gsm: g,
          price: style.price || 1200,
        }));

  return (
    <div className="border border-slate-200 rounded-3xl p-5 hover:shadow-lg hover:border-indigo-200 transition-all duration-200 bg-white flex flex-col justify-between shadow-xs">
      <div>
        {/* Style Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-3">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
              <Layers className="h-4 w-4" />
            </div>
            <div>
              <h4 className="font-black text-slate-900 text-base leading-none">
                {style.name || style.type || "Crew Neck"}
              </h4>
              <span className="text-[10px] text-indigo-600 font-bold uppercase tracking-wider">
                3D Garment Model
              </span>
            </div>
          </div>
        </div>

        {/* Frozen 3D Preview */}
        <div className="mb-4">
          <Store3DCardPreview
            product={styleProductObj}
            activeColor={activeColor}
            showControls={true}
            hideBadge={false}
            className="h-56 w-full rounded-2xl bg-gradient-to-b from-slate-50 via-slate-100/70 to-slate-100 border border-slate-200/80 shadow-inner"
          />
        </div>

        {/* Model File Path */}
        <div className="bg-slate-50 rounded-xl p-2.5 border border-slate-150 mb-3.5">
          <span className="text-[9px] font-black uppercase text-slate-400 block tracking-wider mb-0.5">
            3D Model Asset Path
          </span>
          <p className="text-[11px] text-slate-700 font-mono font-medium truncate">
            {style.path || "/images/models/male normal t-shirt1.glb"}
          </p>
        </div>

        {/* Color Palette Selector */}
        <div className="mb-3.5">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
              Allowed Colors ({style.colors?.length || 0})
            </span>
            <span className="text-[9px] text-slate-400 font-semibold">
              Click to preview color
            </span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {(style.colors || []).map((color, i) => {
              const colorVal = typeof color === "string" ? color : color.value;
              const colorName = typeof color === "string" ? color : color.name;
              const isSelected =
                activeColor.toLowerCase() === colorVal.toLowerCase();

              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => setActiveColor(colorVal)}
                  className={`group relative flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-semibold transition cursor-pointer ${
                    isSelected
                      ? "ring-2 ring-indigo-600 border-indigo-600 bg-indigo-50/80 text-indigo-950 font-bold shadow-2xs"
                      : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                  }`}
                  title={`${colorName} (${colorVal})`}
                >
                  <span
                    className="h-3.5 w-3.5 rounded-full border border-slate-300 shrink-0"
                    style={{ backgroundColor: colorVal }}
                  />
                  <span className="text-[11px]">{colorName}</span>
                  {isSelected && (
                    <Check className="h-3 w-3 text-indigo-600 shrink-0" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Weights & Pricing */}
        <div className="mb-3.5">
          <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block mb-1.5">
            GSM Weights & Base Pricing
          </span>
          <div className="flex flex-col gap-1.5">
            {gsmList.map((gp, i) => (
              <div
                key={i}
                className="flex justify-between items-center text-xs font-semibold text-slate-700 bg-slate-50 border border-slate-150 px-3 py-1.5 rounded-xl"
              >
                <span className="font-bold text-slate-800">{gp.gsm}</span>
                <span className="text-indigo-600 font-black">
                  Rs. {(gp.price || 0).toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-2 border-t border-slate-100 pt-4 mt-2">
        <button
          onClick={() => onEdit(style)}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 rounded-xl text-xs font-bold transition cursor-pointer"
        >
          <Edit2 className="h-3.5 w-3.5" />
          Edit Style
        </button>
        <button
          onClick={() => onDelete(style._id)}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl text-xs font-bold transition cursor-pointer"
        >
          <Trash2 className="h-3.5 w-3.5" />
          Delete
        </button>
      </div>
    </div>
  );
}
