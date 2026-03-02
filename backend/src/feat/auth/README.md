# Feature: Auth

This module handles all authentication and authorization logic for the platform.

## Components
- `controller.ts`: Handles HTTP requests for registration and login.
- `service.ts`: Contains business logic for password hashing, token generation, and user creation.
- `route.ts`: Defines API endpoints for authentication.

## Responsibilities
- User registration
- Secure login (JWT)
- Password hashing (Bcrypt)
- Token-based session management
