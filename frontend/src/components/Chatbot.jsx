import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "./Chatbot.css";

function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([
        {
          id: Date.now(),
          sender: "bot",
          text: "Hi! I can help you rent, search items, return, or report damage. What do you need?",
          intent: null,
          confidence: null,
        },
      ]);
    }
  }, [isOpen, messages.length]);

  const canSend = useMemo(
    () => input.trim().length > 0 && !loading,
    [input, loading],
  );

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || loading) {
      return;
    }

    const token = localStorage.getItem("token");
    const hasValidToken = token && token !== "undefined" && token !== "null";

    setMessages((prev) => [
      ...prev,
      {
        id: Date.now(),
        sender: "user",
        text,
      },
    ]);

    setInput("");

    if (!hasValidToken) {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          sender: "bot",
          text: "Please login first to use the chatbot assistant.",
          intent: "AUTH_REQUIRED",
          confidence: 0,
        },
      ]);

      setTimeout(() => {
        navigate("/login");
      }, 800);
      return;
    }

    setLoading(true);

    try {
      const response = await axios.post(
        "/api/chatbot/chat",
        { message: text },
        {
          headers: hasValidToken ? { Authorization: `Bearer ${token}` } : {},
        },
      );

      const data = response.data || {};

      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          sender: "bot",
          text: data.response || "I didn't understand your request.",
          intent: data.intent || "UNKNOWN",
          confidence:
            typeof data.confidence === "number" ? data.confidence : null,
        },
      ]);

      if (data.redirect) {
        setTimeout(() => {
          navigate(data.redirect);
          setIsOpen(false);
        }, 1500);
      }
    } catch (error) {
      const status = error.response?.status;
      const serverMessage =
        error.response?.data?.message ||
        error.response?.data?.error ||
        "Something went wrong. Please try again.";
      const unauthorized = status === 401;

      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 2,
          sender: "bot",
          text: unauthorized
            ? "Session expired or unauthorized. Please login again."
            : serverMessage,
          intent: unauthorized ? "AUTH_REQUIRED" : "UNKNOWN",
          confidence: 0,
        },
      ]);

      if (unauthorized) {
        setTimeout(() => {
          navigate("/login");
        }, 800);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    sendMessage();
  };

  return (
    <div className="rs-chatbot-root">
      {isOpen && (
        <div className="rs-chatbot-window">
          <div className="rs-chatbot-header">
            <span>Rent-Sphere Assistant</span>
            <button
              type="button"
              className="rs-chatbot-close"
              onClick={() => setIsOpen(false)}
              aria-label="Close chatbot"
            >
              ×
            </button>
          </div>

          <div className="rs-chatbot-thread">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`rs-chatbot-row ${msg.sender === "user" ? "user" : "bot"}`}
              >
                <div>
                  <div className="rs-chatbot-msg">{msg.text}</div>
                  {msg.sender === "bot" && msg.intent && (
                    <div className="rs-chatbot-meta">
                      intent: {msg.intent} · confidence:{" "}
                      {Math.round((msg.confidence || 0) * 100)}%
                    </div>
                  )}
                </div>
              </div>
            ))}

            {loading && <div className="rs-chatbot-typing">typing...</div>}
          </div>

          <form className="rs-chatbot-input-wrap" onSubmit={handleSubmit}>
            <input
              className="rs-chatbot-input"
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="Type your message"
            />
            <button
              type="submit"
              className="rs-chatbot-send"
              disabled={!canSend}
            >
              Send
            </button>
          </form>
        </div>
      )}

      <button
        type="button"
        className="rs-chatbot-bubble"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label="Open chatbot"
      >
        💬
      </button>
    </div>
  );
}

export default Chatbot;
