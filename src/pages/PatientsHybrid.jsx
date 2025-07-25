// src/pages/PatientsHybrid.jsx - Clean version with fixed imports
import React, { useState } from "react";
import { useData } from "../context/DataContext";
import { useFirebasePatients } from "../hooks/useFirebasePatients";
import { PatientModal } from "../components/PatientModal";
import {
  FiPlus,
  FiSearch,
  FiEdit2,
  FiTrash2,
  FiPhone,
  FiMail,
  FiDatabase,
  FiCloud,
} from "react-icons/fi";
import "./Patients.css";

export const PatientsHybrid = () => {
  // State for controlling which data source to use
  const [useFirebase, setUseFirebase] = useState(false);

  // Context API data (existing)
  const {
    patients: contextPatients = [],
    addPatient: contextAddPatient,
    updatePatient: contextUpdatePatient,
    deletePatient: contextDeletePatient,
  } = useData();

  // Firebase data (new)
  const {
    patients: firebasePatients,
    loading: firebaseLoading,
    error: firebaseError,
    stats: firebaseStats,
    addPatient: firebaseAddPatient,
    updatePatient: firebaseUpdatePatient,
    deletePatient: firebaseDeletePatient,
    searchPatients: firebaseSearchPatients,
    refresh: refreshFirebase,
  } = useFirebasePatients(useFirebase);

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [editingPatient, setEditingPatient] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  // Choose data source based on mode
  const patients = useFirebase ? firebasePatients : contextPatients;
  const isLoading = useFirebase ? firebaseLoading : false;
  const hasError = useFirebase ? !!firebaseError : false;

  // Filter patients for search (Context API only, Firebase handles search internally)
  const filteredPatients = useFirebase
    ? patients // Firebase search is handled by the service
    : patients.filter(
        (patient) =>
          patient.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          patient.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          patient.phone?.includes(searchTerm)
      );

  // Handle search
  const handleSearch = async (term) => {
    setSearchTerm(term);
    if (useFirebase && term.trim()) {
      try {
        await firebaseSearchPatients(term);
      } catch (error) {
        console.error("Search failed:", error);
      }
    } else if (useFirebase && !term.trim()) {
      refreshFirebase(); // Reload all patients
    }
  };

  // Handle patient actions
  const handleEdit = (patient) => {
    setEditingPatient(patient);
    setShowModal(true);
  };

  const handleDelete = async (patientId) => {
    if (!window.confirm("Are you sure you want to delete this patient?")) {
      return;
    }

    try {
      if (useFirebase) {
        await firebaseDeletePatient(patientId);
      } else {
        contextDeletePatient(patientId);
      }
    } catch (error) {
      alert(`Failed to delete patient: ${error.message}`);
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingPatient(null);
  };

  const handleModeToggle = () => {
    setUseFirebase(!useFirebase);
    setSearchTerm(""); // Clear search when switching modes
  };

  return (
    <>
      <PatientModal
        show={showModal}
        onClose={handleCloseModal}
        patient={editingPatient}
      />

      <div className="page">
        {/* Enhanced Header with Mode Toggle */}
        <div className="page-header">
          <div>
            <h1>Patient Management</h1>
            <p className="subtitle">
              Manage patient records and information.
              <span
                style={{
                  color: useFirebase ? "#10B981" : "#F59E0B",
                  fontWeight: "bold",
                  marginLeft: "10px",
                }}
              >
                {useFirebase ? "🔥 Firebase Mode" : "💾 Local Mode"}
              </span>
            </p>
          </div>

          <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
            {/* Mode Toggle Button */}
            <button
              onClick={handleModeToggle}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "8px 12px",
                border: "none",
                borderRadius: "6px",
                background: useFirebase ? "#10B981" : "#6B7280",
                color: "white",
                cursor: "pointer",
                fontSize: "12px",
                fontWeight: "bold",
              }}
              disabled={isLoading}
            >
              {useFirebase ? <FiCloud size={14} /> : <FiDatabase size={14} />}
              {useFirebase ? "Using Firebase" : "Using Local"}
            </button>

            <button
              className="add-patient-btn"
              onClick={() => setShowModal(true)}
              disabled={isLoading}
            >
              <FiPlus /> Add Patient
            </button>
          </div>
        </div>

        {/* Status Bar */}
        {useFirebase && (
          <div
            style={{
              background: hasError ? "#FEF2F2" : "#F0FDF4",
              border: `1px solid ${hasError ? "#FECACA" : "#BBF7D0"}`,
              borderRadius: "8px",
              padding: "12px 16px",
              marginBottom: "20px",
              marginLeft: "20px",
              marginRight: "20px",
            }}
          >
            {hasError ? (
              <div
                style={{
                  color: "#DC2626",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <span>❌</span>
                <span>Firebase Error: {firebaseError}</span>
                <button
                  onClick={refreshFirebase}
                  style={{
                    marginLeft: "auto",
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
            ) : (
              <div
                style={{
                  color: "#059669",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <span>✅</span>
                <span>Connected to Firebase</span>
                {firebaseStats && (
                  <span style={{ marginLeft: "auto", fontSize: "12px" }}>
                    {firebaseStats.total} patients •{" "}
                    {firebaseStats.recentlyAdded} recent
                  </span>
                )}
              </div>
            )}
          </div>
        )}

        {/* Search Controls */}
        <div className="patients-controls">
          <div className="search-box">
            <FiSearch className="search-icon" />
            <input
              type="text"
              placeholder={`Search patients ${
                useFirebase ? "(Firebase search)" : "(local search)"
              }...`}
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              disabled={isLoading}
            />
          </div>

          {useFirebase && (
            <button
              onClick={refreshFirebase}
              disabled={isLoading}
              style={{
                padding: "12px 16px",
                border: "1px solid var(--border-color)",
                borderRadius: "8px",
                background: "white",
                cursor: isLoading ? "not-allowed" : "pointer",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              🔄 {isLoading ? "Loading..." : "Refresh"}
            </button>
          )}
        </div>

        {/* Loading State */}
        {isLoading && (
          <div
            style={{
              textAlign: "center",
              padding: "40px",
              color: "#6B7280",
            }}
          >
            <div>🔄 Loading patients from Firebase...</div>
          </div>
        )}

        {/* Patients Grid */}
        {!isLoading && (
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
                      disabled={isLoading}
                    >
                      <FiEdit2 /> Edit
                    </button>
                    <button
                      className="delete-btn"
                      onClick={() => handleDelete(patient.id)}
                      disabled={isLoading}
                    >
                      <FiTrash2 /> Delete
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="empty-state">
                <p>
                  {searchTerm
                    ? `No patients found matching "${searchTerm}" in ${
                        useFirebase ? "Firebase" : "local storage"
                      }.`
                    : `No patients found in ${
                        useFirebase ? "Firebase" : "local storage"
                      }.`}
                </p>
                <button
                  className="add-patient-btn"
                  onClick={() => setShowModal(true)}
                  disabled={isLoading}
                >
                  <FiPlus /> Add First Patient
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
};
