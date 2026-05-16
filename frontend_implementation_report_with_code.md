# Frontend Implementation Report with Code

## 1. Introduction

The frontend is implemented as a React Single Page Application for browsing rental items, placing rental requests, tracking orders, admin operations, and chatbot-guided search.

Main files:

- [frontend/src/index.js](frontend/src/index.js)
- [frontend/src/App.js](frontend/src/App.js)
- [frontend/src/api/api.js](frontend/src/api/api.js)
- [frontend/src/context/AuthContext.js](frontend/src/context/AuthContext.js)

## 2. Frontend Structure

```text
frontend/
  src/
    App.js
    index.js
    index.css
    api/
      api.js
    context/
      AuthContext.js
    components/
      Navbar.js
      ItemCard.js
      Chatbot.jsx
      FloatingChatbot.js
    pages/
      Home.js
      ItemDetail.js
      Login.js
      Orders.js
      Admin.js
      Chatbot.js
    styles/
      Login.css
      Orders.css
      Chatbot.css
      FloatingChatbot.css
```

## 3. Flow of Execution

1. App starts from [frontend/src/index.js](frontend/src/index.js).
2. App shell and route mapping are defined in [frontend/src/App.js](frontend/src/App.js).
3. Auth state is provided globally through [frontend/src/context/AuthContext.js](frontend/src/context/AuthContext.js).
4. All backend calls are centralized in [frontend/src/api/api.js](frontend/src/api/api.js).
5. Page components fetch/update data and render UI.

## 4. Routing Flow

Routes are configured in [frontend/src/App.js](frontend/src/App.js):

- /, /items, /rent -> Home
- /item/:id -> ItemDetail
- /orders, /return, /report, /status -> Orders
- /admin -> Admin
- /login -> Login
- /chatbot -> Chatbot

## 5. API and Authentication Flow

- Axios base URL: /api
- Request interceptor adds JWT token from local storage.
- Response interceptor handles 401 by clearing token and redirecting to login.
- Auth context exposes login, register, logout, isAuthenticated, and isAdmin.

## 6. Core Code Sections

### 6.1 Entry Point Code ([frontend/src/index.js](frontend/src/index.js))

Explanation:

- This is the React bootstrap layer where the root DOM node is initialized.
- React.StrictMode is enabled to surface unsafe lifecycle patterns and side effects during development.
- The App component becomes the top-level container for routing, global auth state, and shared UI.

```javascript
import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
```

### 6.2 App Shell and Routes ([frontend/src/App.js](frontend/src/App.js))

Explanation:

- AuthProvider wraps the entire route tree so every page can access authentication state and methods.
- BrowserRouter handles SPA navigation without full-page reloads.
- Navbar, chatbot widget, and footer are persistent layout elements shared by all pages.
- Routes map business workflows to screens: browsing, booking, order tracking, admin management, and chatbot interaction.

```javascript
import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import ItemDetail from "./pages/ItemDetail";
import Admin from "./pages/Admin";
import Login from "./pages/Login";
import Orders from "./pages/Orders";
import Chatbot from "./pages/Chatbot";
import ChatbotWidget from "./components/Chatbot";
import "./index.css";

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="app">
          <Navbar />
          <main className="main-content">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/items" element={<Home />} />
              <Route path="/rent" element={<Home />} />
              <Route path="/return" element={<Orders />} />
              <Route path="/report" element={<Orders />} />
              <Route path="/status" element={<Orders />} />
              <Route path="/item/:id" element={<ItemDetail />} />
              <Route path="/orders" element={<Orders />} />
              <Route path="/admin" element={<Admin />} />
              <Route path="/login" element={<Login />} />
              <Route path="/chatbot" element={<Chatbot />} />
            </Routes>
          </main>
          <ChatbotWidget />
          <footer className="footer">
            <div className="footer-inner">
              <p>© 2026 RentEase. All rights reserved.</p>
            </div>
          </footer>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
```

### 6.3 API Layer ([frontend/src/api/api.js](frontend/src/api/api.js))

Explanation:

- The API module centralizes all HTTP logic in one file, which improves maintainability and consistency.
- Request interceptor injects Bearer token automatically, so each page does not repeat auth header logic.
- Response interceptor provides unified unauthorized-session handling by clearing stale token state.
- Feature-specific exported functions create a clean contract between UI components and backend endpoints.

