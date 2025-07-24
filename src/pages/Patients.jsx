import React, { useState } from "react";
import { useData } from "../context/DataContext";
import { PatientModal } from "../components/PatientModal";
import {
  FiPlus,
  FiSearch,
  FiEdit2,
  FiTrash2,
  FiPhone,
  FiMail,
} from "react-icons/fi";
import "./Patients.css";

export const Patients = () => {
  const { patients = [], deletePatient } = useData(); // Add default empty array
  const [showModal, setShowModal] = useState(false);
  const [editingPatient, setEditingPatient] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  const filteredPatients = patients.filter(
    (patient) =>
      patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.phone.includes(searchTerm)
  );

  const handleEdit = (patient) => {
    setEditingPatient(patient);
    setShowModal(true);
  };

  const handleDelete = (patientId) => {
    if (window.confirm("Are you sure you want to delete this patient?")) {
      deletePatient(patientId);
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingPatient(null);
  };

  return (
    <>
      <PatientModal
        show={showModal}
        onClose={handleCloseModal}
        patient={editingPatient}
      />

      <div className="page">
        <div className="page-header">
          <div>
            <h1>Patient Management</h1>
            <p className="subtitle">Manage patient records and information.</p>
          </div>
          <button
            className="add-patient-btn"
            onClick={() => setShowModal(true)}
          >
            <FiPlus /> Add Patient
          </button>
        </div>

        <div className="patients-controls">
          <div className="search-box">
            <FiSearch className="search-icon" />
            <input
              type="text"
              placeholder="Search patients by name, email, or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="patients-grid">
          {filteredPatients.length > 0 ? (
            filteredPatients.map((patient) => (
              <div key={patient.id} className="patient-card">
                <div className="patient-info">
                  <h3>{patient.name}</h3>
                  <p className="patient-details">
                    <span>DOB: {patient.dateOfBirth}</span>
                    <span>Gender: {patient.gender}</span>
                  </p>
                  <div className="contact-info">
                    <span>
                      <FiPhone /> {patient.phone}
                    </span>
                    <span>
                      <FiMail /> {patient.email}
                    </span>
                  </div>
                  {patient.medicalConditions && (
                    <div className="medical-conditions">
                      <strong>Conditions:</strong> {patient.medicalConditions}
                    </div>
                  )}
                </div>

                <div className="patient-actions">
                  <button
                    className="edit-btn"
                    onClick={() => handleEdit(patient)}
                  >
                    <FiEdit2 /> Edit
                  </button>
                  <button
                    className="delete-btn"
                    onClick={() => handleDelete(patient.id)}
                  >
                    <FiTrash2 /> Delete
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="empty-state">
              <p>No patients found matching your search.</p>
              <button
                className="add-patient-btn"
                onClick={() => setShowModal(true)}
              >
                <FiPlus /> Add First Patient
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
};
