import React, { useState, useEffect } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../../firebase';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import './Login.css';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();

  // Redirect if user is already authenticated
  useEffect(() => {
    if (!authLoading && user) {
      navigate('/KombuchaApp');
    }
  }, [user, authLoading, navigate]);

  // Show loading while checking authentication
  if (authLoading) {
    return (
      <div className="login-container">
        <div className="login-card">
          <div className="login-header">
            <h1>Kombucha App</h1>
            <p>Cargando...</p>
          </div>
        </div>
      </div>
    );
  }

  // Don't show login form if user is already authenticated
  if (user) {
    return null;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate('/KombuchaApp');
    } catch (error) {
      console.error('Login error:', error);
      switch (error.code) {
        case 'auth/user-not-found':
          setError('Usuario no encontrado. Contacte al administrador.');
          break;
        case 'auth/wrong-password':
          setError('Contraseña incorrecta.');
          break;
        case 'auth/invalid-email':
          setError('Email inválido.');
          break;
        case 'auth/too-many-requests':
          setError('Demasiados intentos fallidos. Intente más tarde.');
          break;
        default:
          setError('Error al iniciar sesión. Intente nuevamente.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <h1>Kombucha App</h1>
          <p>Iniciar Sesión</p>
        </div>
        
        <form onSubmit={handleSubmit} className="login-form">
          {error && <div className="error-message">{error}</div>}
          
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
              placeholder="Ingrese su email"
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="password">Contraseña</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
              placeholder="Ingrese su contraseña"
            />
          </div>
          
          <button 
            type="submit" 
            className="login-button"
            disabled={loading}
          >
            {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
          </button>
        </form>
        
        <div className="login-footer">
          <p>Esta es una aplicación privada. Solo usuarios autorizados pueden acceder.</p>
          <p>Para solicitar acceso, contacte al administrador.</p>
        </div>
      </div>
    </div>
  );
};

export default Login; 