import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { api } from "./api";
import { useAuth } from "./App";

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [form,    setForm]    = useState({ email:"", password:"" });
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");
  const [showPwd, setShowPwd] = useState(false);

  const handle = async (e) => {
    e.preventDefault(); setError("");
    if (!form.email || !form.password) { setError("Please fill all fields"); return; }
    setLoading(true);
    try {
      const resp = await api.login(form);
      login({ name:resp.name||resp.email, email:resp.email, userId:resp.userId||resp.id, role:resp.role }, resp.accessToken||resp.token);
      navigate("/");
    } catch(e) { setError(e.message||"Invalid email or password"); }
    finally { setLoading(false); }
  };

  const inputStyle = { width:"100%", border:"1.5px solid #E8E8E8", borderRadius:12, padding:"13px 16px", fontFamily:"'DM Sans',sans-serif", fontSize:15, outline:"none", boxSizing:"border-box", transition:"all 0.2s", background:"#FAFAFA" };
  const labelStyle = { fontFamily:"'Syne',sans-serif", fontWeight:700, fontSize:12, color:"#555", letterSpacing:0.5, display:"block", marginBottom:7 };

  return (
    <div style={{minHeight:"100vh",display:"flex",background:"#FAFAF8"}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500&display=swap');
        @keyframes fadeUp{from{opacity:0;transform:translateY(24px)}to{opacity:1;transform:translateY(0)}}
        input:focus{border-color:#E23744!important;outline:none;}
      `}</style>

      {/* Left */}
      <div style={{flex:1,background:"linear-gradient(135deg,#E23744 0%,#FF6B35 100%)",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:48,position:"relative",overflow:"hidden"}}>
        <div style={{position:"absolute",inset:0,opacity:0.07,backgroundImage:"radial-gradient(circle,#fff 1px,transparent 1px)",backgroundSize:"28px 28px"}} />
        <div style={{position:"relative",zIndex:1,textAlign:"center"}}>
          <div style={{fontSize:80,marginBottom:24}}>🍳</div>
          <h2 style={{fontFamily:"'Syne',sans-serif",fontWeight:800,fontSize:32,color:"#fff",marginBottom:12,lineHeight:1.2}}>Cook Like a Pro</h2>
          <p style={{fontFamily:"'DM Sans',sans-serif",color:"rgba(255,255,255,0.8)",fontSize:16,lineHeight:1.6,maxWidth:300}}>30+ fresh recipe kits delivered in 30 minutes.</p>
          <div style={{display:"flex",justifyContent:"center",gap:28,marginTop:40}}>
            {[{n:"30+",l:"Recipes"},{n:"4.8★",l:"Rating"},{n:"30m",l:"Delivery"}].map(({n,l})=>(
              <div key={l} style={{textAlign:"center"}}>
                <div style={{fontFamily:"'Syne',sans-serif",fontWeight:800,fontSize:22,color:"#fff"}}>{n}</div>
                <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:12,color:"rgba(255,255,255,0.7)"}}>{l}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right */}
      <div style={{width:"clamp(360px,40%,520px)",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"48px 40px",background:"#fff"}}>
        <div style={{width:"100%",maxWidth:380,animation:"fadeUp 0.5s ease"}}>
          <Link to="/" style={{textDecoration:"none",display:"flex",alignItems:"center",gap:10,marginBottom:36}}>
            <div style={{width:38,height:38,background:"linear-gradient(135deg,#E23744,#FF6B35)",borderRadius:10,display:"flex",alignItems:"center",justifyContent:"center",fontSize:20}}>🍽</div>
            <span style={{fontFamily:"'Syne',sans-serif",fontWeight:800,fontSize:22,color:"#1A1A1A"}}>RasoiKit</span>
          </Link>
          <h1 style={{fontFamily:"'Syne',sans-serif",fontWeight:800,fontSize:28,color:"#1A1A1A",marginBottom:6}}>Welcome back</h1>
          <p style={{fontFamily:"'DM Sans',sans-serif",color:"#999",fontSize:14,marginBottom:28}}>Sign in to continue cooking</p>

          {error&&<div style={{background:"#FFF0F0",border:"1px solid #FFCDD2",borderRadius:10,padding:"12px 16px",marginBottom:20,display:"flex",alignItems:"center",gap:8}}><span>⚠️</span><p style={{fontFamily:"'DM Sans',sans-serif",fontSize:13,color:"#E23744",margin:0}}>{error}</p></div>}

          <form onSubmit={handle}>
            <div style={{marginBottom:18}}>
              <label style={labelStyle}>EMAIL</label>
              <input type="email" value={form.email} onChange={e=>setForm(f=>({...f,email:e.target.value}))} placeholder="you@example.com" style={inputStyle} />
            </div>
            <div style={{marginBottom:24,position:"relative"}}>
              <label style={labelStyle}>PASSWORD</label>
              <input type={showPwd?"text":"password"} value={form.password} onChange={e=>setForm(f=>({...f,password:e.target.value}))} placeholder="Your password" style={{...inputStyle,paddingRight:46}} />
              <button type="button" onClick={()=>setShowPwd(s=>!s)} style={{position:"absolute",right:14,top:38,background:"none",border:"none",cursor:"pointer",fontSize:18,color:"#ccc"}}>{showPwd?"🙈":"👁"}</button>
            </div>
            <button type="submit" disabled={loading} style={{width:"100%",background:loading?"#ccc":"linear-gradient(135deg,#E23744,#FF6B35)",border:"none",borderRadius:12,padding:"15px",color:"#fff",fontFamily:"'Syne',sans-serif",fontWeight:800,fontSize:16,cursor:loading?"not-allowed":"pointer",boxShadow:loading?"none":"0 8px 24px rgba(226,55,68,0.35)",transition:"all 0.3s"}}>
              {loading?"Signing in...":"Sign In →"}
            </button>
          </form>

          <p style={{fontFamily:"'DM Sans',sans-serif",textAlign:"center",fontSize:14,color:"#999",marginTop:24}}>
            Don't have an account?{" "}<Link to="/register" style={{color:"#E23744",fontWeight:600,textDecoration:"none"}}>Create one →</Link>
          </p>
          <div style={{marginTop:28,background:"#F8F8F8",borderRadius:12,padding:"14px 16px",borderLeft:"3px solid #E23744"}}>
            <p style={{fontFamily:"'Syne',sans-serif",fontWeight:700,fontSize:11,color:"#E23744",letterSpacing:0.5,marginBottom:6}}>DEMO CREDENTIALS</p>
            <p style={{fontFamily:"'DM Sans',sans-serif",fontSize:12,color:"#777",lineHeight:1.7}}>
              Email: <strong>admin@recipe.com</strong><br/>Password: <strong>Admin@123</strong>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
