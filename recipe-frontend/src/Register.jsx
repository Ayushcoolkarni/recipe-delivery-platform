import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { api } from "./api";
import { useAuth } from "./App";

export default function Register() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [form,    setForm]    = useState({ name:"", email:"", password:"", phone:"" });
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");
  const [showPwd, setShowPwd] = useState(false);

  const handle = async (e) => {
    e.preventDefault(); setError("");
    if (!form.name||!form.email||!form.password) { setError("Please fill all required fields"); return; }
    if (form.password.length < 8) { setError("Password must be at least 8 characters"); return; }
    setLoading(true);
    try {
      await api.register(form);
      const resp = await api.login({ email:form.email, password:form.password });
      login({ name:resp.name||form.name, email:resp.email||form.email, userId:resp.userId||resp.id, role:resp.role }, resp.accessToken||resp.token);
      navigate("/");
    } catch(e) { setError(e.message||"Registration failed. Try again."); }
    finally { setLoading(false); }
  };

  const inputStyle = { width:"100%", border:"1.5px solid #E8E8E8", borderRadius:12, padding:"13px 16px", fontFamily:"'DM Sans',sans-serif", fontSize:15, outline:"none", boxSizing:"border-box", transition:"all 0.2s", background:"#FAFAFA" };
  const labelStyle = { fontFamily:"'Syne',sans-serif", fontWeight:700, fontSize:12, color:"#555", letterSpacing:0.5, display:"block", marginBottom:7 };

  const strength = form.password.length===0?0:form.password.length<6?1:form.password.length<10?2:3;
  const strengthColor = ["transparent","#E23744","#FF9500","#1DB954"][strength];
  const strengthLabel = ["","Weak","Good","Strong"][strength];

  return (
    <div style={{minHeight:"100vh",display:"flex",background:"#FAFAF8"}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500&display=swap');
        @keyframes fadeUp{from{opacity:0;transform:translateY(24px)}to{opacity:1;transform:translateY(0)}}
        input:focus{border-color:#E23744!important;}
      `}</style>

      {/* Left */}
      <div style={{flex:1,background:"linear-gradient(135deg,#1A1A1A 0%,#2D2D2D 100%)",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:48,position:"relative",overflow:"hidden"}}>
        <div style={{position:"absolute",inset:0,opacity:0.05,backgroundImage:"radial-gradient(circle,#fff 1px,transparent 1px)",backgroundSize:"28px 28px"}} />
        <div style={{position:"relative",zIndex:1,textAlign:"center"}}>
          <div style={{fontSize:80,marginBottom:24}}>👨‍🍳</div>
          <h2 style={{fontFamily:"'Syne',sans-serif",fontWeight:800,fontSize:32,color:"#fff",marginBottom:12,lineHeight:1.2}}>Join 10,000+ Chefs</h2>
          <p style={{fontFamily:"'DM Sans',sans-serif",color:"rgba(255,255,255,0.7)",fontSize:16,lineHeight:1.6,maxWidth:300}}>Get access to 30+ recipe kits, delivered fresh to your door in 30 minutes.</p>
          <div style={{display:"flex",flexDirection:"column",gap:14,marginTop:40,textAlign:"left"}}>
            {["✓ Pre-measured fresh ingredients","✓ Step-by-step recipe card included","✓ 30-minute guaranteed delivery","✓ Cancel anytime, no lock-in"].map(t=>(
              <p key={t} style={{fontFamily:"'DM Sans',sans-serif",fontSize:14,color:"rgba(255,255,255,0.8)"}}>{t}</p>
            ))}
          </div>
        </div>
      </div>

      {/* Right */}
      <div style={{width:"clamp(360px,42%,540px)",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"40px 40px",background:"#fff",overflowY:"auto"}}>
        <div style={{width:"100%",maxWidth:400,animation:"fadeUp 0.5s ease"}}>
          <Link to="/" style={{textDecoration:"none",display:"flex",alignItems:"center",gap:10,marginBottom:32}}>
            <div style={{width:38,height:38,background:"linear-gradient(135deg,#E23744,#FF6B35)",borderRadius:10,display:"flex",alignItems:"center",justifyContent:"center",fontSize:20}}>🍽</div>
            <span style={{fontFamily:"'Syne',sans-serif",fontWeight:800,fontSize:22,color:"#1A1A1A"}}>RasoiKit</span>
          </Link>
          <h1 style={{fontFamily:"'Syne',sans-serif",fontWeight:800,fontSize:26,color:"#1A1A1A",marginBottom:6}}>Create your account</h1>
          <p style={{fontFamily:"'DM Sans',sans-serif",color:"#999",fontSize:14,marginBottom:24}}>Start cooking restaurant quality food at home</p>

          {error&&<div style={{background:"#FFF0F0",border:"1px solid #FFCDD2",borderRadius:10,padding:"12px 16px",marginBottom:18,display:"flex",alignItems:"center",gap:8}}><span>⚠️</span><p style={{fontFamily:"'DM Sans',sans-serif",fontSize:13,color:"#E23744",margin:0}}>{error}</p></div>}

          <form onSubmit={handle}>
            <div style={{marginBottom:16}}>
              <label style={labelStyle}>FULL NAME *</label>
              <input value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} placeholder="Ayush Kumar" style={inputStyle} />
            </div>
            <div style={{marginBottom:16}}>
              <label style={labelStyle}>EMAIL *</label>
              <input type="email" value={form.email} onChange={e=>setForm(f=>({...f,email:e.target.value}))} placeholder="you@example.com" style={inputStyle} />
            </div>
            <div style={{marginBottom:16}}>
              <label style={labelStyle}>PHONE</label>
              <input type="tel" value={form.phone} onChange={e=>setForm(f=>({...f,phone:e.target.value}))} placeholder="9876543210" style={inputStyle} />
            </div>
            <div style={{marginBottom:24,position:"relative"}}>
              <label style={labelStyle}>PASSWORD *</label>
              <input type={showPwd?"text":"password"} value={form.password} onChange={e=>setForm(f=>({...f,password:e.target.value}))} placeholder="Min 8 characters" style={{...inputStyle,paddingRight:46}} />
              <button type="button" onClick={()=>setShowPwd(s=>!s)} style={{position:"absolute",right:14,top:38,background:"none",border:"none",cursor:"pointer",fontSize:18,color:"#ccc"}}>{showPwd?"🙈":"👁"}</button>
              {form.password.length>0&&(
                <div style={{marginTop:8}}>
                  <div style={{display:"flex",gap:4,marginBottom:4}}>
                    {[1,2,3].map(i=><div key={i} style={{flex:1,height:3,borderRadius:2,background:i<=strength?strengthColor:"#F0F0F0",transition:"background 0.3s"}} />)}
                  </div>
                  <p style={{fontFamily:"'DM Sans',sans-serif",fontSize:11,color:strengthColor}}>{strengthLabel}</p>
                </div>
              )}
            </div>
            <button type="submit" disabled={loading} style={{width:"100%",background:loading?"#ccc":"linear-gradient(135deg,#E23744,#FF6B35)",border:"none",borderRadius:12,padding:"15px",color:"#fff",fontFamily:"'Syne',sans-serif",fontWeight:800,fontSize:16,cursor:loading?"not-allowed":"pointer",boxShadow:loading?"none":"0 8px 24px rgba(226,55,68,0.35)",transition:"all 0.3s"}}>
              {loading?"Creating account...":"Create Account →"}
            </button>
          </form>

          <p style={{fontFamily:"'DM Sans',sans-serif",textAlign:"center",fontSize:14,color:"#999",marginTop:20}}>
            Already have an account?{" "}<Link to="/login" style={{color:"#E23744",fontWeight:600,textDecoration:"none"}}>Sign in →</Link>
          </p>
          <p style={{fontFamily:"'DM Sans',sans-serif",textAlign:"center",fontSize:11,color:"#ccc",marginTop:16,lineHeight:1.5}}>
            By signing up, you agree to our Terms of Service and Privacy Policy
          </p>
        </div>
      </div>
    </div>
  );
}
