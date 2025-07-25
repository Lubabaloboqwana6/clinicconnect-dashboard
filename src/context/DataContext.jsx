import React, { createContext, useState, useContext, useEffect } from "react";
import { appointmentsService } from "../services/appointmentsService";
import { patientsService } from "../services/patientsService";
import { queueService } from "../services/queueService"; // NEW: Import queue service

const DataContext = createContext();

export const useData = () => useContext(DataContext);

export const DataProvider = ({ children }) => {
  // State for Firebase data
  const [appointments, setAppointments] = useState([]);
  const [patients, setPatients] = useState([]);
  const [queue, setQueue] = useState([]); // NOW: Firebase queue instead of local
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Real-time queue listener
  const [queueUnsubscribe, setQueueUnsubscribe] = useState(null);

  // Load data from Firebase on mount
  useEffect(() => {
    loadFirebaseData();
    setupQueueListener(); // NEW: Set up real-time queue updates

    // Cleanup function
    return () => {
      if (queueUnsubscribe) {
        queueUnsubscribe();
      }
    };
  }, []);

  const loadFirebaseData = async () => {
    setLoading(true);
    setError(null);

    try {
      console.log("🔄 Loading data from Firebase...");

      // Load appointments, patients, and queue in parallel
      const [appointmentsData, patientsData, queueData] = await Promise.all([
        appointmentsService.getAppointments(),
        patientsService.getPatients(),
        queueService.getQueue(), // NEW: Load queue from Firebase
      ]);

      setAppointments(appointmentsData);
      setPatients(patientsData);
      setQueue(queueData); // NEW: Set Firebase queue data

      console.log("✅ Successfully loaded Firebase data:", {
        appointments: appointmentsData.length,
        patients: patientsData.length,
        queue: queueData.length, // NEW: Log queue count
      });
    } catch (err) {
      console.error("❌ Failed to load Firebase data:", err);
      setError(err.message);

      // Fallback to empty arrays
      setAppointments([]);
      setPatients([]);
      setQueue([]); // NEW: Empty queue on error
    } finally {
      setLoading(false);
    }
  };

  // NEW: Set up real-time queue listener
  const setupQueueListener = () => {
    try {
      console.log("📡 Setting up real-time queue listener...");

      const unsubscribe = queueService.subscribeToQueue((queueData) => {
        console.log(
          "📡 Real-time queue update received:",
          queueData.length,
          "items"
        );
        setQueue(queueData);
      });

      setQueueUnsubscribe(() => unsubscribe);
    } catch (error) {
      console.error("❌ Failed to set up queue listener:", error);
    }
  };

  // FIXED: Add refreshData function
  const refreshData = async () => {
    console.log("🔄 Refreshing data...");
    await loadFirebaseData();
  };

  // APPOINTMENT FUNCTIONS - Firebase integrated
  const addAppointment = async (appointmentData) => {
    try {
      const newAppointment = await appointmentsService.addAppointment({
        ...appointmentData,
        status: appointmentData.status || "confirmed",
      });

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

  // PATIENT FUNCTIONS - Firebase integrated
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

  // QUEUE FUNCTIONS - NOW: Firebase integrated! 🔥
  const addWalkInToQueue = async (walkInData) => {
    try {
      // Handle both old format (string) and new format (object)
      let queueData;

      if (typeof walkInData === "string") {
        // Old format compatibility
        queueData = {
          patientName: `${walkInData} (Walk-in)`,
          type: "walk-in",
          status: "Waiting",
          notified: false,
        };
      } else {
        // New enhanced format
        queueData = {
          patientName: `${walkInData.fullName} (Walk-in)`,
          idNumber: walkInData.idNumber,
          phoneNumber: walkInData.phoneNumber,
          reasonForVisit: walkInData.reasonForVisit,
          type: "walk-in",
          status: "Waiting",
          notified: false,
        };
      }

      // NEW: Add to Firebase queue
      const newQueueItem = await queueService.addToQueue(queueData);
      console.log(
        "✅ Added walk-in to Firebase queue:",
        newQueueItem.patientName
      );

      // Note: Real-time listener will update local state automatically
      return newQueueItem;
    } catch (error) {
      console.error("Failed to add walk-in to queue:", error);
      throw error;
    }
  };

  const callNextInQueue = async () => {
    try {
      // NEW: Use Firebase queue service
      const calledPatient = await queueService.callNextPatient();

      if (calledPatient) {
        console.log("✅ Called next patient:", calledPatient.patientName);
      } else {
        console.log("ℹ️ No patients waiting to be called");
      }

      // Note: Real-time listener will update local state automatically
      return calledPatient;
    } catch (error) {
      console.error("Failed to call next patient:", error);
      throw error;
    }
  };

  const completeQueueMember = async (patientId) => {
    try {
      // NEW: Remove from Firebase queue
      await queueService.removeFromQueue(patientId);
      console.log("✅ Removed patient from Firebase queue");

      // Note: Real-time listener will update local state automatically
    } catch (error) {
      console.error("Failed to complete queue member:", error);
      throw error;
    }
  };

  const notifyPatient = async (patientId) => {
    try {
      // NEW: Update notification status in Firebase
      await queueService.notifyPatient(patientId);
      console.log("✅ Notified patient in Firebase");

      // Note: Real-time listener will update local state automatically

      // Still show the alert for user feedback
      alert("Notification sent: 'You are almost next!'");
    } catch (error) {
      console.error("Failed to notify patient:", error);
      throw error;
    }
  };

  // NEW: Get queue statistics from Firebase
  const getQueueStats = async () => {
    try {
      return await queueService.getQueueStats();
    } catch (error) {
      console.error("Failed to get queue stats:", error);
      return {
        total: 0,
        waiting: 0,
        called: 0,
        completed: 0,
        walkIns: 0,
        appointments: 0,
        averageWaitTime: "0 min",
      };
    }
  };

  // Analytics function - now uses Firebase data including queue
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
        averageWaitTime: "15 min", // TODO: Calculate from Firebase queue data
        totalServed: queue.filter((p) => p.status === "Completed").length,
        currentWaiting: queue.filter((p) => p.status === "Waiting").length,
      },
    };
  };

  const value = {
    // Data
    appointments,
    queue, // NOW: Firebase queue data
    patients,
    loading,
    error,

    // Appointment functions
    addAppointment,
    updateAppointment,
    deleteAppointment,
    checkInAppointment,

    // Queue functions - NOW: All Firebase integrated! 🔥
    addWalkInToQueue,
    callNextInQueue,
    completeQueueMember,
    notifyPatient,
    getQueueStats, // NEW: Firebase queue stats

    // Patient functions
    addPatient,
    updatePatient,
    deletePatient,

    // Utility functions
    getAnalytics,
    refreshData,
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
};
