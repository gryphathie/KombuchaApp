# Sistema de Notificaciones de Recordatorios

## Descripción

El sistema de notificaciones de recordatorios está diseñado para ayudar a mantener el contacto con los clientes basándose en sus patrones de compra de kombuchas. El sistema calcula automáticamente cuándo contactar a cada cliente basándose en la cantidad de kombuchas que compraron en su última venta.

## Funcionalidad Principal

### Cálculo de Recordatorios

- **Fórmula**: El número de días para contactar al cliente es igual al número total de kombuchas que compró en su última venta
- **Ejemplo**: Si un cliente compró 5 kombuchas, se debe contactar 5 días después de la compra

### Tipos de Notificaciones

1. **Pendientes**: Recordatorios que aún no han sido procesados
2. **Vencidos**: Recordatorios que ya pasaron su fecha límite
3. **Próximos**: Recordatorios que están por vencer
4. **Contactados**: Recordatorios que ya fueron procesados
5. **Descartados**: Recordatorios que fueron descartados

### Niveles de Prioridad

- **Alta** (🔴): Vencidos por 7 días o más
- **Media** (🟡): Vencidos por 3-6 días
- **Baja** (🟢): Próximos a vencer o vencidos por menos de 3 días

## Componentes del Sistema

### 1. NotificationBell Component

- **Ubicación**: `src/components/NotificationBell/`
- **Función**: Muestra un ícono de campana con contador de notificaciones pendientes
- **Características**:
  - Contador en tiempo real
  - Dropdown con notificaciones recientes
  - Animaciones y efectos visuales
  - Auto-refresh cada 5 minutos

### 2. Recordatorios Page

- **Ubicación**: `src/pages/Recordatorios/`
- **Función**: Página dedicada para gestionar todos los recordatorios
- **Características**:
  - Filtros por estado
  - Estadísticas en tiempo real
  - Modal para marcar como contactado
  - Gestión completa de recordatorios

### 3. Notification Utils

- **Ubicación**: `src/utils/notificationUtils.js`
- **Función**: Lógica de negocio para cálculos y gestión de notificaciones
- **Funciones principales**:
  - `calculateCustomerReminder()`: Calcula recordatorios individuales
  - `generateCustomerNotifications()`: Genera todas las notificaciones
  - `getNotificationStats()`: Calcula estadísticas
  - `formatNotificationMessage()`: Formatea mensajes para mostrar

## Integración con el Dashboard

El Dashboard incluye:

- Campana de notificaciones en el header
- Estadística de recordatorios pendientes
- Sección de recordatorios urgentes
- Enlaces directos a la página de recordatorios

## Estructura de Datos

### Notificación en Firebase

```javascript
{
  notificationId: "customerId_saleId_reminderDate",
  status: "pending|contacted|dismissed",
  notes: "Notas del contacto",
  updatedAt: "2024-01-01T00:00:00.000Z",
  updatedBy: "user"
}
```

### Objeto de Notificación

```javascript
{
  customerId: "customer_id",
  customerName: "Nombre del Cliente",
  customerPhone: "123456789",
  customerAddress: "Dirección del Cliente",
  lastSaleId: "sale_id",
  lastSaleDate: "2024-01-01",
  totalKombuchas: 5,
  daysToWait: 5,
  reminderDate: "2024-01-06",
  isDue: true,
  daysOverdue: 2,
  daysUntilDue: 0,
  status: "pending",
  notificationId: "unique_id"
}
```

## Uso del Sistema

### Para el Usuario Final

1. **Ver Notificaciones**: Hacer clic en la campana en el Dashboard
2. **Gestionar Recordatorios**: Ir a la página "Recordatorios"
3. **Contactar Cliente**: Hacer clic en "Contactar" y agregar notas
4. **Marcar como Contactado**: Completar el formulario de contacto
5. **Descartar**: Marcar recordatorios irrelevantes como descartados

### Para Desarrolladores

```javascript
// Importar utilidades
import {
  generateCustomerNotifications,
  getNotificationStats,
} from "../utils/notificationUtils";

// Generar notificaciones
const notifications = generateCustomerNotifications(sales, customers);

// Obtener estadísticas
const stats = getNotificationStats(notifications);

// Usar el componente NotificationBell
import NotificationBell from "../components/NotificationBell";

<NotificationBell onNotificationClick={handleNotificationClick} />;
```

## Configuración

### Zona Horaria

El sistema utiliza la zona horaria de México (`America/Mexico_City`) para todos los cálculos de fechas.

### Auto-refresh

- NotificationBell: Cada 5 minutos
- Dashboard: Al cargar la página
- Recordatorios: Al cargar la página

## Pruebas

El sistema incluye pruebas unitarias en `src/utils/notificationUtils.test.js` que cubren:

- Cálculo de recordatorios
- Generación de notificaciones
- Estadísticas
- Formateo de mensajes
- Niveles de prioridad

## Consideraciones Técnicas

1. **Rendimiento**: Las notificaciones se calculan en el cliente para evitar sobrecarga del servidor
2. **Persistencia**: Los estados de las notificaciones se guardan en Firebase
3. **Escalabilidad**: El sistema puede manejar múltiples usuarios y grandes volúmenes de datos
4. **Responsive**: Todos los componentes son responsivos y funcionan en móviles

## Futuras Mejoras

1. **Notificaciones Push**: Implementar notificaciones del navegador
2. **Email/SMS**: Integración con servicios de comunicación
3. **Automatización**: Recordatorios automáticos por email
4. **Analytics**: Métricas de efectividad de los recordatorios
5. **Personalización**: Configuración de días de espera por cliente
