import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';

const Calendar_page = () => {
  const navigate = useNavigate();
  const today = new Date();
  
  const [selectedDay, setSelectedDay] = useState(today.getDate());
  const [monthIndex, setMonthIndex] = useState(today.getMonth());
  const [year, setYear] = useState(today.getFullYear());
  const [appointments, setAppointments] = useState([]);

  const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
useEffect(() => {
  const fetchAppointments = async () => {
    const token = localStorage.getItem('token'); // Get the token from login
    
    try {
      const response = await fetch('http://localhost:5000/api/appointments', {
        headers: {
          'Authorization': `Bearer ${token}` // Add the security header
        }
      });
      const rawData = await response.json();
      
      // We must transform the date string "2026-04-13" into numbers
      // so your filter (a.day === selectedDay) actually works.
      const formattedData = rawData.map(appt => {
        const d = new Date(appt.appointment_date);
        return {
          id: appt.id,
          time: appt.appointment_time,
          patient: appt.patient_name,
          type: appt.reason,
          // Extract the numbers for the calendar logic:
          day: d.getDate() + 1, // +1 often needed due to UTC/Local mismatch
          month: d.getMonth(),
          year: d.getFullYear()
        };
      });

      setAppointments(formattedData);
    } catch (err) {
      console.error("Error loading appointments:", err);
    }
  };

  fetchAppointments();
}, []);

  const handleRemove = async (id) => {
    if (window.confirm("Are you sure you want to remove this appointment?")) {
      try {
        const response = await fetch(`http://localhost:5000/api/appointments/${id}`, {
          method: 'DELETE',
        });
        if (response.ok) {
          setAppointments(appointments.filter(appt => appt.id !== id));
        }
      } catch (err) {
        alert("Delete failed.");
      }
    }
  };

  const handleToday = () => {
    setYear(today.getFullYear());
    setMonthIndex(today.getMonth());
    setSelectedDay(today.getDate());
  };

  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const firstDayOfWeek = new Date(year, monthIndex, 1).getDay();
  const calendarVisualGrid = [];
  for (let i = 0; i < firstDayOfWeek; i++) calendarVisualGrid.push(null);
  for (let i = 1; i <= daysInMonth; i++) calendarVisualGrid.push(i);
  while (calendarVisualGrid.length < 42) calendarVisualGrid.push(null);

  const selectedAppts = appointments.filter(a => 
    a.day === selectedDay && a.month === monthIndex && a.year === year
  );

  return (
    <div style={containerStyle}>
      <div style={headerNav}>
        <div style={headerFlex}>
          <h2 style={{ margin: 0 }}>Clinic Schedule</h2>
          <div style={controlsGroup}>
            <button onClick={handleToday} style={todayBtn}>Today</button>
            <div style={stepperContainer}>
              <button onClick={() => setMonthIndex(p => p === 0 ? 11 : p - 1)} style={navBtn}>‹</button>
              <span style={stepperDisplay}>{months[monthIndex]}</span>
              <button onClick={() => setMonthIndex(p => p === 11 ? 0 : p + 1)} style={navBtn}>›</button>
            </div>
            <div style={stepperContainer}>
              <button onClick={() => setYear(p => p - 1)} style={navBtn}>‹</button>
              <span style={stepperDisplay}>{year}</span>
              <button onClick={() => setYear(p => p + 1)} style={navBtn}>›</button>
            </div>
          </div>
        </div>
      </div>

      <div style={layoutGrid}>
        <div style={cardStyle}>
          <div style={monthGrid}>
            {dayNames.map(day => <div key={day} style={dayHeader}>{day}</div>)}
            {calendarVisualGrid.map((dayNum, i) => {
              const isSelected = selectedDay === dayNum;
              const hasAppt = dayNum && appointments.some(a => a.day === dayNum && a.month === monthIndex && a.year === year);
              return (
                <div key={i} onClick={() => dayNum && setSelectedDay(dayNum)}
                  style={{
                    ...dayCell,
                    backgroundColor: dayNum ? (isSelected ? '#1e293b' : '#0f172a') : 'transparent',
                    boxShadow: dayNum ? (isSelected ? 'inset 0 0 0 2px #3b82f6' : 'inset 0 0 0 1px #334155') : 'none',
                    color: isSelected ? '#3b82f6' : '#f8fafc',
                    cursor: dayNum ? 'pointer' : 'default'
                  }}>
                  <span>{dayNum}</span>
                  {hasAppt && <div style={dotIndicator}></div>}
                </div>
              );
            })}
          </div>
        </div>

        <div style={{ ...cardStyle, display: 'flex', flexDirection: 'column' }}>
          <div style={agendaHeaderContainer}>
            <h3 style={{ margin: 0, fontSize: '15px' }}>
              {months[monthIndex]} {selectedDay}, {year}
            </h3>
          </div>
          
          <div style={scrollArea}>
            {selectedAppts.length > 0 ? (
              selectedAppts.map(appt => (
                <div key={appt.id} style={apptCard}>
                  <div style={timeSlot}>{appt.time}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: '600', fontSize: '13px' }}>{appt.patient}</div>
                    <div style={{ fontSize: '11px', color: '#94a3b8' }}>{appt.type}</div>
                  </div>
                  <button onClick={() => handleRemove(appt.id)} style={deleteIconBtn}>✕</button>
                </div>
              ))
            ) : (
              <div style={emptyState}>No appointments</div>
            )}
          </div>

          <div style={agendaFooterContainer}>
            <button onClick={() => navigate('/appointment')} style={actionBtn}>+ New Appointment</button>
          </div>
        </div>
      </div>

      {/* --- GO BACK HOME --- */}
      <div style={{ maxWidth: '850px', margin: '20px auto 0 auto' }}>
        <Link to="/" style={{ textDecoration: 'none' }}>
          <button style={backButtonStyle}>
            Go Back Home
          </button>
        </Link>
      </div>
    </div>
  );
};

