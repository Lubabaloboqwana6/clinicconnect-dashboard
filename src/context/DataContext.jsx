// src/context/DataContext.jsx - Add patient support with initial data
import React, { createContext, useState, useContext } from "react";
import {
  initialAppointments,
  initialQueue,
  initialPatients,
} from "../data/mock";

const DataContext = createContext();

export const useData = () => useContext(DataContext);

export const DataProvider = ({ children }) => {
  const [appointments, setAppointments] = useState(initialAppointments);
  const [queue, setQueue] = useState(initialQueue);
  const [patients, setPatients] = useState(initialPatients); // Use initial patients data

  const addAppointment = (appointmentData) => {
    const newAppointment = {
      id: Date.now(),
      ...appointmentData,
      status: "Confirmed",
    };
    setAppointments((prev) => [...prev, newAppointment]);
  };

  const checkInAppointment = (appointmentId) => {
    setAppointments((prev) =>
      prev.map((apt) =>
        apt.id === appointmentId ? { ...apt, status: "Checked-In" } : apt
      )
    );
  };

  const addWalkInToQueue = (walkInData) => {
    const maxPosition =
      queue.length > 0 ? Math.max(...queue.map((p) => p.position)) : 0;

    // Handle both old format (string) and new format (object)
    let patientName, patientId, idNumber, phoneNumber, reasonForVisit;

    if (typeof walkInData === "string") {
      // Old format compatibility
      patientName = `${walkInData} (Walk-in)`;
      patientId = null;
      idNumber = null;
      phoneNumber = null;
      reasonForVisit = null;
    } else {
      // New enhanced format
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
      // Enhanced data
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

  // PATIENT FUNCTIONS - NEW
  const addPatient = (patientData) => {
    const newPatient = {
      id: Date.now(),
      ...patientData,
      createdAt: new Date().toISOString(),
    };
    setPatients((prev) => [...prev, newPatient]);
    return newPatient;
  };

  const updatePatient = (patientId, updates) => {
    setPatients((prev) =>
      prev.map((patient) =>
        patient.id === patientId ? { ...patient, ...updates } : patient
      )
    );
  };

  const deletePatient = (patientId) => {
    setPatients((prev) => prev.filter((patient) => patient.id !== patientId));
  };

  // Minimal analytics function
  const getAnalytics = () => {
    const today = new Date().toISOString().split("T")[0];
    return {
      today: {
        appointments: appointments.filter((apt) => apt.date === today).length,
        completed: appointments.filter(
          (apt) => apt.date === today && apt.status === "Completed"
        ).length,
        revenue: 1500,
      },
      week: {
        appointments: appointments.length,
        completed: appointments.filter((apt) => apt.status === "Completed")
          .length,
        revenue: 7500,
      },
      month: {
        appointments: appointments.length,
        completed: appointments.filter((apt) => apt.status === "Completed")
          .length,
        revenue: 25000,
      },
      serviceBreakdown: {
        "General Practice": 15,
        "Chronic Care": 8,
        "Maternal Care": 5,
        "HIV/AIDS Care": 6,
        "TB Treatment": 3,
      },
      queueMetrics: {
        averageWaitTime: "15 min",
        totalServed: 12,
        currentWaiting: queue.filter((p) => p.status === "Waiting").length,
      },
    };
  };

  const value = {
    appointments,
    queue,
    patients, // Add patients to context
    addAppointment,
    checkInAppointment,
    addWalkInToQueue,
    callNextInQueue,
    completeQueueMember,
    notifyPatient,
    // Patient functions
    addPatient,
    updatePatient,
    deletePatient,
    getAnalytics,
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
};
