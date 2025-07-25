// src/hooks/useFirebasePatients.js - Firebase hook for patients only
import { useState, useEffect } from "react";
import { patientsService } from "../services/patientsService";

export const useFirebasePatients = (enabled = false) => {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    total: 0,
    recentlyAdded: 0,
    withConditions: 0,
    withAllergies: 0,
  });

  // Load patients when hook is enabled
  useEffect(() => {
    if (enabled) {
      loadPatients();
      loadStats();
    } else {
      // Clear Firebase data when disabled
      setPatients([]);
      setStats({
        total: 0,
        recentlyAdded: 0,
        withConditions: 0,
        withAllergies: 0,
      });
      setError(null);
    }
  }, [enabled]);

  const loadPatients = async () => {
    if (!enabled) return;

    setLoading(true);
    setError(null);

    try {
      const patientsData = await patientsService.getPatients();
      setPatients(patientsData);
      console.log(`🔥 Loaded ${patientsData.length} patients from Firebase`);
    } catch (err) {
      setError(err.message);
      console.error("Failed to load patients:", err);
      // Don't clear existing data on error - keep what we have
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    if (!enabled) return;

    try {
      const statsData = await patientsService.getPatientStats();
      setStats(statsData);
    } catch (err) {
      console.error("Failed to load patient stats:", err);
    }
  };

  const addPatient = async (patientData) => {
    if (!enabled) {
      throw new Error("Firebase patients not enabled");
    }

    setError(null);

    try {
      const newPatient = await patientsService.addPatient(patientData);
      setPatients((prev) => [newPatient, ...prev]); // Add to beginning

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

      console.log("✅ Patient added successfully");
      return newPatient;
    } catch (err) {
      setError(err.message);
      console.error("Failed to add patient:", err);
      throw err;
    }
  };

  const updatePatient = async (patientId, updates) => {
    if (!enabled) {
      throw new Error("Firebase patients not enabled");
    }

    setError(null);

    try {
      await patientsService.updatePatient(patientId, updates);

      setPatients((prev) =>
        prev.map((patient) =>
          patient.id === patientId ? { ...patient, ...updates } : patient
        )
      );

      console.log("✅ Patient updated successfully");
    } catch (err) {
      setError(err.message);
      console.error("Failed to update patient:", err);
      throw err;
    }
  };

  const deletePatient = async (patientId) => {
    if (!enabled) {
      throw new Error("Firebase patients not enabled");
    }

    setError(null);

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

      console.log("✅ Patient deleted successfully");
    } catch (err) {
      setError(err.message);
      console.error("Failed to delete patient:", err);
      throw err;
    }
  };

  const searchPatients = async (searchTerm) => {
    if (!enabled) {
      throw new Error("Firebase patients not enabled");
    }

    setLoading(true);
    setError(null);

    try {
      const searchResults = await patientsService.searchPatients(searchTerm);
      setPatients(searchResults);
      console.log(`🔍 Search completed: ${searchResults.length} results`);
    } catch (err) {
      setError(err.message);
      console.error("Search failed:", err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const refresh = () => {
    if (enabled) {
      loadPatients();
      loadStats();
    }
  };

  return {
    // Data
    patients,
    stats,
    loading,
    error,
    enabled,

    // Methods
    addPatient,
    updatePatient,
    deletePatient,
    searchPatients,
    refresh,

    // Status
    isEmpty: patients.length === 0,
    hasError: !!error,
  };
};
