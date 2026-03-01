import React from "react";
import { Link, NavLink } from "react-router-dom";

function Navbar() {
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
        <li>
          <span className="login-link">Login</span>
        </li>
      </ul>
    </nav>
  );
}

export default Navbar;
