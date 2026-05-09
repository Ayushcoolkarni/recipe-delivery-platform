import { useState, useEffect, useCallback } from "react";
import { api } from "./api";

// ── helpers ────────────────────────────────────────────────────────────────
const fmt = (n) => `₹${Number(n || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`;
const fmtNum = (n) => Number(n || 0).toLocaleString("en-IN");

function useAdminAuth() {
  const token  = localStorage.getItem("token");
  const userId = localStorage.getItem("userId");
  const role   = localStorage.getItem("role");
  return { token, userId: userId ? Number(userId) : null, role };
}

// ── Status badge ──────────────────────────────────────────────────────────
const STATUS_COLORS = {
  PLACED:     { bg: "#e3f2fd", text: "#1565c0" },
  CONFIRMED:  { bg: "#f3e5f5", text: "#6a1b9a" },
  SHIPPED:    { bg: "#fff8e1", text: "#f57f17" },
  DELIVERED:  { bg: "#e8f5e9", text: "#2e7d32" },
  CANCELLED:  { bg: "#ffebee", text: "#c62828" },
  PENDING:    { bg: "#fff3e0", text: "#e65100" },
  APPROVED:   { bg: "#e8f5e9", text: "#2e7d32" },
  REJECTED:   { bg: "#ffebee", text: "#c62828" },
  PAID:       { bg: "#e8f5e9", text: "#2e7d32" },
  REFUNDED:   { bg: "#fce4ec", text: "#880e4f" },
  ACTIVE:     { bg: "#e8f5e9", text: "#2e7d32" },
  INACTIVE:   { bg: "#f5f5f5", text: "#757575" },
};

function Badge({ status }) {
  const c = STATUS_COLORS[status?.toUpperCase()] || { bg: "#f5f5f5", text: "#555" };
  return (
    <span style={{ ...S.badge, background: c.bg, color: c.text }}>
      {status}
    </span>
  );
}

// ── Stat card ─────────────────────────────────────────────────────────────
function StatCard({ label, value, icon, sub }) {
  return (
    <div style={S.statCard}>
      <div style={S.statIcon}>{icon}</div>
      <div>
        <p style={S.statVal}>{value}</p>
        <p style={S.statLabel}>{label}</p>
        {sub && <p style={S.statSub}>{sub}</p>}
      </div>
    </div>
  );
}

// ── Loading / Error states ─────────────────────────────────────────────────
function Loader() {
  return <div style={S.loaderWrap}><span style={S.spinner} /></div>;
}

function ErrorMsg({ msg, onRetry }) {
  return (
    <div style={S.errorBox}>
      <span>⚠️ {msg}</span>
      {onRetry && <button onClick={onRetry} style={S.retryBtn}>Retry</button>}
    </div>
  );
}

