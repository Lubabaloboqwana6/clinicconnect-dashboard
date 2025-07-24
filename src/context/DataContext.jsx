// src/context/DataContext.js (FULLY MODIFIED)

import React, { createContext, useState, useContext } from "react";
import { initialAppointments, initialQueue } from "../data/mock";

const DataContext = createContext();

export const useData = () => useContext(DataContext);

export const DataProvider = ({ children }) => {
  const [appointments, setAppointments] = useState(initialAppointments);
  const [queue, setQueue] = useState(initialQueue);

  // ... (keep addAppointment, checkInAppointment, etc.)

  /**
   * NEW: Function to add a walk-in patient to the queue.
   * @param {string} patientName - The name of the walk-in patient.
   */
  const addWalkInToQueue = (patientName) => {
    setQueue((prevQueue) => {
      // Find the highest current position, or default to 0 if queue is empty
      const maxPosition =
        prevQueue.length > 0
          ? Math.max(...prevQueue.map((p) => p.position))
          : 0;

      const newWalkIn = {
        id: Date.now(),
        patientName: `${patientName} (Walk-in)`,
        position: maxPosition + 1, // Assign the next available position
        joinTime: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
        status: "Waiting",
        type: "walk-in",
        notified: false,
      };
      return [...prevQueue, newWalkIn];
    });
  };

  /**
   * NEW: Function to mark an app user as having been notified.
   * @param {number} patientId - The ID of the patient to notify.
   */
  const notifyPatient = (patientId) => {
    setQueue((prevQueue) =>
      prevQueue.map((patient) =>
        patient.id === patientId ? { ...patient, notified: true } : patient
      )
    );
    // In a real app, this is where you would trigger the push notification API
    alert(
      "A 'You are almost next!' notification has been sent to the patient's app."
    );
  };

  // (Keep the other functions like callNextInQueue, etc.)
  const callNextInQueue = () => {
    /* ... */
  };
  const completeQueueMember = (patientId) => {
    /* ... */
  };
  const addAppointment = (appointmentData) => {
    /* ... */
  };
  const checkInAppointment = (appointmentId) => {
    /* ... */
  };

  const value = {
    appointments,
    queue,
    callNextInQueue,
    completeQueueMember,
    checkInAppointment,
    addAppointment,
    addWalkInToQueue, // <-- Export new function
    notifyPatient, // <-- Export new function
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
};
