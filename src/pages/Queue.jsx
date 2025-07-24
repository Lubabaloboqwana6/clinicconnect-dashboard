import React, { useState } from "react";
import { useData } from "../context/DataContext";
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
} from "react-icons/fi";
import "./Queue.css";

export const Queue = () => {
  const { queue, callNextInQueue, completeQueueMember, notifyPatient } =
    useData();
  const [showModal, setShowModal] = useState(false);
  const [showDetailsFor, setShowDetailsFor] = useState(null);

  const waiting = queue.filter((p) => p.status === "Waiting");
  const called = queue.find((p) => p.status === "Called");

  const toggleDetails = (patientId) => {
    setShowDetailsFor(showDetailsFor === patientId ? null : patientId);
  };

  return (
    <>
      <AddWalkInModal show={showModal} onClose={() => setShowModal(false)} />

      <div className="page">
        <div className="page-header">
          <div>
            <h1>Live Queue Management</h1>
            <p className="subtitle">
              Manage patients waiting for walk-in services.
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
            Call Next Patient
          </button>
          {waiting.length > 0 && (
            <div className="queue-summary">
              <span>
                {waiting.length} patient{waiting.length !== 1 ? "s" : ""}{" "}
                waiting
              </span>
              <span>•</span>
              <span>Est. wait time: {waiting.length * 15} min</span>
            </div>
          )}
        </div>

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
          <h2>Waiting ({waiting.length})</h2>
          {waiting
            .sort((a, b) => a.position - b.position)
            .map((p) => (
              <div key={p.id} className="queue-item-container">
                <div className="queue-item">
                  <div className="queue-item-info">
                    <span className="queue-position">#{p.position}</span>
                    <div className="queue-details">
                      <span className="queue-name">{p.patientName}</span>
                      <span className="queue-time">Joined at {p.joinTime}</span>
                      {p.reasonForVisit && (
                        <span className="queue-reason">
                          <FiFileText size={12} /> {p.reasonForVisit}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="queue-item-actions">
                    {/* Show details button for walk-ins with additional info */}
                    {p.type === "walk-in" && (p.idNumber || p.phoneNumber) && (
                      <button
                        className="details-btn"
                        onClick={() => toggleDetails(p.id)}
                        title="View details"
                      >
                        <FiInfo />
                      </button>
                    )}

                    {/* Notify button for app users */}
                    {p.type === "app" &&
                      (!p.notified ? (
                        <button
                          className="notify-btn"
                          onClick={() => notifyPatient(p.id)}
                        >
                          <FiSend /> Notify
                        </button>
                      ) : (
                        <button className="notify-btn notified" disabled>
                          <FiCheck /> Notified
                        </button>
                      ))}

                    <button
                      className="remove-btn"
                      onClick={() => completeQueueMember(p.id)}
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
                          <strong>Reason for Visit:</strong> {p.reasonForVisit}
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
            ))}
          {waiting.length === 0 && (
            <p className="empty-message">The queue is currently empty.</p>
          )}
        </div>
      </div>
    </>
  );
};
