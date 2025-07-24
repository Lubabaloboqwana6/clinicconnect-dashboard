import React, { useState } from "react";
import { useData } from "../context/DataContext";
import { AddAppointmentModal } from "../components/AddAppointmentModal";
import { AddWalkInModal } from "../components/AddWalkInModal";
import {
  FiCalendar,
  FiUsers,
  FiCheckCircle,
  FiClock,
  FiPlus,
  FiUserPlus,
  FiActivity,
  FiTrendingUp,
  FiArrowRight,
  FiAlertCircle,
  FiBarChart2,
} from "react-icons/fi";
import { Link } from "react-router-dom";
import "./Dashboard.css";

const StatCard = ({ icon, label, value, color, trend, onClick }) => (
  <div className={`stat-card ${onClick ? "clickable" : ""}`} onClick={onClick}>
    <div className="stat-icon" style={{ backgroundColor: color }}>
      {icon}
    </div>
    <div className="stat-info">
      <span className="stat-value">{value}</span>
      <span className="stat-label">{label}</span>
      {trend && (
        <div className={`stat-trend ${trend.type}`}>
          <FiTrendingUp size={12} />
          <span>{trend.value}</span>
        </div>
      )}
    </div>
  </div>
);

const QuickAction = ({ icon, title, description, onClick, color }) => (
  <button className="quick-action" onClick={onClick}>
    <div className="action-icon" style={{ backgroundColor: color }}>
      {icon}
    </div>
    <div className="action-content">
      <h4>{title}</h4>
      <p>{description}</p>
    </div>
    <FiArrowRight className="action-arrow" />
  </button>
);

const RecentActivity = ({ activities }) => (
  <div className="recent-activity">
    <h3>Recent Activity</h3>
    <div className="activity-list">
      {activities.length > 0 ? (
        activities.map((activity, index) => (
          <div key={index} className="activity-item">
            <div className="activity-icon">
              <FiActivity size={16} />
            </div>
            <div className="activity-details">
              <span className="activity-text">{activity.text}</span>
              <span className="activity-time">{activity.time}</span>
            </div>
          </div>
        ))
      ) : (
        <p className="no-activity">No recent activity</p>
      )}
    </div>
  </div>
);

