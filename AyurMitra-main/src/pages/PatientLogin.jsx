// src/pages/PatientLogin.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  User,
  Sparkles,
  Lock,
  Phone,
  CheckCircle,
  AlertCircle,
  Loader2,
} from "lucide-react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";

const api = axios.create({
  baseURL: "http://localhost:3003/api",
  timeout: 10000,
});

const PatientLogin = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  // STEPS: PHONE -> OTP
  const [step, setStep] = useState("PHONE");
  const [phone, setPhone] = useState("");
  const [userId, setUserId] = useState(null);
  const [otp, setOtp] = useState("");
  const [rememberMe, setRememberMe] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const showError = (msg) => {
    setError(msg);
    setTimeout(() => setError(""), 4000);
  };

  const showSuccess = (msg) => {
    setSuccess(msg);
    setTimeout(() => setSuccess(""), 4000);
  };

  // STEP 1: send OTP
  const handleSendOtp = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    const cleanPhone = phone.trim();
    if (!cleanPhone) {
      return showError("Please enter your mobile number.");
    }
    if (cleanPhone.length < 8) {
      return showError("Please enter a valid mobile number.");
    }

    try {
      setLoading(true);
      const res = await api.post("/patient-auth/login", { phone: cleanPhone });

      if (res.data?.success) {
        setUserId(res.data.data.userId);
        setStep("OTP");
        showSuccess("OTP sent to your mobile number.");
      }
    } catch (err) {
      const msg =
        err.response?.data?.error?.message ||
        err.response?.data?.message ||
        "Failed to send OTP. Please try again.";
      showError(msg);
    } finally {
      setLoading(false);
    }
  };

  // STEP 2: verify OTP
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!otp.trim()) {
      return showError("Please enter the OTP you received.");
    }

    try {
      setLoading(true);
      const res = await api.post("/patient-auth/verify-login", {
        userId,
        otp: otp.trim(),
        rememberMe,
      });

      if (res.data?.success) {
        const { accessToken } = res.data.data || {};
        const user = res.data.data?.user;

        if (accessToken) {
          localStorage.setItem("accessToken", accessToken);
        }
        if (user) {
          localStorage.setItem("user", JSON.stringify(user));
          login(user, accessToken);
        }

        showSuccess("Login successful! Redirecting...");

        const isPatient = user?.role === "patient";
        const profileCompleted = !!user?.profileCompleted;

        setTimeout(() => {
          if (isPatient && !profileCompleted) {
            navigate("/patient-form");
          } else {
            navigate("/patient-dashboard");
          }
        }, 1000);
      }
    } catch (err) {
      const msg =
        err.response?.data?.error?.message ||
        err.response?.data?.message ||
        "Invalid or expired OTP.";
      showError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (!userId) return;
    setError("");
    setSuccess("");

    try {
      setLoading(true);
      const res = await api.post("/patient-auth/resend-otp", { userId });
      if (res.data?.success) {
        showSuccess("New OTP sent to your mobile number.");
      }
    } catch (err) {
      const msg =
        err.response?.data?.error?.message || "Failed to resend OTP.";
      showError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-green-900 to-emerald-900 flex items-center justify-center p-4 relative overflow-hidden">
      {/* background / effects kept same */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-20 -right-20 w-96 h-96 bg-gradient-to-br from-green-400/30 to-emerald-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div
          className="absolute -bottom-20 -left-20 w-80 h-80 bg-gradient-to-tr from-emerald-400/25 to-teal-500/15 rounded-full blur-2xl animate-bounce"
          style={{ animationDuration: "3s" }}
        ></div>
        <div
          className="absolute top-1/3 right-1/4 w-64 h-64 bg-gradient-to-bl from-green-300/20 to-lime-400/10 rounded-full blur-3xl animate-spin"
          style={{ animationDuration: "20s" }}
        ></div>
        <div
          className="absolute bottom-1/3 left-1/4 w-48 h-48 bg-gradient-to-tr from-teal-400/15 to-green-500/20 rounded-full blur-2xl animate-ping"
          style={{ animationDuration: "4s" }}
        ></div>
        <div
          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-conic from-green-400/5 via-emerald-400/10 to-teal-400/5 rounded-full blur-3xl animate-spin"
          style={{ animationDuration: "30s" }}
        ></div>
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        ></div>
        <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_center,transparent_40%,rgba(0,0,0,0.35))]"></div>
      </div>

      <div className="w-full max-w-md relative z-10 flex items-center justify-center min-h-screen">
        <div className="bg-white/10 backdrop-blur-2xl rounded-3xl shadow-2xl border border-white/20 p-8 relative overflow-hidden group hover:bg-white/15 transition-all duration-500 w-full">
          <div className="absolute inset-0 bg-gradient-to-r from-green-400 via-emerald-400 to-teal-400 rounded-3xl opacity-75 blur-sm group-hover:opacity-100 transition-opacity duration-500"></div>
          <div className="absolute inset-[1px] bg-slate-900/90 rounded-3xl"></div>
          <div className="pointer-events-none absolute -top-1/2 left-0 w-full h-full bg-gradient-to-b from-white/10 to-transparent translate-y-0 group-hover:translate-y-full transition-transform duration-700"></div>

          <div className="relative z-10">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="relative mx-auto mb-6">
                <div className="w-20 h-20 bg-gradient-to-br from-green-400 to-emerald-500 rounded-2xl flex items-center justify-center mx-auto shadow-2xl transform rotate-3 group-hover:rotate-0 transition-transform duration-300">
                  <User className="w-10 h-10 text-white" />
                </div>
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center animate-bounce">
                  <Sparkles className="w-3 h-3 text-yellow-900" />
                </div>
              </div>
              <h1 className="text-4xl font-black bg-gradient-to-r from-white to-green-200 bg-clip-text text-transparent mb-3">
                Patient Portal
              </h1>
              <p className="text-green-100/80 text-lg font-medium">
                Sign in with your mobile number
              </p>
            </div>

            {/* Messages */}
            {success && (
              <div className="mb-4 flex items-center space-x-2 bg-green-500/20 border border-green-400/30 rounded-xl p-3">
                <CheckCircle className="w-5 h-5 text-green-300 flex-shrink-0" />
                <p className="text-green-100 text-sm font-medium">{success}</p>
              </div>
            )}
            {error && (
              <div className="mb-4 flex items-center space-x-2 bg-red-500/20 border border-red-400/30 rounded-xl p-3">
                <AlertCircle className="w-5 h-5 text-red-300 flex-shrink-0" />
                <p className="text-red-100 text-sm font-medium">{error}</p>
              </div>
            )}

            {/* STEP 1: phone */}
            {step === "PHONE" && (
              <form onSubmit={handleSendOtp} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-green-200 font-medium flex items-center space-x-2">
                    <Phone className="w-4 h-4" />
                    <span>Mobile Number</span>
                  </label>
                  <div className="relative flex items-center">
                    <span className="px-3 py-2 rounded-l-xl bg-white/10 border border-white/20 text-green-100 text-sm">
                      +91
                    </span>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) =>
                        setPhone(e.target.value.replace(/\D/g, ""))
                      }
                      maxLength={10}
                      className="w-full bg-white/10 border border-white/20 border-l-0 text-white placeholder:text-white/60 rounded-r-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-300/50 focus:border-emerald-300/50 transition-all duration-200"
                      placeholder="9876543210"
                      disabled={loading}
                      autoComplete="tel"
                    />
                  </div>
                  <p className="text-xs text-green-200/80">
                    You’ll receive a one‑time password (OTP) on this number.
                  </p>
                </div>

                <div className="flex items-center justify-between">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="w-4 h-4 text-emerald-500 bg-white/10 border border-white/20 rounded focus:ring-emerald-300/50"
                      disabled={loading}
                    />
                    <span className="text-green-200 text-sm">
                      Keep me signed in
                    </span>
                  </label>
                  <button
                    type="button"
                    onClick={() => navigate("/register")}
                    className="text-emerald-300 hover:text-emerald-200 text-sm font-medium"
                  >
                    New here? Register
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-400 hover:to-emerald-400 text-white font-semibold py-3 px-6 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-100 disabled:scale-100 disabled:cursor-not-allowed disabled:from-gray-500 disabled:to-gray-600 transition-all duration-200"
                >
                  {loading ? (
                    <span className="flex items-center justify-center space-x-2">
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Sending OTP...</span>
                    </span>
                  ) : (
                    "Send OTP"
                  )}
                </button>
              </form>
            )}

            {/* STEP 2: OTP */}
            {step === "OTP" && (
              <form onSubmit={handleVerifyOtp} className="space-y-6">
                <div className="space-y-1">
                  <p className="text-green-100 text-sm">
                    Enter the 6‑digit code sent to{" "}
                    <span className="font-semibold">+91 {phone}</span>.
                  </p>
                </div>

                <div className="space-y-2">
                  <label className="text-green-200 font-medium flex items-center space-x-2">
                    <Lock className="w-4 h-4" />
                    <span>One‑Time Password</span>
                  </label>
                  <input
                    type="tel"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                    maxLength={6}
                    className="w-full bg-white/10 border border-white/20 text-center tracking-[0.5em] text-lg text-white placeholder:text-white/40 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-300/50 focus:border-emerald-300/50 transition-all duration-200"
                    placeholder="••••••"
                    disabled={loading}
                    autoComplete="one-time-code"
                  />
                  <div className="flex items-center justify-between text-xs text-green-200/80">
                    <button
                      type="button"
                      onClick={() => setStep("PHONE")}
                      className="hover:underline"
                      disabled={loading}
                    >
                      Change number
                    </button>
                    <button
                      type="button"
                      onClick={handleResendOtp}
                      className="text-emerald-300 hover:text-emerald-200 font-semibold"
                      disabled={loading}
                    >
                      Resend OTP
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-400 hover:to-emerald-400 text-white font-semibold py-3 px-6 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-100 disabled:scale-100 disabled:cursor-not-allowed disabled:from-gray-500 disabled:to-gray-600 transition-all duration-200"
                >
                  {loading ? (
                    <span className="flex items-center justify-center space-x-2">
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Verifying...</span>
                    </span>
                  ) : (
                    "Verify & Sign In"
                  )}
                </button>
              </form>
            )}
          </div>
        </div>

        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2">
          <p className="text-green-200/60 text-sm text-center">
            Secure • Private • HIPAA Compliant
          </p>
        </div>
      </div>
    </div>
  );
};

export default PatientLogin;
