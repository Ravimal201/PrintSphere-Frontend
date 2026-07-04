import { useState, useEffect } from "react";
import RNavbar from "../components/Navbar/RNavbar";
import GNavbar from "../components/Navbar/GNavbar";
import Sidebar from "../components/Sidebar/Sidebar";
import Footer from "../components/Footer/Footer";
import { Mail, Phone, MapPin, Clock, Send, CheckCircle } from "lucide-react";

export default function ContactUsPage() {
  const [token, setToken] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", message: "" });

  useEffect(() => {
    setToken(localStorage.getItem("token"));
  }, []);

  const Navbar = token ? RNavbar : GNavbar;

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
    setForm({ name: "", email: "", message: "" });
    setTimeout(() => setSubmitted(false), 5000);
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col text-slate-800 font-sans">
      <Navbar />

      <div className="flex flex-1 overflow-hidden">
        {token && <Sidebar />}

        <main className={`flex-1 overflow-y-auto p-8 select-none ${token ? "lg:ml-72" : ""}`}>
          <div className="max-w-4xl mx-auto space-y-8">
            {/* Header */}
            <div>
              <h2 className="text-2xl font-black text-slate-900">Contact Us</h2>
              <p className="text-xs text-slate-500 mt-1">Get in touch with the PrintSphere team</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Contact Information */}
              <div className="space-y-6">
                <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm space-y-6">
                  <h3 className="font-extrabold text-slate-900 text-sm">Direct Contact Info</h3>

                  <div className="space-y-4 text-xs">
                    <div className="flex items-center gap-3.5">
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-650 shrink-0">
                        <MapPin className="h-4.5 w-4.5" />
                      </div>
                      <div>
                        <p className="font-bold text-slate-900">Our Office</p>
                        <p className="text-slate-500 mt-0.5">100 Galle Road, Colombo 03, Sri Lanka</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3.5">
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-650 shrink-0">
                        <Mail className="h-4.5 w-4.5" />
                      </div>
                      <div>
                        <p className="font-bold text-slate-900">Email Address</p>
                        <p className="text-slate-500 mt-0.5">support@printsphere.com</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3.5">
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-650 shrink-0">
                        <Phone className="h-4.5 w-4.5" />
                      </div>
                      <div>
                        <p className="font-bold text-slate-900">Phone Hotline</p>
                        <p className="text-slate-550 mt-0.5">+94 11 234 5678</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3.5">
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-650 shrink-0">
                        <Clock className="h-4.5 w-4.5" />
                      </div>
                      <div>
                        <p className="font-bold text-slate-900">Business Hours</p>
                        <p className="text-slate-500 mt-0.5">Mon - Fri: 9:00 AM - 6:00 PM (GMT+5:30)</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Message Box Form */}
              <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm flex flex-col justify-between">
                <div>
                  <h3 className="font-extrabold text-slate-900 text-sm pb-3 border-b mb-4">Send a Message</h3>

                  {submitted && (
                    <div className="mb-4 flex items-center gap-2 p-3 rounded-xl border border-emerald-100 bg-emerald-50 text-emerald-600 text-xs font-semibold">
                      <CheckCircle className="h-4 w-4 shrink-0" />
                      <span>Message sent successfully! We'll reply soon.</span>
                    </div>
                  )}

                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Your Name</label>
                      <input
                        type="text"
                        required
                        value={form.name}
                        onChange={(e) => setForm(p => ({ ...p, name: e.target.value }))}
                        placeholder="John Doe"
                        className="w-full px-3 py-2.5 border rounded-xl text-xs"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Your Email</label>
                      <input
                        type="email"
                        required
                        value={form.email}
                        onChange={(e) => setForm(p => ({ ...p, email: e.target.value }))}
                        placeholder="john@example.com"
                        className="w-full px-3 py-2.5 border rounded-xl text-xs"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Message Details</label>
                      <textarea
                        required
                        rows="4"
                        value={form.message}
                        onChange={(e) => setForm(p => ({ ...p, message: e.target.value }))}
                        placeholder="Tell us what you'd like to ask..."
                        className="w-full px-3 py-2.5 border rounded-xl text-xs resize-none"
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition shadow-sm mt-4 flex items-center justify-center gap-1.5"
                    >
                      <Send className="h-3.5 w-3.5" />
                      Send Message
                    </button>
                  </form>
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
