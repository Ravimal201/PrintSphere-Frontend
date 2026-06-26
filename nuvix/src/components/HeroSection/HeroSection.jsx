import { Layers, Maximize2, MoveDown, MoveUp, RotateCcw, RotateCw, Sparkles, Truck, Undo2, ZoomIn, ZoomOut } from "lucide-react";
import { useRef, useState, useEffect } from "react";
import Hero3DPreview from "./Hero3DPreview";

export default function HeroSection() {
  const heroRef = useRef(null);
  const rotationRef = useRef(null);
  const customizerRef = useRef(null);

  const [scale, setScale] = useState(0.5); // Initial minimum size
  const [shirtColor, setShirtColor] = useState("#ffffff");
  const [customText, setCustomText] = useState(""); // Clean on load
  const [tempText, setTempText] = useState(""); // Input field state
  const [symbolColor, setSymbolColor] = useState("#dc2626");
  const [decalUrl, setDecalUrl] = useState("");
  const [designPlacement, setDesignPlacement] = useState({ position: [0, 0.1, 0.18], rotation: [0, 0, 0] });

  const [rotationPos, setRotationPos] = useState(null); // Defaults on load
  const [customizerPos, setCustomizerPos] = useState(null); // Defaults on load

  const handleMouseDown = (e, setPos, currentPos, panelRef) => {
    if (e.target.closest('button') || e.target.closest('input')) return;
    e.preventDefault();
    
    let startPos = currentPos;
    if (!startPos && panelRef.current) {
      const parentRect = panelRef.current.parentElement.getBoundingClientRect();
      const rect = panelRef.current.getBoundingClientRect();
      startPos = {
        x: rect.left - parentRect.left,
        y: rect.top - parentRect.top
      };
    } else if (!startPos) {
      startPos = { x: 0, y: 0 };
    }

    const startX = e.clientX;
    const startY = e.clientY;

    const handleMouseMove = (moveEvent) => {
      const dx = moveEvent.clientX - startX;
      const dy = moveEvent.clientY - startY;
      setPos({
        x: startPos.x + dx,
        y: startPos.y + dy
      });
    };

    const handleMouseUp = () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };

  const handleDesignClick = (e) => {
    if (e) e.preventDefault();
    const token = localStorage.getItem("token");
    const isAuthenticated = token && token !== "null" && token !== "undefined";
    if (!isAuthenticated) {
      window.location.href = "/login?redirect=/designer";
    } else {
      window.location.href = "/designer";
    }
  };

  const handleAddText = () => {
    const token = localStorage.getItem("token");
    const isAuthenticated = token && token !== "null" && token !== "undefined";
    if (!isAuthenticated) {
      window.location.href = "/login?redirect=/designer";
      return;
    }
    setCustomText(tempText);
  };

  useEffect(() => {
    if (!customText) {
      setDecalUrl("");
      return;
    }
    const canvas = document.createElement("canvas");
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, 512, 512);

    const fontSize = Math.max(40, Math.min(180, 360 / customText.length));
    ctx.font = `bold ${fontSize}px sans-serif`;
    ctx.fillStyle = symbolColor;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(customText, 256, 256);

    setDecalUrl(canvas.toDataURL());
  }, [customText, symbolColor]);
  return (
    <section className="relative mb-8 overflow-hidden rounded-4xl border border-indigo-100 bg-linear-to-br from-white via-indigo-50 to-indigo-100/80 p-6 shadow-[0_24px_80px_rgba(99,102,241,0.12)] lg:p-8">
      <div className="absolute inset-x-6 top-5 h-px bg-linear-to-r from-transparent via-indigo-200 to-transparent" />
      <div className="grid items-center gap-8 lg:grid-cols-[1.05fr_1fr]">
        <div className="relative z-10 mx-auto max-w-xl text-center lg:text-left">
          <span className="inline-flex rounded-full bg-indigo-100 px-4 py-1 text-xs font-semibold text-indigo-600 shadow-sm">
            Design Your Imagination
          </span>

          <h1 className="mt-5 max-w-lg text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl lg:text-6xl">
            Customize T-Shirts
            <span className="block text-indigo-600">in 3D</span>
          </h1>

          <p className="mt-5 max-w-md text-base leading-7 text-slate-600 sm:text-lg">
            Create, customize and order your unique T-shirts with our 3D design tool.
          </p>

          <div className="mt-8 flex flex-wrap justify-center gap-4 lg:justify-start">
            <a
              href="#"
              onClick={handleDesignClick}
              className="inline-flex items-center gap-2 rounded-2xl bg-linear-to-r from-indigo-600 via-violet-600 to-fuchsia-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-200 transition hover:-translate-y-0.5 hover:from-indigo-500 hover:via-violet-500 hover:to-fuchsia-500"
            >
              Start Designing
              <span aria-hidden="true">→</span>
            </a>

            <a
              href="/store"
              className="inline-flex items-center rounded-2xl border border-indigo-300 bg-white px-6 py-3 text-sm font-semibold text-indigo-600 shadow-sm transition hover:-translate-y-0.5 hover:bg-indigo-50"
            >
              Explore Store
            </a>
          </div>

          <div className="mt-8 grid justify-center gap-3 sm:grid-cols-3 lg:justify-start">
            <div className="flex items-center gap-3 rounded-2xl bg-white/80 px-4 py-3 shadow-sm ring-1 ring-white/70 backdrop-blur">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600">
                <Layers className="h-5 w-5" />
              </div>
              <p className="text-sm font-medium text-slate-700">Realistic 3D Preview</p>
            </div>

            <div className="flex items-center gap-3 rounded-2xl bg-white/80 px-4 py-3 shadow-sm ring-1 ring-white/70 backdrop-blur">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600">
                <Sparkles className="h-5 w-5" />
              </div>
              <p className="text-sm font-medium text-slate-700">Unlimited Customization</p>
            </div>

            <div className="flex items-center gap-3 rounded-2xl bg-white/80 px-4 py-3 shadow-sm ring-1 ring-white/70 backdrop-blur">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600">
                <Truck className="h-5 w-5" />
              </div>
              <p className="text-sm font-medium text-slate-700">Fast &amp; Reliable Delivery</p>
            </div>
          </div>
        </div>

        <div className="hidden lg:relative lg:flex lg:min-h-130 lg:items-center lg:justify-center">
          <div className="absolute inset-8 rounded-full bg-indigo-200/35 blur-2xl" />

          <div 
            ref={rotationRef}
            className="hidden lg:absolute lg:left-4 lg:top-1/2 lg:flex lg:-translate-y-1/2 z-20 cursor-move"
            style={rotationPos ? { left: `${rotationPos.x}px`, top: `${rotationPos.y}px`, transform: 'none' } : {}}
            onMouseDown={(e) => handleMouseDown(e, setRotationPos, rotationPos, rotationRef)}
          >
            <div className="flex flex-col gap-3 rounded-3xl bg-white/90 p-4 shadow-xl shadow-indigo-100 ring-1 ring-white/70 backdrop-blur">
              <button
                type="button"
                title="Rotate left"
                aria-label="Rotate left"
                onClick={() => heroRef.current?.rotateBy(0, -0.3, 0)}
                className="flex h-10 w-10 items-center justify-center rounded-2xl text-slate-700 shadow-sm transition hover:bg-indigo-50 hover:text-indigo-600"
              >
                <RotateCcw className="h-5 w-5" />
              </button>
              <button
                type="button"
                title="Tilt up"
                aria-label="Tilt up"
                onClick={() => heroRef.current?.rotateBy(-0.2, 0, 0)}
                className="flex h-10 w-10 items-center justify-center rounded-2xl text-slate-700 shadow-sm transition hover:bg-indigo-50 hover:text-indigo-600"
              >
                <MoveUp className="h-5 w-5" />
              </button>
              <button
                type="button"
                title="Fit model"
                aria-label="Fit model"
                onClick={() => {
                  heroRef.current?.fit();
                  setScale(0.5);
                }}
                className="flex h-10 w-10 items-center justify-center rounded-2xl text-slate-700 shadow-sm transition hover:bg-indigo-50 hover:text-indigo-600"
              >
                <Maximize2 className="h-5 w-5" />
              </button>
              <button
                type="button"
                title="Tilt down"
                aria-label="Tilt down"
                onClick={() => heroRef.current?.rotateBy(0.2, 0, 0)}
                className="flex h-10 w-10 items-center justify-center rounded-2xl text-slate-700 shadow-sm transition hover:bg-indigo-50 hover:text-indigo-600"
              >
                <MoveDown className="h-5 w-5" />
              </button>
              <button
                type="button"
                title="Rotate right"
                aria-label="Rotate right"
                onClick={() => heroRef.current?.rotateBy(0, 0.3, 0)}
                className="flex h-10 w-10 items-center justify-center rounded-2xl text-slate-700 shadow-sm transition hover:bg-indigo-50 hover:text-indigo-600"
              >
                <RotateCw className="h-5 w-5" />
              </button>
              <button
                type="button"
                title="Reset view"
                aria-label="Reset view"
                onClick={() => {
                  heroRef.current?.reset();
                  setScale(0.5);
                }}
                className="flex h-10 w-10 items-center justify-center rounded-2xl text-slate-700 shadow-sm transition hover:bg-indigo-50 hover:text-indigo-600"
              >
                <Undo2 className="h-5 w-5" />
              </button>
            </div>
          </div>

          <div 
            onDoubleClick={handleDesignClick}
            className="hidden lg:flex relative z-10 w-full max-w-130 flex-col items-center justify-center rounded-4xl border border-white/70 bg-white/60 px-6 py-8 shadow-[0_20px_60px_rgba(99,102,241,0.12)] backdrop-blur-md sm:px-8 cursor-pointer select-none"
            title="Double Click to Customize"
          >
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleDesignClick(e);
              }}
              className="absolute top-3 left-1/2 -translate-x-1/2 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white text-[10px] font-bold px-3 py-1 rounded-full shadow-md z-20 cursor-pointer transition"
            >
              Double Click to Customize
            </button>

            <Hero3DPreview
              ref={heroRef}
              scale={scale}
              onScaleChange={setScale}
              color={shirtColor}
              onColorChange={setShirtColor}
              designImageUrl={decalUrl}
              designScale={0.55}
              designPlacement={designPlacement}
              onDesignPlacementChange={setDesignPlacement}
            />

            <div 
              onClick={(e) => e.stopPropagation()}
              className="mt-8 flex w-full items-center gap-3 rounded-2xl bg-white border border-slate-100 p-3 shadow-md backdrop-blur-md"
            >
              <button
                className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-50 border border-slate-200/80 text-slate-655 hover:text-indigo-655 hover:border-indigo-200 hover:bg-indigo-50/50 shadow-xs transition shrink-0"
                type="button"
                title="Reset zoom"
                onClick={() => {
                  heroRef.current?.reset();
                  setScale(0.5);
                }}
              >
                <RotateCcw className="h-4 w-4" />
              </button>

              <div className="flex-1 flex items-center gap-2 px-1">
                <button
                  type="button"
                  title="Zoom Out"
                  onClick={() => {
                    const nextVal = Math.max(0.5, scale - 0.2);
                    setScale(nextVal);
                    heroRef.current?.setScale(nextVal);
                  }}
                  className="p-1 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-slate-100 transition shrink-0"
                >
                  <ZoomOut className="h-4 w-4" />
                </button>

                <div className="relative flex-1 h-2 rounded-full bg-slate-200">
                  <div 
                    className="absolute top-0 left-0 h-full bg-gradient-to-r from-indigo-500 to-violet-600 rounded-full"
                    style={{ width: `${((scale - 0.5) / (2.5 - 0.5)) * 100}%` }}
                  />
                  <div 
                    className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 h-4 w-4 rounded-full bg-white border-2 border-indigo-600 shadow-md transition-all duration-75 pointer-events-none"
                    style={{ left: `${((scale - 0.5) / (2.5 - 0.5)) * 100}%` }}
                  />
                  <input
                    aria-label="Scale Slider"
                    type="range"
                    min="0.5"
                    max="2.5"
                    step="0.01"
                    value={scale}
                    onChange={(e) => {
                      const v = parseFloat(e.target.value);
                      setScale(v);
                      heroRef.current?.setScale(v);
                    }}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                </div>

                <button
                  type="button"
                  title="Zoom In"
                  onClick={() => {
                    const nextVal = Math.min(2.5, scale + 0.2);
                    setScale(nextVal);
                    heroRef.current?.setScale(nextVal);
                  }}
                  className="p-1 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-slate-100 transition shrink-0"
                >
                  <ZoomIn className="h-4 w-4" />
                </button>
              </div>

              <div className="text-[10px] font-bold text-indigo-600 bg-indigo-50 border border-indigo-100 px-2.5 py-1.5 rounded-xl shrink-0 tabular-nums">
                {Math.round(((scale - 0.5) / (2.5 - 0.5)) * 100)}%
              </div>
            </div>
          </div>

          <div 
            ref={customizerRef}
            className="hidden lg:absolute lg:right-3 lg:top-10 lg:block lg:w-52 rounded-3xl bg-white p-4 shadow-xl shadow-indigo-100 ring-1 ring-white/70 z-20 space-y-4 cursor-move"
            style={customizerPos ? { left: `${customizerPos.x}px`, top: `${customizerPos.y}px`, right: 'auto', transform: 'none' } : {}}
            onMouseDown={(e) => handleMouseDown(e, setCustomizerPos, customizerPos, customizerRef)}
          >
            <div>
              <p className="text-xs font-bold text-slate-900">Shirt Color</p>
              <div className="mt-2.5 grid grid-cols-5 gap-2.5">
                {['#ffffff', '#111827', '#9ca3af', '#1f3b73', '#ef4444', '#fbbf24', '#22c55e', '#8b5cf6', '#f9a8d4', '#f5deb3'].map((color, index) => (
                  <button
                    key={color}
                    type="button"
                    className={`h-7 w-7 rounded-full border-2 transition ${shirtColor === color ? 'border-indigo-500 ring-2 ring-indigo-200 scale-110' : 'border-transparent hover:scale-105'}`}
                    style={{ backgroundColor: color }}
                    aria-label={`Color ${index + 1}`}
                    onClick={() => {
                      setShirtColor(color);
                      heroRef.current?.setColor(color);
                    }}
                  />
                ))}
              </div>
            </div>

            <div className="border-t pt-3">
              <p className="text-xs font-bold text-slate-900">Imprint Custom Text</p>
              <div className="mt-2 flex gap-2">
                <input
                  type="text"
                  value={tempText}
                  onChange={(e) => setTempText(e.target.value)}
                  placeholder="Type text overlay..."
                  className="flex-1 px-2.5 py-1.5 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-indigo-500 text-slate-800 bg-slate-50/50 min-w-0"
                />
                <button
                  type="button"
                  onClick={handleAddText}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition shadow-xs shrink-0 cursor-pointer"
                >
                  Add Text
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
