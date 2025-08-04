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
import ProtectedRoute from './components/ProtectedRoute'
import { AuthProvider } from './contexts/AuthContext'
import UserManagement from './components/UserManagement'
import { getEnvironmentConfig, isDevelopment } from './config/envConfig'

function App() {
  const config = getEnvironmentConfig()
  
  return (
    <AuthProvider>
      <div className="App">
        {isDevelopment() && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            background: '#ff6b6b',
            color: 'white',
            textAlign: 'center',
            padding: '5px',
            zIndex: 9999,
            fontSize: '12px'
          }}>
            🚧 DEVELOPMENT MODE - {config.title} 🚧
          </div>
        )}
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={
              <ProtectedRoute>
                <>
                  <NavBar />
                  <Dashboard />
                </>
              </ProtectedRoute>
            } />
            <Route path="/KombuchaApp" element={
              <ProtectedRoute>
                <>
                  <NavBar />
                  <Dashboard />
                </>
              </ProtectedRoute>
            } />
            <Route path="/clientes" element={
              <ProtectedRoute>
                <>
                  <NavBar />
                  <Clientes />
                </>
              </ProtectedRoute>
            } />
            <Route path="/kombuchas" element={
              <ProtectedRoute>
                <>
                  <NavBar />
                  <Kombuchas />
                </>
              </ProtectedRoute>
            } />
            <Route path="/ventas" element={
              <ProtectedRoute>
                <>
                  <NavBar />
                  <Ventas />
                </>
              </ProtectedRoute>
            } />
            <Route path="/rutas" element={
              <ProtectedRoute>
                <>
                  <NavBar />
                  <Ruta />
                </>
              </ProtectedRoute>
            } />
            <Route path="/mapa" element={
              <ProtectedRoute>
                <>
                  <NavBar />
                  <Map />
                </>
              </ProtectedRoute>
            } />
            <Route path="/recordatorios" element={
              <ProtectedRoute>
                <>
                  <NavBar />
                  <Recordatorios />
                </>
              </ProtectedRoute>
            } />
            <Route path="/KombuchaApp/recordatorios" element={
              <ProtectedRoute>
                <>
                  <NavBar />
                  <Recordatorios />
                </>
              </ProtectedRoute>
            } />
            <Route path="/usuarios" element={
              <ProtectedRoute>
                <>
                  <NavBar />
                  <UserManagement />
                </>
              </ProtectedRoute>
            } />
          </Routes>
        </BrowserRouter>
      </div>
    </AuthProvider>
  )
}

export default App
