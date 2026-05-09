import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";

export default function NotFound() {
  const navigate = useNavigate();
  const [count, setCount] = useState(5);

  useEffect(() => {
    const t = setInterval(() => setCount(c => c - 1), 1000);
    const r = setTimeout(() => navigate("/"), 5000);
    return () => { clearInterval(t); clearTimeout(r); };
  }, [navigate]);

  return (
    <div style={S.page}>
      <div style={S.card}>
        <div style={S.emoji}>🍽️</div>
        <h1 style={S.code}>404</h1>
        <h2 style={S.title}>This dish is off the menu</h2>
        <p style={S.sub}>The page you're looking for doesn't exist or has been moved.</p>

        <div style={S.btnRow}>
          <button onClick={() => navigate("/")} style={S.primaryBtn}>
            Go Home
          </button>
          <button onClick={() => navigate("/recipes")} style={S.secondaryBtn}>
            Browse Recipes
          </button>
        </div>

        <p style={S.redirect}>Redirecting to home in <strong>{count}</strong>s…</p>
      </div>

      <style>{`
        @keyframes float {
          0%,100% { transform: translateY(0); }
          50%      { transform: translateY(-12px); }
        }
        @keyframes fadeUp {
          from { opacity:0; transform:translateY(20px); }
          to   { opacity:1; transform:translateY(0); }
        }
      `}</style>
    </div>
  );
}

const S = {
  page: {
    minHeight: "80vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontFamily: "'Segoe UI', system-ui, sans-serif",
    background: "#FAFAF8",
    padding: 24,
  },
  card: {
    textAlign: "center",
    maxWidth: 440,
    animation: "fadeUp .4s ease",
  },
  emoji: {
    fontSize: 72,
    animation: "float 3s ease-in-out infinite",
    display: "inline-block",
    marginBottom: 16,
  },
  code: {
    fontSize: 96,
    fontWeight: 800,
    color: "#E23744",
    margin: "0 0 4px",
    letterSpacing: "-4px",
    lineHeight: 1,
    fontFamily: "'Syne', sans-serif",
  },
  title: {
    fontSize: 24,
    fontWeight: 700,
    color: "#1A1A1A",
    margin: "0 0 12px",
    fontFamily: "'Syne', sans-serif",
  },
  sub: {
    fontSize: 15,
    color: "#888",
    margin: "0 0 32px",
    lineHeight: 1.6,
  },
  btnRow: {
    display: "flex",
    gap: 12,
    justifyContent: "center",
    marginBottom: 20,
    flexWrap: "wrap",
  },
  primaryBtn: {
    padding: "12px 28px",
    borderRadius: 12,
    border: "none",
    background: "linear-gradient(135deg, #E23744, #FF6B35)",
    color: "#fff",
    fontSize: 15,
    fontWeight: 700,
    cursor: "pointer",
    fontFamily: "'Syne', sans-serif",
    boxShadow: "0 4px 16px rgba(226,55,68,0.3)",
  },
  secondaryBtn: {
    padding: "12px 28px",
    borderRadius: 12,
    border: "1.5px solid #e5e5e5",
    background: "#fff",
    color: "#1A1A1A",
    fontSize: 15,
    fontWeight: 600,
    cursor: "pointer",
    fontFamily: "'DM Sans', sans-serif",
  },
  redirect: {
    fontSize: 13,
    color: "#bbb",
  },
};