```javascript
import axios from "axios";

const API = axios.create({
  baseURL: "/api",
});

API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      if (window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  },
);

export const register = (data) => API.post("/auth/register", data);
export const login = (data) => API.post("/auth/login", data);
export const getMe = () => API.get("/auth/me");

export const getItems = (params) => API.get("/items", { params });
export const getItem = (id) => API.get(`/items/${id}`);

export const getOrders = () => API.get("/orders");
export const getMyOrders = () => API.get("/orders/my-orders");
export const createOrder = (data) => API.post("/orders", data);

export const getReviews = (itemId) => API.get(`/reviews/${itemId}`);
export const createReview = (itemId, data) =>
  API.post(`/reviews/${itemId}`, data);

export const queryChatbot = (text) => API.post("/chatbot/query", { text });

export default API;
```

### 6.4 Authentication Context ([frontend/src/context/AuthContext.js](frontend/src/context/AuthContext.js))

Explanation:

- AuthContext is the global identity store for the frontend application.
- On initial load, it validates any existing token via getMe and hydrates user data.
- login and register methods normalize API responses into a simple success or error contract for pages.
- Role flags isAuthenticated and isAdmin make conditional UI rendering straightforward in Navbar and protected screens.

```javascript
import React, { createContext, useState, useContext, useEffect } from "react";
import { login as loginAPI, register as registerAPI, getMe } from "../api/api";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem("token") || null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUser = async () => {
      if (token) {
        try {
          const response = await getMe();
          setUser(response.data.user);
        } catch (error) {
          localStorage.removeItem("token");
          setToken(null);
        }
      }
      setLoading(false);
    };

    loadUser();
  }, [token]);

  const login = async (email, password) => {
    try {
      const response = await loginAPI({ email, password });
      const { token: newToken, user: userData } = response.data;
      localStorage.setItem("token", newToken);
      setToken(newToken);
      setUser(userData);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || "Login failed",
      };
    }
  };

  const register = async (userData) => {
    try {
      const response = await registerAPI(userData);
      const { token: newToken, user: newUser } = response.data;
      localStorage.setItem("token", newToken);
      setToken(newToken);
      setUser(newUser);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || "Registration failed",
      };
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        register,
        logout,
        isAuthenticated: !!user,
        isAdmin: user?.role === "admin",
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
};

export default AuthContext;
```

### 6.5 Home Page Logic ([frontend/src/pages/Home.js](frontend/src/pages/Home.js))

Explanation:

- Home acts as the main catalog surface where users discover rentable items.
- It combines server data with client-side filters for category, search term, and availability.
- URL query parameter reading allows deep-linking and chatbot-driven redirects with pre-applied filters.
- ItemCard componentization keeps list rendering reusable and clean.

```javascript
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
  const [activeCategory, setActiveCategory] = useState("All");
  const [search, setSearch] = useState("");

  useEffect(() => {
    const fetchItems = async () => {
      setLoading(true);
      const res = await getItems();
      setItems(res.data);
      setLoading(false);
    };
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

  if (loading) return <p>Loading items...</p>;

  return (
    <div>
      <div className="items-grid">
        {filtered.map((item) => (
          <ItemCard key={item._id} item={item} />
        ))}
      </div>
    </div>
  );
}

export default Home;
```

### 6.6 Additional Frontend Content Details

Item Detail and Booking:

- File: [frontend/src/pages/ItemDetail.js](frontend/src/pages/ItemDetail.js)
- Responsibilities:
  - Fetch selected item details by dynamic route param.
  - Submit rental order form with customer details, rental duration, and start date.
  - Compute payable total from item price, rental days, and deposit amount.
  - Fetch and submit item reviews; refresh rating summary after each review.

Orders Tracking:

- File: [frontend/src/pages/Orders.js](frontend/src/pages/Orders.js)
- Responsibilities:
  - Validate authenticated access and redirect unauthenticated users to login.
  - Fetch user-specific order history from /orders/my-orders.
  - Render status-specific messages for Pending, Confirmed, Returned, and Cancelled states.

Admin Panel:

- File: [frontend/src/pages/Admin.js](frontend/src/pages/Admin.js)
- Responsibilities:
  - Manage inventory (add, edit, delete, toggle availability).
  - Manage order lifecycle by updating status values.
  - Present tab-oriented operations for clarity and operational efficiency.

Chatbot Interfaces:

- Files:
  - [frontend/src/pages/Chatbot.js](frontend/src/pages/Chatbot.js)
  - [frontend/src/components/FloatingChatbot.js](frontend/src/components/FloatingChatbot.js)
  - [frontend/src/components/Chatbot.jsx](frontend/src/components/Chatbot.jsx)
