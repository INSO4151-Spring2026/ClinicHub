import { useState } from 'react'
import { Routes, Route, Link } from 'react-router-dom'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import Login_page from './Login_page'
import Create_patient from './Create_patient'

function App() {
  const [count, setCount] = useState(0)

  return (
    <Routes>
      <Route path="/" element={
        <>
          <div>
            <a href="https://vite.dev" target="_blank">
              <img src={viteLogo} className="logo" alt="Vite logo" />
            </a>
            <a href="https://react.dev" target="_blank">
              <img src={reactLogo} className="logo react" alt="React logo" />
            </a>
          </div>
          <h1>Vite + React</h1>
          <div className="card">
            <button onClick={() => setCount((count) => count + 1)}>
              count is {count}
            </button>
            <p>
              Edit <code>src/App.jsx</code> and save to test HMR
            </p>
          </div>
          <Link to="/login">
            <button>Login Page</button>
          </Link>
          <Link to="/create-patient">
            <button>Create Patient</button>
          </Link>
        </>
      } />
      <Route path="/login" element={<Login_page />} />
      <Route path="/create-patient" element={<Create_patient />} />
    </Routes>
  )
}

export default App
