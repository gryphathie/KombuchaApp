import { Link } from 'react-router-dom';
import './Header.css';

function Header() {
  return (
    <header className="header">
      <div className="header-content">
        <Link to="/" className="logo">
          <h1>🍵 Kombucha App</h1>
        </Link>
        <nav className="nav">
          <Link to="/" className="nav-link">Home</Link>
          <Link to="/dashboard" className="nav-link">Dashboard</Link>
          <Link to="/brewing" className="nav-link">Brewing</Link>
        </nav>
      </div>
    </header>
  );
}

export default Header; 