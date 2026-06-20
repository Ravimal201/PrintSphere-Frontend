import { useState } from "react";
import Navbar from "../components/Navbar/RNavbar";
import Sidebar from "../components/Sidebar/Sidebar";
import Footer from "../components/Footer/Footer";
import { HelpCircle, MessageSquare, ChevronDown, ChevronUp, CheckCircle } from "lucide-react";

export default function SupportPage() {
  const [openFaq, setOpenFaq] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });

  const faqs = [
    {
      q: "How long does shipping take?",
      a: "Standard shipping takes 3-5 business days. Express printing and delivery options are available at checkout, taking 1-2 business days."
    },
    {
      q: "Can I upload custom graphics?",
      a: "Yes! In our 3D Customizer, you can upload JPG, PNG, and SVG graphics, position them, resize them, and preview how they look on the t-shirt real-time."
    },
    {
      q: "What printing technologies do you use?",
      a: "We utilize industry-leading Direct to Garment (DTG) printing and high-grade sublimation for premium, durable color output that doesn't crack or fade."
    },
    {
      q: "Can I cancel or modify my order?",
      a: "Since custom designs are printed on demand, you can only cancel or modify orders within 2 hours of placement, before they enter the printing queue."
    }
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
    setForm({ name: "", email: "", subject: "", message: "" });
    setTimeout(() => setSubmitted(false), 5000);
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col text-slate-800 font-sans">
      <Navbar />

      <div className="flex flex-1 overflow-hidden">
        <Sidebar />

        <main className="flex-1 overflow-y-auto p-8 lg:ml-72 select-none">
          <div className="max-w-4xl mx-auto space-y-8">
            {/* Header */}
            <div>
              <h2 className="text-2xl font-black text-slate-900">Support Center</h2>
              <p className="text-xs text-slate-500 mt-1">Get answers, open a ticket, or contact support</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* FAQ Section */}
              <div className="md:col-span-2 space-y-4">
                <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2 mb-4">
                  <HelpCircle className="h-4.5 w-4.5 text-indigo-600" /> Frequently Asked Questions
                </h3>

                <div className="space-y-3">
                  {faqs.map((faq, idx) => {
                    const isOpen = openFaq === idx;
                    return (
                      <div key={idx} className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-sm">
                        <button
                          onClick={() => setOpenFaq(isOpen ? null : idx)}
                          className="w-full px-5 py-4 text-left flex justify-between items-center hover:bg-slate-50/55 transition"
                        >
                          <span className="font-extrabold text-slate-950 text-xs">{faq.q}</span>
                          {isOpen ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
                        </button>
                        {isOpen && (
                          <div className="px-5 pb-4 text-slate-500 text-xs leading-relaxed border-t pt-3.5 bg-slate-50/20">
                            {faq.a}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Message Box */}
              <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm flex flex-col justify-between">
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2 pb-3 border-b mb-4">
                    <MessageSquare className="h-4.5 w-4.5 text-indigo-600" /> Ask a Question
                  </h3>

                  {submitted && (
                    <div className="mb-4 flex items-center gap-2 p-3 rounded-xl border border-emerald-100 bg-emerald-50 text-emerald-600 text-xs font-semibold">
                      <CheckCircle className="h-4 w-4 shrink-0" />
                      <span>Support ticket opened successfully!</span>
                    </div>
                  )}

                  <form onSubmit={handleSubmit} className="space-y-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Name</label>
                      <input
                        type="text"
                        required
                        value={form.name}
                        onChange={(e) => setForm(p => ({ ...p, name: e.target.value }))}
                        placeholder="John Doe"
                        className="w-full px-3 py-2 border rounded-xl text-xs"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Email</label>
                      <input
                        type="email"
                        required
                        value={form.email}
                        onChange={(e) => setForm(p => ({ ...p, email: e.target.value }))}
                        placeholder="john@example.com"
                        className="w-full px-3 py-2 border rounded-xl text-xs"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Subject</label>
                      <input
                        type="text"
                        required
                        value={form.subject}
                        onChange={(e) => setForm(p => ({ ...p, subject: e.target.value }))}
                        placeholder="Order #1024 issue"
                        className="w-full px-3 py-2 border rounded-xl text-xs"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Message</label>
                      <textarea
                        required
                        rows="3"
                        value={form.message}
                        onChange={(e) => setForm(p => ({ ...p, message: e.target.value }))}
                        placeholder="How can we help?"
                        className="w-full px-3 py-2 border rounded-xl text-xs resize-none"
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition shadow-sm mt-3"
                    >
                      Submit Ticket
                    </button>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      <Footer withSidebarOffset />
    </div>
  );
}
