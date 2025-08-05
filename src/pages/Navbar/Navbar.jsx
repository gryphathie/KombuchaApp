import Container from 'react-bootstrap/Container';
import Nav from 'react-bootstrap/Nav';
import Navbar from 'react-bootstrap/Navbar';
import Button from 'react-bootstrap/Button';
import "bootstrap/dist/css/bootstrap.min.css";
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useState } from 'react';
import './Navbar.css';

function NavBar() {
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState(false);

  const handleLogout = async () => {
    try {
      // Collapse navbar before logout
      setExpanded(false);
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  // Function to handle navigation link clicks
  const handleNavLinkClick = () => {
    // Collapse the navbar on mobile when a link is clicked
    setExpanded(false);
  };

  return (
    <Navbar 
      expand="lg" 
      className="bg-body-tertiary"
      expanded={expanded}
      onToggle={(expanded) => setExpanded(expanded)}
    >
      <Container fluid>
        <Navbar.Brand as={NavLink} to="/" onClick={handleNavLinkClick}>
          Kombucha App
        </Navbar.Brand>
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="me-auto">
            <Nav.Link as={NavLink} to="/" onClick={handleNavLinkClick}>
              Dashboard
            </Nav.Link>
            <Nav.Link as={NavLink} to="/clientes" onClick={handleNavLinkClick}>
              Clientes
            </Nav.Link>
            <Nav.Link as={NavLink} to="/kombuchas" onClick={handleNavLinkClick}>
              Kombuchas
            </Nav.Link>
            <Nav.Link as={NavLink} to="/ventas" onClick={handleNavLinkClick}>
              Ventas
            </Nav.Link>
            <Nav.Link as={NavLink} to="/rutas" onClick={handleNavLinkClick}>
              Rutas
            </Nav.Link>
            <Nav.Link as={NavLink} to="/mapa" onClick={handleNavLinkClick}>
              Mapa
            </Nav.Link>
            <Nav.Link as={NavLink} to="/recordatorios" onClick={handleNavLinkClick}>
              Recordatorios
            </Nav.Link>
            {/* <Nav.Link as={NavLink} to="/usuarios" onClick={handleNavLinkClick}>
              Usuarios
            </Nav.Link> */}
          </Nav>
          <Nav className="ms-auto">
            <Nav.Item className="d-flex align-items-center me-3">
              <small className="text-white">
                {user?.email ? user.email.split('@')[0] : ''}
              </small>
            </Nav.Item>
            <Nav.Item>
              <Button 
                variant="danger" 
                size="sm"
                onClick={handleLogout}
              >
                Cerrar Sesión
              </Button>
            </Nav.Item>
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
}

export default NavBar;