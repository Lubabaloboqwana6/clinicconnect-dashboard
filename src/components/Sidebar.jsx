import React from "react";
import { NavLink } from "react-router-dom";
import {
  FiGrid,
  FiCalendar,
  FiUsers,
  FiUser,
  FiBarChart2,
  FiActivity,
} from "react-icons/fi";
import "./Sidebar.css";

export const Sidebar = () => (
  <nav className="sidebar">
    <div className="sidebar-header">
      <h3>ClinicConnect+</h3>
      <div className="clinic-status">
        <FiActivity className="status-icon" />
        <span>Online</span>
      </div>
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
      <li>
        <NavLink to="/patients">
          <FiUser /> Patients
        </NavLink>
      </li>
      <li>
        <NavLink to="/analytics">
          <FiBarChart2 /> Analytics
        </NavLink>
      </li>
    </ul>

    <div className="sidebar-footer">
      <div className="user-info">
        <div className="user-avatar">
          <FiUser />
        </div>
        <div className="user-details">
          <span className="user-name">Dr. Smith</span>
          <span className="user-role">Administrator</span>
        </div>
      </div>
    </div>
  </nav>
);
