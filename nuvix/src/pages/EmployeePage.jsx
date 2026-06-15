import { useState, useEffect } from "react";
import { 
  ShoppingCart, Layers, Settings, LogOut, Loader2, AlertCircle, 
  CheckCircle, Plus, Edit2, Check, X, FileText, Download, User, Sparkles
} from "lucide-react";
import axios from "axios";

const API_BASE_URL = "http://localhost:5000/api";

export default function EmployeePage() {
  const [isEmployee, setIsEmployee] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("tasks"); // "tasks" | "submissions" | "settings"

  // Data states
  const [assignedOrders, setAssignedOrders] = useState([]);
  const [mySubmissions, setMySubmissions] = useState([]);
  const [dataLoading, setDataLoading] = useState(false);



  // Status transition notes & loaders
  const [actionLoading, setActionLoading] = useState({});
  const [orderNotes, setOrderNotes] = useState({});

  // Password change states
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passError, setPassError] = useState("");
  const [passSuccess, setPassSuccess] = useState("");
  const [passLoading, setPassLoading] = useState(false);

  // Check authentication
  useEffect(() => {
    const userStr = localStorage.getItem("user");
    const token = localStorage.getItem("token");

    if (!userStr || !token) {
      window.location.href = "/login";
      return;
    }

    try {
      const user = JSON.parse(userStr);
      if (user.role === "Employee" || user.role === "Admin") {
        setIsEmployee(true);
        fetchEmployeeData();
      } else {
        window.location.href = "/login";
      }
    } catch (err) {
      localStorage.clear();
      window.location.href = "/login";
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchEmployeeData = async () => {
    setDataLoading(true);
    const token = localStorage.getItem("token");
    const headers = { Authorization: `Bearer ${token}` };

    try {
      const [ordersRes, productsRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/employee/orders`, { headers }),
        axios.get(`${API_BASE_URL}/employee/products`, { headers })
      ]);

      setAssignedOrders(ordersRes.data);
      setMySubmissions(productsRes.data);
    } catch (err) {
      console.error("Fetch employee dashboard error:", err);
    } finally {
      setDataLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    window.location.href = "/login";
  };

  // ================= TASK WORKFLOW STATUS UPDATES =================

  const handleUpdateStatus = async (orderId, status) => {
    const token = localStorage.getItem("token");
    const headers = { Authorization: `Bearer ${token}` };
    const note = orderNotes[orderId] || `Status updated to ${status} by operator`;

    try {
      setActionLoading(prev => ({ ...prev, [orderId]: true }));
      const response = await axios.put(
        `${API_BASE_URL}/employee/orders/${orderId}/status`,
        { status, note },
        { headers }
      );

      setAssignedOrders(prev => prev.map(o => o._id === orderId ? response.data.order : o));
      setOrderNotes(prev => ({ ...prev, [orderId]: "" }));
      alert("Order status updated successfully!");
    } catch (err) {
      console.error("Update status error:", err);
      alert(err.response?.data?.message || "Failed to update status");
    } finally {
      setActionLoading(prev => ({ ...prev, [orderId]: false }));
    }
  };



  // ================= PASSWORD SECURITY CHANGE =================

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPassError("");
    setPassSuccess("");

    if (newPassword !== confirmPassword) {
      setPassError("New passwords do not match.");
      return;
    }

    setPassLoading(true);
    const token = localStorage.getItem("token");
    const headers = { Authorization: `Bearer ${token}` };

    try {
      const res = await axios.put(
        `${API_BASE_URL}/auth/change-password`,
        { currentPassword, newPassword },
        { headers }
      );
      setPassSuccess(res.data.message || "Password updated successfully!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      console.error("Password update error:", err);
      setPassError(err.response?.data?.message || "Failed to update password.");
    } finally {
      setPassLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-slate-50">
        <Loader2 className="h-8 w-8 text-indigo-600 animate-spin" />
      </div>
    );
  }

  if (!isEmployee) return null;

  return (
    <div className="h-screen w-full flex bg-[#f8fafc] font-sans overflow-hidden text-slate-800">
      
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 flex flex-col justify-between shrink-0 select-none text-slate-400">
        <div>
          <div className="flex items-center gap-3 px-6 py-5 border-b border-slate-800">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg shadow-[0_4px_12px_rgba(99,102,241,0.3)]">
              E
            </div>
            <div>
              <h1 className="font-extrabold text-white text-lg tracking-wide leading-none">PrintSphere</h1>
              <span className="text-[10px] text-teal-400 uppercase tracking-widest font-bold">Operator Desk</span>
            </div>
          </div>

          <nav className="p-4 space-y-1">
            <button
              onClick={() => setActiveTab("tasks")}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-semibold transition ${
                activeTab === "tasks"
                  ? "bg-indigo-600 text-white shadow-lg"
                  : "hover:bg-slate-800 hover:text-slate-200"
              }`}
            >
              <span className="flex items-center gap-3.5">
                <ShoppingCart className="h-4.5 w-4.5" />
                Assigned Print Tasks
              </span>
              {assignedOrders.length > 0 && (
                <span className="px-2 py-0.5 text-[10px] font-black bg-indigo-800 text-indigo-100 rounded-full">
                  {assignedOrders.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab("submissions")}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-semibold transition ${
                activeTab === "submissions"
                  ? "bg-indigo-600 text-white shadow-lg"
                  : "hover:bg-slate-800 hover:text-slate-200"
              }`}
            >
              <span className="flex items-center gap-3.5">
                <Layers className="h-4.5 w-4.5" />
                My Concept Designs
              </span>
              {mySubmissions.filter(p => !p.isApproved).length > 0 && (
                <span className="px-2 py-0.5 text-[10px] font-black bg-purple-500 text-white rounded-full">
                  {mySubmissions.filter(p => !p.isApproved).length}
                </span>
              )}
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
              Settings & Security
            </button>
          </nav>
        </div>

        <div className="p-4 border-t border-slate-800">
          <div className="flex items-center gap-2 mb-3 px-2">
            <div className="h-2.5 w-2.5 rounded-full bg-teal-400 animate-pulse" />
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Operator Session</span>
          </div>
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
        
        {/* Statistics Widgets */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 select-none">
          <div className="bg-white border rounded-3xl p-6 shadow-sm">
            <span className="text-[10px] uppercase tracking-wider text-slate-400 font-black">Assigned Orders</span>
            <p className="text-2xl font-black text-slate-900 mt-1">{assignedOrders.length} active</p>
            <div className="flex items-center gap-1.5 text-xs text-indigo-600 mt-2 font-bold">
              <ShoppingCart className="h-3.5 w-3.5" />
              <span>Pending printing & package</span>
            </div>
          </div>
          <div className="bg-white border rounded-3xl p-6 shadow-sm">
            <span className="text-[10px] uppercase tracking-wider text-slate-400 font-black">My Submissions</span>
            <p className="text-2xl font-black text-slate-900 mt-1">{mySubmissions.length} designs</p>
            <div className="flex items-center gap-1.5 text-xs text-purple-600 mt-2 font-bold">
              <Layers className="h-3.5 w-3.5" />
              <span>{mySubmissions.filter(s => s.isApproved).length} approved & published</span>
            </div>
          </div>
          <div className="bg-white border rounded-3xl p-6 shadow-sm">
            <span className="text-[10px] uppercase tracking-wider text-slate-400 font-black">System Status</span>
            <p className="text-2xl font-black text-emerald-600 mt-1">Online</p>
            <div className="flex items-center gap-1.5 text-xs text-emerald-600 mt-2 font-bold">
              <Check className="h-3.5 w-3.5" />
              <span>Operator console synchronised</span>
            </div>
          </div>
        </div>

        {dataLoading && (
          <div className="mb-6 flex items-center justify-center gap-2 p-3 bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-bold rounded-2xl">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Syncing database records...</span>
          </div>
        )}

        {/* ================= TAB 1: ASSIGNED TASKS ================= */}
        {activeTab === "tasks" && (
          <div className="bg-white border rounded-3xl p-6 shadow-sm">
            <h3 className="text-lg font-bold text-slate-950 mb-6 flex items-center gap-2">
              <ShoppingCart className="h-5 w-5 text-indigo-600" />
              Assigned Print Queue & Tasks
            </h3>

            {assignedOrders.length === 0 ? (
              <div className="text-center py-16">
                <p className="text-sm text-slate-500 font-semibold">No active print orders assigned to you.</p>
              </div>
            ) : (
              <div className="space-y-8">
                {assignedOrders.map((order) => (
                  <div key={order._id} className="border rounded-2xl p-5 hover:border-indigo-100 transition bg-slate-50/20">
                    
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 pb-4 border-b border-dashed">
                      <div>
                        <span className="text-xs font-bold text-slate-500">Order ID: ...{order._id.slice(-8)}</span>
                        <p className="text-[11px] text-slate-400 mt-0.5">Assigned: {new Date(order.createdAt).toLocaleDateString()}</p>
                      </div>
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                        order.orderStatus === "Completed" ? "bg-indigo-50 text-indigo-600" : "bg-teal-50 text-teal-600"
                      }`}>
                        {order.orderStatus}
                      </span>
                    </div>

                    {/* Order items, details, and downloads */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 py-4">
                      
                      {/* Left: Shirt specs */}
                      <div className="space-y-4">
                        <div>
                          <h4 className="text-[10px] uppercase font-black text-slate-400 tracking-wider mb-2">Print Specifications</h4>
                          <div className="space-y-3">
                            {order.items.map((item, idx) => (
                              <div key={idx} className="bg-white p-3 border rounded-xl shadow-xs">
                                <p className="text-sm font-bold text-slate-900">
                                  {item.itemType} T-Shirt (x{item.quantity})
                                </p>
                                <div className="grid grid-cols-2 gap-2 mt-2 text-xs text-slate-500">
                                  <p><span className="font-semibold text-slate-700">Size:</span> {item.size}</p>
                                  <p><span className="font-semibold text-slate-700">Color:</span> {item.color}</p>
                                  <p><span className="font-semibold text-slate-700">Material:</span> {item.material}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Right: Decals download assets */}
                      <div>
                        <h4 className="text-[10px] uppercase font-black text-slate-400 tracking-wider mb-2">Production Print Assets</h4>
                        <div className="space-y-3">
                          {order.items.map((item, idx) => {
                            if (item.itemType === "Customized" && item.designId) {
                              const imgLayers = (item.designId.layers || []).filter(l => l.type === "image" || l.type === "logo");
                              return (
                                <div key={idx} className="space-y-2">
                                  {item.designId.thumbnailUrl && (
                                    <div className="flex gap-3 items-center bg-slate-50 p-3 border rounded-xl">
                                      <img 
                                        src={item.designId.thumbnailUrl} 
                                        alt="Design Preview" 
                                        className="h-14 w-14 object-contain bg-white rounded-lg border shadow-xs"
                                        onError={(e) => e.target.src = "/images/dumyImage.png"}
                                      />
                                      <div>
                                        <p className="text-xs font-bold text-slate-900">Custom layout composite</p>
                                        <a 
                                          href={item.designId.thumbnailUrl} 
                                          download
                                          target="_blank" 
                                          rel="noreferrer"
                                          className="inline-flex items-center gap-1 text-[10px] font-extrabold text-indigo-600 hover:underline mt-1"
                                        >
                                          <Download className="h-3 w-3" /> Download layout screenshot
                                        </a>
                                      </div>
                                    </div>
                                  )}
                                  
                                  {imgLayers.length === 0 ? (
                                    <p className="text-[10px] text-slate-400 italic">No custom image layer uploads. Decal is text/shape base.</p>
                                  ) : (
                                    <div className="space-y-1">
                                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Logo/Decal Assets:</p>
                                      {imgLayers.map((layer, lIdx) => (
                                        <div key={lIdx} className="flex justify-between items-center bg-white p-2 border rounded-xl">
                                          <div className="flex items-center gap-2">
                                            {layer.url && (
                                              <img 
                                                src={layer.url} 
                                                alt="Asset Decal" 
                                                className="h-8 w-8 object-contain bg-slate-50 border rounded"
                                                onError={(e) => e.target.src = "/images/dumyImage.png"}
                                              />
                                            )}
                                            <span className="text-xs font-semibold text-slate-700">{layer.name || `Asset ${lIdx + 1}`}</span>
                                          </div>
                                          <a 
                                            href={layer.url} 
                                            download 
                                            target="_blank"
                                            rel="noreferrer"
                                            className="p-1 text-slate-500 hover:text-indigo-600 transition"
                                            title="Download Asset Image"
                                          >
                                            <Download className="h-4 w-4" />
                                          </a>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              );
                            } else {
                              return (
                                <div key={idx} className="bg-slate-50 p-3 border rounded-xl text-center">
                                  <p className="text-xs text-slate-500">Ready-made catalog product printing. Check catalog details.</p>
                                </div>
                              );
                            }
                          })}
                        </div>
                      </div>

                    </div>

                    {/* Timeline Updates */}
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 pt-4 border-t border-dashed">
                      <div className="flex-1">
                        <input
                          type="text"
                          placeholder="Optional work log update note..."
                          value={orderNotes[order._id] || ""}
                          onChange={(e) => setOrderNotes(prev => ({ ...prev, [order._id]: e.target.value }))}
                          className="w-full text-xs border rounded-xl px-3 py-2 bg-white"
                        />
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {["Processing", "Printing", "Completed", "Cancelled"].map(st => (
                          <button
                            key={st}
                            disabled={actionLoading[order._id]}
                            onClick={() => handleUpdateStatus(order._id, st)}
                            className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase transition ${
                              order.orderStatus === st
                                ? "bg-teal-600 text-white shadow-xs"
                                : "bg-white border text-slate-700 hover:bg-slate-50"
                            }`}
                          >
                            {st}
                          </button>
                        ))}
                      </div>
                    </div>

                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ================= TAB 2: MY SUBMISSIONS ================= */}
        {activeTab === "submissions" && (
          <div className="space-y-8">
            <div className="bg-white border rounded-3xl p-6 shadow-sm">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold text-slate-950 flex items-center gap-2">
                  <Layers className="h-5 w-5 text-indigo-600" />
                  My Product Designs & Submissions
                </h3>
                <button
                  onClick={() => window.location.href = "/designer"}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition shadow-sm"
                >
                  <Plus className="h-4 w-4" />
                  Open 3D Designer
                </button>
              </div>

              {/* Informational Banner */}
              <div className="mb-6 p-4 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-start gap-3 text-xs text-indigo-700 select-none">
                <Sparkles className="h-4.5 w-4.5 shrink-0 mt-0.5" />
                <div>
                  <p className="font-extrabold text-slate-900">Create Concepts in the 3D Customizer</p>
                  <p className="text-slate-500 mt-1">
                    Click the <strong>Open 3D Designer</strong> button above to launch the workspace. After selecting shirt properties and decal details, click the <strong>Submit to Manager</strong> button in the designer header to specify details and propose a baseline catalog price.
                  </p>
                </div>
              </div>

              {mySubmissions.length === 0 ? (
                <div className="text-center py-16">
                  <p className="text-sm text-slate-500 font-semibold">You have not submitted any design concepts yet.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b text-[10px] uppercase tracking-wider text-slate-400 font-bold">
                        <th className="pb-3">Title</th>
                        <th className="pb-3">Category</th>
                        <th className="pb-3">Proposed Base Price</th>
                        <th className="pb-3">Sizes</th>
                        <th className="pb-3">Approval Status</th>
                        <th className="pb-3">Publish State</th>
                        <th className="pb-3">Submitted On</th>
                      </tr>
                    </thead>
                    <tbody>
                      {mySubmissions.map((p) => (
                        <tr key={p._id} className="border-b last:border-b-0 hover:bg-slate-50/50 transition">
                          <td className="py-4 font-bold text-slate-900">{p.title}</td>
                          <td className="py-4 text-xs text-slate-600">{p.category}</td>
                          <td className="py-4 text-xs font-bold text-slate-950">${p.basePrice.toFixed(2)}</td>
                          <td className="py-4 text-xs text-slate-500">{(p.sizes || []).join(", ")}</td>
                          <td className="py-4 text-xs">
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                              p.isApproved 
                                ? "bg-emerald-50 text-emerald-600" 
                                : p.status === "Archived" 
                                ? "bg-rose-50 text-rose-600" 
                                : "bg-amber-50 text-amber-600"
                            }`}>
                              {p.isApproved ? "Approved" : p.status === "Archived" ? "Rejected" : "Awaiting Review"}
                            </span>
                          </td>
                          <td className="py-4 text-xs">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                              p.status === "Active" ? "bg-emerald-50 text-emerald-600" : "bg-slate-100 text-slate-600"
                            }`}>
                              {p.status}
                            </span>
                          </td>
                          <td className="py-4 text-xs text-slate-400">
                            {new Date(p.createdAt).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>


          </div>
        )}

        {/* ================= TAB 3: SETTINGS ================= */}
        {activeTab === "settings" && (
          <div className="bg-white border rounded-3xl p-6 shadow-sm max-w-md">
            <h3 className="text-lg font-bold text-slate-950 mb-6 flex items-center gap-2">
              <Settings className="h-5 w-5 text-indigo-600" />
              Settings & Account Security
            </h3>

            <form onSubmit={handleChangePassword} className="space-y-4">
              <h4 className="text-xs font-black uppercase text-slate-400 tracking-wider border-b pb-1 mb-4">
                Change Password
              </h4>

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
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Current Password</label>
                <input
                  type="password"
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3 py-2 border rounded-xl text-sm"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">New Password</label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3 py-2 border rounded-xl text-sm"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Confirm New Password</label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3 py-2 border rounded-xl text-sm"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={passLoading}
                  className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition shadow-sm"
                >
                  {passLoading ? "Updating..." : "Update Password"}
                </button>
              </div>
            </form>
          </div>
        )}

      </div>
    </div>
  );
}
