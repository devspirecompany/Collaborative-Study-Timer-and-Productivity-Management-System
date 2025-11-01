import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import StudentLogin from './components/StudentLogin';
import StudentRegistration from './components/StudentRegistration';
import StudentDashboard from './components/StudentDashboard';
import StudentStudyTimer from './components/StudentStudyTimer';
import './styles/StudentDashboard.css';
import './styles/StudentLogin.css';
import './styles/StudentRegistration.css';
import './styles/StudentStudyTimer.css';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<StudentLogin />} />
        <Route path="/register" element={<StudentRegistration />} />
        <Route path="/dashboard" element={<StudentDashboard />} />
        <Route path="/study-timer" element={<StudentStudyTimer />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;