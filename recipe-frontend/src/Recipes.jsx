import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { api } from "./api";

const FOOD_IMAGES = {
  "Butter Chicken":      "https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=500&q=80",
  "Biryani":             "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=500&q=80",
  "Paneer Tikka Masala": "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=500&q=80",
  "Dal Makhani":         "https://images.unsplash.com/photo-1546833998-877b37c2e5c6?w=500&q=80",
  "Pasta Arrabiata":     "https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=500&q=80",
  "Masala Dosa":         "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=500&q=80",
  "Grilled Salmon":      "https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=500&q=80",
  "Pad Thai":            "https://images.unsplash.com/photo-1559314809-0d155014e29e?w=500&q=80",
  "Chicken Curry":       "https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=500&q=80",
  "Fish Curry":          "https://images.unsplash.com/photo-1612929633738-8fe44f7ec841?w=500&q=80",
  "Palak Paneer":        "https://images.unsplash.com/photo-1645177628172-a459f74a424c?w=500&q=80",
  "Chole Bhature":       "https://images.unsplash.com/photo-1626132647523-66b6e1f0b35b?w=500&q=80",
  "Egg Bhurji":          "https://images.unsplash.com/photo-1510693206972-df098062cb71?w=500&q=80",
  "Aloo Gobi":           "https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=500&q=80",
  "Rajma":               "https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=500&q=80",
  "Pav Bhaji":           "https://images.unsplash.com/photo-1606491956689-2ea866880c84?w=500&q=80",
  "Mushroom Risotto":    "https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?w=500&q=80",
  "Caesar Salad":        "https://images.unsplash.com/photo-1546793665-c74683f339c1?w=500&q=80",
  "Chicken Fried Rice":  "https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=500&q=80",
  "Hakka Noodles":       "https://images.unsplash.com/photo-1569050467447-ce54b3bbc37d?w=500&q=80",
  "Tom Yum Soup":        "https://images.unsplash.com/photo-1548943487-a2e4e43b4853?w=500&q=80",
  "Mango Lassi":         "https://images.unsplash.com/photo-1553361371-9b22f78e8b1d?w=500&q=80",
  "Kheer":               "https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=500&q=80",
  "Gulab Jamun":         "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=500&q=80",
  "default":             "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&q=80",
};

const CUISINES  = ["All","Indian","South Indian","Chinese","Italian","Continental","Thai","Middle Eastern"];
const DIFFS     = ["All","EASY","MEDIUM","HARD"];
const SORTS     = [
  { label:"Popular",     val:"popular"    },
  { label:"Price ↑",    val:"price_asc"  },
  { label:"Price ↓",    val:"price_desc" },
  { label:"Quickest",   val:"time_asc"   },
];

function getImg(name) { return FOOD_IMAGES[name] || FOOD_IMAGES["default"]; }

function Skeleton() {
  return (
    <div style={{ borderRadius:16, overflow:"hidden", background:"#fff", boxShadow:"0 2px 12px rgba(0,0,0,0.05)" }}>
      <div style={{ height:200, background:"linear-gradient(90deg,#f0f0f0 25%,#f8f8f8 50%,#f0f0f0 75%)", backgroundSize:"200% 100%", animation:"shimmer 1.5s infinite" }} />
      <div style={{ padding:16 }}>
        {[80,55,100].map(w=>(
          <div key={w} style={{ height:12, width:`${w}%`, background:"#f0f0f0", borderRadius:6, marginBottom:10, animation:"shimmer 1.5s infinite" }} />
        ))}
      </div>
    </div>
  );
}

