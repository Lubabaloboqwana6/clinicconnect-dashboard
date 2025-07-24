export const initialAppointments = [
  {
    id: 1,
    patientName: "John Doe",
    service: "General Practice",
    date: "2025-07-24", // Today's date for demo
    time: "10:00",
    status: "Confirmed",
  },
  {
    id: 2,
    patientName: "Jane Smith",
    service: "Maternal Care",
    date: "2025-07-24",
    time: "10:30",
    status: "Confirmed",
  },
  {
    id: 3,
    patientName: "Peter Jones",
    service: "Chronic Care",
    date: "2025-07-24",
    time: "11:00",
    status: "Checked-In",
  },
];

export const initialQueue = [
  {
    id: 101,
    patientName: "Alice Williams (App)",
    position: 1,
    joinTime: "09:15",
    status: "Waiting",
    type: "app", // <-- This user came from the mobile app
    notified: false, // <-- Has not been notified yet
  },
  {
    id: 102,
    patientName: "Bob Brown (App)",
    position: 2,
    joinTime: "09:20",
    status: "Waiting",
    type: "app",
    notified: false,
  },
  {
    id: 103,
    patientName: "Charlie Davis (Walk-in)",
    position: 3,
    joinTime: "09:28",
    status: "Waiting",
    type: "walk-in", // <-- This user was added by staff
    notified: false, // Not applicable, but good to have
  },
];
