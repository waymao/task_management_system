# Agenda Management App

A modern todo list and task capture system with advanced features like assignment boards, Google Calendar integration, and project management.

## Features

### Phase 1 (MVP)
- **Capture System**: Quick immediate todos and full task capture with different types
- **Dashboard**: View all tasks organized by type (Immediate, Todo by Date, Follow-up Reminders)
- **Task Types**:
  - **Immediate**: No deadline, for quick ASAP tasks
  - **Todo**: Tasks with specific due dates
  - **Delegated**: Tasks delegated to others with follow-up reminders

### Phase 2 (Coming Soon)
- **Assignment Board**: Drag-and-drop task scheduling with time slots (morning/afternoon/evening)
- **Google Calendar Integration**: Multi-account sync with blocked time slots

### Phase 3 (Future)
- **Projects**: Project planning boards with task extraction
- **Note-taking**: Extensible content system for thoughts and notes

## Tech Stack

- **Frontend**: React, TypeScript, Tailwind CSS, Vite
- **Backend**: Fastify, TypeScript, Prisma
- **Database**: SQLite (expandable to PostgreSQL)
- **State Management**: React Query, Zustand

## Getting Started

### Prerequisites
- Node.js 18+ and npm

### Installation

```bash
# Install dependencies
npm install

# Set up backend database
cd packages/backend
npx prisma generate
npx prisma migrate dev --name init

# Return to root
cd ../..
```

### Development

Run both backend and frontend in development mode:

```bash
# Option 1: Run both together
npm run dev

# Option 2: Run separately in different terminals
npm run backend   # Terminal 1
npm run frontend  # Terminal 2
```

The app will be available at:
- Frontend: http://localhost:5173
- Backend API: http://localhost:3000

### Database Management

```bash
# Generate Prisma client
npm run db:generate

# Create migration
npm run db:migrate

# Open Prisma Studio (database GUI)
npm run db:studio
```

## Project Structure

```
agenda-management/
├── packages/
│   ├── backend/          # Fastify API server
│   │   ├── prisma/       # Database schema and migrations
│   │   └── src/          # API routes, services, schemas
│   └── frontend/         # React application
│       └── src/          # Components, pages, hooks
└── package.json          # Workspace configuration
```

## Environment Variables

### Backend (`packages/backend/.env`)
```
DATABASE_URL="file:./dev.db"
PORT=3000
DEFAULT_USER_ID="default-user-1"
```

### Frontend (`packages/frontend/.env`)
```
VITE_API_URL=http://localhost:3000/api
```

## License

MIT