- Responsibilities:
  - Accept natural language rental queries.
  - Display model intent, confidence, and item matches.
  - Provide quick prompts and recommendation-guided discovery.

## 7. Sequence Flow (Report Diagram)

```text
User Action
  -> React Page/Component
  -> API function call (api.js)
  -> Axios request /api/*
  -> Backend response
  -> Component state update
  -> Re-render UI
```

### 7.1 Detailed Flow: Authentication

```text
User enters credentials on Login page
  -> Login page calls AuthContext.login
  -> AuthContext.login calls api.login
  -> Backend validates and returns token + user
  -> Token stored in localStorage
  -> AuthContext updates user state
  -> Navbar and route behavior update immediately
```

### 7.2 Detailed Flow: Browse to Booking

```text
User opens Home page
  -> Home fetches item catalog via getItems
  -> User filters by category/search/availability
  -> User opens item details
  -> ItemDetail fetches full item + reviews
  -> User submits booking form
  -> createOrder API call
  -> Success response updates UI and availability state
```

### 7.3 Detailed Flow: Chatbot Guided Discovery

```text
User sends natural-language prompt
  -> Chatbot page/widget calls queryChatbot
  -> Backend returns intent + confidence + matched items
  -> Frontend renders response and suggested items
  -> User selects matched item card
  -> Navigation to ItemDetail for booking
```

### 7.4 Data Flow Characteristics

- Unidirectional data flow is used: API response updates state, then UI re-renders.
- Global auth state is context-based; feature state remains local to each page.
- URL query params are used as shareable state for filter-driven pages.

## 8. Complete Frontend Code Appendix

For full copy-paste code of all frontend files, use:

- [frontend_all_code.txt](frontend_all_code.txt)

For complete backend + frontend source in one file, use:

- [full_project_all_code.txt](full_project_all_code.txt)

## 9. Conclusion

The frontend follows a clean modular implementation with:

1. Route-based page architecture
2. Shared API layer with interceptors
3. Context-based authentication and role checks
4. Feature modules for browse, booking, orders, admin, and chatbot

This implementation keeps presentation, state, and data-access concerns clearly separated. As a result, the frontend is easier to extend, test, and maintain while supporting real-world rental workflows end-to-end.

## 10. NLP Chatbot Module (Detailed)

### 10.1 Module Overview

The NLP chatbot module is implemented as a local hybrid pipeline that combines Python-based intent classification and Node.js based API orchestration.

Primary module files:

- [backend/nlp_chatbot/chatbot.py](backend/nlp_chatbot/chatbot.py)
- [backend/nlp_chatbot/intents.json](backend/nlp_chatbot/intents.json)
- [backend/routes/chatbot.js](backend/routes/chatbot.js)
- [backend/nlp/nlp_service.py](backend/nlp/nlp_service.py)
- [frontend/src/pages/Chatbot.js](frontend/src/pages/Chatbot.js)
- [frontend/src/components/FloatingChatbot.js](frontend/src/components/FloatingChatbot.js)

### 10.2 Why This Design

Explanation:

- The project avoids external paid NLP APIs and performs inference locally.
- TF-IDF + Multinomial Naive Bayes gives low-latency inference for intent classification.
- Node route layer enriches pure intent output with rental item matches from MongoDB.
- Frontend receives not only intent text but also actionable matched items for direct booking navigation.

### 10.3 Intent Knowledge Base

Explanation:

- Intent definitions are stored in [backend/nlp_chatbot/intents.json](backend/nlp_chatbot/intents.json).
- Each intent contains:
  - tag
  - patterns (training utterances)
  - response (bot message)
  - suggestions (follow-up prompts)
  - recommendations (item ideas)
- Current intents include GREETING, SEARCH_ITEM, RENT_ITEM, PRICE_INQUIRY, AVAILABILITY, RECOMMENDATION, ORDER_STATUS, and GOODBYE.

Code snippet:

```json
{
  "tag": "SEARCH_ITEM",
  "patterns": ["show cameras", "find camera", "i need a dslr camera"],
  "response": "You can browse items by category and keyword from the home page.",
  "suggestions": ["Show DSLR camera options", "Find tools under 1000"],
  "recommendations": ["DSLR Camera", "Pressure Washer", "Ladder"]
}
```

### 10.4 Python Model Training and Inference

Explanation:

