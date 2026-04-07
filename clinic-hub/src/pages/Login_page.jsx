import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom' 

function Login_page({ setRole }) { 
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const navigate = useNavigate(); 

  const handleLogin = async (e) => {
    e.preventDefault(); 

    try {
      const response = await fetch('http://localhost:5000/api/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }), 
        headers: { 'Content-Type': 'application/json' }
      });

      const data = await response.json();
      
      if (response.ok) {
        // Save to localStorage
        localStorage.setItem('token', data.token);
        localStorage.setItem('role', data.role);
        
        // FIX 3: Update state and redirect
        if (setRole) setRole(data.role); 
        alert(`Logged in as ${data.role}`);
        navigate('/'); 
      } else {
        alert(data.message || "Login failed");
      }
    } catch (err) {
      alert("❌ Connection error. Is the server running?");
    }
  };

  return (
    <div style={{ maxWidth: '400px', margin: '50px auto', padding: '20px', border: '1px solid #ccc', borderRadius: '8px' }}>
      <h1>Login</h1>
      <form onSubmit={handleLogin}>
        {/* Email div */}
        <div style={{ marginBottom: '15px' }}>
          <label htmlFor="email" style={{ display: 'block', marginBottom: '5px' }}>Email:</label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
          />
        </div>
        {/* Password div */}
        <div style={{ marginBottom: '15px' }}>
          <label htmlFor="password" style={{ display: 'block', marginBottom: '5px' }}>Password:</label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
          />
        </div>
        {/* Submit button and go back */}
        <button type="submit" style={{ width: '100%', padding: '10px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
          Login
        </button>
      </form>
      <Link to="/">
        <button style={{ width: '100%', marginTop: '10px', padding: '10px', backgroundColor: '#6c757d', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
          Go Back Home
        </button>
      </Link>
    </div>
  )
}

export default Login_page;