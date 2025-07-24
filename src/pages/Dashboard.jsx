import React from "react";
import { useData } from "../context/DataContext";
import { FiCalendar, FiUsers, FiCheckCircle } from "react-icons/fi";
import "./Dashboard.css";

// This is a small, reusable component for the stats at the top.
const StatCard = ({ icon, label, value, color }) => (
  <div className="stat-card">
    <div className="stat-icon" style={{ backgroundColor: color }}>
      {icon}
    </div>
    <div className="stat-info">
      <span className="stat-value">{value}</span>
      <span className="stat-label">{label}</span>
    </div>
  </div>
);

export const Dashboard = () => {
  const { appointments, queue } = useData();
  const todayString = new Date().toISOString().split("T")[0]; // "YYYY-MM-DD"

  // --- Daily Stats Logic (remains the same) ---
  const todaysAppointments = appointments.filter(
    (apt) => apt.date === todayString
  );
  const waitingInQueue = queue.filter((p) => p.status === "Waiting").length;
  const completedAppointments = todaysAppointments.filter(
    (a) => a.status === "Completed"
  ).length;

  // --- NEW LOGIC for the Upcoming Appointments List ---
  const allUpcomingAppointments = appointments
    // 1. Filter for appointments that are today or in the future AND are 'Confirmed'
    .filter((apt) => apt.date >= todayString && apt.status === "Confirmed")
    // 2. Sort them chronologically, first by date, then by time
    .sort((a, b) => {
      if (a.date > b.date) return 1;
      if (a.date < b.date) return -1;
      return a.time.localeCompare(b.time); // If dates are same, sort by time
    })
    // 3. Limit the list to the next 5 appointments to keep the dashboard clean
    .slice(0, 5);

  // Helper to format the date for the new list style
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
    <div className="page">
      <h1>Today's Overview</h1>
      <p className="subtitle">A real-time summary of clinic activity.</p>

      <div className="stats-grid">
        <StatCard
          icon={<FiCalendar />}
          label="Total Appointments Today"
          value={todaysAppointments.length}
          color="var(--primary-color)"
        />
        <StatCard
          icon={<FiUsers />}
          label="Patients Currently in Queue"
          value={waitingInQueue}
          color="var(--yellow)"
        />
        <StatCard
          icon={<FiCheckCircle />}
          label="Appointments Completed Today"
          value={completedAppointments}
          color="var(--green)"
        />
      </div>

      <div className="columns">
        <div className="list-container">
          <h2>Upcoming Appointments</h2>
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
                </div>
              );
            })
          ) : (
            <div className="list-item-empty">
              <p>No upcoming appointments found.</p>
            </div>
          )}
        </div>
        <div className="list-container">
          <h2>Current Queue</h2>
          {queue.filter((p) => p.status === "Waiting").length > 0 ? (
            queue
              .filter((p) => p.status === "Waiting")
              .map((p) => (
                <div key={p.id} className="list-item">
                  <span>
                    #{p.position} - {p.patientName}
                  </span>
                  <span className="item-subtext">Joined at {p.joinTime}</span>
                </div>
              ))
          ) : (
            <div className="list-item-empty">
              <p>The queue is currently empty.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
