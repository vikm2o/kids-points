# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Kids Points Dashboard - A Next.js application for managing kids' weekly routines and points system, optimized for 7-inch TRML devices with Terminus integration.

## Development Commands

```bash
# Development with Docker (recommended)
docker-compose up --build

# Local development
npm install
npm run dev

# Build for production
npm run build
npm start

# Linting and type checking
npm run lint
```

## Architecture

### Tech Stack
- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS (optimized for 7-inch displays)
- **Icons**: Lucide React
- **API Integration**: Axios for Terminus communication
- **Deployment**: Docker Compose

### Key Components
- `Dashboard.tsx` - Main dashboard with real-time updates
- `KidCard.tsx` - Kid profile and points display
- `RoutineList.tsx` - Time-based routine list with highlighting
- `useTerminus.ts` - Hook for Terminus API integration

### Data Flow
1. Sample data in `src/lib/data.ts` provides kids and routines
2. Dashboard components consume and update data
3. `useTerminus` hook automatically syncs with Terminus API
4. Admin interface at `/admin` manages routines

### Terminus Integration
- Uses `/api/terminus` endpoint for device communication
- Sends kid name, points, todos, and next item highlighting
- Updates every 30 seconds automatically
- Manual sync available in admin interface

## Key Files
- `src/lib/data.ts` - Sample data and data access functions
- `src/lib/terminus.ts` - Terminus API client
- `src/types/index.ts` - TypeScript definitions
- `docker-compose.yml` - Docker development setup
- `.env.local` - Environment configuration

## TRML Device Optimization
- Responsive design with `trml:` breakpoint (800px)
- Large touch targets and clear typography
- Optimized CSS for 7-inch displays at 800x480 resolution