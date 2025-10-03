# Kids Points Dashboard

A lightweight Next.js application for managing kids' weekly routines and points system, optimized for 7-inch TRML devices with Terminus integration.

## Features

- **Kid Profiles**: Manage multiple kids with custom names, avatars, and point tracking
- **Flexible Routines**: Set up routines for specific days (weekdays, weekends, or custom combinations)
- **Real-time Dashboard**: Live updating dashboard optimized for 7-inch displays
- **Time-based Highlighting**: Automatically highlights the next routine item based on current time
- **Student-Specific Devices**: Each kid can have their own dedicated Terminus display
- **Admin Authentication**: Secure admin interface with password protection
- **Device Management**: Configure and monitor individual device assignments
- **Persistent Data**: SQLite database for reliable data storage
- **Responsive Design**: Optimized for 7-inch TRML devices (800x480 resolution)

## Quick Start with Docker

1. **Clone and setup**:
   ```bash
   git clone <repository>
   cd kids-points
   cp .env.example .env.local
   ```

2. **Configure Terminus API**:
   Edit `.env.local` and set your Terminus API URL:
   ```
   TERMINUS_API_URL=http://your-terminus-device:8080
   ```

3. **Run with Docker Compose**:
   ```bash
   docker-compose up --build
   ```

4. **Access the application**:
   - Dashboard: http://localhost:3000
   - Admin Interface: http://localhost:3000/admin

## Data Persistence

The application uses SQLite for persistent data storage:

- **Database**: `kids-points.db` (automatically created)
- **Location**: Project root (development) or `/data` directory (production)
- **Docker Volume**: `kids-points-data` ensures data persists across container restarts
- **Initial Data**: Sample kids and routines are automatically seeded on first run

## Project Structure

```
src/
├── app/                 # Next.js App Router
│   ├── api/terminus/   # Terminus API integration
│   ├── admin/          # Admin interface
│   └── page.tsx        # Main dashboard
├── components/         # React components
│   ├── Dashboard.tsx   # Main dashboard component
│   ├── KidCard.tsx     # Kid information display
│   └── RoutineList.tsx # Routine list with time highlighting
├── hooks/              # Custom React hooks
│   └── useTerminus.ts  # Terminus integration hook
├── lib/                # Utilities and data
│   ├── data.ts         # Sample data and data access functions
│   └── terminus.ts     # Terminus API client
└── types/              # TypeScript type definitions
    └── index.ts        # Application types
```

## Terminus Integration

The app integrates with Terminus devices using the [byos_hanami](https://github.com/usetrmnl/byos_hanami) approach:

- **Automatic Updates**: Dashboard data is automatically sent to Terminus every 30 seconds
- **API Endpoint**: `/api/terminus` handles Terminus communication
- **Manual Sync**: Admin interface includes manual sync button
- **Data Format**: Sends kid name, points, todos, and next item highlighting

## Data Model

### Kid
- ID, name, avatar emoji
- Total points (cumulative)
- Daily points (resets daily)
- Device ID (optional Terminus device assignment)

### Routine Item
- Title, description, time
- Point value
- Days of week (array: weekdays, weekends, custom)
- Completion status
- Kid assignment

## Development

### Local Development (without Docker)

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Run development server**:
   ```bash
   npm run dev
   ```

3. **Build for production**:
   ```bash
   npm run build
   npm start
   ```

### Customization

- **Add Kids**: Edit `src/lib/data.ts` to add more kids
- **Modify Routines**: Use admin interface or edit sample data
- **Styling**: Tailwind CSS classes optimized for 7-inch displays
- **Terminus URL**: Configure via environment variables

## TRML Device Optimization

The interface is specifically optimized for 7-inch TRML devices:

- **Resolution**: Designed for 800x480 displays
- **Touch-friendly**: Large buttons and clear typography
- **Responsive**: Adapts to screen size with `trml:` CSS classes
- **High contrast**: Clear visibility in various lighting conditions
- **Minimal animations**: Optimized for device performance

## API Reference

### POST `/api/terminus`
Sends current kid data to Terminus device.

**Request**:
```json
{
  "kidId": "1",
  "deviceId": "trml_emma"
}
```

**Response**:
```json
{
  "success": true,
  "payload": {
    "device_id": "trml_emma",
    "kid_name": "Emma",
    "total_points": 145,
    "daily_points": 25,
    "next_todo": "Eat Breakfast",
    "todos": [...]
  }
}
```

### GET `/api/terminus`
Returns status for all kids.

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `TERMINUS_API_URL` | Terminus device API URL | `http://localhost:8080` |
| `TERMINUS_DEVICE_ID` | Optional device ID for targeted updates | (empty) |
| `ADMIN_PASSWORD` | Admin interface password | `admin123` |
| `NODE_ENV` | Environment mode | `development` |

## License

MIT License