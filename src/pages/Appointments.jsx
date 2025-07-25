import React, { useState, useEffect } from "react";
import { FirebaseAppointmentModal } from "../components/FirebaseAppointmentModal"; // Use new component
import { appointmentsService } from "../services/appointmentsService";
import {
  FiPlus,
  FiCalendar,
  FiClock,
  FiMapPin,
  FiUser,
  FiEdit2,
  FiTrash2,
  FiX,
} from "react-icons/fi";
import "./Appointments.css";

export const Appointments = () => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState(null);
  const [filter, setFilter] = useState("all");
  const [stats, setStats] = useState({
    total: 0,
    confirmed: 0,
    pending: 0,
    cancelled: 0,
    today: 0,
    thisWeek: 0,
    upcoming: 0,
  });

  // Load appointments on component mount
  useEffect(() => {
    loadAppointments();
    loadStats();
  }, []);

  const loadAppointments = async () => {
    setLoading(true);
    setError(null);

    try {
      const appointmentsData = await appointmentsService.getAppointments();
      setAppointments(appointmentsData);
      console.log(`✅ Loaded ${appointmentsData.length} appointments`);
    } catch (err) {
      setError(err.message);
      console.error("Failed to load appointments:", err);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const statsData = await appointmentsService.getAppointmentStats();
      setStats(statsData);
    } catch (err) {
      console.error("Failed to load stats:", err);
    }
  };

  const handleDeleteAppointment = async (appointmentId) => {
    if (!window.confirm("Are you sure you want to delete this appointment?")) {
      return;
    }

    try {
      await appointmentsService.deleteAppointment(appointmentId);

      const deletedAppointment = appointments.find(
        (a) => a.id === appointmentId
      );
      setAppointments((prev) =>
        prev.filter((appointment) => appointment.id !== appointmentId)
      );

      // Update stats
      if (deletedAppointment) {
        setStats((prev) => ({
          ...prev,
          total: Math.max(0, prev.total - 1),
          confirmed:
            deletedAppointment.status === "confirmed"
              ? Math.max(0, prev.confirmed - 1)
              : prev.confirmed,
          pending:
            deletedAppointment.status === "pending"
              ? Math.max(0, prev.pending - 1)
              : prev.pending,
          cancelled:
            deletedAppointment.status === "cancelled"
              ? Math.max(0, prev.cancelled - 1)
              : prev.cancelled,
        }));
      }
    } catch (error) {
      alert(`Failed to delete appointment: ${error.message}`);
    }
  };

  const handleCancelAppointment = async (appointmentId) => {
    const reason = window.prompt("Reason for cancellation (optional):");
    if (reason === null) return; // User clicked cancel

    try {
      await appointmentsService.cancelAppointment(appointmentId, reason);

      setAppointments((prev) =>
        prev.map((appointment) =>
          appointment.id === appointmentId
            ? { ...appointment, status: "cancelled", cancelReason: reason }
            : appointment
        )
      );

      // Update stats
      setStats((prev) => ({
        ...prev,
        confirmed: prev.confirmed - 1,
        cancelled: prev.cancelled + 1,
      }));
    } catch (error) {
      alert(`Failed to cancel appointment: ${error.message}`);
    }
  };

  const handleReschedule = async (appointmentId) => {
    const newDate = window.prompt("Enter new date (YYYY-MM-DD):");
    if (!newDate) return;

    const newTime = window.prompt("Enter new time (HH:MM):");
    if (!newTime) return;

    try {
      await appointmentsService.rescheduleAppointment(
        appointmentId,
        newDate,
        newTime
      );

      setAppointments((prev) =>
        prev.map((appointment) =>
          appointment.id === appointmentId
            ? {
                ...appointment,
                date: newDate,
                time: newTime,
                status: "confirmed",
              }
            : appointment
        )
      );
    } catch (error) {
      alert(`Failed to reschedule appointment: ${error.message}`);
    }
  };

  const handleEdit = (appointment) => {
    setEditingAppointment(appointment);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingAppointment(null);
  };

  // Handle successful appointment creation/update from the modal
  const handleAppointmentSuccess = (appointment, action) => {
    console.log(`✅ Appointment ${action}:`, appointment);

    if (action === "added") {
      // Add new appointment to the list
      setAppointments((prev) => [appointment, ...prev]);
      setStats((prev) => ({
        ...prev,
        total: prev.total + 1,
        confirmed:
          appointment.status === "confirmed"
            ? prev.confirmed + 1
            : prev.confirmed,
        pending:
          appointment.status === "pending" ? prev.pending + 1 : prev.pending,
      }));
    } else if (action === "updated") {
      // Update existing appointment in the list
      setAppointments((prev) =>
        prev.map((apt) => (apt.id === appointment.id ? appointment : apt))
      );
    }

    // Reload stats
    loadStats();
  };

  // Filter appointments based on selected filter
  const filteredAppointments = appointments.filter((appointment) => {
    const today = new Date().toISOString().split("T")[0];
    const appointmentDate = appointment.date;

    switch (filter) {
      case "today":
        return appointmentDate === today;
      case "upcoming":
        return appointmentDate >= today;
      case "confirmed":
        return appointment.status === "confirmed";
      case "pending":
        return appointment.status === "pending";
      case "cancelled":
        return appointment.status === "cancelled";
      default:
        return true;
    }
  });

  const getStatusColor = (status) => {
    switch (status) {
      case "confirmed":
        return "#10B981";
      case "pending":
        return "#F59E0B";
      case "cancelled":
        return "#EF4444";
      default:
        return "#6B7280";
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatTime = (timeString) => {
    const [hours, minutes] = timeString.split(":");
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? "PM" : "AM";
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  return (
    <>
      {/* Use the new Firebase modal component */}
      <FirebaseAppointmentModal
        show={showModal}
        onClose={handleCloseModal}
        appointment={editingAppointment}
        onSuccess={handleAppointmentSuccess}
      />

      <div className="page">
        {/* Header */}
        <div className="page-header">
          <div>
            <h1>Appointment Management</h1>
            <p className="subtitle">
              Manage appointments with Firebase integration
              <span
                style={{
                  color: "#10B981",
                  fontWeight: "bold",
                  marginLeft: "10px",
                }}
              >
                🔥 Firebase Active
              </span>
            </p>
          </div>

          <button
            className="add-appointment-btn"
            onClick={() => setShowModal(true)}
            disabled={loading}
          >
            <FiPlus /> Schedule Appointment
          </button>
        </div>

        {/* Stats Cards */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-number">{stats.total}</div>
            <div className="stat-label">Total Appointments</div>
          </div>
          <div className="stat-card">
            <div className="stat-number" style={{ color: "#10B981" }}>
              {stats.confirmed}
            </div>
            <div className="stat-label">Confirmed</div>
          </div>
          <div className="stat-card">
            <div className="stat-number" style={{ color: "#F59E0B" }}>
              {stats.pending}
            </div>
            <div className="stat-label">Pending</div>
          </div>
          <div className="stat-card">
            <div className="stat-number" style={{ color: "#667eea" }}>
              {stats.today}
            </div>
            <div className="stat-label">Today</div>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div
            style={{
              background: "#FEF2F2",
              border: "1px solid #FECACA",
              color: "#DC2626",
              padding: "12px 20px",
              margin: "0 20px 20px 20px",
              borderRadius: "8px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <span>❌ {error}</span>
            <button
              onClick={loadAppointments}
              style={{
                padding: "4px 8px",
                border: "1px solid #DC2626",
                background: "white",
                color: "#DC2626",
                borderRadius: "4px",
                cursor: "pointer",
                fontSize: "12px",
              }}
            >
              Retry
            </button>
          </div>
        )}

        {/* Filter Tabs */}
        <div className="filter-tabs">
          {[
            { key: "all", label: "All", count: stats.total },
            { key: "upcoming", label: "Upcoming", count: stats.upcoming },
            { key: "today", label: "Today", count: stats.today },
            { key: "confirmed", label: "Confirmed", count: stats.confirmed },
            { key: "pending", label: "Pending", count: stats.pending },
            { key: "cancelled", label: "Cancelled", count: stats.cancelled },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className={`filter-tab ${filter === tab.key ? "active" : ""}`}
            >
              {tab.label} ({tab.count})
            </button>
          ))}
        </div>

        {/* Loading State */}
        {loading && (
          <div
            style={{
              textAlign: "center",
              padding: "60px",
              color: "#6B7280",
            }}
          >
            <div style={{ fontSize: "18px", marginBottom: "10px" }}>🔄</div>
            <div>Loading appointments from Firebase...</div>
          </div>
        )}

        {/* Appointments List */}
        {!loading && (
          <div className="appointments-list">
            {filteredAppointments.length > 0 ? (
              filteredAppointments.map((appointment) => (
                <div key={appointment.id} className="appointment-card">
                  <div className="appointment-header">
                    <div className="appointment-clinic">
                      <FiMapPin
                        style={{ color: "#667eea", marginRight: "8px" }}
                      />
                      {appointment.clinicName || appointment.patientName}
                    </div>
                    <div
                      className="appointment-status"
                      style={{
                        backgroundColor: getStatusColor(appointment.status),
                        color: "white",
                        padding: "4px 12px",
                        borderRadius: "12px",
                        fontSize: "12px",
                        fontWeight: "bold",
                        textTransform: "uppercase",
                      }}
                    >
                      {appointment.status}
                    </div>
                  </div>

                  <div className="appointment-details">
                    <div className="appointment-datetime">
                      <div className="datetime-item">
                        <FiCalendar
                          style={{ color: "#6B7280", marginRight: "6px" }}
                        />
                        {formatDate(appointment.date)}
                      </div>
                      <div className="datetime-item">
                        <FiClock
                          style={{ color: "#6B7280", marginRight: "6px" }}
                        />
                        {formatTime(appointment.time)}
                      </div>
                    </div>

                    {appointment.service && (
                      <div className="appointment-service">
                        <FiUser
                          style={{ color: "#6B7280", marginRight: "6px" }}
                        />
                        {appointment.service}
                      </div>
                    )}

                    {appointment.patientName && (
                      <div className="appointment-service">
                        <FiUser
                          style={{ color: "#6B7280", marginRight: "6px" }}
                        />
                        Patient: {appointment.patientName}
                      </div>
                    )}

                    {appointment.notes && (
                      <div className="appointment-notes">
                        <strong>Notes:</strong> {appointment.notes}
                      </div>
                    )}
                  </div>

                  <div className="appointment-actions">
                    <button
                      className="btn-edit"
                      onClick={() => handleEdit(appointment)}
                      disabled={loading}
                    >
                      <FiEdit2 /> Edit
                    </button>

                    {appointment.status !== "cancelled" && (
                      <>
                        <button
                          className="btn-reschedule"
                          onClick={() => handleReschedule(appointment.id)}
                          disabled={loading}
                        >
                          <FiClock /> Reschedule
                        </button>

                        <button
                          className="btn-cancel"
                          onClick={() =>
                            handleCancelAppointment(appointment.id)
                          }
                          disabled={loading}
                        >
                          <FiX /> Cancel
                        </button>
                      </>
                    )}

                    <button
                      className="btn-delete"
                      onClick={() => handleDeleteAppointment(appointment.id)}
                      disabled={loading}
                    >
                      <FiTrash2 /> Delete
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="empty-state">
                <div style={{ fontSize: "48px", marginBottom: "20px" }}>📅</div>
                <h3>No Appointments Found</h3>
                <p>
                  {filter !== "all"
                    ? `No ${filter} appointments found.`
                    : "Start by scheduling your first appointment."}
                </p>
                <button
                  className="add-appointment-btn"
                  onClick={() => setShowModal(true)}
                  disabled={loading}
                  style={{ marginTop: "20px" }}
                >
                  <FiPlus /> Schedule First Appointment
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
};
