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

      const currentQueue = await this.getQueue();
      const maxPosition =
        currentQueue.length > 0
          ? Math.max(...currentQueue.map((item) => item.position))
          : 0;

      const firebaseData = {
        ...queueData,
        position: maxPosition + 1,
        joinedAt: serverTimestamp(),
        addedAt: serverTimestamp(),
        status: queueData.status || "Waiting",
        type: queueData.type || "walk-in",
        notified: queueData.notified || false,
        // NEW: Notification tracking
        lastNotifiedAt: null,
        notificationCount: 0,
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

      const updateData = {
        ...updates,
        updatedAt: serverTimestamp(),
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

  // NEW: Smart notification system for app users
  async notifyNextInQueue() {
    try {
      console.log("🔄 Notifying next patients in queue...");

      const queue = await this.getQueue();
      const waitingPatients = queue
        .filter((p) => p.status === "Waiting")
        .sort((a, b) => a.position - b.position);

      if (waitingPatients.length === 0) {
        console.log("ℹ️ No patients waiting to notify");
        return {
          success: false,
          message: "No patients waiting in queue",
          notifiedPatients: [],
        };
      }

      // Find app users (not walk-ins) who haven't been notified recently
      const appUsers = waitingPatients.filter(
        (p) => p.type === "app" || p.type === "appointment"
      );

      if (appUsers.length === 0) {
        console.log("ℹ️ No app users in queue to notify");
        return {
          success: false,
          message: "No app users in queue (only walk-ins)",
          notifiedPatients: [],
        };
      }

      // Smart notification logic: notify next 2-3 app users
      const currentlyCalled = queue.find((p) => p.status === "Called");
      const currentPosition = currentlyCalled ? currentlyCalled.position : 0;

      // Notify app users who are within 3 positions of being called
      const patientsToNotify = appUsers
        .filter((p) => {
          const positionDiff = p.position - currentPosition;
          return positionDiff <= 3 && positionDiff > 0 && !p.notified;
        })
        .slice(0, 3); // Maximum 3 notifications

      if (patientsToNotify.length === 0) {
        console.log(
          "ℹ️ No new app users to notify (already notified or too far in queue)"
        );
        return {
          success: false,
          message: "All nearby app users have already been notified",
          notifiedPatients: [],
        };
      }

      // Send notifications and update Firebase
      const notificationPromises = patientsToNotify.map(async (patient) => {
        await this.updateQueueItem(patient.id, {
          notified: true,
          lastNotifiedAt: new Date().toISOString(),
          notificationCount: (patient.notificationCount || 0) + 1,
        });

        // TODO: Here you would integrate with your actual notification service
        // For now, we'll simulate the notification
        console.log(`📱 Sending app notification to: ${patient.patientName}`);

        return {
          id: patient.id,
          name: patient.patientName,
          position: patient.position,
          estimatedWait: this.calculateEstimatedWait(
            patient.position,
            currentPosition
          ),
        };
      });

      const notifiedPatients = await Promise.all(notificationPromises);

      console.log(
        "✅ Successfully notified patients:",
        notifiedPatients.map((p) => p.name)
      );

      return {
        success: true,
        message: `Notified ${notifiedPatients.length} app user(s)`,
        notifiedPatients,
      };
    } catch (error) {
      console.error("❌ Error notifying next patients:", error);
      throw new Error(`Failed to notify patients: ${error.message}`);
    }
  }

  // NEW: Calculate estimated wait time
  calculateEstimatedWait(patientPosition, currentPosition) {
    const positionsAhead = patientPosition - currentPosition - 1;
    const avgTimePerPatient = 15; // minutes
    const estimatedMinutes = Math.max(5, positionsAhead * avgTimePerPatient);

    if (estimatedMinutes < 60) {
      return `${estimatedMinutes} min`;
    } else {
      const hours = Math.floor(estimatedMinutes / 60);
      const mins = estimatedMinutes % 60;
      return `${hours}h ${mins}m`;
    }
  }

  // Enhanced single patient notification
  async notifyPatient(queueId) {
    try {
      console.log("🔄 Notifying individual patient:", queueId);

      const queue = await this.getQueue();
      const patient = queue.find((p) => p.id === queueId);

      if (!patient) {
        throw new Error("Patient not found in queue");
      }

      if (patient.type === "walk-in") {
        throw new Error("Cannot send app notification to walk-in patients");
      }

      await this.updateQueueItem(queueId, {
        notified: true,
        lastNotifiedAt: new Date().toISOString(),
        notificationCount: (patient.notificationCount || 0) + 1,
      });

      console.log("✅ Patient notified:", patient.patientName);

      return {
        success: true,
        message: `Notified ${patient.patientName}`,
        patient: {
          id: patient.id,
          name: patient.patientName,
          position: patient.position,
        },
      };
    } catch (error) {
      console.error("❌ Error notifying patient:", error);
      throw new Error(`Failed to notify patient: ${error.message}`);
    }
  }

  // Get patients eligible for notification
  async getNotifiablePatients() {
    try {
      const queue = await this.getQueue();
      const waitingPatients = queue
        .filter((p) => p.status === "Waiting")
        .sort((a, b) => a.position - b.position);

      const currentlyCalled = queue.find((p) => p.status === "Called");
      const currentPosition = currentlyCalled ? currentlyCalled.position : 0;

      // Return app users who are close to being called
      return waitingPatients
        .filter((p) => {
          const isAppUser = p.type === "app" || p.type === "appointment";
          const positionDiff = p.position - currentPosition;
          return isAppUser && positionDiff <= 5 && positionDiff > 0;
        })
        .map((p) => ({
          id: p.id,
          name: p.patientName,
          position: p.position,
          notified: p.notified || false,
          estimatedWait: this.calculateEstimatedWait(
            p.position,
            currentPosition
          ),
          canNotify:
            !p.notified ||
            (p.lastNotifiedAt &&
              new Date() - new Date(p.lastNotifiedAt) > 30 * 60 * 1000), // 30 min cooldown
        }));
    } catch (error) {
      console.error("❌ Error getting notifiable patients:", error);
      return [];
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
        appointments: queue.filter(
          (p) => p.type === "appointment" || p.type === "app"
        ).length,
        notified: queue.filter((p) => p.notified === true).length,
        averageWaitTime: "15 min",
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
        notified: 0,
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
      return () => {};
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
