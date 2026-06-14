import { useState, useEffect } from "react";
import { Users, UserPlus, Lock, Trash2, Key, Mail, Phone, Shield, LogOut, Loader2, AlertCircle, CheckCircle } from "lucide-react";
import axios from "axios";

const API_BASE_URL = "http://localhost:5000/api";

export default function AdminPage() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

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
      // Reset form
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
            <button className="w-full flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-semibold bg-indigo-600 text-white shadow-lg transition">
              <Users className="h-4.5 w-4.5" />
              Staff Management
            </button>
            <button
              onClick={() => window.location.href = '/customer-home'}
              className="w-full flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-semibold hover:bg-slate-800 hover:text-slate-200 transition"
            >
              <Shield className="h-4.5 w-4.5" />
              View Store Front
            </button>
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
        
        {/* Title */}
        <div className="mb-8 select-none">
          <h2 className="text-3xl font-black text-slate-900 leading-tight">Staff Management Console</h2>
          <p className="text-slate-500 text-sm mt-1">Register new managers and print shop operators, or change passwords</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-8 items-start">
          
          {/* Staff List Box */}
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
                            onClick={() => setSelectedStaff(member)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 transition"
                          >
                            <Key className="h-3.5 w-3.5" />
                            Password
                          </button>
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

          {/* Create Staff Panel */}
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

      </div>

      {/* Password Reset Modal */}
      {selectedStaff && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-sm border shadow-2xl overflow-hidden">
            <div className="bg-slate-950 text-white px-5 py-4 flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-300">Reset Password</h3>
                <p className="text-[10px] text-slate-400 mt-0.5">Changing password for {selectedStaff.name}</p>
              </div>
              <button onClick={() => setSelectedStaff(null)} className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white">
                <X className="h-4.5 w-4.5" />
              </button>
            </div>

            <form onSubmit={handleUpdatePassword} className="p-5 space-y-4">
              {passError && (
                <div className="flex items-center gap-2 p-2.5 rounded-lg bg-rose-50 border border-rose-100 text-rose-600 text-xs font-semibold">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{passError}</span>
                </div>
              )}

              {passSuccess && (
                <div className="flex items-center gap-2 p-2.5 rounded-lg bg-emerald-50 border border-emerald-100 text-emerald-600 text-xs font-semibold">
                  <CheckCircle className="h-4 w-4 shrink-0" />
                  <span>{passSuccess}</span>
                </div>
              )}

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">New Password</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                    <Lock className="h-3.5 w-3.5" />
                  </span>
                  <input
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password"
                    className="w-full pl-9 pr-3 py-2 border rounded-xl text-sm"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedStaff(null)}
                  className="px-4 py-2 border rounded-xl text-xs font-bold hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={passLoading}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 transition"
                >
                  {passLoading ? "Saving..." : "Change Password"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
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
