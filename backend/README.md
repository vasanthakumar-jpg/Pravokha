# Pravokha Backend

Secure, lightweight Node.js backend.

## Features
- **Express.js** REST API
- **Prisma** ORM with MySQL
- **JWT** Authentication (HttpOnly cookies + Bearer tokens)
- **Role-Based Access Control** (Admin, Dealer, User)
- **Stripe** Payment Integration
- **File Uploads** (Local / S3 compatible)

## Setup

1.  **Install Dependencies**
    ```bash
    npm install
    ```

2.  **Environment Variables**
    Copy `.env.example` to `.env` and configure your database URL.

3.  **Database Migration**
    ```bash
    npx prisma db push
    ```

4.  **Run Server**
    ```bash
    npm run dev
    ```

## API Structure
- `/api/auth`: Login, Register, Profile
- `/api/products`: CRUD for products
- `/api/orders`: Order management
- `/uploads`: Static file serving
