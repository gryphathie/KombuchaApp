# Timezone Fix for Mexico

## Problem

The application was using UTC timezone (`new Date().toISOString()`) instead of Mexico's timezone, causing date discrepancies.

## Solution

Created a utility file `src/utils/dateUtils.js` with functions that handle dates in Mexico's timezone (`America/Mexico_City`).

## Changes Made

### 1. Created `src/utils/dateUtils.js`

- `getMexicoDate()`: Returns current date in YYYY-MM-DD format in Mexico timezone
- `getMexicoMonth()`: Returns current month in YYYY-MM format in Mexico timezone
- `getMexicoDateTime()`: Returns current date and time as ISO string in Mexico timezone
- `convertToMexicoDate()`: Converts any date string to Mexico timezone
- `formatDateForDisplay()`: Formats dates for display in Spanish locale with Mexico timezone
- `getRelativeDate()`: Gets dates relative to today in Mexico timezone
- `formatRelativeDate()`: Formats dates relative to today in Mexico timezone (Hoy, Ayer, etc.)

### 2. Updated Components

#### Dashboard (`src/pages/Dashboard/Dashboard.jsx`)

- Replaced `new Date().toISOString().split('T')[0]` with `getMexicoDate()`
- Replaced `new Date().toISOString().slice(0, 7)` with `getMexicoMonth()`
- Updated chart data generation to use Mexico timezone
- Updated date formatting to use `formatDateForDisplay()`
- Fixed relative date comparison to use Mexico timezone with `formatRelativeDate()`

#### Ventas (`src/pages/Ventas/Ventas.jsx`)

- Updated form initialization to use Mexico timezone dates
- Updated `fechaRegistro` and `fechaActualizacion` to use `getMexicoDateTime()`
- Updated form reset to use Mexico timezone

#### Kombuchas (`src/pages/Kombuchas/Kombuchas.jsx`)

- Updated `fechaRegistro` and `fechaActualizacion` to use `getMexicoDateTime()`

#### Clientes (`src/pages/Clientes/Clientes.jsx`)

- Updated `fechaRegistro` to use `getMexicoDate()`

## Testing

You can test the timezone functions by importing and calling them:

```javascript
import {
  getMexicoDate,
  getMexicoMonth,
  getMexicoDateTime,
} from "./utils/dateUtils";

console.log("Mexico date:", getMexicoDate());
console.log("Mexico month:", getMexicoMonth());
console.log("Mexico datetime:", getMexicoDateTime());
```

## Benefits

- All dates now use Mexico's timezone (America/Mexico_City)
- Consistent date handling across the application
- Proper localization for Spanish users
- No more timezone discrepancies between server and client

## Timezone Information

- **Mexico Timezone**: America/Mexico_City
- **UTC Offset**: UTC-6 (Central Standard Time) or UTC-5 (Central Daylight Time)
- **Daylight Saving**: Yes, Mexico observes DST
