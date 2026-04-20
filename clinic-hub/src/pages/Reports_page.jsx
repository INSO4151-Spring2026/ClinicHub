import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom'; 

const Reports_page = () => {
  const navigate = useNavigate();
  
  const [selectedDate, setSelectedDate] = useState('');
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchReport = async (e) => {
    e.preventDefault();
    
    if (loading || !selectedDate) return;

    const token = localStorage.getItem('token');
    setLoading(true);

    try {
      const response = await fetch(`http://localhost:5000/api/reports/daily-revenue?date=${selectedDate}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        }
      });

      const result = await response.json();

      if (response.ok) {
        setReportData(result);
      } else if (response.status === 403) {
        alert("🚫 Access Denied: Admin role required.");
      } else {
        alert("⚠️ Error: Could not fetch report data.");
      }
    } catch (err) {
      console.error("Connection error:", err);
      alert("❌ Connection Failed: Is your Node server running on port 5000?");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '500px', margin: '40px auto', padding: '20px', border: '1px solid #ddd', borderRadius: '8px', fontFamily: 'sans-serif' }}>
      <h2 style={{ textAlign: 'center' }}>Financial Revenue Report</h2>
      
      <form onSubmit={fetchReport} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        <label style={{ fontWeight: 'bold' }}>
          Transaction Date:
          <input 
            type="date" 
            value={selectedDate} 
            onChange={(e) => setSelectedDate(e.target.value)} 
            required 
            style={inputStyle} 
          />
        </label>

        <button 
          type="submit" 
          disabled={loading} 
          style={generateButtonStyle}
        >
          {loading ? 'Processing...' : 'Generate Report'}
        </button>
      </form>

      {/* Results Section - styled as a simple summary */}
      {reportData && (
        <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '4px', border: '1px solid #eee' }}>
          <h3 style={{ marginTop: 0, fontSize: '18px' }}>Summary for {reportData.date}</h3>
          <p><strong>Transactions:</strong> {reportData.transaction_count}</p>
          <p><strong>Subtotal:</strong> ${reportData.data.subtotal.toFixed(2)}</p>
          <p><strong>Tax:</strong> ${reportData.data.tax.toFixed(2)}</p>
          <p style={{ fontSize: '18px', color: '#28a745', marginBottom: 0 }}>
            <strong>Total Revenue: ${reportData.data.total_revenue.toFixed(2)}</strong>
          </p>
        </div>
      )}

      {/* Go Back Home */}
      <Link to="/" style={{ textDecoration: 'none' }}>
        <button style={backButtonStyle}>
          Go Back Home
        </button>
      </Link>
    </div>
  );
};

// Standardized styles
const inputStyle = { 
  width: '100%', 
  padding: '8px', 
  marginTop: '5px', 
  borderRadius: '4px', 
  border: '1px solid #ccc', 
  boxSizing: 'border-box' 
};

const generateButtonStyle = { 
  backgroundColor: '#28a745', 
  color: 'white', 
  padding: '10px', 
  border: 'none', 
  borderRadius: '4px', 
  cursor: 'pointer', 
  fontSize: '16px',
  fontWeight: 'bold',
  width: '100%'
};

const backButtonStyle = { 
  display: 'block', 
  width: '100%', 
  marginTop: '10px', 
  padding: '10px', 
  backgroundColor: '#6c757d', 
  color: 'white', 
  border: 'none', 
  borderRadius: '4px', 
  cursor: 'pointer',
  fontSize: '16px',
  textAlign: 'center'
};

export default Reports_page;