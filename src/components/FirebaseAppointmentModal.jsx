import React, { useState, useEffect } from "react";
import { appointmentsService } from "../services/appointmentsService";
import "./AddAppointmentModal.css"; // Reuse existing styles

export const FirebaseAppointmentModal = ({
  show,
  onClose,
  appointment = null,
  selectedDate = null,
  onSuccess = null, // Callback for when appointment is added/updated successfully
}) => {
  const [formData, setFormData] = useState({
    clinicName: "",
    service: "",
    date: "",
    time: "",
    notes: "",
    patientName: "",
    patientPhone: "",
    patientEmail: "",
    status: "confirmed",
  });
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState({});

  // Initialize form data when modal opens
  useEffect(() => {
    if (appointment) {
      // Editing existing appointment
      setFormData({
        clinicName: appointment.clinicName || "",
        service: appointment.service || "",
        date: appointment.date || "",
        time: appointment.time || "",
        notes: appointment.notes || "",
        patientName: appointment.patientName || "",
        patientPhone: appointment.patientPhone || "",
        patientEmail: appointment.patientEmail || "",
        status: appointment.status || "confirmed",
      });
    } else {
      // Creating new appointment
      setFormData({
        clinicName: "",
        service: "General Practice",
        date: selectedDate || new Date().toISOString().split("T")[0],
        time: "",
        notes: "",
        patientName: "",
        patientPhone: "",
        patientEmail: "",
        status: "confirmed",
      });
    }
    setErrors({});
  }, [appointment, selectedDate, show]);

  const validateForm = () => {
    const newErrors = {};

    // Required fields
    if (!formData.patientName.trim()) {
      newErrors.patientName = "Patient name is required";
    }
    if (!formData.date) {
      newErrors.date = "Date is required";
    }
    if (!formData.time) {
      newErrors.time = "Time is required";
    }

    // Validate date is not in the past
    const selectedDate = new Date(formData.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (selectedDate < today) {
      newErrors.date = "Please select a future date";
    }

    // Validate email format if provided
    if (formData.patientEmail && !/\S+@\S+\.\S+/.test(formData.patientEmail)) {
      newErrors.patientEmail = "Please enter a valid email";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const resetForm = () => {
    setFormData({
      clinicName: "",
      service: "General Practice",
      date: selectedDate || new Date().toISOString().split("T")[0],
      time: "",
      notes: "",
      patientName: "",
      patientPhone: "",
      patientEmail: "",
      status: "confirmed",
    });
    setErrors({});
    setIsSaving(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSaving(true);
    try {
      let result;

      if (appointment) {
        // Update existing appointment
        await appointmentsService.updateAppointment(appointment.id, formData);
        result = { ...appointment, ...formData };
        console.log("✅ Updated appointment:", appointment.id);
      } else {
        // Create new appointment
        result = await appointmentsService.addAppointment(formData);
        console.log("✅ Added new appointment:", result.id);
      }

      // FIXED: Call success callback if provided
      if (onSuccess) {
        onSuccess(result, appointment ? "updated" : "added");
      }

      // FIXED: Reset form and close modal
      resetForm();
      onClose();
    } catch (error) {
      console.error("❌ Error saving appointment:", error);
      setErrors({ submit: error.message });
      setIsSaving(false); // Only set to false on error, success will reset everything
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handleClose = () => {
    // FIXED: Reset form when closing
    resetForm();
    onClose();
  };

  if (!show) return null;

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h2>
          {appointment
            ? "Edit Appointment"
            : selectedDate
            ? `Schedule Appointment for ${selectedDate}`
            : "Schedule New Appointment"}
        </h2>

        {errors.submit && (
          <div
            style={{
              background: "#FEF2F2",
              color: "#DC2626",
              padding: "12px",
              borderRadius: "6px",
              marginBottom: "20px",
              fontSize: "14px",
            }}
          >
            ❌ {errors.submit}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Patient Information */}
          <div className="form-group">
            <label>Patient Name *</label>
            <input
              name="patientName"
              value={formData.patientName}
              onChange={handleChange}
              disabled={isSaving}
              placeholder="Enter patient's full name"
              style={{
                borderColor: errors.patientName ? "#EF4444" : undefined,
              }}
            />
            {errors.patientName && (
              <div
                style={{ color: "#EF4444", fontSize: "12px", marginTop: "4px" }}
              >
                {errors.patientName}
              </div>
            )}
          </div>

          <div className="form-group-row">
            <div className="form-group">
              <label>Patient Phone</label>
              <input
                name="patientPhone"
                type="tel"
                value={formData.patientPhone}
                onChange={handleChange}
                disabled={isSaving}
                placeholder="+27 82 123 4567"
              />
            </div>
            <div className="form-group">
              <label>Patient Email</label>
              <input
                name="patientEmail"
                type="email"
                value={formData.patientEmail}
                onChange={handleChange}
                disabled={isSaving}
                placeholder="patient@email.com"
                style={{
                  borderColor: errors.patientEmail ? "#EF4444" : undefined,
                }}
              />
              {errors.patientEmail && (
                <div
                  style={{
                    color: "#EF4444",
                    fontSize: "12px",
                    marginTop: "4px",
                  }}
                >
                  {errors.patientEmail}
                </div>
              )}
            </div>
          </div>

          {/* Appointment Details */}
          <div className="form-group">
            <label>Clinic/Department</label>
            <input
              name="clinicName"
              value={formData.clinicName}
              onChange={handleChange}
              disabled={isSaving}
              placeholder="Enter clinic or department name"
            />
          </div>

          <div className="form-group">
            <label>Service</label>
            <select
              name="service"
              value={formData.service}
              onChange={handleChange}
              disabled={isSaving}
            >
              <option value="General Practice">General Practice</option>
              <option value="Chronic Care">Chronic Care</option>
              <option value="Maternal Care">Maternal Care</option>
              <option value="HIV/AIDS Care">HIV/AIDS Care</option>
              <option value="TB Treatment">TB Treatment</option>
              <option value="Consultation">Consultation</option>
              <option value="Follow-up">Follow-up</option>
            </select>
          </div>

          <div className="form-group-row">
            <div className="form-group">
              <label>Date *</label>
              <input
                name="date"
                type="date"
                value={formData.date}
                onChange={handleChange}
                disabled={isSaving}
                min={new Date().toISOString().split("T")[0]}
                style={{ borderColor: errors.date ? "#EF4444" : undefined }}
              />
              {errors.date && (
                <div
                  style={{
                    color: "#EF4444",
                    fontSize: "12px",
                    marginTop: "4px",
                  }}
                >
                  {errors.date}
                </div>
              )}
            </div>
            <div className="form-group">
              <label>Time *</label>
              <input
                name="time"
                type="time"
                value={formData.time}
                onChange={handleChange}
                disabled={isSaving}
                style={{ borderColor: errors.time ? "#EF4444" : undefined }}
              />
              {errors.time && (
                <div
                  style={{
                    color: "#EF4444",
                    fontSize: "12px",
                    marginTop: "4px",
                  }}
                >
                  {errors.time}
                </div>
              )}
            </div>
          </div>

          <div className="form-group">
            <label>Status</label>
            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
              disabled={isSaving}
            >
              <option value="confirmed">Confirmed</option>
              <option value="pending">Pending</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          <div className="form-group">
            <label>Notes</label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              disabled={isSaving}
              placeholder="Additional notes or special requirements..."
              rows="3"
              style={{
                resize: "vertical",
                fontFamily: "inherit",
              }}
            />
          </div>

          <div className="modal-actions">
            <button
              type="button"
              className="btn-cancel"
              onClick={handleClose}
              disabled={isSaving}
            >
              Cancel
            </button>
            <button type="submit" className="btn-confirm" disabled={isSaving}>
              {isSaving
                ? appointment
                  ? "Updating..."
                  : "Scheduling..."
                : appointment
                ? "Update Appointment"
                : "Schedule Appointment"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
