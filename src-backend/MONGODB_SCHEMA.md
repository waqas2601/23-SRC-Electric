# MongoDB Collection Blueprint (SRC Simple Record System)

## Collections

### 1) products
```json
{
  "_id": "ObjectId",
  "sku": "LED-12W-001",
  "name": "LED Bulb 12W",
  "category": "BULB",
  "price": "Decimal128(300.00)",
  "is_active": true,
  "created_at": "ISODate",
  "updated_at": "ISODate"
}
```

`category` enum (recommended master list):
- `BULB`
- `TUBE_LIGHT`
- `SWITCH`
- `SOCKET`
- `PLUG`
- `WIRE`
- `CABLE`
- `MCB`
- `BREAKER`
- `DB_BOX`
- `FAN`
- `HOLDER`
- `ADAPTER`
- `EXTENSION_BOARD`
- `DIMMER`
- `SENSOR`
- `CHARGER`
- `INVERTER`
- `BATTERY`
- `OTHER`

Optional enhancement:
- Keep a separate `product_categories` collection later if dynamic categories are needed by admin.

### 2) customers
```json
{
  "_id": "ObjectId",
  "name": "Nadeem",
  "shop_name": "Nadeem Electric Store",
  "address": "Gujrat",
  "phone": "0300xxxxxxx",
  "notes": "Pays on weekends",
  "is_active": true,
  "created_at": "ISODate",
  "updated_at": "ISODate"
}
```

### 3) invoices (with embedded `items`)
```json
{
  "_id": "ObjectId",
  "invoice_no": "INV-1001",
  "customer_id": "ObjectId",
  "invoice_date": "ISODate",
  "subtotal": "Decimal128(9500.00)",
  "discount": "Decimal128(500.00)",
  "total_amount": "Decimal128(9000.00)",
  "paid_amount": "Decimal128(4000.00)",
  "remaining_amount": "Decimal128(5000.00)",
  "status": "partial",
  "notes": "",
  "items": [
    {
      "_id": "ObjectId",
      "product_id": "ObjectId",
      "product_name_snapshot": "LED Bulb 12W",
      "sku_snapshot": "LED-12W-001",
      "unit_price_snapshot": "Decimal128(300.00)",
      "quantity": 10,
      "line_total": "Decimal128(3000.00)",
      "created_at": "ISODate",
      "updated_at": "ISODate"
    }
  ],
  "created_at": "ISODate",
  "updated_at": "ISODate"
}
```

### 4) payments
```json
{
  "_id": "ObjectId",
  "invoice_id": "ObjectId",
  "payment_date": "ISODate",
  "amount": "Decimal128(1000.00)",
  "method": "CASH",
  "reference": "",
  "notes": "",
  "created_at": "ISODate",
  "updated_at": "ISODate"
}
```

## Required Indexes

- `products`: `{ sku: 1 }` unique
- `products`: `{ category: 1 }`
- `products`: `{ category: 1, name: 1 }`
- `customers`: `{ phone: 1 }`
- `invoices`: `{ invoice_no: 1 }` unique
- `invoices`: `{ customer_id: 1, status: 1 }`
- `invoices`: `{ invoice_date: -1 }`
- `payments`: `{ invoice_id: 1, payment_date: -1 }`

## Important Business Rules

- `line_total = quantity * unit_price_snapshot`
- `subtotal = sum(items.line_total)`
- `total_amount = subtotal - discount`
- `paid_amount = sum(payments.amount where payments.invoice_id = invoice._id)`
- `remaining_amount = total_amount - paid_amount`
- `status`:
  - `unpaid` if paid = 0
  - `partial` if 0 < paid < total
  - `completed` if paid >= total

## Product Validation Rules

- `sku`: required, unique, uppercase preferred.
- `name`: required, min 2 chars.
- `category`: required, must be one of enum values.
- `price`: required, > 0.
- `is_active`: default true (soft delete support).
