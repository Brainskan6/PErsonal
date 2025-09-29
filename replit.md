# Financial Planning Report Generator

## Overview

A comprehensive financial planning application that enables users to input detailed client financial data, select appropriate financial strategies from a curated bank, and generate professional financial planning reports. The application features a three-panel layout with client data entry, strategy selection, and real-time report preview capabilities.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript using Vite for build tooling
- **Styling**: Tailwind CSS with shadcn/ui component library for consistent design
- **State Management**: React Query (TanStack Query) for server state and React hooks for local state
- **Routing**: Wouter for lightweight client-side routing
- **Form Handling**: React Hook Form with Zod validation for type-safe form management
- **UI Components**: Radix UI primitives with custom styling through shadcn/ui

### Backend Architecture
- **Runtime**: Node.js with Express.js server
- **Type Safety**: TypeScript throughout the entire stack
- **API Design**: RESTful endpoints for client data, strategies, and reports
- **Validation**: Zod schemas shared between frontend and backend for consistent validation
- **Storage**: In-memory storage implementation with interface for future database integration

### Data Storage Solutions
- **Current**: MemStorage class providing in-memory data persistence during development
- **Database Ready**: Drizzle ORM configured for PostgreSQL with migration support
- **Schema Design**: Structured tables for client data, strategies, reports, and configuration mappings

### Authentication and Authorization
- **Current State**: No authentication implemented (development phase)
- **Session Management**: Connect-pg-simple configured for future PostgreSQL session store
- **Security**: CORS and request validation in place for API endpoints

### Component Architecture
- **Layout System**: Three-panel responsive design (form input, strategy selection, report preview)
- **Form Structure**: Multi-section client data form with conditional fields and validation
- **Strategy Management**: Dynamic strategy bank with filtering, selection, and configuration
- **Report Generation**: Real-time preview with export capabilities

### Design System
- **Theme**: Professional utility-focused design inspired by productivity tools
- **Colors**: Dual-mode (light/dark) color system with CSS custom properties
- **Typography**: Inter font family for clean, professional readability
- **Spacing**: Tailwind's systematic spacing scale for consistent layouts
- **Components**: Comprehensive UI component library with consistent styling patterns

## External Dependencies

### UI and Styling
- **Tailwind CSS**: Utility-first CSS framework for styling
- **Radix UI**: Unstyled accessible UI primitives
- **Lucide React**: Icon library for consistent iconography
- **Class Variance Authority**: Utility for creating variant-based component APIs

### Data and State Management
- **TanStack React Query**: Server state management and caching
- **React Hook Form**: Form state management and validation
- **Zod**: Runtime type validation and schema definition
- **Drizzle ORM**: Type-safe database toolkit for PostgreSQL

### Development and Build Tools
- **Vite**: Fast build tool and development server
- **TypeScript**: Static type checking and enhanced developer experience
- **ESBuild**: Fast JavaScript bundler for production builds
- **PostCSS**: CSS processing for Tailwind and autoprefixer

### Database and Storage
- **Neon Database**: Serverless PostgreSQL provider (configured but not actively used)
- **Connect-pg-Simple**: PostgreSQL session store for Express sessions
- **Drizzle Kit**: Database migration and introspection tools

### Utilities and Helpers
- **clsx**: Utility for constructing className strings conditionally
- **date-fns**: Date manipulation and formatting library
- **nanoid**: URL-safe unique string ID generator
- **wouter**: Minimalist routing library for React