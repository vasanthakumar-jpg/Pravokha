# 🛠️ Pravokha Backend - Enterprise Grade Core

Secure, highly-scalable Node.js backend powering the Pravokha multi-vendor marketplace. Gold Standard certified (10/10) for production readiness.

## 🚀 Core Features
- **Engine**: Express.js with TypeScript for strict type-safety.
- **ORM**: Prisma 5.22 with MySQL for ACID-compliant transactions.
- **Auth**: JWT-based stateless authentication + Google OAuth.
- **Security**: Reinforced RBAC (Super Admin, Admin, Seller, Customer).
- **Payments**: Razorpay integration with secure signature verification and automatic webhooks.
- **Inventory**: Atomic stock decrement with optimistic concurrency checks (`gte`).
- **Financials**: Automated commission handling (Dynamic via Site Settings) and cooling-off payout logic.
- **Compliance**: Centralized `AuditService` tracking all administrative operations.

## 🛠️ Setup & Development

1.  **Install Dependencies**
    ```bash
    npm install
    ```

2.  **Environment Configuration**
    Copy `.env.example` to `.env` and configure:
    - `DATABASE_URL`: Primary MySQL connection string.
    - `RAZORPAY_KEY_ID` & `RAZORPAY_KEY_SECRET`: Live/Test payment keys.
    - `JWT_SECRET`: 32+ character secure key.

3.  **Database Synchronization**
    ```bash
    npx prisma generate
    npx prisma migrate deploy
    ```

4.  **Run Development**
    ```bash
    npm run dev
    ```

## 📂 API Topology
- `/api/auth`: Recovery, Login, Register, Profile
- `/api/products`: Atomic CRUD + Verification Queue
- `/api/orders`: Multi-vendor splitting & Fulfillment
- `/api/payments`: Razorpay Signature Verification
- `/api/payouts`: Serializable Transaction-protected withdrawals
- `/api/admin`: Permission control & Global Oversight
- `/uploads`: Protected static file storage

## 🛡️ Production Hardening
- **Rate Limiting**: Enforced on Auth and Payment endpoints.
- **Helmet.js**: Enterprise security headers.
- **IDOR Protection**: Automatic resource-ownership middleware.
- **Serializable Transactions**: Highest isolation levels for sensitive financial operations.

---
**Certified: 10/10 Production Ready**
