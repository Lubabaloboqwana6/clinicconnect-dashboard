import React, { useState, useEffect } from "react";
import { useData } from "../context/DataContext";
import { queueService } from "../services/queueService"; // Direct import for enhanced features
import { AddWalkInModal } from "../components/AddWalkInModal.jsx";
import {
  FiUserCheck,
  FiUserX,
  FiPlus,
  FiSend,
  FiCheck,
  FiInfo,
  FiPhone,
  FiFileText,
  FiBell,
  FiClock,
  FiUsers,
  FiSmartphone,
  FiWifi,
  FiAlertCircle,
} from "react-icons/fi";
import "./Queue.css";

export const Queue = () => {
  const { queue, callNextInQueue, completeQueueMember, notifyPatient } =
    useData();
  const [showModal, setShowModal] = useState(false);
  const [showDetailsFor, setShowDetailsFor] = useState(null);
  const [notifyingPatient, setNotifyingPatient] = useState(null);
  const [notifiablePatients, setNotifiablePatients] = useState([]);
  const [lastNotificationResult, setLastNotificationResult] = useState(null);
  const [isSmartNotifying, setIsSmartNotifying] = useState(false);

  const waiting = queue.filter((p) => p.status === "Waiting");
  const called = queue.find((p) => p.status === "Called");

  // Get the next patient in line (lowest position)
  const nextPatient =
    waiting.length > 0
      ? waiting.reduce((min, patient) =>
          patient.position < min.position ? patient : min
        )
      : null;

  // Get app users who are next in line and haven't been notified
  const nextAppUser = waiting
    .filter(
      (p) => (p.type === "app" || p.type === "appointment") && !p.notified
    )
    .sort((a, b) => a.position - b.position)[0];

  // Load notifiable patients on component mount and queue changes
  useEffect(() => {
    loadNotifiablePatients();
  }, [queue]);

  const loadNotifiablePatients = async () => {
    try {
      const notifiable = await queueService.getNotifiablePatients();
      setNotifiablePatients(notifiable);
    } catch (error) {
      console.error("Failed to load notifiable patients:", error);
    }
  };

  const toggleDetails = (patientId) => {
    setShowDetailsFor(showDetailsFor === patientId ? null : patientId);
  };

  // NEW: Smart notification - notifies multiple patients strategically
  const handleSmartNotify = async () => {
    setIsSmartNotifying(true);
    setLastNotificationResult(null);

    try {
      const result = await queueService.notifyNextInQueue();
      setLastNotificationResult(result);

      if (result.success && result.notifiedPatients.length > 0) {
        // Show success message
        const names = result.notifiedPatients.map((p) => p.name).join(", ");
        console.log(`✅ Smart notification sent to: ${names}`);
      }

      // Refresh notifiable patients list
      await loadNotifiablePatients();
    } catch (error) {
      setLastNotificationResult({
        success: false,
        message: error.message,
        notifiedPatients: [],
      });
    } finally {
      setIsSmartNotifying(false);
    }
  };

  // Individual patient notification
  const handleNotifySpecific = async (patientId) => {
    setNotifyingPatient(patientId);
    try {
      const result = await queueService.notifyPatient(patientId);
      console.log("✅ Individual notification result:", result);
      await loadNotifiablePatients();
    } catch (error) {
      alert(`Failed to notify patient: ${error.message}`);
    } finally {
      setNotifyingPatient(null);
    }
  };

  // Legacy single notify (for compatibility)
  const handleNotifyNext = async () => {
    if (!nextAppUser) {
      alert("No app users in queue to notify.");
      return;
    }
    await handleNotifySpecific(nextAppUser.id);
  };

  // Get notification button text and state
  const getNotificationButtonState = () => {
    const eligibleCount = notifiablePatients.filter((p) => p.canNotify).length;

    if (eligibleCount === 0) {
      return {
        text: "No App Users to Notify",
        disabled: true,
        icon: FiAlertCircle,
      };
    } else if (eligibleCount === 1) {
      return {
        text: `Notify Next App User`,
        disabled: false,
        icon: FiBell,
      };
    } else {
      return {
        text: `Smart Notify (${eligibleCount} patients)`,
        disabled: false,
        icon: FiSmartphone,
      };
    }
  };

  const notificationButtonState = getNotificationButtonState();

  return (
    <>
      <AddWalkInModal show={showModal} onClose={() => setShowModal(false)} />

      <div className="page">
        <div className="page-header">
          <div>
            <h1>Live Queue Management</h1>
            <p className="subtitle">
              Manage patients waiting for walk-in services with smart
              notifications.
            </p>
          </div>
          <button className="add-walkin-btn" onClick={() => setShowModal(true)}>
            <FiPlus /> Add Walk-in
          </button>
        </div>

        {/* Enhanced Action Bar with Smart Notifications */}
        <div className="queue-actions">
          <button
            className="call-next-btn"
            onClick={callNextInQueue}
            disabled={waiting.length === 0}
          >
            <FiUserCheck /> Call Next Patient
          </button>

          {/* Smart Notification Button */}
          <button
            className={`smart-notify-btn ${
              notificationButtonState.disabled ? "disabled" : ""
            }`}
            onClick={handleSmartNotify}
            disabled={notificationButtonState.disabled || isSmartNotifying}
          >
            {isSmartNotifying ? (
              <>
                <FiClock className="spinning" /> Notifying...
              </>
            ) : (
              <>
                <notificationButtonState.icon /> {notificationButtonState.text}
              </>
            )}
          </button>

          {waiting.length > 0 && (
            <div className="queue-summary">
              <span>
                <FiUsers /> {waiting.length} waiting
              </span>
              <span>•</span>
              <span>
                <FiClock /> Est. wait: {waiting.length * 15} min
              </span>
              {notifiablePatients.length > 0 && (
                <>
                  <span>•</span>
                  <span className="notifiable-count">
                    <FiSmartphone />{" "}
                    {notifiablePatients.filter((p) => p.canNotify).length} ready
                    to notify
                  </span>
                </>
              )}
            </div>
          )}
        </div>

        {/* Notification Result Display */}
        {lastNotificationResult && (
          <div
            className={`notification-result ${
              lastNotificationResult.success ? "success" : "error"
            }`}
          >
            <div className="result-content">
              <span className="result-icon">
                {lastNotificationResult.success ? "✅" : "❌"}
              </span>
              <span className="result-message">
                {lastNotificationResult.message}
              </span>
              {lastNotificationResult.notifiedPatients.length > 0 && (
                <div className="notified-list">
                  {lastNotificationResult.notifiedPatients.map((p) => (
                    <span key={p.id} className="notified-patient">
                      {p.name} (#{p.position}, ~{p.estimatedWait})
                    </span>
                  ))}
                </div>
              )}
            </div>
            <button
              className="close-result"
              onClick={() => setLastNotificationResult(null)}
            >
              ×
            </button>
          </div>
        )}

        {/* Currently Serving Section */}
        {called && (
          <div className="now-serving-card">
            <h2>Now Serving</h2>
            <div className="patient-details">
              <div className="patient-info">
                <span className="patient-name">{called.patientName}</span>
                <span className="patient-position">
                  Position #{called.position}
                </span>
              </div>
              {called.idNumber && (
                <div className="patient-meta">
                  <span className="id-number">ID: {called.idNumber}</span>
                  {called.reasonForVisit && (
                    <span className="reason">
                      Reason: {called.reasonForVisit}
                    </span>
                  )}
                </div>
              )}
            </div>
            <button
              className="complete-btn"
              onClick={() => completeQueueMember(called.id)}
            >
              <FiUserCheck /> Mark as Completed
            </button>
          </div>
        )}

        {/* Waiting List with Enhanced Notifications */}
        <div className="waiting-list">
          <div className="waiting-list-header">
            <h2>Waiting ({waiting.length})</h2>
            {notifiablePatients.length > 0 && (
              <div className="notification-summary">
                <FiWifi className="notification-icon" />
                <span>
                  {notifiablePatients.filter((p) => p.canNotify).length} app
                  users ready for notification
                </span>
              </div>
            )}
          </div>

          {waiting
            .sort((a, b) => a.position - b.position)
            .map((p, index) => {
              const notifiableInfo = notifiablePatients.find(
                (n) => n.id === p.id
              );
              const isNextPatient = p.id === nextPatient?.id;

              return (
                <div key={p.id} className="queue-item-container">
                  <div
                    className={`queue-item ${
                      isNextPatient ? "next-patient" : ""
                    }`}
                  >
                    <div className="queue-item-info">
                      <span
                        className={`queue-position ${
                          isNextPatient ? "next" : ""
                        }`}
                      >
                        #{p.position}
                        {isNextPatient && (
                          <span className="next-label">NEXT</span>
                        )}
                      </span>
                      <div className="queue-details">
                        <span className="queue-name">
                          {p.patientName}
                          {(p.type === "app" || p.type === "appointment") && (
                            <span className="app-badge">📱 App User</span>
                          )}
                          {notifiableInfo && (
                            <span className="estimated-wait">
                              ~{notifiableInfo.estimatedWait}
                            </span>
                          )}
                        </span>
                        <span className="queue-time">
                          Joined at {p.joinTime}
                        </span>
                        {p.reasonForVisit && (
                          <span className="queue-reason">
                            <FiFileText size={12} /> {p.reasonForVisit}
                          </span>
                        )}
                        {/* Enhanced notification status */}
                        {(p.type === "app" || p.type === "appointment") && (
                          <div className="notification-status">
                            {p.notified ? (
                              <span className="notified-status">
                                <FiCheck size={12} color="#10B981" />
                                Notified
                                {p.lastNotifiedAt && (
                                  <span className="notification-time">
                                    at{" "}
                                    {new Date(
                                      p.lastNotifiedAt
                                    ).toLocaleTimeString([], {
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    })}
                                  </span>
                                )}
                              </span>
                            ) : notifiableInfo?.canNotify ? (
                              <span className="can-notify-status">
                                <FiBell size={12} color="#F59E0B" /> Ready to
                                notify
                              </span>
                            ) : (
                              <span className="waiting-status">
                                <FiClock size={12} color="#6B7280" /> Waiting
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="queue-item-actions">
                      {/* Show details button for walk-ins with additional info */}
                      {p.type === "walk-in" &&
                        (p.idNumber || p.phoneNumber) && (
                          <button
                            className="details-btn"
                            onClick={() => toggleDetails(p.id)}
                            title="View details"
                          >
                            <FiInfo />
                          </button>
                        )}

                      {/* Enhanced notification system for app users */}
                      {(p.type === "app" || p.type === "appointment") && (
                        <>
                          {!p.notified && notifiableInfo?.canNotify ? (
                            <button
                              className="notify-btn"
                              onClick={() => handleNotifySpecific(p.id)}
                              disabled={notifyingPatient === p.id}
                              title={`Notify ${p.patientName} (Est. wait: ${notifiableInfo.estimatedWait})`}
                            >
                              {notifyingPatient === p.id ? (
                                <>
                                  <FiClock className="spinning" /> ...
                                </>
                              ) : (
                                <>
                                  <FiSend /> Notify
                                </>
                              )}
                            </button>
                          ) : p.notified ? (
                            <button className="notify-btn notified" disabled>
                              <FiCheck /> Notified
                            </button>
                          ) : (
                            <button className="notify-btn disabled" disabled>
                              <FiClock /> Too Early
                            </button>
                          )}
                        </>
                      )}

                      <button
                        className="remove-btn"
                        onClick={() => completeQueueMember(p.id)}
                        title={`Remove ${p.patientName} from queue`}
                      >
                        <FiUserX /> Remove
                      </button>
                    </div>
                  </div>

                  {/* Expandable details section */}
                  {showDetailsFor === p.id && (
                    <div className="queue-item-details">
                      <div className="details-content">
                        {p.idNumber && (
                          <div className="detail-item">
                            <strong>ID Number:</strong> {p.idNumber}
                          </div>
                        )}
                        {p.phoneNumber && (
                          <div className="detail-item">
                            <FiPhone size={14} />
                            <strong>Phone:</strong> {p.phoneNumber}
                          </div>
                        )}
                        {p.reasonForVisit && (
                          <div className="detail-item">
                            <FiFileText size={14} />
                            <strong>Reason for Visit:</strong>{" "}
                            {p.reasonForVisit}
                          </div>
                        )}
                        <div className="detail-item">
                          <strong>Patient Type:</strong>
                          {p.type === "app" || p.type === "appointment"
                            ? "📱 App User"
                            : "🚶 Walk-in"}
                        </div>
                        {notifiableInfo && (
                          <div className="detail-item">
                            <strong>Estimated Wait:</strong>{" "}
                            {notifiableInfo.estimatedWait}
                          </div>
                        )}
                        {p.notificationCount && (
                          <div className="detail-item">
                            <strong>Notifications Sent:</strong>{" "}
                            {p.notificationCount}
                          </div>
                        )}
                        <div className="detail-item">
                          <strong>Added:</strong>{" "}
                          {new Date(p.addedAt || Date.now()).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          {waiting.length === 0 && (
            <p className="empty-message">
              The queue is currently empty. Add walk-in patients or they can
              join via the app.
            </p>
          )}
        </div>
      </div>
    </>
  );
};
