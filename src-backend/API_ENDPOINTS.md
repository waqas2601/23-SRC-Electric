# API Endpoints (Current Routes)

Base URL:

- Local: `http://localhost:5000/api/v1`
- Production: `https://src-backend-dun.vercel.app/api/v1`

Auth header for protected routes:

- `Authorization: Bearer <token>`

Money format:

- Send integer values only (e.g. `250`, not `250.00`).

---

## Health

### GET `/health`

- Auth: No
- Request body: None
- Expected response:

```json
{ "status": "ok" }
```

---

## Auth

### POST `/auth/login`

- Auth: No
- Request body:

```json
{
  "email": "admin@example.com",
  "password": "your_password"
}
```

- Expected response:

```json
{
  "token": "<jwt>",
  "token_type": "Bearer",
  "expires_in": "7d",
  "user": {
    "id": "65f...",
    "name": "Admin",
    "email": "admin@example.com",
    "role": "admin"
  }
}
```

### GET `/auth/me`

- Auth: Yes
- Request body: None
- Expected response:

```json
{
  "user": {
    "id": "65f...",
    "name": "Admin",
    "email": "admin@example.com",
    "role": "admin"
  }
}
```

---

## Products

### GET `/products/categories`

- Auth: Yes
- Request body: None
- Expected response:

```json
{
  "categories": ["BULB", "SWITCH", "SOCKET", "...", "OTHER"]
}
```

### GET `/products`

- Auth: Yes
- Query params (all optional):
  - `q` (string)
  - `category` (enum)
  - `isActive` (`true|false`)
  - `page` (number string)
  - `limit` (number string)
- Example:
  - `/products?q=switch&category=SWITCH&isActive=true&page=1&limit=20`
- Expected response:

```json
{
  "items": [
    {
      "_id": "65f...",
      "sku": "SWI-123456789",
      "name": "6A SWITCH",
      "category": "SWITCH",
      "price": 250,
      "is_active": true
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 1,
    "totalPages": 1
  }
}
```

### POST `/products`

- Auth: Yes
- Request body:

```json
{
  "name": "6A Switch",
  "category": "SWITCH",
  "price": 250,
  "is_active": true
}
```

- Notes:
  - `sku` is optional; backend generates it if omitted.
  - Backend stores `name` in uppercase.
- Expected response: created product object.

### PATCH `/products/:id`

- Auth: Yes
- Request body (send only changed fields):

```json
{
  "name": "6A Switch Premium",
  "category": "SWITCH",
  "price": 275,
  "is_active": true
}
```

- Expected response: updated product object.

### DELETE `/products/:id`

- Auth: Yes
- Request body: None
- Behavior: soft delete (`is_active = false`)
- Expected response:

```json
{
  "message": "Product deactivated successfully",
  "product": {
    "_id": "65f...",
    "is_active": false
  }
}
```

---

## Customers

### GET `/customers`

- Auth: Yes
- Query params (all optional):
  - `q` (searches `name`, `shop_name`, `phone`, `address`)
  - `isActive` (`true|false`)
  - `page` (number string)
  - `limit` (number string)
- Expected response:

```json
{
  "items": [
    {
      "_id": "65f...",
      "name": "Ali Khan",
      "shop_name": "Royal Electronics",
      "address": "Main Bazar, Gujrat",
      "phone": "03001234567",
      "notes": "...",
      "is_active": true
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 1,
    "totalPages": 1
  }
}
```

### POST `/customers`

- Auth: Yes
- Request body:

```json
{
  "name": "Ali Khan",
  "shop_name": "Royal Electronics",
  "address": "Main Bazar, Gujrat",
  "phone": "03001234567",
  "notes": "Optional",
  "is_active": true
}
```

- Required field: `name`
- Expected response: created customer object.

### PATCH `/customers/:id`

- Auth: Yes
- Request body (at least one field):

```json
{
  "name": "Ali Raza",
  "shop_name": "Royal Digital",
  "address": "Updated address",
  "phone": "03111234567",
  "notes": "Updated",
  "is_active": true
}
```

- Expected response: updated customer object.

### DELETE `/customers/:id`

- Auth: Yes
- Request body: None
- Behavior: soft delete (`is_active = false`) if no related invoices exist.
- Expected response:

```json
{
  "message": "Customer deactivated successfully",
  "customer": {
    "_id": "65f...",
    "is_active": false
  }
}
```

---

## Invoices

### GET `/invoices`

- Auth: Yes
- Query params (all optional):
  - `status` (`unpaid|partial|completed`)
  - `customerId` (ObjectId)
  - `fromDate` (date string)
  - `toDate` (date string)
  - `page` (number string)
  - `limit` (number string)
- Expected response:

```json
{
  "items": [
    {
      "_id": "65f...",
      "invoice_no": "INV-174...",
      "customer_id": {
        "_id": "65c...",
        "name": "Ali Khan",
        "shop_name": "Royal Electronics",
        "phone": "03001234567"
      },
      "invoice_date": "2026-03-07T00:00:00.000Z",
      "total_amount": 3000,
      "paid_amount": 1000,
      "remaining_amount": 2000,
      "status": "partial"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 1,
    "totalPages": 1
  }
}
```

### POST `/invoices`

