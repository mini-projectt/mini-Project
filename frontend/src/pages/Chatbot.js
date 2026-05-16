import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { queryChatbot } from "../api/api";
import "../styles/Chatbot.css";

const starterPrompts = [
  "I need a DSLR camera for 2 days",
  "Suggest tools for home repair",
  "What is the price of generator rental",
  "Is pressure washer available this weekend",
];

function Chatbot() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [history, setHistory] = useState([]);

  const latestBotReply = useMemo(() => {
    for (let i = history.length - 1; i >= 0; i -= 1) {
      if (history[i].type === "bot" && history[i].payload) {
        return history[i].payload;
      }
    }
    return null;
  }, [history]);

  const submitPrompt = async (promptText) => {
    const text = promptText.trim();
    if (!text || loading) {
      return;
    }

    setError("");
    setLoading(true);
    setHistory((prev) => [...prev, { type: "user", text }]);

    try {
      const { data } = await queryChatbot(text);

      setHistory((prev) => [
        ...prev,
        {
          type: "bot",
          text: data.response,
          payload: data,
        },
      ]);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Chatbot is currently unavailable. Please try again.",
      );
    } finally {
      setLoading(false);
      setQuery("");
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    submitPrompt(query);
  };

  return (
    <section className="chatbot-page">
      <div className="chatbot-header">
        <h1>NLP Chatbot Assistant</h1>
        <p>
          TF-IDF + Multinomial Naive Bayes intent engine with local inference,
          fast response, and no external NLP API dependency.
        </p>
      </div>

      <div className="chatbot-layout">
        <div className="chatbot-main">
          <div className="chatbot-history">
            {history.length === 0 ? (
              <div className="chatbot-empty">
                <h3>Try these prompts</h3>
                <div className="chip-wrap">
                  {starterPrompts.map((prompt) => (
                    <button
                      key={prompt}
                      type="button"
                      className="chatbot-chip"
                      onClick={() => submitPrompt(prompt)}
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              history.map((entry, idx) => (
                <article
                  className={`chat-line ${entry.type === "user" ? "user" : "bot"}`}
                  key={`${entry.type}-${idx}`}
                >
                  <div className="chat-bubble">{entry.text}</div>
                  {entry.type === "bot" && entry.payload && (
                    <>
                      <div className="chat-meta">
                        <span>Intent: {entry.payload.intent}</span>
                        <span>
                          Confidence:{" "}
                          {(entry.payload.confidence * 100).toFixed(1)}%
                        </span>
                        <span>Latency: {entry.payload.latency_ms} ms</span>
                      </div>

                      {entry.payload.matchedItems?.length > 0 && (
                        <div className="chat-item-grid">
                          {entry.payload.matchedItems.map((item) => (
                            <Link
                              key={item._id}
                              to={`/item/${item._id}`}
                              className="chat-item-card"
                            >
                              <div className="chat-item-name">{item.name}</div>
                              <div className="chat-item-meta-row">
                                <span>{item.category}</span>
                                <strong>Rs {item.pricePerDay}/day</strong>
                              </div>
                            </Link>
                          ))}
                        </div>
                      )}
                    </>
                  )}
                </article>
              ))
            )}
          </div>

          <form className="chatbot-input-row" onSubmit={handleSubmit}>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ask for rental items, prices, availability, or recommendations"
              disabled={loading}
            />
            <button type="submit" disabled={loading || !query.trim()}>
              {loading ? "Thinking..." : "Send"}
            </button>
          </form>

          {error && <p className="chatbot-error">{error}</p>}
        </div>

        <aside className="chatbot-side">
          <h3>Suggestions</h3>
          <div className="chip-wrap">
            {(latestBotReply?.suggestions || starterPrompts).map((text) => (
              <button
                key={`s-${text}`}
                type="button"
                className="chatbot-chip"
                onClick={() => submitPrompt(text)}
              >
                {text}
              </button>
            ))}
          </div>

          <h3>Recommendations</h3>
          <ul className="recommend-list">
            {(
              latestBotReply?.recommendations || [
                "DSLR Camera",
                "Electric Drill",
                "Wedding Sherwani",
              ]
            ).map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </aside>
      </div>
    </section>
  );
}

export default Chatbot;
