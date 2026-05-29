import { Layers, Sparkles, Truck } from "lucide-react";
import { useRef, useState } from "react";
import Hero3DPreview from "./Hero3DPreview";

export default function HeroSection() {
  const heroRef = useRef(null);
  const [scale, setScale] = useState(1.6);
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
              className="inline-flex items-center gap-2 rounded-2xl bg-linear-to-r from-indigo-600 via-violet-600 to-fuchsia-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-200 transition hover:-translate-y-0.5 hover:from-indigo-500 hover:via-violet-500 hover:to-fuchsia-500"
            >
              Start Designing
              <span aria-hidden="true">→</span>
            </a>

            <a
              href="#"
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

          <div className="hidden lg:absolute lg:left-0 lg:top-1/2 lg:flex lg:-translate-y-1/2 z-20">
            <div className="flex flex-col gap-3 rounded-3xl bg-white/90 p-4 shadow-xl shadow-indigo-100 ring-1 ring-white/70 backdrop-blur">
              {['↖', 'T', '▣', '◌', '⟲', '⌫'].map((item) => (
                <div key={item} className="flex h-10 w-10 items-center justify-center rounded-2xl text-xl text-slate-700 shadow-sm hover:bg-indigo-50">
                  {item}
                </div>
              ))}
            </div>
          </div>

          <div className="hidden lg:flex relative z-10 w-full max-w-130 flex-col items-center justify-center rounded-4xl border border-white/70 bg-white/60 px-6 py-8 shadow-[0_20px_60px_rgba(99,102,241,0.12)] backdrop-blur-md sm:px-8">
            <Hero3DPreview ref={heroRef} onScaleChange={setScale} />

            <div className="mt-8 flex w-full items-center gap-4 rounded-2xl bg-white px-4 py-3 shadow-sm ring-1 ring-slate-200">
              <button
                className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-600 hover:bg-slate-100"
                type="button"
                onClick={() => {
                  heroRef.current?.reset();
                  setScale(1.6);
                }}
              >
                ↻
              </button>

              <div className="flex-1 px-3">
                <div className="relative h-4 rounded-full bg-indigo-200/60">
                  <div className="absolute inset-0 rounded-full bg-indigo-200/40" />

                  {/* decorative secondary dot */}
                  <div
                    className="absolute top-1/2 h-3 w-3 -translate-y-1/2 rounded-full bg-indigo-300 opacity-60"
                    style={{ left: `calc(${((scale - 0.5) / (2.5 - 0.5)) * 100}% - 6px)` }}
                  />

                  {/* visible thumb (follows state) */}
                  <div
                    className="absolute top-1/2 h-4 w-4 -translate-y-1/2 rounded-full bg-indigo-600 shadow pointer-events-none"
                    style={{ left: `${((scale - 0.5) / (2.5 - 0.5)) * 100}%`, transform: 'translate(-50%, -50%)' }}
                  />

                  {/* invisible input overlay for native dragging */}
                  <input
                    aria-label="Scale"
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
              </div>

              <button
                className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-600 hover:bg-slate-100"
                type="button"
                onClick={() => {
                  const v = 2.2;
                  setScale(v);
                  heroRef.current?.setScale(v);
                }}
              >
                ⤢
              </button>
            </div>
          </div>

          <div className="hidden lg:absolute lg:right-3 lg:top-10 lg:block lg:w-52 rounded-3xl bg-white p-4 shadow-xl shadow-indigo-100 ring-1 ring-white/70 z-20">
            <p className="text-sm font-semibold text-slate-900">Shirt Color</p>
            <div className="mt-4 grid grid-cols-5 gap-3">
              {['#ffffff', '#111827', '#9ca3af', '#1f3b73', '#ef4444', '#fbbf24', '#22c55e', '#8b5cf6', '#f9a8d4', '#f5deb3'].map((color, index) => (
                <button
                  key={color}
                  type="button"
                  className={`h-9 w-9 rounded-full border-2 ${index === 0 ? 'border-indigo-500 ring-2 ring-indigo-200' : 'border-transparent'}`}
                  style={{ backgroundColor: color }}
                  aria-label={`Color ${index + 1}`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
