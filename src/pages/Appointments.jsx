import React, { useState } from "react";
import { useData } from "../context/DataContext";
import { AddAppointmentModal } from "../components/AddAppointmentModal.jsx";

// NEW: Import FullCalendar and its plugins
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";

import { FiPlus } from "react-icons/fi";
import "./Appointments.css"; // We will update this CSS file

export const Appointments = () => {
  const { appointments } = useData();
  const [showModal, setShowModal] = useState(false);

  // NEW: State to hold the date clicked by the user
  const [selectedDate, setSelectedDate] = useState(null);

  /**
   * NEW: This function is triggered when a user clicks on a date in the calendar.
   * It captures the clicked date and opens the "Add Appointment" modal.
   */
  const handleDateClick = (clickInfo) => {
    setSelectedDate(clickInfo.dateStr); // e.g., "2025-07-26"
    setShowModal(true);
  };

  /**
   * NEW: FullCalendar needs events in a specific format.
   * We map our appointment data into the format the calendar expects.
   */
  const calendarEvents = appointments.map((apt) => ({
    id: apt.id,
    title: `${apt.time} - ${apt.patientName}`, // This will be displayed on the event
    date: apt.date,
    // You can add more properties here for styling or pop-ups later
    extendedProps: {
      service: apt.service,
      status: apt.status,
    },
  }));

  return (
    <>
      {/* The modal now receives the selectedDate to pre-fill the form */}
      <AddAppointmentModal
        show={showModal}
        onClose={() => setShowModal(false)}
        selectedDate={selectedDate}
      />

      <div className="page">
        <div className="page-header">
          <div>
            <h1>Appointment Calendar</h1>
            <p className="subtitle">
              Visually manage all scheduled appointments.
            </p>
          </div>
          {/* The button now just opens the modal without a pre-selected date */}
          <button
            className="add-appointment-btn"
            onClick={() => {
              setSelectedDate(null); // Ensure no date is pre-selected
              setShowModal(true);
            }}
          >
            <FiPlus /> Add Appointment
          </button>
        </div>

        {/* The HTML table is replaced with the FullCalendar component */}
        <div className="calendar-container">
          <FullCalendar
            plugins={[dayGridPlugin, interactionPlugin]}
            initialView="dayGridMonth"
            headerToolbar={{
              left: "prev,next today",
              center: "title",
              right: "dayGridMonth,dayGridWeek", // Example: add a week view
            }}
            events={calendarEvents}
            dateClick={handleDateClick} // Handle clicking on a date
            editable={true} // Allows for future drag-and-drop functionality
            selectable={true}
            height="auto" // Adjusts height to container
          />
        </div>
      </div>
    </>
  );
};
