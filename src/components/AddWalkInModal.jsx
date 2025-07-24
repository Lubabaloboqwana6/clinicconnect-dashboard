import React, { useState } from "react";
import { useData } from "../context/DataContext";
// We can reuse the same CSS from the appointment modal for consistency
import "./AddAppointmentModal.css";

export const AddWalkInModal = ({ show, onClose }) => {
  const { addWalkInToQueue } = useData();
  const [patientName, setPatientName] = useState("");

  if (!show) {
    return null;
  }

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!patientName.trim()) {
      alert("Please enter a patient name.");
      return;
    }
    addWalkInToQueue(patientName);
    onClose();
    setPatientName("");
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h2>Add Walk-in Patient to Queue</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="walkInPatientName">Patient Name</label>
            <input
              id="walkInPatientName"
              type="text"
              value={patientName}
              onChange={(e) => setPatientName(e.target.value)}
              placeholder="Enter full name"
              required
              autoFocus
            />
          </div>
          <div className="modal-actions">
            <button type="button" className="btn-cancel" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-confirm">
              Add to Queue
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
