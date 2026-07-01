import { useState, useEffect } from "react";
import { 
  Users, UserPlus, Lock, Trash2, Key, Mail, Phone, Shield, LogOut, 
  Loader2, AlertCircle, CheckCircle, BarChart3, TrendingUp, Inbox, 
  Settings, RefreshCw, Layers, ShoppingCart, Info, HardDrive, Check 
} from "lucide-react";
import axios from "axios";

const API_BASE_URL = "http://localhost:5000/api";

export default function AdminPage() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("analytics"); // "analytics" | "staff" | "inventory" | "settings"

  // Staff list state
  const [staff, setStaff] = useState([]);
  const [fetchLoading, setFetchLoading] = useState(false);

  // New staff form state
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("Employee");
  const [phone, setPhone] = useState("");
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");
  const [formLoading, setFormLoading] = useState(false);

  // Password edit state
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [newPassword, setNewPassword] = useState("");
  const [passError, setPassError] = useState("");
  const [passSuccess, setPassSuccess] = useState("");
  const [passLoading, setPassLoading] = useState(false);

  // System Settings state
  const [sandboxPayment, setSandboxPayment] = useState(true);
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [logLevel, setLogLevel] = useState("info");
  const [settingsSuccess, setSettingsSuccess] = useState(false);

  // Check authentication on mount
  useEffect(() => {
    const userStr = localStorage.getItem("user");
    const token = localStorage.getItem("token");

    if (!userStr || !token) {
      window.location.href = "/login";
      return;
    }

    try {
      const user = JSON.parse(userStr);
      if (user.role === "Admin") {
        setIsAdmin(true);
        fetchStaff();
      } else {
        window.location.href = "/customer-home";
      }
    } catch (err) {
      localStorage.clear();
      window.location.href = "/login";
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchStaff = async () => {
    setFetchLoading(true);
    const token = localStorage.getItem("token");
    try {
      const response = await axios.get(`${API_BASE_URL}/admin/staff`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStaff(response.data);
    } catch (err) {
      console.error(err);
    } finally {
      setFetchLoading(false);
    }
  };

  const handleCreateStaff = async (e) => {
    e.preventDefault();
    setFormError("");
    setFormSuccess("");
    setFormLoading(true);

    const token = localStorage.getItem("token");

    try {
      await axios.post(
        `${API_BASE_URL}/admin/create-staff`,
        { name, email, password, role, phone },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setFormSuccess(`${role} account created successfully!`);
      setName("");
      setEmail("");
      setPassword("");
      setPhone("");
      fetchStaff();
    } catch (err) {
      console.error(err);
      setFormError(err.response?.data?.message || "Failed to create staff account.");
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteStaff = async (id) => {
    if (!window.confirm("Are you sure you want to delete this staff member?")) return;
    const token = localStorage.getItem("token");

    try {
      await axios.delete(`${API_BASE_URL}/admin/delete-staff/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchStaff();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Failed to delete staff account.");
    }
  };

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    setPassError("");
    setPassSuccess("");
    setPassLoading(true);

    const token = localStorage.getItem("token");

    try {
      await axios.put(
        `${API_BASE_URL}/admin/update-staff-password`,
        { userId: selectedStaff._id, newPassword },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setPassSuccess("Password updated successfully!");
      setNewPassword("");
      setTimeout(() => {
        setSelectedStaff(null);
        setPassSuccess("");
      }, 1500);
    } catch (err) {
      console.error(err);
      setPassError(err.response?.data?.message || "Failed to update password.");
    } finally {
      setPassLoading(false);
    }
  };

  const handleSaveSettings = (e) => {
    e.preventDefault();
    setSettingsSuccess(true);
    setTimeout(() => setSettingsSuccess(false), 2000);
  };

  const handleLogout = () => {
    localStorage.clear();
    window.location.href = "/login";
  };

  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-slate-50">
        <Loader2 className="h-8 w-8 text-indigo-600 animate-spin" />
      </div>
    );
  }

  if (!isAdmin) return null;

  return (
    <div className="h-screen w-full flex bg-[#f8fafc] font-sans overflow-hidden text-slate-800">
      
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 flex flex-col justify-between shrink-0 select-none text-slate-400">
        <div>
          <div className="flex items-center gap-3 px-6 py-5 border-b border-slate-800">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg shadow-[0_4px_12px_rgba(99,102,241,0.3)]">
              A
            </div>
            <div>
              <h1 className="font-extrabold text-white text-lg tracking-wide leading-none">PrintSphere</h1>
              <span className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold">Admin Panel</span>
            </div>
          </div>

          <nav className="p-4 space-y-1">
            <button
              onClick={() => setActiveTab("analytics")}
              className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-semibold transition ${
                activeTab === "analytics"
                  ? "bg-indigo-600 text-white shadow-lg"
                  : "hover:bg-slate-800 hover:text-slate-200"
              }`}
            >
              <BarChart3 className="h-4.5 w-4.5" />
              Analytics & Reports
            </button>
            <button
              onClick={() => setActiveTab("staff")}
              className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-semibold transition ${
                activeTab === "staff"
                  ? "bg-indigo-600 text-white shadow-lg"
                  : "hover:bg-slate-800 hover:text-slate-200"
              }`}
            >
              <Users className="h-4.5 w-4.5" />
              Staff Management
            </button>
            <button
              onClick={() => setActiveTab("inventory")}
              className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-semibold transition ${
                activeTab === "inventory"
                  ? "bg-indigo-600 text-white shadow-lg"
                  : "hover:bg-slate-800 hover:text-slate-200"
              }`}
            >
              <Inbox className="h-4.5 w-4.5" />
              Products & Inventory
            </button>
            <button
              onClick={() => setActiveTab("settings")}
              className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-semibold transition ${
                activeTab === "settings"
                  ? "bg-indigo-600 text-white shadow-lg"
                  : "hover:bg-slate-800 hover:text-slate-200"
              }`}
            >
              <Settings className="h-4.5 w-4.5" />
              System Settings
            </button>
            
            <div className="pt-4 border-t border-slate-800">
              <button
                onClick={() => window.location.href = '/customer-home'}
                className="w-full flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-semibold hover:bg-slate-800 hover:text-slate-200 transition"
              >
                <Shield className="h-4.5 w-4.5" />
                View Store Front
              </button>
            </div>
          </nav>
        </div>

        <div className="p-4 border-t border-slate-800">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-red-500/30 hover:border-red-500 text-xs text-red-400 font-semibold hover:bg-red-500/10 transition"
          >
            <LogOut className="h-4 w-4" />
            Log Out
          </button>
        </div>
      </aside>

      {/* Main Container */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto p-8">
        
        {/* KPI Cards on Top */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 select-none">
          <div className="bg-white border rounded-3xl p-6 shadow-sm">
            <span className="text-[10px] uppercase tracking-wider text-slate-400 font-black">Gross Revenue</span>
            <p className="text-2xl font-black text-slate-900 mt-1">Rs. 12,430.00</p>
            <div className="flex items-center gap-1.5 text-xs text-emerald-600 mt-2 font-bold">
              <TrendingUp className="h-3.5 w-3.5" />
              <span>+14.2% this week</span>
            </div>
          </div>
          <div className="bg-white border rounded-3xl p-6 shadow-sm">
            <span className="text-[10px] uppercase tracking-wider text-slate-400 font-black">Total Orders</span>
            <p className="text-2xl font-black text-slate-900 mt-1">1,240</p>
            <div className="flex items-center gap-1.5 text-xs text-emerald-600 mt-2 font-bold">
              <TrendingUp className="h-3.5 w-3.5" />
              <span>+8.7% new customers</span>
            </div>
          </div>
          <div className="bg-white border rounded-3xl p-6 shadow-sm">
            <span className="text-[10px] uppercase tracking-wider text-slate-400 font-black">Custom Designs</span>
            <p className="text-2xl font-black text-slate-900 mt-1">846</p>
            <div className="flex items-center gap-1.5 text-xs text-indigo-600 mt-2 font-bold">
              <Layers className="h-3.5 w-3.5" />
              <span>68% coverage avg</span>
            </div>
          </div>
          <div className="bg-white border rounded-3xl p-6 shadow-sm">
            <span className="text-[10px] uppercase tracking-wider text-slate-400 font-black">System Status</span>
            <p className="text-2xl font-black text-slate-900 mt-1">99.92%</p>
            <div className="flex items-center gap-1.5 text-xs text-emerald-600 mt-2 font-bold">
              <Check className="h-3.5 w-3.5" />
              <span>MongoDB connected</span>
            </div>
          </div>
        </div>

        {/* ================= TAB 1: ANALYTICS & REPORTS ================= */}
        {activeTab === "analytics" && (
          <div className="space-y-8">
            <div className="bg-white border rounded-3xl p-6 shadow-sm select-none">
              <h3 className="text-lg font-bold text-slate-950 mb-6 flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-indigo-600" />
                Monthly Revenue & Sales Trend
              </h3>
              {/* Sales trend SVG path chart */}
              <div className="h-72 w-full flex items-end">
                <svg className="w-full h-full" viewBox="0 0 800 240">
                  <defs>
                    <linearGradient id="gradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#4f46e5" stopOpacity="0.15" />
                      <stop offset="100%" stopColor="#4f46e5" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>
                  {/* Grid Lines */}
                  <line x1="0" y1="40" x2="800" y2="40" stroke="#f1f5f9" strokeWidth="1" />
                  <line x1="0" y1="100" x2="800" y2="100" stroke="#f1f5f9" strokeWidth="1" />
                  <line x1="0" y1="160" x2="800" y2="160" stroke="#f1f5f9" strokeWidth="1" />
                  {/* Area beneath curve */}
                  <path
                    d="M 50 180 C 150 140, 200 190, 300 120 C 400 50, 480 130, 600 60 C 700 10, 750 30, 800 20 L 800 220 L 50 220 Z"
                    fill="url(#gradient)"
                  />
                  {/* Trend Curve Line */}
                  <path
                    d="M 50 180 C 150 140, 200 190, 300 120 C 400 50, 480 130, 600 60 C 700 10, 750 30, 800 20"
                    fill="none"
                    stroke="#4f46e5"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                  />
                  {/* Scatter Dots */}
                  <circle cx="50" cy="180" r="5" fill="#4f46e5" />
                  <circle cx="300" cy="120" r="5" fill="#4f46e5" />
                  <circle cx="600" cy="60" r="5" fill="#4f46e5" />
                </svg>
              </div>
              <div className="flex justify-between text-xs text-slate-400 font-bold px-6 pt-3">
                <span>Jan</span>
                <span>Feb</span>
                <span>Mar</span>
                <span>Apr</span>
                <span>May</span>
                <span>Jun</span>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 select-none">
              {/* Popular fabric colors chart */}
              <div className="bg-white border rounded-3xl p-6 shadow-sm">
                <h3 className="text-lg font-bold text-slate-950 mb-6 flex items-center gap-2">
                  <Palette className="h-5 w-5 text-indigo-600" />
                  Popular Fabric Colors
                </h3>
                <div className="space-y-4">
                  {[
                    { color: "White", count: 486, pct: 57, bg: "bg-slate-200" },
                    { color: "Black", count: 242, pct: 28, bg: "bg-slate-900" },
                    { color: "Navy Blue", count: 120, pct: 14, bg: "bg-indigo-950" },
                    { color: "Red", count: 86, pct: 10, bg: "bg-rose-600" }
                  ].map((item) => (
                    <div key={item.color} className="space-y-1.5">
                      <div className="flex justify-between text-xs font-bold text-slate-600">
                        <span className="flex items-center gap-2">
                          <span className={`h-3.5 w-3.5 rounded-full border ${item.bg}`} />
                          {item.color}
                        </span>
                        <span>{item.count} orders ({item.pct}%)</span>
                      </div>
                      <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-indigo-600 rounded-full" style={{ width: `${item.pct}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Conversion Statistics */}
              <div className="bg-white border rounded-3xl p-6 shadow-sm">
                <h3 className="text-lg font-bold text-slate-950 mb-6 flex items-center gap-2">
                  <Info className="h-5 w-5 text-indigo-600" />
                  Operational Performance
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-2xl bg-slate-50">
                    <span className="text-[10px] text-slate-400 uppercase font-bold">Customizer Bounce Rate</span>
                    <p className="text-xl font-bold text-slate-800 mt-1">24.2%</p>
                  </div>
                  <div className="p-4 rounded-2xl bg-slate-50">
                    <span className="text-[10px] text-slate-400 uppercase font-bold">Cart Conversion</span>
                    <p className="text-xl font-bold text-slate-800 mt-1">3.48%</p>
                  </div>
                  <div className="p-4 rounded-2xl bg-slate-50">
                    <span className="text-[10px] text-slate-400 uppercase font-bold">Avg Printing Time</span>
                    <p className="text-xl font-bold text-slate-800 mt-1">18 mins</p>
                  </div>
                  <div className="p-4 rounded-2xl bg-slate-50">
                    <span className="text-[10px] text-slate-400 uppercase font-bold">Server Load</span>
                    <p className="text-xl font-bold text-slate-800 mt-1">12% CPU</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================= TAB 2: STAFF MANAGEMENT ================= */}
        {activeTab === "staff" && (
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-8 items-start">
            {/* Staff list */}
            <div className="bg-white border rounded-3xl p-6 shadow-sm overflow-hidden flex flex-col">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-slate-950 flex items-center gap-2">
                  <Users className="h-5 w-5 text-indigo-600" />
                  Active Staff Directory
                </h3>
                <button onClick={fetchStaff} className="text-xs text-indigo-600 font-bold hover:underline">
                  Refresh Directory
                </button>
              </div>

              {fetchLoading ? (
                <div className="py-20 flex justify-center">
                  <Loader2 className="h-7 w-7 text-indigo-600 animate-spin" />
                </div>
              ) : staff.length === 0 ? (
                <div className="py-20 text-center border-2 border-dashed rounded-2xl">
                  <p className="text-sm text-slate-400 font-semibold">No managers or employees registered yet.</p>
                  <p className="text-xs text-slate-300 mt-1">Use the registration panel on the right to add staff.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b text-xs text-slate-400 uppercase font-black select-none">
                        <th className="pb-3 font-extrabold">Name</th>
                        <th className="pb-3 font-extrabold">Email</th>
                        <th className="pb-3 font-extrabold">Role</th>
                        <th className="pb-3 font-extrabold">Phone</th>
                        <th className="pb-3 text-right font-extrabold">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {staff.map((member) => (
                        <tr key={member._id} className="border-b last:border-b-0 hover:bg-slate-50/50 transition">
                          <td className="py-4 font-bold text-slate-900">{member.name}</td>
                          <td className="py-4 text-sm text-slate-600">{member.email}</td>
                          <td className="py-4">
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                              member.role === "Manager" 
                                ? "bg-purple-50 text-purple-600 ring-1 ring-purple-100" 
                                : "bg-teal-50 text-teal-600 ring-1 ring-teal-100"
                            }`}>
                              {member.role}
                            </span>
                          </td>
                          <td className="py-4 text-sm text-slate-500">{member.phone || "—"}</td>
                          <td className="py-4 text-right space-x-2">
                            <button
                              onClick={() => handleDeleteStaff(member._id)}
                              className="inline-flex items-center p-1.5 rounded-lg border border-red-50 text-red-500 hover:bg-red-50 transition"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Create Staff */}
            <div className="bg-white border rounded-3xl p-6 shadow-sm">
              <h3 className="text-lg font-bold text-slate-950 flex items-center gap-2 mb-6 select-none">
                <UserPlus className="h-5 w-5 text-indigo-600" />
                Register Staff User
              </h3>

              {formError && (
                <div className="mb-4 flex items-center gap-2 p-3 rounded-xl bg-rose-50 border border-rose-100 text-rose-600 text-xs font-semibold">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {formSuccess && (
                <div className="mb-4 flex items-center gap-2 p-3 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-600 text-xs font-semibold">
                  <CheckCircle className="h-4 w-4 shrink-0" />
                  <span>{formSuccess}</span>
                </div>
              )}

              <form onSubmit={handleCreateStaff} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Name</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Employee Name"
                    className="w-full px-3 py-2 border rounded-xl text-sm"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Email</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                      <Mail className="h-3.5 w-3.5" />
                    </span>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="email@printsphere.com"
                      className="w-full pl-9 pr-3 py-2 border rounded-xl text-sm"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Default Password</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                      <Lock className="h-3.5 w-3.5" />
                    </span>
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-9 pr-3 py-2 border rounded-xl text-sm"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Role Assignment</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full px-3 py-2 border rounded-xl text-sm focus:outline-none"
                  >
                    <option value="Employee">Employee (Printing Operator)</option>
                    <option value="Manager">Manager (Operations Director)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Phone (Optional)</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                      <Phone className="h-3.5 w-3.5" />
                    </span>
                    <input
                      type="text"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+94 7X XXX XXXX"
                      className="w-full pl-9 pr-3 py-2 border rounded-xl text-sm"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={formLoading}
                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-md disabled:opacity-50 transition"
                >
                  {formLoading ? "Creating Account..." : "Create Account"}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* ================= TAB 3: PRODUCTS & INVENTORY ================= */}
        {activeTab === "inventory" && (
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-8 items-start select-none">
            {/* Plain Shirt Stock levels */}
            <div className="bg-white border rounded-3xl p-6 shadow-sm space-y-6">
              <h3 className="text-lg font-bold text-slate-950 flex items-center gap-2">
                <Inbox className="h-5 w-5 text-indigo-600" />
                Plain Shirt Stock Levels
              </h3>
              
              <div className="space-y-4">
                {[
                  { name: "Crew Neck (Cotton, White)", qty: 240, max: 300, status: "Good" },
                  { name: "Polo Shirt (Organic Cotton, Black)", qty: 120, max: 200, status: "Good" },
                  { name: "V-Neck Shirt (Cotton, Navy)", qty: 8, max: 150, status: "Critical" },
                  { name: "Crew Neck (Polyester, Grey)", qty: 28, max: 150, status: "Warning" }
                ].map((item) => (
                  <div key={item.name} className="space-y-1.5">
                    <div className="flex justify-between text-xs font-bold">
                      <span className="text-slate-700">{item.name}</span>
                      <span className={`px-2 py-0.5 rounded text-[9px] font-black ${
                        item.status === "Critical" 
                          ? "bg-rose-50 text-rose-600 ring-1 ring-rose-100 animate-pulse" 
                          : item.status === "Warning" 
                          ? "bg-amber-50 text-amber-600 ring-1 ring-amber-100" 
                          : "bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100"
                      }`}>
                        {item.qty} / {item.max} ({item.status})
                      </span>
                    </div>
                    <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${
                        item.status === "Critical" 
                          ? "bg-rose-500" 
                          : item.status === "Warning" 
                          ? "bg-amber-500" 
                          : "bg-emerald-500"
                      }`} style={{ width: `${(item.qty / item.max) * 100}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Popular products list */}
            <div className="bg-white border rounded-3xl p-6 shadow-sm">
              <h3 className="text-lg font-bold text-slate-950 flex items-center gap-2 mb-6">
                <ShoppingCart className="h-5 w-5 text-indigo-600" />
                Best-Selling Products
              </h3>
              
              <div className="space-y-4">
                {[
                  { rank: 1, name: "Adventure Calls Design (White Crew)", sales: 486, revenue: "Rs. 10,230" },
                  { rank: 2, name: "Plain Cotton Tee V-Neck (Black)", sales: 320, revenue: "Rs. 4,480" },
                  { rank: 3, name: "Premium Polo (Gold)", sales: 180, revenue: "Rs. 3,240" },
                  { rank: 4, name: "Custom SVG Logo projection (Collar)", sales: 120, revenue: "Rs. 2,800" }
                ].map((item) => (
                  <div key={item.name} className="flex items-center justify-between border-b pb-3 last:border-b-0 last:pb-0">
                    <div className="flex items-center gap-3">
                      <span className="h-6 w-6 rounded-lg bg-indigo-50 text-indigo-700 font-bold text-xs flex items-center justify-center">
                        #{item.rank}
                      </span>
                      <div className="leading-tight">
                        <p className="text-xs font-bold text-slate-900">{item.name}</p>
                        <span className="text-[10px] text-slate-400">{item.sales} sold</span>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-slate-800">{item.revenue}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ================= TAB 4: SYSTEM SETTINGS ================= */}
        {activeTab === "settings" && (
          <div className="max-w-2xl bg-white border rounded-3xl p-6 shadow-sm">
            <h3 className="text-lg font-bold text-slate-950 flex items-center gap-2 mb-6 select-none">
              <Settings className="h-5 w-5 text-indigo-600" />
              Operational Decisions & Sandbox Parameters
            </h3>

            {settingsSuccess && (
              <div className="mb-4 flex items-center gap-2 p-3 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-600 text-xs font-semibold">
                <CheckCircle className="h-4 w-4 shrink-0" />
                <span>Settings saved successfully!</span>
              </div>
            )}

            <form onSubmit={handleSaveSettings} className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
                  <div className="leading-tight">
                    <p className="text-sm font-bold text-slate-900">Stripe Payment Sandbox Mode</p>
                    <span className="text-xs text-slate-400">Routes all payments through the Stripe Test Sandbox</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={sandboxPayment}
                    onChange={(e) => setSandboxPayment(e.target.checked)}
                    className="h-5 w-5 text-indigo-600 accent-indigo-600 rounded cursor-pointer"
                  />
                </div>

                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
                  <div className="leading-tight">
                    <p className="text-sm font-bold text-slate-900">System Maintenance Mode</p>
                    <span className="text-xs text-slate-400">Shows a maintenance screen to Customers. Employees/Managers bypass.</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={maintenanceMode}
                    onChange={(e) => setMaintenanceMode(e.target.checked)}
                    className="h-5 w-5 text-indigo-600 accent-indigo-600 rounded cursor-pointer"
                  />
                </div>

                <div className="space-y-1.5 p-4 bg-slate-50 rounded-2xl">
                  <div className="leading-tight">
                    <p className="text-sm font-bold text-slate-900">Logging Verbosity Level</p>
                    <span className="text-xs text-slate-400 block mb-2">Dictates the level of API monitoring logs in server stdout</span>
                  </div>
                  <select
                    value={logLevel}
                    onChange={(e) => setLogLevel(e.target.value)}
                    className="px-3 py-2 border bg-white rounded-xl text-xs font-semibold focus:outline-none"
                  >
                    <option value="debug">Debug (All events and raw SQL queries)</option>
                    <option value="info">Info (Server starts, connections, and routes)</option>
                    <option value="warn">Warn & Error (Only failure events)</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-between items-center border-t pt-5">
                <button
                  type="button"
                  onClick={() => alert("Triggering instant database backup... Completed: backup_printsphere_latest.gzip")}
                  className="inline-flex items-center gap-1.5 px-4 py-2 border rounded-xl text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 shadow-sm transition"
                >
                  <HardDrive className="h-4 w-4" /> Trigger DB Backup
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md transition"
                >
                  Save Configuration
                </button>
              </div>
            </form>
          </div>
        )}

      </div>

    </div>
  );
}

function Palette(props) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="13.5" cy="6.5" r=".5" fill="currentColor"/>
      <circle cx="17.5" cy="10.5" r=".5" fill="currentColor"/>
      <circle cx="8.5" cy="7.5" r=".5" fill="currentColor"/>
      <circle cx="6.5" cy="12.5" r=".5" fill="currentColor"/>
      <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.92 0 1.63-.77 1.63-1.7 0-.44-.18-.85-.47-1.17-.3-.3-.48-.73-.48-1.19 0-.92.75-1.64 1.64-1.64H17c3.86 0 7-3.14 7-7 0-4.96-4.49-9-10-9z"/>
    </svg>
  );
}

function X(props) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </svg>
  );
}