function RCard({ recipe, onAdd }) {
  const navigate  = useNavigate();
  const [hov, setHov]   = useState(false);
  const [done,setDone]  = useState(false);
  const diff      = recipe.difficulty || "EASY";
  const diffColor = { EASY:"#1DB954", MEDIUM:"#FF9500", HARD:"#E23744" }[diff]||"#aaa";
  const time      = (recipe.prepTimeMinutes||0)+(recipe.cookTimeMinutes||30);
  const rating    = (4.1+Math.random()*0.8).toFixed(1);

  const add = (e)=>{ e.stopPropagation(); onAdd(recipe); setDone(true); setTimeout(()=>setDone(false),1800); };

  return (
    <div onClick={()=>navigate(`/recipe/${recipe.id}`)} onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}
      style={{ background:"#fff", borderRadius:16, overflow:"hidden", cursor:"pointer",
        boxShadow: hov?"0 20px 48px rgba(0,0,0,0.13)":"0 4px 16px rgba(0,0,0,0.06)",
        transform: hov?"translateY(-6px)":"none",
        transition:"all 0.3s cubic-bezier(0.34,1.56,0.64,1)" }}>
      <div style={{ position:"relative", height:200, overflow:"hidden" }}>
        <img src={getImg(recipe.name)} alt={recipe.name}
          style={{ width:"100%", height:"100%", objectFit:"cover",
            transform:hov?"scale(1.07)":"scale(1)", transition:"transform 0.4s ease" }}
          onError={e=>{ e.target.src=FOOD_IMAGES["default"]; }} />
        <div style={{ position:"absolute", inset:0, background:"linear-gradient(to top,rgba(0,0,0,0.5) 0%,transparent 55%)" }} />
        <div style={{ position:"absolute", top:12, left:12, display:"flex", gap:6 }}>
          <span style={{ background:diffColor+"22", border:`1px solid ${diffColor}55`, backdropFilter:"blur(8px)", borderRadius:20, padding:"3px 10px", color:diffColor, fontSize:10, fontWeight:700, fontFamily:"'Syne',sans-serif" }}>{diff}</span>
          {recipe.cuisine && <span style={{ background:"rgba(255,255,255,0.2)", backdropFilter:"blur(8px)", borderRadius:20, padding:"3px 10px", color:"#fff", fontSize:10, fontFamily:"'DM Sans',sans-serif" }}>{recipe.cuisine}</span>}
        </div>
        <div style={{ position:"absolute", top:12, right:12, background:"rgba(0,0,0,0.55)", backdropFilter:"blur(8px)", borderRadius:20, padding:"4px 10px", color:"#fff", fontSize:11, fontWeight:600, fontFamily:"'Syne',sans-serif" }}>⏱ {time}m</div>
        <div style={{ position:"absolute", bottom:10, left:12, background:"rgba(0,0,0,0.6)", backdropFilter:"blur(8px)", borderRadius:20, padding:"3px 10px", color:"#FFD700", fontSize:12, fontWeight:700, fontFamily:"'Syne',sans-serif" }}>★ {rating}</div>
      </div>
      <div style={{ padding:"14px 16px 16px" }}>
        <h3 style={{ fontFamily:"'Syne',sans-serif", fontWeight:700, fontSize:16, color:"#1A1A1A", marginBottom:4, lineHeight:1.3, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{recipe.name}</h3>
        <p style={{ fontFamily:"'DM Sans',sans-serif", fontSize:12, color:"#999", marginBottom:14 }}>Serves {recipe.servings||4} · {recipe.prepTimeMinutes||15}m prep</p>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
          <div>
            <span style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:20, color:"#1A1A1A" }}>₹{recipe.price||299}</span>
            <span style={{ fontSize:11, color:"#aaa", marginLeft:4 }}>/kit</span>
          </div>
          <button onClick={add} style={{
            background: done?"#1DB954":"linear-gradient(135deg,#E23744,#FF6B35)",
            border:"none", borderRadius:10, padding:"8px 18px", color:"#fff",
            fontFamily:"'Syne',sans-serif", fontWeight:700, fontSize:13, cursor:"pointer",
            transform:done?"scale(0.95)":"scale(1)", transition:"all 0.25s",
            boxShadow:done?"0 4px 12px rgba(29,185,84,0.3)":"0 4px 12px rgba(226,55,68,0.25)" }}>
            {done?"✓ Added":"+ Add"}
          </button>
        </div>
      </div>
    </div>
  );
}

