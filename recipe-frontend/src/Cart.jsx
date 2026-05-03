import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "./api";

const FOOD_IMAGES = {
  "Butter Chicken":      "https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=200&q=70",
  "Biryani":             "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=200&q=70",
  "Paneer Tikka Masala": "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=200&q=70",
  "Dal Makhani":         "https://images.unsplash.com/photo-1546833998-877b37c2e5c6?w=200&q=70",
  "Pasta Arrabiata":     "https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=200&q=70",
  "Masala Dosa":         "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=200&q=70",
  "Grilled Salmon":      "https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=200&q=70",
  "default":             "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=200&q=70",
};
const getImg = n => FOOD_IMAGES[n] || FOOD_IMAGES["default"];

const DELIVERY_FEE  = 40;
const PLATFORM_FEE  = 10;
const FREE_DELIVERY = 499;

export default function Cart() {
  const navigate = useNavigate();
  const [items,    setItems]    = useState([]);
  const [user,     setUser]     = useState(null);
  const [token,    setToken]    = useState(null);
  const [step,     setStep]     = useState("cart");   // cart | address | confirm | success
  const [address,  setAddress]  = useState({ street:"", city:"Bengaluru", state:"Karnataka", pincode:"560001" });
  const [method,   setMethod]   = useState("UPI");
  const [upiId,    setUpiId]    = useState("");
  const [loading,  setLoading]  = useState(false);
  const [toast,    setToast]    = useState(null);
  const [orderId,  setOrderId]  = useState(null);
  const [coupon,   setCoupon]   = useState("");
  const [discount, setDiscount] = useState(0);

  const showToast = (msg, type="success") => { setToast({msg,type}); setTimeout(()=>setToast(null),2800); };

  useEffect(() => {
    const u = JSON.parse(localStorage.getItem("rce_u") || "null");
    const t = localStorage.getItem("rce_t");
    setUser(u); setToken(t);
    const stored = JSON.parse(localStorage.getItem("rce_cart") || "[]");
    setItems(stored);

    const sync = () => setItems(JSON.parse(localStorage.getItem("rce_cart")||"[]"));
    window.addEventListener("cartUpdated", sync);
    return () => window.removeEventListener("cartUpdated", sync);
  }, []);

  const persist = (next) => {
    setItems(next);
    localStorage.setItem("rce_cart", JSON.stringify(next));
    window.dispatchEvent(new Event("cartUpdated"));
  };

  const updateQty = (id, delta) => {
    const next = items.map(i => i.id===id ? {...i, qty: i.qty+delta} : i).filter(i=>i.qty>0);
    persist(next);
  };
  const remove = (id) => persist(items.filter(i=>i.id!==id));
  const clear  = ()    => persist([]);

  const subtotal  = items.reduce((s,i)=>s+i.price*i.qty, 0);
  const delivery  = subtotal >= FREE_DELIVERY ? 0 : DELIVERY_FEE;
  const total     = subtotal + delivery + PLATFORM_FEE - discount;

  const applyCoupon = () => {
    const codes = { "RASOI50":50, "NEWUSER":100, "SAVE20":Math.round(subtotal*0.2) };
    if (codes[coupon.toUpperCase()]) {
      setDiscount(codes[coupon.toUpperCase()]);
      showToast(`Coupon applied! ₹${codes[coupon.toUpperCase()]} off 🎉`);
    } else {
      showToast("Invalid coupon code","error");
    }
  };

  const handleCheckout = async () => {
    if (!user || !token) { navigate("/login"); return; }
    if (!address.street) { showToast("Please enter delivery address","error"); return; }
    if (method==="UPI" && !upiId) { showToast("Please enter UPI ID","error"); return; }

    setLoading(true);
    try {
      // Add address first
      const addrResp = await api.addAddress(user.userId||user.id, address, token);
      const addressId = addrResp?.id || 1;

      // Place order
      const orderResp = await api.placeOrder({
        userId: user.userId||user.id,
        items:  items.map(i=>({ productId: i.id, quantity: i.qty })),
        addressId,
        paymentMethod: method,
      }, token);

      setOrderId(orderResp?.id || orderResp?.orderId);
      clear();
      setStep("success");
      showToast("Order placed successfully! 🎉");
    } catch (e) {
      showToast(e.message || "Order failed. Try again.","error");
    } finally {
      setLoading(false);
    }
  };

  const METHODS = [
    { id:"UPI",        icon:"📱", label:"UPI" },
    { id:"CARD",       icon:"💳", label:"Card" },
    { id:"COD",        icon:"💵", label:"Cash on Delivery" },
    { id:"NETBANKING", icon:"🏦", label:"Net Banking" },
  ];

  // ── Empty cart ──────────────────────────────────────────────────────────────
  if (items.length===0 && step!=="success") return (
    <div style={{minHeight:"80vh",display:"flex",alignItems:"center",justifyContent:"center",background:"#FAFAF8"}}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@400;500&display=swap');`}</style>
      <div style={{textAlign:"center",padding:"40px 24px"}}>
        <div style={{fontSize:72,marginBottom:16}}>🛒</div>
        <h2 style={{fontFamily:"'Syne',sans-serif",fontWeight:800,fontSize:26,color:"#1A1A1A",marginBottom:8}}>Your cart is empty</h2>
        <p style={{fontFamily:"'DM Sans',sans-serif",color:"#999",marginBottom:28}}>Add some delicious recipe kits to get started</p>
        <button onClick={()=>navigate("/recipes")} style={{background:"linear-gradient(135deg,#E23744,#FF6B35)",border:"none",borderRadius:14,padding:"14px 36px",color:"#fff",fontFamily:"'Syne',sans-serif",fontWeight:800,fontSize:16,cursor:"pointer",boxShadow:"0 8px 24px rgba(226,55,68,0.35)"}}>
          Browse Recipes 🍽
        </button>
      </div>
    </div>
  );

  // ── Success ─────────────────────────────────────────────────────────────────
  if (step==="success") return (
    <div style={{minHeight:"80vh",display:"flex",alignItems:"center",justifyContent:"center",background:"#FAFAF8"}}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@400;500&display=swap');@keyframes pop{0%{transform:scale(0)}60%{transform:scale(1.15)}100%{transform:scale(1)}}`}</style>
      <div style={{textAlign:"center",padding:"48px 24px",animation:"pop 0.5s ease"}}>
        <div style={{width:96,height:96,borderRadius:"50%",background:"linear-gradient(135deg,#1DB954,#0A8F3C)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:44,margin:"0 auto 24px",boxShadow:"0 12px 32px rgba(29,185,84,0.35)"}}>✓</div>
        <h2 style={{fontFamily:"'Syne',sans-serif",fontWeight:800,fontSize:30,color:"#1A1A1A",marginBottom:8}}>Order Placed!</h2>
        {orderId && <p style={{fontFamily:"'DM Sans',sans-serif",color:"#999",marginBottom:4}}>Order ID: <strong style={{color:"#1A1A1A"}}>#{orderId}</strong></p>}
        <p style={{fontFamily:"'DM Sans',sans-serif",color:"#999",marginBottom:8}}>Your fresh kit will arrive in 30 minutes</p>
        <p style={{fontFamily:"'DM Sans',sans-serif",color:"#1DB954",fontWeight:600,marginBottom:32}}>📧 Confirmation email sent</p>
        <div style={{display:"flex",gap:12,justifyContent:"center",flexWrap:"wrap"}}>
          <button onClick={()=>navigate("/orders")} style={{background:"#1A1A1A",border:"none",borderRadius:12,padding:"12px 28px",color:"#fff",fontFamily:"'Syne',sans-serif",fontWeight:700,fontSize:15,cursor:"pointer"}}>
            Track Order
          </button>
          <button onClick={()=>navigate("/recipes")} style={{background:"none",border:"2px solid #E23744",borderRadius:12,padding:"12px 28px",color:"#E23744",fontFamily:"'Syne',sans-serif",fontWeight:700,fontSize:15,cursor:"pointer"}}>
            Order More
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div style={{minHeight:"100vh",background:"#FAFAF8"}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500&display=swap');
        @keyframes slideIn{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
      `}</style>

      {toast&&<div style={{position:"fixed",bottom:24,right:24,zIndex:9999,background:toast.type==="error"?"#E23744":"#1DB954",color:"#fff",padding:"12px 22px",borderRadius:12,fontFamily:"'Syne',sans-serif",fontWeight:600,fontSize:14,boxShadow:"0 8px 32px rgba(0,0,0,0.2)",animation:"slideIn 0.3s ease"}}>{toast.msg}</div>}

      {/* Header */}
      <div style={{background:"#fff",borderBottom:"1px solid #F0F0F0",padding:"20px 24px"}}>
        <div style={{maxWidth:1100,margin:"0 auto",display:"flex",alignItems:"center",gap:12}}>
          <button onClick={()=>step==="address"?setStep("cart"):navigate("/recipes")} style={{background:"none",border:"none",cursor:"pointer",fontSize:20,color:"#555",padding:"4px 8px"}}>←</button>
          <h1 style={{fontFamily:"'Syne',sans-serif",fontWeight:800,fontSize:22,color:"#1A1A1A"}}>
            {step==="cart"?"Your Cart":`Checkout · ${step==="address"?"Address":"Payment"}`}
          </h1>
          {step==="cart"&&<span style={{fontFamily:"'DM Sans',sans-serif",fontSize:13,color:"#999",marginLeft:4}}>({items.reduce((s,i)=>s+i.qty,0)} items)</span>}
        </div>
      </div>

      {/* Progress bar */}
      <div style={{background:"#fff",borderBottom:"1px solid #F0F0F0"}}>
        <div style={{maxWidth:1100,margin:"0 auto",padding:"0 24px",display:"flex",gap:0}}>
          {["cart","address","confirm"].map((s,i)=>(
            <div key={s} style={{flex:1,padding:"12px 0",textAlign:"center",position:"relative"}}>
              <div style={{fontFamily:"'Syne',sans-serif",fontWeight:700,fontSize:12,color:step===s?"#E23744":["cart","address","confirm"].indexOf(step)>i?"#1DB954":"#bbb",textTransform:"uppercase",letterSpacing:1,transition:"color 0.3s"}}>{s}</div>
              <div style={{position:"absolute",bottom:0,left:0,right:0,height:2,background:["cart","address","confirm"].indexOf(step)>=i?"#E23744":"#F0F0F0",transition:"background 0.3s"}} />
            </div>
          ))}
        </div>
      </div>

      <div style={{maxWidth:1100,margin:"0 auto",padding:"28px 24px 64px",display:"grid",gridTemplateColumns:"1fr min(360px,100%)",gap:24,alignItems:"start"}}>

        {/* ── Left panel ── */}
        <div>
          {/* STEP: cart */}
          {step==="cart"&&(
            <div style={{display:"flex",flexDirection:"column",gap:16,animation:"fadeUp 0.4s ease"}}>
              {items.map(item=>(
                <div key={item.id} style={{background:"#fff",borderRadius:16,padding:"16px 20px",boxShadow:"0 2px 12px rgba(0,0,0,0.06)",display:"flex",alignItems:"center",gap:16}}>
                  <img src={getImg(item.name)} alt={item.name} style={{width:72,height:72,borderRadius:12,objectFit:"cover",flexShrink:0}} onError={e=>{e.target.src=FOOD_IMAGES["default"];}} />
                  <div style={{flex:1,minWidth:0}}>
                    <h3 style={{fontFamily:"'Syne',sans-serif",fontWeight:700,fontSize:15,color:"#1A1A1A",marginBottom:2,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{item.name}</h3>
                    <p style={{fontFamily:"'DM Sans',sans-serif",fontSize:12,color:"#999",marginBottom:10}}>{item.cuisine||"Indian"} Kit</p>
                    <div style={{display:"flex",alignItems:"center",gap:12}}>
                      <div style={{display:"flex",alignItems:"center",gap:0,background:"#F5F5F5",borderRadius:8,overflow:"hidden"}}>
                        <button onClick={()=>updateQty(item.id,-1)} style={{width:30,height:30,border:"none",background:"none",cursor:"pointer",fontSize:16,fontWeight:700,color:"#E23744"}}>−</button>
                        <span style={{fontFamily:"'Syne',sans-serif",fontWeight:700,fontSize:14,minWidth:24,textAlign:"center"}}>{item.qty}</span>
                        <button onClick={()=>updateQty(item.id,+1)} style={{width:30,height:30,border:"none",background:"none",cursor:"pointer",fontSize:16,fontWeight:700,color:"#E23744"}}>+</button>
                      </div>
                      <span style={{fontFamily:"'Syne',sans-serif",fontWeight:800,fontSize:16,color:"#1A1A1A"}}>₹{(item.price*item.qty).toFixed(0)}</span>
                    </div>
                  </div>
                  <button onClick={()=>remove(item.id)} style={{background:"none",border:"none",cursor:"pointer",fontSize:18,color:"#ccc",padding:4,transition:"color 0.2s",flexShrink:0}}
                    onMouseEnter={e=>e.target.style.color="#E23744"} onMouseLeave={e=>e.target.style.color="#ccc"}>✕</button>
                </div>
              ))}

              {/* Coupon */}
              <div style={{background:"#fff",borderRadius:14,padding:"16px 20px",boxShadow:"0 2px 10px rgba(0,0,0,0.05)"}}>
                <p style={{fontFamily:"'Syne',sans-serif",fontWeight:700,fontSize:13,color:"#1A1A1A",marginBottom:10}}>🏷 Apply Coupon</p>
                <div style={{display:"flex",gap:8}}>
                  <input value={coupon} onChange={e=>setCoupon(e.target.value.toUpperCase())} placeholder="RASOI50 · NEWUSER · SAVE20"
                    style={{flex:1,border:"1px solid #E0E0E0",borderRadius:8,padding:"10px 14px",fontFamily:"'DM Sans',sans-serif",fontSize:13,outline:"none",letterSpacing:1}} />
                  <button onClick={applyCoupon} style={{background:"#1A1A1A",border:"none",borderRadius:8,padding:"0 18px",color:"#fff",fontFamily:"'Syne',sans-serif",fontWeight:700,fontSize:13,cursor:"pointer"}}>Apply</button>
                </div>
                {discount>0&&<p style={{fontFamily:"'DM Sans',sans-serif",fontSize:12,color:"#1DB954",marginTop:8}}>✓ ₹{discount} discount applied</p>}
              </div>

              <button onClick={()=>setStep("address")} style={{background:"linear-gradient(135deg,#E23744,#FF6B35)",border:"none",borderRadius:14,padding:"16px",color:"#fff",fontFamily:"'Syne',sans-serif",fontWeight:800,fontSize:16,cursor:"pointer",boxShadow:"0 8px 24px rgba(226,55,68,0.3)",transition:"all 0.3s",width:"100%"}}
                onMouseEnter={e=>{e.target.style.transform="translateY(-2px)";e.target.style.boxShadow="0 12px 32px rgba(226,55,68,0.4)";}}
                onMouseLeave={e=>{e.target.style.transform="translateY(0)";e.target.style.boxShadow="0 8px 24px rgba(226,55,68,0.3)";}}>
                Proceed to Checkout →
              </button>
            </div>
          )}

          {/* STEP: address */}
          {step==="address"&&(
            <div style={{background:"#fff",borderRadius:16,padding:"24px",boxShadow:"0 2px 12px rgba(0,0,0,0.06)",animation:"fadeUp 0.4s ease"}}>
              <h2 style={{fontFamily:"'Syne',sans-serif",fontWeight:800,fontSize:18,color:"#1A1A1A",marginBottom:20}}>📍 Delivery Address</h2>
              {[
                {key:"street",label:"Street / Flat / Area",placeholder:"123, MG Road, Indiranagar"},
                {key:"city",  label:"City",                 placeholder:"Bengaluru"},
                {key:"state", label:"State",                placeholder:"Karnataka"},
                {key:"pincode",label:"Pincode",             placeholder:"560001"},
              ].map(({key,label,placeholder})=>(
                <div key={key} style={{marginBottom:16}}>
                  <label style={{fontFamily:"'Syne',sans-serif",fontWeight:700,fontSize:12,color:"#555",letterSpacing:0.5,display:"block",marginBottom:6}}>{label}</label>
                  <input value={address[key]} onChange={e=>setAddress(a=>({...a,[key]:e.target.value}))} placeholder={placeholder}
                    style={{width:"100%",border:"1px solid #E0E0E0",borderRadius:10,padding:"12px 14px",fontFamily:"'DM Sans',sans-serif",fontSize:14,outline:"none",boxSizing:"border-box",transition:"border 0.2s"}}
                    onFocus={e=>e.target.style.borderColor="#E23744"} onBlur={e=>e.target.style.borderColor="#E0E0E0"} />
                </div>
              ))}

              <h2 style={{fontFamily:"'Syne',sans-serif",fontWeight:800,fontSize:18,color:"#1A1A1A",margin:"24px 0 16px"}}>💳 Payment Method</h2>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:20}}>
                {METHODS.map(m=>(
                  <button key={m.id} onClick={()=>setMethod(m.id)} style={{
                    border:`2px solid ${method===m.id?"#E23744":"#E0E0E0"}`,
                    borderRadius:12,padding:"12px 16px",cursor:"pointer",background:method===m.id?"#FFF0F1":"#fff",
                    display:"flex",alignItems:"center",gap:10,transition:"all 0.2s",
                  }}>
                    <span style={{fontSize:20}}>{m.icon}</span>
                    <span style={{fontFamily:"'DM Sans',sans-serif",fontWeight:600,fontSize:13,color:method===m.id?"#E23744":"#555"}}>{m.label}</span>
                    {method===m.id&&<span style={{marginLeft:"auto",color:"#E23744",fontWeight:700}}>✓</span>}
                  </button>
                ))}
              </div>

              {method==="UPI"&&(
                <div style={{marginBottom:20}}>
                  <label style={{fontFamily:"'Syne',sans-serif",fontWeight:700,fontSize:12,color:"#555",letterSpacing:0.5,display:"block",marginBottom:6}}>UPI ID</label>
                  <input value={upiId} onChange={e=>setUpiId(e.target.value)} placeholder="yourname@okicici"
                    style={{width:"100%",border:"1px solid #E0E0E0",borderRadius:10,padding:"12px 14px",fontFamily:"'DM Sans',sans-serif",fontSize:14,outline:"none",boxSizing:"border-box"}} />
                </div>
              )}

              <button onClick={handleCheckout} disabled={loading} style={{
                background:loading?"#ccc":"linear-gradient(135deg,#E23744,#FF6B35)",
                border:"none",borderRadius:14,padding:"16px",color:"#fff",
                fontFamily:"'Syne',sans-serif",fontWeight:800,fontSize:16,
                cursor:loading?"not-allowed":"pointer",width:"100%",
                boxShadow:loading?"none":"0 8px 24px rgba(226,55,68,0.3)",transition:"all 0.2s",
              }}>
                {loading?"Placing Order...":"Place Order · ₹"+total.toFixed(0)}
              </button>
            </div>
          )}
        </div>

        {/* ── Right: Order Summary ── */}
        <div style={{background:"#fff",borderRadius:16,padding:"22px",boxShadow:"0 4px 20px rgba(0,0,0,0.07)",position:"sticky",top:80}}>
          <h3 style={{fontFamily:"'Syne',sans-serif",fontWeight:800,fontSize:16,color:"#1A1A1A",marginBottom:16}}>Order Summary</h3>
          {items.map(i=>(
            <div key={i.id} style={{display:"flex",justifyContent:"space-between",marginBottom:10}}>
              <span style={{fontFamily:"'DM Sans',sans-serif",fontSize:13,color:"#555"}}>{i.name} × {i.qty}</span>
              <span style={{fontFamily:"'Syne',sans-serif",fontWeight:700,fontSize:13,color:"#1A1A1A"}}>₹{(i.price*i.qty).toFixed(0)}</span>
            </div>
          ))}
          <div style={{borderTop:"1px dashed #F0F0F0",margin:"14px 0"}} />
          {[
            {label:"Subtotal",     val:`₹${subtotal.toFixed(0)}`},
            {label:"Delivery",     val:delivery===0?"FREE 🎉":`₹${delivery}`, green:delivery===0},
            {label:"Platform fee", val:`₹${PLATFORM_FEE}`},
            ...(discount>0?[{label:"Coupon discount",val:`-₹${discount}`,green:true}]:[]),
          ].map(({label,val,green})=>(
            <div key={label} style={{display:"flex",justifyContent:"space-between",marginBottom:8}}>
              <span style={{fontFamily:"'DM Sans',sans-serif",fontSize:13,color:"#888"}}>{label}</span>
              <span style={{fontFamily:"'DM Sans',sans-serif",fontSize:13,color:green?"#1DB954":"#555",fontWeight:green?600:400}}>{val}</span>
            </div>
          ))}
          {subtotal < FREE_DELIVERY && (
            <div style={{background:"#FFF9E6",borderRadius:10,padding:"10px 14px",margin:"12px 0",fontFamily:"'DM Sans',sans-serif",fontSize:12,color:"#B8860B"}}>
              Add ₹{FREE_DELIVERY-subtotal} more for free delivery!
            </div>
          )}
          <div style={{borderTop:"2px solid #F0F0F0",margin:"14px 0",paddingTop:14,display:"flex",justifyContent:"space-between"}}>
            <span style={{fontFamily:"'Syne',sans-serif",fontWeight:800,fontSize:16,color:"#1A1A1A"}}>Total</span>
            <span style={{fontFamily:"'Syne',sans-serif",fontWeight:800,fontSize:18,color:"#E23744"}}>₹{total.toFixed(0)}</span>
          </div>
          <div style={{background:"#F0FFF4",borderRadius:10,padding:"10px 14px"}}>
            <p style={{fontFamily:"'DM Sans',sans-serif",fontSize:12,color:"#1DB954",fontWeight:600,marginBottom:2}}>✓ Secure Checkout</p>
            <p style={{fontFamily:"'DM Sans',sans-serif",fontSize:11,color:"#5A8A6A"}}>256-bit SSL · 30-day freshness guarantee</p>
          </div>
        </div>
      </div>
    </div>
  );
}
