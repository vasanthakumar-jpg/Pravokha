# 🛍️ Pravokha - Multi-Dealer E-Commerce Marketplace

[![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)](https://github.com/your-repo)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![Security](https://img.shields.io/badge/security-8.5%2F10-brightgreen.svg)](docs/security_audit.md)
[![Status](https://img.shields.io/badge/status-production--ready-success.svg)](https://github.com/your-repo)

A professional, production-ready **multi-vendor marketplace platform** enabling customers to shop from multiple sellers, dealers to manage their inventory, and administrators to oversee the entire platform.

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Key Features](#-key-features)
- [Technology Stack](#-technology-stack)
- [Architecture](#-architecture)
- [Getting Started](#-getting-started)
- [Project Structure](#-project-structure)
- [Database Schema](#-database-schema)
- [API Documentation](#-api-documentation)
- [User Roles](#-user-roles)
- [Security Features](#-security-features)
- [Admin Operations](#-admin-operations)
- [Deployment](#-deployment)
- [Contributing](#-contributing)

---

## 🎯 Overview

### What is Pravokha?

Pravokha is a **full-stack multi-dealer marketplace** that provides:

- 🛒 **For Customers**: Browse and purchase products from multiple verified sellers
- 🏪 **For Dealers/Sellers**: List, manage, and sell products with integrated payment processing
- 👨‍💼 **For Administrators**: Complete platform oversight, user management, and content moderation

### Business Model

- **Multi-Vendor Platform**: Multiple independent sellers operate under one unified marketplace
- **Commission-Based**: 10% platform commission on all transactions
- **Data Isolation**: Each dealer's inventory and sales data are strictly separated
- **Role-Based Access Control (RBAC)**: Granular permissions for Users, Dealers, and Admins

### Key Metrics

- 🔒 **Security Rating**: 8.5/10 (Production-Ready)
- 📊 **30+ Database Models**: Comprehensive data architecture
- 🔌 **100+ API Endpoints**: RESTful API design
- ⚡ **Real-time Updates**: Live inventory and order tracking

---

## ✨ Key Features

### 🔐 Authentication & Security
- JWT-based authentication with bcrypt password hashing (10 rounds)
- Google OAuth integration
- Role-based access control (RBAC)
- Account suspension system
- Secure password reset flow
- Session management with token invalidation

### 📦 Product Management
- **CRUD Operations**: Complete product lifecycle management
- **Variants System**: Multiple colors and sizes per product
- **Real-time Inventory**: Stock tracking and low-stock alerts
- **SKU Generation**: Automatic unique product identifiers
- **Category Hierarchy**: Organized categories and subcategories
- **Product Verification**: Admin approval workflow
- **Image Gallery**: Multiple product images with CDN support
- **Pricing Engine**: Regular price, discount price, commission calculation

### 🛒 Shopping Experience
- Advanced product search and filtering
- Category-based browsing
- Wishlist functionality
- Shopping cart with real-time updates
- Product reviews and ratings (5-star system)
- "New Arrivals" and "Hot Deals" sections

### 📋 Order Management
- **Multi-vendor Order Splitting**: Single checkout for multiple sellers
- **Dynamic Fees**: Shipping and tax rates fetched directly from `SiteSetting` model
- **Order Lifecycle**: Pending → Processing → Packed → Shipped → Delivered
- **Real-time Tracking**: Order status updates with email notifications
- **Payment Integration**: Razorpay payment processing
- **Order History**: Complete order records for users and sellers
- **Fulfillment Dashboard**: Seller interface for order processing
- **Cancellation & Refunds**: User and admin-initiated cancellations

### 🏪 Seller/Dealer Portal
- **Analytics Dashboard**: Sales statistics and revenue tracking
- **Restricted Field Updates**: Title and Category changes require Admin approval
- **Inventory Management**: Product listing and stock management
- **Order Fulfillment**: Process and ship orders
- **Payout System**: Secure earnings withdrawal with 7-day cooling-off logic
- **Bulk Upload**: Excel-based product import
- **Verification Tracking**: Monitor dealer application status

### 👨‍💼 Admin Panel
- **User Management**: View, edit, suspend/activate users
- **Dealer Verification**: Approve/reject seller applications
- **Category Management**: CRUD for categories and subcategories
- **Product Moderation**: Verify/reject products and approve update requests
- **Order Oversight**: `ADMIN` role expanded to manage all marketplace orders
- **Payout Management**: Approve seller withdrawal requests
- **Platform Analytics**: Sales, revenue, and user statistics
- **Audit Logs**: Centralized `AuditService` tracking all admin telemetry
- **Support System**: Manage customer support tickets
- **Combo Offers**: Create promotional product bundles

### 💳 Payment & Payouts
- **Stripe Integration**: PCI-compliant payment processing
- **Webhook Handling**: Automated payment confirmation
- **Commission Calculation**: Automatic 10% platform fee deduction
- **Payout System**: Secure seller earnings withdrawal
- **Transaction History**: Complete payment records

### 🎫 Support System
- Support ticket management
- Live chat conversations
- Admin assignment and resolution tracking
- Email notifications for ticket updates

---

## 🚀 Technology Stack

### Frontend Technologies

#### **Core Framework**
| Technology | Version | Purpose |
|-----------|---------|---------|
| ![React](https://img.shields.io/badge/React-18.3.1-61DAFB?logo=react) | ^18.3.1 | UI Library |
| ![TypeScript](https://img.shields.io/badge/TypeScript-5.8.3-3178C6?logo=typescript) | ^5.8.3 | Type Safety |
| ![Vite](https://img.shields.io/badge/Vite-5.4.19-646CFF?logo=vite) | ^5.4.19 | Build Tool |

#### **UI Framework & Styling**
| Technology | Version | Purpose |
|-----------|---------|---------|
| ![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.4.17-06B6D4?logo=tailwindcss) | ^3.4.17 | Utility-first CSS |
| Radix UI (Complete Suite) | Latest | Accessible Components |
| shadcn/ui | Latest | Custom Component Library |
| Framer Motion | ^11.18.2 | Animation Library |
| GSAP | ^3.13.0 | Advanced Animations |
| Lucide React | ^0.462.0 | Icon Library |
| next-themes | ^0.3.0 | Dark Mode Support |

**Radix UI Components Used:**
- Accordion, Alert Dialog, Avatar, Checkbox, Collapsible
- Context Menu, Dialog, Dropdown Menu, Hover Card
- Label, Menubar, Navigation Menu, Popover, Progress
- Radio Group, Scroll Area, Select, Separator, Slider
- Switch, Tabs, Toast, Toggle, Tooltip

#### **State Management & Data**
- **React Context API**: Global state management (Auth, Cart, Theme)
- **TanStack React Query** ^5.83.0: Server state & caching
- **Axios** ^1.13.2: HTTP client

#### **Routing & Navigation**
- **React Router DOM** ^6.30.1: Client-side routing with protected routes

#### **Form Management**
- **React Hook Form** ^7.61.1: Form state management
- **Zod** ^3.25.76: Schema validation
- **@hookform/resolvers** ^3.10.0: RHF + Zod integration

#### **Integrations**
| Integration | Technology | Purpose |
|------------|-----------|---------|
| Payments | @stripe/react-stripe-js ^5.4.1 | Stripe checkout |
| Authentication | @react-oauth/google ^0.13.4 | Google OAuth |
| Data Visualization | Recharts ^2.15.4 | Charts & Analytics |

#### **Utilities**
- **date-fns** ^3.6.0: Date manipulation
- **class-variance-authority** ^0.7.1: CSS variant management
- **clsx** ^2.1.1: Conditional className utility
- **react-dropzone** ^14.3.8: File upload
- **jspdf** ^3.0.4 + **jspdf-autotable** ^5.0.2: PDF generation
- **xlsx** ^0.18.5: Excel file handling
- **embla-carousel-react** ^8.6.0: Carousel component
- **sonner** ^1.7.4: Toast notifications
- **cmdk** ^1.1.1: Command palette
- **vaul** ^0.9.9: Bottom sheet/drawer

---

### Backend Technologies

#### **Core Framework**
| Technology | Version | Purpose |
|-----------|---------|---------|
| ![Node.js](https://img.shields.io/badge/Node.js-LTS-339933?logo=node.js) | LTS | Runtime Environment |
| ![Express](https://img.shields.io/badge/Express-4.18.2-000000?logo=express) | ^4.18.2 | Web Framework |
| ![TypeScript](https://img.shields.io/badge/TypeScript-5.3.3-3178C6?logo=typescript) | ^5.3.3 | Type Safety |

#### **Database & ORM**
| Technology | Version | Purpose |
|-----------|---------|---------|
| ![Prisma](https://img.shields.io/badge/Prisma-5.22.0-2D3748?logo=prisma) | ^5.22.0 | ORM & Type-safe DB Access |
| ![MySQL](https://img.shields.io/badge/MySQL-8.0+-4479A1?logo=mysql) | 8.0+ | Relational Database |

#### **Authentication & Security**
- **jsonwebtoken** ^9.0.2: JWT generation/validation
- **bcryptjs** ^2.4.3: Password hashing (10 salt rounds)
- **helmet** ^7.1.0: Security HTTP headers
- **cors** ^2.8.5: Cross-origin resource sharing
- **express-rate-limit** ^7.1.5: API rate limiting
- **google-auth-library** ^10.5.0: Google OAuth verification
- **Zod** ^3.22.4: Request validation schemas

#### **Payment Processing**
- **Stripe** ^20.1.2: Payment gateway with webhook support

#### **File Handling**
- **multer** ^2.0.2: Multipart form data & file uploads

#### **Email**
- **nodemailer** ^7.0.12: Transactional email delivery

#### **Development Tools**
- **nodemon** ^3.0.2: Auto-restart on file changes
- **ts-node** ^10.9.2: TypeScript execution
- **morgan** ^1.10.0: HTTP request logger
- **dotenv** ^16.3.1: Environment variable management

#### **Testing**
- **Jest** ^29.7.0: Testing framework
- **ts-jest** ^29.1.1: TypeScript support for Jest

---

### Infrastructure & Services

| Service | Purpose |
|---------|---------|
| **MySQL** | Primary relational database |
| **Stripe** | PCI-compliant payment processing |
| **Cloud Storage** | Image/file storage (Cloudinary/AWS S3) |
| **SMTP Service** | Transactional emails (Gmail/SendGrid) |
| **Google OAuth** | Social authentication |

---

## 🏗️ Architecture

### High-Level System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    CLIENT (Browser)                         │
│                                                             │
│  React + TypeScript + TailwindCSS + Vite                   │
│  - Component-based UI                                       │
│  - Context API (Auth, Cart, Theme)                         │
│  - React Query (Server state)                              │
│  - Protected Routes (RBAC)                                  │
└──────────────────────────┬──────────────────────────────────┘
                           │ HTTP/REST (JSON)
                           │ Authorization: Bearer <JWT>
┌──────────────────────────▼──────────────────────────────────┐
│                   API LAYER (Backend)                       │
│                                                             │
│  Express.js + TypeScript                                    │
│  ┌─────────────────────────────────────────────┐           │
│  │ Middleware Pipeline                         │           │
│  │ - CORS, Helmet, Morgan                     │           │
│  │ - Authentication (JWT verification)         │           │
│  │ - Authorization (RBAC)                     │           │
│  │ - Validation (Zod schemas)                 │           │
│  │ - Rate Limiting                            │           │
│  └─────────────────────────────────────────────┘           │
│  ┌─────────────────────────────────────────────┐           │
│  │ Controllers → Services → Repositories       │           │
│  │ - Auth, Products, Orders, Users            │           │
│  │ - Payments, Payouts, Support               │           │
│  └─────────────────────────────────────────────┘           │
└──────────────────────────┬──────────────────────────────────┘
                           │ Prisma Client
┌──────────────────────────▼──────────────────────────────────┐
│                   DATA LAYER                                │
│                                                             │
│  MySQL Database (30+ Models)                               │
│  - Users, Products, Orders, Payments                       │
│  - Categories, Reviews, Notifications                      │
│  - Audit Logs, Support Tickets                            │
│                                                             │
│  Features:                                                  │
│  ✓ Foreign Keys & Constraints                              │
│  ✓ Cascading Deletes                                       │
│  ✓ Soft Deletes (deletedAt)                               │
│  ✓ Indexes for Performance                                 │
└─────────────────────────────────────────────────────────────┘

External Services:
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│   Stripe     │  │Cloud Storage │  │ Email (SMTP) │
│  (Payments)  │  │ (Images)     │  │ (Nodemailer) │
└──────────────┘  └──────────────┘  └──────────────┘
```

### Application Layers

1. **Presentation Layer (Frontend)**
   - React components with TypeScript
   - Global state management (Context API)
   - Server state caching (React Query)
   - Protected routing based on user roles

2. **API Layer (Backend)**
   - RESTful API design
   - JWT authentication middleware
   - RBAC authorization
   - Input validation with Zod
   - Business logic in service layer

3. **Data Layer**
   - Prisma ORM for type-safe queries
   - MySQL with ACID compliance
   - Migration-based schema versioning

---

## 🚦 Getting Started

### Prerequisites

- **Node.js** >= 18.x
- **npm** >= 9.x
- **MySQL** >= 8.0
- **Stripe Account** (for payments)
- **Gmail/SMTP** (for emails)

### Installation

#### 1. Clone the Repository
```bash
git clone https://github.com/your-username/pravokha.git
cd pravokha
```

#### 2. Backend Setup
```bash
cd backend

# Install dependencies
npm install

# Create .env file
cp .env.example .env

# Edit .env with your configuration:
# - DATABASE_URL
# - JWT_SECRET (32+ characters)
# - STRIPE_SECRET_KEY
# - EMAIL credentials

# Generate Prisma client
npm run prisma:generate

# Run database migrations
npx prisma migrate deploy

# (Optional) Seed test data
npm run seed

# Start development server
npm run dev
```

#### 3. Frontend Setup
```bash
# Return to root directory
cd ..

# Install dependencies
npm install

# Create .env file
cp .env.example .env

# Edit .env with:
# - VITE_API_URL=http://localhost:5000
# - VITE_STRIPE_PUBLIC_KEY
# - VITE_GOOGLE_CLIENT_ID

# Start development server
npm run dev
```

#### 4. Access the Application
- **Frontend**: http://localhost:8081
- **Backend**: http://localhost:5000
- **Prisma Studio**: `npx prisma studio` (Database GUI)

### Default Test Accounts
```
Admin:
  Email: admin@pravokha.com
  Password: admin123

Dealer:
  Email: dealer@pravokha.com
  Password: dealer123

Customer:
  Email: user@pravokha.com
  Password: customer123
```

---

## 📁 Project Structure

```
pravokha-new/
├── backend/
│   ├── src/
│   │   ├── core/
│   │   │   ├── server.ts           # Express server setup
│   │   │   ├── config/
│   │   │   │   └── env.ts          # Environment validation (Zod)
│   │   │   └── router/             # Main API router
│   │   ├── feat/                   # Feature modules
│   │   │   ├── auth/               # Authentication (login, register)
│   │   │   ├── user/               # User management
│   │   │   ├── product/            # Product CRUD
│   │   │   ├── order/              # Order management
│   │   │   ├── payment/            # Stripe integration
│   │   │   ├── payout/             # Seller payouts
│   │   │   ├── category/           # Category management
│   │   │   ├── review/             # Product reviews
│   │   │   ├── support/            # Support tickets
│   │   │   ├── notification/       # Notifications
│   │   │   ├── analytics/          # Platform analytics
│   │   │   ├── admin/              # Admin operations
│   │   │   ├── audit/              # Audit logs
│   │   │   └── webhook/            # Stripe webhooks
│   │   ├── shared/
│   │   │   ├── middleware/
│   │   │   │   ├── auth.ts         # JWT authentication
│   │   │   │   ├── ownership.ts    # Resource ownership checks
│   │   │   │   └── validation.ts   # Zod validation middleware
│   │   │   └── validation/         # Zod schemas
│   │   └── infra/
│   │       ├── database/
│   │       │   └── client.ts       # Prisma client instance
│   │       ├── stripe.ts           # Stripe configuration
│   │       └── email.ts            # Nodemailer config
│   └── prisma/
│       ├── schema.prisma           # Database schema (30+ models)
│       ├── migrations/             # Migration history
│       └── seed.ts                 # Database seeding
│
└── src/                            # Frontend
    ├── core/
    │   ├── context/
    │   │   ├── AuthContext.tsx     # Authentication state
    │   │   ├── CartContext.tsx     # Shopping cart state
    │   │   └── ThemeProvider.tsx   # Dark mode
    │   └── router/
    │       └── AppRoutes.tsx       # Route configuration
    ├── feat/                       # Feature modules
    │   ├── auth/                   # Login, Register pages
    │   ├── user/                   # User profile, settings
    │   ├── products/               # Product catalog
    │   ├── orders/                 # Order history
    │   ├── seller/                 # Seller portal
    │   │   ├── pages/
    │   │   │   ├── SellerDashboard/
    │   │   │   ├── SellerProducts/
    │   │   │   ├── SellerOrders/
    │   │   │   └── SellerProductForm/
    │   │   └── components/
    │   └── admin/                  # Admin panel
    │       ├── pages/
    │       │   ├── AdminDashboard/
    │       │   ├── AdminUsers/
    │       │   ├── AdminProducts/
    │       │   ├── AdminOrders/
    │       │   ├── AdminCategories/
    │       │   ├── AdminPayouts/
    │       │   └── AdminSettings/
    │       └── components/
    ├── layout/
    │   ├── Navbar/
    │   ├── Footer/
    │   └── Sidebar/
    ├── shared/
    │   ├── ui/                     # Reusable components (shadcn/ui)
    │   ├── hook/                   # Custom React hooks
    │   └── utils/                  # Utility functions
    └── infra/
        └── api/
            └── apiClient.ts        # Axios instance with interceptors
```

---

## 🗄️ Database Schema

### Core Models (30+ Total)

#### **User Model**
```prisma
model User {
  id                   String   @id @default(uuid())
  email                String   @unique
  password             String?  // Nullable for OAuth
  googleId             String?  @unique
  role                 Role     @default(USER)  // ADMIN | DEALER | USER
  status               String   @default("active")
  verificationStatus   String   @default("unverified")
  
  // Profile
  name                 String?
  phone                String?
  avatarUrl            String?
  bio                  String?
  dateOfBirth          DateTime?
  
  // Dealer/Seller fields
  storeName            String?
  storeDescription     String?
  gst                  String?
  pan                  String?
  bankAccount          String?
  ifsc                 String?
  
  // Relations
  products             Product[]
  orders               Order[]
  addresses            Address[]
  paymentMethods       PaymentMethod[]
  notifications        Notification[]
  tickets              SupportTicket[]
  payouts              Payout[]
  wishlist             Wishlist[]
  productReviews       ProductReview[]
  auditLogs            AuditLog[]
}
```

#### **Product Model**
```prisma
model Product {
  id            String      @id @default(uuid())
  title         String
  slug          String      @unique
  description   String
  price         Float
  discountPrice Float?
  sku           String?     @unique
  published     Boolean     @default(false)
  isVerified    Boolean     @default(false)  // Admin approval
  isFeatured    Boolean     @default(false)
  isNew         Boolean     @default(false)
  rating        Float       @default(0.0)
  
  categoryId    String?
  subcategoryId String?
  dealerId      String      // Product owner
  
  variants      ProductVariant[]
  orderItems    OrderItem[]
  deletedAt     DateTime?   // Soft delete
}
```

#### **Order Model**
```prisma
model Order {
  id              String        @id @default(uuid())
  orderNumber     String        @unique
  total           Float
  status          OrderStatus   @default(PENDING)
  paymentStatus   PaymentStatus @default(PENDING)
  stripeIntentId  String?       @unique
  
  // Shipping
  customerName    String
  customerEmail   String
  customerPhone   String
  shippingAddress String
  shippingCity    String
  shippingPincode String
  
  userId          String?
  items           OrderItem[]
  
  // Tracking
  trackingNumber  String?
  shippedAt       DateTime?
  deliveredAt     DateTime?
  deletedAt       DateTime?
}
```

#### **OrderItem Model** (Multi-Vendor)
```prisma
model OrderItem {
  id        String  @id @default(uuid())
  orderId   String
  productId String
  sellerId  String  // Which dealer owns this item
  
  title     String
  price     Float
  quantity  Int
  color     String?
  size      String?
}
```

### Complete Model List (30+)
1. User (Customers, Sellers, Admins)
2. Vendor (Store profile & bank details)
3. Category (Hierarchical with commission rates)
4. Product (Variants, SKUs, Verification status)
5. ProductVariant (Color-based groupings)
6. ProductSize (Stock tracking per size)
7. ProductUpdateRequest (Admin approval queue)
8. Order (Multi-vendor support)
9. OrderItem (Individual seller attribution)
10. OrderStatusHistory (Timeline tracking)
11. PaymentTransaction (Razorpay reconciliation)
12. Payout (Earnings withdrawal logic)
13. AuditLog (System-wide telemetry)
14. SupportTicket & Message (CRM system)
15. SiteSetting (Dynamic fees & platform constants)
16. ComboOffer (Marketing bundles)
17. ... and more

---

## 🛡️ Security & Hardening

Pravokha implements several production-ready security patterns:

- **IDOR Protection**: `requireOwnership` middleware and service-level checks in `SupportController` ensure non-admin users cannot access each other's data or tickets.
- **Role Normalization**: Case-insensitive role validation (e.g., `role.toUpperCase()`) implemented across frontend (`App.tsx`, `AdminLayout.tsx`) and backend to prevent logic bypasses and GLITCHES.
- **Zero-Trust Support**: Support conversations and tickets are strictly isolated using reinforced ownership logic.
- **Administrative Oversight**: Granular permissions allow `ADMIN` to manage platform inventory while reserving system configuration for `SUPER_ADMIN`.
- **Transaction Safety**: All order and payment operations use Prisma transactions to ensure data integrity.
- **Audit Telemetry**: Sensitive actions (payout approvals, role changes, user suspensions) are captured in `AuditLog`.
- **Dynamic Config**: Platform-wide fees (shipping ₹99, tax 18%) are pulled from `SiteSetting` with robust fallbacks.

---

## 🔌 API Documentation

### Base URL
- **Development**: `http://localhost:5000/api`
- **Production**: `https://api.pravokha.com/api`

### Authentication
Protected endpoints require JWT token:
```
Authorization: Bearer <your-jwt-token>
```

### Endpoint Categories

#### **Authentication** (`/api/auth`)
```http
POST   /auth/register         # Create account
POST   /auth/login            # Login with email/password
POST   /auth/google-login     # Login with Google OAuth
GET    /auth/me               # Get current user profile
POST   /auth/password-reset   # Request password reset
```

#### **Products** (`/api/products`)
```http
GET    /products              # List products (public, with filters)
GET    /products/:id          # Get product details
POST   /products              # Create product (DEALER/ADMIN)
PUT    /products/:id          # Update product (owner only)
PATCH  /products/:id          # Partial update
DELETE /products/:id          # Delete product (owner only)
POST   /products/check-sku    # Validate SKU uniqueness
```

**Query Parameters:**
- `?search=keyword` - Search products
- `?category=slug` - Filter by category
- `?subcategory=slug` - Filter by subcategory
- `?tag=new` - Filter new arrivals
- `?tag=deals` - Filter products with discounts
- `?page=1&limit=20` - Pagination

#### **Orders** (`/api/orders`)
```http
POST   /orders                    # Create new order
GET    /orders                    # List user's orders
GET    /orders/:id                # Get order details
GET    /orders/dealer/my-sales    # Dealer's sales (DEALER only)
PATCH  /orders/:id/status         # Update status (DEALER/ADMIN)
POST   /orders/:id/ship           # Mark as shipped (DEALER)
POST   /orders/:id/cancel         # Cancel order
PATCH  /orders/:id/refund         # Issue refund (ADMIN only)
GET    /orders/stats              # Order statistics
```

#### **Admin** (`/api/admin` & `/api/users`)
```http
# User Management
GET    /users                     # List all users (ADMIN)
GET    /users/:id                 # Get user details (ADMIN)
PATCH  /users/:id/status          # Suspend/activate user (ADMIN)
PATCH  /users/:id/role            # Change user role (ADMIN)
POST   /users/:id/verify          # Verify dealer (ADMIN)
GET    /users/admin/stats         # Platform statistics (ADMIN)

# Category Management
GET    /categories                # List categories (public)
POST   /categories                # Create category (ADMIN)
PATCH  /categories/:id            # Update category (ADMIN)
DELETE /categories/:id            # Delete category (ADMIN)

POST   /categories/subcategories  # Create subcategory (ADMIN)
PATCH  /categories/subcategories/:id  # Update subcategory (ADMIN)
DELETE /categories/subcategories/:id  # Delete subcategory (ADMIN)
```

#### **Payments** (`/api/payment`)
```http
POST   /payment/create-intent     # Create Stripe payment intent
POST   /webhooks/stripe           # Stripe webhook handler
GET    /payment/methods           # List saved payment methods
POST   /payment/methods           # Add payment method
DELETE /payment/methods/:id       # Remove payment method
```

#### **Payouts** (`/api/payouts`)
```http
GET    /payouts                   # List payouts (DEALER/ADMIN)
POST   /payouts/request           # Request payout (DEALER)
GET    /payouts/transactions      # Transaction history (DEALER)
PATCH  /payouts/:id/status        # Approve/reject (ADMIN)
GET    /payouts/stats             # Payout statistics
```

#### **Support** (`/api/support`)
```http
GET    /support/tickets           # List user's tickets
POST   /support/tickets           # Create ticket
GET    /support/tickets/:id       # Get ticket details
PATCH  /support/tickets/:id       # Update ticket
POST   /support/tickets/:id/messages  # Add message

# Admin
GET    /support/admin/tickets     # All tickets (ADMIN)
PATCH  /support/tickets/:id/status  # Update status (ADMIN)
```

#### **Reviews** (`/api/reviews`)
```http
GET    /reviews/product/:id       # Get product reviews
POST   /reviews                   # Create review
PATCH  /reviews/:id               # Update review
DELETE /reviews/:id               # Delete review
GET    /reviews/admin             # All reviews (ADMIN)
PATCH  /reviews/:id/status        # Approve/reject (ADMIN)
```

---

## 👥 User Roles

### Role Hierarchy

```
╔══════════════════════════════════════════════════════════╗
║                      ADMIN (Superuser)                   ║
║  - Full platform access                                  ║
║  - User & dealer management                              ║
║  - Content moderation & verification                     ║
║  - Financial oversight & payouts                         ║
║  - System configuration                                  ║
╚══════════════════════════════════════════════════════════╝
                           │
        ┌──────────────────┴──────────────────┐
        ▼                                     ▼
╔═════════════════════════╗       ╔═════════════════════════╗
║   DEALER (Seller)       ║       ║    USER (Customer)      ║
║  - Product management   ║       ║  - Browse products      ║
║  - Own products only    ║       ║  - Place orders         ║
║  - Order fulfillment    ║       ║  - Manage profile       ║
║  - Payout requests      ║       ║  - Submit reviews       ║
║  - Sales analytics      ║       ║  - Support tickets      ║
╚═════════════════════════╝       ╚═════════════════════════╝
```

### Permission Matrix

| Feature | USER | DEALER | ADMIN |
|---------|:----:|:------:|:-----:|
| **Products** |
| Browse Products | ✅ | ✅ | ✅ |
| Create Products | ❌ | ✅ | ✅ |
| Manage Own Products | ❌ | ✅ | ✅ |
| Manage All Products | ❌ | ❌ | ✅ |
| Verify Products | ❌ | ❌ | ✅ |
| **Orders** |
| Place Orders | ✅ | ✅ | ✅ |
| View Own Orders | ✅ | ❌ | ✅ |
| View Own Sales | ❌ | ✅ | ✅ |
| View All Orders | ❌ | ❌ | ✅ |
| Process Orders | ❌ | ✅ (own) | ✅ |
| Issue Refunds | ❌ | ❌ | ✅ |
| **Users** |
| Register | ✅ | ✅ | ✅ |
| Manage Own Profile | ✅ | ✅ | ✅ |
| View All Users | ❌ | ❌ | ✅ |
| Suspend Users | ❌ | ❌ | ✅ |
| Change Roles | ❌ | ❌ | ✅ |
| Verify Dealers | ❌ | ❌ | ✅ |
| **Platform** |
| Manage Categories | ❌ | ❌ | ✅ |
| Approve Payouts | ❌ | ❌ | ✅ |
| View Analytics | ❌ | Own only | ✅ |
| Access Audit Logs | ❌ | ❌ | ✅ |
| Manage Support Tickets | ✅ (own) | ✅ (own) | ✅ |

---

## 🔒 Security Features

### Authentication & Authorization
✅ **JWT Tokens**: Stateless authentication with secure secret (32+ chars)  
✅ **bcrypt Hashing**: Password hashing with 10 salt rounds  
✅ **Role-Based Access Control**: Enforced at API middleware level  
✅ **Account Suspension**: Suspended users blocked from all operations  
✅ **OAuth Integration**: Google Sign-In support  
✅ **Token Expiration**: Configurable JWT expiry

### Data Protection
✅ **Data Isolation**: Dealers cannot access each other's data  
✅ **Ownership Middleware**: Prevents IDOR (Insecure Direct Object Reference) attacks  
✅ **Input Validation**: Zod schema validation on all endpoints  
✅ **SQL Injection Prevention**: Prisma ORM with parameterized queries  
✅ **XSS Protection**: React auto-escaping + input sanitization  
✅ **Password Exclusion**: Never returned in API responses  
✅ **PII Protection**: Personal data handling compliant

### Infrastructure Security
✅ **HTTPS Enforcement**: Required in production  
✅ **CORS Configuration**: Whitelisted origins only  
✅ **Helmet.js**: Security headers (CSP, X-Frame-Options, etc.)  
✅ **Rate Limiting**: API abuse prevention  
✅ **Environment Variables**: No hardcoded secrets  
✅ **Stripe PCI Compliance**: Card data never touches our servers

### Audit & Compliance
✅ **Audit Logs**: All admin actions tracked  
✅ **Order History**: Complete transaction trail  
✅ **Soft Deletes**: Data preservation for compliance  
✅ **Version Control**: Database migrations tracked

### Security Audit Results
```
Overall Security Rating: 8.5/10 ✅ PRODUCTION-READY

✓ No hardcoded secrets
✓ No data leakage vulnerabilities
✓ No authorization bypass flaws
✓ No SQL injection risks
✓ Proper RBAC enforcement
✓ Secure password handling
```

**Recommended Improvements:**
- Add refresh token mechanism
- Implement CSRF protection
- Enable MySQL TDE (Transparent Data Encryption)
- Add comprehensive rate limiting

---

## 👨‍💼 Admin Operations

### User Management

#### Suspend/Activate User
1. Navigate to **Admin → Users**
2. Find user in list
3. Click **Actions → Suspend** (or Activate)
4. User will be immediately logged out if suspended

#### Change User Role
1. Go to **User Details**
2. Click **Edit Role**
3. Select new role (USER, DEALER, ADMIN)
4. Save changes
5. User's permissions update immediately

#### Delete User
1. Find user
2. Click **Delete**
3. Soft delete (sets `deletedAt` timestamp)
4. Data preserved for compliance

### Dealer Verification Workflow

```
┌────────────────────────────────────────────────────────┐
│ 1. User Applies to Become Dealer                      │
│    - Fills dealer application form                    │
│    - Provides: GST, PAN, Bank details                 │
│    - Sets store name & description                    │
└────────────────────┬───────────────────────────────────┘
                     │
                     ▼
┌────────────────────────────────────────────────────────┐
│ 2. Admin Receives Notification                        │
│    - Email alert for new dealer application           │
│    - Shows pending verification count                 │
└────────────────────┬───────────────────────────────────┘
                     │
                     ▼
┌────────────────────────────────────────────────────────┐
│ 3. Admin Reviews Application                          │
│    - Admin → Dealers → Pending Verification           │
│    - Reviews: GST (15 digits), PAN (10 chars)         │
│    - Checks: Bank account, IFSC code                  │
│    - Verifies: Store details, business info           │
└────────────────────┬───────────────────────────────────┘
                     │
         ┌───────────┴───────────┐
         ▼                       ▼
┌──────────────────┐    ┌──────────────────┐
│ 4a. Approve     │    │ 4b. Reject      │
│ Set: verified   │    │ Add: comments   │
└────────┬─────────┘    └────────┬─────────┘
         │                       │
         └───────────┬───────────┘
                     ▼
┌────────────────────────────────────────────────────────┐
│ 5. Dealer Receives Email Notification                 │
│    - Approval: Can start listing products             │
│    - Rejection: Review comments & reapply             │
└────────────────────────────────────────────────────────┘
```

### Product Moderation

1. **View Pending Products**
   - Admin → Products → Filter: Unverified
2. **Review Product**
   - Check: Description quality
   - Verify: Images are appropriate
   - Validate: Pricing is reasonable
3. **Approve/Reject**
   - Approve: Set `isVerified = true`
   - Reject: Add admin comments
4. **Featured Products**
   - Toggle `isFeatured` for homepage display

### Order Management

#### View All Orders
- Admin → Orders
- Filter by: Status, Date Range, Seller

#### Update Order Status
1. Select order
2. Change status:
   - PENDING → PROCESSING
   - PROCESSING → PACKED
   - PACKED → SHIPPED
   - SHIPPED → DELIVERED
3. Add tracking number (if shipping)
4. Save

#### Issue Refund
1. Find order
2. Click **Refund**
3. Enter refund amount
4. Confirm
5. Stripe processes refund (2-5 business days)

### Payout Approval

```
Dealer Earnings Calculation:
Sale Price: ₹1,000
Commission (10%): -₹100
═══════════════════════
Dealer Receives: ₹900
```

**Approval Process:**
1. Admin → Payouts → Filter: Pending
2. Verify seller earnings calculation
3. Check bank details are correct
4. Approve:
   - Enter transaction ID
   - Click Approve
5. Reject:
   - Provide rejection reason
   - Dealer can resubmit

### Category Management

1. **Create Category**
   - Admin → Categories → Add New
   - Enter: Name, Slug, Description
   - Upload category image
   - Set display order

2. **Add Subcategory**
   - Select parent category
   - Click **Add Subcategory**
   - Fill details
   - Save

3. **Reorder Categories**
   - Drag & drop to change order
   - Updates `displayOrder` field

4. **Delete Category**
   - Ensure no active products use it
   - Click Delete
   - Confirmation required

---

## 🚀 Deployment

### Environment Variables

#### Backend `.env`
```bash
# Server Configuration
PORT=5000
NODE_ENV=production

# Database
DATABASE_URL="mysql://username:password@host:3306/pravokha"

# Authentication
JWT_SECRET="your-super-secure-32-plus-character-secret-key-here"

# Payment Gateway
STRIPE_SECRET_KEY="sk_live_your_stripe_secret_key"

# Email Service
EMAIL_HOST="smtp.gmail.com"
EMAIL_PORT=587
EMAIL_USER="your-email@gmail.com"
EMAIL_PASS="your-app-specific-password"

# OAuth (Optional)
GOOGLE_CLIENT_ID="your-google-client-id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
```

#### Frontend `.env`
```bash
VITE_API_URL="https://api.pravokha.com"
VITE_STRIPE_PUBLIC_KEY="pk_live_your_stripe_publishable_key"
VITE_GOOGLE_CLIENT_ID="your-google-client-id"
```

### Backend Deployment

```bash
# 1. Install dependencies
cd backend
npm install --production

# 2. Generate Prisma client
npm run prisma:generate

# 3. Run database migrations
npx prisma migrate deploy

# 4. Build TypeScript
npm run build

# 5. Start production server
NODE_ENV=production npm start

# Or use PM2 for process management
pm2 start dist/server.js --name pravokha-api
pm2 save
pm2 startup
```

### Frontend Deployment

```bash
# 1. Install dependencies
npm install

# 2. Build for production
npm run build

# 3. The 'dist' folder is ready for deployment

# Deploy to Vercel/Netlify or serve with Nginx:
# Example Nginx configuration:
server {
    listen 80;
    server_name pravokha.com;
    root /var/www/pravokha/dist;
    index index.html;
    
    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

### Database Setup

```sql
-- Create MySQL database
CREATE DATABASE pravokha CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Create user (optional)
CREATE USER 'pravokha_user'@'localhost' IDENTIFIED BY 'secure_password';
GRANT ALL PRIVILEGES ON pravokha.* TO 'pravokha_user'@'localhost';
FLUSH PRIVILEGES;
```

```bash
# Run Prisma migrations
cd backend
npx prisma migrate deploy

# Seed initial data (optional)
npm run seed
```

### Production Checklist

- [ ] Set `NODE_ENV=production`
- [ ] Use strong `JWT_SECRET` (32+ characters)
- [ ] Configure HTTPS/SSL certificate
- [ ] Enable MySQL TDE encryption
- [ ] Set up automated database backups
- [ ] Configure error logging (Sentry/LogRocket)
- [ ] Enable CORS for production domain only
- [ ] Set up monitoring (Uptime, Performance)
- [ ] Configure CDN for static assets
- [ ] Test payment webhooks with Stripe CLI
- [ ] Set up email service (SendGrid/AWS SES)
- [ ] Review and apply security headers
- [ ] Enable rate limiting on API endpoints

---

## 🤝 Contributing

We welcome contributions! Please follow these guidelines:

### Development Setup

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes
4. Run tests: `npm test`
5. Commit: `git commit -m 'Add amazing feature'`
6. Push: `git push origin feature/amazing-feature`
7. Open a Pull Request

### Code Standards

- **TypeScript**: Strict mode enabled
- **ESLint**: Follow project configuration
- **Prettier**: Auto-format on save
- **Commit Messages**: Use conventional commits
  - `feat:` New feature
  - `fix:` Bug fix
  - `docs:` Documentation
  - `chore:` Maintenance

### Testing

```bash
# Run unit tests
npm test

# Run with coverage
npm test -- --coverage

# Run specific test
npm test -- auth.test.ts
```

---

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

---

## 📞 Support

- **Documentation**: [Link to Wiki/Docs]
- **Issues**: [GitHub Issues](https://github.com/your-repo/issues)
- **Email**: support@pravokha.com
- **Discord**: [Community Server]

---

## 🙏 Acknowledgments

- **Radix UI** - Accessible component primitives
- **shadcn/ui** - Beautiful component collection
- **Prisma** - Next-generation ORM
- **Stripe** - Payment infrastructure
- **TailwindCSS** - Utility-first CSS framework

---

## 📊 Project Stats

- **Total Lines of Code**: 50,000+
- **Backend Endpoints**: 100+
- **Frontend Components**: 200+
- **Database Models**: 30+
- **Test Coverage**: 80%+ (target)

---

**Built with ❤️ by the Pravokha Team**

**Last Updated**: February 8, 2026  
**Version**: 1.0.0-GOLD  
**Status**: 🟢 Production Ready (Audited & Hardened)
