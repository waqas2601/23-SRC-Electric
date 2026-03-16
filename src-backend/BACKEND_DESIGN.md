# SRC Simple Record System — Backend Design

## 1) Goal
Build a simple, reliable backend to manage:
- Products
- Customers
- Invoices
- Invoice Items
- Payments
- Receivables summary

This design ignores hosting/deployment and focuses on functionality.

## 2) Recommended Stack
- Runtime: Node.js (LTS)
- Framework: Express.js
- Database: MongoDB (Atlas)
- ODM/Query: Mongoose
- Validation: Zod/Joi
- Auth: JWT (single admin role initially)

> For quick local delivery, use local MongoDB or Atlas free tier; move to paid Atlas tier for production reliability.

## 3) API Design (REST)

Base path: `/api/v1`

### Auth
- `POST /auth/login` (admin login, returns JWT token)
- `GET /auth/me` (current admin profile)

> Route protection: all business routes are admin-protected (`products`, `customers`, and upcoming `invoices`/`payments`/`summary`).

### Products
- `GET /products` (list + search + pagination + filter by category)
- `GET /products/categories` (returns enum list for frontend dropdown)
- `POST /products` (create)
- `GET /products/:id`
- `PATCH /products/:id` (update)
- `DELETE /products/:id` (soft delete -> `is_active=false`)

### Customers
- `GET /customers`
- `POST /customers`
- `GET /customers/:id`
- `PATCH /customers/:id`
- `DELETE /customers/:id` (soft delete)

### Invoices
- `GET /invoices` (filter by status/customer/date)
- `POST /invoices`
- `GET /invoices/:id`
- `PATCH /invoices/:id` (replace/edit items + meta)
- `POST /invoices/:id/payments` (record payment)
- `GET /invoices/:id/payments`

### Payments
- `GET /payments` (optional global listing)
- `GET /payments/:id`
- `PATCH /payments/:id` (limited edit)
- `DELETE /payments/:id` (recompute invoice totals)

### Summary / Receivables
- `GET /summary/receivables`
  - customer-wise total remaining
  - unpaid/partially paid invoice list

## 4) Request/Response Contract Notes

### Create Invoice Request
```json
{
  "customerId": "ObjectId",
  "invoiceDate": "2026-03-01",
  "discount": 0,
  "notes": "optional",
  "items": [
    { "productId": "ObjectId", "quantity": 2, "unitPriceSnapshot": 1500 }
  ]
}
```

### Create Product Request
```json
{
  "sku": "SW-6A-001",
  "name": "6A Switch",
  "category": "SWITCH",
  "price": 250
}
```

### Admin Login Request
```json
{
  "email": "admin@example.com",
  "password": "change_this_password"
}
```

### Admin Login Response (example)
```json
{
  "token": "<jwt>",
  "token_type": "Bearer",
  "expires_in": "7d",
  "user": {
    "id": "ObjectId",
    "name": "Admin",
    "email": "admin@example.com",
    "role": "admin"
  }
}
```

### Add Payment Request
```json
{
  "paymentDate": "2026-03-01",
  "amount": 1000,
  "method": "CASH",
  "reference": "optional",
  "notes": "optional"
}
```

## 5) Validation + Error Handling
- Standard errors:
  - `400` invalid payload
  - `404` entity not found
  - `409` duplicate SKU or invoice number conflict
  - `422` business rule failure (e.g., payment amount <= 0)
- Use whole integers for monetary values (e.g., `300`, not `300.00`).
- Reject non-integer money values for `price`, `discount`, `unitPriceSnapshot`, and `amount`.
- Reject product create/update if `category` is outside enum.
- Keep enum values uppercase to avoid mismatch.
- Use MongoDB transactions for invoice/item/payment writes.

## 6) Indexing
- `products.sku` unique
- `products.category`
- `products` compound index: `{ category: 1, name: 1 }`
- `invoices.invoice_no` unique
- `invoices` compound index: `{ customer_id: 1, status: 1 }`
- `invoices.invoice_date`
- `payments` compound index: `{ invoice_id: 1, payment_date: -1 }`
- `customers.phone`

## 7) Security (minimal v1)
- Custom JWT auth with single role: `admin`.
- All business APIs require `Authorization: Bearer <token>`.
- Bootstrap admin user is auto-created on startup (if missing) using env values:
  - `ADMIN_NAME`
  - `ADMIN_EMAIL`
  - `ADMIN_PASSWORD`
- Required JWT env values:
  - `JWT_SECRET`
  - optional: `JWT_EXPIRES_IN` (default `7d`)
- Audit fields (`created_at`, `updated_at`) mandatory.

## 8) Suggested Folder Structure

```text
backend/
  .env.example
  postman/
    SRC_Backend.postman_collection.json
    SRC_Local.postman_environment.json
  src/
    app.ts
    server.ts
    config/
      db.ts
      bootstrapAdmin.ts
    constants/
      productCategories.ts
      invoiceStatus.ts
    controllers/
      auth.controller.ts
      product.controller.ts
      customer.controller.ts
    middlewares/
      auth.middleware.ts
      errorHandler.ts
    models/
      User.ts
      Product.ts
      Customer.ts
      Invoice.ts
      Payment.ts
    routes/
      auth.routes.ts
      health.routes.ts
      product.routes.ts
      customer.routes.ts
    utils/
      AppError.ts
      asyncHandler.ts
```

## 9) Milestone Plan
1. ✅ Core setup: TypeScript + MongoDB + global error handling
2. ✅ Auth: admin login, protected routes, bootstrap admin
3. ✅ Products + Customers CRUD (in progress scope)
4. ⏳ Invoice create/read/update (with item snapshots)
5. ⏳ Payments and status/remaining auto-update
6. ⏳ Summary endpoint + tests + API docs
