import { useState, useEffect } from "react";
import RNavbar from "../components/Navbar/RNavbar";
import GNavbar from "../components/Navbar/GNavbar";
import Sidebar from "../components/Sidebar/Sidebar";
import Footer from "../components/Footer/Footer";
import { 
  Shirt, 
  Sparkles, 
  ShieldCheck, 
  Truck, 
  Layers, 
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Cpu,
  Palette
} from "lucide-react";

export default function HowItWorksPage() {
  const [token, setToken] = useState(null);
  const [activeTab, setActiveTab] = useState("customize");
  const [openFaq, setOpenFaq] = useState(null);

  useEffect(() => {
    setToken(localStorage.getItem("token"));
  }, []);

  const Navbar = token ? RNavbar : GNavbar;

  const faqs = [
    {
      q: "What printing technology does PrintSphere use?",
      a: "We utilize industrial-grade Direct-to-Garment (DTG) and high-quality sublimation printers. This allows us to print multi-colored graphics, fine lines, and gradients directly onto the fabric, preserving the softness of the cotton while providing maximum color durability."
    },
    {
      q: "How does the 3D Customizer work?",
      a: "Our customizer utilizes WebGL/Three.js technology to render a true 3D model of your selected garment. You can upload custom designs, adjust sizing/positioning on the front or back, and see real-time mockups before committing to purchase."
    },
    {
      q: "What is the recommended file format for designs?",
      a: "For the absolute best print result, we recommend transparent PNG or SVG vector files with a resolution of at least 300 DPI. High-resolution files prevent pixelation during the fabric transfer process."
    },
    {
      q: "How long does production and shipping take?",
      a: "Once you place your order, production takes about 1-3 business days. Shipping usually takes 3-7 business days depending on your location. You will receive tracking details via email as soon as your package ships."
    },
    {
      q: "Are the inks eco-friendly?",
      a: "Yes, we exclusively use water-based, non-toxic, and biodegradable inks that are safe for you and safe for the environment. Our production process focuses on reducing water wastage and chemical usage."
    }
  ];

  const steps = [
    {
      id: "customize",
      title: "1. Interactive 3D Customization",
      subtitle: "Perfect your concept in real time",
      icon: Sparkles,
      color: "bg-amber-50 text-amber-600 border-amber-100",
      description: "Choose from our catalog of t-shirts, hoodies, and accessories. Upload your artwork, position it precisely on our responsive 3D model, change shirt colors, and preview the exact final product before placing an order.",
      details: [
        "Real-time 3D rotation & scaling",
        "Front and back canvas areas",
        "Material texture simulation",
        "Vibrant RGB color selection"
      ]
    },
    {
      id: "print",
      title: "2. Industrial DTG Printing",
      subtitle: "Vivid, durable color output",
      icon: Palette,
      color: "bg-indigo-50 text-indigo-600 border-indigo-100",
      description: "Once your design is confirmed, it is sent to our state-of-the-art Direct-to-Garment printing system. We treat each garment to secure the color pigment deep into the cotton fibers, ensuring long-lasting prints that won't crack or peel.",
      details: [
        "Oeko-Tex certified organic inks",
        "High-fidelity CMYK color spectrum",
        "Soft-touch fabric feel post-cure",
        "Double-pass printing for dark fabrics"
      ]
    },
    {
      id: "quality",
      title: "3. Double-Pass Quality Checks",
      subtitle: "Zero compromise on standards",
      icon: ShieldCheck,
      color: "bg-emerald-50 text-emerald-600 border-emerald-100",
      description: "Every item is manually inspected by our print specialists. We check color accuracy, design alignment, and fabric integrity, then pre-shrink the material using heat presses to guarantee the perfect fit stays perfect.",
      details: [
        "Manual alignment verification",
        "Color calibration check",
        "Hem and seam integrity audits",
        "Pre-wash shrink resistance"
      ]
    },
    {
      id: "ship",
      title: "4. Rapid Worldwide Delivery",
      subtitle: "Eco-packaging sent straight to you",
      icon: Truck,
      color: "bg-rose-50 text-rose-600 border-rose-100",
      description: "Finally, your custom gear is packed into our 100% biodegradable and compostable shipping bags. We partner with reliable global carriers to guarantee your tracking numbers update live and packages arrive at your doorstep swiftly.",
      details: [
        "Compostable paper packaging",
        "Live tracking link via SMS/Email",
        "Secure global shipping routes",
        "Hassle-free 14-day returns policy"
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col text-slate-800 font-sans">
      <Navbar />

      <div className="flex flex-1 overflow-hidden">
        {token && <Sidebar />}

        <main className={`flex-1 overflow-y-auto p-6 md:p-12 select-none ${token ? "lg:ml-72" : ""}`}>
          <div className="max-w-5xl mx-auto space-y-16">
            
            {/* Hero / Header */}
            <div className="text-center space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-600 text-xs font-semibold">
                <Cpu className="w-3.5 h-3.5" />
                <span>Next-Gen Print-on-Demand</span>
              </div>
              <h1 className="text-4xl md:text-5xl font-black text-slate-900 leading-tight tracking-tight">
                How We Make the Magic Happen
              </h1>
              <p className="text-base text-slate-500 max-w-2xl mx-auto leading-relaxed">
                From your initial creative spark to custom packaging delivered to your door. Learn about the technology, quality standards, and craftsmanship backing every order.
              </p>
            </div>

            {/* Steps Navigation / Showcase */}
            <div className="bg-white border border-slate-200/80 rounded-3xl p-6 md:p-8 shadow-sm grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Sidebar Tabs */}
              <div className="lg:col-span-5 flex flex-col gap-3">
                <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400 mb-2 px-2">The Production Journey</h3>
                {steps.map((step) => {
                  const Icon = step.icon;
                  const isActive = activeTab === step.id;
                  return (
                    <button
                      key={step.id}
                      onClick={() => setActiveTab(step.id)}
                      className={`w-full text-left flex items-center gap-4 p-4 rounded-2xl border transition-all ${
                        isActive 
                          ? "bg-slate-900 border-slate-950 text-white shadow-md shadow-slate-900/10 scale-[1.02]" 
                          : "bg-slate-50 hover:bg-slate-100 border-slate-100 text-slate-700 hover:text-slate-950"
                      }`}
                    >
                      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${
                        isActive ? "bg-white/10 border-white/20 text-white" : step.color
                      }`}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className={`text-xs font-semibold ${isActive ? "text-slate-300" : "text-slate-500"}`}>{step.subtitle}</p>
                        <h4 className="font-extrabold text-sm truncate mt-0.5">{step.title}</h4>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Showcase Detail Pane */}
              <div className="lg:col-span-7 bg-slate-50/50 border border-slate-100 rounded-2xl p-6 md:p-8 flex flex-col justify-between space-y-6">
                {steps.map((step) => {
                  if (step.id !== activeTab) return null;
                  const Icon = step.icon;
                  return (
                    <div key={step.id} className="space-y-6 animate-fadeIn">
                      <div className="space-y-2">
                        <span className="text-xs font-bold text-indigo-600 uppercase tracking-widest">{step.subtitle}</span>
                        <h3 className="text-2xl font-black text-slate-900">{step.title}</h3>
                      </div>

                      <p className="text-slate-600 text-sm leading-relaxed">
                        {step.description}
                      </p>

                      <div className="border-t border-slate-200/60 pt-6">
                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Key Features</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {step.details.map((detail, idx) => (
                            <div key={idx} className="flex items-center gap-2.5 text-slate-700">
                              <div className="h-1.5 w-1.5 rounded-full bg-indigo-500 shrink-0" />
                              <span className="text-xs font-medium">{detail}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })}

                <div className="pt-4 flex justify-end">
                  <a 
                    href="/store" 
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 transition-colors shadow-sm"
                  >
                    <span>Try Customizer Now</span>
                    <ArrowRight className="h-4 w-4" />
                  </a>
                </div>
              </div>
            </div>

            {/* Quality Statement Section */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm space-y-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600">
                  <Shirt className="h-5 w-5" />
                </div>
                <h4 className="font-extrabold text-slate-900 text-sm">Premium Blank Apparel</h4>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  We use pre-shrunk, combed ring-spun 100% cotton garments weighing 180+ GSM. Thick, sturdy, and exceptionally soft to touch.
                </p>
              </div>

              <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm space-y-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600">
                  <Layers className="h-5 w-5" />
                </div>
                <h4 className="font-extrabold text-slate-900 text-sm">Sublime Color Precision</h4>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Advanced color profile mappings guarantee screen mockup colors match real printed fabrics accurately and vibrantly.
                </p>
              </div>

              <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm space-y-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <h4 className="font-extrabold text-slate-900 text-sm">100% Satisfaction Checked</h4>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Any sizing issues, prints that don't match mockups, or defected garments are immediately reprinted and resent for free.
                </p>
              </div>
            </div>

            {/* FAQs Accordion */}
            <div className="space-y-6">
              <div className="text-center space-y-2">
                <h2 className="text-2xl font-black text-slate-900">Frequently Asked Questions</h2>
                <p className="text-xs text-slate-500">Everything you need to know about the creation process.</p>
              </div>

              <div className="max-w-3xl mx-auto bg-white border border-slate-200/80 rounded-3xl p-4 md:p-6 shadow-sm divide-y divide-slate-100">
                {faqs.map((faq, idx) => {
                  const isOpen = openFaq === idx;
                  return (
                    <div key={idx} className="py-4 first:pt-0 last:pb-0">
                      <button
                        onClick={() => setOpenFaq(isOpen ? null : idx)}
                        className="w-full flex items-center justify-between gap-4 text-left group"
                      >
                        <span className="font-bold text-slate-900 text-sm group-hover:text-indigo-600 transition-colors">
                          {faq.q}
                        </span>
                        {isOpen ? (
                          <ChevronUp className="h-4 w-4 text-slate-400 group-hover:text-indigo-600 shrink-0" />
                        ) : (
                          <ChevronDown className="h-4 w-4 text-slate-400 group-hover:text-indigo-600 shrink-0" />
                        )}
                      </button>
                      
                      {isOpen && (
                        <p className="mt-3 text-xs text-slate-600 leading-relaxed pl-1 animate-slideDown">
                          {faq.a}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

          </div>
        </main>
      </div>

      <Footer withSidebarOffset={!!token} />
    </div>
  );
}
