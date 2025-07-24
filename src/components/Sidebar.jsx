import React from "react";
import { NavLink } from "react-router-dom";
import { FiGrid, FiCalendar, FiUsers } from "react-icons/fi";
import "./Sidebar.css";

export const Sidebar = () => (
  <nav className="sidebar">
    <div className="sidebar-header">
      <h3>ClinicConnect+</h3>
    </div>
    <ul>
      <li>
        <NavLink to="/">
          <FiGrid /> Dashboard
        </NavLink>
      </li>
      <li>
        <NavLink to="/appointments">
          <FiCalendar /> Appointments
        </NavLink>
      </li>
      <li>
        <NavLink to="/queue">
          <FiUsers /> Live Queue
        </NavLink>
      </li>
    </ul>
  </nav>
);
