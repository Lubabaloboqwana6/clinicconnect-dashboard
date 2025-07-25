import { useState, useEffect } from "react";
import { dataService } from "../services/dataService";

export const useFirebaseData = () => {
  const [appointments, setAppointments] = useState([]);
  const [queue, setQueue] = useState([]);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Load initial data
  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    setLoading(true);
    setError(null);

    try {
      const [appointmentsData, queueData, patientsData] = await Promise.all([
        dataService.getAppointments(),
        dataService.getQueue(),
        dataService.getPatients(),
      ]);

      setAppointments(appointmentsData);
      setQueue(queueData);
      setPatients(patientsData);
    } catch (err) {
      setError(err.message);
      console.error("Data loading error:", err);
    } finally {
      setLoading(false);
    }
  };

  // Appointment methods
  const addAppointment = async (appointmentData) => {
    try {
      const newAppointment = await dataService.addAppointment(appointmentData);
      setAppointments((prev) => [...prev, newAppointment]);
      return newAppointment;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const updateAppointment = async (id, updates) => {
    try {
      await dataService.updateAppointment(id, updates);
      setAppointments((prev) =>
        prev.map((apt) => (apt.id === id ? { ...apt, ...updates } : apt))
      );
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const deleteAppointment = async (id) => {
    try {
      await dataService.deleteAppointment(id);
      setAppointments((prev) => prev.filter((apt) => apt.id !== id));
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  // Queue methods
  const addToQueue = async (queueData) => {
    try {
      const newQueueItem = await dataService.addToQueue(queueData);
      setQueue((prev) => [...prev, newQueueItem]);
      return newQueueItem;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  // Patient methods
  const addPatient = async (patientData) => {
    try {
      const newPatient = await dataService.addPatient(patientData);
      setPatients((prev) => [...prev, newPatient]);
      return newPatient;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  // Utility methods
  const toggleFirebaseMode = (enabled) => {
    dataService.setFirebaseMode(enabled);
    loadAllData(); // Reload data with new mode
  };

  const syncToFirebase = async () => {
    try {
      await dataService.syncLocalToFirebase();
      loadAllData(); // Reload to verify sync
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  return {
    // Data
    appointments,
    queue,
    patients,
    loading,
    error,

    // Methods
    addAppointment,
    updateAppointment,
    deleteAppointment,
    addToQueue,
    addPatient,

    // Utilities
    toggleFirebaseMode,
    syncToFirebase,
    isUsingFirebase: dataService.isUsingFirebase(),
    refresh: loadAllData,
  };
};
