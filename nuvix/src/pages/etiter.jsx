import { useState } from "react";
import Navbar from "../components/Navbar/GNavbar";
import Hero3DPreview from "../components/HeroSection/Hero3DPreview";

const colorChoices = [
	"#ffffff",
	"#111827",
	"#1f3b73",
	"#ef4444",
	"#22c55e",
	"#f59e0b",
	"#8b5cf6",
	"#f9a8d4",
];

export default function EtiterPage() {
	const [scale, setScale] = useState(0.5);
	const [shirtColor, setShirtColor] = useState("#ffffff");

	return (
		<div className="min-h-screen bg-[radial-gradient(circle_at_top,_#eef2ff,_#f8fafc_48%,_#e2e8f0_100%)]">
			<Navbar />

			<main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
				<section className="overflow-hidden rounded-[2rem] border border-white/70 bg-white/70 shadow-[0_24px_90px_rgba(15,23,42,0.08)] backdrop-blur">
					<div className="grid gap-0 lg:grid-cols-[380px_minmax(0,1fr)]">
						<aside className="border-b border-slate-200/80 bg-slate-950 px-6 py-8 text-white lg:border-b-0 lg:border-r">
							<p className="text-xs font-semibold uppercase tracking-[0.35em] text-indigo-300">
								3D T-Shirt Editor
							</p>

							<h1 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">
								Simple editing page with a live 3D preview.
							</h1>

							<p className="mt-4 max-w-sm text-sm leading-6 text-slate-300 sm:text-base">
								Use the buttons to change the shirt color, zoom the model, or reset the view.
								The 3D shirt starts at 50% zoom on first load.
							</p>

							<div className="mt-8 space-y-3">
								<div className="rounded-3xl bg-white/5 p-4 ring-1 ring-white/10">
									<p className="text-sm font-medium text-slate-200">Zoom controls</p>
									<div className="mt-3 flex flex-wrap gap-2">
										{[0.5, 1, 1.5, 2].map((value) => (
											<button
												key={value}
												type="button"
												onClick={() => setScale(value)}
												className={`rounded-2xl px-4 py-2 text-sm font-semibold transition ${
													scale === value
														? "bg-indigo-500 text-white"
														: "bg-white/10 text-slate-200 hover:bg-white/15"
												}`}
											>
												{value}x
											</button>
										))}
									</div>
								</div>

								<div className="rounded-3xl bg-white/5 p-4 ring-1 ring-white/10">
									<p className="text-sm font-medium text-slate-200">Shirt colors</p>
									<div className="mt-3 grid grid-cols-4 gap-3">
										{colorChoices.map((color) => (
											<button
												key={color}
												type="button"
												onClick={() => setShirtColor(color)}
												className={`h-11 rounded-2xl border-2 transition ${
													shirtColor === color
														? "border-white shadow-[0_0_0_4px_rgba(99,102,241,0.3)]"
														: "border-transparent hover:scale-[1.03]"
												}`}
												style={{ backgroundColor: color }}
												aria-label={`Pick ${color}`}
											/>
										))}
									</div>
								</div>

								<div className="rounded-3xl bg-white/5 p-4 ring-1 ring-white/10 text-sm text-slate-300">
									Tip: scroll over the preview to zoom the shirt itself.
								</div>
							</div>
						</aside>

						<div className="p-4 sm:p-6 lg:p-8">
							<div className="mb-6 flex items-end justify-between gap-4">
								<div>
									<p className="text-sm font-semibold uppercase tracking-[0.3em] text-indigo-600">
										Live Preview
									</p>
									<h2 className="mt-2 text-2xl font-bold text-slate-900 sm:text-3xl">
										3D shirt view
									</h2>
								</div>

								<div className="hidden rounded-full bg-indigo-50 px-4 py-2 text-sm font-medium text-indigo-700 sm:block">
									Current zoom: {scale}x
								</div>
							</div>

							<div className="rounded-[2rem] border border-slate-200 bg-white p-4 shadow-inner shadow-slate-200/50 sm:p-6">
								<Hero3DPreview
									scale={scale}
									onScaleChange={setScale}
									color={shirtColor}
									onColorChange={setShirtColor}
								/>

								<div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-3xl bg-slate-50 px-4 py-3 text-sm text-slate-600 ring-1 ring-slate-200">
									<span>Zoom starts at 50% on page load.</span>
									<span>Use mouse wheel, click, or buttons to adjust the model.</span>
								</div>
							</div>
						</div>
					</div>
				</section>
			</main>
		</div>
	);
}