- Auth: Yes
- Request body:

```json
{
  "customerId": "65c...",
  "invoiceDate": "2026-03-07",
  "discount": 0,
  "notes": "Optional",
  "items": [
    {
      "productId": "65a...",
      "quantity": 2,
      "unitPriceSnapshot": 250
    }
  ]
}
```

- Required:
  - `customerId`, `invoiceDate`, non-empty `items`
  - each item: `productId`, `quantity > 0`
- Expected response: created invoice object.

### GET `/invoices/:id`

- Auth: Yes
- Request body: None
- Expected response: invoice object with populated `customer_id` and line `items`.

### DELETE `/invoices/:id`

- Auth: Yes
- Request body: None
- Behavior: deletes invoice and all associated payments.
- Expected response:

```json
{
  "message": "Invoice and associated payments deleted successfully",
  "deleted_payments": 2
}
```

### POST `/invoices/:id/payments`

- Auth: Yes
- Request body:

```json
{
  "paymentDate": "2026-03-07",
  "amount": 1000,
  "method": "CASH",
  "reference": "Optional",
  "notes": "Optional"
}
```

- `method` enum: `CASH | BANK | OTHER`
- Expected response:

```json
{
  "payment": {
    "_id": "65p...",
    "invoice_id": "65i...",
    "payment_date": "2026-03-07T00:00:00.000Z",
    "amount": 1000,
    "method": "CASH"
  },
  "invoice": {
    "_id": "65i...",
    "paid_amount": 1000,
    "remaining_amount": 2000,
    "status": "partial"
  }
}
```

### GET `/invoices/:id/payments`

- Auth: Yes
- Request body: None
- Expected response:

```json
{
  "invoice": {
    "_id": "65i...",
    "invoice_no": "INV-...",
    "total_amount": 3000,
    "paid_amount": 1000,
    "remaining_amount": 2000,
    "status": "partial"
  },
  "payments": [
    {
      "_id": "65p...",
      "invoice_id": "65i...",
      "payment_date": "2026-03-07T00:00:00.000Z",
      "amount": 1000,
      "method": "CASH"
    }
  ]
}
```

---

## Payments

### GET `/payments`

- Auth: Yes
- Query params (all optional):
  - `invoiceId` (ObjectId)
  - `method` (`CASH|BANK|OTHER`)
  - `fromDate` (date string)
  - `toDate` (date string)
  - `page` (number string)
  - `limit` (number string)
- Expected response:

```json
{
  "items": [
    {
      "_id": "65p...",
      "payment_date": "2026-03-07T00:00:00.000Z",
      "amount": 1000,
      "method": "CASH",
      "invoice_id": {
        "_id": "65i...",
        "invoice_no": "INV-...",
        "total_amount": 3000,
        "remaining_amount": 2000,
        "status": "partial",
        "customer_id": {
          "_id": "65c...",
          "name": "Ali Khan",
          "shop_name": "Royal Electronics",
          "phone": "03001234567"
        }
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 1,
    "totalPages": 1
  }
}
```

### POST `/payments`

- Auth: Yes
- Request body:

```json
{
  "invoiceId": "65i...",
  "paymentDate": "2026-03-07",
  "amount": 1000,
  "method": "BANK",
  "reference": "TRX-123",
  "notes": "Optional"
}
```

- Expected response:

```json
{
  "payment": {
    "_id": "65p...",
    "invoice_id": "65i...",
    "payment_date": "2026-03-07T00:00:00.000Z",
    "amount": 1000,
    "method": "BANK"
  },
  "invoice": {
    "_id": "65i...",
    "paid_amount": 1000,
    "remaining_amount": 2000,
    "status": "partial"
  }
}
```

### DELETE `/payments/:id`

- Auth: Yes
- Request body: None
- Expected response:

```json
{
  "message": "Payment deleted successfully",
  "invoice": {
    "_id": "65i...",
    "paid_amount": 0,
    "remaining_amount": 3000,
    "status": "unpaid"
  }
}
```

---

## Summary

### GET `/summary/dashboard`

- Auth: Yes
- Query params (optional):
  - `fromDate` (date string)
  - `toDate` (date string)
  - `overdueDays` (integer string, default `7`)
- Expected response:

```json
{
  "period": {
    "from": "2026-03-01T00:00:00.000Z",
    "to": "2026-03-07T23:59:59.999Z"
  },
  "overdue_days": 7,
  "kpis": {
    "receivable": 120000,
    "collected": 45000,
    "partial_count": 8,
    "overdue_amount": 32000,
    "overdue_customers": 3
  },
  "top_overdue_customer": {
    "customer_id": "65c...",
    "customer_name": "Ali Khan",
    "shop_name": "Royal Electronics",
    "overdue_amount": 18000,
    "oldest_invoice_date": "2026-02-20T00:00:00.000Z",
    "invoice_count": 2
  },
  "recent_invoices": []
}
```

---

## Common validation/error notes

- ObjectIds must be valid MongoDB IDs.
- Date fields must be valid date strings.
- `page` / `limit` are numeric strings in query params.
- Typical error format:

```json
{
  "success": false,
  "error": {
    "code": "BAD_REQUEST",
    "message": "...",
    "details": {}
  }
}
```
