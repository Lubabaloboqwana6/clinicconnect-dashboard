import { db } from "../config/firebase";
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  onSnapshot,
} from "firebase/firestore";

// Configuration flag - switch between local and Firebase
const USE_FIREBASE = false; // Start with false, change to true when ready

class DataService {
  constructor() {
    this.useFirebase = USE_FIREBASE;
    this.localData = {
      appointments: [],
      queue: [],
      patients: [],
    };
  }

  // Toggle between Firebase and local storage
  setFirebaseMode(enabled) {
    this.useFirebase = enabled;
    console.log(`Data service switched to: ${enabled ? "Firebase" : "Local"}`);
  }

  // APPOINTMENTS
  async getAppointments() {
    if (!this.useFirebase) {
      // Return your existing context data
      return this.localData.appointments;
    }

    try {
      const querySnapshot = await getDocs(collection(db, "appointments"));
      const appointments = [];
      querySnapshot.forEach((doc) => {
        appointments.push({ id: doc.id, ...doc.data() });
      });
      return appointments;
    } catch (error) {
      console.error("Firebase error, falling back to local:", error);
      return this.localData.appointments;
    }
  }

  async addAppointment(appointmentData) {
    if (!this.useFirebase) {
      // Use your existing local logic
      const newAppointment = { id: Date.now(), ...appointmentData };
      this.localData.appointments.push(newAppointment);
      return newAppointment;
    }

    try {
      const docRef = await addDoc(collection(db, "appointments"), {
        ...appointmentData,
        createdAt: new Date(),
      });
      return { id: docRef.id, ...appointmentData };
    } catch (error) {
      console.error("Firebase error, using local fallback:", error);
      // Fallback to local
      const newAppointment = { id: Date.now(), ...appointmentData };
      this.localData.appointments.push(newAppointment);
      return newAppointment;
    }
  }

  async updateAppointment(id, updates) {
    if (!this.useFirebase) {
      // Local update logic
      const index = this.localData.appointments.findIndex(
        (apt) => apt.id === id
      );
      if (index !== -1) {
        this.localData.appointments[index] = {
          ...this.localData.appointments[index],
          ...updates,
        };
      }
      return;
    }

    try {
      const appointmentRef = doc(db, "appointments", id);
      await updateDoc(appointmentRef, updates);
    } catch (error) {
      console.error("Firebase update error:", error);
      // Fallback to local update
      const index = this.localData.appointments.findIndex(
        (apt) => apt.id === id
      );
      if (index !== -1) {
        this.localData.appointments[index] = {
          ...this.localData.appointments[index],
          ...updates,
        };
      }
    }
  }

  async deleteAppointment(id) {
    if (!this.useFirebase) {
      this.localData.appointments = this.localData.appointments.filter(
        (apt) => apt.id !== id
      );
      return;
    }

    try {
      await deleteDoc(doc(db, "appointments", id));
    } catch (error) {
      console.error("Firebase delete error:", error);
      // Fallback to local delete
      this.localData.appointments = this.localData.appointments.filter(
        (apt) => apt.id !== id
      );
    }
  }

  // QUEUE MANAGEMENT
  async getQueue() {
    if (!this.useFirebase) {
      return this.localData.queue;
    }

    try {
      const q = query(collection(db, "queue"), orderBy("position"));
      const querySnapshot = await getDocs(q);
      const queue = [];
      querySnapshot.forEach((doc) => {
        queue.push({ id: doc.id, ...doc.data() });
      });
      return queue;
    } catch (error) {
      console.error("Firebase queue error:", error);
      return this.localData.queue;
    }
  }

  async addToQueue(queueData) {
    if (!this.useFirebase) {
      const newQueueItem = { id: Date.now(), ...queueData };
      this.localData.queue.push(newQueueItem);
      return newQueueItem;
    }

    try {
      const docRef = await addDoc(collection(db, "queue"), {
        ...queueData,
        joinedAt: new Date(),
      });
      return { id: docRef.id, ...queueData };
    } catch (error) {
      console.error("Firebase queue add error:", error);
      const newQueueItem = { id: Date.now(), ...queueData };
      this.localData.queue.push(newQueueItem);
      return newQueueItem;
    }
  }

  // PATIENTS
  async getPatients() {
    if (!this.useFirebase) {
      return this.localData.patients;
    }

    try {
      const querySnapshot = await getDocs(collection(db, "patients"));
      const patients = [];
      querySnapshot.forEach((doc) => {
        patients.push({ id: doc.id, ...doc.data() });
      });
      return patients;
    } catch (error) {
      console.error("Firebase patients error:", error);
      return this.localData.patients;
    }
  }

  async addPatient(patientData) {
    if (!this.useFirebase) {
      const newPatient = { id: Date.now(), ...patientData };
      this.localData.patients.push(newPatient);
      return newPatient;
    }

    try {
      const docRef = await addDoc(collection(db, "patients"), {
        ...patientData,
        createdAt: new Date(),
      });
      return { id: docRef.id, ...patientData };
    } catch (error) {
      console.error("Firebase patient add error:", error);
      const newPatient = { id: Date.now(), ...patientData };
      this.localData.patients.push(newPatient);
      return newPatient;
    }
  }

  // REAL-TIME LISTENERS (Firebase only)
  subscribeToQueue(callback) {
    if (!this.useFirebase) {
      console.log("Real-time updates not available in local mode");
      return () => {}; // Return empty unsubscribe function
    }

    try {
      const q = query(collection(db, "queue"), orderBy("position"));
      return onSnapshot(q, (querySnapshot) => {
        const queue = [];
        querySnapshot.forEach((doc) => {
          queue.push({ id: doc.id, ...doc.data() });
        });
        callback(queue);
      });
    } catch (error) {
      console.error("Firebase subscription error:", error);
      return () => {};
    }
  }

  // UTILITY METHODS
  isUsingFirebase() {
    return this.useFirebase;
  }

  // Method to sync local data to Firebase when ready
  async syncLocalToFirebase() {
    if (!this.useFirebase) {
      console.log("Cannot sync - Firebase mode disabled");
      return;
    }

    console.log("Syncing local data to Firebase...");

    try {
      // Sync appointments
      for (const appointment of this.localData.appointments) {
        await addDoc(collection(db, "appointments"), appointment);
      }

      // Sync patients
      for (const patient of this.localData.patients) {
        await addDoc(collection(db, "patients"), patient);
      }

      console.log("Sync completed successfully!");
    } catch (error) {
      console.error("Sync failed:", error);
    }
  }
}

// Export singleton instance
export const dataService = new DataService();
