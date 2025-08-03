import React, { useState, useEffect } from 'react';
import { generateCustomerNotifications, getNotificationPriority } from '../../utils/notificationUtils';
import { getMexicoDate, getRelativeDate } from '../../utils/dateUtils';
import './ReminderCalendar.css';

const ReminderCalendar = ({ notifications, sales, onDateClick, onReminderClick, onSaleClick }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [calendarDays, setCalendarDays] = useState([]);
  const [remindersByDate, setRemindersByDate] = useState({});
  const [salesByDate, setSalesByDate] = useState({});

  // Generate calendar days for current month
  useEffect(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    const days = [];
    const currentDateObj = new Date(startDate);
    
    while (currentDateObj <= lastDay || days.length < 42) {
      days.push(new Date(currentDateObj));
      currentDateObj.setDate(currentDateObj.getDate() + 1);
    }
    
    setCalendarDays(days);
  }, [currentDate]);

  // Group reminders by date
  useEffect(() => {
    const grouped = {};
    // Only show pending notifications on the calendar
    const pendingNotifications = notifications.filter(n => n.status === 'pending');
    pendingNotifications.forEach(reminder => {
      const dateKey = reminder.reminderDate;
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(reminder);
    });
    setRemindersByDate(grouped);
  }, [notifications]);

  // Group sales by date
  useEffect(() => {
    const grouped = {};
    if (sales && sales.length > 0) {
      sales.forEach(sale => {
        const dateKey = sale.fecha ? sale.fecha.split('T')[0] : null;
        if (dateKey) {
          if (!grouped[dateKey]) {
            grouped[dateKey] = [];
          }
          grouped[dateKey].push(sale);
        }
      });
    }
    setSalesByDate(grouped);
  }, [sales]);



  const navigateMonth = (direction) => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(newDate.getMonth() + direction);
      return newDate;
    });
  };

  const getMonthName = (date) => {
    return date.toLocaleDateString('es-ES', { 
      month: 'long', 
      year: 'numeric',
      timeZone: 'America/Mexico_City'
    });
  };

  const isToday = (date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isCurrentMonth = (date) => {
    return date.getMonth() === currentDate.getMonth();
  };

  const getDateKey = (date) => {
    return date.toISOString().split('T')[0];
  };

  const getPriorityColor = (reminder) => {
    const priority = getNotificationPriority(reminder);
    switch (priority) {
      case 'high':
        return '#e74c3c';
      case 'medium':
        return '#f39c12';
      case 'low':
        return '#27ae60';
      default:
        return '#95a5a6';
    }
  };



  const handleDateClick = (date) => {
    const dateKey = getDateKey(date);
    const remindersForDate = remindersByDate[dateKey] || [];
    onDateClick(date, remindersForDate);
  };

  const handleReminderClick = (reminder) => {
    onReminderClick(reminder);
  };

  const handleSaleClick = (sale) => {
    onSaleClick(sale);
  };



  return (
    <div className="reminder-calendar">
      <div className="calendar-header">
        <button 
          className="calendar-nav-btn"
          onClick={() => navigateMonth(-1)}
        >
          ‹
        </button>
        <h3 className="calendar-title">{getMonthName(currentDate)}</h3>
        <button 
          className="calendar-nav-btn"
          onClick={() => navigateMonth(1)}
        >
          ›
        </button>
      </div>

      <div className="calendar-grid">
        {/* Day headers */}
        {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map(day => (
          <div key={day} className="calendar-day-header">
            {day}
          </div>
        ))}

        {/* Calendar days */}
        {calendarDays.map((date, index) => {
          const dateKey = getDateKey(date);
          const remindersForDate = remindersByDate[dateKey] || [];
          const salesForDate = salesByDate[dateKey] || [];
          const isTodayDate = isToday(date);
          const isCurrentMonthDate = isCurrentMonth(date);

          return (
            <div
              key={index}
              className={`calendar-day ${isTodayDate ? 'today' : ''} ${!isCurrentMonthDate ? 'other-month' : ''}`}
              onClick={() => handleDateClick(date)}
            >
              <div className="day-number">{date.getDate()}</div>
              
                            {/* Reminders indicator */}
              {remindersForDate.length > 0 && (
                <div className="reminders-indicator">
                  {remindersForDate.map((reminder, idx) => (
                    <div key={reminder.notificationId} className="reminder-item">
                      <div
                        className="reminder-dot"
                        style={{ 
                          backgroundColor: getPriorityColor(reminder)
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleReminderClick(reminder);
                        }}
                        title={`${reminder.customerName} - ${reminder.isDue ? `${reminder.daysOverdue} días vencido` : `${reminder.daysUntilDue} días restantes`}`}
                      />
                      <span className="customer-name-tooltip">
                        {reminder.customerName}
                      </span>
                    </div>
                  ))}
                  {remindersForDate.length > 3 && (
                    <div className="more-reminders">+{remindersForDate.length - 3}</div>
                  )}
                </div>
              )}

              {/* Sales indicator */}
              {salesForDate.length > 0 && (
                <div className="sales-indicator">
                  {salesForDate.map((sale, idx) => (
                    <div key={sale.id} className="sale-item">
                      <div
                        className="sale-dot"
                        style={{ 
                          backgroundColor: (() => {
                            const isCompleted = (sale.estado === 'completada' || sale.estado === 'completed' || sale.estado === 'Completado');
                            console.log(`Sale ${sale.id} estado: "${sale.estado}", isCompleted: ${isCompleted}`);
                            return isCompleted ? '#007bff' : '#6f42c1';
                          })()
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSaleClick(sale);
                        }}
                        title={`Venta ${sale.id} - ${sale.estado || 'pendiente'} - $${parseFloat(sale.total || 0).toFixed(2)}`}
                      />
                      <span className="sale-info-tooltip">
                        Venta ${parseFloat(sale.total || 0).toFixed(2)}
                      </span>
                    </div>
                  ))}
                  {salesForDate.length > 3 && (
                    <div className="more-sales">+{salesForDate.length - 3}</div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="calendar-legend">
        <div className="legend-item">
          <div className="legend-dot high-priority"></div>
          <span>Alta prioridad</span>
        </div>
        <div className="legend-item">
          <div className="legend-dot medium-priority"></div>
          <span>Media prioridad</span>
        </div>
        <div className="legend-item">
          <div className="legend-dot low-priority"></div>
          <span>Baja prioridad</span>
        </div>
        <div className="legend-item">
          <div className="legend-dot completed-sale"></div>
          <span>Venta completada</span>
        </div>
        <div className="legend-item">
          <div className="legend-dot pending-sale"></div>
          <span>Venta pendiente</span>
        </div>
      </div>
    </div>
  );
};

export default ReminderCalendar; 