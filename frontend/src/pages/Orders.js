import React, { useEffect, useState } from "react";
import { getMyOrders } from "../api/api";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import "../styles/Orders.css";

function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }

    fetchOrders();
  }, [isAuthenticated, navigate]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await getMyOrders();
      setOrders(res.data);
    } catch (err) {
      setError("Failed to load orders. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusColors = {
      Pending: "badge-pending",
      Confirmed: "badge-confirmed",
      Returned: "badge-returned",
      Cancelled: "badge-cancelled",
    };

    return (
      <span className={`order-badge ${statusColors[status]}`}>{status}</span>
    );
  };

  if (loading) {
    return (
      <div className="loading-state">
        <div className="loading-spinner" />
        <p>Loading your orders...</p>
      </div>
    );
  }

  return (
    <div className="orders-page">
      <div className="orders-header">
        <h1>My Orders</h1>
        <p>Track your rental orders and their status</p>
      </div>

      {error && <div className="error-banner">{error}</div>}

      {orders.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📦</div>
          <h2>No orders yet</h2>
          <p>When you rent items, they will appear here.</p>
          <button className="btn btn-primary" onClick={() => navigate("/")}>
            Browse Items
          </button>
        </div>
      ) : (
        <div className="orders-list">
          {orders.map((order) => (
            <div key={order._id} className="order-card">
              <div className="order-card-header">
                <div className="order-info">
                  <h3>{order.itemName}</h3>
                  <p className="order-date">
                    Ordered on{" "}
                    {new Date(order.createdAt).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                </div>
                {getStatusBadge(order.status)}
              </div>

              <div className="order-card-body">
                <div className="order-detail-row">
                  <span className="detail-label">Rental Period:</span>
                  <span className="detail-value">
                    {new Date(order.startDate).toLocaleDateString()} -{" "}
                    {new Date(order.endDate).toLocaleDateString()}
                  </span>
                </div>

                <div className="order-detail-row">
                  <span className="detail-label">Rental Days:</span>
                  <span className="detail-value">{order.rentalDays} days</span>
                </div>

                <div className="order-detail-row">
                  <span className="detail-label">Total Amount:</span>
                  <span className="detail-value detail-amount">
                    ₹{order.totalAmount.toLocaleString()}
                  </span>
                </div>

                {order.collateralAmount > 0 && (
                  <div className="order-detail-row">
                    <span className="detail-label">Collateral:</span>
                    <span className="detail-value">
                      ₹{order.collateralAmount.toLocaleString()}
                    </span>
                  </div>
                )}

                {order.depositAmount > 0 && (
                  <div className="order-detail-row">
                    <span className="detail-label">Deposit:</span>
                    <span className="detail-value">
                      ₹{order.depositAmount.toLocaleString()}
                    </span>
                  </div>
                )}

                {order.status === "Returned" &&
                  typeof order.refundAmount === "number" && (
                    <div className="order-detail-row">
                      <span className="detail-label">Collateral Refund:</span>
                      <span className="detail-value">
                        ₹{order.refundAmount.toLocaleString()}
                      </span>
                    </div>
                  )}

                {order.status === "Returned" &&
                  typeof order.deductionPercent === "number" && (
                    <div className="order-detail-row">
                      <span className="detail-label">Damage Deduction:</span>
                      <span className="detail-value">
                        {order.deductionPercent}%
                      </span>
                    </div>
                  )}

                <div className="order-detail-row">
                  <span className="detail-label">Contact:</span>
                  <span className="detail-value">
                    {order.customerName} • {order.customerEmail}
                  </span>
                </div>

                {order.customerAddress && (
                  <div className="order-detail-row">
                    <span className="detail-label">Address:</span>
                    <span className="detail-value">
                      {order.customerAddress}
                    </span>
                  </div>
                )}
              </div>

              {order.status === "Confirmed" && (
                <div className="order-status-message success">
                  Your order has been confirmed! The item will be ready for
                  pickup on the start date.
                </div>
              )}

              {order.status === "Pending" && (
                <div className="order-status-message info">
                  Your order is pending approval. We'll notify you once it's
                  confirmed.
                </div>
              )}

              {order.status === "Returned" && (
                <div className="order-status-message neutral">
                  This rental has been completed and the item has been returned.
                </div>
              )}

              {order.status === "Cancelled" && (
                <div className="order-status-message error">
                  This order has been cancelled.
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Orders;