function FBtn({ active, onClick, label }) {
  return (
    <button onClick={onClick} style={{
      background:active?"#E23744":"#fff", color:active?"#fff":"#555",
      border:`1px solid ${active?"#E23744":"#E0E0E0"}`,
      borderRadius:20, padding:"6px 16px",
      fontFamily:"'DM Sans',sans-serif", fontWeight:active?600:400,
      fontSize:13, cursor:"pointer", transition:"all 0.2s", whiteSpace:"nowrap" }}>
      {label}
    </button>
  );
}

export default function Recipes() {
  const navigate      = useNavigate();
  const [params]      = useSearchParams();
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search,  setSearch]  = useState(params.get("q")||"");
  const [cuisine, setCuisine] = useState("All");
  const [diff,    setDiff]    = useState("All");
  const [sort,    setSort]    = useState("popular");
  const [toast,   setToast]   = useState(null);

  const showToast = (msg) => { setToast(msg); setTimeout(()=>setToast(null),2500); };

  const load = (q) => {
    setLoading(true);
    (q ? api.searchRecipes(q) : api.getRecipes())
      .then(d => setRecipes(Array.isArray(d)?d:d?.content||[]))
      .catch(()=>setRecipes([]))
      .finally(()=>setLoading(false));
  };

  useEffect(()=>{ load(params.get("q")||""); }, []);

  const handleSearch = (e) => { e.preventDefault(); load(search.trim()); };

  const addToCart = (recipe) => {
    const items = JSON.parse(localStorage.getItem("rce_cart")||"[]");
    const ex    = items.find(i=>i.id===recipe.id);
    const next  = ex ? items.map(i=>i.id===recipe.id?{...i,qty:i.qty+1}:i) : [...items,{...recipe,qty:1}];
    localStorage.setItem("rce_cart", JSON.stringify(next));
    window.dispatchEvent(new Event("cartUpdated"));
    showToast(`${recipe.name} added to cart 🛒`);
  };

  let display = [...recipes];
  if (cuisine!=="All") display=display.filter(r=>r.cuisine===cuisine);
  if (diff!=="All")    display=display.filter(r=>r.difficulty===diff);
  if (sort==="price_asc")  display.sort((a,b)=>(a.price||0)-(b.price||0));
  if (sort==="price_desc") display.sort((a,b)=>(b.price||0)-(a.price||0));
  if (sort==="time_asc")   display.sort((a,b)=>((a.prepTimeMinutes||0)+(a.cookTimeMinutes||0))-((b.prepTimeMinutes||0)+(b.cookTimeMinutes||0)));

  return (
    <div style={{ minHeight:"100vh", background:"#FAFAF8" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500&display=swap');
        @keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
        @keyframes slideIn{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
      `}</style>

      {toast&&<div style={{ position:"fixed",bottom:24,right:24,zIndex:9999,background:"#1DB954",color:"#fff",padding:"12px 22px",borderRadius:12,fontFamily:"'Syne',sans-serif",fontWeight:600,fontSize:14,boxShadow:"0 8px 32px rgba(0,0,0,0.2)",animation:"slideIn 0.3s ease" }}>{toast}</div>}

      {/* Header */}
      <div style={{ background:"linear-gradient(135deg,#1A1A1A 0%,#2D2D2D 100%)", padding:"48px 24px 36px" }}>
        <div style={{ maxWidth:1200, margin:"0 auto" }}>
          <p style={{ fontFamily:"'Syne',sans-serif", fontWeight:600, fontSize:11, color:"#E23744", letterSpacing:3, textTransform:"uppercase", marginBottom:12 }}>✦ Fresh Kits</p>
          <h1 style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:"clamp(28px,5vw,48px)", color:"#fff", marginBottom:6 }}>All Recipes</h1>
          <p style={{ fontFamily:"'DM Sans',sans-serif", color:"#777", fontSize:15, marginBottom:28 }}>
            {loading?"Loading...": `${display.length} kits available`}
          </p>
          <form onSubmit={handleSearch}>
            <div style={{ display:"flex", background:"rgba(255,255,255,0.08)", border:"1px solid rgba(255,255,255,0.12)", borderRadius:12, overflow:"hidden", maxWidth:520 }}>
              <span style={{ padding:"0 14px", display:"flex", alignItems:"center", fontSize:18 }}>🔍</span>
              <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search recipes, cuisines..."
                style={{ flex:1, border:"none", outline:"none", padding:"13px 0", background:"transparent", fontFamily:"'DM Sans',sans-serif", fontSize:14, color:"#fff" }} />
              <button type="submit" style={{ background:"#E23744", border:"none", padding:"0 22px", cursor:"pointer", color:"#fff", fontFamily:"'Syne',sans-serif", fontWeight:700, fontSize:13 }}>Search</button>
            </div>
          </form>
        </div>
      </div>

      {/* Filters */}
      <div style={{ background:"#fff", borderBottom:"1px solid #F0F0F0", position:"sticky", top:64, zIndex:100 }}>
        <div style={{ maxWidth:1200, margin:"0 auto", padding:"14px 24px" }}>
          <div style={{ display:"flex", gap:8, overflowX:"auto", paddingBottom:10, scrollbarWidth:"none", marginBottom:8 }}>
            <span style={{ fontFamily:"'Syne',sans-serif", fontWeight:700, fontSize:11, color:"#bbb", letterSpacing:1, display:"flex", alignItems:"center", paddingRight:4, whiteSpace:"nowrap" }}>CUISINE</span>
            {CUISINES.map(c=><FBtn key={c} active={cuisine===c} onClick={()=>setCuisine(c)} label={c} />)}
          </div>
          <div style={{ display:"flex", gap:8, overflowX:"auto", scrollbarWidth:"none", alignItems:"center" }}>
            <span style={{ fontFamily:"'Syne',sans-serif", fontWeight:700, fontSize:11, color:"#bbb", letterSpacing:1, display:"flex", alignItems:"center", paddingRight:4, whiteSpace:"nowrap" }}>LEVEL</span>
            {DIFFS.map(d=><FBtn key={d} active={diff===d} onClick={()=>setDiff(d)} label={d} />)}
            <div style={{ flex:1 }} />
            <select value={sort} onChange={e=>setSort(e.target.value)}
              style={{ border:"1px solid #E0E0E0", borderRadius:20, padding:"6px 14px", fontFamily:"'DM Sans',sans-serif", fontSize:13, color:"#555", background:"#fff", cursor:"pointer", outline:"none" }}>
              {SORTS.map(s=><option key={s.val} value={s.val}>{s.label}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Grid */}
      <div style={{ maxWidth:1200, margin:"0 auto", padding:"32px 24px 64px" }}>
        {loading ? (
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(260px,1fr))", gap:24 }}>
            {[...Array(8)].map((_,i)=><Skeleton key={i} />)}
          </div>
        ) : display.length===0 ? (
          <div style={{ textAlign:"center", padding:"80px 0" }}>
            <div style={{ fontSize:56, marginBottom:16 }}>🍽</div>
            <h3 style={{ fontFamily:"'Syne',sans-serif", fontWeight:700, fontSize:20, color:"#1A1A1A", marginBottom:8 }}>No recipes found</h3>
            <p style={{ fontFamily:"'DM Sans',sans-serif", color:"#999", marginBottom:24 }}>Try a different search or clear filters</p>
            <button onClick={()=>{setCuisine("All");setDiff("All");setSearch("");load("");}}
              style={{ background:"#E23744", border:"none", borderRadius:10, padding:"10px 24px", color:"#fff", fontFamily:"'Syne',sans-serif", fontWeight:700, cursor:"pointer" }}>
              Clear Filters
            </button>
          </div>
        ) : (
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(260px,1fr))", gap:24 }}>
            {display.map((r,i)=>(
              <div key={r.id} style={{ animation:`fadeUp 0.4s ease ${i*0.04}s both` }}>
                <RCard recipe={r} onAdd={addToCart} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
