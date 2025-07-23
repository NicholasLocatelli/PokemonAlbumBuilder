# Pokemon Card Album

## Overview

This is a full-stack web application for creating and managing Pokemon card albums. The application allows users to create digital card binders, organize Pokemon cards in customizable grid layouts, and manage their collections with authentication. It features a modern React frontend with drag-and-drop functionality, a Node.js Express backend, and PostgreSQL database integration via Drizzle ORM.

## User Preferences

Preferred communication style: Simple, everyday language.
Recent request: Complete user account management system with advanced authentication features (asked in Italian).

## System Architecture

The application follows a monorepo structure with clearly separated client and server codebases, utilizing modern TypeScript throughout. The architecture is designed for both local development and cloud deployment, with flexible database configuration supporting both Neon serverless PostgreSQL (for Replit) and standard PostgreSQL connections.

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite for development and production builds
- **Styling**: Tailwind CSS with shadcn/ui component library
- **State Management**: TanStack Query (React Query) for server state
- **Routing**: Wouter for client-side routing
- **Drag & Drop**: react-dnd with HTML5 backend
- **Form Handling**: React Hook Form with Zod validation

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **Database ORM**: Drizzle ORM with PostgreSQL dialect
- **Authentication**: Passport.js with local strategy and session-based auth
- **Session Storage**: Configurable between PostgreSQL and in-memory stores

## Key Components

### Database Schema
- **Users**: Enhanced authentication with email/username, password hashing with bcrypt, email verification, account preferences, activity tracking
- **Albums**: User-owned collections with customizable grid layouts (4, 9, or 12 cards)
- **Pages**: Individual pages within albums containing card arrangements
- **Cards**: Pokemon card data fetched from external API
- **Email Verification Tokens**: Secure tokens for email verification process
- **Password Reset Tokens**: Secure tokens for password recovery
- **Social Connections**: OAuth integration for social login providers
- **User Activity Log**: Comprehensive audit trail for security and user activity tracking

### Authentication System
- Enhanced email/username authentication via Passport.js with bcrypt password hashing
- Session-based authentication with PostgreSQL session storage
- Email verification system with SendGrid integration
- Password recovery with secure token-based reset system
- Rate limiting for login/registration/password reset attempts
- Account lockout protection against brute force attacks
- User profile management with avatar upload support
- Account deactivation and deletion capabilities
- Activity logging for security audit trail
- Protected routes for user-specific features

### Card Management
- Integration with Pokemon TCG API for card data
- Advanced search with filtering by sets, names, and card numbers
- Drag-and-drop card arrangement within album pages
- Support for regional variants and set-specific card numbering

### UI Components
- Responsive design with mobile-first approach
- Dark/light theme support via CSS custom properties
- Comprehensive component library built on Radix UI primitives
- Form validation with real-time feedback

## Data Flow

1. **Authentication Flow**: Users register/login → session created → user data cached in React Query
2. **Album Creation**: User creates album → stored in database → appears in user's album list
3. **Card Search**: User searches Pokemon cards → external API call → results displayed with pagination
4. **Card Management**: User adds/moves cards → optimistic updates → database synchronization
5. **Page Navigation**: Album pages created on-demand → cached in React Query for performance

## External Dependencies

### Core Dependencies
- **Database**: PostgreSQL with Neon serverless support
- **Pokemon Data**: Pokemon TCG API for card information and images
- **Email**: SendGrid for password reset functionality (optional)
- **Authentication**: Passport.js ecosystem for auth strategies

### Development Tools
- **Testing**: Vitest with React Testing Library
- **Type Checking**: TypeScript with strict configuration
- **Code Quality**: ESLint configuration (implied by package structure)
- **Database Management**: Drizzle Kit for migrations and schema management

## Deployment Strategy

### Environment Detection
The application automatically detects deployment environment:
- **Replit Environment**: Uses Neon serverless PostgreSQL with WebSocket connections
- **Local Development**: Supports standard PostgreSQL connections
- **Production**: Node.js production mode with optimized builds

### Build Process
1. **Frontend**: Vite builds React app to `dist/public`
2. **Backend**: esbuild bundles server code to `dist/index.js`
3. **Database**: Drizzle migrations ensure schema consistency
4. **Assets**: Static files served by Express in production

### Configuration Management
- Environment-specific database connection handling
- Graceful fallback to in-memory storage when database unavailable
- Session configuration adapts to deployment environment
- CORS and security settings adjust based on NODE_ENV

The application is designed to be easily deployable on platforms like Replit while maintaining full compatibility with traditional hosting environments.