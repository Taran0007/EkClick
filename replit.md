# Ek Click A2Z Solutions ("E-Click") Multi-Vendor Delivery Platform

## Overview

This is a comprehensive multi-vendor delivery platform built with modern web technologies. The system supports multiple user roles (admin, vendor, delivery personnel, and customers) with role-based dashboards and real-time features including chat, order tracking, and WebSocket integration.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter for client-side routing
- **State Management**: TanStack Query (React Query) for server state management
- **UI Framework**: Radix UI components with shadcn/ui design system
- **Styling**: TailwindCSS with CSS variables for theming
- **Build Tool**: Vite with HMR support
- **Form Handling**: React Hook Form with Zod validation

### Backend Architecture
- **Runtime**: Node.js with Express.js server
- **Language**: TypeScript with ES modules
- **Authentication**: Passport.js with local strategy and express-session
- **Password Security**: Node.js crypto with scrypt hashing
- **Real-time Communication**: WebSocket integration planned
- **API Design**: RESTful endpoints with role-based access control

### Database Architecture
- **Database**: PostgreSQL (configured via Drizzle)
- **ORM**: Drizzle ORM with schema-first approach
- **Connection**: Neon serverless PostgreSQL with connection pooling
- **Session Storage**: PostgreSQL-based session store
- **Schema Location**: Shared schema definitions in `/shared/schema.ts`

## Key Components

### Authentication System
- JWT-based authentication with secure password hashing
- Role-based access control (admin, vendor, delivery, user)
- Session management with PostgreSQL store
- Protected routes with authentication guards

### User Management
- Multi-role user system with profile management
- Referral system with tracking codes
- User activation/deactivation controls
- Address and contact information management

### Vendor Management
- Vendor onboarding and profile management
- Product catalog management with CRUD operations
- Shop status controls (open/closed)
- Rating and review system integration
- Fee payment status tracking

### Order Management
- Complete order lifecycle tracking
- Status progression from pending to delivered
- Order item management with product relationships
- Delivery personnel assignment
- Real-time order status updates

### Communication System
- Chat functionality between users, vendors, and delivery personnel
- Order-specific conversation threads
- Read status tracking for messages
- WebSocket integration for real-time messaging

### Dispute Resolution
- Dispute creation and management system
- Priority levels and status tracking
- Admin resolution workflow
- Order-related dispute linking

### Coupon and Referral System
- Coupon creation with usage limits and expiry
- Referral code generation and tracking
- Usage analytics and reporting
- Discount application logic

## Data Flow

### User Registration/Authentication Flow
1. User submits registration data via frontend form
2. Data validated using Zod schemas on both client and server
3. Password hashed using scrypt before database storage
4. User profile created with role assignment
5. Session established using Passport.js
6. JWT token issued for authenticated requests

### Order Processing Flow
1. Customer places order through user dashboard
2. Order created with pending status
3. Vendor receives notification and confirms order
4. Order status progresses through preparation stages
5. Delivery personnel assigned and notified
6. Real-time tracking updates via WebSocket
7. Order completion and review collection

### Real-time Communication Flow
1. WebSocket connection established on dashboard load
2. Chat messages sent via REST API and broadcast via WebSocket
3. Order status updates pushed to relevant users
4. Notification system for important events

## External Dependencies

### Core Dependencies
- **@neondatabase/serverless**: PostgreSQL connection handling
- **drizzle-orm**: Database ORM and query builder
- **passport**: Authentication middleware
- **express-session**: Session management
- **connect-pg-simple**: PostgreSQL session store

### UI Dependencies
- **@radix-ui/***: Headless UI components
- **@tanstack/react-query**: Server state management
- **react-hook-form**: Form handling and validation
- **@hookform/resolvers**: Zod integration for forms
- **tailwindcss**: Utility-first CSS framework
- **class-variance-authority**: Component variant management

### Development Dependencies
- **vite**: Build tool and development server
- **typescript**: Type safety and development experience
- **tsx**: TypeScript execution for development
- **esbuild**: Production build bundling

## Deployment Strategy

### Development Environment
- Vite development server with HMR
- TSX for running TypeScript server code
- Database migrations via Drizzle Kit
- Environment-specific configuration

### Production Build Process
1. Frontend built using Vite to `dist/public`
2. Backend bundled using esbuild to `dist/index.js`
3. Database schema pushed using Drizzle Kit
4. Static assets served from build directory

### Environment Configuration
- Database connection via `DATABASE_URL` environment variable
- Session security via `SESSION_SECRET` environment variable
- Development vs production environment detection
- Replit-specific development tools integration

### Database Management
- Schema definitions in shared TypeScript files
- Migration generation and execution via Drizzle Kit
- Connection pooling for production scalability
- Session storage in PostgreSQL for persistence