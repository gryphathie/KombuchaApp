import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

export const useGitHubPagesRouting = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    // Handle GitHub Pages redirects
    const handleRedirect = () => {
      // Check if we're on GitHub Pages and need to handle redirects
      if (window.location.search.includes('?/')) {
        const path = window.location.search.replace('?/', '');
        const cleanPath = path.split('&')[0].replace(/~and~/g, '&');
        
        // Navigate to the correct route
        navigate(cleanPath, { replace: true });
      }
    };

    // Check if current path is valid
    const validRoutes = [
      '/',
      '/login',
      '/clientes',
      '/kombuchas',
      '/ventas',
      '/rutas',
      '/mapa',
      '/recordatorios',
      '/usuarios'
    ];

    const currentPath = location.pathname;
    
    // If the current path is not valid, redirect to home
    if (!validRoutes.includes(currentPath)) {
      navigate('/', { replace: true });
    }

    // Handle initial redirect
    handleRedirect();
  }, [location.pathname, navigate]);

  return location;
}; 