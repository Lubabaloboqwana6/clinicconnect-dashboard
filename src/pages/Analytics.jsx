import React, { useState } from "react";
import { useData } from "../context/DataContext";
import {
  FiTrendingUp,
  FiDollarSign,
  FiUsers,
  FiCalendar,
  FiBarChart2,
} from "react-icons/fi";
import "./Analytics.css";

export const Analytics = () => {
  const { getAnalytics } = useData();
  const [timeframe, setTimeframe] = useState("today");

  // It's assumed getAnalytics() synchronously returns the data object.
  // If it's an async call, this would need to be handled with useEffect.
  const analytics = getAnalytics();
  const currentData = analytics[timeframe];

  // StatCard sub-component for displaying key metrics
  const StatCard = ({ icon, title, value, change, color }) => (
    <div className="analytics-card">
      <div className="card-header">
        <div className="card-icon" style={{ backgroundColor: color }}>
          {icon}
        </div>
        <div className="card-info">
          <h3>{title}</h3>
          <div className="card-value">{value}</div>
          {change && (
            <div className={`card-change ${change.type}`}>
              <FiTrendingUp size={14} />
              <span>{change.value}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  // ServiceChart sub-component for visualizing service breakdown
  const ServiceChart = ({ data }) => {
    const total = Object.values(data).reduce((sum, count) => sum + count, 0);
    const colors = ["#667eea", "#764ba2", "#10b981", "#f59e0b", "#ef4444"];

    return (
      <div className="service-chart">
        <h3>Services Breakdown</h3>
        <div className="chart-container">
          {Object.entries(data).map(([service, count], index) => {
            const percentage =
              total > 0 ? ((count / total) * 100).toFixed(1) : 0;
            return (
              <div key={service} className="service-item">
                <div className="service-bar">
                  <div
                    className="service-fill"
                    style={{
                      width: `${percentage}%`,
                      backgroundColor: colors[index % colors.length],
                    }}
                  />
                </div>
                <div className="service-info">
                  <span className="service-name">{service}</span>
                  <span className="service-count">
                    {count} ({percentage}%)
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Analytics Dashboard</h1>
          <p className="subtitle">Track clinic performance and metrics.</p>
        </div>

        <div className="timeframe-selector">
          <button
            className={timeframe === "today" ? "active" : ""}
            onClick={() => setTimeframe("today")}
          >
            Today
          </button>
          <button
            className={timeframe === "week" ? "active" : ""}
            onClick={() => setTimeframe("week")}
          >
            This Week
          </button>
          <button
            className={timeframe === "month" ? "active" : ""}
            onClick={() => setTimeframe("month")}
          >
            This Month
          </button>
        </div>
      </div>

      <div className="analytics-grid">
        <StatCard
          icon={<FiCalendar />}
          title="Total Appointments"
          value={currentData.appointments}
          change={{ type: "positive", value: "+12%" }}
          color="var(--primary-color)"
        />

        <StatCard
          icon={<FiUsers />}
          title="Completed Visits"
          value={currentData.completed}
          change={{ type: "positive", value: "+8%" }}
          color="var(--green)"
        />

        <StatCard
          icon={<FiDollarSign />}
          title="Revenue Generated"
          value={`R${currentData.revenue}`}
          change={{ type: "positive", value: "+15%" }}
          color="var(--secondary-color)"
        />

        <StatCard
          icon={<FiBarChart2 />}
          title="Queue Efficiency"
          value={analytics.queueMetrics.averageWaitTime}
          change={{ type: "negative", value: "-5 min" }}
          color="var(--yellow)"
        />
      </div>

      <div className="analytics-charts">
        <div className="chart-section">
          <ServiceChart data={analytics.serviceBreakdown} />
        </div>

        <div className="chart-section">
          <div className="queue-metrics">
            <h3>Queue Metrics</h3>
            <div className="metrics-grid">
              <div className="metric-item">
                <span className="metric-label">Average Wait Time</span>
                <span className="metric-value">
                  {analytics.queueMetrics.averageWaitTime}
                </span>
              </div>
              <div className="metric-item">
                <span className="metric-label">Patients Served</span>
                <span className="metric-value">
                  {analytics.queueMetrics.totalServed}
                </span>
              </div>
              <div className="metric-item">
                <span className="metric-label">Currently Waiting</span>
                <span className="metric-value">
                  {analytics.queueMetrics.currentWaiting}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="insights-section">
        <h2>Key Insights</h2>
        <div className="insights-grid">
          <div className="insight-card">
            <h4>Peak Hours</h4>
            <p>
              Most appointments are scheduled between 9:00 AM - 11:00 AM.
              Consider optimizing staff schedules during these hours.
            </p>
          </div>

          <div className="insight-card">
            <h4>Service Demand</h4>
            <p>
              General Practice accounts for{" "}
              {(
                ((analytics.serviceBreakdown["General Practice"] || 0) /
                  Math.max(
                    Object.values(analytics.serviceBreakdown).reduce(
                      (a, b) => a + b,
                      0
                    ),
                    1
                  )) *
                100
              ).toFixed(0)}
              % of all appointments.
            </p>
          </div>

          <div className="insight-card">
            <h4>Wait Time Optimization</h4>
            <p>
              Current average wait time is{" "}
              {analytics.queueMetrics.averageWaitTime}. Implementing appointment
              notifications could improve patient satisfaction.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
