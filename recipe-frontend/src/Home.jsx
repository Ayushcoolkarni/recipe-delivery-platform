import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "./api";

const CATEGORIES = [
  { label: "North Indian",  emoji: "🍛",  query: "Indian",       bg: "#FFF3E0" },
  { label: "South Indian",  emoji: "🥘",  query: "South Indian", bg: "#E8F5E9" },
  { label: "Chinese",       emoji: "🍜",  query: "Chinese",      bg: "#FFF8E1" },
  { label: "Italian",       emoji: "🍝",  query: "Italian",      bg: "#FCE4EC" },
  { label: "Healthy",       emoji: "🥗",  query: "EASY",         bg: "#E3F2FD" },
  { label: "Desserts",      emoji: "🍮",  query: "sweet",        bg: "#F3E5F5" },
  { label: "Biryani",       emoji: "🍚",  query: "Biryani",      bg: "#FBE9E7" },
  { label: "Thai",          emoji: "🌶",  query: "Thai",         bg: "#E0F7FA" },
];

const BANNERS = [
  { title: "Cook Like a Pro",     sub: "Restaurant-quality kits at home",   bg: "linear-gradient(135deg,#E23744 0%,#FF6B35 100%)", img: "🍳" },
  { title: "Fresh Every Morning", sub: "Sourced daily from local farms",     bg: "linear-gradient(135deg,#11998e 0%,#38ef7d 100%)", img: "🥬" },
  { title: "Desi Tadka",          sub: "30+ authentic Indian recipes",       bg: "linear-gradient(135deg,#f7971e 0%,#ffd200 100%)", img: "🌶" },
];

const FOOD_IMAGES = {
  "Butter Chicken":       "https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=400&q=80",
  "Biryani":              "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=400&q=80",
  "Paneer Tikka Masala":  "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=400&q=80",
  "Dal Makhani":          "https://images.unsplash.com/photo-1546833998-877b37c2e5c6?w=400&q=80",
  "Pasta Arrabiata":      "https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=400&q=80",
  "Masala Dosa":          "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=400&q=80",
  "Grilled Salmon":       "https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=400&q=80",
  "Pad Thai":             "https://images.unsplash.com/photo-1559314809-0d155014e29e?w=400&q=80",
  "default":              "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&q=80",
};

function getImg(name) {
  return FOOD_IMAGES[name] || FOOD_IMAGES["default"];
}

