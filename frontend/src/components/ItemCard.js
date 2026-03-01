import React from "react";
import { Link } from "react-router-dom";

const PLACEHOLDER = "https://via.placeholder.com/400x200?text=No+Image";

export function StarRating({ rating, small }) {
  const full = Math.floor(rating);
  const half = rating - full >= 0.5;
  const size = small ? "0.8rem" : "1rem";
  return (
    <span className="star-rating" style={{ fontSize: size }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <span
          key={i}
          style={{
            color:
              i <= full || (i === full + 1 && half)
                ? "#ffc107"
                : "rgba(255,255,255,0.15)",
          }}
        >
          ★
        </span>
      ))}
    </span>
  );
}

function ItemCard({ item }) {
  return (
    <div className="item-card">
      <img
        src={item.imageUrl || PLACEHOLDER}
        alt={item.name}
        className="item-card-img"
        style={{ objectPosition: item.imagePosition || "center" }}
        onError={(e) => {
          e.target.src = PLACEHOLDER;
        }}
      />
      <div className="item-card-body">
        <div className="item-card-category">{item.category}</div>
        <div className="item-card-name">{item.name}</div>
        <div className="item-card-description">{item.description}</div>

        {/* Star Rating */}
        <div className="item-card-rating">
          <StarRating
            rating={item.reviewCount > 0 ? item.averageRating : 0}
            small
          />
          {item.reviewCount > 0 ? (
            <>
              <span className="rating-score">
                {item.averageRating.toFixed(1)}
              </span>
              <span className="rating-count">
                ({item.reviewCount} review{item.reviewCount !== 1 ? "s" : ""})
              </span>
            </>
          ) : (
            <span className="rating-none">No reviews yet</span>
          )}
        </div>

        <div className="item-card-footer">
          <div className="item-price">
            ₹{item.pricePerDay.toLocaleString()} <span>/ day</span>
          </div>
          <span
            className={`badge ${item.available ? "badge-available" : "badge-unavailable"}`}
          >
            {item.available ? "Available" : "Unavailable"}
          </span>
        </div>
        <Link to={`/item/${item._id}`} className="btn btn-primary btn-full">
          View Details
        </Link>
      </div>
    </div>
  );
}

export default ItemCard;
