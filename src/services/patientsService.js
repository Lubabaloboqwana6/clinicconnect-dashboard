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

class PatientsService {
  constructor() {
    this.collectionName = "patients";
  }

  // Get all patients
  async getPatients() {
    try {
      console.log("🔄 Loading patients from Firebase...");

      const q = query(
        collection(db, this.collectionName),
        orderBy("createdAt", "desc")
      );
      const querySnapshot = await getDocs(q);

      const patients = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        patients.push({
          id: doc.id,
          ...data,
          // Convert Firestore timestamps back to strings for compatibility
          createdAt:
            data.createdAt?.toDate?.()?.toISOString() || data.createdAt,
          updatedAt:
            data.updatedAt?.toDate?.()?.toISOString() || data.updatedAt,
        });
      });

      console.log(`✅ Loaded ${patients.length} patients from Firebase`);
      return patients;
    } catch (error) {
      console.error("❌ Error loading patients from Firebase:", error);
      console.error("Error details:", {
        code: error.code,
        message: error.message,
        stack: error.stack,
      });
      throw new Error(`Failed to load patients: ${error.message}`);
    }
  }

  // Add new patient
  async addPatient(patientData) {
    try {
      console.log("🔄 Adding patient to Firebase:", patientData.name);

      // Validate required fields
      if (!patientData.name || !patientData.phone) {
        throw new Error("Name and phone are required");
      }

      // Prepare data for Firebase
      const firebaseData = {
        ...patientData,
        createdAt: serverTimestamp(), // Use server timestamp
        updatedAt: serverTimestamp(),
        // Ensure all fields are properly formatted
        name: patientData.name.trim(),
        phone: patientData.phone.trim(),
        email: patientData.email?.trim() || "",
        dateOfBirth: patientData.dateOfBirth || "",
        gender: patientData.gender || "",
        address: patientData.address?.trim() || "",
        emergencyContact: patientData.emergencyContact?.trim() || "",
        emergencyPhone: patientData.emergencyPhone?.trim() || "",
        medicalConditions: patientData.medicalConditions?.trim() || "",
        allergies: patientData.allergies?.trim() || "",
        currentMedications: patientData.currentMedications?.trim() || "",
      };

      const docRef = await addDoc(
        collection(db, this.collectionName),
        firebaseData
      );

      const newPatient = {
        id: docRef.id,
        ...patientData,
        createdAt: new Date().toISOString(), // Convert back to string for compatibility
        updatedAt: new Date().toISOString(),
      };

      console.log("✅ Added patient to Firebase:", {
        id: docRef.id,
        name: newPatient.name,
      });

      return newPatient;
    } catch (error) {
      console.error("❌ Error adding patient to Firebase:", error);
      console.error("Patient data:", patientData);
      throw new Error(`Failed to add patient: ${error.message}`);
    }
  }

  // Update existing patient
  async updatePatient(patientId, updates) {
    try {
      console.log("🔄 Updating patient in Firebase:", patientId);

      if (!patientId) {
        throw new Error("Patient ID is required for update");
      }

      const patientRef = doc(db, this.collectionName, patientId);

      // Clean and prepare update data
      const updateData = {
        ...updates,
        updatedAt: serverTimestamp(),
        // Ensure text fields are trimmed
        ...(updates.name && { name: updates.name.trim() }),
        ...(updates.phone && { phone: updates.phone.trim() }),
        ...(updates.email && { email: updates.email.trim() }),
        ...(updates.address && { address: updates.address.trim() }),
        ...(updates.emergencyContact && {
          emergencyContact: updates.emergencyContact.trim(),
        }),
        ...(updates.emergencyPhone && {
          emergencyPhone: updates.emergencyPhone.trim(),
        }),
        ...(updates.medicalConditions && {
          medicalConditions: updates.medicalConditions.trim(),
        }),
        ...(updates.allergies && { allergies: updates.allergies.trim() }),
        ...(updates.currentMedications && {
          currentMedications: updates.currentMedications.trim(),
        }),
      };

      await updateDoc(patientRef, updateData);
      console.log("✅ Updated patient in Firebase:", patientId);

      return {
        id: patientId,
        ...updates,
        updatedAt: new Date().toISOString(),
      };
    } catch (error) {
      console.error("❌ Error updating patient in Firebase:", error);
      console.error("Update data:", updates);
      throw new Error(`Failed to update patient: ${error.message}`);
    }
  }

  // Delete patient
  async deletePatient(patientId) {
    try {
      console.log("🔄 Deleting patient from Firebase:", patientId);

      if (!patientId) {
        throw new Error("Patient ID is required for deletion");
      }

      await deleteDoc(doc(db, this.collectionName, patientId));
      console.log("✅ Deleted patient from Firebase:", patientId);
    } catch (error) {
      console.error("❌ Error deleting patient from Firebase:", error);
      throw new Error(`Failed to delete patient: ${error.message}`);
    }
  }

  // Search patients by name
  async searchPatients(searchTerm) {
    try {
      console.log("🔍 Searching patients:", searchTerm);

      // Note: Firestore doesn't support case-insensitive search natively
      // We'll get all patients and filter on the client side for now
      const patients = await this.getPatients();

      if (!searchTerm || !searchTerm.trim()) {
        return patients;
      }

      const term = searchTerm.toLowerCase().trim();
      const filtered = patients.filter(
        (patient) =>
          patient.name?.toLowerCase().includes(term) ||
          patient.email?.toLowerCase().includes(term) ||
          patient.phone?.includes(searchTerm) ||
          patient.medicalConditions?.toLowerCase().includes(term)
      );

      console.log(
        `🔍 Found ${filtered.length} patients matching "${searchTerm}"`
      );
      return filtered;
    } catch (error) {
      console.error("❌ Error searching patients:", error);
      throw new Error(`Search failed: ${error.message}`);
    }
  }

  // Get patient statistics
  async getPatientStats() {
    try {
      const patients = await this.getPatients();

      const now = new Date();
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      const stats = {
        total: patients.length,
        recentlyAdded: patients.filter((p) => {
          const createdDate = new Date(p.createdAt);
          return createdDate > weekAgo;
        }).length,
        addedThisMonth: patients.filter((p) => {
          const createdDate = new Date(p.createdAt);
          return createdDate > monthAgo;
        }).length,
        withConditions: patients.filter(
          (p) => p.medicalConditions && p.medicalConditions.trim()
        ).length,
        withAllergies: patients.filter((p) => p.allergies && p.allergies.trim())
          .length,
        withEmergencyContact: patients.filter(
          (p) => p.emergencyContact && p.emergencyContact.trim()
        ).length,
      };

      console.log("📊 Patient stats:", stats);
      return stats;
    } catch (error) {
      console.error("❌ Error getting patient stats:", error);
      return {
        total: 0,
        recentlyAdded: 0,
        addedThisMonth: 0,
        withConditions: 0,
        withAllergies: 0,
        withEmergencyContact: 0,
      };
    }
  }

  // Test connection
  async testConnection() {
    try {
      console.log("🔄 Testing Firebase connection...");
      const q = query(collection(db, this.collectionName));
      const snapshot = await getDocs(q);
      console.log(
        "✅ Connection test successful, found",
        snapshot.size,
        "patients"
      );
      return true;
    } catch (error) {
      console.error("❌ Connection test failed:", error);
      return false;
    }
  }
}

// Export singleton instance
export const patientsService = new PatientsService();