function RecipeCard({ recipe, onClick }) {
  const [hovered, setHovered] = useState(false);
  const diff = recipe.difficulty || "EASY";
  const diffColor = { EASY: "#1DB954", MEDIUM: "#FF9500", HARD: "#E23744" }[diff] || "#999";

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: "#fff", borderRadius: 16, overflow: "hidden", cursor: "pointer",
        boxShadow: hovered ? "0 16px 40px rgba(0,0,0,0.15)" : "0 4px 16px rgba(0,0,0,0.06)",
        transform: hovered ? "translateY(-6px)" : "translateY(0)",
        transition: "all 0.3s cubic-bezier(0.34,1.56,0.64,1)",
        flex: "0 0 240px",
      }}
    >
      <div style={{ position: "relative", height: 160, overflow: "hidden" }}>
        <img
          src={getImg(recipe.name)}
          alt={recipe.name}
          style={{ width: "100%", height: "100%", objectFit: "cover",
            transform: hovered ? "scale(1.08)" : "scale(1)", transition: "transform 0.4s ease" }}
          onError={e => { e.target.src = FOOD_IMAGES["default"]; }}
        />
        <div style={{
          position: "absolute", top: 10, right: 10,
          background: "rgba(0,0,0,0.55)", backdropFilter: "blur(8px)",
          borderRadius: 20, padding: "4px 10px",
          color: "#fff", fontSize: 11, fontWeight: 600,
          fontFamily: "'Syne', sans-serif", letterSpacing: 0.5,
        }}>
          {recipe.prepTimeMinutes + recipe.cookTimeMinutes || 30} MIN
        </div>
        <div style={{
          position: "absolute", top: 10, left: 10,
          background: diffColor + "22", border: `1px solid ${diffColor}44`,
          borderRadius: 20, padding: "3px 10px",
          color: diffColor, fontSize: 10, fontWeight: 700,
          fontFamily: "'Syne', sans-serif", letterSpacing: 0.5,
        }}>
          {diff}
        </div>
      </div>
      <div style={{ padding: "14px 16px 16px" }}>
        <h3 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 15, color: "#1A1A1A", marginBottom: 4, lineHeight: 1.3 }}>
          {recipe.name}
        </h3>
        <p style={{ fontSize: 12, color: "#888", fontFamily: "'DM Sans', sans-serif", marginBottom: 10, lineHeight: 1.4 }}>
          {recipe.cuisine || "Indian"} • Serves {recipe.servings || 4}
        </p>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 17, color: "#E23744" }}>
            ₹{recipe.price || 299}
          </span>
          <div style={{
            background: "linear-gradient(135deg,#E23744,#FF6B35)",
            borderRadius: 20, padding: "5px 14px",
            color: "#fff", fontSize: 12, fontWeight: 600,
            fontFamily: "'Syne', sans-serif",
          }}>
            Order Kit →
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  const navigate = useNavigate();
  const [recipes, setRecipes] = useState([]);
  const [search, setSearch] = useState("");
  const [bannerIdx, setBannerIdx] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getRecipes().then(data => {
      setRecipes(Array.isArray(data) ? data : data?.content || []);
    }).catch(() => setRecipes([])).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const t = setInterval(() => setBannerIdx(p => (p + 1) % BANNERS.length), 4000);
    return () => clearInterval(t);
  }, []);

  const banner = BANNERS[bannerIdx];

  const handleSearch = (e) => {
    e.preventDefault();
    if (search.trim()) navigate(`/recipes?q=${encodeURIComponent(search)}`);
    else navigate("/recipes");
  };

  const featured = recipes.slice(0, 8);

  return (
    <div style={{ minHeight: "100vh", background: "#FAFAF8" }}>

      {/* ── Hero ───────────────────────────────────────────────────── */}
      <div style={{
        minHeight: "88vh", position: "relative", overflow: "hidden",
        background: banner.bg, transition: "background 0.8s ease",
        display: "flex", alignItems: "center",
      }}>
        {/* Background pattern */}
        <div style={{
          position: "absolute", inset: 0, opacity: 0.06,
          backgroundImage: "radial-gradient(circle, #fff 1px, transparent 1px)",
          backgroundSize: "32px 32px",
        }} />

        {/* Big emoji decoration */}
        <div style={{
          position: "absolute", right: "8%", top: "50%", transform: "translateY(-50%)",
          fontSize: "clamp(120px,20vw,220px)", opacity: 0.15,
          animation: "pulse 3s ease-in-out infinite",
          userSelect: "none",
        }}>
          {banner.img}
        </div>

        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "80px 24px 60px", position: "relative", zIndex: 1 }}>
          {/* Badge */}
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            background: "rgba(255,255,255,0.25)", backdropFilter: "blur(8px)",
            border: "1px solid rgba(255,255,255,0.4)", borderRadius: 20,
            padding: "6px 16px", marginBottom: 24,
            fontFamily: "'Syne', sans-serif", fontWeight: 600, fontSize: 12,
            color: "#fff", letterSpacing: 1, textTransform: "uppercase",
          }}>
            ✦ Fresh Ingredient Kits
          </div>

          <h1 style={{
            fontFamily: "'Syne', sans-serif", fontWeight: 800,
            fontSize: "clamp(42px,7vw,84px)", lineHeight: 1.05,
            color: "#fff", marginBottom: 16,
            textShadow: "0 4px 32px rgba(0,0,0,0.15)",
            maxWidth: 700,
            animation: "fadeUp 0.6s ease",
          }}>
            {banner.title}
          </h1>

          <p style={{
            fontFamily: "'DM Sans', sans-serif", fontWeight: 400,
            fontSize: "clamp(16px,2.5vw,22px)", color: "rgba(255,255,255,0.85)",
            marginBottom: 40, maxWidth: 480,
            animation: "fadeUp 0.6s ease 0.1s both",
          }}>
            {banner.sub} — delivered to your door in 30 minutes.
          </p>

          {/* Search bar */}
          <form onSubmit={handleSearch} style={{ animation: "fadeUp 0.6s ease 0.2s both" }}>
            <div style={{
              display: "flex", gap: 0,
              background: "rgba(255,255,255,0.97)",
              borderRadius: 16, overflow: "hidden",
              boxShadow: "0 16px 48px rgba(0,0,0,0.2)",
              maxWidth: 560,
            }}>
              <span style={{ padding: "0 16px", display: "flex", alignItems: "center", fontSize: 20 }}>🔍</span>
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search butter chicken, biryani, pasta..."
                style={{
                  flex: 1, border: "none", outline: "none", padding: "16px 0",
                  fontFamily: "'DM Sans', sans-serif", fontSize: 15, color: "#1A1A1A",
                  background: "transparent",
                }}
              />
              <button type="submit" style={{
                background: "linear-gradient(135deg,#E23744,#FF6B35)",
                border: "none", padding: "0 28px", cursor: "pointer",
                color: "#fff", fontFamily: "'Syne', sans-serif",
                fontWeight: 700, fontSize: 14, letterSpacing: 0.5,
                transition: "opacity 0.2s",
              }}>
                Search
              </button>
            </div>
          </form>

          {/* Stats row */}
          <div style={{ display: "flex", gap: 32, marginTop: 48, animation: "fadeUp 0.6s ease 0.3s both" }}>
            {[
              { n: "30+", label: "Recipes" },
              { n: "15 min", label: "Avg Prep" },
              { n: "4.8★", label: "Rating" },
              { n: "10k+", label: "Orders" },
            ].map(({ n, label }) => (
              <div key={label}>
                <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 24, color: "#fff" }}>{n}</div>
                <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: "rgba(255,255,255,0.7)", marginTop: 2 }}>{label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Banner dots */}
        <div style={{ position: "absolute", bottom: 28, left: "50%", transform: "translateX(-50%)", display: "flex", gap: 8 }}>
          {BANNERS.map((_, i) => (
            <button key={i} onClick={() => setBannerIdx(i)} style={{
              width: i === bannerIdx ? 24 : 8, height: 8, borderRadius: 4,
              background: i === bannerIdx ? "#fff" : "rgba(255,255,255,0.4)",
              border: "none", cursor: "pointer", transition: "all 0.3s ease", padding: 0,
            }} />
          ))}
        </div>
      </div>

      {/* ── Categories ────────────────────────────────────────────── */}
      <div style={{ background: "#fff", borderBottom: "1px solid #F0F0F0" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "32px 24px" }}>
          <div style={{ display: "flex", gap: 12, overflowX: "auto", paddingBottom: 4, scrollbarWidth: "none" }}>
            {CATEGORIES.map(cat => (
              <button
                key={cat.label}
                onClick={() => navigate(`/recipes?q=${cat.query}`)}
                style={{
                  flex: "0 0 auto", background: cat.bg, border: "none",
                  borderRadius: 12, padding: "14px 20px", cursor: "pointer",
                  display: "flex", flexDirection: "column", alignItems: "center", gap: 6,
                  minWidth: 90, transition: "all 0.2s",
                }}
                onMouseEnter={e => e.currentTarget.style.transform = "translateY(-3px)"}
                onMouseLeave={e => e.currentTarget.style.transform = "translateY(0)"}
              >
                <span style={{ fontSize: 28 }}>{cat.emoji}</span>
                <span style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 500, fontSize: 12, color: "#333", whiteSpace: "nowrap" }}>
                  {cat.label}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Featured Recipes ──────────────────────────────────────── */}
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "48px 24px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 28 }}>
          <div>
            <h2 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 28, color: "#1A1A1A" }}>
              🔥 Popular Right Now
            </h2>
            <p style={{ fontFamily: "'DM Sans', sans-serif", color: "#888", fontSize: 14, marginTop: 4 }}>
              Fresh kits, ordered most this week
            </p>
          </div>
          <button onClick={() => navigate("/recipes")} style={{
            background: "none", border: "2px solid #E23744", borderRadius: 10,
            padding: "8px 20px", cursor: "pointer", color: "#E23744",
            fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 13,
            transition: "all 0.2s",
          }}
          onMouseEnter={e => { e.currentTarget.style.background="#E23744"; e.currentTarget.style.color="#fff"; }}
          onMouseLeave={e => { e.currentTarget.style.background="none"; e.currentTarget.style.color="#E23744"; }}>
            View All →
          </button>
        </div>

        {loading ? (
          <div style={{ display: "flex", gap: 16, overflow: "hidden" }}>
            {[...Array(4)].map((_, i) => (
              <div key={i} style={{ flex: "0 0 240px", height: 280, borderRadius: 16, background: "linear-gradient(90deg,#f0f0f0 25%,#f8f8f8 50%,#f0f0f0 75%)", backgroundSize: "200% 100%", animation: "shimmer 1.5s infinite" }} />
            ))}
          </div>
        ) : featured.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 0", color: "#999" }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🍽</div>
            <p style={{ fontFamily: "'DM Sans', sans-serif" }}>No recipes yet. Run seed_data.py to populate!</p>
          </div>
        ) : (
          <div style={{ display: "flex", gap: 20, overflowX: "auto", paddingBottom: 16, scrollbarWidth: "none" }}>
            {featured.map(r => (
              <RecipeCard key={r.id} recipe={r} onClick={() => navigate(`/recipe/${r.id}`)} />
            ))}
          </div>
        )}
      </div>

      {/* ── How It Works ──────────────────────────────────────────── */}
      <div style={{ background: "#1A1A1A", padding: "72px 24px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <h2 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 32, color: "#fff", textAlign: "center", marginBottom: 8 }}>
            How RasoiKit Works
          </h2>
          <p style={{ textAlign: "center", color: "#888", fontFamily: "'DM Sans', sans-serif", marginBottom: 56, fontSize: 15 }}>
            Restaurant quality, home simplicity
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px,1fr))", gap: 32 }}>
            {[
              { step: "01", icon: "🛒", title: "Pick Your Recipe", desc: "Browse 30+ chef-designed kits from Indian, Asian, and Continental cuisines" },
              { step: "02", icon: "📦", title: "We Pack Fresh", desc: "Pre-measured ingredients sourced fresh daily, packed in eco boxes" },
              { step: "03", icon: "🚴", title: "30-Min Delivery", desc: "Your kit arrives in 30 minutes, straight from our cloud kitchen" },
              { step: "04", icon: "👨‍🍳", title: "Cook in Minutes", desc: "Follow the easy recipe card. Done in 20 mins. Restaurant taste guaranteed" },
            ].map(({ step, icon, title, desc }) => (
              <div key={step} style={{ textAlign: "center" }}>
                <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 11, color: "#E23744", letterSpacing: 2, marginBottom: 16 }}>STEP {step}</div>
                <div style={{ fontSize: 40, marginBottom: 16 }}>{icon}</div>
                <h3 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 17, color: "#fff", marginBottom: 10 }}>{title}</h3>
                <p style={{ fontFamily: "'DM Sans', sans-serif", color: "#666", fontSize: 13, lineHeight: 1.6 }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── CTA ───────────────────────────────────────────────────── */}
      <div style={{ padding: "72px 24px", textAlign: "center", background: "#FAFAF8" }}>
        <h2 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 36, color: "#1A1A1A", marginBottom: 16 }}>
          Ready to cook something amazing?
        </h2>
        <p style={{ fontFamily: "'DM Sans', sans-serif", color: "#888", fontSize: 16, marginBottom: 32 }}>
          Join 10,000+ home chefs already cooking with RasoiKit
        </p>
        <button onClick={() => navigate("/recipes")} style={{
          background: "linear-gradient(135deg,#E23744,#FF6B35)",
          border: "none", borderRadius: 14, padding: "16px 40px",
          color: "#fff", fontFamily: "'Syne', sans-serif", fontWeight: 800,
          fontSize: 16, cursor: "pointer",
          boxShadow: "0 12px 32px rgba(226,55,68,0.4)",
          transition: "all 0.3s",
        }}
        onMouseEnter={e => { e.currentTarget.style.transform="translateY(-3px)"; e.currentTarget.style.boxShadow="0 16px 40px rgba(226,55,68,0.5)"; }}
        onMouseLeave={e => { e.currentTarget.style.transform="translateY(0)"; e.currentTarget.style.boxShadow="0 12px 32px rgba(226,55,68,0.4)"; }}>
          Explore Recipes 🍽
        </button>
      </div>

      {/* ── Footer ────────────────────────────────────────────────── */}
      <footer style={{ background: "#111", padding: "32px 24px", textAlign: "center" }}>
        <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 20, color: "#fff", marginBottom: 8 }}>🍽 RasoiKit</div>
        <p style={{ fontFamily: "'DM Sans', sans-serif", color: "#555", fontSize: 13 }}>
          © 2026 RasoiKit · Fresh Ingredient Kits · Bengaluru, India
        </p>
      </footer>
    </div>
  );
}
