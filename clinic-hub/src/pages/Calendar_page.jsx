import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const Calendar_page = () => {
  const today = new Date();
  const [selectedDay, setSelectedDay] = useState(today.getDate());
  const [monthIndex, setMonthIndex] = useState(today.getMonth());
  const [year, setYear] = useState(today.getFullYear());

  const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Mock data - In ClinicHub
  const appointments = [
    { id: 1, month: 3, day: 12, year: 2026, time: "09:00 AM", patient: "John Doe", type: "Checkup" },
    { id: 2, month: 3, day: 13, year: 2026, time: "08:30 AM", patient: "Jane Smith", type: "Follow-up" },
    { id: 3, month: 3, day: 13, year: 2026, time: "09:15 AM", patient: "Bob Johnson", type: "X-Ray" },
    { id: 4, month: 3, day: 13, year: 2026, time: "10:00 AM", patient: "Alice Wong", type: "Consult" },
    { id: 5, month: 3, day: 13, year: 2026, time: "11:00 AM", patient: "Charlie Brown", type: "Dental" },
    { id: 6, month: 3, day: 13, year: 2026, time: "01:00 PM", patient: "David Miller", type: "Checkup" },
  ];

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

  const selectedAppts = appointments.filter(a => a.day === selectedDay && a.month === monthIndex && a.year === year);

  return (
    <div style={containerStyle}>
      <div style={headerNav}>
        <Link to="/" style={backLink}>← Dashboard</Link>
        <div style={headerFlex}>
          <h2 style={{ margin: 0 }}>Clinic Schedule</h2>
          
          <div style={controlsGroup}>
            <button onClick={handleToday} style={todayBtn}>Today</button>

            {/* Month*/}
            <div style={stepperContainer}>
              <button onClick={() => setMonthIndex(p => p === 0 ? 11 : p - 1)} style={navBtn}>‹</button>
              <span style={stepperDisplay}>{months[monthIndex]}</span>
              <button onClick={() => setMonthIndex(p => p === 11 ? 0 : p + 1)} style={navBtn}>›</button>
            </div>

            {/* Year */}
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

        <div style={{ ...cardStyle, position: 'relative' }}>
          <div style={agendaHeaderContainer}>
            <h3 style={{ margin: 0, fontSize: '15px' }}>
              {months[monthIndex]} {selectedDay}, {year}
            </h3>
          </div>
          
          <div style={absoluteScrollArea}>
            {selectedAppts.length > 0 ? (
              selectedAppts.map(appt => (
                <div key={appt.id} style={apptCard}>
                  <div style={timeSlot}>{appt.time}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: '600', fontSize: '13px' }}>{appt.patient}</div>
                    <div style={{ fontSize: '11px', color: '#94a3b8' }}>{appt.type}</div>
                  </div>
                </div>
              ))
            ) : (
              <div style={emptyState}>No appointments</div>
            )}
          </div>

          <div style={agendaFooterContainer}>
            <button style={actionBtn}>+ New Appointment</button>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- STYLES ---
const containerStyle = { padding: '30px', backgroundColor: '#020617', minHeight: '100vh', color: '#f8fafc', boxSizing: 'border-box' };
const headerNav = { marginBottom: '15px' };
const headerFlex = { display: 'flex', justifyContent: 'space-between', alignItems: 'center' };
const backLink = { textDecoration: 'none', color: '#3b82f6', fontSize: '13px' };

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

const agendaHeaderContainer = { padding: '15px 20px', borderBottom: '1px solid #334155', position: 'absolute', top: 0, left: 0, right: 0, height: '50px', boxSizing: 'border-box', backgroundColor: '#1e293b', zIndex: 2 };
const absoluteScrollArea = { position: 'absolute', top: '50px', bottom: '65px', left: 0, right: 0, overflowY: 'auto', padding: '15px 20px' };
const agendaFooterContainer = { position: 'absolute', bottom: 0, left: 0, right: 0, height: '65px', padding: '12px 20px', borderTop: '1px solid #334155', backgroundColor: '#1e293b', zIndex: 2 };

const apptCard = { display: 'flex', alignItems: 'center', padding: '8px', backgroundColor: '#0f172a', borderRadius: '8px', marginBottom: '8px', border: '1px solid #334155' };
const timeSlot = { flex: '0 0 65px', fontWeight: 'bold', color: '#3b82f6', fontSize: '11px' };
const actionBtn = { width: '100%', padding: '10px', backgroundColor: '#3b82f6', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontSize: '12px' };
const emptyState = { textAlign: 'center', color: '#64748b', marginTop: '30px', fontStyle: 'italic', fontSize: '12px' };

export default Calendar_page;