import { useState } from "react";
import Navbar from "../components/Navbar/GNavbar";
import Footer from "../components/Footer/Footer";
import { 
  Lock, 
  Mail, 
  Eye, 
  EyeOff, 
  AlertCircle, 
  KeyRound, 
  CheckCircle2, 
  X, 
  ArrowLeft,
  Loader2,
  ShieldCheck
} from "lucide-react";
import axios from "axios";

import { API_BASE_URL } from "../config/api";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Forgot Password Modal State
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetStep, setResetStep] = useState(1); // 1: Email, 2: OTP & New Password, 3: Success
  const [resetEmail, setResetEmail] = useState("");
  const [resetOtp, setResetOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [resetError, setResetError] = useState("");
  const [resetSuccess, setResetSuccess] = useState("");
  const [loginNotice, setLoginNotice] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoginNotice("");
    setLoading(true);

    try {
      const response = await axios.post(`${API_BASE_URL}/auth/login`, {
        email,
        password
      });

      // Save token and user details to localStorage
      localStorage.setItem("token", response.data.token);
      localStorage.setItem("user", JSON.stringify(response.data.user));

      // Extract optional redirect parameter
      const params = new URLSearchParams(window.location.search);
      const redirectUrl = params.get("redirect");

      if (redirectUrl) {
        window.location.href = redirectUrl;
      } else {
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

  // Step 1: Send OTP to email
  const handleRequestOtp = async (e) => {
    e?.preventDefault();
    setResetError("");
    setResetSuccess("");

    if (!resetEmail || !resetEmail.includes("@")) {
      setResetError("Please enter a valid email address.");
      return;
    }

    setResetLoading(true);
    try {
      const response = await axios.post(`${API_BASE_URL}/auth/forgot-password`, {
        email: resetEmail
      });

      setResetSuccess(response.data.message || "A 6-digit verification code has been sent to your email.");
      setResetStep(2);
    } catch (err) {
      console.error("Forgot password request error:", err);
      setResetError(
        err.response?.data?.message || "Failed to send reset code. Please check your email and try again."
      );
    } finally {
      setResetLoading(false);
    }
  };

  // Step 2: Verify OTP and reset password
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setResetError("");

    if (!resetOtp || resetOtp.trim().length !== 6) {
      setResetError("Please enter the 6-digit verification code sent to your email.");
      return;
    }

    if (!newPassword || newPassword.length < 6) {
      setResetError("Password must be at least 6 characters long.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setResetError("Passwords do not match. Please re-enter.");
      return;
    }

    setResetLoading(true);
    try {
      const response = await axios.post(`${API_BASE_URL}/auth/reset-password`, {
        email: resetEmail,
        otp: resetOtp.trim(),
        newPassword
      });

      setResetSuccess(response.data.message || "Password successfully reset!");
      setResetStep(3);
      setEmail(resetEmail);
      setPassword("");
      setLoginNotice("Your password was updated successfully! Please log in with your new password.");
    } catch (err) {
      console.error("Reset password error:", err);
      setResetError(
        err.response?.data?.message || "Failed to reset password. Please check your code and try again."
      );
    } finally {
      setResetLoading(false);
    }
  };

  const openForgotModal = () => {
    setResetEmail(email || "");
    setResetOtp("");
    setNewPassword("");
    setConfirmPassword("");
    setResetError("");
    setResetSuccess("");
    setResetStep(1);
    setShowResetModal(true);
  };

  const closeResetModal = () => {
    setShowResetModal(false);
    setResetError("");
    setResetSuccess("");
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

          {/* Success notice from password reset */}
          {loginNotice && (
            <div className="mb-6 flex items-start gap-2.5 p-4 rounded-2xl bg-emerald-50 border border-emerald-100 text-emerald-700 text-xs font-semibold">
              <CheckCircle2 className="h-4.5 w-4.5 shrink-0 text-emerald-600 mt-0.5" />
              <span>{loginNotice}</span>
            </div>
          )}

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
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Password</label>
                <button
                  type="button"
                  onClick={openForgotModal}
                  className="text-xs font-bold text-indigo-600 hover:text-indigo-800 transition hover:underline"
                >
                  Forgot Password?
                </button>
              </div>
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

      {/* Forgot Password Modal */}
      {showResetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div 
            className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-slate-100 relative overflow-hidden transition-all duration-300 transform scale-100"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Top Accent bar */}
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-600" />

            {/* Close Button */}
            <button
              type="button"
              onClick={closeResetModal}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 p-1.5 rounded-full hover:bg-slate-100 transition"
            >
              <X className="w-5 h-5" />
            </button>

            {/* STEP 1: Enter Email */}
            {resetStep === 1 && (
              <div className="space-y-5">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
                    <KeyRound className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-900">Reset Password</h3>
                    <p className="text-xs text-slate-500 mt-0.5">Enter your email to receive a verification code</p>
                  </div>
                </div>

                {resetError && (
                  <div className="flex items-center gap-2 p-3.5 rounded-xl bg-rose-50 border border-rose-100 text-rose-600 text-xs font-semibold">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span>{resetError}</span>
                  </div>
                )}

                <form onSubmit={handleRequestOtp} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Your Registered Email</label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
                        <Mail className="h-4 w-4" />
                      </span>
                      <input
                        type="email"
                        required
                        value={resetEmail}
                        onChange={(e) => setResetEmail(e.target.value)}
                        placeholder="you@example.com"
                        className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-100 rounded-xl text-sm transition font-medium"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={resetLoading}
                    className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-md shadow-indigo-200 hover:shadow-lg disabled:opacity-50 transition duration-150 text-sm flex items-center justify-center gap-2"
                  >
                    {resetLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Sending Code...</span>
                      </>
                    ) : (
                      <span>Send Verification Code</span>
                    )}
                  </button>
                </form>
              </div>
            )}

            {/* STEP 2: Enter OTP & New Password */}
            {resetStep === 2 && (
              <div className="space-y-5">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => { setResetStep(1); setResetError(""); }}
                    className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
                    title="Back to email step"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                  <div>
                    <h3 className="text-xl font-bold text-slate-900">Enter Verification Code</h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Code sent to <span className="font-semibold text-slate-800">{resetEmail}</span>
                    </p>
                  </div>
                </div>

                {resetSuccess && (
                  <div className="flex items-center gap-2 p-3 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-semibold">
                    <ShieldCheck className="h-4 w-4 shrink-0 text-indigo-600" />
                    <span>{resetSuccess}</span>
                  </div>
                )}

                {resetError && (
                  <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-50 border border-rose-100 text-rose-600 text-xs font-semibold">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span>{resetError}</span>
                  </div>
                )}

                <form onSubmit={handleResetPassword} className="space-y-3.5">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">6-Digit Code</label>
                    <input
                      type="text"
                      required
                      maxLength={6}
                      value={resetOtp}
                      onChange={(e) => setResetOtp(e.target.value.replace(/\D/g, ""))}
                      placeholder="123456"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-100 rounded-xl text-center text-xl tracking-[0.3em] font-mono font-bold text-slate-800 transition"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">New Password</label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
                        <Lock className="h-4 w-4" />
                      </span>
                      <input
                        type={showNewPassword ? "text" : "password"}
                        required
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="At least 6 characters"
                        className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white rounded-xl text-sm transition"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600"
                      >
                        {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Confirm New Password</label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
                        <Lock className="h-4 w-4" />
                      </span>
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        required
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Re-type new password"
                        className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white rounded-xl text-sm transition"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600"
                      >
                        {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={resetLoading}
                    className="w-full mt-2 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-md shadow-indigo-200 hover:shadow-lg disabled:opacity-50 transition duration-150 text-sm flex items-center justify-center gap-2"
                  >
                    {resetLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Updating Password...</span>
                      </>
                    ) : (
                      <span>Reset Password</span>
                    )}
                  </button>

                  <div className="text-center pt-2">
                    <button
                      type="button"
                      disabled={resetLoading}
                      onClick={handleRequestOtp}
                      className="text-xs text-slate-500 hover:text-indigo-600 font-semibold transition"
                    >
                      Didn't receive the code? Resend
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* STEP 3: Success */}
            {resetStep === 3 && (
              <div className="text-center py-4 space-y-4">
                <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-2 animate-bounce">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900">Password Reset Complete!</h3>
                  <p className="text-sm text-slate-500 mt-1 max-w-xs mx-auto">
                    Your password has been successfully updated. You can now log into your account.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={closeResetModal}
                  className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-md shadow-emerald-200 transition text-sm"
                >
                  Back to Login
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
