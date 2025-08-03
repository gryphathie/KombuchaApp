// Date utilities for Mexico timezone
const MEXICO_TIMEZONE = 'America/Mexico_City';

/**
 * Get current date in Mexico timezone as YYYY-MM-DD format
 * @returns {string} Date in YYYY-MM-DD format
 */
export const getMexicoDate = () => {
  return new Date().toLocaleDateString('en-CA', { timeZone: MEXICO_TIMEZONE });
};

/**
 * Get current date and time in Mexico timezone as ISO string
 * @returns {string} ISO string in Mexico timezone
 */
export const getMexicoDateTime = () => {
  const now = new Date();
  const mexicoTime = new Date(now.toLocaleString('en-US', { timeZone: MEXICO_TIMEZONE }));
  return mexicoTime.toISOString();
};

/**
 * Get current month in Mexico timezone as YYYY-MM format
 * @returns {string} Month in YYYY-MM format
 */
export const getMexicoMonth = () => {
  return new Date().toLocaleDateString('en-CA', { 
    timeZone: MEXICO_TIMEZONE,
    year: 'numeric',
    month: '2-digit'
  }).replace('/', '-');
};

/**
 * Convert a date string to Mexico timezone
 * @param {string} dateString - Date string to convert
 * @returns {string} Date in YYYY-MM-DD format in Mexico timezone
 */
export const convertToMexicoDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-CA', { timeZone: MEXICO_TIMEZONE });
};

/**
 * Format a date for display in Spanish locale
 * @param {string} dateString - Date string to format
 * @returns {string} Formatted date string
 */
export const formatDateForDisplay = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('es-ES', { timeZone: MEXICO_TIMEZONE });
};

/**
 * Get a date relative to today in Mexico timezone
 * @param {number} daysOffset - Number of days to offset (negative for past, positive for future)
 * @returns {string} Date in YYYY-MM-DD format
 */
export const getRelativeDate = (daysOffset = 0) => {
  const date = new Date();
  date.setDate(date.getDate() + daysOffset);
  return date.toLocaleDateString('en-CA', { timeZone: MEXICO_TIMEZONE });
};

/**
 * Format month and year for display in Spanish
 * @param {string} monthYear - Month in YYYY-MM format
 * @returns {string} Formatted month and year in Spanish
 */
export const formatMonthYear = (monthYear) => {
  if (!monthYear) return 'este mes';
  const date = new Date(monthYear + '-01');
  return date.toLocaleDateString('es-ES', { 
    month: 'long', 
    year: 'numeric',
    timeZone: MEXICO_TIMEZONE 
  });
};

/**
 * Format a date relative to today in Mexico timezone
 * @param {string} dateString - Date string to format
 * @returns {string} Formatted relative date string
 */
export const formatRelativeDate = (dateString) => {
  const saleDate = new Date(dateString + 'T00:00:00');
  const today = new Date();
  
  // Convert both dates to Mexico timezone for comparison
  const saleDateMexico = new Date(saleDate.toLocaleString('en-US', { timeZone: MEXICO_TIMEZONE }));
  const todayMexico = new Date(today.toLocaleString('en-US', { timeZone: MEXICO_TIMEZONE }));
  
  // Reset time to midnight for accurate day comparison
  saleDateMexico.setHours(0, 0, 0, 0);
  todayMexico.setHours(0, 0, 0, 0);
  
  const diffTime = Math.abs(todayMexico - saleDateMexico);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) return 'Hoy';
  if (diffDays === 1) return 'Ayer';
  if (diffDays <= 7) return `Hace ${diffDays} días`;
  return formatDateForDisplay(dateString);
}; 