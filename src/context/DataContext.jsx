import React, { createContext, useState, useContext, useEffect } from "react";
import { appointmentsService } from "../services/appointmentsService";
import { patientsService } from "../services/patientsService";
import { initialQueue } from "../data/mock"; // Keep queue local for now

const DataContext = createContext();

export const useData = () => useContext(DataContext);

export const DataProvider = ({ children }) => {
  // State for Firebase data
  const [appointments, setAppointments] = useState([]);
  const [patients, setPatients] = useState([]);
  const [queue, setQueue] = useState(initialQueue); // Keep queue local for now
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load data from Firebase on mount
  useEffect(() => {
    loadFirebaseData();
  }, []);

  const loadFirebaseData = async () => {
    setLoading(true);
    setError(null);

    try {
      console.log("🔄 Loading data from Firebase...");

      // Load appointments and patients in parallel
      const [appointmentsData, patientsData] = await Promise.all([
        appointmentsService.getAppointments(),
        patientsService.getPatients(),
      ]);

      setAppointments(appointmentsData);
      setPatients(patientsData);

      console.log("✅ Successfully loaded Firebase data:", {
        appointments: appointmentsData.length,
        patients: patientsData.length,
      });
    } catch (err) {
      console.error("❌ Failed to load Firebase data:", err);
      setError(err.message);

      // Fallback to empty arrays
      setAppointments([]);
      setPatients([]);
    } finally {
      setLoading(false);
    }
  };

  // FIXED: Add refreshData function
  const refreshData = async () => {
    console.log("🔄 Refreshing data...");
    await loadFirebaseData();
  };

  // APPOINTMENT FUNCTIONS - Now use Firebase
  const addAppointment = async (appointmentData) => {
    try {
      const newAppointment = await appointmentsService.addAppointment({
        ...appointmentData,
        status: appointmentData.status || "confirmed", // Use provided status or default
      });

      // Update local state immediately for better UX
      setAppointments((prev) => [newAppointment, ...prev]);
      console.log("✅ Added appointment locally and to Firebase");
      return newAppointment;
    } catch (error) {
      console.error("Failed to add appointment:", error);
      throw error;
    }
  };

  const updateAppointment = async (appointmentId, updates) => {
    try {
      await appointmentsService.updateAppointment(appointmentId, updates);

      // Update local state immediately
      setAppointments((prev) =>
        prev.map((apt) =>
          apt.id === appointmentId ? { ...apt, ...updates } : apt
        )
      );
      console.log("✅ Updated appointment locally and in Firebase");
    } catch (error) {
      console.error("Failed to update appointment:", error);
      throw error;
    }
  };

  const deleteAppointment = async (appointmentId) => {
    try {
      await appointmentsService.deleteAppointment(appointmentId);

      // Update local state immediately
      setAppointments((prev) => prev.filter((apt) => apt.id !== appointmentId));
      console.log("✅ Deleted appointment locally and from Firebase");
    } catch (error) {
      console.error("Failed to delete appointment:", error);
      throw error;
    }
  };

  const checkInAppointment = async (appointmentId) => {
    try {
      await updateAppointment(appointmentId, { status: "Checked-In" });
    } catch (error) {
      console.error("Failed to check in appointment:", error);
      throw error;
    }
  };

  // PATIENT FUNCTIONS - Now use Firebase
  const addPatient = async (patientData) => {
    try {
      const newPatient = await patientsService.addPatient(patientData);
      setPatients((prev) => [newPatient, ...prev]);
      return newPatient;
    } catch (error) {
      console.error("Failed to add patient:", error);
      throw error;
    }
  };

  const updatePatient = async (patientId, updates) => {
    try {
      await patientsService.updatePatient(patientId, updates);

      setPatients((prev) =>
        prev.map((patient) =>
          patient.id === patientId ? { ...patient, ...updates } : patient
        )
      );
    } catch (error) {
      console.error("Failed to update patient:", error);
      throw error;
    }
  };

  const deletePatient = async (patientId) => {
    try {
      await patientsService.deletePatient(patientId);

      setPatients((prev) => prev.filter((patient) => patient.id !== patientId));
    } catch (error) {
      console.error("Failed to delete patient:", error);
      throw error;
    }
  };

  // QUEUE FUNCTIONS - Keep local for now
  const addWalkInToQueue = (walkInData) => {
    const maxPosition =
      queue.length > 0 ? Math.max(...queue.map((p) => p.position)) : 0;

    let patientName, patientId, idNumber, phoneNumber, reasonForVisit;

    if (typeof walkInData === "string") {
      patientName = `${walkInData} (Walk-in)`;
      patientId = null;
      idNumber = null;
      phoneNumber = null;
      reasonForVisit = null;
    } else {
      patientName = `${walkInData.fullName} (Walk-in)`;
      patientId = null;
      idNumber = walkInData.idNumber;
      phoneNumber = walkInData.phoneNumber;
      reasonForVisit = walkInData.reasonForVisit;
    }

    const newWalkIn = {
      id: Date.now(),
      patientName,
      position: maxPosition + 1,
      joinTime: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
      status: "Waiting",
      type: "walk-in",
      notified: false,
      idNumber,
      phoneNumber,
      reasonForVisit,
      addedAt: new Date().toISOString(),
    };

    setQueue((prev) => [...prev, newWalkIn]);
  };

  const callNextInQueue = () => {
    const waitingPatients = queue.filter((p) => p.status === "Waiting");
    if (waitingPatients.length === 0) return;

    const nextPatient = waitingPatients.reduce((min, patient) =>
      patient.position < min.position ? patient : min
    );

    setQueue((prev) =>
      prev.map((patient) =>
        patient.id === nextPatient.id
          ? { ...patient, status: "Called" }
          : patient.status === "Called"
          ? { ...patient, status: "Completed" }
          : patient
      )
    );
  };

  const completeQueueMember = (patientId) => {
    setQueue((prev) => prev.filter((p) => p.id !== patientId));
  };

  const notifyPatient = (patientId) => {
    setQueue((prev) =>
      prev.map((patient) =>
        patient.id === patientId ? { ...patient, notified: true } : patient
      )
    );
    alert("Notification sent: 'You are almost next!'");
  };

  // Analytics function - now uses Firebase data
  const getAnalytics = () => {
    const today = new Date().toISOString().split("T")[0];
    return {
      today: {
        appointments: appointments.filter((apt) => apt.date === today).length,
        completed: appointments.filter(
          (apt) =>
            apt.date === today &&
            (apt.status === "Completed" || apt.status === "completed")
        ).length,
        revenue: 1500,
      },
      week: {
        appointments: appointments.length,
        completed: appointments.filter(
          (apt) => apt.status === "Completed" || apt.status === "completed"
        ).length,
        revenue: 7500,
      },
      month: {
        appointments: appointments.length,
        completed: appointments.filter(
          (apt) => apt.status === "Completed" || apt.status === "completed"
        ).length,
        revenue: 25000,
      },
      serviceBreakdown: {
        "General Practice": appointments.filter(
          (a) => a.service === "General Practice"
        ).length,
        "Chronic Care": appointments.filter((a) => a.service === "Chronic Care")
          .length,
        "Maternal Care": appointments.filter(
          (a) => a.service === "Maternal Care"
        ).length,
        "HIV/AIDS Care": appointments.filter(
          (a) => a.service === "HIV/AIDS Care"
        ).length,
        "TB Treatment": appointments.filter((a) => a.service === "TB Treatment")
          .length,
      },
      queueMetrics: {
        averageWaitTime: "15 min",
        totalServed: 12,
        currentWaiting: queue.filter((p) => p.status === "Waiting").length,
      },
    };
  };

  const value = {
    // Data
    appointments,
    queue,
    patients,
    loading,
    error,

    // Appointment functions
    addAppointment,
    updateAppointment,
    deleteAppointment,
    checkInAppointment,

    // Queue functions
    addWalkInToQueue,
    callNextInQueue,
    completeQueueMember,
    notifyPatient,

    // Patient functions
    addPatient,
    updatePatient,
    deletePatient,

    // Utility functions
    getAnalytics,
    refreshData, // FIXED: Now included in context
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
};
