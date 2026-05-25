import { ChevronDown, Heart, Star } from "lucide-react";

const products = [
  {
    name: "Wolf Graphic Tee",
    price: "$24.99",
    rating: "4.7",
    accent: "from-slate-100 via-white to-indigo-50",
    shirt: "before:bg-[linear-gradient(145deg,#ffffff_0%,#f3f4f6_100%)]",
    graphic: "bg-[radial-gradient(circle_at_top,#111827_0%,#6b7280_32%,#a855f7_70%,transparent_72%)]",
  },
  {
    name: "NOWIX Classic Tee",
    price: "$22.99",
    rating: "4.6",
    accent: "from-slate-900 via-slate-950 to-slate-700",
    shirt: "before:bg-[linear-gradient(145deg,#111827_0%,#000000_100%)]",
    graphic: "bg-[radial-gradient(circle_at_top,#f5f3ff_0%,#a78bfa_22%,#111827_65%,transparent_72%)]",
  },
  {
    name: "Splash Design Tee",
    price: "$23.99",
    rating: "4.8",
    accent: "from-slate-50 via-white to-slate-100",
    shirt: "before:bg-[linear-gradient(145deg,#ffffff_0%,#f8fafc_100%)]",
    graphic: "bg-[radial-gradient(circle_at_top,#18181b_0%,#52525b_38%,#d1d5db_66%,transparent_72%)]",
  },
  {
    name: "Neon Wolf Tee",
    price: "$25.99",
    rating: "4.9",
    accent: "from-slate-950 via-slate-900 to-slate-700",
    shirt: "before:bg-[linear-gradient(145deg,#111827_0%,#030712_100%)]",
    graphic: "bg-[radial-gradient(circle_at_top,#7c3aed_0%,#a855f7_26%,#111827_68%,transparent_74%)]",
  },
];

function ProductCard({ product }) {
  const slug = product.name.replace(/\s+/g, "-").toLowerCase();

  return (
    <article className="group rounded-3xl border border-slate-200/80 bg-white p-4 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-lg">
      <div className="flex items-center justify-between px-1 pt-1 text-slate-500">
        <span className="text-[11px] font-medium uppercase tracking-[0.22em] text-slate-400">New</span>
        <button
          type="button"
          className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-white transition hover:border-indigo-200 hover:text-indigo-600"
          aria-label={`Add ${product.name} to favorites`}
        >
          <Heart className="h-4 w-4" />
        </button>
      </div>

      <div className={`mt-2 flex h-68 items-center justify-center overflow-hidden rounded-[1.75rem] bg-linear-to-b ${product.accent}`}>
        <svg viewBox="0 0 220 220" className="h-56 w-56 drop-shadow-[0_18px_24px_rgba(15,23,42,0.12)]" aria-hidden="true">
          <defs>
            <linearGradient id={`shirt-${slug}`} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor={product.name.includes("Classic") || product.name.includes("Neon") ? "#111827" : "#ffffff"} />
              <stop offset="100%" stopColor={product.name.includes("Classic") || product.name.includes("Neon") ? "#050816" : "#f3f4f6"} />
            </linearGradient>
            <radialGradient id={`glow-${slug}`} cx="50%" cy="30%" r="65%">
              <stop offset="0%" stopColor={product.name.includes("Neon") ? "#a855f7" : "#6b7280"} stopOpacity="0.95" />
              <stop offset="55%" stopColor={product.name.includes("Neon") ? "#7c3aed" : "#d1d5db"} stopOpacity="0.8" />
              <stop offset="100%" stopColor="transparent" />
            </radialGradient>
          </defs>

          <ellipse cx="110" cy="104" rx="62" ry="72" fill={`url(#glow-${slug})`} opacity="0.7" />

          <path
            d="M84 34c6 11 16 17 26 17s20-6 26-17l28 12-15 34-18-7v99H89V73l-18 7-15-34 28-12z"
            fill={`url(#shirt-${slug})`}
            stroke={product.name.includes("NOWIX") || product.name.includes("Neon") ? "#0f172a" : "#e5e7eb"}
            strokeWidth="2"
            strokeLinejoin="round"
          />

          <path
            d="M94 49c4 6 10 9 16 9s12-3 16-9"
            fill="none"
            stroke={product.name.includes("NOWIX") || product.name.includes("Neon") ? "#f8fafc" : "#cbd5e1"}
            strokeWidth="3"
            strokeLinecap="round"
          />

          <path
            d="M110 76c-18 0-32 16-32 34 0 14 9 26 22 31v23h20v-23c13-5 22-17 22-31 0-18-14-34-32-34z"
            fill={product.name.includes("Neon") ? "#111827" : product.name.includes("NOWIX") ? "#e5e7eb" : "#ffffff"}
            opacity="0.72"
          />

          <path
            d="M97 91l13 13 13-13 9 10-22 23-22-23 9-10z"
            fill={product.name.includes("Neon") ? "#a855f7" : "#111827"}
            opacity="0.95"
          />

          <circle cx="110" cy="124" r="26" fill="none" stroke={product.name.includes("Neon") ? "#d8b4fe" : "#111827"} strokeOpacity="0.18" strokeWidth="2" />

          <text x="110" y="153" textAnchor="middle" fontSize="11" fontWeight="800" letterSpacing="3" fill={product.name.includes("Neon") || product.name.includes("NOWIX") ? "#f8fafc" : "#111827"} opacity="0.9">
            NOWIX
          </text>
        </svg>
      </div>

      <div className="mt-4 px-1 pb-1">
        <h3 className="text-sm font-medium text-slate-900">{product.name}</h3>
        <div className="mt-2 flex items-center justify-between gap-3">
          <p className="text-sm font-semibold text-slate-900">{product.price}</p>

          <div className="flex items-center gap-1 text-amber-500">
            <Star className="h-3.5 w-3.5 fill-current" />
            <span className="text-xs font-medium text-slate-500">{product.rating}</span>
          </div>
        </div>
      </div>
    </article>
  );
}

export default function PopularProducts() {
  return (
    <section className="mb-8 rounded-4xl border border-slate-200/70 bg-white px-4 py-6 shadow-sm sm:px-6 lg:px-8">
      <div className="text-center">
        <p className="text-sm font-semibold uppercase tracking-[0.28em] text-slate-500">
          Popular Products
        </p>
        <div className="mx-auto mt-3 h-1 w-16 rounded-full bg-indigo-600" />
      </div>

      <div className="mt-6 flex flex-col gap-4 border-b border-slate-100 pb-5 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm"
          >
            All
          </button>

          {['Category', 'Color', 'Size'].map((item) => (
            <button
              key={item}
              type="button"
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 transition hover:border-indigo-200 hover:text-slate-900"
            >
              {item}
              <ChevronDown className="h-4 w-4" />
            </button>
          ))}
        </div>

        <a href="#" className="inline-flex items-center gap-2 text-sm font-semibold text-indigo-600 transition hover:text-indigo-700">
          View All
          <span aria-hidden="true">→</span>
        </a>
      </div>

      <div className="mt-5 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {products.map((product) => (
          <ProductCard key={product.name} product={product} />
        ))}
      </div>
    </section>
  );
}