import { getMexicoDate, getRelativeDate } from './dateUtils';

/**
 * Calculate when a customer should be contacted based on their last purchase
 * @param {Object} lastSale - The last sale object for a customer
 * @returns {Object} Notification data with dates and status
 */
export const calculateCustomerReminder = (lastSale) => {
  if (!lastSale || !lastSale.fecha || !lastSale.items) {
    return null;
  }

  // Calculate total kombuchas purchased in the last sale
  const totalKombuchas = lastSale.items.reduce((total, item) => {
    return total + (parseInt(item.cantidad) || 0);
  }, 0);

  if (totalKombuchas === 0) {
    return null;
  }

  // The number of days to wait before contacting is equal to the total kombuchas
  const daysToWait = totalKombuchas;
  
  // Calculate the reminder date
  const saleDate = new Date(lastSale.fecha + 'T00:00:00');
  const reminderDate = new Date(saleDate);
  reminderDate.setDate(saleDate.getDate() + daysToWait);
  
  const reminderDateStr = reminderDate.toISOString().split('T')[0]; // YYYY-MM-DD
  const today = getMexicoDate();
  
  // Check if reminder is due
  const isDue = reminderDateStr <= today;
  
  // Calculate days overdue or days until due
  const todayDate = new Date(today + 'T00:00:00');
  const reminderDateObj = new Date(reminderDateStr + 'T00:00:00');
  const daysDiff = Math.floor((todayDate - reminderDateObj) / (1000 * 60 * 60 * 24));
  
  return {
    customerId: lastSale.cliente,
    lastSaleId: lastSale.id,
    lastSaleDate: lastSale.fecha,
    totalKombuchas,
    daysToWait,
    reminderDate: reminderDateStr,
    isDue,
    daysOverdue: isDue ? Math.abs(daysDiff) : 0,
    daysUntilDue: !isDue ? Math.abs(daysDiff) : 0,
    status: 'pending' // pending, contacted, dismissed
  };
};

/**
 * Generate notifications for all customers based on their sales history
 * @param {Array} sales - Array of all sales
 * @param {Array} customers - Array of all customers
 * @returns {Array} Array of notification objects
 */
export const generateCustomerNotifications = (sales, customers) => {
  const notifications = [];
  
  // Group sales by customer to find their last purchase
  const salesByCustomer = {};
  sales.forEach(sale => {
    if (!salesByCustomer[sale.cliente]) {
      salesByCustomer[sale.cliente] = [];
    }
    salesByCustomer[sale.cliente].push(sale);
  });
  
  // Calculate reminders for each customer
  Object.keys(salesByCustomer).forEach(customerId => {
    const customerSales = salesByCustomer[customerId].sort((a, b) => 
      new Date(b.fecha) - new Date(a.fecha)
    );
    
    const lastSale = customerSales[0];
    const reminder = calculateCustomerReminder(lastSale);
    
    if (reminder) {
      // Add customer information
      const customer = customers.find(c => c.id === customerId);
      if (customer) {
        notifications.push({
          ...reminder,
          customerName: customer.nombre,
          customerPhone: customer.telefono,
          customerAddress: customer.direccion,
          notificationId: `${customerId}_${lastSale.id}_${reminder.reminderDate}`
        });
      }
    }
  });
  
  return notifications.sort((a, b) => {
    // Sort by urgency: overdue first, then by days overdue
    if (a.isDue && !b.isDue) return -1;
    if (!a.isDue && b.isDue) return 1;
    if (a.isDue && b.isDue) {
      return b.daysOverdue - a.daysOverdue;
    }
    return a.daysUntilDue - b.daysUntilDue;
  });
};

/**
 * Filter notifications by status
 * @param {Array} notifications - Array of notifications
 * @param {string} status - Status to filter by
 * @returns {Array} Filtered notifications
 */
export const filterNotificationsByStatus = (notifications, status) => {
  return notifications.filter(notification => notification.status === status);
};

/**
 * Get notification summary statistics
 * @param {Array} notifications - Array of notifications
 * @returns {Object} Summary statistics
 */
export const getNotificationStats = (notifications) => {
  const pending = notifications.filter(n => n.status === 'pending');
  const overdue = pending.filter(n => n.isDue);
  const upcoming = pending.filter(n => !n.isDue);
  
  return {
    total: notifications.length,
    pending: pending.length,
    overdue: overdue.length,
    upcoming: upcoming.length,
    contacted: notifications.filter(n => n.status === 'contacted').length,
    dismissed: notifications.filter(n => n.status === 'dismissed').length
  };
};

/**
 * Format notification message for display
 * @param {Object} notification - Notification object
 * @returns {string} Formatted message
 */
export const formatNotificationMessage = (notification) => {
  const { customerName, totalKombuchas, isDue, daysOverdue, daysUntilDue } = notification;
  
  if (isDue) {
    if (daysOverdue === 0) {
      return `¡Hoy es el día! Contacta a ${customerName} - compró ${totalKombuchas} kombuchas`;
    } else if (daysOverdue === 1) {
      return `¡Ayer era el día! Contacta a ${customerName} - compró ${totalKombuchas} kombuchas`;
    } else {
      return `¡${daysOverdue} días de retraso! Contacta a ${customerName} - compró ${totalKombuchas} kombuchas`;
    }
  } else {
    if (daysUntilDue === 1) {
      return `Mañana contacta a ${customerName} - compró ${totalKombuchas} kombuchas`;
    } else {
      return `En ${daysUntilDue} días contacta a ${customerName} - compró ${totalKombuchas} kombuchas`;
    }
  }
};

/**
 * Get notification priority level
 * @param {Object} notification - Notification object
 * @returns {string} Priority level (high, medium, low)
 */
export const getNotificationPriority = (notification) => {
  if (!notification.isDue) {
    return 'low';
  }
  
  if (notification.daysOverdue >= 7) {
    return 'high';
  } else if (notification.daysOverdue >= 3) {
    return 'medium';
  } else {
    return 'low';
  }
}; 