// ── Confirm modal ─────────────────────────────────────────────────────────
function ConfirmModal({ message, onConfirm, onCancel }) {
  return (
    <div style={S.modalOverlay}>
      <div style={S.modal}>
        <p style={S.modalTitle}>{message}</p>
        <div style={S.modalBtns}>
          <button onClick={onCancel} style={S.modalCancel}>Cancel</button>
          <button onClick={onConfirm} style={S.modalConfirm}>Confirm</button>
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
//  TAB: Dashboard / Stats
// ════════════════════════════════════════════════════════════════════════════
function TabDashboard({ token }) {
  const [period, setPeriod]   = useState("daily");
  const [stats, setStats]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState("");

  const PERIODS = ["daily", "weekly", "monthly"];

  const load = useCallback(async () => {
    setLoading(true); setError("");
    try { setStats(await api.adminGetStats(period, token)); }
    catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }, [period, token]);

  useEffect(() => { load(); }, [load]);

  return (
    <div style={S.tabContent}>
      <div style={S.tabHeader}>
        <h2 style={S.tabTitle}>Dashboard</h2>
        <div style={S.segmented}>
          {PERIODS.map(p => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              style={{ ...S.segBtn, ...(period === p ? S.segBtnActive : {}) }}
            >
              {p.charAt(0).toUpperCase() + p.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {loading && <Loader />}
      {error   && <ErrorMsg msg={error} onRetry={load} />}

      {stats && !loading && (
        <>
          <div style={S.statsGrid}>
            <StatCard icon="🛒" label="Total Orders"    value={fmtNum(stats.totalOrders)}    sub={`Period: ${period}`} />
            <StatCard icon="💰" label="Total Revenue"   value={fmt(stats.totalRevenue)}       sub="incl. all orders" />
            <StatCard icon="📦" label="Orders Delivered" value={fmtNum(stats.deliveredOrders)} />
            <StatCard icon="❌" label="Cancelled"        value={fmtNum(stats.cancelledOrders)} />
            <StatCard icon="👤" label="New Users"        value={fmtNum(stats.newUsers)}        />
            <StatCard icon="🍽️" label="Avg Order Value"  value={fmt(stats.avgOrderValue)}      />
          </div>

          {/* Top recipes if returned by API */}
          {stats.topRecipes?.length > 0 && (
            <div style={S.card}>
              <p style={S.cardTitle}>Top Recipes</p>
              <table style={S.table}>
                <thead>
                  <tr>
                    {["Recipe", "Orders", "Revenue"].map(h => (
                      <th key={h} style={S.th}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {stats.topRecipes.map((r, i) => (
                    <tr key={r.recipeId || i} style={i % 2 === 0 ? S.trEven : {}}>
                      <td style={S.td}>{r.recipeName || r.name}</td>
                      <td style={S.td}>{fmtNum(r.orderCount)}</td>
                      <td style={S.td}>{fmt(r.revenue)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
//  TAB: Orders
// ════════════════════════════════════════════════════════════════════════════
const ORDER_STATUSES = ["PLACED", "CONFIRMED", "SHIPPED", "DELIVERED", "CANCELLED"];

function TabOrders({ token, userId }) {
  const [orders, setOrders]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState("");
  const [filter, setFilter]   = useState("ALL");
  const [updating, setUpdating] = useState(null);
  const [search, setSearch]   = useState("");

  const load = useCallback(async () => {
    setLoading(true); setError("");
    try { setOrders(await api.adminGetOrders(token)); }
    catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }, [token]);

  useEffect(() => { load(); }, [load]);

  const handleStatusChange = async (orderId, status) => {
    setUpdating(orderId);
    try {
      await api.adminUpdateOrderStatus({ orderId, status, adminId: userId }, token);
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status } : o));
    } catch (e) { setError(e.message); }
    finally { setUpdating(null); }
  };

  const filtered = orders
    .filter(o => filter === "ALL" || o.status === filter)
    .filter(o => !search || String(o.id).includes(search) || o.userEmail?.toLowerCase().includes(search.toLowerCase()));

  return (
    <div style={S.tabContent}>
      <div style={S.tabHeader}>
        <h2 style={S.tabTitle}>Orders <span style={S.countBadge}>{orders.length}</span></h2>
        <input
          style={S.searchInput}
          placeholder="Search order ID or email…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* Status filter pills */}
      <div style={S.pills}>
        {["ALL", ...ORDER_STATUSES].map(s => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            style={{ ...S.pill, ...(filter === s ? S.pillActive : {}) }}
          >
            {s}
          </button>
        ))}
      </div>

      {error   && <ErrorMsg msg={error} onRetry={load} />}
      {loading && <Loader />}

      {!loading && (
        <div style={S.card}>
          <table style={S.table}>
            <thead>
              <tr>
                {["Order ID", "User", "Amount", "Status", "Date", "Update Status"].map(h => (
                  <th key={h} style={S.th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr><td colSpan={6} style={{ ...S.td, textAlign: "center", color: "#aaa" }}>No orders found</td></tr>
              )}
              {filtered.map((o, i) => (
                <tr key={o.id} style={i % 2 === 0 ? S.trEven : {}}>
                  <td style={S.td}>#{o.id}</td>
                  <td style={S.td}>{o.userEmail || o.userId}</td>
                  <td style={S.td}>{fmt(o.totalAmount || o.amount)}</td>
                  <td style={S.td}><Badge status={o.status} /></td>
                  <td style={S.td}>{o.createdAt ? new Date(o.createdAt).toLocaleDateString("en-IN") : "—"}</td>
                  <td style={S.td}>
                    <select
                      value={o.status}
                      onChange={e => handleStatusChange(o.id, e.target.value)}
                      disabled={updating === o.id || o.status === "DELIVERED" || o.status === "CANCELLED"}
                      style={S.select}
                    >
                      {ORDER_STATUSES.map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                    {updating === o.id && <span style={S.inlineSpinner} />}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
//  TAB: Inventory / Products
// ════════════════════════════════════════════════════════════════════════════
function TabInventory({ token, userId }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState("");
  const [stockEdits, setStockEdits] = useState({});
  const [updating, setUpdating] = useState(null);
  const [search, setSearch]     = useState("");
  const [success, setSuccess]   = useState("");

  const load = useCallback(async () => {
    setLoading(true); setError("");
    try { setProducts(await api.adminGetProducts(token)); }
    catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }, [token]);

  useEffect(() => { load(); }, [load]);

  const handleStockUpdate = async (productId) => {
    const qty = stockEdits[productId];
    if (qty === undefined || qty === "") return;
    setUpdating(productId);
    try {
      await api.adminUpdateStock({ productId, quantity: Number(qty), adminId: userId }, token);
      setProducts(prev => prev.map(p => p.id === productId ? { ...p, stockQuantity: Number(qty) } : p));
      setStockEdits(prev => { const n = { ...prev }; delete n[productId]; return n; });
      setSuccess(`Stock updated for product #${productId}`);
      setTimeout(() => setSuccess(""), 3000);
    } catch (e) { setError(e.message); }
    finally { setUpdating(null); }
  };

  const filtered = products.filter(p =>
    !search ||
    p.name?.toLowerCase().includes(search.toLowerCase()) ||
    p.category?.toLowerCase().includes(search.toLowerCase())
  );

  const lowStock = products.filter(p => (p.stockQuantity || 0) < 10);

  return (
    <div style={S.tabContent}>
      <div style={S.tabHeader}>
        <h2 style={S.tabTitle}>Inventory <span style={S.countBadge}>{products.length}</span></h2>
        <input style={S.searchInput} placeholder="Search product or category…" value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {lowStock.length > 0 && (
        <div style={S.alertBanner}>
          ⚠️ {lowStock.length} product{lowStock.length > 1 ? "s" : ""} with low stock (&lt;10 units):
          {" "}{lowStock.map(p => p.name).join(", ")}
        </div>
      )}

      {success && <div style={S.successBanner}>✅ {success}</div>}
      {error   && <ErrorMsg msg={error} onRetry={load} />}
      {loading && <Loader />}

      {!loading && (
        <div style={S.card}>
          <table style={S.table}>
            <thead>
              <tr>
                {["Product", "Category", "Unit", "Price/Unit", "Stock", "Update Stock"].map(h => (
                  <th key={h} style={S.th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr><td colSpan={6} style={{ ...S.td, textAlign: "center", color: "#aaa" }}>No products found</td></tr>
              )}
              {filtered.map((p, i) => (
                <tr key={p.id} style={i % 2 === 0 ? S.trEven : {}}>
                  <td style={S.td}>{p.name}</td>
                  <td style={S.td}>{p.category || "—"}</td>
                  <td style={S.td}>{p.unit}</td>
                  <td style={S.td}>{fmt(p.pricePerUnit)}</td>
                  <td style={{ ...S.td, ...(p.stockQuantity < 10 ? S.lowStockCell : {}) }}>
                    {fmtNum(p.stockQuantity)}
                  </td>
                  <td style={S.td}>
                    <div style={S.stockRow}>
                      <input
                        type="number"
                        min="0"
                        style={S.stockInput}
                        placeholder={String(p.stockQuantity)}
                        value={stockEdits[p.id] ?? ""}
                        onChange={e => setStockEdits(prev => ({ ...prev, [p.id]: e.target.value }))}
                      />
                      <button
                        onClick={() => handleStockUpdate(p.id)}
                        disabled={updating === p.id || stockEdits[p.id] === undefined || stockEdits[p.id] === ""}
                        style={{ ...S.updateBtn, ...(updating === p.id ? S.updateBtnDisabled : {}) }}
                      >
                        {updating === p.id ? "…" : "Save"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
//  TAB: Suggestions
// ════════════════════════════════════════════════════════════════════════════
function TabSuggestions({ token, userId }) {
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState("");
  const [filter, setFilter]   = useState("PENDING");
  const [reviewing, setReviewing] = useState(null); // { id, decision }
  const [notes, setNotes]     = useState({});
  const [submitting, setSubmitting] = useState(null);
  const [success, setSuccess] = useState("");

  const FILTERS = ["ALL", "PENDING", "APPROVED", "REJECTED"];

  const load = useCallback(async () => {
    setLoading(true); setError("");
    try { setSuggestions(await api.adminGetSuggestions(token)); }
    catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }, [token]);

  useEffect(() => { load(); }, [load]);

  const handleReview = async (suggestionId, decision) => {
    setSubmitting(suggestionId);
    try {
      await api.adminReviewSuggestion(
        { suggestionId, adminId: userId, decision, notes: notes[suggestionId] || "" },
        token
      );
      setSuggestions(prev =>
        prev.map(s => s.id === suggestionId ? { ...s, status: decision } : s)
      );
      setReviewing(null);
      setSuccess(`Suggestion ${decision.toLowerCase()} successfully`);
      setTimeout(() => setSuccess(""), 3000);
    } catch (e) { setError(e.message); }
    finally { setSubmitting(null); }
  };

  const filtered = suggestions.filter(s => filter === "ALL" || s.status === filter);

  return (
    <div style={S.tabContent}>
      <div style={S.tabHeader}>
        <h2 style={S.tabTitle}>Suggestions <span style={S.countBadge}>{suggestions.length}</span></h2>
      </div>

      <div style={S.pills}>
        {FILTERS.map(f => (
          <button key={f} onClick={() => setFilter(f)}
            style={{ ...S.pill, ...(filter === f ? S.pillActive : {}) }}>
            {f}
            {f !== "ALL" && (
              <span style={S.pillCount}>
                {suggestions.filter(s => s.status === f).length}
              </span>
            )}
          </button>
        ))}
      </div>

      {success && <div style={S.successBanner}>✅ {success}</div>}
      {error   && <ErrorMsg msg={error} onRetry={load} />}
      {loading && <Loader />}

      {!loading && (
        <div style={S.suggestionsList}>
          {filtered.length === 0 && (
            <div style={S.emptyState}>No {filter.toLowerCase()} suggestions</div>
          )}
          {filtered.map(s => (
            <div key={s.id} style={S.suggestionCard}>
              <div style={S.suggestionTop}>
                <div>
                  <p style={S.suggestionName}>{s.recipeName}</p>
                  <p style={S.suggestionMeta}>
                    by {s.userEmail || `User #${s.userId}`} •{" "}
                    {s.createdAt ? new Date(s.createdAt).toLocaleDateString("en-IN") : ""}
                  </p>
                </div>
                <Badge status={s.status} />
              </div>

              {s.description && <p style={S.suggestionDesc}>{s.description}</p>}

              {s.ingredients?.length > 0 && (
                <div style={S.ingredientTags}>
                  {s.ingredients.map((ing, i) => (
                    <span key={i} style={S.ingTag}>{ing}</span>
                  ))}
                </div>
              )}

              {s.status === "PENDING" && (
                <div style={S.reviewSection}>
                  <textarea
                    style={S.notesInput}
                    placeholder="Add review notes (optional)…"
                    value={notes[s.id] || ""}
                    onChange={e => setNotes(prev => ({ ...prev, [s.id]: e.target.value }))}
                    rows={2}
                  />
                  <div style={S.reviewBtns}>
                    <button
                      onClick={() => handleReview(s.id, "APPROVED")}
                      disabled={submitting === s.id}
                      style={{ ...S.approveBtn, ...(submitting === s.id ? S.updateBtnDisabled : {}) }}
                    >
                      {submitting === s.id ? "…" : "✓ Approve"}
                    </button>
                    <button
                      onClick={() => handleReview(s.id, "REJECTED")}
                      disabled={submitting === s.id}
                      style={{ ...S.rejectBtn, ...(submitting === s.id ? S.updateBtnDisabled : {}) }}
                    >
                      {submitting === s.id ? "…" : "✕ Reject"}
                    </button>
                  </div>
                </div>
              )}

              {s.adminNotes && s.status !== "PENDING" && (
                <p style={S.adminNoteDisplay}>💬 {s.adminNotes}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
//  TAB: Users
// ════════════════════════════════════════════════════════════════════════════
function TabUsers({ token }) {
  const [users, setUsers]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState("");
  const [search, setSearch]   = useState("");

  const load = useCallback(async () => {
    setLoading(true); setError("");
    try { setUsers(await api.adminGetUsers(token)); }
    catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }, [token]);

  useEffect(() => { load(); }, [load]);

  const filtered = users.filter(u =>
    !search ||
    u.name?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={S.tabContent}>
      <div style={S.tabHeader}>
        <h2 style={S.tabTitle}>Users <span style={S.countBadge}>{users.length}</span></h2>
        <input style={S.searchInput} placeholder="Search name or email…" value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {error   && <ErrorMsg msg={error} onRetry={load} />}
      {loading && <Loader />}

      {!loading && (
        <div style={S.card}>
          <table style={S.table}>
            <thead>
              <tr>
                {["ID", "Name", "Email", "Phone", "Role", "Joined"].map(h => (
                  <th key={h} style={S.th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr><td colSpan={6} style={{ ...S.td, textAlign: "center", color: "#aaa" }}>No users found</td></tr>
              )}
              {filtered.map((u, i) => (
                <tr key={u.id} style={i % 2 === 0 ? S.trEven : {}}>
                  <td style={S.td}>{u.id}</td>
                  <td style={S.td}>{u.name || "—"}</td>
                  <td style={S.td}>{u.email}</td>
                  <td style={S.td}>{u.phone || "—"}</td>
                  <td style={S.td}><Badge status={u.role || "USER"} /></td>
                  <td style={S.td}>{u.createdAt ? new Date(u.createdAt).toLocaleDateString("en-IN") : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
//  MAIN: AdminApp
// ════════════════════════════════════════════════════════════════════════════
const TABS = [
  { id: "dashboard",   label: "Dashboard",  icon: "📊" },
  { id: "orders",      label: "Orders",     icon: "📦" },
  { id: "inventory",   label: "Inventory",  icon: "🏪" },
  { id: "suggestions", label: "Suggestions",icon: "💡" },
  { id: "users",       label: "Users",      icon: "👥" },
];

export default function AdminApp({ onLogout }) {
  const { token, userId, role } = useAdminAuth();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(true);

  if (!token || role !== "ADMIN") {
    return (
      <div style={S.accessDenied}>
        <p style={{ fontSize: 48 }}>🔒</p>
        <h2 style={{ color: "#1d1d1d", margin: "12px 0 8px" }}>Access Restricted</h2>
        <p style={{ color: "#888" }}>Admin privileges required</p>
        <button onClick={onLogout} style={S.logoutBtn}>Back to Login</button>
      </div>
    );
  }

  const renderTab = () => {
    switch (activeTab) {
      case "dashboard":   return <TabDashboard   token={token} />;
      case "orders":      return <TabOrders      token={token} userId={userId} />;
      case "inventory":   return <TabInventory   token={token} userId={userId} />;
      case "suggestions": return <TabSuggestions token={token} userId={userId} />;
      case "users":       return <TabUsers       token={token} />;
      default:            return null;
    }
  };

  return (
    <div style={S.shell}>
      {/* Sidebar */}
      <aside style={{ ...S.sidebar, ...(sidebarOpen ? {} : S.sidebarCollapsed) }}>
        <div style={S.sidebarTop}>
          <div style={S.sidebarBrand}>
            <span style={S.brandIcon}>🍱</span>
            {sidebarOpen && <span style={S.brandName}>RasoiKit</span>}
          </div>
          {sidebarOpen && <span style={S.adminLabel}>Admin Panel</span>}
        </div>

        <nav style={S.nav}>
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                ...S.navBtn,
                ...(activeTab === tab.id ? S.navBtnActive : {}),
              }}
              title={!sidebarOpen ? tab.label : undefined}
            >
              <span style={S.navIcon}>{tab.icon}</span>
              {sidebarOpen && <span style={S.navLabel}>{tab.label}</span>}
            </button>
          ))}
        </nav>

        <div style={S.sidebarBottom}>
          <button onClick={() => setSidebarOpen(v => !v)} style={S.collapseBtn}>
            {sidebarOpen ? "◀" : "▶"}
          </button>
          {sidebarOpen && (
            <button onClick={onLogout} style={S.logoutSidebar}>
              🚪 Logout
            </button>
          )}
        </div>
      </aside>

      {/* Main content */}
      <main style={S.main}>
        <div style={S.topbar}>
          <div>
            <h1 style={S.topbarTitle}>
              {TABS.find(t => t.id === activeTab)?.icon}{" "}
              {TABS.find(t => t.id === activeTab)?.label}
            </h1>
          </div>
          <div style={S.topbarRight}>
            <span style={S.adminTag}>Admin</span>
            <span style={S.adminId}>ID #{userId}</span>
          </div>
        </div>

        {renderTab()}
      </main>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeIn { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }
        * { box-sizing: border-box; }
        body { margin: 0; }
        table { border-collapse: collapse; }
        select:focus, input:focus, textarea:focus { outline: 2px solid #fc8019; outline-offset: 1px; }
      `}</style>
    </div>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────
const S = {
  shell: { display: "flex", minHeight: "100vh", fontFamily: "'Segoe UI',system-ui,sans-serif", background: "#f7f8fa" },

  // Sidebar
  sidebar: { width: 220, background: "#1a1a2e", display: "flex", flexDirection: "column", transition: "width .25s", flexShrink: 0 },
  sidebarCollapsed: { width: 64 },
  sidebarTop: { padding: "20px 16px 12px", borderBottom: "1px solid rgba(255,255,255,.08)" },
  sidebarBrand: { display: "flex", alignItems: "center", gap: 10, marginBottom: 4 },
  brandIcon: { fontSize: 24 },
  brandName: { fontSize: 17, fontWeight: 700, color: "#fff", letterSpacing: "-0.3px" },
  adminLabel: { fontSize: 11, color: "rgba(255,255,255,.4)", textTransform: "uppercase", letterSpacing: "1px" },
  nav: { flex: 1, padding: "12px 8px", display: "flex", flexDirection: "column", gap: 4 },
  navBtn: {
    display: "flex", alignItems: "center", gap: 12, padding: "10px 12px",
    borderRadius: 10, border: "none", background: "transparent",
    color: "rgba(255,255,255,.6)", fontSize: 14, fontWeight: 500,
    cursor: "pointer", transition: "background .15s, color .15s", width: "100%", textAlign: "left",
  },
  navBtnActive: { background: "rgba(252,128,25,.18)", color: "#fc8019", fontWeight: 700 },
  navIcon: { fontSize: 18, flexShrink: 0 },
  navLabel: { whiteSpace: "nowrap" },
  sidebarBottom: { padding: "12px 8px", borderTop: "1px solid rgba(255,255,255,.08)", display: "flex", flexDirection: "column", gap: 8 },
  collapseBtn: { background: "rgba(255,255,255,.06)", border: "none", color: "rgba(255,255,255,.5)", borderRadius: 8, padding: "8px", cursor: "pointer", fontSize: 12, alignSelf: "flex-start" },
  logoutSidebar: { background: "rgba(229,57,53,.15)", border: "none", color: "#ef9a9a", borderRadius: 8, padding: "9px 12px", cursor: "pointer", fontSize: 13, fontWeight: 600, textAlign: "left" },

  // Main
  main: { flex: 1, display: "flex", flexDirection: "column", overflow: "auto" },
  topbar: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 24px", background: "#fff", borderBottom: "1px solid #f0f0f0", position: "sticky", top: 0, zIndex: 10 },
  topbarTitle: { fontSize: 20, fontWeight: 700, color: "#1d1d1d", margin: 0 },
  topbarRight: { display: "flex", alignItems: "center", gap: 10 },
  adminTag: { background: "#fff3e0", color: "#e65100", fontSize: 12, fontWeight: 700, padding: "4px 10px", borderRadius: 20 },
  adminId: { fontSize: 13, color: "#aaa" },

  // Tab content
  tabContent: { padding: "24px", animation: "fadeIn .3s ease" },
  tabHeader: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20, flexWrap: "wrap", gap: 12 },
  tabTitle: { fontSize: 18, fontWeight: 700, color: "#1d1d1d", margin: 0 },
  countBadge: { marginLeft: 8, background: "#f0f0f0", color: "#666", fontSize: 12, fontWeight: 700, padding: "2px 8px", borderRadius: 20, verticalAlign: "middle" },

  // Controls
  searchInput: { padding: "9px 14px", borderRadius: 10, border: "1.5px solid #e5e5e5", fontSize: 14, color: "#1d1d1d", background: "#fafafa", minWidth: 220 },
  segmented: { display: "flex", background: "#f0f0f0", borderRadius: 10, padding: 3, gap: 2 },
  segBtn: { padding: "7px 16px", borderRadius: 8, border: "none", background: "transparent", fontSize: 13, fontWeight: 600, color: "#888", cursor: "pointer" },
  segBtnActive: { background: "#fff", color: "#fc8019", boxShadow: "0 1px 4px rgba(0,0,0,.08)" },

  // Pills
  pills: { display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" },
  pill: { padding: "6px 16px", borderRadius: 20, border: "1.5px solid #e5e5e5", background: "#fff", color: "#555", fontSize: 13, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 },
  pillActive: { background: "#fc8019", borderColor: "#fc8019", color: "#fff" },
  pillCount: { background: "rgba(255,255,255,.25)", borderRadius: 10, fontSize: 11, padding: "1px 6px" },

  // Card / Table
  card: { background: "#fff", borderRadius: 14, boxShadow: "0 2px 12px rgba(0,0,0,.06)", overflow: "hidden" },
  cardTitle: { fontSize: 14, fontWeight: 700, color: "#1d1d1d", margin: "0 0 16px", padding: "20px 20px 0" },
  table: { width: "100%", fontSize: 13 },
  th: { padding: "12px 16px", textAlign: "left", fontSize: 11, fontWeight: 700, color: "#aaa", textTransform: "uppercase", letterSpacing: "0.6px", borderBottom: "1px solid #f0f0f0", background: "#fafafa" },
  td: { padding: "12px 16px", color: "#1d1d1d", borderBottom: "1px solid #f7f7f7", verticalAlign: "middle" },
  trEven: { background: "#fdfdfd" },
  badge: { padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.4px" },

  // Stat cards
  statsGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(180px,1fr))", gap: 14, marginBottom: 24 },
  statCard: { background: "#fff", borderRadius: 14, padding: "18px 16px", boxShadow: "0 2px 10px rgba(0,0,0,.06)", display: "flex", alignItems: "center", gap: 14 },
  statIcon: { fontSize: 28 },
  statVal: { fontSize: 22, fontWeight: 800, color: "#1d1d1d", margin: "0 0 2px" },
  statLabel: { fontSize: 12, color: "#888", margin: "0 0 2px", fontWeight: 600 },
  statSub: { fontSize: 11, color: "#bbb", margin: 0 },

  // Inventory
  stockRow: { display: "flex", gap: 6, alignItems: "center" },
  stockInput: { width: 80, padding: "6px 8px", borderRadius: 8, border: "1.5px solid #e5e5e5", fontSize: 13, color: "#1d1d1d" },
  updateBtn: { padding: "6px 12px", borderRadius: 8, border: "none", background: "#fc8019", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer" },
  updateBtnDisabled: { opacity: 0.5, cursor: "not-allowed" },
  lowStockCell: { color: "#e53935", fontWeight: 700 },
  select: { padding: "6px 8px", borderRadius: 8, border: "1.5px solid #e5e5e5", fontSize: 13, color: "#1d1d1d", cursor: "pointer" },
  inlineSpinner: { width: 14, height: 14, border: "2px solid #ddd", borderTopColor: "#fc8019", borderRadius: "50%", animation: "spin .7s linear infinite", display: "inline-block", marginLeft: 6, verticalAlign: "middle" },

  // Suggestions
  suggestionsList: { display: "flex", flexDirection: "column", gap: 12 },
  suggestionCard: { background: "#fff", borderRadius: 14, padding: 20, boxShadow: "0 2px 10px rgba(0,0,0,.06)" },
  suggestionTop: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 },
  suggestionName: { fontSize: 15, fontWeight: 700, color: "#1d1d1d", margin: "0 0 4px" },
  suggestionMeta: { fontSize: 12, color: "#aaa", margin: 0 },
  suggestionDesc: { fontSize: 13, color: "#555", margin: "0 0 12px", lineHeight: 1.6 },
  ingredientTags: { display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 12 },
  ingTag: { background: "#fff8f0", color: "#fc8019", border: "1px solid #ffe0b2", borderRadius: 6, padding: "3px 10px", fontSize: 12, fontWeight: 600 },
  reviewSection: { borderTop: "1px solid #f5f5f5", paddingTop: 14, display: "flex", flexDirection: "column", gap: 10 },
  notesInput: { width: "100%", padding: "10px 12px", borderRadius: 10, border: "1.5px solid #e5e5e5", fontSize: 13, color: "#1d1d1d", resize: "vertical", fontFamily: "inherit" },
  reviewBtns: { display: "flex", gap: 10 },
  approveBtn: { flex: 1, padding: "10px", borderRadius: 10, border: "none", background: "#2e7d32", color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer" },
  rejectBtn:  { flex: 1, padding: "10px", borderRadius: 10, border: "none", background: "#c62828", color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer" },
  adminNoteDisplay: { fontSize: 13, color: "#888", margin: "10px 0 0", fontStyle: "italic" },

  // Feedback banners
  alertBanner: { background: "#fff3e0", border: "1px solid #ffe0b2", borderRadius: 10, padding: "12px 16px", color: "#e65100", fontSize: 13, fontWeight: 500, marginBottom: 16 },
  successBanner: { background: "#e8f5e9", border: "1px solid #c8e6c9", borderRadius: 10, padding: "12px 16px", color: "#2e7d32", fontSize: 13, fontWeight: 600, marginBottom: 16 },

  // Loader / Error
  loaderWrap: { display: "flex", justifyContent: "center", padding: "48px 0" },
  spinner: { width: 32, height: 32, border: "3px solid #f0f0f0", borderTopColor: "#fc8019", borderRadius: "50%", animation: "spin .7s linear infinite", display: "inline-block" },
  errorBox: { background: "#fff3f3", border: "1px solid #ffcdd2", borderRadius: 10, padding: "12px 16px", color: "#c62828", fontSize: 14, marginBottom: 16, display: "flex", justifyContent: "space-between", alignItems: "center" },
  retryBtn: { background: "#c62828", border: "none", color: "#fff", borderRadius: 8, padding: "6px 14px", fontSize: 13, fontWeight: 600, cursor: "pointer" },
  emptyState: { textAlign: "center", padding: "48px", color: "#aaa", fontSize: 15 },

  // Access denied
  accessDenied: { minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", fontFamily: "'Segoe UI',system-ui,sans-serif" },
  logoutBtn: { marginTop: 20, padding: "12px 28px", borderRadius: 12, border: "none", background: "#fc8019", color: "#fff", fontSize: 15, fontWeight: 700, cursor: "pointer" },

  // Modal
  modalOverlay: { position: "fixed", inset: 0, background: "rgba(0,0,0,.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 999 },
  modal: { background: "#fff", borderRadius: 16, padding: "28px 24px", maxWidth: 360, width: "90%" },
  modalTitle: { fontSize: 16, fontWeight: 700, color: "#1d1d1d", margin: "0 0 20px" },
  modalBtns: { display: "flex", gap: 12 },
  modalCancel: { flex: 1, padding: 12, borderRadius: 10, border: "1.5px solid #e5e5e5", background: "#fff", color: "#1d1d1d", fontSize: 14, fontWeight: 600, cursor: "pointer" },
  modalConfirm: { flex: 1, padding: 12, borderRadius: 10, border: "none", background: "#fc8019", color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer" },
};
