import { db } from "../config/firebase";
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDocs,
  query,
  orderBy,
  where,
  serverTimestamp,
} from "firebase/firestore";

class AppointmentsService {
  constructor() {
    this.collectionName = "appointments";
  }

  // Get all appointments
  async getAppointments() {
    try {
      console.log("🔄 Loading appointments from Firebase...");

      const q = query(
        collection(db, this.collectionName),
        orderBy("createdAt", "desc")
      );
      const querySnapshot = await getDocs(q);

      const appointments = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        appointments.push({
          id: doc.id,
          ...data,
          // Convert Firestore timestamps back to strings for compatibility
          createdAt:
            data.createdAt?.toDate?.()?.toISOString() || data.createdAt,
          updatedAt:
            data.updatedAt?.toDate?.()?.toISOString() || data.updatedAt,
        });
      });

      console.log(
        `✅ Loaded ${appointments.length} appointments from Firebase`
      );
      return appointments;
    } catch (error) {
      console.error("❌ Error loading appointments from Firebase:", error);
      throw new Error(`Failed to load appointments: ${error.message}`);
    }
  }

  // Add new appointment
  async addAppointment(appointmentData) {
    try {
      console.log(
        "🔄 Adding appointment to Firebase:",
        appointmentData.clinicName
      );

      // Validate required fields
      if (
        !appointmentData.clinicName ||
        !appointmentData.date ||
        !appointmentData.time
      ) {
        throw new Error("Clinic, date, and time are required");
      }

      // Prepare data for Firebase
      const firebaseData = {
        ...appointmentData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        // Ensure all fields are properly formatted
        clinicName: appointmentData.clinicName.trim(),
        service: appointmentData.service?.trim() || "",
        date: appointmentData.date,
        time: appointmentData.time,
        status: appointmentData.status || "confirmed",
        notes: appointmentData.notes?.trim() || "",
        clinicId: appointmentData.clinicId || null,
        patientName: appointmentData.patientName?.trim() || "",
        patientPhone: appointmentData.patientPhone?.trim() || "",
        patientEmail: appointmentData.patientEmail?.trim() || "",
      };

      const docRef = await addDoc(
        collection(db, this.collectionName),
        firebaseData
      );

      const newAppointment = {
        id: docRef.id,
        ...appointmentData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      console.log("✅ Added appointment to Firebase:", {
        id: docRef.id,
        clinic: newAppointment.clinicName,
        date: newAppointment.date,
      });

      return newAppointment;
    } catch (error) {
      console.error("❌ Error adding appointment to Firebase:", error);
      throw new Error(`Failed to add appointment: ${error.message}`);
    }
  }

  // Update existing appointment
  async updateAppointment(appointmentId, updates) {
    try {
      console.log("🔄 Updating appointment in Firebase:", appointmentId);

      if (!appointmentId) {
        throw new Error("Appointment ID is required for update");
      }

      const appointmentRef = doc(db, this.collectionName, appointmentId);

      // Clean and prepare update data
      const updateData = {
        ...updates,
        updatedAt: serverTimestamp(),
        // Ensure text fields are trimmed
        ...(updates.clinicName && { clinicName: updates.clinicName.trim() }),
        ...(updates.service && { service: updates.service.trim() }),
        ...(updates.notes && { notes: updates.notes.trim() }),
        ...(updates.patientName && { patientName: updates.patientName.trim() }),
        ...(updates.patientPhone && {
          patientPhone: updates.patientPhone.trim(),
        }),
        ...(updates.patientEmail && {
          patientEmail: updates.patientEmail.trim(),
        }),
      };

      await updateDoc(appointmentRef, updateData);
      console.log("✅ Updated appointment in Firebase:", appointmentId);

      return {
        id: appointmentId,
        ...updates,
        updatedAt: new Date().toISOString(),
      };
    } catch (error) {
      console.error("❌ Error updating appointment in Firebase:", error);
      throw new Error(`Failed to update appointment: ${error.message}`);
    }
  }

  // Delete appointment
  async deleteAppointment(appointmentId) {
    try {
      console.log("🔄 Deleting appointment from Firebase:", appointmentId);

      if (!appointmentId) {
        throw new Error("Appointment ID is required for deletion");
      }

      await deleteDoc(doc(db, this.collectionName, appointmentId));
      console.log("✅ Deleted appointment from Firebase:", appointmentId);
    } catch (error) {
      console.error("❌ Error deleting appointment from Firebase:", error);
      throw new Error(`Failed to delete appointment: ${error.message}`);
    }
  }

  // Get appointments by status
  async getAppointmentsByStatus(status) {
    try {
      console.log("🔍 Getting appointments by status:", status);
      const q = query(
        collection(db, this.collectionName),
        where("status", "==", status),
        orderBy("date", "asc")
      );

      const querySnapshot = await getDocs(q);
      const appointments = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        appointments.push({
          id: doc.id,
          ...data,
          createdAt:
            data.createdAt?.toDate?.()?.toISOString() || data.createdAt,
          updatedAt:
            data.updatedAt?.toDate?.()?.toISOString() || data.updatedAt,
        });
      });

      console.log(
        `📋 Found ${appointments.length} appointments with status: ${status}`
      );
      return appointments;
    } catch (error) {
      console.error("❌ Error getting appointments by status:", error);
      throw new Error(`Failed to get appointments by status: ${error.message}`);
    }
  }

  // Get upcoming appointments
  async getUpcomingAppointments() {
    try {
      const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD format
      console.log("📅 Getting upcoming appointments from:", today);

      const q = query(
        collection(db, this.collectionName),
        where("date", ">=", today),
        orderBy("date", "asc")
      );

      const querySnapshot = await getDocs(q);
      const appointments = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        appointments.push({
          id: doc.id,
          ...data,
          createdAt:
            data.createdAt?.toDate?.()?.toISOString() || data.createdAt,
          updatedAt:
            data.updatedAt?.toDate?.()?.toISOString() || data.updatedAt,
        });
      });

      console.log(`📅 Found ${appointments.length} upcoming appointments`);
      return appointments;
    } catch (error) {
      console.error("❌ Error getting upcoming appointments:", error);
      throw new Error(`Failed to get upcoming appointments: ${error.message}`);
    }
  }

  // Get appointment statistics
  async getAppointmentStats() {
    try {
      const appointments = await this.getAppointments();

      const now = new Date();
      const today = now.toISOString().split("T")[0];
      const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0];

      const stats = {
        total: appointments.length,
        confirmed: appointments.filter((a) => a.status === "confirmed").length,
        pending: appointments.filter((a) => a.status === "pending").length,
        cancelled: appointments.filter((a) => a.status === "cancelled").length,
        today: appointments.filter((a) => a.date === today).length,
        thisWeek: appointments.filter(
          (a) => a.date >= today && a.date <= weekFromNow
        ).length,
        upcoming: appointments.filter((a) => a.date >= today).length,
      };

      console.log("📊 Appointment stats:", stats);
      return stats;
    } catch (error) {
      console.error("❌ Error getting appointment stats:", error);
      return {
        total: 0,
        confirmed: 0,
        pending: 0,
        cancelled: 0,
        today: 0,
        thisWeek: 0,
        upcoming: 0,
      };
    }
  }

  // Cancel appointment (update status instead of delete)
  async cancelAppointment(appointmentId, reason = "") {
    try {
      console.log("🔄 Cancelling appointment:", appointmentId);

      await this.updateAppointment(appointmentId, {
        status: "cancelled",
        cancelledAt: new Date().toISOString(),
        cancelReason: reason.trim(),
      });

      console.log("✅ Cancelled appointment:", appointmentId);
    } catch (error) {
      console.error("❌ Error cancelling appointment:", error);
      throw new Error(`Failed to cancel appointment: ${error.message}`);
    }
  }

  // Reschedule appointment
  async rescheduleAppointment(appointmentId, newDate, newTime) {
    try {
      console.log(
        "🔄 Rescheduling appointment:",
        appointmentId,
        "to",
        newDate,
        newTime
      );

      await this.updateAppointment(appointmentId, {
        date: newDate,
        time: newTime,
        status: "confirmed", // Reset to confirmed after reschedule
        rescheduledAt: new Date().toISOString(),
      });

      console.log("✅ Rescheduled appointment:", appointmentId);
    } catch (error) {
      console.error("❌ Error rescheduling appointment:", error);
      throw new Error(`Failed to reschedule appointment: ${error.message}`);
    }
  }

  // Test connection
  async testConnection() {
    try {
      console.log("🔄 Testing appointments Firebase connection...");
      const q = query(collection(db, this.collectionName));
      const snapshot = await getDocs(q);
      console.log(
        "✅ Appointments connection test successful, found",
        snapshot.size,
        "appointments"
      );
      return true;
    } catch (error) {
      console.error("❌ Appointments connection test failed:", error);
      return false;
    }
  }
}

// Export singleton instance
export const appointmentsService = new AppointmentsService();
