# Pravokha Backend: React Consumption Guide

## Base API URL
All API requests should be made to: `http://localhost:5000/api` (or your production domain).

## Authentication
The backend uses **JWT-based Bearer Token** authentication.

### Login
- **Endpoint**: `POST /api/auth/login`
- **Payload**: `{ "email": "user@example.com", "password": "securepassword" }`
- **Response**: `{ "success": true, "token": "...", "user": { "id": "...", "role": "DEALER" } }`

### Attaching the Token
Include the token in the `Authorization` header for all protected routes:
```javascript
headers: {
  'Authorization': `Bearer ${token}`
}
```

---

## Products
### List Products (Public/Dealer)
- **Endpoint**: `GET /api/products` (Includes auth context if token provided)
- **Note**: Dealers see their own products; Admins see all; Guests see only published ones.

---

## Orders & Payments (Secure Flow)
The backend implements a **Transaction-first** flow to ensure inventory safety.

### 1. Create Order
- **Endpoint**: `POST /api/orders`
- **Payload**: Includes shipping details and an array of `items: [{ productId, quantity }]`.
- **Backend Logic**: 
  - Validates stock atomically in a Prisma transaction.
  - Decrements stock immediately.
  - Creates a Stripe **PaymentIntent**.
- **Response**: Returns the `order` object and a `clientSecret`.

### 2. Complete Payment (Frontend)
Use the `clientSecret` with the **Stripe React SDK** (`Elements`) to confirm the payment on the client side.

### 3. Payment Verification (Secure)
The backend does **NOT** rely on the frontend for payment confirmation. 
- A **Stripe Webhook** at `/api/webhook/stripe` handles the `payment_intent.succeeded` event.
- Only then is the order status moved to `PROCESSING` and `paymentStatus` to `PAID`.

---

## Error Handling
The backend returns standardized error responses:
```json
{
  "success": false,
  "message": "Validation Error",
  "errors": [...] 
}
```
**UI Tip**: Use these messages directly for toast notifications or form errors.
