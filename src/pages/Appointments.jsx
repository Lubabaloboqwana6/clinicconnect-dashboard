import React, { useState } from "react";
import { useData } from "../context/DataContext";
import { AddAppointmentModal } from "../components/AddAppointmentModal.jsx";

// Import FullCalendar and its plugins
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";

import { FiPlus } from "react-icons/fi";
import "./Appointments.css";

export const Appointments = () => {
  const { appointments } = useData();
  const [showModal, setShowModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);

  const handleDateClick = (clickInfo) => {
    setSelectedDate(clickInfo.dateStr);
    setShowModal(true);
  };

  const calendarEvents = appointments.map((apt) => ({
    id: apt.id,
    title: `${apt.time} - ${apt.patientName}`,
    date: apt.date,
    extendedProps: {
      service: apt.service,
      status: apt.status,
    },
  }));

  return (
    <>
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
          <button
            className="add-appointment-btn"
            onClick={() => {
              setSelectedDate(null);
              setShowModal(true);
            }}
          >
            <FiPlus /> Add Appointment
          </button>
        </div>

        <div className="calendar-container">
          <FullCalendar
            plugins={[dayGridPlugin, interactionPlugin]}
            initialView="dayGridMonth"
            headerToolbar={{
              left: "prev,next today",
              center: "title",
              right: "dayGridMonth,dayGridWeek",
            }}
            events={calendarEvents}
            dateClick={handleDateClick}
            editable={true}
            selectable={true}
            height="auto"
          />
        </div>
      </div>
    </>
  );
};