- [backend/nlp_chatbot/chatbot.py](backend/nlp_chatbot/chatbot.py) loads intent patterns and trains a text-classification pipeline.
- Preprocessing includes lowercasing, non-alphanumeric cleanup, and English stopword removal.
- Features are generated with TF-IDF using unigram and bigram settings.
- Classifier is Multinomial Naive Bayes.
- Trained artifact is cached to model.joblib and reused for future inference.
- Confidence threshold is used to trigger FALLBACK responses on low certainty predictions.

Code snippet:

```python
pipeline = Pipeline(
    steps=[
        (
            "tfidf",
            TfidfVectorizer(
                ngram_range=(1, 2),
                min_df=1,
                max_df=0.95,
                sublinear_tf=True,
            ),
        ),
        ("clf", MultinomialNB(alpha=0.2)),
    ]
)

pipeline.fit(texts, labels)
```

Fallback behavior snippet:

```python
if confidence < 0.4:
    intent = "FALLBACK"
    response = "I could not confidently classify that request. Try asking for item search, prices, availability, or recommendations."
```

### 10.5 Node.js Chatbot API Orchestration

Explanation:

- [backend/routes/chatbot.js](backend/routes/chatbot.js) is the main chatbot API gateway.
- It spawns the Python chatbot process with user text, parses JSON output, and handles errors safely.
- After intent prediction, it runs additional business matching logic to fetch suitable rental items.
- Matching supports:
  - Budget queries (under Rs X)
  - Domain-aware matching (tool, camera, pump)
  - Keyword-based category and description matching
- Final API response includes intent metadata and matchedItems array for frontend cards.

Code snippet:

```javascript
router.post("/query", async (req, res) => {
  const text = typeof req.body?.text === "string" ? req.body.text.trim() : "";
  const result = await runInference(text);
  const matchedItems = await getMatchedItems(text, result.intent);

  return res.json({
    ok: true,
    ...result,
    matchedItems,
  });
});
```

### 10.6 Secondary Intent Service

Explanation:

- [backend/nlp/nlp_service.py](backend/nlp/nlp_service.py) is another lightweight intent classifier used by authenticated chat flow.
- It contains intent data inline in the script and retrains in-memory at runtime.
- It extracts simple entities like duration and location using regex.
- This service powers endpoint /api/chatbot/chat through [backend/services/nlpService.js](backend/services/nlpService.js) and [backend/routes/chatbot.route.js](backend/routes/chatbot.route.js).

Entity extraction snippet:

```python
duration_match = re.search(r"\\b(\\d+\\s*(?:day|days|week|weeks|month|months))\\b", text, re.IGNORECASE)
location_match = re.search(r"\\bnear\\s+([A-Za-z][A-Za-z\\s]{1,40})\\b", text, re.IGNORECASE)
```

### 10.7 End-to-End Request Flow

```text
User asks chatbot question on frontend
  -> Frontend calls /api/chatbot/query
  -> Node route starts Python chatbot.py process
  -> Python model predicts intent/confidence/response
  -> Node enriches with matched rental items from MongoDB
  -> Frontend renders bot reply + item cards + suggestions
  -> User opens matched item and proceeds to booking
```

### 10.8 Frontend Integration Details

Explanation:

- [frontend/src/pages/Chatbot.js](frontend/src/pages/Chatbot.js) provides a full-page chatbot interface with history, confidence view, and suggestions panel.
- [frontend/src/components/FloatingChatbot.js](frontend/src/components/FloatingChatbot.js) provides compact always-available assistant UI.
- Both consume queryChatbot from [frontend/src/api/api.js](frontend/src/api/api.js).
- matchedItems are rendered as clickable cards linked to item detail pages.

### 10.9 Runtime Dependencies

Python dependencies from [backend/nlp_chatbot/requirements.txt](backend/nlp_chatbot/requirements.txt):

- scikit-learn==1.5.2
- numpy==2.1.3
- joblib==1.4.2

Node dependency requirement:

- Child process spawning support in Node.js (built-in module child_process).

### 10.10 Strengths and Current Limitations

Strengths:

- Fully local inference and deterministic output.
- Fast response suitable for rental-assistant UX.
- Business-aware post-processing connects intent classification to real product inventory.

Limitations:

- Rule-based enrichment patterns may miss uncommon phrasing.
- Two classifier paths exist (chatbot.py and nlp_service.py), which can produce slightly different behavior.
- No persisted evaluation report (accuracy, precision, recall) currently stored in repository.

### 10.11 Suggested Improvements

1. Unify classifier logic into one shared model service to reduce duplication.
2. Add offline evaluation script with confusion matrix and intent-wise F1 metrics.
3. Expand training utterances for multilingual and colloquial phrasing.
4. Add conversation context memory for multi-turn clarification.
