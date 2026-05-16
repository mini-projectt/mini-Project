import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import ItemCard from "../components/ItemCard";
import { getItems } from "../api/api";

const CATEGORIES = [
  "All",
  "Clothing",
  "Power Tools",
  "Pumps",
  "Construction",
  "Electrical",
  "Cleaning Equipment",
];

function Home() {
  const [searchParams] = useSearchParams();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchItems();
  }, []);

  useEffect(() => {
    const searchFromUrl = (searchParams.get("search") || "").trim();
    const categoryFromUrl = (searchParams.get("category") || "All").trim();

    setSearch(searchFromUrl);
    setActiveCategory(
      CATEGORIES.includes(categoryFromUrl) ? categoryFromUrl : "All",
    );
  }, [searchParams]);

  const fetchItems = async () => {
    try {
      setLoading(true);
      const res = await getItems();
      setItems(res.data);
    } catch (err) {
      setError("Failed to load items. Is the backend running?");
    } finally {
      setLoading(false);
    }
  };

  const filtered = items.filter((item) => {
    const availableOnly = searchParams.get("available") === "true";
    const matchCat =
      activeCategory === "All" || item.category === activeCategory;
    const matchSearch =
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      item.description.toLowerCase().includes(search.toLowerCase());
    const matchAvailability = !availableOnly || item.available;
    return matchCat && matchSearch && matchAvailability;
  });

  return (
    <div>
      {/* Hero */}
      <div className="hero">
        <h1>Rent Anything You Need</h1>
        <p>Power tools, pumps, clothing & more — delivered to your doorstep</p>
      </div>

      {/* Search */}
      <div className="page-header">
        <input
          type="text"
          className="form-control"
          placeholder="Search items..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ maxWidth: 400 }}
        />
      </div>

      {/* Category Filter */}
      <div className="filter-bar">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            className={`filter-btn ${activeCategory === cat ? "active" : ""}`}
            onClick={() => setActiveCategory(cat)}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading && (
        <div className="loading-state">
          <div className="loading-spinner" />
          <p>Loading items...</p>
        </div>
      )}

      {error && <div className="alert alert-error">{error}</div>}

      {!loading && !error && filtered.length === 0 && (
        <div className="empty-state">
          <h3>No items found</h3>
          <p>Try a different category or search term.</p>
        </div>
      )}

      {!loading && !error && filtered.length > 0 && (
        <>
          <p
            style={{ fontSize: "0.875rem", color: "#64748b", marginBottom: 16 }}
          >
            Showing {filtered.length} item{filtered.length !== 1 ? "s" : ""}
          </p>
          <div className="items-grid">
            {filtered.map((item) => (
              <ItemCard key={item._id} item={item} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default Home;
