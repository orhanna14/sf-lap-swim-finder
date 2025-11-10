# SF Lap Swim Finder @ https://sf-lap-swim-finder-frontend.onrender.com

A web application to help you find available lap swimming pools in San Francisco and nearby areas. No more clicking through multiple PDFs!

## Features

- **Open Now**: See which pools have lap swim available right now
- **Specific Time Search**: Check availability for a specific date and time
- **Week View**: View full schedules for all pools
- **Favorites**: Mark your preferred pools and see them first
- **Auto-refresh**: Schedules update automatically every day at 6 AM
- **Mobile-friendly**: Works great on all devices

## Pool Coverage

### San Francisco Recreation & Parks
- Balboa Pool
- Coffman Pool
- Garfield Pool
- Hamilton Pool
- Martin Luther King Jr. Pool
- Mission Pool
- North Beach Pool
- Rossi Pool
- Sava Pool

### Nearby Pools
- Brisbane Aquatic Center
- Burlingame Recreation Center

## Getting Started

### Prerequisites

- Node.js (v22 or later recommended)
- npm

### Installation

1. Clone the repository:
```bash
cd sf-lap-swim-finder
```

2. Install backend dependencies:
```bash
cd server
npm install
```

3. Install frontend dependencies:
```bash
cd ../client
npm install
```

### Running the Application

You'll need two terminal windows:

**Terminal 1 - Start the backend server:**
```bash
cd server
npm start
```
The server will run on http://localhost:3001

**Terminal 2 - Start the frontend:**
```bash
cd client
npm run dev
```
The app will open at http://localhost:5173

## Project Structure

```
sf-lap-swim-finder/
├── server/               # Backend API
│   ├── index.js         # Express server
│   ├── pools.js         # Pool configuration
│   ├── pdfService.js    # PDF fetching and parsing
│   └── package.json
├── client/              # React frontend
│   ├── src/
│   │   ├── App.jsx     # Main app component
│   │   ├── App.css     # Styles
│   │   └── main.jsx    # Entry point
│   └── package.json
└── README.md
```

## How It Works

1. **PDF Fetching**: The backend automatically downloads pool schedule PDFs from SF Recreation & Parks
2. **Parsing**: PDFs are parsed to extract lap swim times
3. **Caching**: Schedules are cached for one week to minimize downloads
4. **API**: The frontend queries the backend API to check availability
5. **Auto-updates**: A daily cron job refreshes all schedules at 6 AM

## API Endpoints

- `GET /api/pools` - List all pools
- `GET /api/schedules` - Get all parsed schedules
- `GET /api/schedules/:poolId` - Get schedule for a specific pool
- `GET /api/available` - Check which pools are available now (or at a specific time with ?date=YYYY-MM-DD&time=HH:mm)
- `POST /api/schedules/refresh` - Manually refresh all schedules
- `GET /api/health` - Health check

## Adding New Pools

To add more pools, edit [server/pools.js](server/pools.js) and add a new pool object:

```javascript
{
  id: 'pool-id',
  name: 'Pool Name',
  city: 'City Name',
  address: 'Full Address',
  scheduleUrl: 'Direct URL to PDF schedule', // or null
  detailsUrl: 'Pool details page URL', // optional
}
```

## Schedule Data

The app uses a hybrid approach for pool schedules:

1. **Automatic PDF Parsing**: Attempts to extract lap swim times from PDF schedules
2. **Manual Overrides**: For pools where parsing fails, you can add schedules manually

### Adding Manual Schedules

If the automated PDF parsing isn't working for a pool, you can add the schedule manually:

1. Edit `server/manualSchedules.json`
2. Add an entry for the pool:

```json
{
  "schedules": {
    "poolId": {
      "poolId": "hamilton",
      "lapSwimSessions": [
        {
          "days": ["MONDAY", "WEDNESDAY", "FRIDAY"],
          "times": ["6:00 am", "7:30 am"],
          "notes": "Adults only"
        },
        {
          "days": ["TUESDAY", "THURSDAY"],
          "times": ["12:00 pm", "1:30 pm"],
          "notes": "All ages"
        }
      ]
    }
  }
}
```

3. Restart the server: `npm start`

The app will show which schedules are manual vs. auto-parsed.

## Known Limitations

- PDF parsing for complex table formats is challenging - some pools may need manual entry
- The app does not account for real-time closures (holidays, maintenance, etc.)
- Schedule URLs for some pools need to be manually discovered
- Brisbane and Burlingame pool schedules need to be added manually
- Always verify schedules with the source PDF before visiting

## Future Enhancements

- [ ] Browser notifications when favorite pools open soon
- [ ] Google Maps integration for directions
- [ ] More sophisticated PDF parsing (using OCR if needed)
- [ ] Progressive Web App (PWA) for offline access
- [ ] Share your favorite pools with friends
- [ ] Historical data and patterns

## Contributing

This is a personal project, but suggestions and improvements are welcome!

## Disclaimer

This app provides schedule information based on publicly available PDFs. Always verify hours before visiting a pool, as schedules may change due to holidays, maintenance, or other factors.

## Data Source

Pool schedules are sourced from [SF Recreation & Parks](https://sfrecpark.org/482/Swimming-Pools).
