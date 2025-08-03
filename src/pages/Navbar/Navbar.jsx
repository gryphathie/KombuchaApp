import Container from 'react-bootstrap/Container';
import Nav from 'react-bootstrap/Nav';
import Navbar from 'react-bootstrap/Navbar';
import "bootstrap/dist/css/bootstrap.min.css";
import { NavLink } from 'react-router-dom';
import './Navbar.css';

function NavBar() {
  return (
    <Navbar expand="lg" className="bg-body-tertiary">
      <Container fluid>
        <Navbar.Brand as={NavLink} to="/KombuchaApp">Kombucha App</Navbar.Brand>
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="me-auto">
            <Nav.Link as={NavLink} to="/KombuchaApp">Dashboard</Nav.Link>
            <Nav.Link as={NavLink} to="/clientes">Clientes</Nav.Link>
            <Nav.Link as={NavLink} to="/kombuchas">Kombuchas</Nav.Link>
            <Nav.Link as={NavLink} to="/ventas">Ventas</Nav.Link>
            <Nav.Link as={NavLink} to="/rutas">Rutas</Nav.Link>
            <Nav.Link as={NavLink} to="/mapa">Mapa</Nav.Link>
            <Nav.Link as={NavLink} to="/recordatorios">Recordatorios</Nav.Link>
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
}

export default NavBar;