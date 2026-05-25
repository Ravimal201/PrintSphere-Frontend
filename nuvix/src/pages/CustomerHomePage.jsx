import Navbar from "../components/Navbar/RNavbar";
import Sidebar from "../components/Sidebar/Sidebar";
import Footer from "../components/Footer/Footer";
import DashboardCard from "../components/DashboardCard/DashboardCard";
import PopularProducts from "../components/PopularProducts/PopularProducts";
import heroImage from "../assets/hero.png";
import { Layers, Sparkles, Truck, Shirt, PenLine, Package, ArrowRight } from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">

      <Navbar />

      <div className="flex flex-1 overflow-hidden">

        <Sidebar />

        <main className="flex-1 overflow-auto p-8 lg:ml-72">

          {/* Hero */}
          <section className="relative mb-8 overflow-hidden rounded-[2rem] border border-indigo-100 bg-gradient-to-br from-white via-indigo-50 to-indigo-100/80 p-6 shadow-[0_24px_80px_rgba(99,102,241,0.12)] lg:p-8">
            <div className="absolute inset-x-6 top-5 h-px bg-gradient-to-r from-transparent via-indigo-200 to-transparent" />
            <div className="grid items-center gap-8 lg:grid-cols-[1.05fr_1fr]">
              <div className="relative z-10 max-w-xl mx-auto text-center lg:text-left">
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

                <div className="mt-8 flex flex-wrap gap-4 justify-center lg:justify-start">
                  <a
                    href="#"
                    className="inline-flex items-center gap-2 rounded-2xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-200 transition hover:-translate-y-0.5 hover:bg-indigo-700"
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

                <div className="mt-8 grid gap-3 sm:grid-cols-3 justify-center lg:justify-start">
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

              <div className="hidden lg:relative lg:flex lg:min-h-[520px] lg:items-center lg:justify-center">
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

                <div className="hidden lg:flex relative z-10 w-full max-w-[520px] flex-col items-center justify-center rounded-[2rem] border border-white/70 bg-white/60 px-6 py-8 shadow-[0_20px_60px_rgba(99,102,241,0.12)] backdrop-blur-md sm:px-8">
                  <img
                    src={heroImage}
                    alt="3D product preview"
                    className="w-full max-w-[320px] select-none drop-shadow-[0_20px_25px_rgba(79,70,229,0.18)]"
                  />

                  <div className="mt-8 flex w-full items-center gap-3 rounded-2xl bg-white px-3 py-2 shadow-sm ring-1 ring-slate-200">
                    <button className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-600 hover:bg-slate-100" type="button">
                      ↻
                    </button>
                    <div className="flex-1 rounded-full bg-slate-100 px-3 py-2">
                      <div className="relative h-1.5 rounded-full bg-indigo-200">
                        <div className="absolute left-1/2 top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full bg-indigo-600 shadow" />
                      </div>
                    </div>
                    <button className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-600 hover:bg-slate-100" type="button">
                      ⤢
                    </button>
                  </div>
                </div>

                <div className="hidden lg:absolute lg:right-3 lg:top-10 lg:w-52 lg:block rounded-3xl bg-white p-4 shadow-xl shadow-indigo-100 ring-1 ring-white/70 z-20">
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

          {/* Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">

            <DashboardCard
              title="Orders Completed"
              value="1,240"
            />

            <DashboardCard
              title="Unique Designs"
              value="846"
            />

            <DashboardCard
              title="Premium Products"
              value="120"
            />

            <DashboardCard
              title="Customer Rating"
              value="4.8/5"
            />

          </div>

          {/* How It Works */}
          <section className="mb-8 rounded-[2rem] border border-white/70 bg-white px-5 py-8 shadow-sm sm:px-6 lg:px-8">
            <div className="text-center">
              <p className="text-sm font-semibold uppercase tracking-[0.28em] text-slate-500">
                How It Works
              </p>
              <div className="mx-auto mt-3 h-1 w-16 rounded-full bg-indigo-600" />
            </div>

            <div className="mt-8 grid gap-6 lg:grid-cols-3 lg:gap-4">
              <div className="relative flex items-start gap-4 rounded-[1.5rem] border border-slate-100 bg-slate-50/70 p-5 shadow-[0_10px_30px_rgba(15,23,42,0.04)]">
                <div className="relative flex h-16 w-16 flex-none items-center justify-center rounded-full border border-slate-200 bg-white text-slate-900">
                  <Shirt className="h-7 w-7" />
                  <span className="absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full bg-indigo-600 text-xs font-bold text-white shadow-md shadow-indigo-200">
                    1
                  </span>
                </div>

                <div className="min-w-0 flex-1">
                  <h3 className="text-lg font-semibold text-slate-900">Choose Product</h3>
                  <p className="mt-1 max-w-sm text-sm leading-6 text-slate-600">
                    Select your favorite T-shirt style, color and size.
                  </p>
                </div>

                <ArrowRight className="mt-4 hidden h-5 w-5 flex-none text-slate-400 lg:block" />
              </div>

              <div className="relative flex items-start gap-4 rounded-[1.5rem] border border-slate-100 bg-slate-50/70 p-5 shadow-[0_10px_30px_rgba(15,23,42,0.04)]">
                <div className="relative flex h-16 w-16 flex-none items-center justify-center rounded-full border border-slate-200 bg-white text-slate-900">
                  <PenLine className="h-7 w-7" />
                  <span className="absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full bg-indigo-600 text-xs font-bold text-white shadow-md shadow-indigo-200">
                    2
                  </span>
                </div>

                <div className="min-w-0 flex-1">
                  <h3 className="text-lg font-semibold text-slate-900">Customize Design</h3>
                  <p className="mt-1 max-w-sm text-sm leading-6 text-slate-600">
                    Use our 3D designer to add text, images and more.
                  </p>
                </div>

                <ArrowRight className="mt-4 hidden h-5 w-5 flex-none text-slate-400 lg:block" />
              </div>

              <div className="relative flex items-start gap-4 rounded-[1.5rem] border border-slate-100 bg-slate-50/70 p-5 shadow-[0_10px_30px_rgba(15,23,42,0.04)]">
                <div className="relative flex h-16 w-16 flex-none items-center justify-center rounded-full border border-slate-200 bg-white text-slate-900">
                  <Package className="h-7 w-7" />
                  <span className="absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full bg-indigo-600 text-xs font-bold text-white shadow-md shadow-indigo-200">
                    3
                  </span>
                </div>

                <div className="min-w-0 flex-1">
                  <h3 className="text-lg font-semibold text-slate-900">Place Order</h3>
                  <p className="mt-1 max-w-sm text-sm leading-6 text-slate-600">
                    Review your design and place your order.
                  </p>
                </div>
              </div>
            </div>
          </section>

          <PopularProducts />

        </main>

      </div>

      <Footer />

    </div>
  );
}