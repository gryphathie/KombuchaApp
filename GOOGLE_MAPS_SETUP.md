# Google Maps API Setup Guide

This guide will help you set up Google Maps API for the address autocomplete feature in your Kombucha App.

## Prerequisites

1. A Google Cloud Platform account
2. A billing account (Google Maps API requires billing to be enabled)

## Step 1: Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable billing for your project

## Step 2: Enable Required APIs

1. In the Google Cloud Console, go to "APIs & Services" > "Library"
2. Search for and enable the following APIs:
   - **Places API** (for address autocomplete)
   - **Maps JavaScript API** (for displaying maps)

## Step 3: Create API Key

1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "API Key"
3. Copy the generated API key

## Step 4: Restrict API Key (Recommended)

1. Click on the API key you just created
2. Under "Application restrictions", select "HTTP referrers (web sites)"
3. Add your domain(s):
   - For development: `localhost:*`
   - For production: `yourdomain.com/*`
4. Under "API restrictions", select "Restrict key"
5. Select the APIs you enabled (Places API and Maps JavaScript API)
6. Click "Save"

## Step 5: Update Your Application

1. Open `index.html` in your project
2. Replace `YOUR_GOOGLE_MAPS_API_KEY` with your actual API key:

```html
<script src="https://maps.googleapis.com/maps/api/js?key=YOUR_ACTUAL_API_KEY&libraries=places"></script>
```

## Step 6: Test the Integration

1. Start your development server
2. Go to the Clientes page
3. Try adding a new client and use the address field
4. You should see address suggestions as you type

## Features Added

### Address Autocomplete

- Real-time address suggestions as you type
- Restricted to Mexico addresses (can be changed in `AddressAutocomplete.jsx`)
- **City/State restrictions** - Limit searches to specific cities and states
- Stores both address text and coordinates

### Map View

- New Map page to display all client locations
- Interactive markers with client information
- Responsive design for mobile devices

### Data Structure

The client data now includes:

- `direccion`: The full address text
- `direccionCoords`: Object with `lat` and `lng` coordinates

### City/State Restrictions

You can limit address searches to specific cities and states by editing `src/config/locationConfig.js`:

```javascript
export const LOCATION_CONFIG = {
  // Cities where you want to restrict address searches
  restrictedCities: [
    "Ciudad de México",
    "Guadalajara",
    "Monterrey",
    // Add more cities as needed
  ],

  // States where you want to restrict address searches
  restrictedStates: [
    "Jalisco",
    "Nuevo León",
    // Add more states as needed
  ],
  // ... other config
};
```

**To disable restrictions:** Set both arrays to empty: `restrictedCities: []` and `restrictedStates: []`

## Usage

### Adding Clients with Addresses

1. Go to "Gestión de Clientes"
2. Click "Nuevo Cliente"
3. In the address field, start typing an address
4. Select from the suggestions that appear
5. The coordinates will be automatically saved

### Viewing Client Map

1. Navigate to the Map page (you'll need to add this to your routing)
2. All clients with coordinates will be displayed on the map
3. Click on markers to see client details

## Troubleshooting

### API Key Issues

- Make sure your API key is correct
- Check that billing is enabled
- Verify API restrictions are set correctly

### No Suggestions Appearing

- Check browser console for errors
- Ensure the Places API is enabled
- Verify the API key has access to Places API

### Map Not Loading

- Check that Maps JavaScript API is enabled
- Verify the API key has access to Maps JavaScript API
- Check browser console for any JavaScript errors

## Cost Considerations

Google Maps API has usage-based pricing:

- Places API: $17 per 1000 requests
- Maps JavaScript API: $7 per 1000 map loads

For a small business application, costs are typically very low (under $10/month).

## Security Notes

- Never commit your API key to version control
- Use environment variables in production
- Set up proper API key restrictions
- Monitor your API usage in Google Cloud Console
