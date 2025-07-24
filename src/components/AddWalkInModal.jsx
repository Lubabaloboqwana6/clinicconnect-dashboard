import React, { useState } from "react";
import { useData } from "../context/DataContext";
import "./AddAppointmentModal.css";

export const AddWalkInModal = ({ show, onClose }) => {
  const { addWalkInToQueue } = useData();

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    idNumber: "",
    phoneNumber: "",
    reasonForVisit: "",
  });

  if (!show) {
    return null;
  }

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!formData.firstName.trim() || !formData.lastName.trim()) {
      alert("Please enter both first name and last name.");
      return;
    }

    if (!formData.idNumber.trim()) {
      alert("Please enter an ID number.");
      return;
    }

    // Validate South African ID number format (13 digits)
    const idRegex = /^\d{13}$/;
    if (!idRegex.test(formData.idNumber.replace(/\s/g, ""))) {
      alert("Please enter a valid 13-digit ID number.");
      return;
    }

    const fullName = `${formData.firstName.trim()} ${formData.lastName.trim()}`;

    // Pass the enhanced data to the queue
    addWalkInToQueue({
      fullName,
      idNumber: formData.idNumber.trim(),
      phoneNumber: formData.phoneNumber.trim(),
      reasonForVisit: formData.reasonForVisit.trim(),
    });

    onClose();

    // Clear form
    setFormData({
      firstName: "",
      lastName: "",
      idNumber: "",
      phoneNumber: "",
      reasonForVisit: "",
    });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    // Format ID number as user types (add spaces for readability)
    if (name === "idNumber") {
      const cleanValue = value.replace(/\s/g, "");
      if (cleanValue.length <= 13 && /^\d*$/.test(cleanValue)) {
        const formattedValue = cleanValue
          .replace(/(\d{6})(\d{4})(\d{2})(\d{1})/, "$1 $2 $3 $4")
          .trim();
        setFormData((prev) => ({ ...prev, [name]: formattedValue }));
      }
      return;
    }

    // Format phone number
    if (name === "phoneNumber") {
      const cleanValue = value.replace(/\D/g, "");
      if (cleanValue.length <= 10) {
        const formattedValue = cleanValue
          .replace(/(\d{3})(\d{3})(\d{4})/, "$1 $2 $3")
          .trim();
        setFormData((prev) => ({ ...prev, [name]: formattedValue }));
      }
      return;
    }

    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h2>Add Walk-in Patient to Queue</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group-row">
            <div className="form-group">
              <label htmlFor="firstName">First Name *</label>
              <input
                id="firstName"
                name="firstName"
                type="text"
                value={formData.firstName}
                onChange={handleChange}
                placeholder="Enter first name"
                required
                autoFocus
              />
            </div>
            <div className="form-group">
              <label htmlFor="lastName">Last Name *</label>
              <input
                id="lastName"
                name="lastName"
                type="text"
                value={formData.lastName}
                onChange={handleChange}
                placeholder="Enter last name"
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="idNumber">ID Number *</label>
            <input
              id="idNumber"
              name="idNumber"
              type="text"
              value={formData.idNumber}
              onChange={handleChange}
              placeholder="Enter 13-digit ID number"
              required
              maxLength="16" // Allow for spaces
            />
            <small
              style={{
                color: "var(--text-light)",
                fontSize: "12px",
                marginTop: "4px",
                display: "block",
              }}
            >
              Enter a valid 13-digit South African ID number
            </small>
          </div>

          <div className="form-group">
            <label htmlFor="phoneNumber">Phone Number</label>
            <input
              id="phoneNumber"
              name="phoneNumber"
              type="tel"
              value={formData.phoneNumber}
              onChange={handleChange}
              placeholder="Enter phone number (optional)"
            />
          </div>

          <div className="form-group">
            <label htmlFor="reasonForVisit">Reason for Visit</label>
            <input
              id="reasonForVisit"
              name="reasonForVisit"
              type="text"
              value={formData.reasonForVisit}
              onChange={handleChange}
              placeholder="Brief description (optional)"
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
