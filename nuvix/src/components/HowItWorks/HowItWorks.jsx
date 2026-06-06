import { Shirt, PenLine, Package, ArrowRight } from "lucide-react";

export default function HowItWorks() {
  return (
    <section className="mb-8 rounded-4xl border border-white/70 bg-white px-5 py-8 shadow-sm sm:px-6 lg:px-8">
      <div className="text-center">
        <p className="text-sm font-semibold uppercase tracking-[0.28em] text-slate-500">How It Works</p>
        <div className="mx-auto mt-3 h-1 w-16 rounded-full bg-indigo-600" />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-3 lg:gap-4">
        <div className="relative flex items-start gap-4 rounded-3xl border border-slate-100 bg-slate-50/70 p-5 shadow-[0_10px_30px_rgba(15,23,42,0.04)]">
          <div className="relative flex h-16 w-16 flex-none items-center justify-center rounded-full border border-slate-200 bg-white text-slate-900">
            <Shirt className="h-7 w-7" />
            <span className="absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full bg-indigo-600 text-xs font-bold text-white shadow-md shadow-indigo-200">1</span>
          </div>

          <div className="min-w-0 flex-1">
            <h3 className="text-lg font-semibold text-slate-900">Choose Product</h3>
            <p className="mt-1 max-w-sm text-sm leading-6 text-slate-600">Select your favorite T-shirt style, color and size.</p>
          </div>

          <ArrowRight className="mt-4 hidden h-5 w-5 flex-none text-slate-400 lg:block" />
        </div>

        <div className="relative flex items-start gap-4 rounded-3xl border border-slate-100 bg-slate-50/70 p-5 shadow-[0_10px_30px_rgba(15,23,42,0.04)]">
          <div className="relative flex h-16 w-16 flex-none items-center justify-center rounded-full border border-slate-200 bg-white text-slate-900">
            <PenLine className="h-7 w-7" />
            <span className="absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full bg-indigo-600 text-xs font-bold text-white shadow-md shadow-indigo-200">2</span>
          </div>

          <div className="min-w-0 flex-1">
            <h3 className="text-lg font-semibold text-slate-900">Customize Design</h3>
            <p className="mt-1 max-w-sm text-sm leading-6 text-slate-600">Use our 3D designer to add text, images and more.</p>
          </div>

          <ArrowRight className="mt-4 hidden h-5 w-5 flex-none text-slate-400 lg:block" />
        </div>

        <div className="relative flex items-start gap-4 rounded-3xl border border-slate-100 bg-slate-50/70 p-5 shadow-[0_10px_30px_rgba(15,23,42,0.04)]">
          <div className="relative flex h-16 w-16 flex-none items-center justify-center rounded-full border border-slate-200 bg-white text-slate-900">
            <Package className="h-7 w-7" />
            <span className="absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full bg-indigo-600 text-xs font-bold text-white shadow-md shadow-indigo-200">3</span>
          </div>

          <div className="min-w-0 flex-1">
            <h3 className="text-lg font-semibold text-slate-900">Place Order</h3>
            <p className="mt-1 max-w-sm text-sm leading-6 text-slate-600">Review your design and place your order.</p>
          </div>
        </div>
      </div>
    </section>
  );
}