export const Dashboard = () => {
  const { appointments, queue, getAnalytics } = useData();
  const [showAppointmentModal, setShowAppointmentModal] = useState(false);
  const [showWalkInModal, setShowWalkInModal] = useState(false);

  const todayString = new Date().toISOString().split("T")[0];
  const analytics = getAnalytics();

  // Calculate stats
  const todaysAppointments = appointments.filter(
    (apt) => apt.date === todayString
  );
  const waitingInQueue = queue.filter((p) => p.status === "Waiting").length;
  const completedAppointments = todaysAppointments.filter(
    (a) => a.status === "Completed"
  ).length;
  const upcomingToday = todaysAppointments.filter(
    (a) => a.status === "Confirmed"
  ).length;

  // Generate recent activities
  const recentActivities = [
    { text: "New appointment scheduled for John Doe", time: "5 min ago" },
    { text: "Patient Alice Williams checked in", time: "12 min ago" },
    { text: "Queue position updated", time: "18 min ago" },
    { text: "Appointment completed for Peter Jones", time: "25 min ago" },
  ];

  // Upcoming appointments (next 5)
  const allUpcomingAppointments = appointments
    .filter((apt) => apt.date >= todayString && apt.status === "Confirmed")
    .sort((a, b) => {
      if (a.date > b.date) return 1;
      if (a.date < b.date) return -1;
      return a.time.localeCompare(b.time);
    })
    .slice(0, 5);

  const formatListDate = (dateString) => {
    const date = new Date(dateString);
    const timezoneOffset = date.getTimezoneOffset() * 60000;
    return {
      month: new Date(date.getTime() + timezoneOffset).toLocaleDateString(
        "en-US",
        { month: "short" }
      ),
      day: new Date(date.getTime() + timezoneOffset).getDate(),
    };
  };

  return (
    <>
      <AddAppointmentModal
        show={showAppointmentModal}
        onClose={() => setShowAppointmentModal(false)}
      />
      <AddWalkInModal
        show={showWalkInModal}
        onClose={() => setShowWalkInModal(false)}
      />

      <div className="page dashboard-page">
        <div className="dashboard-header">
          <div>
            <h1>Good morning, Dr. Smith!</h1>
            <p className="subtitle">
              Here's what's happening at your clinic today.
            </p>
          </div>
          <div className="current-time">
            <FiClock />
            <span>
              {new Date().toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          </div>
        </div>

        <div className="stats-grid">
          <StatCard
            icon={<FiCalendar />}
            label="Today's Appointments"
            value={todaysAppointments.length}
            color="var(--primary-color)"
            trend={{ type: "positive", value: "+12%" }}
          />
          <StatCard
            icon={<FiUsers />}
            label="In Queue"
            value={waitingInQueue}
            color="var(--yellow)"
            trend={{ type: "neutral", value: "stable" }}
          />
          <StatCard
            icon={<FiCheckCircle />}
            label="Completed Today"
            value={completedAppointments}
            color="var(--green)"
            trend={{ type: "positive", value: "+8%" }}
          />
          <StatCard
            icon={<FiAlertCircle />}
            label="Pending Check-ins"
            value={upcomingToday}
            color="var(--red)"
            trend={{ type: "negative", value: "2 overdue" }}
          />
        </div>

        <div className="quick-actions-section">
          <h2>Quick Actions</h2>
          <div className="quick-actions-grid">
            <QuickAction
              icon={<FiPlus />}
              title="Schedule Appointment"
              description="Book a new appointment for a patient"
              onClick={() => setShowAppointmentModal(true)}
              color="var(--primary-color)"
            />
            <QuickAction
              icon={<FiUserPlus />}
              title="Add Walk-in"
              description="Add a walk-in patient to the queue"
              onClick={() => setShowWalkInModal(true)}
              color="var(--green)"
            />
            <QuickAction
              icon={<FiUsers />}
              title="Manage Queue"
              description="View and manage the current patient queue"
              onClick={() => (window.location.href = "/queue")}
              color="var(--yellow)"
            />
            <QuickAction
              icon={<FiBarChart2 />}
              title="View Analytics"
              description="Check clinic performance and insights"
              onClick={() => (window.location.href = "/analytics")}
              color="var(--secondary-color)"
            />
          </div>
        </div>

        <div className="dashboard-content">
          <div className="content-grid">
            <div className="list-container upcoming-section">
              <div className="section-header">
                <h2>Upcoming Appointments</h2>
                <Link to="/appointments" className="view-all-link">
                  View All <FiArrowRight />
                </Link>
              </div>
              {allUpcomingAppointments.length > 0 ? (
                allUpcomingAppointments.map((apt) => {
                  const { month, day } = formatListDate(apt.date);
                  return (
                    <div key={apt.id} className="upcoming-list-item">
                      <div className="date-badge">
                        <span className="month">{month}</span>
                        <span className="day">{day}</span>
                      </div>
                      <div className="info">
                        <span className="patient-info">
                          {apt.time} - {apt.patientName}
                        </span>
                        <span className="service-info">{apt.service}</span>
                      </div>
                      <div className="appointment-status">
                        <span
                          className={`status-badge ${apt.status.toLowerCase()}`}
                        >
                          {apt.status}
                        </span>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="list-item-empty">
                  <p>No upcoming appointments found.</p>
                </div>
              )}
            </div>

            <div className="list-container queue-section">
              <div className="section-header">
                <h2>Current Queue</h2>
                <Link to="/queue" className="view-all-link">
                  Manage <FiArrowRight />
                </Link>
              </div>
              {queue.filter((p) => p.status === "Waiting").length > 0 ? (
                queue
                  .filter((p) => p.status === "Waiting")
                  .sort((a, b) => a.position - b.position)
                  .slice(0, 4)
                  .map((p) => (
                    <div key={p.id} className="queue-list-item">
                      <div className="queue-position">#{p.position}</div>
                      <div className="queue-info">
                        <span className="queue-name">{p.patientName}</span>
                        <span className="queue-time">
                          Joined at {p.joinTime}
                        </span>
                      </div>
                      <div className="queue-type">
                        <span className={`type-badge ${p.type}`}>{p.type}</span>
                      </div>
                    </div>
                  ))
              ) : (
                <div className="list-item-empty">
                  <p>The queue is currently empty.</p>
                </div>
              )}
            </div>

            <div className="list-container activity-section">
              <RecentActivity activities={recentActivities} />
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
