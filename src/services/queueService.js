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
  serverTimestamp,
  onSnapshot,
} from "firebase/firestore";

class QueueService {
  constructor() {
    this.collectionName = "queue";
  }

  // Get all queue items
  async getQueue() {
    try {
      console.log("🔄 Loading queue from Firebase...");

      // Order by position to maintain queue order
      const q = query(
        collection(db, this.collectionName),
        orderBy("position", "asc")
      );
      const querySnapshot = await getDocs(q);

      const queueItems = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        queueItems.push({
          id: doc.id,
          ...data,
          // Convert Firestore timestamps back to strings for compatibility
          joinedAt: data.joinedAt?.toDate?.()?.toISOString() || data.joinedAt,
          addedAt: data.addedAt?.toDate?.()?.toISOString() || data.addedAt,
        });
      });

      console.log(`✅ Loaded ${queueItems.length} queue items from Firebase`);
      return queueItems;
    } catch (error) {
      console.error("❌ Error loading queue from Firebase:", error);
      throw new Error(`Failed to load queue: ${error.message}`);
    }
  }

  // Add new patient to queue
  async addToQueue(queueData) {
    try {
      console.log(
        "🔄 Adding patient to Firebase queue:",
        queueData.patientName
      );

      // Get current max position to assign next position
      const currentQueue = await this.getQueue();
      const maxPosition =
        currentQueue.length > 0
          ? Math.max(...currentQueue.map((item) => item.position))
          : 0;

      // Prepare data for Firebase
      const firebaseData = {
        ...queueData,
        position: maxPosition + 1,
        joinedAt: serverTimestamp(), // Use server timestamp
        addedAt: serverTimestamp(),
        status: queueData.status || "Waiting",
        type: queueData.type || "walk-in",
        notified: queueData.notified || false,
        // Ensure all fields are properly formatted
        patientName: queueData.patientName?.trim() || "",
        idNumber: queueData.idNumber?.trim() || "",
        phoneNumber: queueData.phoneNumber?.trim() || "",
        reasonForVisit: queueData.reasonForVisit?.trim() || "",
        joinTime:
          queueData.joinTime ||
          new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
      };

      const docRef = await addDoc(
        collection(db, this.collectionName),
        firebaseData
      );

      const newQueueItem = {
        id: docRef.id,
        ...queueData,
        position: maxPosition + 1,
        joinedAt: new Date().toISOString(),
        addedAt: new Date().toISOString(),
      };

      console.log("✅ Added patient to Firebase queue:", {
        id: docRef.id,
        name: newQueueItem.patientName,
        position: newQueueItem.position,
      });

      return newQueueItem;
    } catch (error) {
      console.error("❌ Error adding patient to Firebase queue:", error);
      throw new Error(`Failed to add to queue: ${error.message}`);
    }
  }

  // Update queue item
  async updateQueueItem(queueId, updates) {
    try {
      console.log("🔄 Updating queue item in Firebase:", queueId);

      if (!queueId) {
        throw new Error("Queue ID is required for update");
      }

      const queueRef = doc(db, this.collectionName, queueId);

      // Prepare update data
      const updateData = {
        ...updates,
        updatedAt: serverTimestamp(),
        // Ensure text fields are trimmed if provided
        ...(updates.patientName && { patientName: updates.patientName.trim() }),
        ...(updates.idNumber && { idNumber: updates.idNumber.trim() }),
        ...(updates.phoneNumber && { phoneNumber: updates.phoneNumber.trim() }),
        ...(updates.reasonForVisit && {
          reasonForVisit: updates.reasonForVisit.trim(),
        }),
      };

      await updateDoc(queueRef, updateData);
      console.log("✅ Updated queue item in Firebase:", queueId);

      return {
        id: queueId,
        ...updates,
        updatedAt: new Date().toISOString(),
      };
    } catch (error) {
      console.error("❌ Error updating queue item in Firebase:", error);
      throw new Error(`Failed to update queue item: ${error.message}`);
    }
  }

  // Remove patient from queue
  async removeFromQueue(queueId) {
    try {
      console.log("🔄 Removing patient from Firebase queue:", queueId);

      if (!queueId) {
        throw new Error("Queue ID is required for removal");
      }

      await deleteDoc(doc(db, this.collectionName, queueId));
      console.log("✅ Removed patient from Firebase queue:", queueId);
    } catch (error) {
      console.error("❌ Error removing patient from Firebase queue:", error);
      throw new Error(`Failed to remove from queue: ${error.message}`);
    }
  }

  // Call next patient (update status to "Called")
  async callNextPatient() {
    try {
      console.log("🔄 Calling next patient...");

      const queue = await this.getQueue();
      const waitingPatients = queue.filter((p) => p.status === "Waiting");

      if (waitingPatients.length === 0) {
        console.log("ℹ️ No patients waiting in queue");
        return null;
      }

      // Find patient with lowest position number
      const nextPatient = waitingPatients.reduce((min, patient) =>
        patient.position < min.position ? patient : min
      );

      // Update any currently called patient to completed
      const currentlyCalled = queue.find((p) => p.status === "Called");
      if (currentlyCalled) {
        await this.updateQueueItem(currentlyCalled.id, { status: "Completed" });
      }

      // Update next patient to called
      await this.updateQueueItem(nextPatient.id, {
        status: "Called",
        calledAt: new Date().toISOString(),
      });

      console.log("✅ Called next patient:", nextPatient.patientName);
      return { ...nextPatient, status: "Called" };
    } catch (error) {
      console.error("❌ Error calling next patient:", error);
      throw new Error(`Failed to call next patient: ${error.message}`);
    }
  }

  // Notify patient (update notified status)
  async notifyPatient(queueId) {
    try {
      console.log("🔄 Notifying patient:", queueId);

      await this.updateQueueItem(queueId, {
        notified: true,
        notifiedAt: new Date().toISOString(),
      });

      console.log("✅ Patient notified:", queueId);
    } catch (error) {
      console.error("❌ Error notifying patient:", error);
      throw new Error(`Failed to notify patient: ${error.message}`);
    }
  }

  // Get queue statistics
  async getQueueStats() {
    try {
      const queue = await this.getQueue();

      const stats = {
        total: queue.length,
        waiting: queue.filter((p) => p.status === "Waiting").length,
        called: queue.filter((p) => p.status === "Called").length,
        completed: queue.filter((p) => p.status === "Completed").length,
        walkIns: queue.filter((p) => p.type === "walk-in").length,
        appointments: queue.filter((p) => p.type === "appointment").length,
        averageWaitTime: "15 min", // TODO: Calculate actual wait time
      };

      console.log("📊 Queue stats:", stats);
      return stats;
    } catch (error) {
      console.error("❌ Error getting queue stats:", error);
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
  }

  // Real-time listener for queue updates
  subscribeToQueue(callback) {
    try {
      console.log("🔄 Setting up real-time queue listener...");

      const q = query(
        collection(db, this.collectionName),
        orderBy("position", "asc")
      );

      return onSnapshot(
        q,
        (querySnapshot) => {
          const queueItems = [];
          querySnapshot.forEach((doc) => {
            const data = doc.data();
            queueItems.push({
              id: doc.id,
              ...data,
              joinedAt:
                data.joinedAt?.toDate?.()?.toISOString() || data.joinedAt,
              addedAt: data.addedAt?.toDate?.()?.toISOString() || data.addedAt,
            });
          });

          console.log("📡 Real-time queue update:", queueItems.length, "items");
          callback(queueItems);
        },
        (error) => {
          console.error("❌ Queue listener error:", error);
        }
      );
    } catch (error) {
      console.error("❌ Error setting up queue listener:", error);
      return () => {}; // Return empty unsubscribe function
    }
  }

  // Test connection
  async testConnection() {
    try {
      console.log("🔄 Testing queue Firebase connection...");
      const q = query(collection(db, this.collectionName));
      const snapshot = await getDocs(q);
      console.log(
        "✅ Queue connection test successful, found",
        snapshot.size,
        "queue items"
      );
      return true;
    } catch (error) {
      console.error("❌ Queue connection test failed:", error);
      return false;
    }
  }
}

// Export singleton instance
export const queueService = new QueueService();
