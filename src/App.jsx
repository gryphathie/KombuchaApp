import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
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
import ProtectedRoute from './components/ProtectedRoute'

// Component to handle routing logic
function AppRoutes() {
  return (
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
      <Route path="/usuarios" element={
        <ProtectedRoute>
          <>
            <NavBar />
            <UserManagement />
          </>
        </ProtectedRoute>
      } />
      {/* Catch all route - redirect to main page for any unknown routes */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <div className="App">
        <BrowserRouter basename="/KombuchaApp">
          <AppRoutes />
        </BrowserRouter>
      </div>
    </AuthProvider>
  )
}

export default App
