import React, { useState } from "react";
import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:3003/api",
  timeout: 10000,
});

const PatientSignup = () => {
  const [step, setStep] = useState("PHONE"); // PHONE | OTP | SUCCESS
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [userId, setUserId] = useState(null);
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const showError = (msg) => {
    setError(msg);
    setTimeout(() => setError(""), 4000);
  };

  const handleRequestOtp = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!name.trim() || !phone.trim()) {
      return showError("Please enter your name and phone number.");
    }

    try {
      setLoading(true);
      const res = await api.post("/patient-auth/register", { name, phone });

      if (res.data?.success) {
        setUserId(res.data.data.userId);
        setStep("OTP");
        setSuccess("OTP sent to your phone.");
      }
    } catch (err) {
      const msg =
        err.response?.data?.error?.message ||
        "Failed to send OTP. Please try again.";
      showError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!otp.trim() || otp.trim().length < 4) {
      return showError("Please enter the OTP you received.");
    }

    try {
      setLoading(true);
      const res = await api.post("/patient-auth/verify-registration", {
        userId,
        otp: otp.trim(),
      });

      if (res.data?.success) {
        const { accessToken, data } = res.data;
        if (accessToken) {
          localStorage.setItem("accessToken", accessToken);
        }
        if (data?.user) {
          localStorage.setItem("user", JSON.stringify(data.user));
        }

        setStep("SUCCESS");
        setSuccess("Registration successful! Redirecting to dashboard...");
        // redirect after short delay
        setTimeout(() => {
          window.location.href = "/patient-dashboard";
        }, 1500);
      }
    } catch (err) {
      const msg =
        err.response?.data?.error?.message || "Invalid or expired OTP.";
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
        setSuccess("New OTP sent to your phone.");
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-gray-100 p-6 sm:p-8">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold text-gray-900">
            {step === "PHONE" && "Create your AyurMitra account"}
            {step === "OTP" && "Verify your phone"}
            {step === "SUCCESS" && "Welcome to AyurMitra"}
          </h1>
          <p className="mt-1 text-sm text-gray-600">
            {step === "PHONE" &&
              "Sign up using your mobile number. No password required."}
            {step === "OTP" &&
              "Enter the 6‑digit code sent to your mobile number."}
            {step === "SUCCESS" &&
              "Your account is ready. You will be redirected shortly."}
          </p>
        </div>

        {error && (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
            {success}
          </div>
        )}

        {step === "PHONE" && (
          <form onSubmit={handleRequestOtp} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Full Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400"
                placeholder="Subham Satyajit"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Mobile Number
              </label>
              <div className="flex gap-2">
                <span className="inline-flex items-center rounded-xl border border-gray-300 bg-gray-50 px-3 text-sm text-gray-600">
                  +91
                </span>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                  maxLength={10}
                  className="flex-1 rounded-xl border border-gray-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400"
                  placeholder="9876543210"
                />
              </div>
              <p className="mt-1 text-xs text-gray-500">
                OTP will be sent to this number for verification.
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 inline-flex items-center justify-center rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md hover:bg-emerald-700 disabled:opacity-60"
            >
              {loading ? "Sending OTP..." : "Send OTP"}
            </button>

            <p className="mt-3 text-xs text-center text-gray-500">
              Already have an account?{" "}
              <a
                href="/patient-login"
                className="font-semibold text-emerald-700 hover:underline"
              >
                Login
              </a>
            </p>
          </form>
        )}

        {step === "OTP" && (
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <div className="text-sm text-gray-700">
              <p>
                We’ve sent a 6‑digit code to{" "}
                <span className="font-semibold">+91 {phone}</span>.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Enter OTP
              </label>
              <input
                type="tel"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                maxLength={6}
                className="w-full tracking-widest text-center text-lg rounded-xl border border-gray-300 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400"
                placeholder="••••••"
              />
              <p className="mt-1 text-xs text-gray-500">
                Didn’t get the code?{" "}
                <button
                  type="button"
                  disabled={loading}
                  onClick={handleResendOtp}
                  className="text-emerald-700 font-semibold hover:underline disabled:opacity-60"
                >
                  Resend OTP
                </button>
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full inline-flex items-center justify-center rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md hover:bg-emerald-700 disabled:opacity-60"
            >
              {loading ? "Verifying..." : "Verify & Continue"}
            </button>

            <button
              type="button"
              onClick={() => setStep("PHONE")}
              className="w-full text-xs text-center text-gray-500 hover:underline"
            >
              Change phone number
            </button>
          </form>
        )}

        {step === "SUCCESS" && (
          <div className="py-6 text-center text-sm text-gray-700">
            You’re all set. Redirecting to your dashboard…
          </div>
        )}
      </div>
    </div>
  );
};

export default PatientSignup;
