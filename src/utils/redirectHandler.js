// Utility to handle GitHub Pages redirects and routing
export const handleGitHubPagesRedirect = () => {
  // Check if we're on GitHub Pages and need to handle redirects
  if (window.location.search.includes('?/')) {
    const path = window.location.search.replace('?/', '');
    const cleanPath = path.split('&')[0].replace(/~and~/g, '&');
    
    // Remove the query parameter and update the URL
    const newUrl = window.location.pathname + cleanPath + window.location.hash;
    window.history.replaceState(null, null, newUrl);
  }
};

// Function to check if current path is valid
export const isValidRoute = (pathname) => {
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
  
  return validRoutes.includes(pathname);
};

// Function to redirect to main page if route is invalid
export const redirectToMain = () => {
  window.location.href = '/KombuchaApp/KombuchaApp/';
}; 