import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { queryChatbot } from "../api/api";
import "../styles/FloatingChatbot.css";

const quickPrompts = [
  "I need a DSLR camera for 2 days",
  "Suggest tools for home repair",
  "What is the price of generator rental",
];

function FloatingChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [history, setHistory] = useState([
    {
      type: "bot",
      text: "Hi, I am RentEase AI. Ask me for rental suggestions, prices, or availability.",
      payload: null,
    },
  ]);

  const latestBotReply = useMemo(() => {
    for (let i = history.length - 1; i >= 0; i -= 1) {
      if (history[i].type === "bot" && history[i].payload) {
        return history[i].payload;
      }
    }
    return null;
  }, [history]);

  const submitPrompt = async (text) => {
    const clean = text.trim();
    if (!clean || loading) {
      return;
    }

    setError("");
    setLoading(true);
    setHistory((prev) => [...prev, { type: "user", text: clean }]);

    try {
      const { data } = await queryChatbot(clean);
      setHistory((prev) => [
        ...prev,
        { type: "bot", text: data.response, payload: data },
      ]);
      setQuery("");
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Chat assistant is unavailable. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    submitPrompt(query);
  };

  return (
    <div className="floating-chatbot-wrap">
      {isOpen && (
        <section
          className="floating-chat-panel"
          aria-label="RentEase chatbot panel"
        >
          <header className="floating-chat-header">
            <div>
              <h3>RentEase AI</h3>
              <p>TF-IDF assistant</p>
            </div>
            <div className="floating-chat-header-actions">
              <Link
                to="/chatbot"
                className="floating-chat-expand"
                onClick={() => setIsOpen(false)}
                aria-label="Open full chatbot"
              >
                <span aria-hidden="true">↗</span>
              </Link>
              <button
                type="button"
                className="floating-chat-close"
                onClick={() => setIsOpen(false)}
                aria-label="Close chatbot"
              >
                x
              </button>
            </div>
          </header>

          <div className="floating-chat-history">
            {history.map((entry, idx) => (
              <article
                className={`floating-chat-line ${entry.type === "user" ? "user" : "bot"}`}
                key={`${entry.type}-${idx}`}
              >
                <div className="floating-chat-bubble">{entry.text}</div>
                {entry.type === "bot" &&
                  entry.payload?.matchedItems?.length > 0 && (
                    <div className="floating-chat-items">
                      {entry.payload.matchedItems.map((item) => (
                        <Link
                          key={item._id}
                          to={`/item/${item._id}`}
                          className="floating-chat-item-card"
                          onClick={() => setIsOpen(false)}
                        >
                          <div className="floating-chat-item-name">
                            {item.name}
                          </div>
                          <div className="floating-chat-item-meta">
                            <span>{item.category}</span>
                            <strong>Rs {item.pricePerDay}/day</strong>
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}
              </article>
            ))}
          </div>

          {latestBotReply?.matchedItems?.length > 0 && (
            <div className="floating-chat-hint">
              Showing {latestBotReply.matchedItems.length} matched item
              {latestBotReply.matchedItems.length === 1 ? "" : "s"}.
            </div>
          )}

          <div className="floating-chat-suggestions">
            {(latestBotReply?.suggestions || quickPrompts)
              .slice(0, 3)
              .map((text) => (
                <button
                  key={text}
                  type="button"
                  className="floating-chat-chip"
                  onClick={() => submitPrompt(text)}
                >
                  {text}
                </button>
              ))}
          </div>

          <form className="floating-chat-input-row" onSubmit={handleSubmit}>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ask anything about rentals"
              disabled={loading}
            />
            <button type="submit" disabled={loading || !query.trim()}>
              {loading ? "..." : "Send"}
            </button>
          </form>

          {error && <p className="floating-chat-error">{error}</p>}
        </section>
      )}

      <button
        type="button"
        className="floating-chat-trigger"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label="Open chatbot"
      >
        <span className="floating-chat-logo">
          <svg width="26" height="26" viewBox="0 0 26 26" aria-hidden="true">
            <defs>
              <linearGradient id="logoGrad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#f59e0b" />
                <stop offset="100%" stopColor="#ea580c" />
              </linearGradient>
            </defs>
            <circle cx="13" cy="13" r="12" fill="url(#logoGrad)" />
            <path
              d="M7.5 9.5h11v6.2a2.3 2.3 0 0 1-2.3 2.3h-4.7l-2.8 2.3v-2.3H9.8a2.3 2.3 0 0 1-2.3-2.3V9.5z"
              fill="#fff"
            />
            <circle cx="11" cy="13.2" r="0.9" fill="#ea580c" />
            <circle cx="13" cy="13.2" r="0.9" fill="#ea580c" />
            <circle cx="15" cy="13.2" r="0.9" fill="#ea580c" />
          </svg>
        </span>
        <span className="floating-chat-label">AI</span>
      </button>
    </div>
  );
}

export default FloatingChatbot;
