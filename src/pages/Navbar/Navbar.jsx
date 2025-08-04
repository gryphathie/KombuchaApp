import Container from 'react-bootstrap/Container';
import Nav from 'react-bootstrap/Nav';
import Navbar from 'react-bootstrap/Navbar';
import Button from 'react-bootstrap/Button';
import "bootstrap/dist/css/bootstrap.min.css";
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import './Navbar.css';

function NavBar() {
  const { logout, user } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  return (
    <Navbar expand="lg" className="bg-body-tertiary">
      <Container fluid>
        <Navbar.Brand as={NavLink} to="/">Kombucha App</Navbar.Brand>
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="me-auto">
            <Nav.Link as={NavLink} to="/">Dashboard</Nav.Link>
            <Nav.Link as={NavLink} to="/clientes">Clientes</Nav.Link>
            <Nav.Link as={NavLink} to="/kombuchas">Kombuchas</Nav.Link>
            <Nav.Link as={NavLink} to="/ventas">Ventas</Nav.Link>
            <Nav.Link as={NavLink} to="/rutas">Rutas</Nav.Link>
            <Nav.Link as={NavLink} to="/mapa">Mapa</Nav.Link>
            <Nav.Link as={NavLink} to="/recordatorios">Recordatorios</Nav.Link>
            <Nav.Link as={NavLink} to="/usuarios">Usuarios</Nav.Link>
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