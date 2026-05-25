# Carupa Glamping - Plataforma de Reservas

## Overview

This is a glamping (luxury camping) booking platform for "Carupa Glamping," a retreat located in Carmen de Carupa, Cundinamarca, Colombia. The application allows users to browse different glamping accommodations (domos), view plans assigned to each domo, and complete bookings. The site features a Spanish-language interface with a warm, earthy design aesthetic targeting couples seeking romantic getaways and nature experiences.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter (lightweight React router)
- **State Management**: TanStack React Query for server state
- **Styling**: Tailwind CSS v4 with CSS variables for theming
- **UI Components**: shadcn/ui component library (New York style)
- **Animations**: Framer Motion for page transitions and micro-interactions
- **Carousel**: Embla Carousel for image galleries
- **Build Tool**: Vite

### Backend Architecture
- **Runtime**: Node.js with Express
- **Language**: TypeScript (ESM modules)
- **API Style**: REST endpoints under `/api/` prefix
- **Development**: Hot module replacement via Vite middleware

### Data Layer
- **Database**: PostgreSQL (Neon-backed cloud database via DATABASE_URL)
- **Reservation Storage**: All reservations stored in PostgreSQL `reservas` table with proper parameterized queries ($1, $2 syntax)
- **ORM**: Drizzle ORM with PostgreSQL dialect for future schema evolution
- **Schema Validation**: Zod with drizzle-zod integration
- **Schema Location**: `shared/schema.ts` contains database table definitions
- **Timezone**: All dates synchronized to Bogotá, Colombia (UTC-5) using T12:00:00 suffix format

### Key Design Patterns
- **Monorepo Structure**: Client (`client/`), Server (`server/`), and Shared (`shared/`) directories
- **Path Aliases**: `@/` for client source, `@shared/` for shared code, `@assets/` for attached assets
- **Component Organization**: Feature components in `components/`, reusable UI in `components/ui/`
- **Static Data**: Camping types and add-ons defined in `client/src/lib/data.ts`
- **Dynamic Plans**: Plans are stored in `server/api/plans.json` and managed via Admin panel

### Dynamic Plan Management System
- **Storage**: Plans stored in `server/api/plans.json`
- **Plan Types**: 
  - Normal: Always available
  - Temporada: Date-restricted (max 2 months), shown only during valid date range
  - Preventa: Shows PREVENTA badge on booking page
- **API Endpoints**:
  - GET /api/plans - List all plans
  - GET /api/plans/active - List only active plans (filtered by date for temporada)
  - POST /api/plans - Create new plan
  - PUT /api/plans/:id - Update existing plan
  - PATCH /api/plans/:id/toggle - Toggle active/inactive
  - DELETE /api/plans/:id - Delete plan
- **Admin Panel**: "Gestión de Planes" tab with full CRUD interface
- **Plan Properties**: id, nombre, eslogan, descripcion, tipo, icono, color, estado, preventa, fechaInicio, fechaFin, precios (per camping type), incluye (features list)
- **Icon Options**: Sparkles, Heart, Film, Star, Sun, Moon, TreePine, Mountain, Flame, Gift, Tag

### Unit Block System (Inhabilitar Unidades)
- **Storage**: `server/api/unit-blocks.json` 
- **API Endpoints**:
  - GET /api/unit-blocks - List all unit blocks
  - POST /api/unit-blocks - Create new unit block (unitName, motivo, fechaInicio, fechaFin)
  - DELETE /api/unit-blocks/:id - Remove unit block
- **Date handling**: Dates normalized to T12:00:00 format; null dates = indefinite block
- **Validation**: Overlap check uses booking date range (not current date) against block ranges
- **Admin Panel**: "Inhabilitar Unidades" tab with CRUD interface
- **Booking Page**: Blocked units show red overlay with Lock icon and motivo text; cannot be selected

### Build System
- **Development**: `tsx` for running TypeScript server, Vite dev server for client
- **Production**: esbuild bundles server to CJS, Vite builds client to `dist/public`
- **Database Migrations**: Drizzle Kit with `db:push` command

## External Dependencies

### Database
- **PostgreSQL**: Primary database (configured via `DATABASE_URL` environment variable)
- **connect-pg-simple**: PostgreSQL session store for Express sessions

### Frontend Libraries
- **@tanstack/react-query**: Async state management and API caching
- **@radix-ui/***: Accessible primitive components (dialog, popover, select, etc.)
- **date-fns**: Date manipulation and formatting (Spanish locale support)
- **class-variance-authority**: Component variant management
- **cmdk**: Command palette component

### Development Tools
- **@replit/vite-plugin-runtime-error-modal**: Error overlay for development
- **@replit/vite-plugin-cartographer**: Replit-specific development tooling
- **drizzle-kit**: Database schema management and migrations

### Fonts
- **Google Fonts**: Playfair Display (serif headings) and Montserrat (sans-serif body text)