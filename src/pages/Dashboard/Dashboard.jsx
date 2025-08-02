import './Dashboard.css';

function Dashboard() {
  return (
    <div className="dashboard">
      <h1>Dashboard</h1>
      <div className="stats">
        <div className="stat-card">
          <h3>Ventas del día</h3>
          <p className="stat-number">3</p>
        </div>
        <div className="stat-card">
          <h3>Ventas del mes</h3>
          <p className="stat-number">12</p>
        </div>
        <div className="stat-card">
          <h3>Ventas del año</h3>
          <p className="stat-number">95%</p>
        </div>
      </div>
      
      <div className="recent-batches">
        <h2>Ventas recientes</h2>
        <div className="batch-list">
          <div className="batch-item">
            <div className="batch-info">
              <h4>Kombucha 1</h4>
              <p>Fecha: 3 days ago</p>
            </div>
            <div className="batch-status active">Activo</div>
          </div>
          <div className="batch-item">
            <div className="batch-info">
              <h4>Kombucha 2</h4>
              <p>Fecha: 1 week ago</p>
            </div>
            <div className="batch-status ready">Listo</div>
          </div>
          <div className="batch-item">
            <div className="batch-info">
              <h4>Kombucha 3</h4>
              <p>Fecha: 2 weeks ago</p>
            </div>
            <div className="batch-status completed">Completado</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard; 