// src/App.jsx - Updated with new routes
import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { DataProvider } from "./context/DataContext";
import { Sidebar } from "./components/Sidebar.jsx";
import { Dashboard } from "./pages/Dashboard.jsx";
import { Appointments } from "./pages/Appointments.jsx";
import { Queue } from "./pages/Queue.jsx";
import { Patients } from "./pages/Patients.jsx";

import "./App.css";

function App() {
  return (
    <DataProvider>
      <Router>
        <div className="app-container">
          <Sidebar />
          <main className="main-content">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/appointments" element={<Appointments />} />
              <Route path="/queue" element={<Queue />} />
              <Route path="/patients" element={<Patients />} />

              {/* <Route path="/analytics" element={<Analytics />} /> */}
            </Routes>
          </main>
        </div>
      </Router>
    </DataProvider>
  );
}

export default App;
