import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { getItem, createOrder, getReviews, createReview } from "../api/api";
import { StarRating } from "../components/ItemCard";

const PLACEHOLDER = "https://via.placeholder.com/600x400?text=No+Image";

function ItemDetail() {
  const { id } = useParams();
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [orderError, setOrderError] = useState("");
  const [submitting, setSubmitting] = useState(false);

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

  const today = new Date().toISOString().split("T")[0];

  const [form, setForm] = useState({
    customerName: "",
    customerEmail: "",
    customerPhone: "",
    startDate: today,
    rentalDays: 1,
  });

  useEffect(() => {
    fetchItem();
    fetchReviews();
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

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const totalAmount = item ? item.pricePerDay * Number(form.rentalDays) : 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setOrderError("");
    setOrderSuccess(false);

    if (!form.customerName || !form.customerEmail || !form.customerPhone) {
      setOrderError("Please fill in all your details.");
      return;
    }
    if (form.rentalDays < 1) {
      setOrderError("Rental days must be at least 1.");
      return;
    }

    try {
      setSubmitting(true);
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
        startDate: today,
        rentalDays: 1,
      });
      // Refresh item to update availability
      fetchItem();
    } catch (err) {
      setOrderError(
        err.response?.data?.error || "Failed to place order. Please try again.",
      );
    } finally {
      setSubmitting(false);
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
                    <span>
                      ₹{(totalAmount + item.depositAmount).toLocaleString()}
                    </span>
                  </div>
                </div>

                <button
                  type="submit"
                  className="btn btn-primary btn-full"
                  disabled={submitting}
                >
                  {submitting ? "Placing Order..." : "Rent Now"}
                </button>
              </form>
            </div>
          ) : (
            <div className="alert alert-error" style={{ marginTop: "auto" }}>
              This item is currently unavailable for rent.
            </div>
          )}
        </div>
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
