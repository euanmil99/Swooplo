# Social Affiliate Pro - Replit Project Guide

## Overview

Social Affiliate Pro is a full-stack web application designed for managing social media affiliate marketing campaigns. It's built as a modern single-page application (SPA) with a React frontend and Express backend, using PostgreSQL for data persistence. The application helps users connect social media accounts, manage affiliate networks, create marketing campaigns, track performance analytics, and monitor earnings.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite for fast development and optimized production builds
- **UI Library**: shadcn/ui components built on Radix UI primitives
- **Styling**: Tailwind CSS with CSS custom properties for theming
- **State Management**: TanStack Query (React Query) for server state management
- **Routing**: Wouter for lightweight client-side routing
- **Forms**: React Hook Form with Zod validation

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **Database ORM**: Drizzle ORM for type-safe database operations
- **Database**: PostgreSQL (configured for Neon serverless)
- **Session Management**: Connect-pg-simple for PostgreSQL session storage
- **API Design**: RESTful API with JSON responses

### Development Setup
- **Environment**: Replit with Node.js 20 runtime
- **Development Mode**: Vite dev server with HMR and Express API server
- **Build Process**: Vite for frontend, esbuild for backend bundling
- **Database Migrations**: Drizzle Kit for schema management

## Key Components

### Database Schema (shared/schema.ts)
The application uses a comprehensive relational database schema with the following main entities:
- **Users**: Core user authentication and profile data
- **Social Accounts**: Connected social media platforms (Twitter, Snapchat, Instagram)
- **Affiliate Networks**: Connected affiliate programs (ClickBank, Amazon, ShareASale)
- **Products**: Available products from affiliate networks
- **Campaigns**: Marketing campaigns linking products to social platforms
- **Affiliate Links**: Trackable shortened URLs for campaigns
- **Social Posts**: Social media content with performance tracking
- **Earnings**: Financial tracking and commission records

### Frontend Pages
- **Dashboard**: Overview with stats, active campaigns, and quick actions
- **Social Accounts**: Platform connection and management
- **Campaigns**: Campaign creation, editing, and monitoring
- **Affiliate Links**: Link generation and performance tracking
- **Analytics**: Detailed performance metrics and charts
- **Earnings**: Financial reporting and payout tracking
- **Settings**: User preferences and API configurations

### Backend Routes (server/routes.ts)
RESTful API endpoints covering:
- Dashboard statistics and metrics
- Social account CRUD operations and connection management
- Campaign lifecycle management
- Affiliate link generation and tracking
- Analytics data aggregation
- Earnings and financial reporting

### Storage Layer (server/storage.ts)
Abstract storage interface defining data access patterns for all entities, designed to work with Drizzle ORM and PostgreSQL.

## Data Flow

1. **User Authentication**: Session-based authentication with PostgreSQL session storage
2. **Social Platform Integration**: OAuth-style connections stored with access/refresh tokens
3. **Campaign Creation**: Users select products from connected affiliate networks and target social platforms
4. **Link Generation**: Automated creation of trackable affiliate links for campaigns
5. **Performance Tracking**: Real-time monitoring of clicks, conversions, and earnings
6. **Analytics Aggregation**: Data processing for dashboard statistics and reporting

## External Dependencies

### UI and Styling
- **Radix UI**: Headless UI primitives for accessibility and keyboard navigation
- **Tailwind CSS**: Utility-first CSS framework with custom theme configuration
- **Lucide React**: Modern icon library
- **React Icons**: Additional social platform icons

### Data Management
- **TanStack Query**: Server state synchronization and caching
- **React Hook Form**: Form state management and validation
- **Zod**: Runtime type validation and schema parsing
- **date-fns**: Date manipulation and formatting

### Database and API
- **Drizzle ORM**: Type-safe SQL query builder and schema management
- **@neondatabase/serverless**: Serverless PostgreSQL client
- **connect-pg-simple**: PostgreSQL session store for Express

### Development Tools
- **Vite**: Frontend build tool with HMR and plugin ecosystem
- **esbuild**: Fast JavaScript bundler for backend
- **TypeScript**: Static type checking across the entire stack

## Deployment Strategy

### Development Environment
- **Platform**: Replit with integrated PostgreSQL database
- **Port Configuration**: Frontend serves on port 5000, proxied to port 80
- **Auto-reload**: Vite HMR for frontend, tsx watch mode for backend
- **Database**: Automatic Replit PostgreSQL provisioning

