import { 
  calculateCustomerReminder, 
  generateCustomerNotifications, 
  getNotificationStats,
  formatNotificationMessage,
  getNotificationPriority 
} from './notificationUtils';

// Mock data for testing
const mockLastSale = {
  id: 'sale1',
  cliente: 'customer1',
  fecha: '2024-01-01',
  items: [
    { kombuchaId: 'k1', cantidad: 3, precio: 10 },
    { kombuchaId: 'k2', cantidad: 2, precio: 12 }
  ]
};

const mockSales = [
  {
    id: 'sale1',
    cliente: 'customer1',
    fecha: '2024-01-01',
    items: [
      { kombuchaId: 'k1', cantidad: 3, precio: 10 },
      { kombuchaId: 'k2', cantidad: 2, precio: 12 }
    ]
  },
  {
    id: 'sale2',
    cliente: 'customer2',
    fecha: '2024-01-05',
    items: [
      { kombuchaId: 'k1', cantidad: 1, precio: 10 }
    ]
  }
];

const mockCustomers = [
  {
    id: 'customer1',
    nombre: 'Juan Pérez',
    telefono: '123456789',
    direccion: 'Calle 123'
  },
  {
    id: 'customer2',
    nombre: 'María García',
    telefono: '987654321',
    direccion: 'Avenida 456'
  }
];

describe('Notification Utils', () => {
  describe('calculateCustomerReminder', () => {
    it('should calculate reminder correctly for a sale with 5 kombuchas', () => {
      const reminder = calculateCustomerReminder(mockLastSale);
      
      expect(reminder).toBeTruthy();
      expect(reminder.totalKombuchas).toBe(5); // 3 + 2
      expect(reminder.daysToWait).toBe(5);
      expect(reminder.customerId).toBe('customer1');
      expect(reminder.lastSaleId).toBe('sale1');
      expect(reminder.status).toBe('pending');
    });

    it('should return null for sale without items', () => {
      const saleWithoutItems = { ...mockLastSale, items: [] };
      const reminder = calculateCustomerReminder(saleWithoutItems);
      expect(reminder).toBeNull();
    });

    it('should return null for sale without fecha', () => {
      const saleWithoutDate = { ...mockLastSale, fecha: null };
      const reminder = calculateCustomerReminder(saleWithoutDate);
      expect(reminder).toBeNull();
    });
  });

  describe('generateCustomerNotifications', () => {
    it('should generate notifications for all customers with sales', () => {
      const notifications = generateCustomerNotifications(mockSales, mockCustomers);
      
      expect(notifications).toHaveLength(2);
      expect(notifications[0].customerName).toBe('Juan Pérez');
      expect(notifications[1].customerName).toBe('María García');
    });

    it('should sort notifications by urgency (overdue first)', () => {
      const pastSales = [
        {
          id: 'sale1',
          cliente: 'customer1',
          fecha: '2024-01-01', // Old date
          items: [{ kombuchaId: 'k1', cantidad: 3, precio: 10 }]
        },
        {
          id: 'sale2',
          cliente: 'customer2',
          fecha: '2024-12-01', // Recent date
          items: [{ kombuchaId: 'k1', cantidad: 1, precio: 10 }]
        }
      ];

      const notifications = generateCustomerNotifications(pastSales, mockCustomers);
      
      // First notification should be overdue (customer1)
      expect(notifications[0].customerName).toBe('Juan Pérez');
      expect(notifications[0].isDue).toBe(true);
      
      // Second notification should be upcoming (customer2)
      expect(notifications[1].customerName).toBe('María García');
      expect(notifications[1].isDue).toBe(false);
    });
  });

  describe('getNotificationStats', () => {
    it('should calculate correct statistics', () => {
      const notifications = [
        { status: 'pending', isDue: true },
        { status: 'pending', isDue: false },
        { status: 'contacted' },
        { status: 'dismissed' }
      ];

      const stats = getNotificationStats(notifications);
      
      expect(stats.total).toBe(4);
      expect(stats.pending).toBe(2);
      expect(stats.overdue).toBe(1);
      expect(stats.upcoming).toBe(1);
      expect(stats.contacted).toBe(1);
      expect(stats.dismissed).toBe(1);
    });
  });

  describe('formatNotificationMessage', () => {
    it('should format overdue notification correctly', () => {
      const overdueNotification = {
        customerName: 'Juan Pérez',
        totalKombuchas: 5,
        isDue: true,
        daysOverdue: 3
      };

      const message = formatNotificationMessage(overdueNotification);
      expect(message).toContain('3 días de retraso');
      expect(message).toContain('Juan Pérez');
      expect(message).toContain('5 kombuchas');
    });

    it('should format upcoming notification correctly', () => {
      const upcomingNotification = {
        customerName: 'María García',
        totalKombuchas: 2,
        isDue: false,
        daysUntilDue: 1
      };

      const message = formatNotificationMessage(upcomingNotification);
      expect(message).toContain('Mañana contacta');
      expect(message).toContain('María García');
      expect(message).toContain('2 kombuchas');
    });
  });

  describe('getNotificationPriority', () => {
    it('should return high priority for overdue >= 7 days', () => {
      const highPriorityNotification = {
        isDue: true,
        daysOverdue: 10
      };

      const priority = getNotificationPriority(highPriorityNotification);
      expect(priority).toBe('high');
    });

    it('should return medium priority for overdue 3-6 days', () => {
      const mediumPriorityNotification = {
        isDue: true,
        daysOverdue: 5
      };

      const priority = getNotificationPriority(mediumPriorityNotification);
      expect(priority).toBe('medium');
    });

    it('should return low priority for upcoming notifications', () => {
      const lowPriorityNotification = {
        isDue: false,
        daysUntilDue: 5
      };

      const priority = getNotificationPriority(lowPriorityNotification);
      expect(priority).toBe('low');
    });
  });
}); 