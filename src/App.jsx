import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom'
import './App.css'
import Dashboard from './pages/Dashboard'
import NavBar from './pages/Navbar'
import Clientes from './pages/Clientes/Clientes'
import Map from './pages/Map'
import Kombuchas from './pages/Kombuchas/Kombuchas'
import Ventas from './pages/Ventas/Ventas'
import Ruta from './pages/Rutas'

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <NavBar />
        <Routes>
          <Route path="/KombuchaApp" element={<Dashboard />} />
          <Route path="/clientes" element={<Clientes />} />
          <Route path="/kombuchas" element={<Kombuchas />} />
          <Route path="/ventas" element={<Ventas />} />
          <Route path="/rutas" element={<Ruta />} />
          <Route path="/mapa" element={<Map />} />
        </Routes>
      </BrowserRouter>
    </div>
  )
}

export default App
