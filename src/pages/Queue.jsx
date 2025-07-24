import React, { useState } from "react";
import { useData } from "../context/DataContext";
import { AddWalkInModal } from "../components/AddWalkInModal.jsx";
import { FiUserCheck, FiUserX, FiPlus, FiSend, FiCheck } from "react-icons/fi";
import "./Queue.css";

export const Queue = () => {
  const { queue, callNextInQueue, completeQueueMember, notifyPatient } =
    useData();
  const [showModal, setShowModal] = useState(false);

  const waiting = queue.filter((p) => p.status === "Waiting");
  const called = queue.find((p) => p.status === "Called");

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
        </div>

        {called && (
          <div className="now-serving-card">
            <h2>Now Serving</h2>
            <div className="patient-details">
              <span className="patient-name">{called.patientName}</span>
              <span className="patient-position">
                Position #{called.position}
              </span>
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
              <div key={p.id} className="queue-item">
                <div className="queue-item-info">
                  <span className="queue-position">#{p.position}</span>
                  <span className="queue-name">{p.patientName}</span>
                </div>
                <div className="queue-item-actions">
                  {/* NEW: Conditional "Notify" button */}
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
            ))}
          {waiting.length === 0 && (
            <p className="empty-message">The queue is currently empty.</p>
          )}
        </div>
      </div>
    </>
  );
};
