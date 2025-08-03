// Simple test to verify timezone functions
import { getMexicoDate, getMexicoMonth, getMexicoDateTime } from './dateUtils';

// Test the functions
console.log('Testing Mexico timezone functions:');
console.log('Current date in Mexico:', getMexicoDate());
console.log('Current month in Mexico:', getMexicoMonth());
console.log('Current datetime in Mexico:', getMexicoDateTime());

// Compare with UTC
console.log('Current UTC date:', new Date().toISOString().split('T')[0]);
console.log('Current UTC month:', new Date().toISOString().slice(0, 7));
console.log('Current UTC datetime:', new Date().toISOString());

// Export for manual testing
export const testTimezoneFunctions = () => {
  return {
    mexicoDate: getMexicoDate(),
    mexicoMonth: getMexicoMonth(),
    mexicoDateTime: getMexicoDateTime(),
    utcDate: new Date().toISOString().split('T')[0],
    utcMonth: new Date().toISOString().slice(0, 7),
    utcDateTime: new Date().toISOString()
  };
}; 