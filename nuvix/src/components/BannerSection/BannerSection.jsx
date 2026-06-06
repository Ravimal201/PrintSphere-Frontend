export default function BannerSection() {
  return (
    <section className="mb-8 overflow-hidden bg-white">
      <div className="grid items-center gap-4 px-0 py-4 sm:px-0 lg:grid-cols-[1.05fr_0.95fr] lg:gap-6 lg:px-0 lg:py-0">
        <div className="max-w-xl px-4 sm:px-6 lg:px-8">
          <p className="text-sm font-medium tracking-wide text-slate-500">Create. Wear. Inspire.</p>

          <h2 className="mt-4 text-4xl font-bold tracking-tight text-slate-950 sm:text-5xl">
            Make It Yours Today!
          </h2>

          <p className="mt-4 max-w-lg text-base leading-7 text-slate-600 sm:text-lg">
            Unleash your creativity and turn your ideas into amazing T-shirts.
          </p>

          <a
            href="#"
            className="mt-8 inline-flex items-center gap-3 rounded-2xl bg-linear-to-r from-indigo-600 via-violet-600 to-fuchsia-600 px-7 py-3.5 text-base font-semibold text-white shadow-lg shadow-indigo-200 transition hover:-translate-y-0.5 hover:from-indigo-500 hover:via-violet-500 hover:to-fuchsia-500"
          >
            Start Designing Now
            <span aria-hidden="true" className="text-lg leading-none">→</span>
          </a>
        </div>

        <div className="relative flex items-center justify-center px-4 sm:px-6 lg:justify-end lg:px-0">
          <div className="relative w-full max-w-96 sm:max-w-md lg:max-w-xl">
            <img
              src="/images/dumyImage.png"
              alt="T-shirt design banner preview"
              className="w-full object-contain drop-shadow-[0_24px_50px_rgba(99,102,241,0.22)]"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
