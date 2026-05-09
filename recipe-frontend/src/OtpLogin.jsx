import { useState, useRef, useEffect } from "react";

const BASE = process.env.REACT_APP_API_URL || "http://localhost:8080";

async function sendOtp(email) {
  const res = await fetch(`${BASE}/auth/otp/send`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });
  if (!res.ok) {
    let msg = "Failed to send OTP";
    try { const e = await res.json(); msg = e.message || msg; } catch (_) {}
    throw new Error(msg);
  }
  return res.status === 204 ? null : res.json();
}

async function verifyOtp(email, otp) {
  const res = await fetch(`${BASE}/auth/otp/verify`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, otp }),
  });
  if (!res.ok) {
    let msg = "Invalid or expired OTP";
    try { const e = await res.json(); msg = e.message || msg; } catch (_) {}
    throw new Error(msg);
  }
  return res.json(); // { accessToken, userId, name, email, role }
}

export default function OtpLogin({ onLogin }) {
  const [step, setStep] = useState("email"); // "email" | "otp"
  const [email, setEmail] = useState("");
  const [digits, setDigits] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [resendTimer, setResendTimer] = useState(0);
  const [shake, setShake] = useState(false);
  const inputRefs = useRef([]);
  const timerRef = useRef(null);

  useEffect(() => {
    if (resendTimer > 0) {
      timerRef.current = setTimeout(() => setResendTimer(t => t - 1), 1000);
    }
    return () => clearTimeout(timerRef.current);
  }, [resendTimer]);

  const triggerShake = () => {
    setShake(true);
    setTimeout(() => setShake(false), 500);
  };

  const handleSendOtp = async (e) => {
    e.preventDefault();
    if (!email.trim() || !/\S+@\S+\.\S+/.test(email)) {
      setError("Enter a valid email address");
      triggerShake();
      return;
    }
    setLoading(true);
    setError("");
    try {
      await sendOtp(email.trim());
      setStep("otp");
      setResendTimer(30);
      setTimeout(() => inputRefs.current[0]?.focus(), 100);
    } catch (err) {
      setError(err.message);
      triggerShake();
    } finally {
      setLoading(false);
    }
  };

  const handleDigitChange = (i, val) => {
    const v = val.replace(/\D/, "").slice(-1);
    const next = [...digits];
    next[i] = v;
    setDigits(next);
    setError("");
    if (v && i < 5) inputRefs.current[i + 1]?.focus();
    if (next.every(d => d !== "")) handleVerifyOtp(next.join(""));
  };

  const handleKeyDown = (i, e) => {
    if (e.key === "Backspace" && !digits[i] && i > 0) {
      inputRefs.current[i - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted.length === 6) {
      setDigits(pasted.split(""));
      inputRefs.current[5]?.focus();
      handleVerifyOtp(pasted);
    }
  };

  const handleVerifyOtp = async (code) => {
    setLoading(true);
    setError("");
    try {
      const data = await verifyOtp(email.trim(), code);
      onLogin(data);
    } catch (err) {
      setError(err.message);
      triggerShake();
      setDigits(["", "", "", "", "", ""]);
      setTimeout(() => inputRefs.current[0]?.focus(), 50);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendTimer > 0) return;
    setLoading(true);
    setError("");
    setDigits(["", "", "", "", "", ""]);
    try {
      await sendOtp(email.trim());
      setResendTimer(30);
      setTimeout(() => inputRefs.current[0]?.focus(), 100);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={S.overlay}>
      <div style={S.card}>
        <div style={S.brand}>
          <span style={S.brandIcon}>🍱</span>
          <span style={S.brandName}>RasoiKit</span>
        </div>

        {step === "email" ? (
          <>
            <h2 style={S.title}>Sign in or create account</h2>
            <p style={S.subtitle}>We'll send a 6-digit code to your email</p>
            <form onSubmit={handleSendOtp} style={S.form}>
              <div style={S.inputWrap}>
                <label style={S.label}>Email address</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => { setEmail(e.target.value); setError(""); }}
                  placeholder="you@example.com"
                  style={{ ...S.input, ...(error ? S.inputError : {}) }}
                  autoFocus
                  disabled={loading}
                />
              </div>
              {error && <p style={S.errorMsg}>{error}</p>}
              <button type="submit" style={{ ...S.btn, ...(loading ? S.btnLoading : {}) }} disabled={loading}>
                {loading ? <span style={S.spinner} /> : "Get OTP →"}
              </button>
            </form>
          </>
        ) : (
          <>
            <h2 style={S.title}>Enter verification code</h2>
            <p style={S.subtitle}>
              Sent to <strong style={{ color: "#fc8019" }}>{email}</strong>
              <button onClick={() => { setStep("email"); setError(""); setDigits(["","","","","",""]); }} style={S.changeBtn}>
                Change
              </button>
            </p>
            <div style={{ ...S.otpRow, ...(shake ? S.shake : {}) }} onPaste={handlePaste}>
              {digits.map((d, i) => (
                <input
                  key={i}
                  ref={el => inputRefs.current[i] = el}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={d}
                  onChange={e => handleDigitChange(i, e.target.value)}
                  onKeyDown={e => handleKeyDown(i, e)}
                  style={{ ...S.digitBox, ...(d ? S.digitFilled : {}), ...(error ? S.digitError : {}) }}
                  disabled={loading}
                />
              ))}
            </div>
            {error && <p style={{ ...S.errorMsg, textAlign: "center", marginTop: 0 }}>{error}</p>}
            {loading && (
              <div style={S.verifying}>
                <span style={S.spinner} />
                <span style={{ marginLeft: 8, color: "#888", fontSize: 14 }}>Verifying…</span>
              </div>
            )}
            <div style={S.resendRow}>
              {resendTimer > 0
                ? <span style={S.resendTimer}>Resend OTP in {resendTimer}s</span>
                : <button onClick={handleResend} style={S.resendBtn} disabled={loading}>Resend OTP</button>
              }
            </div>
          </>
        )}

        <p style={S.footer}>
          By continuing you agree to our{" "}
          <a href="#" style={S.link}>Terms</a> &amp; <a href="#" style={S.link}>Privacy Policy</a>
        </p>
      </div>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes shake { 0%,100%{transform:translateX(0)} 20%{transform:translateX(-8px)} 40%{transform:translateX(8px)} 60%{transform:translateX(-5px)} 80%{transform:translateX(5px)} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
      `}</style>
    </div>
  );
}

const S = {
  overlay: {
    minHeight: "100vh",
    background: "linear-gradient(135deg,#fff8f0,#ffecd2)",
    display: "flex", alignItems: "center", justifyContent: "center",
    fontFamily: "'Segoe UI',system-ui,sans-serif", padding: 20,
  },
  card: {
    background: "#fff", borderRadius: 20, padding: "40px 36px 32px",
    width: "100%", maxWidth: 420,
    boxShadow: "0 8px 40px rgba(252,128,25,.12),0 2px 8px rgba(0,0,0,.06)",
    animation: "fadeUp .35s ease",
  },
  brand: { display: "flex", alignItems: "center", gap: 10, marginBottom: 28 },
  brandIcon: { fontSize: 32 },
  brandName: { fontSize: 22, fontWeight: 700, color: "#1d1d1d", letterSpacing: "-0.5px" },
  title: { fontSize: 22, fontWeight: 700, color: "#1d1d1d", margin: "0 0 6px", letterSpacing: "-0.3px" },
  subtitle: { fontSize: 14, color: "#666", margin: "0 0 24px", lineHeight: 1.5 },
  form: { display: "flex", flexDirection: "column", gap: 16 },
  inputWrap: { display: "flex", flexDirection: "column", gap: 6 },
  label: { fontSize: 13, fontWeight: 600, color: "#444" },
  input: {
    padding: "13px 16px", borderRadius: 12, border: "1.5px solid #e5e5e5",
    fontSize: 15, color: "#1d1d1d", outline: "none", background: "#fafafa",
    transition: "border-color .2s",
  },
  inputError: { borderColor: "#e53935" },
  errorMsg: { fontSize: 13, color: "#e53935", margin: 0, fontWeight: 500 },
  btn: {
    padding: 14, borderRadius: 12, border: "none", background: "#fc8019",
    color: "#fff", fontSize: 16, fontWeight: 700, cursor: "pointer",
    display: "flex", alignItems: "center", justifyContent: "center",
    transition: "opacity .2s", marginTop: 4,
  },
  btnLoading: { opacity: 0.7, cursor: "not-allowed" },
  spinner: {
    width: 20, height: 20,
    border: "2.5px solid rgba(255,255,255,.35)", borderTopColor: "#fff",
    borderRadius: "50%", display: "inline-block",
    animation: "spin .7s linear infinite",
  },
  changeBtn: {
    marginLeft: 8, background: "none", border: "none",
    color: "#fc8019", fontWeight: 600, fontSize: 13,
    cursor: "pointer", padding: 0, textDecoration: "underline",
  },
  otpRow: { display: "flex", gap: 10, justifyContent: "center", margin: "24px 0 12px" },
  shake: { animation: "shake .5s ease" },
  digitBox: {
    width: 52, height: 58, borderRadius: 12, border: "2px solid #e5e5e5",
    fontSize: 24, fontWeight: 700, textAlign: "center", color: "#1d1d1d",
    outline: "none", background: "#fafafa", transition: "border-color .2s,transform .15s",
    caretColor: "transparent",
  },
  digitFilled: { borderColor: "#fc8019", background: "#fff8f0", transform: "scale(1.05)" },
  digitError: { borderColor: "#e53935", background: "#fff5f5" },
  verifying: { display: "flex", alignItems: "center", justifyContent: "center", margin: "8px 0" },
  resendRow: { textAlign: "center", margin: "16px 0 8px" },
  resendTimer: { fontSize: 13, color: "#aaa" },
  resendBtn: {
    background: "none", border: "none", color: "#fc8019",
    fontWeight: 600, fontSize: 14, cursor: "pointer", padding: 0, textDecoration: "underline",
  },
  footer: { fontSize: 12, color: "#aaa", textAlign: "center", marginTop: 24, lineHeight: 1.6 },
  link: { color: "#fc8019", textDecoration: "none" },
};
