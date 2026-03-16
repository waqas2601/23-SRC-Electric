# SRC Simple Record Backend (MongoDB + TypeScript)

## Quick start

1. Copy `.env.example` to `.env` and update `MONGODB_URI`.
2. Install dependencies:
   - `npm install`
3. Run development server:
   - `npm run dev`
4. Type-check build:
   - `npm run build`

Server runs on `http://localhost:5000` by default.

Production backend URL:
- `https://src-backend-dun.vercel.app`

## Authentication

- The backend uses custom JWT auth.
- A bootstrap admin user is auto-created on startup if these env vars are set:
   - `ADMIN_NAME`
   - `ADMIN_EMAIL`
   - `ADMIN_PASSWORD`
- Login endpoint:
   - `POST /api/v1/auth/login`
- Use returned bearer token for admin-protected routes.

## Current endpoints

- `GET /api/v1/health`
- `POST /api/v1/auth/login`
- `GET /api/v1/auth/me`
- `GET /api/v1/products/categories`
- `GET /api/v1/products`
- `POST /api/v1/products`
- `GET /api/v1/customers`
- `POST /api/v1/customers`
- `GET /api/v1/customers/:id`
- `PATCH /api/v1/customers/:id`
- `DELETE /api/v1/customers/:id`
- `GET /api/v1/invoices`
- `POST /api/v1/invoices`
- `GET /api/v1/invoices/:id`
- `PATCH /api/v1/invoices/:id`
- `POST /api/v1/invoices/:id/payments`
- `GET /api/v1/invoices/:id/payments`
- `DELETE /api/v1/invoices/payments/:paymentId`

Detailed frontend request/response guide:
- See `API_ENDPOINTS.md`
  
## Notes

- Money fields are integer-only (for example: `300`, not `300.00`).
- Product `category` uses enum values from `src/constants/productCategories.ts`.
- `products` and `customers` routes are admin-protected.
