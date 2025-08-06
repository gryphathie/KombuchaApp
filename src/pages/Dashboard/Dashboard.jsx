import React, { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../firebase';
import { getMexicoDate, getMexicoMonth, formatDateForDisplay, getRelativeDate, formatRelativeDate } from '../../utils/dateUtils';
import { generateCustomerNotifications, getNotificationStats, formatNotificationMessage } from '../../utils/notificationUtils';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import { useNavigate } from 'react-router-dom';
import NotificationBell from '../../components/NotificationBell';
import './Dashboard.css';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

function Dashboard() {
  const navigate = useNavigate();
  const [salesStats, setSalesStats] = useState({
    dailySales: 0,
    monthlySales: 0,
    monthlyKombuchasSold: 0,
    dailyRevenue: 0,
    monthlyRevenue: 0,
    monthlyCost: 0
  });
  const [loading, setLoading] = useState(true);
  const [recentSales, setRecentSales] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [kombuchas, setKombuchas] = useState([]);
  const [chartData, setChartData] = useState({
    salesTrend: {},
    topProducts: {},
    revenueGrowth: {},
    salesStatus: {}
  });
  const [notifications, setNotifications] = useState([]);
  const [notificationStats, setNotificationStats] = useState({});

  // Fetch sales data from Firebase
  const fetchSalesData = async () => {
    try {
      setLoading(true);
      
      // Fetch sales data
      const salesSnapshot = await getDocs(collection(db, 'ventas'));
      const salesData = salesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Fetch clientes data
      const clientesSnapshot = await getDocs(collection(db, 'clientes'));
      const clientesData = clientesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setClientes(clientesData);

      // Fetch kombuchas data
      const kombuchasSnapshot = await getDocs(collection(db, 'kombuchas'));
      const kombuchasData = kombuchasSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setKombuchas(kombuchasData);

      // Get current date and month in Mexico timezone
      const today = getMexicoDate(); // YYYY-MM-DD
      const currentMonth = getMexicoMonth(); // YYYY-MM

      // Calculate daily sales
      const dailySales = salesData.filter(sale => sale.fecha === today);
      const dailyRevenue = dailySales.reduce((sum, sale) => sum + (parseFloat(sale.total) || 0), 0);

      // Calculate monthly sales
      const monthlySales = salesData.filter(sale => {
        const saleMonth = sale.fecha ? sale.fecha.slice(0, 7) : '';
        return saleMonth === currentMonth;
      });
      const monthlyRevenue = monthlySales.reduce((sum, sale) => sum + (parseFloat(sale.total) || 0), 0);

      // Calculate monthly kombuchas sold and cost
      let monthlyKombuchasSold = 0;
      let monthlyCost = 0;
      
      monthlySales.forEach(sale => {
        if (sale.items && Array.isArray(sale.items)) {
          sale.items.forEach(item => {
            const cantidad = parseInt(item.cantidad) || 0;
            monthlyKombuchasSold += cantidad;
            
            // Find the kombucha to get its unit cost
            const kombucha = kombuchasData.find(k => k.id === item.kombuchaId);
            if (kombucha && kombucha.costoUnitario) {
              monthlyCost += cantidad * parseFloat(kombucha.costoUnitario);
            }
          });
        } else if (sale.cantidad) {
          // Fallback for old format
          const cantidad = parseInt(sale.cantidad) || 0;
          monthlyKombuchasSold += cantidad;
          
          // Find the kombucha to get its unit cost
          const kombucha = kombuchasData.find(k => k.id === sale.kombucha);
          if (kombucha && kombucha.costoUnitario) {
            monthlyCost += cantidad * parseFloat(kombucha.costoUnitario);
          }
        }
      });

      // Calculate monthly earnings
      const monthlyEarnings = monthlyRevenue - monthlyCost;

      // Get recent sales (last 5)
      const sortedSales = salesData.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
      const recentSalesData = sortedSales.slice(0, 5);

      // Prepare chart data
      const chartData = prepareChartData(salesData, kombuchasData);

      // Generate notifications
      const allNotifications = generateCustomerNotifications(salesData, clientesData);
      const stats = getNotificationStats(allNotifications);
      
      // Get top 3 pending notifications for dashboard
      const topNotifications = allNotifications
        .filter(n => n.status === 'pending')
        .slice(0, 3);

      setSalesStats({
        dailySales: dailySales.length,
        monthlySales: monthlySales.length,
        monthlyKombuchasSold,
        dailyRevenue,
        monthlyRevenue,
        monthlyCost,
        monthlyEarnings
      });
      setRecentSales(recentSalesData);
      setChartData(chartData);
      setNotifications(topNotifications);
      setNotificationStats(stats);
    } catch (error) {
      console.error('Error fetching sales data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Prepare data for charts
  const prepareChartData = (salesData, kombuchasData) => {
    // 1. Sales Trend (Last 30 days)
    const last30Days = [];
    const salesByDay = {};
    
    for (let i = 29; i >= 0; i--) {
      const dateStr = getRelativeDate(-i);
      last30Days.push(dateStr);
      salesByDay[dateStr] = 0;
    }

    salesData.forEach(sale => {
      if (salesByDay.hasOwnProperty(sale.fecha)) {
        salesByDay[sale.fecha]++;
      }
    });

    // 2. Top Products
    const productSales = {};
    salesData.forEach(sale => {
      if (sale.items && Array.isArray(sale.items)) {
        sale.items.forEach(item => {
          const kombucha = kombuchasData.find(k => k.id === item.kombuchaId);
          const name = kombucha ? kombucha.nombre : 'Producto desconocido';
          productSales[name] = (productSales[name] || 0) + parseInt(item.cantidad || 0);
        });
      } else if (sale.kombucha) {
        // Fallback for old format
        const kombucha = kombuchasData.find(k => k.id === sale.kombucha);
        const name = kombucha ? kombucha.nombre : 'Producto desconocido';
        productSales[name] = (productSales[name] || 0) + parseInt(sale.cantidad || 0);
      }
    });

    const topProducts = Object.entries(productSales)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5);

    // 3. Revenue Growth (Cumulative)
    const sortedSales = salesData.sort((a, b) => new Date(a.fecha) - new Date(b.fecha));
    const cumulativeRevenue = [];
    let cumulative = 0;
    
    sortedSales.forEach(sale => {
      cumulative += parseFloat(sale.total || 0);
      cumulativeRevenue.push(cumulative);
    });

    // 4. Sales Status
    const statusCount = {};
    salesData.forEach(sale => {
      const status = sale.estado || 'pendiente';
      statusCount[status] = (statusCount[status] || 0) + 1;
    });

    return {
      salesTrend: {
        labels: last30Days.map(date => formatDateForDisplay(date)),
        datasets: [{
          label: 'Ventas',
          data: last30Days.map(date => salesByDay[date]),
          borderColor: '#667eea',
          backgroundColor: 'rgba(102, 126, 234, 0.1)',
          tension: 0.4,
          fill: true
        }]
      },
      topProducts: {
        labels: topProducts.map(([name]) => name),
        datasets: [{
          label: 'Cantidad Vendida',
          data: topProducts.map(([, quantity]) => quantity),
          backgroundColor: [
            '#667eea',
            '#764ba2',
            '#f093fb',
            '#f5576c',
            '#4facfe'
          ],
          borderRadius: 8
        }]
      },
      revenueGrowth: {
        labels: sortedSales.map((_, index) => `Venta ${index + 1}`),
        datasets: [{
          label: 'Ingresos Acumulados',
          data: cumulativeRevenue,
          borderColor: '#38a169',
          backgroundColor: 'rgba(56, 161, 105, 0.1)',
          fill: true,
          tension: 0.4
        }]
      },
      salesStatus: {
        labels: Object.keys(statusCount).map(status => 
          status === 'completada' ? 'Completadas' : 'Pendientes'
        ),
        datasets: [{
          data: Object.values(statusCount),
          backgroundColor: [
            '#38a169',
            '#d69e2e'
          ],
          borderWidth: 0
        }]
      }
    };
  };

  useEffect(() => {
    fetchSalesData();
  }, []);

  // Helper function to get client name by ID
  const getClientName = (clientId) => {
    const client = clientes.find(c => c.id === clientId);
    return client ? client.nombre : 'Cliente no encontrado';
  };

  // Helper function to format date
  const formatDate = (dateString) => {
    return formatRelativeDate(dateString);
  };

  // Handle notification click
  const handleNotificationClick = (notification) => {
    if (notification.type === 'view-all') {
      // Navigate to notifications page
      navigate('/recordatorios');
    } else {
      // Navigate to notifications page with specific notification
      navigate('/recordatorios');
    }
  };

  if (loading) {
    return (
      <div className="dashboard">
        <div className="loading">Cargando dashboard...</div>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>Dashboard</h1>
        <NotificationBell onNotificationClick={handleNotificationClick} />
      </div>
      <div className="stats">
        <div className="stat-card">
          <h3>Ventas del día</h3>
          <p className="stat-number">{salesStats.dailySales}</p>
          <p className="stat-subtitle">${salesStats.dailyRevenue.toFixed(2)}</p>
        </div>
        <div className="stat-card">
          <h3>Ventas del mes</h3>
          <p className="stat-number">{salesStats.monthlySales}</p>
          <p className="stat-subtitle">${salesStats.monthlyRevenue.toFixed(2)}</p>
          <p className="stat-subtitle">Ganancia: ${salesStats.monthlyEarnings.toFixed(2)}</p>
        </div>
        <div className="stat-card">
          <h3>Kombuchas vendidas</h3>
          <p className="stat-number">{salesStats.monthlyKombuchasSold}</p>
          <p className="stat-subtitle">Este mes</p>
        </div>
        <div className="stat-card notification-stat">
          <h3>Recordatorios</h3>
          <p className="stat-number">{notificationStats.pending}</p>
          <p className="stat-subtitle">
            {notificationStats.overdue > 0 ? `${notificationStats.overdue} vencidos` : 'Al día'}
          </p>
        </div>
      </div>

      {/* Charts Section */}
      <div className="charts-section">
        <div className="chart-row">
          <div className="chart-card">
            <h3>Tendencia de Ventas (Últimos 30 días)</h3>
            <div style={{ height: '200px', width: '100%' }}>
              <Line 
                data={chartData.salesTrend}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  animation: {
                    duration: 750
                  },
                  plugins: {
                    legend: {
                      display: false
                    },
                    tooltip: {
                      enabled: true,
                      mode: 'index',
                      intersect: false
                    }
                  },
                  scales: {
                    y: {
                      beginAtZero: true,
                      ticks: {
                        stepSize: 1
                      }
                    },
                    x: {
                      ticks: {
                        maxTicksLimit: 10
                      }
                    }
                  },
                  elements: {
                    point: {
                      radius: 2
                    }
                  }
                }}
              />
            </div>
          </div>
          <div className="chart-card">
            <h3>Productos Más Vendidos</h3>
            <div style={{ height: '200px', width: '100%' }}>
              <Bar 
                data={chartData.topProducts}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  animation: {
                    duration: 750
                  },
                  plugins: {
                    legend: {
                      display: false
                    },
                    tooltip: {
                      enabled: true
                    }
                  },
                  scales: {
                    y: {
                      beginAtZero: true
                    }
                  }
                }}
              />
            </div>
          </div>
        </div>
        <div className="chart-row">
          <div className="chart-card">
            <h3>Crecimiento de Ingresos</h3>
            <div style={{ height: '200px', width: '100%' }}>
              <Line 
                data={chartData.revenueGrowth}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  animation: {
                    duration: 750
                  },
                  plugins: {
                    legend: {
                      display: false
                    },
                    tooltip: {
                      enabled: true,
                      mode: 'index',
                      intersect: false
                    }
                  },
                  scales: {
                    y: {
                      beginAtZero: true
                    },
                    x: {
                      ticks: {
                        maxTicksLimit: 8
                      }
                    }
                  },
                  elements: {
                    point: {
                      radius: 2
                    }
                  }
                }}
              />
            </div>
          </div>
          <div className="chart-card">
            <h3>Estado de Ventas</h3>
            <div style={{ height: '200px', width: '100%' }}>
              <Doughnut 
                data={chartData.salesStatus}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  animation: {
                    duration: 750
                  },
                  plugins: {
                    legend: {
                      position: 'bottom',
                      labels: {
                        padding: 10,
                        usePointStyle: true
                      }
                    },
                    tooltip: {
                      enabled: true
                    }
                  }
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Notifications Section */}
      {notifications.length > 0 && (
        <div className="notifications-section">
          <div className="section-header">
            <h2>Recordatorios Urgentes</h2>
            <button onClick={() => navigate('/recordatorios')} className="view-all-link">Ver todos</button>
          </div>
          <div className="notifications-list">
            {notifications.map((notification) => (
              <div 
                key={notification.notificationId}
                className={`notification-item ${notification.isDue ? 'overdue' : 'upcoming'}`}
              >
                <div className="notification-content">
                  <div className="customer-name">{notification.customerName}</div>
                  <div className="notification-message">
                    {formatNotificationMessage(notification)}
                  </div>
                  <div className="notification-details">
                    <span>Compró {notification.totalKombuchas} kombuchas</span>
                    <span>•</span>
                    <span>{formatDateForDisplay(notification.lastSaleDate)}</span>
                  </div>
                </div>
                <div className="notification-actions">
                  <button onClick={() => navigate('/recordatorios')} className="action-link">Ver detalles</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      <div className="recent-batches">
        <h2>Ventas recientes</h2>
        <div className="batch-list">
          {recentSales.length === 0 ? (
            <div className="empty-state">
              <p>No hay ventas recientes</p>
            </div>
          ) : (
            recentSales.map((sale) => (
              <div key={sale.id} className="batch-item">
                <div className="batch-info">
                  <h4>Venta #{sale.id.slice(-6)}</h4>
                  <p>Fecha: {formatDate(sale.fecha)}</p>
                  <p>Cliente: {getClientName(sale.cliente)}</p>
                  <p>Total: ${parseFloat(sale.total || 0).toFixed(2)}</p>
                </div>
                <div className={`batch-status ${sale.estado === 'completada' ? 'completed' : 'active'}`}>
                  {sale.estado === 'completada' ? 'Completada' : 'Pendiente'}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default Dashboard; 