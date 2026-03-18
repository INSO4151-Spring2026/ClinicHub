import { useState } from 'react'
import { Link } from 'react-router-dom'

function Login_page() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')


const handleLogin = async () => {
  const response = await fetch('http://localhost:5000/api/login', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
    headers: { 'Content-Type': 'application/json' }
  });

  const data = await response.json();
  
  if (response.ok) {
    // Save to localStorage so the "Express Way" persists after refresh
    localStorage.setItem('token', data.token);
    localStorage.setItem('role', data.role);
    setRole(data.role); // Update your App.js state
  }
};

  return (
    <div style={{ maxWidth: '400px', margin: '50px auto', padding: '20px', border: '1px solid #ccc', borderRadius: '8px' }}>
      <h1>Login</h1>
      <form onSubmit={handleLogin}>
        <div style={{ marginBottom: '15px' }}>
          <label htmlFor="email" style={{ display: 'block', marginBottom: '5px' }}>
            Email:
          </label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
          />
        </div>
        <div style={{ marginBottom: '15px' }}>
          <label htmlFor="password" style={{ display: 'block', marginBottom: '5px' }}>
            Password:
          </label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
          />
        </div>
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

export default Login_page

// import { useState } from 'react'
// import { Link } from 'react-router-dom'

// function Login_page() {
//   const [email, setEmail] = useState('')
//   const [password, setPassword] = useState('')

//   const handleLogin = async (e) => {
//     e.preventDefault(); // Stop the page from refreshing

//     try {
//       const response = await fetch('http://localhost:5000/api/login', {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({ email, password }), 
//       });

//       const data = await response.json();
      
//       if (response.ok) {
//         // Save the "Passport" and role to browser storage
//         localStorage.setItem('token', data.token);
//         localStorage.setItem('role', data.role);
        
//         alert(`Welcome back, ${data.role}!`);
        
//         // Redirect to the home page
//         window.location.href = '/'; 
//       } else {
//         alert(data.message || "Login failed");
//       }
//     } catch (err) {
//       alert("❌ Server is offline. Make sure Node is running on port 5000.");
//     }
//   };

//   return (
//     <div style={{ maxWidth: '400px', margin: '50px auto', padding: '20px', border: '1px solid #ccc', borderRadius: '8px' }}>
//       <h1>Login</h1>
//       <form onSubmit={handleLogin}>
//         <div style={{ marginBottom: '15px' }}>
//           <label htmlFor="email" style={{ display: 'block', marginBottom: '5px' }}>
//             Email:
//           </label>
//           <input
//             type="email"
//             id="email"
//             value={email}
//             onChange={(e) => setEmail(e.target.value)}
//             required
//             style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
//           />
//         </div>
//         <div style={{ marginBottom: '15px' }}>
//           <label htmlFor="password" style={{ display: 'block', marginBottom: '5px' }}>
//             Password:
//           </label>
//           <input
//             type="password"
//             id="password"
//             value={password}
//             onChange={(e) => setPassword(e.target.value)}
//             required
//             style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
//           />
//         </div>
//         <button type="submit" style={{ width: '100%', padding: '10px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
//           Login
//         </button>
//       </form>
      
//       <Link to="/">
//         <button style={{ width: '100%', marginTop: '10px', padding: '10px', backgroundColor: '#6c757d', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
//           Go Back Home
//         </button>
//       </Link>
//     </div>
//   )
// }

// export default Login_page;