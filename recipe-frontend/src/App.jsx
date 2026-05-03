import React, { useState, useEffect, createContext, useContext } from "react";
import { Routes, Route, Navigate, useNavigate, Link, useLocation } from "react-router-dom";

import Home from "./Home";
import Recipes from "./Recipes";
import RecipeDetail from "./RecipeDetail";
import Cart from "./Cart";
import Orders from "./Orders";
import Login from "./Login";
import Register from "./Register";

// ─── Contexts ─────────────────────────────────────────────────────────────────
const AuthCtx  = createContext(null);
const CartCtx  = createContext(null);
const ToastCtx = createContext(null);

export const useAuth  = () => useContext(AuthCtx);
export const useCart  = () => useContext(CartCtx);
export const useToast = () => useContext(ToastCtx);

// ─── Toast Provider ───────────────────────────────────────────────────────────
function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const toast = (msg, type = "success") => {
    const id = Date.now();
    setToasts(p => [...p, { id, msg, type }]);
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 3000);
  };

  return (
    <ToastCtx.Provider value={toast}>
      {children}
      <div style={{ position: "fixed", bottom: 24, right: 24, zIndex: 9999, display: "flex", flexDirection: "column", gap: 8 }}>
        {toasts.map(t => (
          <div key={t.id} style={{
            background: t.type === "error" ? "#FF3B30" : t.type === "info" ? "#2C2C2C" : "#1DB954",
            color: "#fff", padding: "12px 20px", borderRadius: 12,
            fontFamily: "'Syne', sans-serif", fontWeight: 600, fontSize: 14,
            boxShadow: "0 8px 32px rgba(0,0,0,0.25)",
            animation: "slideIn 0.3s ease",
            maxWidth: 320,
          }}>
            {t.msg}
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}

// ─── Auth Provider ────────────────────────────────────────────────────────────
function AuthProvider({ children }) {
  const [user,  setUser]  = useState(() => { try { return JSON.parse(localStorage.getItem("rce_u")); } catch { return null; }});
  const [token, setToken] = useState(() => localStorage.getItem("rce_t"));

  const login = (u, t) => {
    setUser(u); setToken(t);
    localStorage.setItem("rce_u", JSON.stringify(u));
    localStorage.setItem("rce_t", t);
  };
  const logout = () => {
    setUser(null); setToken(null);
    localStorage.removeItem("rce_u"); localStorage.removeItem("rce_t");
  };

  return <AuthCtx.Provider value={{ user, token, login, logout }}>{children}</AuthCtx.Provider>;
}

// ─── Cart Provider ────────────────────────────────────────────────────────────
function CartProvider({ children }) {
  const [items, setItems] = useState(() => { try { return JSON.parse(localStorage.getItem("rce_cart")) || []; } catch { return []; }});

  useEffect(() => { localStorage.setItem("rce_cart", JSON.stringify(items)); }, [items]);

  const add = (r) => setItems(p => {
    const ex = p.find(i => i.id === r.id);
    return ex ? p.map(i => i.id === r.id ? { ...i, qty: i.qty + 1 } : i) : [...p, { ...r, qty: 1 }];
  });
  const remove    = (id) => setItems(p => p.filter(i => i.id !== id));
  const updateQty = (id, qty) => qty < 1 ? remove(id) : setItems(p => p.map(i => i.id === id ? { ...i, qty } : i));
  const clear     = () => setItems([]);
  const total     = items.reduce((s, i) => s + i.price * i.qty, 0);
  const count     = items.reduce((s, i) => s + i.qty, 0);

  return <CartCtx.Provider value={{ items, add, remove, updateQty, clear, total, count }}>{children}</CartCtx.Provider>;
}

// ─── Protected Route ──────────────────────────────────────────────────────────
function Protected({ children }) {
  const { user } = useAuth();
  return user ? children : <Navigate to="/login" />;
}

// ─── Navbar ───────────────────────────────────────────────────────────────────
function Navbar() {
  const navigate    = useNavigate();
  const location    = useLocation();
  const { user, logout } = useAuth();
  const { count }   = useCart();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handler);
    return () => window.removeEventListener("scroll", handler);
  }, []);

  const isHome = location.pathname === "/";

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'DM Sans', sans-serif; background: #FAFAF8; color: #1A1A1A; }
        @keyframes slideIn { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }
        @keyframes fadeUp  { from { opacity:0; transform:translateY(30px); } to { opacity:1; transform:translateY(0); } }
        @keyframes pulse   { 0%,100% { transform:scale(1); } 50% { transform:scale(1.08); } }
        ::-webkit-scrollbar { width: 6px; } ::-webkit-scrollbar-track { background:#f1f1f1; }
        ::-webkit-scrollbar-thumb { background: #E23744; border-radius:3px; }
      `}</style>

      <nav style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 1000,
        background: scrolled || !isHome ? "rgba(255,255,255,0.97)" : "transparent",
        backdropFilter: scrolled ? "blur(16px)" : "none",
        boxShadow: scrolled ? "0 2px 20px rgba(0,0,0,0.08)" : "none",
        transition: "all 0.3s ease",
        borderBottom: scrolled ? "1px solid rgba(0,0,0,0.06)" : "none",
      }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 24px", height: 64, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          {/* Logo */}
          <Link to="/" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{
              width: 36, height: 36, background: "linear-gradient(135deg, #E23744, #FF6B35)",
              borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "0 4px 12px rgba(226,55,68,0.35)",
            }}>
              <span style={{ fontSize: 18 }}>🍽</span>
            </div>
            <span style={{
              fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 22,
              color: scrolled || !isHome ? "#1A1A1A" : "#fff",
              letterSpacing: "-0.5px",
            }}>
              RasoiKit
            </span>
          </Link>

          {/* Desktop links */}
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            {[
              { to: "/recipes", label: "Explore" },
              ...(user ? [{ to: "/orders", label: "Orders" }] : []),
            ].map(({ to, label }) => (
              <Link key={to} to={to} style={{
                textDecoration: "none", padding: "8px 16px", borderRadius: 8,
                fontFamily: "'DM Sans', sans-serif", fontWeight: 500, fontSize: 14,
                color: scrolled || !isHome ? "#555" : "rgba(255,255,255,0.85)",
                transition: "all 0.2s",
                background: location.pathname === to ? (scrolled || !isHome ? "#FFF0F1" : "rgba(255,255,255,0.15)") : "transparent",
              }}>{label}</Link>
            ))}

            {/* Cart */}
            <button onClick={() => navigate("/cart")} style={{
              position: "relative", background: "none", border: "none",
              cursor: "pointer", padding: "8px 12px", borderRadius: 8,
              color: scrolled || !isHome ? "#1A1A1A" : "#fff",
              fontSize: 20, transition: "all 0.2s",
            }}>
              🛒
              {count > 0 && (
                <span style={{
                  position: "absolute", top: 2, right: 2,
                  background: "#E23744", color: "#fff",
                  borderRadius: "50%", width: 18, height: 18,
                  fontSize: 10, fontWeight: 700,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontFamily: "'Syne', sans-serif",
                  animation: "pulse 1.5s infinite",
                }}>
                  {count > 9 ? "9+" : count}
                </span>
              )}
            </button>

            {/* Auth */}
            {user ? (
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{
                  width: 34, height: 34, borderRadius: "50%",
                  background: "linear-gradient(135deg, #E23744, #FF6B35)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  color: "#fff", fontWeight: 700, fontSize: 13,
                  fontFamily: "'Syne', sans-serif",
                }}>
                  {(user.name || user.email || "U").charAt(0).toUpperCase()}
                </div>
                <button onClick={() => { logout(); navigate("/"); }} style={{
                  background: "none", border: "1px solid rgba(226,55,68,0.3)",
                  borderRadius: 8, padding: "7px 14px", cursor: "pointer",
                  color: "#E23744", fontSize: 13, fontWeight: 500,
                  fontFamily: "'DM Sans', sans-serif", transition: "all 0.2s",
                }}>
                  Logout
                </button>
              </div>
            ) : (
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={() => navigate("/login")} style={{
                  background: "none", border: `1px solid ${scrolled || !isHome ? "rgba(0,0,0,0.15)" : "rgba(255,255,255,0.4)"}`,
                  borderRadius: 8, padding: "7px 16px", cursor: "pointer",
                  color: scrolled || !isHome ? "#1A1A1A" : "#fff",
                  fontSize: 13, fontWeight: 500, fontFamily: "'DM Sans', sans-serif",
                  transition: "all 0.2s",
                }}>Login</button>
                <button onClick={() => navigate("/register")} style={{
                  background: "linear-gradient(135deg, #E23744, #FF6B35)",
                  border: "none", borderRadius: 8, padding: "7px 16px", cursor: "pointer",
                  color: "#fff", fontSize: 13, fontWeight: 600,
                  fontFamily: "'Syne', sans-serif", boxShadow: "0 4px 12px rgba(226,55,68,0.3)",
                  transition: "all 0.2s",
                }}>Sign up</button>
              </div>
            )}
          </div>
        </div>
      </nav>
    </>
  );
}

// ─── App ──────────────────────────────────────────────────────────────────────
export default function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <ToastProvider>
          <Navbar />
          <div style={{ paddingTop: 64 }}>
            <Routes>
              <Route path="/"          element={<Home />} />
              <Route path="/recipes"   element={<Recipes />} />
              <Route path="/recipe/:id" element={<RecipeDetail />} />
              <Route path="/login"     element={<Login />} />
              <Route path="/register"  element={<Register />} />
              <Route path="/cart"      element={<Protected><Cart /></Protected>} />
              <Route path="/orders"    element={<Protected><Orders /></Protected>} />
              <Route path="*"          element={<Navigate to="/" />} />
            </Routes>
          </div>
        </ToastProvider>
      </CartProvider>
    </AuthProvider>
  );
}
