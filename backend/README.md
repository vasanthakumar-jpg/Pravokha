# Pravokha Backend

Secure, lightweight Node.js backend replacing Supabase auto-generated APIs.

## Setup

1.  **Environment Variables**:
    - A `.env` file has been created in this directory.
    - **ACTION REQUIRED**: Open `.env` and replace `[YOUR-PASSWORD]` with your actual Supabase database password.
    - The `DATABASE_URL` is pre-configured with your Project ID (`oxwwnuxzlqvcbxxayfis`).

2.  **Database Migration**:
    - Once `.env` is updated, run:
      ```bash
      npx prisma db push
      ```
    - This will sync the `User` and `Product` tables to your database.

3.  **Run Server**:
    - Development:
      ```bash
      npm run dev
      ```
    - Production Build:
      ```bash
      npm run build
      npm start
      ```

## API Endpoints

### Auth
- `POST /api/auth/register` - Create account
- `POST /api/auth/login` - Get JWT

### Products
- `GET /api/products` - List products (as Dealer/Admin)
- `POST /api/products` - Create product
- `GET /api/products/:id` - Get details
- `PUT /api/products/:id` - Update
- `DELETE /api/products/:id` - Delete

## Testing
Run unit tests:
```bash
npm test
```
