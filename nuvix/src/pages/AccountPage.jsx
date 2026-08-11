import { useState, useEffect } from "react";
import Navbar from "../components/Navbar/RNavbar";
import Sidebar from "../components/Sidebar/Sidebar";
import Footer from "../components/Footer/Footer";
import { User, Mail, Phone, MapPin, Calendar, Lock, Shield, CheckCircle, AlertCircle, Edit2 } from "lucide-react";
import axios from "axios";
import { API_BASE_URL } from "../config/api";

export default function AccountPage() {
  const [user, setUser] = useState(null);
  const [passwordForm, setPasswordForm] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: ""
  });
  const [statusMessage, setStatusMessage] = useState({ type: "", text: "" });
  const [loading, setLoading] = useState(false);

  const [isEditing, setIsEditing] = useState(false);
  const [profileForm, setProfileForm] = useState({
    name: "",
    phone: "",
    street: "",
    city: "",
    country: "Sri Lanka"
  });

  useEffect(() => {
    const userStr = localStorage.getItem("user");
    if (userStr) {
      try {
        const parsed = JSON.parse(userStr);
        setUser(parsed);
        setProfileForm({
          name: parsed.name || "",
          phone: parsed.phone || "",
          street: parsed.address?.street || "",
          city: parsed.address?.city || "",
          country: parsed.address?.country || "Sri Lanka"
        });
      } catch (err) {
        console.error("Error parsing user from localStorage:", err);
      }
    }
  }, []);

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setStatusMessage({ type: "", text: "" });
    setLoading(true);

    const token = localStorage.getItem("token");
    const headers = { Authorization: `Bearer ${token}` };

    try {
      const res = await axios.put(
        `${API_BASE_URL}/auth/update-profile`,
        {
          name: profileForm.name,
          phone: profileForm.phone,
          address: {
            street: profileForm.street,
            city: profileForm.city,
            country: profileForm.country
          }
        },
        { headers }
      );
      
      const updatedUser = res.data.user;
      setUser(updatedUser);
      localStorage.setItem("user", JSON.stringify(updatedUser));
      setStatusMessage({ type: "success", text: "Profile details updated successfully!" });
      setIsEditing(false);
    } catch (err) {
      console.error(err);
      setStatusMessage({
        type: "error",
        text: err.response?.data?.message || "Failed to update profile. Please try again."
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setStatusMessage({ type: "", text: "" });

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setStatusMessage({ type: "error", text: "New passwords do not match!" });
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      setStatusMessage({ type: "error", text: "New password must be at least 6 characters!" });
      return;
    }

    setLoading(true);
    const token = localStorage.getItem("token");
    const headers = { Authorization: `Bearer ${token}` };

    try {
      await axios.put(
        `${API_BASE_URL}/auth/change-password`,
        {
          currentPassword: passwordForm.oldPassword,
          newPassword: passwordForm.newPassword
        },
        { headers }
      );
      setStatusMessage({ type: "success", text: "Password updated successfully!" });
      setPasswordForm({ oldPassword: "", newPassword: "", confirmPassword: "" });
    } catch (err) {
      console.error(err);
      setStatusMessage({
        type: "error",
        text: err.response?.data?.message || "Failed to update password. Please check your credentials."
      });
    } finally {
      setLoading(false);
    }
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
              <h2 className="text-2xl font-black text-slate-900">My Account</h2>
              <p className="text-xs text-slate-500 mt-1">Manage your profile details and security settings</p>
            </div>

            {user && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                
                {/* Profile Card */}
                <div className="md:col-span-2 bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm space-y-6">
                  <div className="flex items-center justify-between pb-4 border-b">
                    <div className="flex items-center gap-4">
                      <span className="flex h-16 w-16 items-center justify-center rounded-full bg-indigo-50 border border-indigo-100 text-indigo-600 text-xl font-bold">
                        {user.name?.charAt(0).toUpperCase()}
                      </span>
                      <div>
                        <h3 className="text-lg font-black text-slate-900 leading-tight">{user.name}</h3>
                        <div className="flex items-center gap-1.5 mt-1 text-slate-500 text-xs">
                          <Shield className="h-3.5 w-3.5 text-indigo-500" />
                          <span className="font-bold text-indigo-600">{user.role} Account</span>
                        </div>
                      </div>
                    </div>
                    {!isEditing && (
                      <button
                        onClick={() => setIsEditing(true)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 text-slate-600 text-xs font-bold rounded-xl transition cursor-pointer"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                        Edit Profile
                      </button>
                    )}
                  </div>

                  {!isEditing ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-sm">
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide flex items-center gap-1.5">
                          <Mail className="h-3 w-3 text-slate-400" /> Email Address
                        </span>
                        <p className="font-semibold text-slate-800">{user.email}</p>
                      </div>

                      <div className="space-y-1">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide flex items-center gap-1.5">
                          <Phone className="h-3 w-3 text-slate-400" /> Phone Number
                        </span>
                        <p className="font-semibold text-slate-800">{user.phone || "Not Provided"}</p>
                      </div>

                      <div className="sm:col-span-2 space-y-1">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide flex items-center gap-1.5">
                          <MapPin className="h-3 w-3 text-slate-400" /> Delivery Address
                        </span>
                        {user.address && (user.address.street || user.address.city) ? (
                          <p className="font-semibold text-slate-800">
                            {user.address.street || ""}{user.address.street && user.address.city ? ", " : ""}{user.address.city || ""}{user.address.country ? `, ${user.address.country}` : ""}
                          </p>
                        ) : (
                          <p className="font-semibold text-slate-400 italic">No address provided yet</p>
                        )}
                      </div>

                      <div className="space-y-1">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide flex items-center gap-1.5">
                          <Calendar className="h-3 w-3 text-slate-400" /> Member Since
                        </span>
                        <p className="font-semibold text-slate-800">
                          {new Date(user.createdAt || Date.now()).toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "long",
                            day: "numeric"
                          })}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <form onSubmit={handleProfileUpdate} className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Full Name</label>
                          <input
                            type="text"
                            required
                            value={profileForm.name}
                            onChange={(e) => setProfileForm(p => ({ ...p, name: e.target.value }))}
                            className="w-full px-3 py-2 border rounded-xl text-xs"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Phone Number</label>
                          <input
                            type="text"
                            value={profileForm.phone}
                            onChange={(e) => setProfileForm(p => ({ ...p, phone: e.target.value }))}
                            placeholder="e.g. +94 77 123 4567"
                            className="w-full px-3 py-2 border rounded-xl text-xs"
                          />
                        </div>

                        <div className="space-y-1 sm:col-span-2">
                          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Street Address</label>
                          <input
                            type="text"
                            value={profileForm.street}
                            onChange={(e) => setProfileForm(p => ({ ...p, street: e.target.value }))}
                            placeholder="Street / Apartment / House No."
                            className="w-full px-3 py-2 border rounded-xl text-xs"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">City</label>
                          <input
                            type="text"
                            value={profileForm.city}
                            onChange={(e) => setProfileForm(p => ({ ...p, city: e.target.value }))}
                            placeholder="City"
                            className="w-full px-3 py-2 border rounded-xl text-xs"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Country</label>
                          <input
                            type="text"
                            value={profileForm.country}
                            onChange={(e) => setProfileForm(p => ({ ...p, country: e.target.value }))}
                            placeholder="Country"
                            className="w-full px-3 py-2 border rounded-xl text-xs"
                          />
                        </div>
                      </div>

                      <div className="flex justify-end gap-2 pt-2">
                        <button
                          type="button"
                          onClick={() => {
                            setIsEditing(false);
                            setProfileForm({
                              name: user.name || "",
                              phone: user.phone || "",
                              street: user.address?.street || "",
                              city: user.address?.city || "",
                              country: user.address?.country || "Sri Lanka"
                            });
                          }}
                          className="px-4 py-2 border text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-50 transition cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={loading}
                          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition shadow-sm cursor-pointer"
                        >
                          {loading ? "Saving..." : "Save Changes"}
                        </button>
                      </div>
                    </form>
                  )}
                </div>

                {/* Security/Password Card */}
                <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm flex flex-col justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 pb-3 border-b mb-4">
                      <Lock className="h-4.5 w-4.5 text-indigo-600" /> Security Settings
                    </h3>

                    {statusMessage.text && (
                      <div
                        className={`mb-4 flex items-center gap-2 p-3 rounded-xl border text-xs font-semibold ${
                          statusMessage.type === "success"
                            ? "bg-emerald-50 border-emerald-100 text-emerald-600"
                            : "bg-rose-50 border-rose-100 text-rose-600"
                        }`}
                      >
                        {statusMessage.type === "success" ? (
                          <CheckCircle className="h-4 w-4 shrink-0" />
                        ) : (
                          <AlertCircle className="h-4 w-4 shrink-0" />
                        )}
                        <span>{statusMessage.text}</span>
                      </div>
                    )}

                    <form onSubmit={handlePasswordChange} className="space-y-3.5">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Current Password</label>
                        <input
                          type="password"
                          required
                          value={passwordForm.oldPassword}
                          onChange={(e) => setPasswordForm(p => ({ ...p, oldPassword: e.target.value }))}
                          placeholder="••••••••"
                          className="w-full px-3 py-2 border rounded-xl text-xs"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">New Password</label>
                        <input
                          type="password"
                          required
                          value={passwordForm.newPassword}
                          onChange={(e) => setPasswordForm(p => ({ ...p, newPassword: e.target.value }))}
                          placeholder="Min 6 characters"
                          className="w-full px-3 py-2 border rounded-xl text-xs"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Confirm New Password</label>
                        <input
                          type="password"
                          required
                          value={passwordForm.confirmPassword}
                          onChange={(e) => setPasswordForm(p => ({ ...p, confirmPassword: e.target.value }))}
                          placeholder="••••••••"
                          className="w-full px-3 py-2 border rounded-xl text-xs"
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition shadow-sm mt-4"
                      >
                        {loading ? "Updating..." : "Change Password"}
                      </button>
                    </form>
                  </div>
                </div>

              </div>
            )}

          </div>
        </main>
      </div>

      <Footer withSidebarOffset />
    </div>
  );
}