// --- STYLES ---
const backButtonStyle = { 
    width: '100%', 
    padding: '10px', 
    backgroundColor: '#6c757d', 
    color: 'white', 
    border: 'none', 
    borderRadius: '4px', 
    cursor: 'pointer',
    fontSize: '16px'
};

const containerStyle = { padding: '30px', backgroundColor: '#020617', minHeight: '100vh', color: '#f8fafc', boxSizing: 'border-box' };
const headerNav = { marginBottom: '15px' };
const headerFlex = { display: 'flex', justifyContent: 'space-between', alignItems: 'center' };
const controlsGroup = { display: 'flex', gap: '10px', alignItems: 'center' };
const todayBtn = { backgroundColor: '#1e293b', border: '1px solid #334155', color: '#f8fafc', padding: '6px 14px', borderRadius: '8px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' };
const stepperContainer = { display: 'flex', alignItems: 'center', backgroundColor: '#0f172a', borderRadius: '8px', border: '1px solid #334155' };
const navBtn = { backgroundColor: 'transparent', border: 'none', color: '#3b82f6', fontSize: '18px', cursor: 'pointer', padding: '4px 12px' };
const stepperDisplay = { minWidth: '80px', textAlign: 'center', fontSize: '12px', fontWeight: 'bold', borderLeft: '1px solid #334155', borderRight: '1px solid #334155', padding: '0 8px' };
const layoutGrid = { display: 'grid', gridTemplateColumns: '1.1fr 0.9fr', gap: '20px', height: '420px', maxWidth: '850px', margin: '20px auto', alignItems: 'start' };
const cardStyle = { backgroundColor: '#1e293b', borderRadius: '12px', border: '1px solid #334155', height: '100%', overflow: 'hidden' };
const monthGrid = { display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gridTemplateRows: '25px repeat(6, 38px)', gap: '6px', padding: '15px' };
const dayHeader = { textAlign: 'center', color: '#64748b', fontSize: '11px', fontWeight: 'bold' };
const dayCell = { borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', aspectRatio: '1 / 1', maxWidth: '38px', margin: '0 auto', width: '100%', fontSize: '12px' };
const dotIndicator = { position: 'absolute', bottom: '4px', width: '3px', height: '3px', backgroundColor: '#3b82f6', borderRadius: '50%' };
const agendaHeaderContainer = { padding: '15px 20px', borderBottom: '1px solid #334155', backgroundColor: '#1e293b' };
const scrollArea = { flex: 1, overflowY: 'auto', padding: '15px 20px' };
const agendaFooterContainer = { padding: '15px 20px', borderTop: '1px solid #334155', backgroundColor: '#1e293b' };
const apptCard = { display: 'flex', alignItems: 'center', padding: '8px', backgroundColor: '#0f172a', borderRadius: '8px', marginBottom: '8px', border: '1px solid #334155' };
const timeSlot = { flex: '0 0 65px', fontWeight: 'bold', color: '#3b82f6', fontSize: '11px' };
const actionBtn = { width: '100%', padding: '12px', backgroundColor: '#3b82f6', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '13px' };
const deleteIconBtn = { background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '14px', padding: '0 5px' };
const emptyState = { textAlign: 'center', color: '#64748b', marginTop: '30px', fontStyle: 'italic', fontSize: '12px' };

export default Calendar_page;