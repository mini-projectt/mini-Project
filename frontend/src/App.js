import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { useAuth } from "./context/AuthContext";
import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import ItemDetail from "./pages/ItemDetail";
import Admin from "./pages/Admin";
import Login from "./pages/Login";
import Orders from "./pages/Orders";
import Chatbot from "./pages/Chatbot";
import ChatbotWidget from "./components/Chatbot";
import "./index.css";

function AdminRoute({ children }) {
  const { isAuthenticated, isAdmin, loading } = useAuth();

  if (loading) {
    return null;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  return children;
}

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
              <Route
                path="/admin"
                element={
                  <AdminRoute>
                    <Admin />
                  </AdminRoute>
                }
              />
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
