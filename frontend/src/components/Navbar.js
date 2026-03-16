import React from "react";
import { Link, NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function Navbar() {
  const { user, logout, isAuthenticated, isAdmin } = useAuth();

  return (
    <nav className="navbar">
      <Link to="/" className="navbar-brand">
        Rent<span>Ease</span>
      </Link>
      <ul className="navbar-links">
        <li>
          <NavLink
            to="/"
            end
            className={({ isActive }) => (isActive ? "active" : "")}
          >
            Browse Items
          </NavLink>
        </li>
        {isAuthenticated && (
          <li>
            <NavLink
              to="/orders"
              className={({ isActive }) => (isActive ? "active" : "")}
            >
              My Orders
            </NavLink>
          </li>
        )}
        {isAdmin && (
          <li>
            <NavLink
              to="/admin"
              className={({ isActive }) => (isActive ? "active" : "")}
            >
              Admin
            </NavLink>
          </li>
        )}
        {!isAuthenticated ? (
          <li>
            <Link to="/login" className="login-link">
              Login
            </Link>
          </li>
        ) : (
          <li className="user-menu">
            <span className="user-greeting">Hi, {user?.name}</span>
            <button onClick={logout} className="logout-btn">
              Logout
            </button>
          </li>
        )}
      </ul>
    </nav>
  );
}

export default Navbar;
