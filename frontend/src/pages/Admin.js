import React, { useEffect, useState } from "react";
import {
  getItems,
  createItem,
  updateItem,
  deleteItem,
  getOrders,
  updateOrder,
  verifyReturnImage,
} from "../api/api";

const EMPTY_FORM = {
  name: "",
  description: "",
  category: "",
  pricePerDay: "",
  depositAmount: "",
  quantity: 1,
  imageUrl: "",
  condition: "Good",
  available: true,
};

const CATEGORIES = [
  "Clothing",
  "Power Tools",
  "Pumps",
  "Construction",
  "Electrical",
  "Cleaning Equipment",
];
const CONDITIONS = ["Excellent", "Good", "Fair"];
const ORDER_STATUSES = ["Pending", "Confirmed", "Returned", "Cancelled"];
const SIDES = [
  { key: "front", label: "Front" },
  { key: "back", label: "Back" },
  { key: "left", label: "Left" },
  { key: "right", label: "Right" },
];
const PHOTO_PHASES = [
  { key: "before", label: "Delivery Photo", timing: "delivery" },
  { key: "after", label: "Return Photo", timing: "return" },
];

const buildEmptyInspection = () => ({
  beforeFrontFile: null,
  beforeFrontUrl: "",
  beforeBackFile: null,
  beforeBackUrl: "",
  beforeLeftFile: null,
  beforeLeftUrl: "",
  beforeRightFile: null,
  beforeRightUrl: "",
  afterFrontFile: null,
  afterFrontUrl: "",
  afterBackFile: null,
  afterBackUrl: "",
  afterLeftFile: null,
  afterLeftUrl: "",
  afterRightFile: null,
  afterRightUrl: "",
  status: "pending",
  result: "",
  metrics: "",
  metricsRaw: null,
  checkedAt: null,
});

const getPhaseKeys = (phaseKey, sideKey) => {
  const normalized = String(sideKey || "");
  const cap = normalized.charAt(0).toUpperCase() + normalized.slice(1);
  return {
    fileKey: `${phaseKey}${cap}File`,
    urlKey: `${phaseKey}${cap}Url`,
  };
};

