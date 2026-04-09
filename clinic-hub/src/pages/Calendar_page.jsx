import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const Calendar_page = () => {
  const [selectedDay, setSelectedDay] = useState(13);
  const [monthIndex, setMonthIndex] = useState(3); // April
  const currentYear = 2026;

  const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Mock Data
  const appointments = [
    { id: 1, month: 3, day: 12, time: "09:00 AM", patient: "John Doe", type: "Checkup" },
    { id: 2, month: 3, day: 13, time: "08:30 AM", patient: "Jane Smith", type: "Follow-up" },
    { id: 3, month: 3, day: 13, time: "09:15 AM", patient: "Bob Johnson", type: "X-Ray" },
    { id: 4, month: 3, day: 13, time: "10:00 AM", patient: "Alice Wong", type: "Consult" },
    { id: 5, month: 3, day: 13, time: "11:00 AM", patient: "Charlie Brown", type: "Dental" },
    { id: 6, month: 3, day: 13, time: "01:00 PM", patient: "David Miller", type: "Checkup" },
    { id: 7, month: 3, day: 13, time: "02:00 PM", patient: "Elena Rodriguez", type: "Vitals" },
    { id: 8, month: 3, day: 13, time: "03:30 PM", patient: "Frank Wright", type: "Follow-up" },
    { id: 9, month: 3, day: 13, time: "04:15 PM", patient: "Grace Lee", type: "Consult" },
  ];

  const daysInMonth = new Date(currentYear, monthIndex + 1, 0).getDate();
  const firstDayOfWeek = new Date(currentYear, monthIndex, 1).getDay();

  // Always generate 42 cells (6 rows) to keep height perfectly consistent
  const calendarVisualGrid = [];
  for (let i = 0; i < firstDayOfWeek; i++) calendarVisualGrid.push(null);
  for (let i = 1; i <= daysInMonth; i++) calendarVisualGrid.push(i);
  while (calendarVisualGrid.length < 42) calendarVisualGrid.push(null);

  return (
    <div style={containerStyle}>
      <div style={headerNav}>
        <Link to="/" style={backLink}>← Dashboard</Link>
        <div style={headerFlex}>
          <h2 style={{ margin: 0 }}>Clinic Schedule</h2>
          <div style={monthStepper}>
            <button onClick={() => setMonthIndex(p => p === 0 ? 11 : p - 1)} style={navBtn}>‹</button>
            <span style={monthDisplay}>{months[monthIndex]}</span>
            <button onClick={() => setMonthIndex(p => p === 11 ? 0 : p + 1)} style={navBtn}>›</button>
          </div>
        </div>
      </div>

      <div style={layoutGrid}>
        {/* CALENDAR SIDE */}
        <div style={cardStyle}>
          <div style={monthGrid}>
            {dayNames.map(day => <div key={day} style={dayHeader}>{day}</div>)}
            {calendarVisualGrid.map((dayNum, i) => {
              const isSelected = selectedDay === dayNum;
              const hasAppt = dayNum && appointments.some(a => a.day === dayNum && a.month === monthIndex);
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

        {/* AGENDA SIDE */}
        <div style={{ ...cardStyle, display: 'grid', gridTemplateRows: 'auto 1fr auto' }}>
          <h3 style={agendaHeader}>Agenda: {months[monthIndex]} {selectedDay}</h3>
          
          <div style={apptListScrollable}>
            {appointments.filter(a => a.day === selectedDay && a.month === monthIndex).length > 0 ? (
              appointments.filter(a => a.day === selectedDay && a.month === monthIndex).map(appt => (
                <div key={appt.id} style={apptCard}>
                  <div style={timeSlot}>{appt.time}</div>
                  <div style={{ flex: 1, fontSize: '14px' }}>
                    <div style={{ fontWeight: '600' }}>{appt.patient}</div>
                    <div style={{ fontSize: '12px', color: '#94a3b8' }}>{appt.type}</div>
                  </div>
                </div>
              ))
            ) : (
              <div style={emptyState}>No appointments.</div>
            )}
          </div>

          <button style={actionBtn}>+ New Appointment</button>
        </div>
      </div>
    </div>
  );
};

// --- STYLES ---
const containerStyle = { padding: '40px', backgroundColor: '#020617', minHeight: '100vh', color: '#f8fafc' };
const headerNav = { marginBottom: '20px' };
const headerFlex = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px' };
const backLink = { textDecoration: 'none', color: '#3b82f6', fontSize: '14px' };

const layoutGrid = { 
  display: 'grid', 
  gridTemplateColumns: '1.2fr 1fr', 
  gap: '24px', 
  height: '500px', // HARD HEIGHT LOCK
  alignItems: 'stretch' 
};

const cardStyle = { 
  backgroundColor: '#1e293b', 
  padding: '20px', 
  borderRadius: '16px', 
  border: '1px solid #334155',
  boxSizing: 'border-box',
  overflow: 'hidden'
};

const monthGrid = { 
  display: 'grid', 
  gridTemplateColumns: 'repeat(7, 1fr)', 
  gridTemplateRows: 'auto repeat(6, 1fr)', // FORCES 6 ROWS REGARDLESS OF MONTH
  gap: '8px', 
  height: '100%' 
};

const dayHeader = { textAlign: 'center', color: '#64748b', fontSize: '12px', paddingBottom: '5px' };
const dayCell = { borderRadius: '8px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', position: 'relative' };
const dotIndicator = { position: 'absolute', bottom: '6px', width: '5px', height: '5px', backgroundColor: '#3b82f6', borderRadius: '50%' };

const agendaHeader = { borderBottom: '1px solid #334155', paddingBottom: '15px', margin: 0 };

const apptListScrollable = { 
  overflowY: 'auto', 
  marginTop: '15px',
  paddingRight: '8px',
  scrollbarGutter: 'stable' 
};

const apptCard = { display: 'flex', alignItems: 'center', padding: '12px', backgroundColor: '#0f172a', borderRadius: '10px', marginBottom: '10px', border: '1px solid #334155' };
const timeSlot = { flex: '0 0 80px', fontWeight: 'bold', color: '#3b82f6', fontSize: '13px' };
const actionBtn = { width: '100%', padding: '12px', backgroundColor: '#3b82f6', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', marginTop: '10px', cursor: 'pointer' };

const monthStepper = { display: 'flex', alignItems: 'center', backgroundColor: '#0f172a', borderRadius: '10px', border: '1px solid #334155' };
const navBtn = { backgroundColor: 'transparent', border: 'none', color: '#3b82f6', fontSize: '20px', cursor: 'pointer', padding: '5px 15px' };
const monthDisplay = { minWidth: '100px', textAlign: 'center', fontSize: '14px', fontWeight: 'bold' };
const emptyState = { textAlign: 'center', color: '#64748b', marginTop: '60px', fontStyle: 'italic' };

export default Calendar_page;