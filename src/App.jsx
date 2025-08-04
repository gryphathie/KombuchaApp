import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom'
import './App.css'
import Dashboard from './pages/Dashboard'
import NavBar from './pages/Navbar'
import Clientes from './pages/Clientes/Clientes'
import Map from './pages/Map'
import Kombuchas from './pages/Kombuchas/Kombuchas'
import Ventas from './pages/Ventas/Ventas'
import Ruta from './pages/Rutas'
import Recordatorios from './pages/Recordatorios'
import Login from './pages/Login'
import { AuthProvider } from './contexts/AuthContext'
import UserManagement from './components/UserManagement'

function App() {
  return (
    <AuthProvider>
      <div className="App">
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={
              <>
                <NavBar />
                <Dashboard />
              </>
            } />
            <Route path="/KombuchaApp" element={
              <>
                <NavBar />
                <Dashboard />
              </>
            } />
            <Route path="/clientes" element={
              <>
                <NavBar />
                <Clientes />
              </>
            } />
            <Route path="/kombuchas" element={
              <>
                <NavBar />
                <Kombuchas />
              </>
            } />
            <Route path="/ventas" element={
              <>
                <NavBar />
                <Ventas />
              </>
            } />
            <Route path="/rutas" element={
              <>
                <NavBar />
                <Ruta />
              </>
            } />
            <Route path="/mapa" element={
              <>
                <NavBar />
                <Map />
              </>
            } />
            <Route path="/recordatorios" element={
              <>
                <NavBar />
                <Recordatorios />
              </>
            } />
            <Route path="/KombuchaApp/recordatorios" element={
              <>
                <NavBar />
                <Recordatorios />
              </>
            } />
            <Route path="/usuarios" element={
              <>
                <NavBar />
                <UserManagement />
              </>
            } />
          </Routes>
        </BrowserRouter>
      </div>
    </AuthProvider>
  )
}

export default App