### Production Build
- **Frontend**: Vite production build with code splitting and optimization
- **Backend**: esbuild bundle with external dependency handling
- **Static Assets**: Served directly by Express in production mode
- **Database**: Environment-based DATABASE_URL configuration

### Deployment Configuration
- **Build Command**: `npm run build` (Vite + esbuild)
- **Start Command**: `npm run start` (production mode)
- **Database Migrations**: `npm run db:push` for schema deployment
- **Scaling**: Configured for Replit autoscale deployment target

## User Preferences

Preferred communication style: Simple, everyday language.

## Recent Changes

- June 19, 2025: Web-Wide Distribution Network implemented
  - Strategic affiliate placement across the entire internet ecosystem
  - Comprehensive target analysis covering forums, Q&A sites, review platforms
  - Platform-specific content strategies for maximum conversion rates
  - Automated content scheduling and distribution across high-value web properties
  - Performance tracking and optimization across multiple traffic sources
  - Compliance guidelines and disclosure management for each platform
  - Content automation with smart suggestions and engagement monitoring
- June 19, 2025: Advanced A/B Testing & Fraud Protection implemented
  - Intelligent split testing system with statistical confidence tracking
  - Real-time winner detection and traffic optimization
  - Comprehensive fraud detection with pattern analysis and bot filtering
  - Geographic and device-based suspicious activity monitoring
  - Advanced security features including IP limiting and velocity controls
- June 19, 2025: Link Intelligence & Optimization implemented
  - AI-powered performance analysis with actionable insights
  - Geographic targeting recommendations based on conversion data
  - Device optimization suggestions for mobile vs desktop traffic
  - Timing analysis for optimal posting schedules
  - Security insights with bot traffic identification and blocking
- June 19, 2025: Clever Smart Affiliate Link System implemented
  - Intelligent link management with advanced tracking and optimization
  - Smart URL rotation for A/B testing different affiliate networks
  - Geographic and device-based targeting for maximum conversions
  - Link cloaking system to hide affiliate parameters professionally
  - Bot protection and fraud prevention mechanisms
  - QR code generation for offline marketing campaigns
  - Scheduled link activation and expiration features
  - Real-time analytics with conversion rate optimization
  - Anti-detection features to maintain link performance
- June 19, 2025: AI-powered content generation implemented
  - OpenAI GPT-4o integration for social media post creation
  - Platform-specific content optimization (Twitter, Instagram, Snapchat)
  - Multiple tone options (casual, professional, exciting, friendly)
  - Content variations generator for A/B testing
  - Character limit tracking and platform-specific formatting
  - Hashtag and emoji inclusion controls
  - One-click copy to clipboard functionality
- June 18, 2025: Complete 3-tier subscription system implemented
  - Basic ($29/mo): 5 campaigns, 2 social accounts, 50 affiliate links/month
  - Pro ($79/mo): 25 campaigns, 10 social accounts, 500 affiliate links/month  
  - Enterprise ($199/mo): Unlimited access with priority support
  - Stripe payment integration with secure subscription management
  - Subscription limits enforcement and upgrade/downgrade functionality
  - Comprehensive API rate limits documentation for all integrated services
- June 18, 2025: Initial platform setup with full affiliate marketing automation

## API Rate Limits Summary

**Twitter API v2:**
- Tweet creation: 300 per 15-minute window
- User/timeline lookup: 300 requests per 15-minute window
- Engagement metrics: 75 requests per 15-minute window
- Note: Limits vary by access tier (Essential $0, Elevated $100/mo, Premium $5,000/mo)

**Snapchat Marketing API:**
- Campaign management: 1,000 requests per hour
- Audience insights: 100 requests per hour
- Reporting: 500 requests per hour
- Note: Requires business verification and minimum ad spend

**Instagram Basic Display:**
- Media publishing: 25 requests per hour
- Media/User insights: 200 requests per hour
- Note: Business API requires app review for advanced features

**ClickBank Affiliate API:**
- Product search: 1,000 requests per hour
- Order tracking: 10,000 requests per hour
- Link generation: Unlimited (reasonable use)
- Note: Requires approved affiliate account, may have usage fees

**Amazon Product Advertising API:**
- All operations: 8,640 requests per day (1 per 10 seconds)
- Note: Requires Associates account with recent sales activity