import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
  getItem,
  createOrder,
  getReviews,
  createReview,
  getRecommendations,
} from "../api/api";
import ItemCard, { StarRating } from "../components/ItemCard";

const PLACEHOLDER = "/images/ws.jpeg";

function ItemDetail() {
  const { id } = useParams();
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [orderError, setOrderError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [paymentError, setPaymentError] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("card");
  const [paymentForm, setPaymentForm] = useState({
    cardName: "",
    cardNumber: "",
    expiry: "",
    cvv: "",
  });

  // Reviews state
  const [reviews, setReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [reviewForm, setReviewForm] = useState({
    reviewerName: "",
    rating: 5,
    comment: "",
  });
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewError, setReviewError] = useState("");
  const [reviewSuccess, setReviewSuccess] = useState(false);
  const [hoveredStar, setHoveredStar] = useState(0);

  // Recommendations state
  const [recommendations, setRecommendations] = useState([]);
  const [recommendationsLoading, setRecommendationsLoading] = useState(false);
  const [recommendationsError, setRecommendationsError] = useState("");

  const today = new Date().toISOString().split("T")[0];

  const [form, setForm] = useState({
    customerName: "",
    customerEmail: "",
    customerPhone: "",
    customerAddress: "",
    startDate: today,
    rentalDays: 1,
  });

  useEffect(() => {
    fetchItem();
    fetchReviews();
    fetchRecommendations();
  }, [id]);

  const fetchReviews = async () => {
    try {
      setReviewsLoading(true);
      const res = await getReviews(id);
      setReviews(res.data);
    } catch {
      // silently ignore
    } finally {
      setReviewsLoading(false);
    }
  };

  const fetchItem = async () => {
    try {
      setLoading(true);
      const res = await getItem(id);
      setItem(res.data);
    } catch {
      setError("Item not found.");
    } finally {
      setLoading(false);
    }
  };

  const fetchRecommendations = async () => {
    try {
      setRecommendationsLoading(true);
      setRecommendationsError("");
      const res = await getRecommendations(id);
      setRecommendations(res.data?.recommendations || []);
    } catch (err) {
      setRecommendationsError(
        err.response?.data?.error || "Failed to load recommendations.",
      );
    } finally {
      setRecommendationsLoading(false);
    }
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const totalAmount = item ? item.pricePerDay * Number(form.rentalDays) : 0;
  const totalPayable = item ? totalAmount + item.depositAmount : 0;
  const qrPayload = `rentease:${id}:${totalPayable}`;
  const qrSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="220" height="220" viewBox="0 0 220 220">
  <rect width="220" height="220" fill="#ffffff"/>
  <rect x="12" y="12" width="56" height="56" fill="#0b1f1a"/>
  <rect x="20" y="20" width="40" height="40" fill="#ffffff"/>
  <rect x="28" y="28" width="24" height="24" fill="#0b1f1a"/>
  <rect x="152" y="12" width="56" height="56" fill="#0b1f1a"/>
  <rect x="160" y="20" width="40" height="40" fill="#ffffff"/>
  <rect x="168" y="28" width="24" height="24" fill="#0b1f1a"/>
  <rect x="12" y="152" width="56" height="56" fill="#0b1f1a"/>
  <rect x="20" y="160" width="40" height="40" fill="#ffffff"/>
  <rect x="28" y="168" width="24" height="24" fill="#0b1f1a"/>
  <rect x="92" y="92" width="16" height="16" fill="#0b1f1a"/>
  <rect x="112" y="92" width="16" height="16" fill="#0b1f1a"/>
  <rect x="132" y="92" width="16" height="16" fill="#0b1f1a"/>
  <rect x="92" y="112" width="16" height="16" fill="#0b1f1a"/>
  <rect x="132" y="112" width="16" height="16" fill="#0b1f1a"/>
  <rect x="92" y="132" width="16" height="16" fill="#0b1f1a"/>
  <rect x="112" y="132" width="16" height="16" fill="#0b1f1a"/>
  <rect x="152" y="132" width="16" height="16" fill="#0b1f1a"/>
  <rect x="112" y="152" width="16" height="16" fill="#0b1f1a"/>
  <rect x="132" y="152" width="16" height="16" fill="#0b1f1a"/>
  <rect x="152" y="152" width="16" height="16" fill="#0b1f1a"/>
  <text x="110" y="208" font-size="10" text-anchor="middle" fill="#6f7f79">${qrPayload}</text>
  </svg>`;
  const qrDataUri = `data:image/svg+xml;utf8,${encodeURIComponent(qrSvg)}`;
  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(qrPayload)}`;

  const validateOrderForm = () => {
    if (
      !form.customerName ||
      !form.customerEmail ||
      !form.customerPhone ||
      !form.customerAddress
    ) {
      return "Please fill in all your details.";
    }
    if (form.rentalDays < 1) {
      return "Rental days must be at least 1.";
    }
    if (!item?.available) {
      return "This item is currently unavailable for rent.";
    }
    return "";
  };

  const resetPaymentForm = () => {
    setPaymentForm({
      cardName: "",
      cardNumber: "",
      expiry: "",
      cvv: "",
    });
    setPaymentError("");
    setPaymentMethod("card");
  };

  const handlePaymentChange = (e) => {
    setPaymentForm({ ...paymentForm, [e.target.name]: e.target.value });
  };

  const simulatePayment = () =>
    new Promise((resolve) => {
      setTimeout(() => resolve({ status: "success" }), 1200);
    });

  const placeOrder = async () => {
    setSubmitting(true);
    try {
      await createOrder({
        ...form,
        item: id,
        rentalDays: Number(form.rentalDays),
      });
      setOrderSuccess(true);
      setForm({
        customerName: "",
        customerEmail: "",
        customerPhone: "",
        customerAddress: "",
        startDate: today,
        rentalDays: 1,
      });
      fetchItem();
    } catch (err) {
      const message =
        err.response?.data?.error || "Failed to place order. Please try again.";
      setOrderError(message);
      throw new Error(message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setOrderError("");
    setOrderSuccess(false);

    const errorMessage = validateOrderForm();
    if (errorMessage) {
      setOrderError(errorMessage);
      return;
    }

    resetPaymentForm();
    setShowPayment(true);
  };

  const handlePaymentSubmit = async (e) => {
    e.preventDefault();
    setPaymentError("");

    const cardNumber = paymentForm.cardNumber.replace(/\s+/g, "");
    if (!paymentForm.cardName.trim()) {
      setPaymentError("Cardholder name is required.");
      return;
    }
    if (!/^\d{12,19}$/.test(cardNumber)) {
      setPaymentError("Enter a valid card number.");
      return;
    }
    if (!/^(0[1-9]|1[0-2])\/(\d{2})$/.test(paymentForm.expiry)) {
      setPaymentError("Expiry must be in MM/YY format.");
      return;
    }
    if (!/^\d{3,4}$/.test(paymentForm.cvv)) {
      setPaymentError("Enter a valid CVV.");
      return;
    }

    setPaymentProcessing(true);
    try {
      await simulatePayment();
      await placeOrder();
      setShowPayment(false);
      resetPaymentForm();
    } catch (err) {
      setPaymentError(
        err.message || "Payment failed. Please try again in a moment.",
      );
    } finally {
      setPaymentProcessing(false);
    }
  };

  const handleQrDone = async () => {
    setPaymentError("");
    setPaymentProcessing(true);
    try {
      await simulatePayment();
      await placeOrder();
      setShowPayment(false);
      resetPaymentForm();
    } catch (err) {
      setPaymentError(
        err.message || "Payment failed. Please try again in a moment.",
      );
    } finally {
      setPaymentProcessing(false);
    }
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    setReviewError("");
    setReviewSuccess(false);
    if (!reviewForm.reviewerName.trim()) {
      setReviewError("Please enter your name.");
      return;
    }
    if (!reviewForm.comment.trim()) {
      setReviewError("Please write a comment.");
      return;
    }
    try {
      setSubmittingReview(true);
      await createReview(id, reviewForm);
      setReviewSuccess(true);
      setReviewForm({ reviewerName: "", rating: 5, comment: "" });
      fetchReviews();
      fetchItem(); // refresh averageRating on item
    } catch (err) {
      setReviewError(err.response?.data?.error || "Failed to submit review.");
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading) {
    return (
      <div className="loading-state">
        <div className="loading-spinner" />
        <p>Loading item...</p>
      </div>
    );
  }

  if (error || !item) {
    return (
      <div>
        <Link to="/" className="back-link">
          ← Back to Browse
        </Link>
        <div className="alert alert-error">{error || "Item not found."}</div>
      </div>
    );
  }

  return (
    <div className="item-detail-container">
      <Link to="/" className="back-link">
        ← Back to Browse
      </Link>

      <div className="item-detail-card">
        <img
          src={item.imageUrl || PLACEHOLDER}
          alt={item.name}
          className="item-detail-img"
          style={{ objectPosition: item.imagePosition || "center" }}
          onError={(e) => {
            e.target.src = PLACEHOLDER;
          }}
        />

        <div className="item-detail-info">
          <div className="item-detail-category">{item.category}</div>
          <div className="item-detail-name">{item.name}</div>
          <div className="item-detail-description">{item.description}</div>

          <div className="item-detail-meta">
            <div className="meta-item">
              <div className="meta-label">Price per Day</div>
              <div className="meta-value highlight">
                ₹{item.pricePerDay.toLocaleString()}
              </div>
            </div>
            <div className="meta-item">
              <div className="meta-label">Collateral</div>
              <div className="meta-value">
                ₹{item.pricePerDay.toLocaleString()}
              </div>
            </div>
            <div className="meta-item">
              <div className="meta-label">Security Deposit</div>
              <div className="meta-value">
                ₹{item.depositAmount.toLocaleString()}
              </div>
            </div>
            <div className="meta-item">
              <div className="meta-label">Condition</div>
              <div className="meta-value">{item.condition}</div>
            </div>
            <div className="meta-item">
              <div className="meta-label">Availability</div>
              <div className="meta-value">
                <span
                  className={`badge ${item.available ? "badge-available" : "badge-unavailable"}`}
                >
                  {item.available
                    ? `Available (${item.quantity})`
                    : "Unavailable"}
                </span>
              </div>
            </div>
          </div>

          {/* Rent Form */}
          {item.available ? (
            <div className="rent-form">
              <h3>Book This Item</h3>

              {orderSuccess && (
                <div className="alert alert-success">
                  Order placed successfully! We'll confirm shortly.
                </div>
              )}
              {orderError && (
                <div className="alert alert-error">{orderError}</div>
              )}

              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label>Your Name</label>
                  <input
                    type="text"
                    name="customerName"
                    className="form-control"
                    placeholder="Enter your full name"
                    value={form.customerName}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Email</label>
                    <input
                      type="email"
                      name="customerEmail"
                      className="form-control"
                      placeholder="you@email.com"
                      value={form.customerEmail}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Phone</label>
                    <input
                      type="tel"
                      name="customerPhone"
                      className="form-control"
                      placeholder="+91 9876543210"
                      value={form.customerPhone}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Address</label>
                  <textarea
                    name="customerAddress"
                    className="form-control"
                    placeholder="Enter your delivery or pickup address"
                    value={form.customerAddress}
                    onChange={handleChange}
                    rows={3}
                    required
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Start Date</label>
                    <input
                      type="date"
                      name="startDate"
                      className="form-control"
                      min={today}
                      value={form.startDate}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Rental Days</label>
                    <input
                      type="number"
                      name="rentalDays"
                      className="form-control"
                      min="1"
                      max="30"
                      value={form.rentalDays}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>

                {/* Order Summary */}
                <div className="order-summary">
                  <div className="order-summary-row">
                    <span>
                      ₹{item.pricePerDay.toLocaleString()} × {form.rentalDays}{" "}
                      day(s)
                    </span>
                    <span>₹{totalAmount.toLocaleString()}</span>
                  </div>
                  <div className="order-summary-row">
                    <span>Refundable Deposit</span>
                    <span>₹{item.depositAmount.toLocaleString()}</span>
                  </div>
                  <div className="order-summary-row total">
                    <span>Total Payable</span>
                    <span>₹{totalPayable.toLocaleString()}</span>
                  </div>
                </div>

                <button
                  type="submit"
                  className="btn btn-primary btn-full"
                  disabled={submitting}
                >
                  {submitting ? "Placing Order..." : "Continue to Payment"}
                </button>
                <p className="payment-note">
                  This is a dummy payment flow. Use test card 4242 4242 4242
                  4242 with any future expiry and CVV.
                </p>
              </form>
            </div>
          ) : (
            <div className="alert alert-error" style={{ marginTop: "auto" }}>
              This item is currently unavailable for rent.
            </div>
          )}
        </div>
      </div>

      {showPayment && (
        <div className="payment-overlay" role="dialog" aria-modal="true">
          <div className="payment-modal">
            <div className="payment-modal-header">
              <h3>Complete Payment</h3>
              <button
                type="button"
                className="payment-close"
                onClick={() => setShowPayment(false)}
                disabled={paymentProcessing}
                aria-label="Close payment dialog"
              >
                ×
              </button>
            </div>

            <div className="payment-summary">
              <div>
                <span>Item</span>
                <strong>{item.name}</strong>
              </div>
              <div>
                <span>Total payable</span>
                <strong>₹{totalPayable.toLocaleString()}</strong>
              </div>
            </div>

            {paymentError && (
              <div className="alert alert-error">{paymentError}</div>
            )}

            <div className="payment-methods">
              <button
                type="button"
                className={`payment-method-btn ${paymentMethod === "card" ? "active" : ""}`}
                onClick={() => setPaymentMethod("card")}
                disabled={paymentProcessing}
              >
                Card
              </button>
              <button
                type="button"
                className={`payment-method-btn ${paymentMethod === "qr" ? "active" : ""}`}
                onClick={() => setPaymentMethod("qr")}
                disabled={paymentProcessing}
              >
                QR Code
              </button>
            </div>

            {paymentMethod === "card" ? (
              <form onSubmit={handlePaymentSubmit} autoComplete="off">
                <div className="form-group">
                  <label>Cardholder Name</label>
                  <input
                    type="text"
                    name="cardName"
                    className="form-control"
                    placeholder="Name on card"
                    value={paymentForm.cardName}
                    onChange={handlePaymentChange}
                    autoComplete="off"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Card Number</label>
                  <input
                    type="text"
                    name="cardNumber"
                    className="form-control"
                    placeholder="4242 4242 4242 4242"
                    value={paymentForm.cardNumber}
                    onChange={handlePaymentChange}
                    autoComplete="new-password"
                    inputMode="numeric"
                    required
                  />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Expiry (MM/YY)</label>
                    <input
                      type="text"
                      name="expiry"
                      className="form-control"
                      placeholder="08/28"
                      value={paymentForm.expiry}
                      onChange={handlePaymentChange}
                      autoComplete="new-password"
                      inputMode="numeric"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>CVV</label>
                    <input
                      type="password"
                      name="cvv"
                      className="form-control"
                      placeholder="123"
                      value={paymentForm.cvv}
                      onChange={handlePaymentChange}
                      autoComplete="new-password"
                      inputMode="numeric"
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="btn btn-primary btn-full"
                  disabled={paymentProcessing}
                >
                  {paymentProcessing ? "Processing..." : "Pay and Place Order"}
                </button>
              </form>
            ) : (
              <div className="payment-qr">
                <img
                  src={qrImageUrl}
                  alt="Dummy payment QR code"
                  className="payment-qr-code"
                  onError={(e) => {
                    e.currentTarget.src = qrDataUri;
                  }}
                />
                <p className="payment-qr-note">
                  Scan this dummy QR to simulate payment, then press Done.
                </p>
                <button
                  type="button"
                  className="btn btn-primary btn-full"
                  onClick={handleQrDone}
                  disabled={paymentProcessing}
                >
                  {paymentProcessing ? "Processing..." : "Done"}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Recommendations Section */}
      <div className="reviews-section">
        <div className="reviews-header">
          <h2 className="reviews-title">Recommended for you</h2>
        </div>

        {recommendationsLoading && (
          <p className="reviews-loading">Loading recommendations...</p>
        )}

        {recommendationsError && (
          <div className="alert alert-error">{recommendationsError}</div>
        )}

        {!recommendationsLoading &&
          !recommendationsError &&
          recommendations.length === 0 && (
            <p className="reviews-empty">No recommendations available yet.</p>
          )}

        {!recommendationsLoading &&
          !recommendationsError &&
          recommendations.length > 0 && (
            <div className="items-grid">
              {recommendations.map((rec) => (
                <ItemCard key={rec._id} item={rec} />
              ))}
            </div>
          )}
      </div>

      {/* Reviews Section */}
      <div className="reviews-section">
        <div className="reviews-header">
          <h2 className="reviews-title">Reviews & Ratings</h2>
          {item.reviewCount > 0 && (
            <div className="reviews-summary">
              <StarRating rating={item.averageRating} />
              <span className="reviews-avg">
                {item.averageRating.toFixed(1)}
              </span>
              <span className="reviews-total">
                ({item.reviewCount} review{item.reviewCount !== 1 ? "s" : ""})
              </span>
            </div>
          )}
        </div>

        {/* Write a Review */}
        <div className="review-form-card">
          <h3 className="review-form-title">Write a Review</h3>
          {reviewSuccess && (
            <div className="alert alert-success">
              Review submitted! Thank you.
            </div>
          )}
          {reviewError && (
            <div className="alert alert-error">{reviewError}</div>
          )}
          <form onSubmit={handleReviewSubmit}>
            <div className="form-group">
              <label>Your Name</label>
              <input
                type="text"
                className="form-control"
                placeholder="Enter your name"
                value={reviewForm.reviewerName}
                onChange={(e) =>
                  setReviewForm({ ...reviewForm, reviewerName: e.target.value })
                }
              />
            </div>
            <div className="form-group">
              <label>Rating</label>
              <div className="star-input-row">
                {[1, 2, 3, 4, 5].map((star) => (
                  <span
                    key={star}
                    className={`star-input ${star <= (hoveredStar || reviewForm.rating) ? "active" : ""}`}
                    onMouseEnter={() => setHoveredStar(star)}
                    onMouseLeave={() => setHoveredStar(0)}
                    onClick={() =>
                      setReviewForm({ ...reviewForm, rating: star })
                    }
                  >
                    ★
                  </span>
                ))}
                <span className="star-input-label">
                  {reviewForm.rating} / 5
                </span>
              </div>
            </div>
            <div className="form-group">
              <label>Comment</label>
              <textarea
                className="form-control review-textarea"
                placeholder="Share your experience with this item..."
                rows={3}
                value={reviewForm.comment}
                onChange={(e) =>
                  setReviewForm({ ...reviewForm, comment: e.target.value })
                }
              />
            </div>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={submittingReview}
            >
              {submittingReview ? "Submitting..." : "Submit Review"}
            </button>
          </form>
        </div>

        {/* Reviews List */}
        {reviewsLoading ? (
          <p className="reviews-loading">Loading reviews...</p>
        ) : reviews.length === 0 ? (
          <p className="reviews-empty">
            No reviews yet. Be the first to review!
          </p>
        ) : (
          <div className="reviews-list">
            {reviews.map((r) => (
              <div key={r._id} className="review-card">
                <div className="review-card-header">
                  <span className="reviewer-name">{r.reviewerName}</span>
                  <span className="review-date">
                    {new Date(r.createdAt).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </span>
                </div>
                <div className="review-card-stars">
                  <StarRating rating={r.rating} small />
                  <span className="review-rating-num">{r.rating}/5</span>
                </div>
                {r.comment && <p className="review-comment">{r.comment}</p>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default ItemDetail;
