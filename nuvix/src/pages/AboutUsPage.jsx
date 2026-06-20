import { useState, useEffect } from "react";
import RNavbar from "../components/Navbar/RNavbar";
import GNavbar from "../components/Navbar/GNavbar";
import Sidebar from "../components/Sidebar/Sidebar";
import Footer from "../components/Footer/Footer";
import { Shield, Sparkles, Heart, Award } from "lucide-react";

export default function AboutUsPage() {
  const [token, setToken] = useState(null);

  useEffect(() => {
    setToken(localStorage.getItem("token"));
  }, []);

  const Navbar = token ? RNavbar : GNavbar;

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col text-slate-800 font-sans">
      <Navbar />

      <div className="flex flex-1 overflow-hidden">
        {token && <Sidebar />}

        <main className={`flex-1 overflow-y-auto p-8 select-none ${token ? "lg:ml-72" : ""}`}>
          <div className="max-w-4xl mx-auto space-y-12">
            {/* Header / Hero */}
            <div className="text-center space-y-4">
              <h2 className="text-3xl font-black text-slate-900 leading-tight">About PrintSphere</h2>
              <p className="text-sm text-slate-500 max-w-xl mx-auto">
                Empowering creativity through state-of-the-art 3D t-shirt customization and premium on-demand printing services.
              </p>
            </div>

            {/* Core Story */}
            <div className="bg-white border border-slate-200/80 rounded-3xl p-8 shadow-sm space-y-6">
              <h3 className="text-lg font-black text-slate-900">Our Vision</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                At PrintSphere, we believe fashion is the ultimate canvas for self-expression. Founded in 2026, our platform merges an intuitive 3D real-time designer interface with commercial grade apparel production systems. We handle everything from the interactive render to final packaging, delivering custom artwork onto high-quality fabric straight to your doorstep.
              </p>
            </div>

            {/* Features / Pitch */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm flex gap-4 items-start">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600 shrink-0">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div className="space-y-1">
                  <h4 className="font-extrabold text-slate-900 text-sm">3D Live Customizer</h4>
                  <p className="text-[11px] text-slate-500 leading-relaxed">Position your graphics, logos, and typography in a real-time 3D space with high fidelity materials.</p>
                </div>
              </div>

              <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm flex gap-4 items-start">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600 shrink-0">
                  <Shield className="h-5 w-5" />
                </div>
                <div className="space-y-1">
                  <h4 className="font-extrabold text-slate-900 text-sm">Premium Materials</h4>
                  <p className="text-[11px] text-slate-500 leading-relaxed">Heavy-weight GSM cotton options, organic materials, and double-stitched durability standard.</p>
                </div>
              </div>

              <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm flex gap-4 items-start">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600 shrink-0">
                  <Award className="h-5 w-5" />
                </div>
                <div className="space-y-1">
                  <h4 className="font-extrabold text-slate-900 text-sm">Print Perfection</h4>
                  <p className="text-[11px] text-slate-500 leading-relaxed">Direct-to-Garment (DTG) technology produces sharp details and vibrant colors that endure.</p>
                </div>
              </div>

              <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm flex gap-4 items-start">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600 shrink-0">
                  <Heart className="h-5 w-5" />
                </div>
                <div className="space-y-1">
                  <h4 className="font-extrabold text-slate-900 text-sm">Eco-Conscious</h4>
                  <p className="text-[11px] text-slate-500 leading-relaxed">Water-based vegan inks, zero-waste inventory production, and plastic-free compostable packages.</p>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      <Footer withSidebarOffset={!!token} />
    </div>
  );
}
