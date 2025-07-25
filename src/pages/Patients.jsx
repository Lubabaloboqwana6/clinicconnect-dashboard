// src/pages/Patients.jsx - Direct Firebase integration
import React, { useState, useEffect } from "react";
import { PatientModal } from "../components/PatientModal";
import { patientsService } from "../services/patientsService";
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
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingPatient, setEditingPatient] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [stats, setStats] = useState({
    total: 0,
    recentlyAdded: 0,
    withConditions: 0,
    withAllergies: 0,
  });

  // Load patients on component mount
  useEffect(() => {
    loadPatients();
    loadStats();
  }, []);

  const loadPatients = async () => {
    setLoading(true);
    setError(null);

    try {
      const patientsData = await patientsService.getPatients();
      setPatients(patientsData);
      console.log(`✅ Loaded ${patientsData.length} patients`);
    } catch (err) {
      setError(err.message);
      console.error("Failed to load patients:", err);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const statsData = await patientsService.getPatientStats();
      setStats(statsData);
    } catch (err) {
      console.error("Failed to load stats:", err);
    }
  };

  const handleAddPatient = async (patientData) => {
    try {
      const newPatient = await patientsService.addPatient(patientData);
      setPatients((prev) => [newPatient, ...prev]);

      // Update stats
      setStats((prev) => ({
        ...prev,
        total: prev.total + 1,
        recentlyAdded: prev.recentlyAdded + 1,
        withConditions: patientData.medicalConditions
          ? prev.withConditions + 1
          : prev.withConditions,
        withAllergies: patientData.allergies
          ? prev.withAllergies + 1
          : prev.withAllergies,
      }));

      setShowModal(false);
      setEditingPatient(null);
    } catch (error) {
      alert(`Failed to add patient: ${error.message}`);
    }
  };

  const handleUpdatePatient = async (patientId, updates) => {
    try {
      await patientsService.updatePatient(patientId, updates);

      setPatients((prev) =>
        prev.map((patient) =>
          patient.id === patientId ? { ...patient, ...updates } : patient
        )
      );

      setShowModal(false);
      setEditingPatient(null);
    } catch (error) {
      alert(`Failed to update patient: ${error.message}`);
    }
  };

  const handleDeletePatient = async (patientId) => {
    if (!window.confirm("Are you sure you want to delete this patient?")) {
      return;
    }

    try {
      await patientsService.deletePatient(patientId);

      const deletedPatient = patients.find((p) => p.id === patientId);
      setPatients((prev) => prev.filter((patient) => patient.id !== patientId));

      // Update stats
      if (deletedPatient) {
        setStats((prev) => ({
          ...prev,
          total: Math.max(0, prev.total - 1),
          withConditions: deletedPatient.medicalConditions
            ? Math.max(0, prev.withConditions - 1)
            : prev.withConditions,
          withAllergies: deletedPatient.allergies
            ? Math.max(0, prev.withAllergies - 1)
            : prev.withAllergies,
        }));
      }
    } catch (error) {
      alert(`Failed to delete patient: ${error.message}`);
    }
  };

  const handleSearch = async (term) => {
    setSearchTerm(term);

    if (!term.trim()) {
      loadPatients(); // Reload all patients
      return;
    }

    setLoading(true);
    try {
      const searchResults = await patientsService.searchPatients(term);
      setPatients(searchResults);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (patient) => {
    setEditingPatient(patient);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingPatient(null);
  };

  return (
    <>
      {/* Enhanced Patient Modal with Firebase support */}
      <FirebasePatientModal
        show={showModal}
        onClose={handleCloseModal}
        patient={editingPatient}
        onAdd={handleAddPatient}
        onUpdate={handleUpdatePatient}
      />

      <div className="page">
        {/* Header */}
        <div className="page-header">
          <div>
            <h1>Patient Management</h1>
            <p className="subtitle">
              Manage patient records with Firebase integration
              <span
                style={{
                  color: "#10B981",
                  fontWeight: "bold",
                  marginLeft: "10px",
                }}
              >
                🔥 Firebase Active
              </span>
            </p>
          </div>

          <button
            className="add-patient-btn"
            onClick={() => setShowModal(true)}
            disabled={loading}
          >
            <FiPlus /> Add Patient
          </button>
        </div>

        {/* Stats Bar */}
        {stats.total > 0 && (
          <div
            style={{
              background: "#F0FDF4",
              border: "1px solid #BBF7D0",
              borderRadius: "8px",
              padding: "12px 20px",
              marginBottom: "20px",
              marginLeft: "20px",
              marginRight: "20px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div
              style={{
                color: "#059669",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <span>✅</span>
              <span>Firebase Connected</span>
            </div>
            <div style={{ fontSize: "14px", color: "#065F46" }}>
              {stats.total} patients • {stats.recentlyAdded} added this week •{" "}
              {stats.withConditions} with conditions
            </div>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div
            style={{
              background: "#FEF2F2",
              border: "1px solid #FECACA",
              color: "#DC2626",
              padding: "12px 20px",
              margin: "0 20px 20px 20px",
              borderRadius: "8px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <span>❌ {error}</span>
            <button
              onClick={loadPatients}
              style={{
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
        )}

        {/* Search */}
        <div className="patients-controls">
          <div className="search-box">
            <FiSearch className="search-icon" />
            <input
              type="text"
              placeholder="Search patients by name, email, phone, or conditions..."
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              disabled={loading}
            />
          </div>

          <button
            onClick={loadPatients}
            disabled={loading}
            style={{
              padding: "12px 16px",
              border: "1px solid var(--border-color)",
              borderRadius: "8px",
              background: "white",
              cursor: loading ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            🔄 {loading ? "Loading..." : "Refresh"}
          </button>
        </div>

        {/* Loading State */}
        {loading && (
          <div
            style={{
              textAlign: "center",
              padding: "60px",
              color: "#6B7280",
            }}
          >
            <div style={{ fontSize: "18px", marginBottom: "10px" }}>🔄</div>
            <div>Loading patients from Firebase...</div>
          </div>
        )}

        {/* Patients Grid */}
        {!loading && (
          <div className="patients-grid">
            {patients.length > 0 ? (
              patients.map((patient) => (
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
                    {patient.allergies && (
                      <div className="allergies">
                        <strong>Allergies:</strong> {patient.allergies}
                      </div>
                    )}
                  </div>

                  <div className="patient-actions">
                    <button
                      className="edit-btn"
                      onClick={() => handleEdit(patient)}
                      disabled={loading}
                    >
                      <FiEdit2 /> Edit
                    </button>
                    <button
                      className="delete-btn"
                      onClick={() => handleDeletePatient(patient.id)}
                      disabled={loading}
                    >
                      <FiTrash2 /> Delete
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="empty-state">
                <div style={{ fontSize: "48px", marginBottom: "20px" }}>👥</div>
                <h3>No Patients Found</h3>
                <p>
                  {searchTerm
                    ? `No patients match "${searchTerm}". Try a different search term.`
                    : "Start by adding your first patient to the system."}
                </p>
                <button
                  className="add-patient-btn"
                  onClick={() => setShowModal(true)}
                  disabled={loading}
                  style={{ marginTop: "20px" }}
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

// Enhanced Patient Modal that works with Firebase
const FirebasePatientModal = ({ show, onClose, patient, onAdd, onUpdate }) => {
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
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState({});

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
    setErrors({});
  }, [patient, show]);

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = "Name is required";
    if (!formData.phone.trim()) newErrors.phone = "Phone is required";
    if (!formData.dateOfBirth)
      newErrors.dateOfBirth = "Date of birth is required";
    if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Please enter a valid email";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSaving(true);
    try {
      if (patient) {
        await onUpdate(patient.id, formData);
      } else {
        await onAdd(formData);
      }
    } catch (error) {
      setErrors({ submit: error.message });
    } finally {
      setIsSaving(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  if (!show) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content patient-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <h2>{patient ? "Edit Patient" : "Add New Patient"}</h2>

        {errors.submit && (
          <div
            style={{
              background: "#FEF2F2",
              color: "#DC2626",
              padding: "10px",
              borderRadius: "5px",
              marginBottom: "15px",
            }}
          >
            {errors.submit}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group-row">
            <div className="form-group">
              <label>Full Name *</label>
              <input
                name="name"
                value={formData.name}
                onChange={handleChange}
                disabled={isSaving}
                style={{ borderColor: errors.name ? "#EF4444" : undefined }}
              />
              {errors.name && (
                <div style={{ color: "#EF4444", fontSize: "12px" }}>
                  {errors.name}
                </div>
              )}
            </div>
            <div className="form-group">
              <label>Date of Birth *</label>
              <input
                name="dateOfBirth"
                type="date"
                value={formData.dateOfBirth}
                onChange={handleChange}
                disabled={isSaving}
                style={{
                  borderColor: errors.dateOfBirth ? "#EF4444" : undefined,
                }}
              />
              {errors.dateOfBirth && (
                <div style={{ color: "#EF4444", fontSize: "12px" }}>
                  {errors.dateOfBirth}
                </div>
              )}
            </div>
          </div>

          <div className="form-group-row">
            <div className="form-group">
              <label>Gender</label>
              <select
                name="gender"
                value={formData.gender}
                onChange={handleChange}
                disabled={isSaving}
              >
                <option value="">Select Gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div className="form-group">
              <label>Phone Number *</label>
              <input
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                disabled={isSaving}
                style={{ borderColor: errors.phone ? "#EF4444" : undefined }}
              />
              {errors.phone && (
                <div style={{ color: "#EF4444", fontSize: "12px" }}>
                  {errors.phone}
                </div>
              )}
            </div>
          </div>

          <div className="form-group">
            <label>Email</label>
            <input
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              disabled={isSaving}
              style={{ borderColor: errors.email ? "#EF4444" : undefined }}
            />
            {errors.email && (
              <div style={{ color: "#EF4444", fontSize: "12px" }}>
                {errors.email}
              </div>
            )}
          </div>

          <div className="form-group">
            <label>Address</label>
            <input
              name="address"
              value={formData.address}
              onChange={handleChange}
              disabled={isSaving}
            />
          </div>

          <div className="form-group-row">
            <div className="form-group">
              <label>Emergency Contact</label>
              <input
                name="emergencyContact"
                value={formData.emergencyContact}
                onChange={handleChange}
                disabled={isSaving}
              />
            </div>
            <div className="form-group">
              <label>Emergency Phone</label>
              <input
                name="emergencyPhone"
                value={formData.emergencyPhone}
                onChange={handleChange}
                disabled={isSaving}
              />
            </div>
          </div>

          <div className="form-group">
            <label>Medical Conditions</label>
            <input
              name="medicalConditions"
              value={formData.medicalConditions}
              onChange={handleChange}
              disabled={isSaving}
              placeholder="e.g., Diabetes, Hypertension"
            />
          </div>

          <div className="form-group">
            <label>Allergies</label>
            <input
              name="allergies"
              value={formData.allergies}
              onChange={handleChange}
              disabled={isSaving}
              placeholder="e.g., Penicillin, Peanuts"
            />
          </div>

          <div className="form-group">
            <label>Current Medications</label>
            <input
              name="currentMedications"
              value={formData.currentMedications}
              onChange={handleChange}
              disabled={isSaving}
              placeholder="e.g., Metformin 500mg daily"
            />
          </div>

          <div className="modal-actions">
            <button
              type="button"
              className="btn-cancel"
              onClick={onClose}
              disabled={isSaving}
            >
              Cancel
            </button>
            <button type="submit" className="btn-confirm" disabled={isSaving}>
              {isSaving
                ? patient
                  ? "Updating..."
                  : "Adding..."
                : patient
                ? "Update Patient"
                : "Add Patient"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
