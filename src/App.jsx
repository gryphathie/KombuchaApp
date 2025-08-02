import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom'
import './App.css'
import Dashboard from './pages/Dashboard'
import NavBar from './pages/Navbar'
import Clientes from './pages/Clientes/Clientes'
import Map from './pages/Map'

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <NavBar />
        <Routes>
          <Route path="/KombuchaApp" element={<Dashboard />} />
          <Route path="/clientes" element={<Clientes />} />
          <Route path="/rutas" element={<div className="container mt-4"><h1>Rutas Page</h1><p>Coming soon...</p></div>} />
          <Route path="/mapa" element={<Map />} />
        </Routes>
      </BrowserRouter>
    </div>
  )
}

export default App
