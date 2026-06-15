import { useState } from "react";
import Navbar from "../components/Navbar/GNavbar";
import Footer from "../components/Footer/Footer";
import { Lock, Mail, Eye, EyeOff, AlertCircle } from "lucide-react";
import axios from "axios";

const API_BASE_URL = "http://localhost:5000/api";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await axios.post(`${API_BASE_URL}/auth/login`, {
        email,
        password
      });

      // Save token and user details to localStorage
      localStorage.setItem("token", response.data.token);
      localStorage.setItem("user", JSON.stringify(response.data.user));

      // Redirect based on user role
      const role = response.data.user.role;
      if (role === "Admin") {
        window.location.href = "/admin";
      } else if (role === "Manager") {
        window.location.href = "/manager";
      } else if (role === "Employee") {
        window.location.href = "/employee";
      } else if (role === "Customer") {
        window.location.href = "/customer-home";
      } else {
        window.location.href = "/designer";
      }
    } catch (err) {
      console.error(err);
      setError(
        err.response?.data?.message || "Invalid email or password. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_#eef2ff,_#f8fafc_48%,_#e2e8f0_100%)] flex flex-col justify-between">
      <Navbar />

      <main className="flex-1 flex items-center justify-center p-6">
        <div className="bg-white/80 border border-white/70 shadow-[0_24px_90px_rgba(15,23,42,0.06)] backdrop-blur-md rounded-[2.5rem] p-8 sm:p-10 max-w-md w-full relative overflow-hidden">
          
          {/* Accent decoration */}
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-600" />

          {/* Heading */}
          <div className="text-center mb-8">
            <h2 className="text-3xl font-black tracking-tight text-slate-900">Welcome Back</h2>
            <p className="text-slate-500 text-sm mt-2">Log in to customize, order, and track T-shirts</p>
          </div>

          {/* Errors */}
          {error && (
            <div className="mb-6 flex items-center gap-2.5 p-4 rounded-2xl bg-rose-50 border border-rose-100 text-rose-600 text-xs font-semibold">
              <AlertCircle className="h-4.5 w-4.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Email Address</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-slate-400">
                  <Mail className="h-4 w-4" />
                </span>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full pl-11 pr-4 py-3.5 bg-white border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-2xl text-sm transition"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Password</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-slate-400">
                  <Lock className="h-4 w-4" />
                </span>
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-11 pr-11 py-3.5 bg-white border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-2xl text-sm transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold shadow-[0_4px_14px_rgba(99,102,241,0.3)] hover:shadow-lg disabled:opacity-50 transition duration-150 text-sm mt-2"
            >
              {loading ? "Authenticating..." : "Log In"}
            </button>
          </form>

          {/* Redirect */}
          <div className="text-center mt-6 pt-6 border-t text-xs text-slate-500">
            Don't have an account?{" "}
            <a href="/register" className="font-bold text-indigo-600 hover:underline">
              Create an account
            </a>
          </div>

        </div>
      </main>

      <Footer />
    </div>
  );
}
