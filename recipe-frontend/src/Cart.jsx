import { useState, useEffect, useCallback } from "react";
import { api } from "./api";

// ── helpers ────────────────────────────────────────────────────────────────
const fmt = (n) => `₹${Number(n || 0).toFixed(2)}`;
const FREE_DELIVERY_THRESHOLD = 499;
const DELIVERY_FEE = 30;

// ── PaymentModal ────────────────────────────────────────────────────────────
function PaymentModal({ orderId, userId, amount, token, onClose }) {
  const [phase, setPhase]     = useState("confirm"); // confirm | paying | paid | refunding | refunded | error
  const [error, setError]     = useState("");
  const [refundReason, setRefundReason] = useState("");
  const [showRefund, setShowRefund]     = useState(false);

  const handlePay = async () => {
    setPhase("paying");
    setError("");
    try {
      await api.createPayment({ orderId, userId, amount });
      setPhase("paid");
    } catch (e) {
      setError(e.message);
      setPhase("error");
    }
  };

  const handleRefund = async () => {
    if (!refundReason.trim()) return;
    setPhase("refunding");
    setError("");
    try {
      await api.refundPayment({ orderId, amount, reason: refundReason });
      setPhase("refunded");
    } catch (e) {
      setError(e.message);
      setPhase("error");
    }
  };

  return (
    <div style={SP.overlay}>
      <div style={SP.card}>

        {/* ── confirm ── */}
        {phase === "confirm" && (
          <>
            <div style={SP.icon}>💳</div>
            <h3 style={SP.title}>Complete Payment</h3>
            <p style={SP.sub}>Order #{orderId}</p>
            <div style={SP.amtBox}>
              <span style={SP.amtLabel}>Amount due</span>
              <span style={SP.amtVal}>{fmt(amount)}</span>
            </div>
            <div style={SP.methods}>
              {["UPI", "Card", "Net Banking", "COD"].map(m => (
                <div key={m} style={SP.methodChip}>{m}</div>
              ))}
            </div>
            <p style={SP.mockNote}>⚡ Mock payment — no real transaction</p>
            <div style={SP.btnRow}>
              <button onClick={onClose} style={SP.cancelBtn}>Cancel</button>
              <button onClick={handlePay} style={SP.payBtn}>Pay {fmt(amount)}</button>
            </div>
          </>
        )}

        {/* ── paying ── */}
        {phase === "paying" && (
          <div style={SP.centered}>
            <div style={SP.spinner} />
            <p style={SP.processingText}>Processing payment…</p>
          </div>
        )}

        {/* ── paid ── */}
        {phase === "paid" && (
          <>
            <div style={SP.icon}>✅</div>
            <h3 style={SP.title}>Payment Successful</h3>
            <p style={SP.sub}>Order #{orderId} · {fmt(amount)}</p>
            <p style={SP.paidNote}>Your payment has been recorded.</p>

            {!showRefund ? (
              <div style={SP.btnRow}>
                <button onClick={() => setShowRefund(true)} style={SP.refundLink}>Request Refund</button>
                <button onClick={onClose} style={SP.payBtn}>Done</button>
              </div>
            ) : (
              <>
                <textarea
                  placeholder="Reason for refund…"
                  value={refundReason}
                  onChange={e => setRefundReason(e.target.value)}
                  style={SP.textarea}
                  rows={3}
                />
                <div style={SP.btnRow}>
                  <button onClick={() => setShowRefund(false)} style={SP.cancelBtn}>Back</button>
                  <button
                    onClick={handleRefund}
                    disabled={!refundReason.trim()}
                    style={{ ...SP.payBtn, background: "#e53935", opacity: refundReason.trim() ? 1 : 0.5 }}
                  >
                    Confirm Refund
                  </button>
                </div>
              </>
            )}
          </>
        )}

        {/* ── refunding ── */}
        {phase === "refunding" && (
          <div style={SP.centered}>
            <div style={SP.spinner} />
            <p style={SP.processingText}>Processing refund…</p>
          </div>
        )}

        {/* ── refunded ── */}
        {phase === "refunded" && (
          <>
            <div style={SP.icon}>↩️</div>
            <h3 style={SP.title}>Refund Initiated</h3>
            <p style={SP.sub}>{fmt(amount)} · Order #{orderId}</p>
            <p style={SP.paidNote}>Refund will be credited in 5–7 business days.</p>
            <button onClick={onClose} style={{ ...SP.payBtn, width: "100%", marginTop: 8 }}>Close</button>
          </>
        )}

        {/* ── error ── */}
        {phase === "error" && (
          <>
            <div style={SP.icon}>❌</div>
            <h3 style={SP.title}>Something went wrong</h3>
            <p style={SP.errorText}>{error}</p>
            <div style={SP.btnRow}>
              <button onClick={onClose} style={SP.cancelBtn}>Close</button>
              <button onClick={() => setPhase("confirm")} style={SP.payBtn}>Retry</button>
            </div>
          </>
        )}

      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

function useAuth() {
  const token  = localStorage.getItem("token");
  const userId = localStorage.getItem("userId");
  return { token, userId: userId ? Number(userId) : null };
}

// ── sub-components ──────────────────────────────────────────────────────────
function EmptyCart({ onBrowse }) {
  return (
    <div style={S.empty}>
      <div style={S.emptyIcon}>🛒</div>
      <h3 style={S.emptyTitle}>Your cart is empty</h3>
      <p style={S.emptySubtitle}>Add recipe kits to get started</p>
      <button onClick={onBrowse} style={S.browseBtn}>Browse Recipes</button>
    </div>
  );
}

function CartItem({ item, onUpdate, onRemove, updating }) {
  return (
    <div style={S.item}>
      <div style={S.itemLeft}>
        <div style={S.itemDot} />
        <div>
          <p style={S.itemName}>{item.ingredientName || item.productName || "Item"}</p>
          <p style={S.itemUnit}>{fmt(item.pricePerUnit)} / unit</p>
        </div>
      </div>
      <div style={S.itemRight}>
        <div style={S.qtyRow}>
          <button
            style={{ ...S.qtyBtn, ...(updating ? S.qtyBtnDisabled : {}) }}
            onClick={() => item.quantity === 1 ? onRemove(item.id) : onUpdate(item.id, item.quantity - 1)}
            disabled={updating}
          >
            {item.quantity === 1 ? "🗑" : "−"}
          </button>
          <span style={S.qty}>{updating ? "…" : item.quantity}</span>
          <button
            style={{ ...S.qtyBtn, ...(updating ? S.qtyBtnDisabled : {}) }}
            onClick={() => onUpdate(item.id, item.quantity + 1)}
            disabled={updating}
          >+</button>
        </div>
        <p style={S.itemTotal}>{fmt(item.pricePerUnit * item.quantity)}</p>
      </div>
    </div>
  );
}

function AddressSelector({ addresses, selected, onSelect, onAdd }) {
  return (
    <div style={S.addrSection}>
      <p style={S.sectionLabel}>Deliver to</p>
      {addresses.length === 0 ? (
        <button onClick={onAdd} style={S.addAddrBtn}>+ Add delivery address</button>
      ) : (
        <div style={S.addrList}>
          {addresses.map(a => (
            <div
              key={a.id}
              onClick={() => onSelect(a.id)}
              style={{ ...S.addrCard, ...(selected === a.id ? S.addrCardActive : {}) }}
            >
              <div style={S.addrRadio}>
                <div style={{ ...S.radioInner, ...(selected === a.id ? S.radioInnerActive : {}) }} />
              </div>
              <div>
                <p style={S.addrStreet}>{a.street}</p>
                <p style={S.addrCity}>{a.city}, {a.state} — {a.pincode}</p>
              </div>
            </div>
          ))}
          <button onClick={onAdd} style={S.addMoreAddr}>+ Add new address</button>
        </div>
      )}
    </div>
  );
}

// ── main component ──────────────────────────────────────────────────────────
export default function Cart({ onNavigate }) {
  const { token, userId } = useAuth();

  const [cart, setCart]         = useState(null);
  const [user, setUser]         = useState(null);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState("");
  const [updatingIds, setUpdatingIds] = useState(new Set());
  const [selectedAddr, setSelectedAddr] = useState(null);
  const [checkingOut, setCheckingOut]   = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(null);
  const [payment, setPayment]           = useState(null);   // PaymentResponse from backend
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [clearConfirm, setClearConfirm] = useState(false);
  const [showPayment, setShowPayment]   = useState(false);

  const fetchCart = useCallback(async () => {
    if (!userId || !token) { setLoading(false); return; }
    try {
      const [cartData, userData] = await Promise.all([
        api.getCart(userId, token),
        api.getUser(userId, token),
      ]);
      setCart(cartData);
      setUser(userData);
      if (userData?.addresses?.length > 0 && !selectedAddr) {
        setSelectedAddr(userData.addresses[0].id);
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [userId, token]);

  useEffect(() => { fetchCart(); }, [fetchCart]);

  const handleUpdate = async (itemId, quantity) => {
    setUpdatingIds(s => new Set(s).add(itemId));
    try {
      await api.updateCartItem(userId, itemId, quantity, token);
      setCart(prev => ({
        ...prev,
        items: prev.items.map(i => i.id === itemId ? { ...i, quantity } : i),
      }));
    } catch (e) { setError(e.message); }
    finally { setUpdatingIds(s => { const n = new Set(s); n.delete(itemId); return n; }); }
  };

  const handleRemove = async (itemId) => {
    setUpdatingIds(s => new Set(s).add(itemId));
    try {
      await api.removeCartItem(userId, itemId, token);
      setCart(prev => ({ ...prev, items: prev.items.filter(i => i.id !== itemId) }));
    } catch (e) { setError(e.message); }
    finally { setUpdatingIds(s => { const n = new Set(s); n.delete(itemId); return n; }); }
  };

  const handleClear = async () => {
    setClearConfirm(false);
    try {
      await api.clearCart(userId, token);
      setCart(prev => ({ ...prev, items: [] }));
    } catch (e) { setError(e.message); }
  };

  const handleCheckout = async () => {
    if (!selectedAddr) { setError("Please select a delivery address"); return; }
    setCheckingOut(true);
    setError("");
    try {
      const order = await api.checkout(userId, selectedAddr, token);
      setOrderSuccess(order);

      // Initiate payment on backend, then fetch the real PaymentResponse
      const orderId = order.id || order.orderId;
      setPaymentLoading(true);
      try {
        await api.createPayment({ orderId, userId }, token);
        const paymentData = await api.getPaymentByOrder(orderId, token);
        setPayment(paymentData);
      } catch (payErr) {
        // Order placed but payment initiation failed — surface softly
        setError(`Order placed but payment initiation failed: ${payErr.message}`);
      } finally {
        setPaymentLoading(false);
      }
    } catch (e) { setError(e.message); }
    finally { setCheckingOut(false); }
  };

  // ── derived values ───────────────────────────────────────────────────────
  const items     = cart?.items || [];
  const subtotal  = items.reduce((s, i) => s + (i.pricePerUnit * i.quantity), 0);
  const delivery  = subtotal > 0 ? (subtotal >= FREE_DELIVERY_THRESHOLD ? 0 : DELIVERY_FEE) : 0;
  const total     = subtotal + delivery;

  // ── order success screen ─────────────────────────────────────────────────
  if (orderSuccess) {
    const orderId = orderSuccess.id || orderSuccess.orderId;
    return (
      <div style={S.successOverlay}>
        <div style={S.successCard}>
          <div style={S.successAnim}>✅</div>
          <h2 style={S.successTitle}>Order Placed!</h2>
          <p style={S.successSub}>Order #{orderId}</p>
          <p style={S.successMsg}>Your recipe kit is being prepared. Complete your payment below.</p>
          <div style={S.successBtns}>
            <button
              onClick={() => setShowPayment(true)}
              disabled={paymentLoading || !payment}
              style={{ ...S.successBtnPrimary, opacity: (paymentLoading || !payment) ? 0.6 : 1, cursor: (paymentLoading || !payment) ? "not-allowed" : "pointer" }}
            >
              {paymentLoading
                ? <><span style={S.spinnerWhite} /> Preparing payment…</>
                : `💳 Pay Now ${fmt(payment?.amount)}`}
            </button>
            <button onClick={() => onNavigate?.("orders")} style={S.successBtnSecondary}>Track Order</button>
            <button onClick={() => { setOrderSuccess(null); onNavigate?.("recipes"); }} style={S.successBtnSecondary}>
              Browse More
            </button>
          </div>
        </div>

        {showPayment && payment && (
          <PaymentModal
            orderId={orderId}
            userId={userId}
            amount={payment.amount}
            token={token}
            onClose={() => setShowPayment(false)}
          />
        )}

        <style>{`@keyframes pop{0%{transform:scale(0)}60%{transform:scale(1.2)}100%{transform:scale(1)}}`}</style>
      </div>
    );
  }

  if (loading) return <div style={S.center}><span style={S.spinner} /></div>;

  if (!userId) return (
    <div style={S.center}>
      <p style={{ color: "#666", marginBottom: 16 }}>Please log in to view your cart</p>
      <button onClick={() => onNavigate?.("login")} style={S.browseBtn}>Login</button>
    </div>
  );

  return (
    <div style={S.page}>
      {/* Header */}
      <div style={S.header}>
        <h1 style={S.pageTitle}>Your Cart</h1>
        {items.length > 0 && (
          <button onClick={() => setClearConfirm(true)} style={S.clearBtn}>Clear all</button>
        )}
      </div>

      {error && <div style={S.errorBanner}>{error} <button onClick={() => setError("")} style={S.errorClose}>✕</button></div>}

      {items.length === 0 ? (
        <EmptyCart onBrowse={() => onNavigate?.("recipes")} />
      ) : (
        <div style={S.layout}>
          {/* Left: items + address */}
          <div style={S.left}>
            <div style={S.itemsCard}>
              <p style={S.sectionLabel}>{items.length} item{items.length !== 1 ? "s" : ""}</p>
              {items.map(item => (
                <CartItem
                  key={item.id}
                  item={item}
                  onUpdate={handleUpdate}
                  onRemove={handleRemove}
                  updating={updatingIds.has(item.id)}
                />
              ))}
            </div>

            <AddressSelector
              addresses={user?.addresses || []}
              selected={selectedAddr}
              onSelect={setSelectedAddr}
              onAdd={() => onNavigate?.("profile")}
            />
          </div>

          {/* Right: bill summary */}
          <div style={S.right}>
            <div style={S.billCard}>
              <p style={S.billTitle}>Bill Details</p>
              <div style={S.billRow}>
                <span style={S.billLabel}>Item total</span>
                <span style={S.billVal}>{fmt(subtotal)}</span>
              </div>
              <div style={S.billRow}>
                <span style={S.billLabel}>Delivery fee</span>
                <span style={{ ...S.billVal, ...(delivery === 0 ? S.freeDelivery : {}) }}>
                  {delivery === 0 ? "FREE" : fmt(delivery)}
                </span>
              </div>
              {delivery > 0 && (
                <p style={S.freeHint}>Add {fmt(FREE_DELIVERY_THRESHOLD - subtotal)} more for free delivery</p>
              )}
              <div style={S.divider} />
              <div style={{ ...S.billRow, ...S.billTotal }}>
                <span>To Pay</span>
                <span>{fmt(total)}</span>
              </div>

              <button
                onClick={handleCheckout}
                disabled={checkingOut || !selectedAddr}
                style={{ ...S.checkoutBtn, ...(checkingOut || !selectedAddr ? S.checkoutDisabled : {}) }}
              >
                {checkingOut ? <span style={S.spinnerWhite} /> : `Proceed to Pay ${fmt(total)}`}
              </button>

              <p style={S.safeNote}>🔒 Secure checkout</p>
            </div>
          </div>
        </div>
      )}

      {/* Clear confirm modal */}
      {clearConfirm && (
        <div style={S.modalOverlay}>
          <div style={S.modal}>
            <p style={S.modalTitle}>Clear entire cart?</p>
            <p style={S.modalSub}>This will remove all {items.length} items.</p>
            <div style={S.modalBtns}>
              <button onClick={() => setClearConfirm(false)} style={S.modalCancel}>Cancel</button>
              <button onClick={handleClear} style={S.modalConfirm}>Clear Cart</button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
      `}</style>
    </div>
  );
}

const S = {
  page: { maxWidth: 1000, margin: "0 auto", padding: "24px 16px", fontFamily: "'Segoe UI',system-ui,sans-serif" },
  header: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 },
  pageTitle: { fontSize: 22, fontWeight: 700, color: "#1d1d1d", margin: 0 },
  clearBtn: { background: "none", border: "1px solid #e53935", color: "#e53935", borderRadius: 8, padding: "6px 14px", fontSize: 13, fontWeight: 600, cursor: "pointer" },
  center: { display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "60vh" },
  spinner: { width: 32, height: 32, border: "3px solid #f0f0f0", borderTopColor: "#fc8019", borderRadius: "50%", animation: "spin .7s linear infinite", display: "inline-block" },
  spinnerWhite: { width: 18, height: 18, border: "2px solid rgba(255,255,255,.4)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin .7s linear infinite", display: "inline-block" },
  errorBanner: { background: "#fff3f3", border: "1px solid #ffcdd2", borderRadius: 10, padding: "12px 16px", color: "#c62828", fontSize: 14, marginBottom: 16, display: "flex", justifyContent: "space-between", alignItems: "center" },
  errorClose: { background: "none", border: "none", cursor: "pointer", color: "#c62828", fontSize: 16 },
  empty: { textAlign: "center", padding: "80px 20px", animation: "fadeIn .4s ease" },
  emptyIcon: { fontSize: 56, marginBottom: 16 },
  emptyTitle: { fontSize: 20, fontWeight: 700, color: "#1d1d1d", margin: "0 0 8px" },
  emptySubtitle: { fontSize: 14, color: "#888", margin: "0 0 24px" },
  browseBtn: { background: "#fc8019", color: "#fff", border: "none", borderRadius: 12, padding: "12px 28px", fontSize: 15, fontWeight: 700, cursor: "pointer" },
  layout: { display: "flex", gap: 24, alignItems: "flex-start", flexWrap: "wrap" },
  left: { flex: "1 1 380px", display: "flex", flexDirection: "column", gap: 16 },
  right: { flex: "0 0 300px" },
  itemsCard: { background: "#fff", borderRadius: 16, padding: "20px", boxShadow: "0 2px 12px rgba(0,0,0,.06)", animation: "fadeIn .3s ease" },
  sectionLabel: { fontSize: 12, fontWeight: 700, color: "#aaa", textTransform: "uppercase", letterSpacing: "0.8px", margin: "0 0 14px" },
  item: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 0", borderBottom: "1px solid #f5f5f5" },
  itemLeft: { display: "flex", alignItems: "center", gap: 12 },
  itemDot: { width: 10, height: 10, borderRadius: "50%", background: "#fc8019", flexShrink: 0 },
  itemName: { fontSize: 14, fontWeight: 600, color: "#1d1d1d", margin: "0 0 2px" },
  itemUnit: { fontSize: 12, color: "#aaa", margin: 0 },
  itemRight: { display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6 },
  qtyRow: { display: "flex", alignItems: "center", gap: 8, background: "#fff8f0", borderRadius: 8, padding: "4px 8px" },
  qtyBtn: { width: 24, height: 24, borderRadius: 6, border: "none", background: "#fc8019", color: "#fff", fontSize: 16, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", lineHeight: 1 },
  qtyBtnDisabled: { opacity: 0.5, cursor: "not-allowed" },
  qty: { fontSize: 14, fontWeight: 700, color: "#1d1d1d", minWidth: 20, textAlign: "center" },
  itemTotal: { fontSize: 14, fontWeight: 700, color: "#1d1d1d", margin: 0 },
  addrSection: { background: "#fff", borderRadius: 16, padding: 20, boxShadow: "0 2px 12px rgba(0,0,0,.06)" },
  addrList: { display: "flex", flexDirection: "column", gap: 10 },
  addrCard: { display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", borderRadius: 12, border: "1.5px solid #e5e5e5", cursor: "pointer", transition: "border-color .2s" },
  addrCardActive: { borderColor: "#fc8019", background: "#fff8f0" },
  addrRadio: { width: 18, height: 18, borderRadius: "50%", border: "2px solid #ccc", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 },
  radioInner: { width: 8, height: 8, borderRadius: "50%", background: "transparent" },
  radioInnerActive: { background: "#fc8019" },
  addrStreet: { fontSize: 13, fontWeight: 600, color: "#1d1d1d", margin: "0 0 2px" },
  addrCity: { fontSize: 12, color: "#888", margin: 0 },
  addAddrBtn: { width: "100%", padding: "12px", borderRadius: 12, border: "1.5px dashed #fc8019", background: "transparent", color: "#fc8019", fontSize: 14, fontWeight: 600, cursor: "pointer" },
  addMoreAddr: { background: "none", border: "none", color: "#fc8019", fontSize: 13, fontWeight: 600, cursor: "pointer", padding: "6px 0", textDecoration: "underline" },
  billCard: { background: "#fff", borderRadius: 16, padding: 20, boxShadow: "0 2px 12px rgba(0,0,0,.06)", position: "sticky", top: 20 },
  billTitle: { fontSize: 14, fontWeight: 700, color: "#1d1d1d", margin: "0 0 16px", textTransform: "uppercase", letterSpacing: "0.5px" },
  billRow: { display: "flex", justifyContent: "space-between", marginBottom: 10 },
  billLabel: { fontSize: 14, color: "#555" },
  billVal: { fontSize: 14, fontWeight: 600, color: "#1d1d1d" },
  freeDelivery: { color: "#2e7d32", fontWeight: 700 },
  freeHint: { fontSize: 12, color: "#fc8019", margin: "-4px 0 10px", fontWeight: 500 },
  divider: { height: 1, background: "#f0f0f0", margin: "12px 0" },
  billTotal: { fontSize: 16, fontWeight: 800, color: "#1d1d1d" },
  checkoutBtn: { width: "100%", padding: 14, borderRadius: 12, border: "none", background: "#fc8019", color: "#fff", fontSize: 15, fontWeight: 700, cursor: "pointer", marginTop: 16, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 },
  checkoutDisabled: { opacity: 0.6, cursor: "not-allowed" },
  safeNote: { textAlign: "center", fontSize: 12, color: "#aaa", margin: "12px 0 0" },
  successOverlay: { position: "fixed", inset: 0, background: "rgba(0,0,0,.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 999 },
  successCard: { background: "#fff", borderRadius: 20, padding: "40px 32px", maxWidth: 360, width: "90%", textAlign: "center" },
  successAnim: { fontSize: 56, animation: "pop .5s ease", display: "inline-block", marginBottom: 12 },
  successTitle: { fontSize: 22, fontWeight: 800, color: "#1d1d1d", margin: "0 0 6px" },
  successSub: { fontSize: 14, color: "#888", margin: "0 0 12px" },
  successMsg: { fontSize: 14, color: "#555", margin: "0 0 24px", lineHeight: 1.6 },
  successBtns: { display: "flex", gap: 12, flexDirection: "column" },
  successBtnPrimary: { padding: "13px", borderRadius: 12, border: "none", background: "#fc8019", color: "#fff", fontSize: 15, fontWeight: 700, cursor: "pointer" },
  successBtnSecondary: { padding: "13px", borderRadius: 12, border: "1.5px solid #e5e5e5", background: "#fff", color: "#1d1d1d", fontSize: 15, fontWeight: 600, cursor: "pointer" },
  modalOverlay: { position: "fixed", inset: 0, background: "rgba(0,0,0,.4)", display: "flex", alignItems: "flex-end", justifyContent: "center", zIndex: 999 },
  modal: { background: "#fff", borderRadius: "20px 20px 0 0", padding: "28px 24px 32px", width: "100%", maxWidth: 480 },
  modalTitle: { fontSize: 17, fontWeight: 700, color: "#1d1d1d", margin: "0 0 6px" },
  modalSub: { fontSize: 14, color: "#888", margin: "0 0 20px" },
  modalBtns: { display: "flex", gap: 12 },
  modalCancel: { flex: 1, padding: 13, borderRadius: 12, border: "1.5px solid #e5e5e5", background: "#fff", color: "#1d1d1d", fontSize: 15, fontWeight: 600, cursor: "pointer" },
  modalConfirm: { flex: 1, padding: 13, borderRadius: 12, border: "none", background: "#e53935", color: "#fff", fontSize: 15, fontWeight: 700, cursor: "pointer" },
};

// ── PaymentModal styles ───────────────────────────────────────────────────────
const SP = {
  overlay:        { position: "fixed", inset: 0, background: "rgba(0,0,0,.55)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 },
  card:           { background: "#fff", borderRadius: 20, padding: "36px 28px", maxWidth: 360, width: "90%", textAlign: "center", boxShadow: "0 8px 40px rgba(0,0,0,.18)", animation: "fadeIn .25s ease" },
  icon:           { fontSize: 44, marginBottom: 12, display: "block" },
  title:          { fontSize: 20, fontWeight: 800, color: "#1d1d1d", margin: "0 0 4px" },
  sub:            { fontSize: 13, color: "#aaa", margin: "0 0 20px" },
  amtBox:         { display: "flex", justifyContent: "space-between", alignItems: "center", background: "#fff8f0", borderRadius: 12, padding: "14px 18px", marginBottom: 16 },
  amtLabel:       { fontSize: 13, color: "#888" },
  amtVal:         { fontSize: 22, fontWeight: 800, color: "#fc8019" },
  methods:        { display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap", marginBottom: 12 },
  methodChip:     { padding: "5px 12px", borderRadius: 20, border: "1.5px solid #e5e5e5", fontSize: 12, fontWeight: 600, color: "#555", background: "#fafafa" },
  mockNote:       { fontSize: 11, color: "#bbb", margin: "0 0 20px" },
  btnRow:         { display: "flex", gap: 10, marginTop: 4 },
  cancelBtn:      { flex: 1, padding: "12px", borderRadius: 12, border: "1.5px solid #e5e5e5", background: "#fff", color: "#1d1d1d", fontSize: 14, fontWeight: 600, cursor: "pointer" },
  payBtn:         { flex: 1, padding: "12px", borderRadius: 12, border: "none", background: "#fc8019", color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer" },
  centered:       { display: "flex", flexDirection: "column", alignItems: "center", gap: 16, padding: "20px 0" },
  spinner:        { width: 36, height: 36, border: "3px solid #f0f0f0", borderTopColor: "#fc8019", borderRadius: "50%", animation: "spin .7s linear infinite" },
  processingText: { fontSize: 14, color: "#888" },
  paidNote:       { fontSize: 13, color: "#555", margin: "0 0 20px", lineHeight: 1.5 },
  refundLink:     { flex: 1, padding: "12px", borderRadius: 12, border: "none", background: "none", color: "#e53935", fontSize: 13, fontWeight: 600, cursor: "pointer", textDecoration: "underline" },
  textarea:       { width: "100%", borderRadius: 10, border: "1.5px solid #e5e5e5", padding: "10px 12px", fontSize: 13, fontFamily: "inherit", resize: "vertical", marginBottom: 12, boxSizing: "border-box", outline: "none" },
  errorText:      { fontSize: 13, color: "#e53935", margin: "0 0 20px", lineHeight: 1.5 },
};
