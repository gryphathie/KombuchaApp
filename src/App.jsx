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

// Component to handle routing logic
function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={
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
      <Route path="/usuarios" element={
        <>
          <NavBar />
          <UserManagement />
        </>
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
