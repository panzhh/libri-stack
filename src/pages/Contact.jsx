import React, { useState } from "react";
import { API_URL } from "../api";

export default function Contact() {
  // Logged-in members don't need to type their name and email again
  const [formData, setFormData] = useState({
    name: localStorage.getItem("userName") || "",
    email: localStorage.getItem("userEmail") || "",
    message: "",
  });

  // "form" -> (code emailed) "code" -> message delivered
  const [step, setStep] = useState("form");
  const [verificationId, setVerificationId] = useState(null);
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const post = async (path, body) => {
    const response = await fetch(`${API_URL}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await response.json().catch(() => ({}));
    return { response, data };
  };

  const messageSent = () => {
    alert("✨ Message sent! We will get back to you soon.");
    setFormData((prev) => ({ ...prev, message: "" }));
    setStep("form");
    setCode("");
    setVerificationId(null);
  };

  const run = async (action) => {
    setBusy(true);
    setError("");
    try {
      await action();
    } catch (err) {
      console.error("Submission error:", err);
      setError("Server is currently offline. Please try again later.");
    } finally {
      setBusy(false);
    }
  };

  // Step 1: send the form; the server emails a verification code
  const handleSubmit = (e) => {
    e.preventDefault();
    run(async () => {
      const { response, data } = await post("/api/contact", formData);
      if (response.status === 202) {
        setVerificationId(data.verification_id);
        setStep("code");
      } else if (response.ok) {
        messageSent();
      } else {
        setError(data.error || "Failed to send message");
      }
    });
  };

  // Step 2: check the code; the message is delivered only after this
  const handleVerify = (e) => {
    e.preventDefault();
    run(async () => {
      const { response, data } = await post("/api/contact/verify", {
        verification_id: verificationId,
        code,
      });
      if (response.ok) return messageSent();
      setError(data.error || "Could not verify the code");
      if (response.status === 410) {
        setStep("form");
        setCode("");
      }
    });
  };

  return (
    <div className="max-w-xl mx-auto px-6 py-20">
      <div className="bg-white p-8 sm:p-12 rounded-xl border-2 border-gb-line shadow-sm">
        <h1 className="gb-h1 mb-2">Contact Us</h1>
        <p className="text-black font-bold text-base mb-8">
          Reach out to the Church in Dunn Loring Library Team
        </p>

        {error && (
          <p
            role="alert"
            className="mb-6 p-4 rounded-lg border-2 border-gb-red text-gb-red font-bold"
          >
            {error}
          </p>
        )}

        {step === "code" ? (
          <form onSubmit={handleVerify} className="space-y-4">
            <p className="text-black text-lg">
              We sent a 6-digit verification code to{" "}
              <span className="font-bold">{formData.email}</span>. Enter it
              below to send your message. The code expires in 10 minutes.
            </p>
            <div>
              <label className="text-base font-bold text-black ml-2 mb-1 block">
                Verification code <span className="text-rose-700">*</span>
              </label>
              <input
                type="text"
                required
                autoFocus
                inputMode="numeric"
                autoComplete="one-time-code"
                pattern="[0-9]{6}"
                maxLength={6}
                placeholder="123456"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                className="w-full px-5 py-4 bg-white border-2 border-[#9fb3bd] text-black placeholder:text-gb-muted focus:border-gb-dark rounded-lg outline-none font-normal text-2xl tracking-[0.5em] transition-all"
              />
            </div>
            <button
              type="submit"
              disabled={busy}
              className="w-full py-5 bg-gb-dark text-white text-lg font-bold rounded-lg hover:shadow-sm transition-all transform active:scale-95 mt-4 disabled:opacity-60"
            >
              {busy ? "Checking..." : "Verify & Send"}
            </button>
            <button
              type="button"
              onClick={() => {
                setStep("form");
                setCode("");
                setError("");
              }}
              className="w-full gb-link text-base"
            >
              Change my email or message
            </button>
          </form>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* NAME FIELD - REQUIRED */}
            <div>
              <label className="text-base font-bold text-black ml-2 mb-1 block">
                Your Name <span className="text-rose-700">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="Enter your full name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className="w-full px-5 py-4 bg-white border-2 border-[#9fb3bd] text-black placeholder:text-gb-muted focus:border-gb-dark rounded-lg outline-none font-normal text-lg transition-all"
              />
            </div>

            {/* EMAIL FIELD - REQUIRED */}
            <div>
              <label className="text-base font-bold text-black ml-2 mb-1 block">
                Email Address <span className="text-rose-700">*</span>
              </label>
              <input
                type="email"
                required
                placeholder="email@example.com"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                className="w-full px-5 py-4 bg-white border-2 border-[#9fb3bd] text-black placeholder:text-gb-muted focus:border-gb-dark rounded-lg outline-none font-normal text-lg transition-all"
              />
            </div>

            {/* MESSAGE FIELD - REQUIRED */}
            <div>
              <label className="text-base font-bold text-black ml-2 mb-1 block">
                Message <span className="text-rose-700">*</span>
              </label>
              <textarea
                required
                placeholder="How can we help you?"
                rows="4"
                value={formData.message}
                onChange={(e) =>
                  setFormData({ ...formData, message: e.target.value })
                }
                className="w-full px-5 py-4 bg-white border-2 border-[#9fb3bd] text-black placeholder:text-gb-muted focus:border-gb-dark rounded-lg outline-none font-normal text-lg transition-all resize-none"
              ></textarea>
            </div>

            <button
              type="submit"
              disabled={busy}
              className="w-full py-5 bg-gb-dark text-white text-lg font-bold rounded-lg hover:shadow-sm transition-all transform active:scale-95 mt-4 disabled:opacity-60"
            >
              {busy ? "Sending..." : "Send Message"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
