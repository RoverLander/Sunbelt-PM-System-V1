# Technology Stack

**Last Updated:** January 17, 2026
**Version:** 1.4.3
**Maintainer:** Matthew McDaniel

---

## Overview

Sunbelt PM System is built as a modern web application with PWA capabilities, leveraging React for the frontend and Supabase for the backend infrastructure.

---

## Frontend Stack

### Core Framework

- **React** `18.3.1` - UI library with hooks and functional components
- **React Router** `6.x` - Client-side routing
- **Vite** `5.x` - Build tool and dev server (replaces Create React App)

### UI Libraries

- **Lucide React** `^0.263.1` - Icon library (lightweight, tree-shakeable)
- **date-fns** `^2.30.0` - Date manipulation and formatting
- **React Flow** `@xyflow/react ^12.x` - Workflow visualization (Kanban, graphs)

### PWA & Offline

- **Vite Plugin PWA** `^0.21.1` - Service worker generation
- **Workbox** `^7.0.0` - Offline caching strategies
- **IDB** `^8.0.0` - IndexedDB wrapper for offline storage

### Data Fetching & Real-Time

- **Supabase JS** `@supabase/supabase-js ^2.x` - Backend SDK (auth, database, storage, real-time)

### File Processing

- **ExcelJS** `^4.3.0` - Excel export with styling
- **jsPDF** `^2.x` - PDF generation (RFI logs, reports)
- **Compressor.js** `^1.2.1` - Image compression for uploads

---

## Backend Stack

### Database & Auth

- **Supabase** - PostgreSQL + Row Level Security (RLS)
- **PostgreSQL** `15.x` - Relational database
- **Supabase Auth** - JWT-based authentication
- **Supabase Storage** - File storage with CDN

### Edge Functions

- **Deno Runtime** - Serverless functions for custom logic
- **Worker Auth** - Custom PIN-based authentication for factory workers

---

## Development Tools

### Code Quality

- **ESLint** `^8.x` - JavaScript linting
- **Prettier** `^3.x` - Code formatting
- **@welldone-software/why-did-you-render** (dev) - React performance profiling

### Testing (Future Implementation)

- **Vitest** `^1.x` - Unit test runner (Vite-native)
- **@testing-library/react** `^14.x` - Component testing
- **@testing-library/user-event** `^14.x` - User interaction simulation
- **Playwright** (planned) - End-to-end testing

### Build & Deployment

- **Vite** - Production builds with code splitting
- **Vite Plugin Visualizer** - Bundle size analysis
- **Netlify** (or similar) - Frontend hosting
- **Supabase Cloud** - Backend hosting

---

## Styling Approach

### CSS Architecture

- **CSS Custom Properties (Variables)** - Theme colors, spacing, shadows
- **Inline Styles** - Dynamic values (status colors, computed dimensions)
- **Component CSS** - Scoped styles in `App.css`
- **NO preprocessor** (Sass/Less) - Native CSS only
- **NO utility framework** (Tailwind) - Custom approach for bundle optimization

### Example Pattern

```javascript

```
