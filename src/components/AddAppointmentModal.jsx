import React, { useState, useEffect } from "react"; // <-- Import useEffect
import { useData } from "../context/DataContext";
import "./AddAppointmentModal.css";

// MODIFIED: Accept a new 'selectedDate' prop
export const AddAppointmentModal = ({ show, onClose, selectedDate }) => {
  const { addAppointment } = useData();

  const [patientName, setPatientName] = useState("");
  const [service, setService] = useState("General Practice");

  // MODIFIED: The initial date is now based on the prop or defaults to today
  const [date, setDate] = useState(
    selectedDate || new Date().toISOString().split("T")[0]
  );
  const [time, setTime] = useState("");

  /**
   * NEW: This effect hook syncs the internal state with the prop.
   * If the modal is opened by clicking on a date, this ensures the date field is correctly set.
   */
  useEffect(() => {
    if (selectedDate) {
      setDate(selectedDate);
    } else {
      // If opened without a date, default to today
      setDate(new Date().toISOString().split("T")[0]);
    }
  }, [selectedDate, show]); // Re-run when the selectedDate or show prop changes

  if (!show) {
    return null;
  }

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!patientName || !service || !date || !time) {
      alert("Please fill out all fields.");
      return;
    }
    addAppointment({ patientName, service, date, time });

    onClose();
    setPatientName("");
    setService("General Practice");
    setTime("");
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h2>
          {selectedDate
            ? `Add Appointment for ${selectedDate}`
            : "Add New Appointment"}
        </h2>
        <form onSubmit={handleSubmit}>
          {/* The form fields remain the same, but the 'date' input is now controlled by the new logic */}
          <div className="form-group">
            <label htmlFor="patientName">Patient Name</label>
            <input
              id="patientName"
              type="text"
              value={patientName}
              onChange={(e) => setPatientName(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="service">Service</label>
            <select
              id="service"
              value={service}
              onChange={(e) => setService(e.target.value)}
            >
              <option>General Practice</option>
              <option>Chronic Care</option>
              <option>Maternal Care</option>
              <option>HIV/AIDS Care</option>
              <option>TB Treatment</option>
            </select>
          </div>
          <div className="form-group-row">
            <div className="form-group">
              <label htmlFor="date">Date</label>
              <input
                id="date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="time">Time</label>
              <input
                id="time"
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                required
              />
            </div>
          </div>
          <div className="modal-actions">
            <button type="button" className="btn-cancel" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-confirm">
              Save Appointment
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
