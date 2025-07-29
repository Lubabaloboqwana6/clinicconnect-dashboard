import React, { useState, useEffect } from "react";
import { useData } from "../context/DataContext";
import { queueService } from "../services/queueService";
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
  const { queue, callNextInQueue, completeQueueMember } = useData();
  const [showModal, setShowModal] = useState(false);
  const [showDetailsFor, setShowDetailsFor] = useState(null);
  const [notifyingPatientId, setNotifyingPatientId] = useState(null);
  const [notifiablePatients, setNotifiablePatients] = useState([]);
  const [lastNotificationResult, setLastNotificationResult] = useState(null);
  const [isSmartNotifying, setIsSmartNotifying] = useState(false);

  const waiting = queue.filter((p) => p.status === "Waiting");
  const called = queue.find((p) => p.status === "Called");
  const nextPatient =
    waiting.length > 0
      ? waiting.reduce((min, patient) =>
          patient.position < min.position ? patient : min
        )
      : null;

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

  const handleSmartNotify = async () => {
    setIsSmartNotifying(true);
    setLastNotificationResult(null);

    try {
      const patientsToNotify = notifiablePatients.filter((p) => p.canNotify);
      if (patientsToNotify.length === 0) {
        setLastNotificationResult({
          success: false,
          message: "No new app users are ready to be notified.",
          notifiedPatients: [],
        });
        return; // Exit early
      }

      // --- Trigger SMS for each patient ---
      const smsPromises = patientsToNotify.map((patient) => {
        // Construct a personalized message
        const message = `Hi ${patient.name}, you are almost next in the queue at ClinicConnect+ (~${patient.estimatedWait} wait). Please prepare to be called.`;
        // Send SMS via our new service which calls the backend
        return queueService.sendSms(patient.phoneNumber, message);
      });

      // --- Update the database status for each patient ---
      const dbUpdatePromises = patientsToNotify.map((patient) =>
        queueService.notifyPatient(patient.id)
      );

      // Run SMS and DB updates in parallel for efficiency
      await Promise.all([...smsPromises, ...dbUpdatePromises]);

      setLastNotificationResult({
        success: true,
        message: `Successfully sent SMS notifications to ${patientsToNotify.length} patient(s).`,
        notifiedPatients: patientsToNotify,
      });

      // Refresh the list to reflect updated 'notified' status
      await loadNotifiablePatients();
    } catch (error) {
      setLastNotificationResult({
        success: false,
        message:
          error.message || "An unexpected error occurred during notification.",
        notifiedPatients: [],
      });
    } finally {
      setIsSmartNotifying(false);
    }
  };

  const handleNotifySpecific = async (patientId) => {
    setNotifyingPatientId(patientId);
    try {
      const patient = notifiablePatients.find((p) => p.id === patientId);
      if (!patient || !patient.phoneNumber) {
        throw new Error("Patient phone number not available.");
      }

      // --- Send the SMS ---
      const message = `Hi ${patient.name}, you are next in the queue at ClinicConnect+ (~${patient.estimatedWait} wait). Please prepare to be called.`;
      const smsResult = await queueService.sendSms(
        patient.phoneNumber,
        message
      );

      if (!smsResult.success) {
        throw new Error(smsResult.message);
      }

      // --- Update the database ---
      await queueService.notifyPatient(patient.id);

      console.log(
        "✅ Individual notification sent and DB updated for:",
        patient.name
      );
      await loadNotifiablePatients();
    } catch (error) {
      alert(`Failed to notify patient: ${error.message}`);
    } finally {
      setNotifyingPatientId(null);
    }
  };

  const getNotificationButtonState = () => {
    const eligibleCount = notifiablePatients.filter((p) => p.canNotify).length;

    if (eligibleCount === 0) {
      return {
        text: "No App Users to Notify",
        disabled: true,
        icon: FiAlertCircle,
      };
    } else {
      return {
        text: `Smart Notify (${eligibleCount} Patients)`,
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

        <div className="queue-actions">
          <button
            className="call-next-btn"
            onClick={callNextInQueue}
            disabled={waiting.length === 0}
          >
            <FiUserCheck /> Call Next Patient
          </button>

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

          {/* Summary */}
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
                      {p.name} (#{p.position})
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
            .map((p) => {
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
                        {(p.type === "app" || p.type === "appointment") && (
                          <div className="notification-status">
                            {p.notified ? (
                              <span className="notified-status">
                                <FiCheck size={12} /> Notified{" "}
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
                                <FiBell size={12} /> Ready to notify
                              </span>
                            ) : (
                              <span className="waiting-status">
                                <FiClock size={12} /> Waiting
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="queue-item-actions">
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
                      {(p.type === "app" || p.type === "appointment") && (
                        <button
                          className="notify-btn"
                          onClick={() => handleNotifySpecific(p.id)}
                          disabled={
                            !notifiableInfo?.canNotify ||
                            notifyingPatientId === p.id
                          }
                          title={p.notified ? "Already Notified" : "Notify Now"}
                        >
                          {notifyingPatientId === p.id ? (
                            <>
                              <FiClock className="spinning" />
                              ...
                            </>
                          ) : p.notified ? (
                            <>
                              <FiCheck /> Notified
                            </>
                          ) : (
                            <>
                              <FiSend /> Notify
                            </>
                          )}
                        </button>
                      )}
                      <button
                        className="remove-btn"
                        onClick={() => completeQueueMember(p.id)}
                        title={`Remove ${p.patientName}`}
                      >
                        <FiUserX /> Remove
                      </button>
                    </div>
                  </div>
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
                            <strong>Reason:</strong> {p.reasonForVisit}
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
            <p className="empty-message">The queue is currently empty.</p>
          )}
        </div>
      </div>
    </>
  );
};