function Admin() {
  const [tab, setTab] = useState("items"); // 'items' | 'add' | 'orders'
  const [items, setItems] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingItem, setEditingItem] = useState(null); // item being edited
  const [form, setForm] = useState(EMPTY_FORM);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [submitting, setSubmitting] = useState(false);
  const [inspections, setInspections] = useState({});
  const [openInspectionId, setOpenInspectionId] = useState(null);

  useEffect(() => {
    if (tab === "items" || tab === "add") fetchItems();
    if (tab === "orders") fetchOrders();
  }, [tab]);

  const fetchItems = async () => {
    setLoading(true);
    try {
      const res = await getItems();
      setItems(res.data);
    } catch {
      showMessage("error", "Failed to load items.");
    } finally {
      setLoading(false);
    }
  };

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await getOrders();
      setOrders(res.data);
    } catch {
      showMessage("error", "Failed to load orders.");
    } finally {
      setLoading(false);
    }
  };

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: "", text: "" }), 4000);
  };

  const handleFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm({ ...form, [name]: type === "checkbox" ? checked : value });
  };

  // ---- EDIT ITEM ----
  const startEdit = (item) => {
    setEditingItem(item._id);
    setForm({
      name: item.name,
      description: item.description,
      category: item.category,
      pricePerDay: item.pricePerDay,
      depositAmount: item.depositAmount,
      quantity: item.quantity,
      imageUrl: item.imageUrl || "",
      condition: item.condition,
      available: item.available,
    });
    setTab("add");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const cancelEdit = () => {
    setEditingItem(null);
    setForm(EMPTY_FORM);
    setTab("items");
  };

  // ---- SUBMIT FORM (add or edit) ----
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        ...form,
        pricePerDay: Number(form.pricePerDay),
        depositAmount: Number(form.depositAmount),
        quantity: Number(form.quantity),
      };

      if (editingItem) {
        await updateItem(editingItem, payload);
        showMessage("success", "Item updated successfully.");
        setEditingItem(null);
      } else {
        await createItem(payload);
        showMessage("success", "Item added successfully.");
      }

      setForm(EMPTY_FORM);
      setTab("items");
    } catch (err) {
      showMessage("error", err.response?.data?.error || "Operation failed.");
    } finally {
      setSubmitting(false);
    }
  };

  // ---- DELETE ITEM ----
  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete "${name}"? This cannot be undone.`)) return;
    try {
      await deleteItem(id);
      setItems(items.filter((i) => i._id !== id));
      showMessage("success", `"${name}" deleted.`);
    } catch {
      showMessage("error", "Failed to delete item.");
    }
  };

  // ---- TOGGLE AVAILABILITY ----
  const toggleAvailability = async (item) => {
    try {
      const updated = await updateItem(item._id, {
        available: !item.available,
      });
      setItems(items.map((i) => (i._id === item._id ? updated.data : i)));
    } catch {
      showMessage("error", "Failed to update availability.");
    }
  };

  // ---- UPDATE ORDER STATUS ----
  const handleOrderStatusChange = async (orderId, status) => {
    try {
      const res = await updateOrder(orderId, { status });
      setOrders(orders.map((o) => (o._id === orderId ? res.data : o)));
      showMessage("success", `Order status updated to "${status}".`);
    } catch {
      showMessage("error", "Failed to update order status.");
    }
  };

  const toggleInspection = (orderId) => {
    setOpenInspectionId((prev) => (prev === orderId ? null : orderId));
  };

  const updateInspection = (orderId, patch) => {
    setInspections((prev) => {
      const current = prev[orderId] || buildEmptyInspection();
      const next = { ...current, ...patch };
      return { ...prev, [orderId]: next };
    });
  };

  const isInspectionReady = (inspection) => {
    return PHOTO_PHASES.every((phase) =>
      SIDES.every((side) => {
        const { fileKey } = getPhaseKeys(phase.key, side.key);
        return Boolean(inspection?.[fileKey]);
      }),
    );
  };

  const handlePhotoUpload = (orderId, phaseKey, sideKey, file) => {
    const { fileKey, urlKey } = getPhaseKeys(phaseKey, sideKey);

    setInspections((prev) => {
      const current = prev[orderId] || buildEmptyInspection();

      if (current[urlKey]) {
        URL.revokeObjectURL(current[urlKey]);
      }

      const next = {
        ...current,
        [fileKey]: file,
        [urlKey]: file ? URL.createObjectURL(file) : "",
        result: "",
        metrics: "",
        metricsRaw: null,
        checkedAt: null,
      };

      next.status = isInspectionReady(next) ? "ready" : "pending";

      return { ...prev, [orderId]: next };
    });
  };

  const clearInspection = (orderId) => {
    setInspections((prev) => {
      const current = prev[orderId];
      if (current) {
        PHOTO_PHASES.forEach((phase) => {
          SIDES.forEach((side) => {
            const { urlKey } = getPhaseKeys(phase.key, side.key);
            if (current[urlKey]) {
              URL.revokeObjectURL(current[urlKey]);
            }
          });
        });
      }
      const next = { ...prev };
      delete next[orderId];
      return next;
    });
  };

  const formatMetrics = (metrics) => {
    if (!metrics || typeof metrics !== "object") return "";
    const parts = [];
    if (Object.prototype.hasOwnProperty.call(metrics, "damage_detected")) {
      parts.push(`damage_detected: ${metrics.damage_detected}`);
    }
    if (Object.prototype.hasOwnProperty.call(metrics, "damage_score")) {
      parts.push(`damage_score: ${metrics.damage_score}`);
    }
    if (Object.prototype.hasOwnProperty.call(metrics, "similarity")) {
      parts.push(`similarity: ${metrics.similarity}`);
    }
    if (Object.prototype.hasOwnProperty.call(metrics, "similarity_score")) {
      parts.push(`similarity_score: ${metrics.similarity_score}`);
    }
    if (metrics.scores && typeof metrics.scores === "object") {
      const scoreText = ["Front", "Back", "Left", "Right"]
        .filter((side) => typeof metrics.scores[side] === "number")
        .map((side) => `${side}: ${metrics.scores[side]}%`)
        .join(", ");
      if (scoreText) {
        parts.push(`scores: ${scoreText}`);
      }
    }
    if (parts.length > 0) return parts.join(" | ");
    return JSON.stringify(metrics);
  };

  const clampValue = (value, min, max) => {
    return Math.min(Math.max(value, min), max);
  };

  const getSideScores = (metrics) => {
    if (!metrics || typeof metrics !== "object") return null;
    const rawScores = metrics.scores;
    if (!rawScores || typeof rawScores !== "object") return null;

    const pick = (primary, fallback) => {
      const value = rawScores[primary] ?? rawScores[fallback];
      if (typeof value !== "number" || Number.isNaN(value)) return null;
      return clampValue(value, 0, 100);
    };

    return {
      front: pick("Front", "front"),
      back: pick("Back", "back"),
      left: pick("Left", "left"),
      right: pick("Right", "right"),
    };
  };

  const calculateAverageSimilarity = (sideScores) => {
    if (!sideScores || typeof sideScores !== "object") return null;
    const values = Object.values(sideScores).filter(
      (value) => typeof value === "number",
    );
    if (values.length === 0) return null;
    const average =
      values.reduce((sum, value) => sum + value, 0) / values.length;
    return Number(average.toFixed(2));
  };

  const calculateDamageCountFromScores = (sideScores, threshold = 90) => {
    if (!sideScores || typeof sideScores !== "object") return null;
    const values = Object.values(sideScores).filter(
      (value) => typeof value === "number",
    );
    if (values.length === 0) return null;
    return values.filter((value) => value < threshold).length;
  };

  const calculateDamagePercent = (similarityScore) => {
    if (typeof similarityScore !== "number" || Number.isNaN(similarityScore)) {
      return null;
    }
    return clampValue(100 - similarityScore, 0, 100);
  };

  const calculateDeductionPercent = (damagePercent) => {
    if (typeof damagePercent !== "number") return null;
    if (damagePercent <= 0) return 0;
    return clampValue(Math.ceil(damagePercent / 10) * 10, 0, 100);
  };

  const calculateRefundAmount = (collateralAmount, deductionPercent) => {
    if (
      typeof collateralAmount !== "number" ||
      typeof deductionPercent !== "number"
    ) {
      return null;
    }
    const deductionValue = (collateralAmount * deductionPercent) / 100;
    return Math.max(0, Math.round(collateralAmount - deductionValue));
  };

  const runScratchCheck = async (orderId) => {
    const current = inspections[orderId];
    if (!isInspectionReady(current)) return;

    updateInspection(orderId, {
      status: "checking",
      result: "Running analysis...",
      metrics: "",
      metricsRaw: null,
      checkedAt: null,
    });

    try {
      const beforeImages = {
        front: current.beforeFrontFile,
        back: current.beforeBackFile,
        left: current.beforeLeftFile,
        right: current.beforeRightFile,
      };
      const afterImages = {
        front: current.afterFrontFile,
        back: current.afterBackFile,
        left: current.afterLeftFile,
        right: current.afterRightFile,
      };
      const res = await verifyReturnImage(orderId, beforeImages, afterImages);
      const metrics = res.data?.metrics || null;
      const message = res.data?.message || "";
      const hasDamage =
        typeof metrics?.damage_detected === "boolean"
          ? metrics.damage_detected
          : /damage\s*detected/i.test(message);
      const resultText = hasDamage ? "Damage Detected" : "No Damage";
      const metricsText = formatMetrics(metrics);
      const sideScores = getSideScores(metrics);
      const similarityScore = calculateAverageSimilarity(sideScores);
      const damagePercent = calculateDamagePercent(similarityScore);
      const deductionPercent = calculateDeductionPercent(damagePercent);
      const order = orders.find((entry) => entry._id === orderId);
      const collateralAmount =
        typeof order?.collateralAmount === "number"
          ? order.collateralAmount
          : typeof order?.item?.pricePerDay === "number"
            ? order.item.pricePerDay
            : 0;
      const refundAmount = calculateRefundAmount(
        collateralAmount,
        deductionPercent,
      );

      updateInspection(orderId, {
        status: "checked",
        result: resultText,
        metrics: metricsText,
        metricsRaw: metrics,
        checkedAt: Date.now(),
      });

      if (
        typeof damagePercent === "number" &&
        typeof deductionPercent === "number" &&
        typeof refundAmount === "number"
      ) {
        const updatePayload = {
          damagePercent,
          deductionPercent,
          refundAmount,
        };

        if (!order?.collateralAmount && collateralAmount > 0) {
          updatePayload.collateralAmount = collateralAmount;
        }

        const updated = await updateOrder(orderId, updatePayload);
        setOrders((prev) =>
          prev.map((entry) => (entry._id === orderId ? updated.data : entry)),
        );
      }
    } catch (err) {
      updateInspection(orderId, {
        status: "ready",
        result: err.response?.data?.error || "Analysis failed.",
        metrics: "",
        metricsRaw: null,
        checkedAt: null,
      });
    }
  };

  return (
    <div className="admin-container">
      <div className="admin-header">
        <h1>Admin Panel</h1>
        <span style={{ fontSize: "0.85rem", color: "#64748b" }}>
          Manage your rental inventory and orders
        </span>
      </div>

      {/* Global message */}
      {message.text && (
        <div
          className={`alert alert-${message.type === "success" ? "success" : "error"}`}
        >
          {message.text}
        </div>
      )}

      {/* Tabs */}
      <div className="admin-tabs">
        <button
          className={`tab-btn ${tab === "items" ? "active" : ""}`}
          onClick={() => {
            setTab("items");
            setEditingItem(null);
            setForm(EMPTY_FORM);
          }}
        >
          Manage Items
        </button>
        <button
          className={`tab-btn ${tab === "add" ? "active" : ""}`}
          onClick={() => {
            setTab("add");
            if (!editingItem) setForm(EMPTY_FORM);
          }}
        >
          {editingItem ? "Edit Item" : "Add Item"}
        </button>
        <button
          className={`tab-btn ${tab === "orders" ? "active" : ""}`}
          onClick={() => setTab("orders")}
        >
          Orders
        </button>
      </div>

      {/* ======== MANAGE ITEMS TAB ======== */}
      {tab === "items" && (
        <>
          {loading ? (
            <div className="loading-state">
              <div className="loading-spinner" />
              <p>Loading items...</p>
            </div>
          ) : (
            <div className="admin-table-wrapper">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Image</th>
                    <th>Name</th>
                    <th>Category</th>
                    <th>Price/Day</th>
                    <th>Qty</th>
                    <th>Condition</th>
                    <th>Available</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {items.length === 0 ? (
                    <tr>
                      <td
                        colSpan={8}
                        style={{
                          textAlign: "center",
                          color: "#94a3b8",
                          padding: 32,
                        }}
                      >
                        No items found. Add some items!
                      </td>
                    </tr>
                  ) : (
                    items.map((item) => (
                      <tr key={item._id}>
                        <td>
                          <img
                            src={item.imageUrl || "/images/ws.jpeg"}
                            alt={item.name}
                            className="item-thumb"
                            onError={(e) => {
                              e.target.src = "/images/ws.jpeg";
                            }}
                          />
                        </td>
                        <td style={{ fontWeight: 600 }}>{item.name}</td>
                        <td>{item.category}</td>
                        <td>₹{item.pricePerDay.toLocaleString()}</td>
                        <td>{item.quantity}</td>
                        <td>{item.condition}</td>
                        <td>
                          <label
                            className="toggle-switch"
                            title="Toggle availability"
                          >
                            <input
                              type="checkbox"
                              checked={item.available}
                              onChange={() => toggleAvailability(item)}
                            />
                            <span className="toggle-slider" />
                          </label>
                        </td>
                        <td>
                          <div className="table-actions">
                            <button
                              className="btn btn-secondary btn-sm"
                              onClick={() => startEdit(item)}
                            >
                              Edit
                            </button>
                            <button
                              className="btn btn-danger btn-sm"
                              onClick={() => handleDelete(item._id, item.name)}
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* ======== ADD / EDIT ITEM TAB ======== */}
      {tab === "add" && (
        <div className="form-panel">
          <h2>{editingItem ? "Edit Item" : "Add New Rental Item"}</h2>
          <form onSubmit={handleSubmit}>
            <div className="form-grid">
              <div className="form-group">
                <label>Item Name *</label>
                <input
                  type="text"
                  name="name"
                  className="form-control"
                  placeholder="e.g. Electric Drill"
                  value={form.name}
                  onChange={handleFormChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>Category *</label>
                <select
                  name="category"
                  className="form-control"
                  value={form.category}
                  onChange={handleFormChange}
                  required
                >
                  <option value="">Select category</option>
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group full-width">
                <label>Description *</label>
                <textarea
                  name="description"
                  className="form-control"
                  placeholder="Describe the item..."
                  rows={3}
                  value={form.description}
                  onChange={handleFormChange}
                  required
                  style={{ resize: "vertical" }}
                />
              </div>

              <div className="form-group">
                <label>Price Per Day (₹) *</label>
                <input
                  type="number"
                  name="pricePerDay"
                  className="form-control"
                  placeholder="250"
                  min="1"
                  value={form.pricePerDay}
                  onChange={handleFormChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>Security Deposit (₹)</label>
                <input
                  type="number"
                  name="depositAmount"
                  className="form-control"
                  placeholder="1000"
                  min="0"
                  value={form.depositAmount}
                  onChange={handleFormChange}
                />
              </div>

              <div className="form-group">
                <label>Quantity *</label>
                <input
                  type="number"
                  name="quantity"
                  className="form-control"
                  min="1"
                  value={form.quantity}
                  onChange={handleFormChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>Condition</label>
                <select
                  name="condition"
                  className="form-control"
                  value={form.condition}
                  onChange={handleFormChange}
                >
                  {CONDITIONS.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group full-width">
                <label>Image URL</label>
                <input
                  type="url"
                  name="imageUrl"
                  className="form-control"
                  placeholder="https://example.com/image.jpg"
                  value={form.imageUrl}
                  onChange={handleFormChange}
                />
              </div>

              <div className="form-group">
                <label
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    cursor: "pointer",
                  }}
                >
                  <input
                    type="checkbox"
                    name="available"
                    checked={form.available}
                    onChange={handleFormChange}
                    style={{ width: 16, height: 16 }}
                  />
                  Available for Rent
                </label>
              </div>
            </div>

            <div className="form-actions">
              <button
                type="submit"
                className="btn btn-primary"
                disabled={submitting}
              >
                {submitting
                  ? "Saving..."
                  : editingItem
                    ? "Update Item"
                    : "Add Item"}
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={cancelEdit}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ======== ORDERS TAB ======== */}
      {tab === "orders" && (
        <>
          {loading ? (
            <div className="loading-state">
              <div className="loading-spinner" />
              <p>Loading orders...</p>
            </div>
          ) : (
            <div className="admin-table-wrapper">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Customer</th>
                    <th>Item</th>
                    <th>Days</th>
                    <th>Start Date</th>
                    <th>End Date</th>
                    <th>Total</th>
                    <th>Status</th>
                    <th>Inspection</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.length === 0 ? (
                    <tr>
                      <td
                        colSpan={9}
                        style={{
                          textAlign: "center",
                          color: "#94a3b8",
                          padding: 32,
                        }}
                      >
                        No orders yet.
                      </td>
                    </tr>
                  ) : (
                    orders.flatMap((order, idx) => {
                      const inspection = inspections[order._id] || {};
                      const isOpen = openInspectionId === order._id;
                      const status = inspection.status || "pending";
                      const statusLabel =
                        status === "checked"
                          ? "Checked"
                          : status === "checking"
                            ? "Checking"
                            : status === "ready"
                              ? "Ready to Check"
                              : "Pending";

                      const damageDetected =
                        inspection.metricsRaw?.damage_detected ??
                        /damage\s*detected/i.test(inspection.result || "");
                      const sideScores = getSideScores(inspection.metricsRaw);
                      const similarityScore =
                        calculateAverageSimilarity(sideScores);
                      const damageCount = Array.isArray(
                        inspection.metricsRaw?.damaged_sides,
                      )
                        ? inspection.metricsRaw.damaged_sides.length
                        : calculateDamageCountFromScores(sideScores);
                      const orderCollateral =
                        typeof order.collateralAmount === "number"
                          ? order.collateralAmount
                          : typeof order.item?.pricePerDay === "number"
                            ? order.item.pricePerDay
                            : null;
                      const orderDamagePercent =
                        typeof order.damagePercent === "number"
                          ? order.damagePercent
                          : calculateDamagePercent(similarityScore);
                      const orderDeductionPercent =
                        typeof order.deductionPercent === "number"
                          ? order.deductionPercent
                          : calculateDeductionPercent(orderDamagePercent);
                      const orderRefundAmount =
                        typeof order.refundAmount === "number"
                          ? order.refundAmount
                          : calculateRefundAmount(
                              orderCollateral || 0,
                              orderDeductionPercent,
                            );
                      const similarityPercent =
                        typeof similarityScore === "number"
                          ? Math.min(Math.max(similarityScore, 0), 100)
                          : null;

                      return [
                        <tr key={order._id}>
                          <td style={{ color: "#94a3b8" }}>{idx + 1}</td>
                          <td>
                            <div style={{ fontWeight: 600 }}>
                              {order.customerName}
                            </div>
                            <div
                              style={{ fontSize: "0.75rem", color: "#64748b" }}
                            >
                              {order.customerEmail}
                            </div>
                            <div
                              style={{ fontSize: "0.75rem", color: "#64748b" }}
                            >
                              {order.customerPhone}
                            </div>
                            {order.customerAddress && (
                              <div
                                style={{
                                  fontSize: "0.75rem",
                                  color: "#64748b",
                                }}
                              >
                                {order.customerAddress}
                              </div>
                            )}
                          </td>
                          <td style={{ fontWeight: 500 }}>{order.itemName}</td>
                          <td>{order.rentalDays}</td>
                          <td>
                            {new Date(order.startDate).toLocaleDateString()}
                          </td>
                          <td>
                            {new Date(order.endDate).toLocaleDateString()}
                          </td>
                          <td style={{ fontWeight: 600 }}>
                            ₹{order.totalAmount.toLocaleString()}
                          </td>
                          <td>
                            <select
                              className="form-control"
                              style={{
                                padding: "5px 8px",
                                fontSize: "0.8rem",
                                minWidth: 110,
                              }}
                              value={order.status}
                              onChange={(e) =>
                                handleOrderStatusChange(
                                  order._id,
                                  e.target.value,
                                )
                              }
                            >
                              {ORDER_STATUSES.map((s) => (
                                <option key={s} value={s}>
                                  {s}
                                </option>
                              ))}
                            </select>
                            <span
                              className={`status-badge status-${order.status.toLowerCase()}`}
                              style={{ marginTop: 4, display: "block" }}
                            >
                              {order.status}
                            </span>
                          </td>
                          <td>
                            <button
                              className="btn btn-secondary btn-sm"
                              onClick={() => toggleInspection(order._id)}
                            >
                              {isOpen ? "Hide" : "Inspect"}
                            </button>
                            <div className="inspection-status">
                              <span
                                className={`inspection-badge inspection-${status}`}
                              >
                                {statusLabel}
                              </span>
                            </div>
                          </td>
                        </tr>,
                        isOpen ? (
                          <tr key={`${order._id}-inspection`}>
                            <td colSpan={9} className="inspection-cell">
                              <div className="inspection-panel">
                                <div className="inspection-grid">
                                  {PHOTO_PHASES.map((phase) =>
                                    SIDES.map((side) => {
                                      const { urlKey } = getPhaseKeys(
                                        phase.key,
                                        side.key,
                                      );
                                      const previewUrl = inspection[urlKey];

                                      return (
                                        <div
                                          key={`${phase.key}-${side.key}`}
                                          className="inspection-card"
                                        >
                                          <div className="inspection-card-header">
                                            <div>
                                              <p className="inspection-title">
                                                {phase.label} ({side.label})
                                              </p>
                                              <p className="inspection-subtitle">
                                                Capture the{" "}
                                                {side.label.toLowerCase()} side
                                                at {phase.timing}.
                                              </p>
                                            </div>
                                            <label className="btn btn-primary btn-sm">
                                              Upload
                                              <input
                                                type="file"
                                                accept="image/*"
                                                capture="environment"
                                                onChange={(e) =>
                                                  handlePhotoUpload(
                                                    order._id,
                                                    phase.key,
                                                    side.key,
                                                    e.target.files?.[0] || null,
                                                  )
                                                }
                                                hidden
                                              />
                                            </label>
                                          </div>
                                          <div className="inspection-preview">
                                            {previewUrl ? (
                                              <img
                                                src={previewUrl}
                                                alt={`${phase.label} ${side.label}`}
                                              />
                                            ) : (
                                              <div className="inspection-empty">
                                                No photo uploaded
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                      );
                                    }),
                                  )}
                                </div>

                                <div className="inspection-actions">
                                  <div className="inspection-result-card">
                                    <div className="inspection-result-header">
                                      <div>
                                        <p className="inspection-result-title">
                                          Scratch Detection Result
                                        </p>
                                        <p className="inspection-result-message">
                                          {inspection.result ||
                                            "Upload all 8 side photos to enable checking."}
                                        </p>
                                      </div>
                                      {status === "checked" && (
                                        <span
                                          className={`inspection-result-pill ${
                                            damageDetected
                                              ? "inspection-result-damage"
                                              : "inspection-result-clean"
                                          }`}
                                        >
                                          {damageDetected
                                            ? "Damage Detected"
                                            : "No Damage"}
                                        </span>
                                      )}
                                    </div>

                                    <div className="inspection-result-grid">
                                      <div className="inspection-result-item">
                                        <span className="inspection-result-label">
                                          Avg Similarity
                                        </span>
                                        <span className="inspection-result-value">
                                          {typeof similarityScore === "number"
                                            ? `${similarityScore}%`
                                            : "-"}
                                        </span>
                                      </div>
                                      <div className="inspection-result-item">
                                        <span className="inspection-result-label">
                                          Damage Count
                                        </span>
                                        <span className="inspection-result-value">
                                          {typeof damageCount === "number"
                                            ? damageCount
                                            : "-"}
                                        </span>
                                      </div>
                                      <div className="inspection-result-item">
                                        <span className="inspection-result-label">
                                          Model Output
                                        </span>
                                        <span className="inspection-result-value">
                                          {inspection.metrics || "-"}
                                        </span>
                                      </div>
                                      <div className="inspection-result-item">
                                        <span className="inspection-result-label">
                                          Front
                                        </span>
                                        <span className="inspection-result-value">
                                          {typeof sideScores?.front === "number"
                                            ? `${sideScores.front}%`
                                            : "-"}
                                        </span>
                                      </div>
                                      <div className="inspection-result-item">
                                        <span className="inspection-result-label">
                                          Back
                                        </span>
                                        <span className="inspection-result-value">
                                          {typeof sideScores?.back === "number"
                                            ? `${sideScores.back}%`
                                            : "-"}
                                        </span>
                                      </div>
                                      <div className="inspection-result-item">
                                        <span className="inspection-result-label">
                                          Left
                                        </span>
                                        <span className="inspection-result-value">
                                          {typeof sideScores?.left === "number"
                                            ? `${sideScores.left}%`
                                            : "-"}
                                        </span>
                                      </div>
                                      <div className="inspection-result-item">
                                        <span className="inspection-result-label">
                                          Right
                                        </span>
                                        <span className="inspection-result-value">
                                          {typeof sideScores?.right === "number"
                                            ? `${sideScores.right}%`
                                            : "-"}
                                        </span>
                                      </div>
                                      <div className="inspection-result-item">
                                        <span className="inspection-result-label">
                                          Collateral
                                        </span>
                                        <span className="inspection-result-value">
                                          {typeof orderCollateral === "number"
                                            ? `₹${orderCollateral.toLocaleString()}`
                                            : "-"}
                                        </span>
                                      </div>
                                      <div className="inspection-result-item">
                                        <span className="inspection-result-label">
                                          Deduction
                                        </span>
                                        <span className="inspection-result-value">
                                          {typeof orderDeductionPercent ===
                                          "number"
                                            ? `${orderDeductionPercent}%`
                                            : "-"}
                                        </span>
                                      </div>
                                      <div className="inspection-result-item">
                                        <span className="inspection-result-label">
                                          Refund
                                        </span>
                                        <span className="inspection-result-value">
                                          {typeof orderRefundAmount === "number"
                                            ? `₹${orderRefundAmount.toLocaleString()}`
                                            : "-"}
                                        </span>
                                      </div>
                                    </div>

                                    {inspection.checkedAt && (
                                      <p className="inspection-meta">
                                        Checked on{" "}
                                        {new Date(
                                          inspection.checkedAt,
                                        ).toLocaleString()}
                                      </p>
                                    )}
                                  </div>

                                  <div className="inspection-side">
                                    {typeof similarityPercent === "number" && (
                                      <div className="inspection-pie-row">
                                        <div
                                          className="inspection-pie"
                                          style={{
                                            "--similarity": `${similarityPercent}%`,
                                          }}
                                        >
                                          <span className="inspection-pie-label">
                                            {Math.round(similarityPercent)}%
                                          </span>
                                        </div>
                                        <div className="inspection-pie-legend">
                                          <div className="inspection-pie-legend-item">
                                            <span className="legend-dot legend-dot-good" />
                                            Similarity
                                          </div>
                                          <div className="inspection-pie-legend-item">
                                            <span className="legend-dot legend-dot-gap" />
                                            Difference
                                          </div>
                                        </div>
                                      </div>
                                    )}

                                    <div className="inspection-action-buttons">
                                      <button
                                        className="btn btn-primary btn-sm"
                                        onClick={() =>
                                          runScratchCheck(order._id)
                                        }
                                        disabled={
                                          status === "checking" ||
                                          !isInspectionReady(inspection)
                                        }
                                      >
                                        {status === "checking"
                                          ? "Checking..."
                                          : "Run Scratch Check"}
                                      </button>
                                      <button
                                        className="btn btn-secondary btn-sm"
                                        onClick={() =>
                                          clearInspection(order._id)
                                        }
                                      >
                                        Clear
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </td>
                          </tr>
                        ) : null,
                      ].filter(Boolean);
                    })
                  )}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default Admin;
