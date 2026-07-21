import { useState, useEffect } from "react";
import Navbar from "../components/Navbar/RNavbar";
import Sidebar from "../components/Sidebar/Sidebar";
import Footer from "../components/Footer/Footer";
import TShirt2D from "../components/TShirt2D";
import TShirt3DModal from "../components/TShirt3DModal";
import { Palette, Edit, AlertCircle } from "lucide-react";
import axios from "axios";

import { API_BASE_URL } from "../config/api";

export default function MyDesignsPage() {
  const [designs, setDesigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selected3DDesign, setSelected3DDesign] = useState(null);
  const [is3DModalOpen, setIs3DModalOpen] = useState(false);

  useEffect(() => {
    fetchDesigns();
  }, []);

  const fetchDesigns = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      window.location.href = "/login?redirect=/my-designs";
      return;
    }
    const headers = { Authorization: `Bearer ${token}` };

    try {
      const res = await axios.get(`${API_BASE_URL}/auth/designs`, { headers });
      setDesigns(res.data);
    } catch (err) {
      console.error("Fetch customer designs error:", err);
      setError("Failed to load saved designs. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleLoadDesign = (design) => {
    localStorage.setItem("load_custom_design", JSON.stringify(design));
    window.location.href = "/designer";
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col text-slate-800 font-sans">
      <Navbar />

      <div className="flex flex-1 overflow-hidden">
        <Sidebar />

        <main className="flex-1 overflow-y-auto p-8 lg:ml-72 select-none">
          <div className="max-w-6xl mx-auto space-y-8">
            {/* Header */}
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-black text-slate-900">My Custom Designs</h2>
                <p className="text-xs text-slate-500 mt-1">Your saved 3D t-shirt customizations</p>
              </div>
              <a
                href="/designer"
                className="flex items-center gap-1.5 px-4.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold shadow-[0_4px_12px_rgba(99,102,241,0.25)] transition"
              >
                <Palette className="h-4 w-4" />
                New Design
              </a>
            </div>

            {loading ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
              </div>
            ) : error ? (
              <div className="flex items-center gap-2 p-4 rounded-xl border border-rose-100 bg-rose-50 text-rose-600 text-sm font-semibold">
                <AlertCircle className="h-5 w-5 shrink-0" />
                <span>{error}</span>
              </div>
            ) : designs.length === 0 ? (
              <div className="bg-white border border-slate-200/80 rounded-3xl p-12 text-center shadow-sm space-y-4">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-indigo-50 border border-indigo-100 text-indigo-600">
                  <Palette className="h-8 w-8" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-lg font-black text-slate-900">No Saved Designs Yet</h3>
                  <p className="text-sm text-slate-500 max-w-sm mx-auto">
                    Use our interactive 3D Customizer to place graphics, text, and logos onto your shirts.
                  </p>
                </div>
                <a
                  href="/designer"
                  className="inline-flex items-center gap-1.5 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold transition shadow-sm"
                >
                  Start Designing
                </a>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                {designs.map((design) => (
                  <div key={design._id} className="bg-white border border-slate-200/80 rounded-3xl p-5 shadow-sm hover:shadow-md transition flex flex-col justify-between space-y-4">
                    {/* T-Shirt Preview Box */}
                    <div className="bg-slate-50 rounded-2xl p-4 flex items-center justify-center border border-slate-100 min-h-[180px]">
                      <TShirt2D color={design.fabricColor} designUrl={design.thumbnailUrl} layers={design.layers} className="h-40 w-40" />
                    </div>

                    {/* Details */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-start">
                        <h4 className="font-extrabold text-slate-900 text-sm capitalize">{design.tShirtType}</h4>
                        <span className="text-indigo-600 font-bold text-sm">Rs. {design.estimatedCost?.toFixed(2)}</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-wide">
                        <span className="bg-slate-100 px-2 py-0.5 rounded-full">{design.material}</span>
                        <span className="bg-slate-100 px-2 py-0.5 rounded-full">Size {design.size}</span>
                        <span className="bg-slate-100 px-2 py-0.5 rounded-full">{design.layers?.length || 0} Layers</span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2.5 pt-2 border-t border-slate-100">
                      <button
                        onClick={() => handleLoadDesign(design)}
                        className="flex-1 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-655 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5"
                      >
                        <Edit className="h-3.5 w-3.5" />
                        Customize
                      </button>
                      <button
                        onClick={() => {
                          setSelected3DDesign(design);
                          setIs3DModalOpen(true);
                        }}
                        className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5"
                      >
                        <Palette className="h-3.5 w-3.5 text-indigo-600" />
                        View 3D
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>

      <Footer withSidebarOffset />

      <TShirt3DModal
        isOpen={is3DModalOpen}
        onClose={() => {
          setIs3DModalOpen(false);
          setSelected3DDesign(null);
        }}
        design={selected3DDesign}
      />
    </div>
  );
}
