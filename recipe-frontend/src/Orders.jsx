import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "./api";

const STATUS_FLOW = ["PENDING","CONFIRMED","PREPARING","OUT_FOR_DELIVERY","DELIVERED"];
const STATUS_META = {
  PENDING:          { icon:"🕐", label:"Order Placed",      color:"#FF9500", desc:"Your order is being reviewed" },
  CONFIRMED:        { icon:"✅", label:"Confirmed",          color:"#4A90E2", desc:"Kitchen accepted your order" },
  PREPARING:        { icon:"👨‍🍳", label:"Preparing",         color:"#9B59B6", desc:"Your kit is being packed fresh" },
  OUT_FOR_DELIVERY: { icon:"🛵", label:"Out for Delivery",  color:"#E23744", desc:"On the way to you!" },
  DELIVERED:        { icon:"🎉", label:"Delivered",          color:"#1DB954", desc:"Enjoy your meal!" },
  CANCELLED:        { icon:"❌", label:"Cancelled",          color:"#999",    desc:"Order was cancelled" },
};

function OrderCard({ order, onSelect, selected }) {
  const status  = STATUS_META[order.status] || STATUS_META["PENDING"];
  const stepIdx = STATUS_FLOW.indexOf(order.status);
  const items   = order.items || order.orderItems || [];
  const total   = order.totalAmount || order.total || 0;
  const date    = order.createdAt ? new Date(order.createdAt).toLocaleDateString("en-IN",{day:"numeric",month:"short",year:"numeric"}) : "—";

  return (
    <div onClick={()=>onSelect(order)} style={{
      background:"#fff",borderRadius:16,overflow:"hidden",cursor:"pointer",
      boxShadow:selected?"0 0 0 2px #E23744,0 8px 32px rgba(226,55,68,0.1)":"0 4px 16px rgba(0,0,0,0.06)",
      transition:"all 0.25s",
    }}
    onMouseEnter={e=>{ if(!selected)e.currentTarget.style.boxShadow="0 8px 28px rgba(0,0,0,0.1)"; }}
    onMouseLeave={e=>{ if(!selected)e.currentTarget.style.boxShadow="0 4px 16px rgba(0,0,0,0.06)"; }}>
      <div style={{background:`linear-gradient(135deg,${status.color}18,${status.color}06)`,borderBottom:`1px solid ${status.color}22`,padding:"14px 20px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <span style={{fontSize:22}}>{status.icon}</span>
          <div>
            <p style={{fontFamily:"'Syne',sans-serif",fontWeight:700,fontSize:14,color:status.color}}>{status.label}</p>
            <p style={{fontFamily:"'DM Sans',sans-serif",fontSize:11,color:"#999"}}>{status.desc}</p>
          </div>
        </div>
        <div style={{textAlign:"right"}}>
          <p style={{fontFamily:"'Syne',sans-serif",fontWeight:700,fontSize:11,color:"#bbb",letterSpacing:0.5}}>ORDER</p>
          <p style={{fontFamily:"'Syne',sans-serif",fontWeight:800,fontSize:13,color:"#1A1A1A"}}>#{order.id}</p>
        </div>
      </div>
      <div style={{padding:"16px 20px"}}>
        {items.slice(0,2).map((item,i)=>(
          <div key={i} style={{display:"flex",justifyContent:"space-between",marginBottom:6}}>
            <span style={{fontFamily:"'DM Sans',sans-serif",fontSize:14,color:"#555"}}>{item.recipeName||item.productName||item.name||`Item ${i+1}`} × {item.quantity||1}</span>
            <span style={{fontFamily:"'Syne',sans-serif",fontWeight:700,fontSize:13,color:"#1A1A1A"}}>₹{((item.price||0)*(item.quantity||1)).toFixed(0)}</span>
          </div>
        ))}
        {items.length>2&&<p style={{fontFamily:"'DM Sans',sans-serif",fontSize:12,color:"#bbb",marginTop:4}}>+{items.length-2} more items</p>}
        {order.status!=="CANCELLED"&&(
          <div style={{marginTop:14}}>
            <div style={{display:"flex",gap:3}}>
              {STATUS_FLOW.map((_,i)=>(
                <div key={i} style={{flex:1,height:4,borderRadius:2,background:i<=stepIdx?status.color:"#F0F0F0",transition:"background 0.4s"}} />
              ))}
            </div>
            <div style={{display:"flex",justifyContent:"space-between",marginTop:6}}>
              <span style={{fontFamily:"'DM Sans',sans-serif",fontSize:10,color:"#ccc"}}>Placed</span>
              <span style={{fontFamily:"'DM Sans',sans-serif",fontSize:10,color:"#ccc"}}>Delivered</span>
            </div>
          </div>
        )}
        <div style={{borderTop:"1px solid #F8F8F8",marginTop:14,paddingTop:12,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <span style={{fontFamily:"'DM Sans',sans-serif",fontSize:12,color:"#bbb"}}>{date}</span>
          <span style={{fontFamily:"'Syne',sans-serif",fontWeight:800,fontSize:16,color:"#1A1A1A"}}>₹{Number(total).toFixed(0)}</span>
        </div>
      </div>
    </div>
  );
}

function Detail({ order, onClose }) {
  const status  = STATUS_META[order.status] || STATUS_META["PENDING"];
  const stepIdx = STATUS_FLOW.indexOf(order.status);
  const items   = order.items || order.orderItems || [];
  const total   = order.totalAmount || order.total || 0;

  return (
    <div style={{background:"#fff",borderRadius:16,overflow:"hidden",boxShadow:"0 4px 24px rgba(0,0,0,0.08)",position:"sticky",top:88}}>
      <div style={{background:`linear-gradient(135deg,${status.color},${status.color}bb)`,padding:"20px 24px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <div>
          <p style={{fontFamily:"'Syne',sans-serif",fontWeight:700,fontSize:11,color:"rgba(255,255,255,0.7)",letterSpacing:1,textTransform:"uppercase",marginBottom:2}}>Order Details</p>
          <p style={{fontFamily:"'Syne',sans-serif",fontWeight:800,fontSize:18,color:"#fff"}}>#{order.id}</p>
        </div>
        <button onClick={onClose} style={{background:"rgba(255,255,255,0.2)",border:"none",borderRadius:8,width:32,height:32,cursor:"pointer",color:"#fff",fontSize:16}}>✕</button>
      </div>
      <div style={{padding:"20px 24px"}}>
        <h3 style={{fontFamily:"'Syne',sans-serif",fontWeight:700,fontSize:14,color:"#1A1A1A",marginBottom:16}}>Live Tracking</h3>
        <div style={{marginBottom:24}}>
          {STATUS_FLOW.map((s,i)=>{
            const m    = STATUS_META[s];
            const done = i<=stepIdx&&order.status!=="CANCELLED";
            return (
              <div key={s} style={{display:"flex",gap:14,alignItems:"flex-start"}}>
                <div style={{display:"flex",flexDirection:"column",alignItems:"center"}}>
                  <div style={{width:32,height:32,borderRadius:"50%",background:done?m.color:"#F0F0F0",display:"flex",alignItems:"center",justifyContent:"center",fontSize:done?14:12,flexShrink:0,transition:"all 0.3s",color:done?"#fff":"#ccc"}}>
                    {done?m.icon:"○"}
                  </div>
                  {i<STATUS_FLOW.length-1&&<div style={{width:2,height:24,background:done?"#E8E8E8":"#F5F5F5",margin:"3px 0"}} />}
                </div>
                <div style={{paddingTop:4,paddingBottom:12}}>
                  <p style={{fontFamily:"'Syne',sans-serif",fontWeight:700,fontSize:13,color:done?"#1A1A1A":"#ccc"}}>{m.label}</p>
                  <p style={{fontFamily:"'DM Sans',sans-serif",fontSize:11,color:done?"#999":"#ddd"}}>{m.desc}</p>
                </div>
              </div>
            );
          })}
        </div>

        <h3 style={{fontFamily:"'Syne',sans-serif",fontWeight:700,fontSize:14,color:"#1A1A1A",marginBottom:10}}>Items</h3>
        <div style={{display:"flex",flexDirection:"column",gap:8,marginBottom:20}}>
          {items.length>0 ? items.map((item,i)=>(
            <div key={i} style={{display:"flex",justifyContent:"space-between",padding:"10px 14px",background:"#FAFAF8",borderRadius:10}}>
              <span style={{fontFamily:"'DM Sans',sans-serif",fontSize:13,color:"#555"}}>{item.recipeName||item.productName||item.name||`Item ${i+1}`} × {item.quantity||1}</span>
              <span style={{fontFamily:"'Syne',sans-serif",fontWeight:700,fontSize:13,color:"#1A1A1A"}}>₹{((item.price||0)*(item.quantity||1)).toFixed(0)}</span>
            </div>
          )) : <p style={{fontFamily:"'DM Sans',sans-serif",fontSize:13,color:"#bbb",padding:"10px 0"}}>Item details in your kit box</p>}
        </div>

        <div style={{borderTop:"2px solid #F0F0F0",paddingTop:16,display:"flex",justifyContent:"space-between"}}>
          <span style={{fontFamily:"'Syne',sans-serif",fontWeight:700,fontSize:15,color:"#1A1A1A"}}>Total Paid</span>
          <span style={{fontFamily:"'Syne',sans-serif",fontWeight:800,fontSize:18,color:"#E23744"}}>₹{Number(total).toFixed(0)}</span>
        </div>

        {order.deliveryAddress&&(
          <div style={{marginTop:16,background:"#F8F8F8",borderRadius:12,padding:"12px 16px"}}>
            <p style={{fontFamily:"'Syne',sans-serif",fontWeight:700,fontSize:11,color:"#aaa",letterSpacing:0.5,marginBottom:4}}>📍 DELIVERY ADDRESS</p>
            <p style={{fontFamily:"'DM Sans',sans-serif",fontSize:13,color:"#555",lineHeight:1.5}}>
              {[order.deliveryAddress.street,order.deliveryAddress.city,order.deliveryAddress.state,order.deliveryAddress.pincode].filter(Boolean).join(", ")}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function Orders() {
  const navigate = useNavigate();
  const [orders,  setOrders]  = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected,setSelected]= useState(null);
  const [filter,  setFilter]  = useState("All");
  const [toast,   setToast]   = useState(null);

  useEffect(()=>{
    const token = localStorage.getItem("rce_t");
    if(!token){ navigate("/login"); return; }
    api.getMyOrders(token)
      .then(d=>{ const arr=Array.isArray(d)?d:d?.content||[]; setOrders(arr); if(arr[0])setSelected(arr[0]); })
      .catch(()=>setToast({msg:"Could not load orders",type:"error"}))
      .finally(()=>setLoading(false));
  },[]);

  const FILTER_OPTS = ["All","PENDING","PREPARING","OUT_FOR_DELIVERY","DELIVERED","CANCELLED"];
  const display = filter==="All"?orders:orders.filter(o=>o.status===filter);

  return (
    <div style={{minHeight:"100vh",background:"#FAFAF8"}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500&display=swap');
        @keyframes fadeUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
        @keyframes slideIn{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
        @keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}
      `}</style>

      {toast&&<div style={{position:"fixed",bottom:24,right:24,zIndex:9999,background:toast.type==="error"?"#E23744":"#1DB954",color:"#fff",padding:"12px 22px",borderRadius:12,fontFamily:"'Syne',sans-serif",fontWeight:600,fontSize:14,boxShadow:"0 8px 32px rgba(0,0,0,0.2)",animation:"slideIn 0.3s ease"}}>{toast.msg}</div>}

      <div style={{background:"linear-gradient(135deg,#1A1A1A,#2D2D2D)",padding:"40px 24px 30px"}}>
        <div style={{maxWidth:1100,margin:"0 auto"}}>
          <p style={{fontFamily:"'Syne',sans-serif",fontWeight:600,fontSize:11,color:"#E23744",letterSpacing:3,textTransform:"uppercase",marginBottom:8}}>✦ My Account</p>
          <h1 style={{fontFamily:"'Syne',sans-serif",fontWeight:800,fontSize:"clamp(26px,4vw,42px)",color:"#fff",marginBottom:4}}>Your Orders</h1>
          <p style={{fontFamily:"'DM Sans',sans-serif",color:"#666",fontSize:14}}>{orders.length} total orders</p>
        </div>
      </div>

      <div style={{background:"#fff",borderBottom:"1px solid #F0F0F0"}}>
        <div style={{maxWidth:1100,margin:"0 auto",padding:"0 24px",display:"flex",overflowX:"auto",scrollbarWidth:"none"}}>
          {FILTER_OPTS.map(f=>(
            <button key={f} onClick={()=>setFilter(f)} style={{padding:"14px 16px",border:"none",background:"none",cursor:"pointer",fontFamily:"'DM Sans',sans-serif",fontWeight:filter===f?700:400,fontSize:13,color:filter===f?"#E23744":"#888",whiteSpace:"nowrap",borderBottom:filter===f?"2px solid #E23744":"2px solid transparent",transition:"all 0.2s"}}>
              {f==="All"?"📋 All Orders":`${STATUS_META[f]?.icon||""} ${STATUS_META[f]?.label||f}`}
            </button>
          ))}
        </div>
      </div>

      <div style={{maxWidth:1100,margin:"0 auto",padding:"24px 24px 64px",display:"grid",gridTemplateColumns:"1fr min(420px,100%)",gap:24,alignItems:"start"}}>
        <div>
          {loading ? (
            <div style={{display:"flex",flexDirection:"column",gap:16}}>
              {[...Array(3)].map((_,i)=>(<div key={i} style={{height:180,borderRadius:16,background:"linear-gradient(90deg,#f0f0f0 25%,#f8f8f8 50%,#f0f0f0 75%)",backgroundSize:"200% 100%",animation:"shimmer 1.5s infinite"}} />))}
            </div>
          ) : display.length===0 ? (
            <div style={{textAlign:"center",padding:"60px 0",background:"#fff",borderRadius:16,boxShadow:"0 2px 12px rgba(0,0,0,0.05)"}}>
              <div style={{fontSize:56,marginBottom:12}}>📋</div>
              <h3 style={{fontFamily:"'Syne',sans-serif",fontWeight:700,fontSize:20,color:"#1A1A1A",marginBottom:8}}>No orders yet</h3>
              <p style={{fontFamily:"'DM Sans',sans-serif",color:"#999",marginBottom:24}}>Time to order your first recipe kit!</p>
              <button onClick={()=>navigate("/recipes")} style={{background:"linear-gradient(135deg,#E23744,#FF6B35)",border:"none",borderRadius:12,padding:"12px 28px",color:"#fff",fontFamily:"'Syne',sans-serif",fontWeight:700,cursor:"pointer"}}>Browse Recipes</button>
            </div>
          ) : (
            <div style={{display:"flex",flexDirection:"column",gap:16}}>
              {display.map((o,i)=>(
                <div key={o.id} style={{animation:`fadeUp 0.4s ease ${i*0.06}s both`}}>
                  <OrderCard order={o} onSelect={setSelected} selected={selected?.id===o.id} />
                </div>
              ))}
            </div>
          )}
        </div>

        {selected ? <Detail order={selected} onClose={()=>setSelected(null)} /> : (
          <div style={{background:"#fff",borderRadius:16,padding:"40px 24px",textAlign:"center",boxShadow:"0 2px 12px rgba(0,0,0,0.05)",color:"#ccc"}}>
            <div style={{fontSize:40,marginBottom:12}}>👆</div>
            <p style={{fontFamily:"'DM Sans',sans-serif",fontSize:14}}>Select an order to view details</p>
          </div>
        )}
      </div>
    </div>
  );
}
