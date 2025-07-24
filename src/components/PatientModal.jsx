import React, { useState, useEffect } from "react";
import { useData } from "../context/DataContext";
import "./AddAppointmentModal.css"; // Reusing existing modal styles

export const PatientModal = ({ show, onClose, patient }) => {
  const { addPatient, updatePatient } = useData();

  const [formData, setFormData] = useState({
    name: "",
    dateOfBirth: "",
    gender: "",
    phone: "",
    email: "",
    address: "",
    emergencyContact: "",
    emergencyPhone: "",
    medicalConditions: "",
    allergies: "",
    currentMedications: "",
  });

  useEffect(() => {
    if (patient) {
      setFormData(patient);
    } else {
      setFormData({
        name: "",
        dateOfBirth: "",
        gender: "",
        phone: "",
        email: "",
        address: "",
        emergencyContact: "",
        emergencyPhone: "",
        medicalConditions: "",
        allergies: "",
        currentMedications: "",
      });
    }
  }, [patient, show]);

  if (!show) return null;

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!formData.name || !formData.phone || !formData.dateOfBirth) {
      alert("Please fill out required fields (Name, Phone, Date of Birth).");
      return;
    }

    if (patient) {
      updatePatient(patient.id, formData);
    } else {
      addPatient(formData);
    }

    onClose();
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content patient-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <h2>{patient ? "Edit Patient" : "Add New Patient"}</h2>

        <form onSubmit={handleSubmit}>
          <div className="form-group-row">
            <div className="form-group">
              <label htmlFor="name">Full Name *</label>
              <input
                id="name"
                name="name"
                type="text"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="dateOfBirth">Date of Birth *</label>
              <input
                id="dateOfBirth"
                name="dateOfBirth"
                type="date"
                value={formData.dateOfBirth}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="form-group-row">
            <div className="form-group">
              <label htmlFor="gender">Gender</label>
              <select
                id="gender"
                name="gender"
                value={formData.gender}
                onChange={handleChange}
              >
                <option value="">Select Gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="phone">Phone Number *</label>
              <input
                id="phone"
                name="phone"
                type="tel"
                value={formData.phone}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label htmlFor="address">Address</label>
            <input
              id="address"
              name="address"
              type="text"
              value={formData.address}
              onChange={handleChange}
            />
          </div>

          <div className="form-group-row">
            <div className="form-group">
              <label htmlFor="emergencyContact">Emergency Contact</label>
              <input
                id="emergencyContact"
                name="emergencyContact"
                type="text"
                value={formData.emergencyContact}
                onChange={handleChange}
              />
            </div>
            <div className="form-group">
              <label htmlFor="emergencyPhone">Emergency Phone</label>
              <input
                id="emergencyPhone"
                name="emergencyPhone"
                type="tel"
                value={formData.emergencyPhone}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="medicalConditions">Medical Conditions</label>
            <input
              id="medicalConditions"
              name="medicalConditions"
              type="text"
              value={formData.medicalConditions}
              onChange={handleChange}
              placeholder="e.g., Diabetes, Hypertension"
            />
          </div>

          <div className="form-group">
            <label htmlFor="allergies">Allergies</label>
            <input
              id="allergies"
              name="allergies"
              type="text"
              value={formData.allergies}
              onChange={handleChange}
              placeholder="e.g., Penicillin, Peanuts"
            />
          </div>

          <div className="form-group">
            <label htmlFor="currentMedications">Current Medications</label>
            <input
              id="currentMedications"
              name="currentMedications"
              type="text"
              value={formData.currentMedications}
              onChange={handleChange}
              placeholder="e.g., Metformin 500mg daily"
            />
          </div>

          <div className="modal-actions">
            <button type="button" className="btn-cancel" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-confirm">
              {patient ? "Update Patient" : "Add Patient"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
