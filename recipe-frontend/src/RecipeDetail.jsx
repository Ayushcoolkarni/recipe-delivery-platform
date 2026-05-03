import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "./api";

const FOOD_IMAGES = {
  "Butter Chicken":      "https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=800&q=85",
  "Biryani":             "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=800&q=85",
  "Paneer Tikka Masala": "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=800&q=85",
  "Dal Makhani":         "https://images.unsplash.com/photo-1546833998-877b37c2e5c6?w=800&q=85",
  "Pasta Arrabiata":     "https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=800&q=85",
  "Masala Dosa":         "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=800&q=85",
  "Grilled Salmon":      "https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=800&q=85",
  "Pad Thai":            "https://images.unsplash.com/photo-1559314809-0d155014e29e?w=800&q=85",
  "Chicken Curry":       "https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=800&q=85",
  "default":             "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&q=85",
};
const getImg = n => FOOD_IMAGES[n]||FOOD_IMAGES["default"];

export default function RecipeDetail() {
  const { id }   = useParams();
  const navigate = useNavigate();
  const [recipe,  setRecipe]   = useState(null);
  const [loading, setLoading]  = useState(true);
  const [servings,setServings] = useState(4);
  const [scaled,  setScaled]   = useState(null);
  const [added,   setAdded]    = useState(false);
  const [toast,   setToast]    = useState(null);
  const [tab,     setTab]      = useState("ingredients");

  const showToast = (msg,type="success")=>{ setToast({msg,type}); setTimeout(()=>setToast(null),2500); };

  useEffect(()=>{
    api.getRecipe(id)
      .then(d=>{ setRecipe(d); setServings(d.servings||4); })
      .catch(()=>showToast("Failed to load recipe","error"))
      .finally(()=>setLoading(false));
  },[id]);

  useEffect(()=>{
    if(!recipe||servings===recipe.servings){ setScaled(null); return; }
    api.getScaledRecipe(id,servings).then(setScaled).catch(()=>setScaled(null));
  },[servings,recipe]);

  const addToCart = ()=>{
    const items = JSON.parse(localStorage.getItem("rce_cart")||"[]");
    const ex    = items.find(i=>i.id===recipe.id);
    const next  = ex ? items.map(i=>i.id===recipe.id?{...i,qty:i.qty+1}:i) : [...items,{...recipe,qty:1}];
    localStorage.setItem("rce_cart",JSON.stringify(next));
    window.dispatchEvent(new Event("cartUpdated"));
    setAdded(true); showToast(`${recipe.name} added to cart 🛒`);
    setTimeout(()=>setAdded(false),1800);
  };

  const display   = scaled||recipe;
  const diff      = recipe?.difficulty||"EASY";
  const diffColor = {EASY:"#1DB954",MEDIUM:"#FF9500",HARD:"#E23744"}[diff]||"#aaa";
  const time      = (recipe?.prepTimeMinutes||0)+(recipe?.cookTimeMinutes||30);

  if(loading) return (
    <div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:"#FAFAF8"}}>
      <div style={{textAlign:"center"}}>
        <div style={{fontSize:56,marginBottom:16}}>🍳</div>
        <p style={{fontFamily:"'DM Sans',sans-serif",color:"#999"}}>Loading recipe...</p>
      </div>
    </div>
  );

  if(!recipe) return (
    <div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center"}}>
      <div style={{textAlign:"center"}}>
        <div style={{fontSize:56,marginBottom:12}}>😕</div>
        <h2 style={{fontFamily:"'Syne',sans-serif",fontWeight:700,marginBottom:16}}>Recipe not found</h2>
        <button onClick={()=>navigate("/recipes")} style={{background:"#E23744",border:"none",borderRadius:10,padding:"10px 24px",color:"#fff",fontFamily:"'Syne',sans-serif",fontWeight:700,cursor:"pointer"}}>Back to Recipes</button>
      </div>
    </div>
  );

  return (
    <div style={{minHeight:"100vh",background:"#FAFAF8"}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500&display=swap');
        @keyframes slideIn{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
      `}</style>

      {toast&&<div style={{position:"fixed",bottom:24,right:24,zIndex:9999,background:toast.type==="error"?"#E23744":"#1DB954",color:"#fff",padding:"12px 22px",borderRadius:12,fontFamily:"'Syne',sans-serif",fontWeight:600,fontSize:14,boxShadow:"0 8px 32px rgba(0,0,0,0.2)",animation:"slideIn 0.3s ease"}}>{toast.msg}</div>}

      {/* Hero */}
      <div style={{position:"relative",height:"clamp(260px,42vw,500px)",overflow:"hidden",background:"#111"}}>
        <img src={getImg(recipe.name)} alt={recipe.name} style={{width:"100%",height:"100%",objectFit:"cover",opacity:0.9}} onError={e=>{e.target.src=FOOD_IMAGES["default"];}} />
        <div style={{position:"absolute",inset:0,background:"linear-gradient(to top,rgba(0,0,0,0.8) 0%,rgba(0,0,0,0.2) 55%,transparent 100%)"}} />
        <button onClick={()=>navigate("/recipes")} style={{position:"absolute",top:20,left:20,background:"rgba(255,255,255,0.15)",backdropFilter:"blur(12px)",border:"1px solid rgba(255,255,255,0.25)",borderRadius:10,padding:"8px 16px",cursor:"pointer",color:"#fff",fontFamily:"'DM Sans',sans-serif",fontWeight:500,fontSize:14}}>← Back</button>
        <div style={{position:"absolute",bottom:0,left:0,right:0,padding:"0 28px 28px"}}>
          <div style={{maxWidth:860,margin:"0 auto"}}>
            <div style={{display:"flex",gap:8,marginBottom:10,flexWrap:"wrap"}}>
              {[{label:diff,color:diffColor},{label:recipe.cuisine||"Indian",color:"#4A90E2"}].map(({label,color})=>(
                <span key={label} style={{background:color+"22",border:`1px solid ${color}44`,borderRadius:20,padding:"3px 12px",fontSize:11,fontWeight:700,color,fontFamily:"'Syne',sans-serif"}}>{label}</span>
              ))}
            </div>
            <h1 style={{fontFamily:"'Syne',sans-serif",fontWeight:800,fontSize:"clamp(26px,5vw,52px)",color:"#fff",lineHeight:1.1,marginBottom:8}}>{recipe.name}</h1>
            <p style={{fontFamily:"'DM Sans',sans-serif",color:"rgba(255,255,255,0.75)",fontSize:14,maxWidth:520}}>{recipe.description||`Authentic ${recipe.name} prepared with fresh, pre-measured ingredients.`}</p>
          </div>
        </div>
      </div>

      <div style={{maxWidth:860,margin:"0 auto",padding:"0 24px 64px"}}>
        {/* Stats strip */}
        <div style={{background:"#fff",borderRadius:16,padding:"18px 24px",margin:"20px 0",display:"flex",gap:0,boxShadow:"0 4px 20px rgba(0,0,0,0.06)",flexWrap:"wrap"}}>
          {[
            {icon:"⏱",label:"Prep",   val:`${recipe.prepTimeMinutes||15}m`},
            {icon:"🍳",label:"Cook",   val:`${recipe.cookTimeMinutes||30}m`},
            {icon:"⚡",label:"Total",  val:`${time}m`},
            {icon:"👥",label:"Serves", val:recipe.servings||4},
            {icon:"📊",label:"Level",  val:diff},
          ].map(({icon,label,val},i,arr)=>(
            <div key={label} style={{flex:1,textAlign:"center",minWidth:72,borderRight:i<arr.length-1?"1px solid #F0F0F0":"none",padding:"0 12px"}}>
              <div style={{fontSize:20,marginBottom:4}}>{icon}</div>
              <div style={{fontFamily:"'Syne',sans-serif",fontWeight:800,fontSize:15,color:"#1A1A1A"}}>{val}</div>
              <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:11,color:"#aaa",marginTop:2}}>{label}</div>
            </div>
          ))}
        </div>

        {/* Price + CTA */}
        <div style={{background:"linear-gradient(135deg,#1A1A1A,#2C2C2C)",borderRadius:16,padding:"20px 24px",marginBottom:24,display:"flex",alignItems:"center",justifyContent:"space-between",gap:16,flexWrap:"wrap"}}>
          <div>
            <p style={{fontFamily:"'DM Sans',sans-serif",color:"#666",fontSize:12,marginBottom:4}}>Complete ingredient kit</p>
            <span style={{fontFamily:"'Syne',sans-serif",fontWeight:800,fontSize:36,color:"#fff"}}>₹{recipe.price||299}</span>
            <span style={{fontFamily:"'DM Sans',sans-serif",color:"#555",fontSize:14,marginLeft:8}}>/kit</span>
            <p style={{fontFamily:"'DM Sans',sans-serif",color:"#1DB954",fontSize:12,marginTop:6}}>✓ Free delivery · ✓ 30-min dispatch · ✓ Fresh daily</p>
          </div>
          <button onClick={addToCart} style={{
            background:added?"#1DB954":"linear-gradient(135deg,#E23744,#FF6B35)",
            border:"none",borderRadius:14,padding:"14px 32px",cursor:"pointer",
            color:"#fff",fontFamily:"'Syne',sans-serif",fontWeight:800,fontSize:16,
            transform:added?"scale(0.96)":"scale(1)",transition:"all 0.25s",
            boxShadow:added?"0 8px 24px rgba(29,185,84,0.35)":"0 8px 24px rgba(226,55,68,0.35)",
            whiteSpace:"nowrap",
          }}>{added?"✓ Added to Cart!":"🛒 Add to Cart"}</button>
        </div>

        {/* Servings scaler */}
        <div style={{background:"#fff",borderRadius:14,padding:"16px 22px",marginBottom:20,boxShadow:"0 2px 10px rgba(0,0,0,0.05)",display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:12}}>
          <div>
            <h3 style={{fontFamily:"'Syne',sans-serif",fontWeight:700,fontSize:15,color:"#1A1A1A"}}>Scale Servings</h3>
            {scaled&&<p style={{fontFamily:"'DM Sans',sans-serif",fontSize:12,color:"#4A90E2",marginTop:2}}>Ingredients auto-adjusted ✓</p>}
          </div>
          <div style={{display:"flex",alignItems:"center",gap:14}}>
            <button onClick={()=>setServings(s=>Math.max(1,s-1))} style={{width:34,height:34,borderRadius:"50%",border:"2px solid #E0E0E0",background:"#fff",cursor:"pointer",fontSize:18,fontWeight:700}}>−</button>
            <span style={{fontFamily:"'Syne',sans-serif",fontWeight:800,fontSize:22,minWidth:28,textAlign:"center"}}>{servings}</span>
            <button onClick={()=>setServings(s=>Math.min(20,s+1))} style={{width:34,height:34,borderRadius:"50%",border:"2px solid #E23744",background:"#fff",cursor:"pointer",fontSize:18,fontWeight:700,color:"#E23744"}}>+</button>
            <span style={{fontFamily:"'DM Sans',sans-serif",color:"#999",fontSize:14}}>servings</span>
          </div>
        </div>

        {/* Tabs */}
        <div style={{display:"flex",gap:4,background:"#fff",borderRadius:12,padding:4,marginBottom:20,boxShadow:"0 2px 10px rgba(0,0,0,0.05)"}}>
          {["ingredients","steps","nutrition"].map(t=>(
            <button key={t} onClick={()=>setTab(t)} style={{flex:1,border:"none",borderRadius:9,padding:"10px 0",background:tab===t?"#1A1A1A":"transparent",color:tab===t?"#fff":"#888",fontFamily:"'Syne',sans-serif",fontWeight:700,fontSize:13,cursor:"pointer",transition:"all 0.2s",textTransform:"capitalize"}}>{t}</button>
          ))}
        </div>

        {/* Ingredients tab */}
        {tab==="ingredients"&&(
          <div style={{background:"#fff",borderRadius:16,overflow:"hidden",boxShadow:"0 2px 12px rgba(0,0,0,0.05)"}}>
            {display?.ingredients?.length>0 ? display.ingredients.map((ing,i)=>(
              <div key={i} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"14px 22px",borderBottom:i<display.ingredients.length-1?"1px solid #F8F8F8":"none"}}
                onMouseEnter={e=>e.currentTarget.style.background="#FAFAF8"}
                onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                <div style={{display:"flex",alignItems:"center",gap:12}}>
                  <div style={{width:8,height:8,borderRadius:"50%",background:"#E23744",flexShrink:0}} />
                  <span style={{fontFamily:"'DM Sans',sans-serif",fontSize:15,color:"#1A1A1A"}}>{ing.ingredientName||ing.name||`Ingredient ${i+1}`}</span>
                </div>
                <span style={{fontFamily:"'Syne',sans-serif",fontWeight:700,fontSize:14,color:"#555"}}>{ing.quantity} {ing.unit}</span>
              </div>
            )) : (
              <div style={{padding:"40px 24px",textAlign:"center",color:"#bbb"}}>
                <div style={{fontSize:36,marginBottom:8}}>🧄</div>
                <p style={{fontFamily:"'DM Sans',sans-serif"}}>Ingredient details in your kit card</p>
              </div>
            )}
          </div>
        )}

        {/* Steps tab */}
        {tab==="steps"&&(
          <div style={{display:"flex",flexDirection:"column",gap:14}}>
            {[
              "Gather all ingredients. Ensure everything is at room temperature.",
              "Wash and prep vegetables. Measure spices into small prep bowls.",
              "Follow the step-by-step recipe card included in your RasoiKit box.",
              "Plate beautifully, garnish with fresh coriander, and serve hot.",
            ].map((step,i)=>(
              <div key={i} style={{background:"#fff",borderRadius:14,padding:"16px 20px",boxShadow:"0 2px 10px rgba(0,0,0,0.05)",display:"flex",gap:14,alignItems:"flex-start"}}>
                <div style={{width:32,height:32,borderRadius:"50%",background:"linear-gradient(135deg,#E23744,#FF6B35)",display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontFamily:"'Syne',sans-serif",fontWeight:800,fontSize:13,flexShrink:0}}>{i+1}</div>
                <p style={{fontFamily:"'DM Sans',sans-serif",fontSize:15,color:"#333",lineHeight:1.65,paddingTop:4}}>{step}</p>
              </div>
            ))}
          </div>
        )}

        {/* Nutrition tab */}
        {tab==="nutrition"&&(
          <div style={{background:"#fff",borderRadius:16,padding:"24px",boxShadow:"0 2px 12px rgba(0,0,0,0.05)"}}>
            <p style={{fontFamily:"'DM Sans',sans-serif",color:"#999",fontSize:13,marginBottom:20}}>Per serving · approximate values</p>
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(130px,1fr))",gap:14}}>
              {[
                {label:"Calories",val:"420 kcal",color:"#E23744"},
                {label:"Protein", val:"28g",     color:"#4A90E2"},
                {label:"Carbs",   val:"38g",     color:"#FF9500"},
                {label:"Fat",     val:"14g",     color:"#1DB954"},
                {label:"Fibre",   val:"6g",      color:"#9B59B6"},
                {label:"Sodium",  val:"480mg",   color:"#E67E22"},
              ].map(({label,val,color})=>(
                <div key={label} style={{background:color+"12",border:`1px solid ${color}22`,borderRadius:12,padding:"14px",textAlign:"center"}}>
                  <div style={{fontFamily:"'Syne',sans-serif",fontWeight:800,fontSize:18,color}}>{val}</div>
                  <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:12,color:"#888",marginTop:4}}>{label}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
