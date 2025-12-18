# Expense Tracker API

A REST API for tracking employee expenses with approval workflow.

## Tech Stack

- Node.js with Express
- SQLite with better-sqlite3 (sync) or sqlite3
- JWT for authentication
- Jest for testing

## Running the App

```bash
npm install
npm start
```

Server runs on port 8000.

## Running Tests

```bash
npm test
```

## Data Models

### User
| Field | Type | Notes |
|-------|------|-------|
| id | int | primary key |
| email | string | unique, required |
| password_hash | string | bcrypt hashed |
| name | string | required |
| role | enum | "employee" or "manager" |
| created_at | datetime | auto |

### Category
| Field | Type | Notes |
|-------|------|-------|
| id | int | primary key |
| name | string | unique, required (e.g., "Travel", "Meals", "Software") |
| is_system | bool | default false, true for "Uncategorized" |

Categories can be deleted by managers, but expenses in that category move to "Uncategorized" (a system category that cannot be deleted).

### Expense
| Field | Type | Notes |
|-------|------|-------|
| id | int | primary key |
| user_id | int | foreign key to User |
| category_id | int | foreign key to Category |
| amount | decimal | required, > 0, stored as tokens (unitless) |
| description | string | required |
| receipt_date | date | required, when expense occurred |
| status | enum | "pending", "approved", "rejected" |
| reviewed_by | int | foreign key to User (manager), nullable |
| reviewed_at | datetime | nullable |
| rejection_reason | string | nullable, required if rejected |
| created_at | datetime | auto |
| updated_at | datetime | auto |

## API Endpoints

### Auth
| Method | Path | Description |
|--------|------|-------------|
| POST | /auth/register | Register new user (defaults to "employee" role) |
| POST | /auth/login | Login, returns JWT token + user info |
| GET | /auth/me | Get current user info |

Login response format:
```json
{
  "access_token": "eyJ...",
  "token_type": "bearer",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "name": "John Doe",
    "role": "employee"
  }
}
```

### Categories
| Method | Path | Description |
|--------|------|-------------|
| GET | /categories | List all categories |
| POST | /categories | Create category (manager only) |
| DELETE | /categories/:id | Delete category (manager only, not system categories) |

### Expenses
| Method | Path | Description |
|--------|------|-------------|
| POST | /expenses | Create expense (own) |
| GET | /expenses | List expenses (own for employee, all for manager) |
| GET | /expenses/:id | Get expense by ID |
| PUT | /expenses/:id | Update expense (own, only if pending) |
| DELETE | /expenses/:id | Delete expense (own, only if pending) |

### Approval (Manager only)
| Method | Path | Description |
|--------|------|-------------|
| GET | /expenses/pending | List all pending expenses |
| POST | /expenses/:id/approve | Approve an expense |
| POST | /expenses/:id/reject | Reject an expense (requires reason) |

### Reports
| Method | Path | Description |
|--------|------|-------------|
| GET | /reports/summary | Summary by category for date range |
| GET | /reports/by-user | Totals grouped by user (manager only) |
| GET | /reports/by-status | Totals grouped by status |

Report response format:
```json
{
  "items": [
    {"category": "Travel", "total": 1500.00, "count": 12},
    {"category": "Meals", "total": 320.50, "count": 8}
  ],
  "grand_total": 1820.50,
  "from_date": "2024-01-01",
  "to_date": "2024-01-31"
}
```

Date range params (`from_date`, `to_date`) are optional - defaults to current month.

## Query Parameters

For list endpoints:
- `?status=pending|approved|rejected` - filter by status
- `?category_id=1` - filter by category
- `?from_date=2024-01-01` - expenses on or after date
- `?to_date=2024-01-31` - expenses on or before date
- `?limit=20&offset=0` - pagination (default limit=20, max limit=100)

## Authentication

- Use JWT tokens (HS256)
- Token expires after 24 hours
- Pass token in `Authorization: Bearer <token>` header
- Secret key from environment variable `JWT_SECRET` (required - store in .env file)

## Validation Rules

- Email must be valid format
- Password minimum 8 characters
- Amount must be positive
- Receipt date cannot be in the future
- Cannot modify/delete approved or rejected expenses
- Only managers can approve/reject
- Cannot approve/reject own expenses

## Access Control

- Employees can only see and manage their own expenses
- Managers can see all expenses from all users
- GET /expenses/:id: employees can only view own, managers can view any
- Only managers can approve/reject expenses (but not their own)
- Only managers can create/delete categories
- Reports: employees see only their own data, managers see all users' data

## Response Formats

Success:
```json
{
  "id": 1,
  "amount": 125.50,
  "description": "Client lunch",
  ...
}
```

List:
```json
{
  "items": [...],
  "total": 45,
  "limit": 20,
  "offset": 0
}
```

Error:
```json
{
  "error": "Expense not found"
}
```

## Seed Data

Create on startup if database is empty:
- 1 system category: "Uncategorized" (is_system=true)
- 3 categories: "Travel", "Meals", "Software"
- 1 manager user: manager@example.com / password123
- 1 employee user: employee@example.com / password123

## Requirements

- All endpoints must have input validation
- Return appropriate HTTP status codes (201 for create, 404 for not found, 403 for forbidden, etc.)
- Write tests for:
  - Auth flow (register, login, protected routes)
  - CRUD operations on expenses
  - Approval workflow
  - Permission checks (employee vs manager)
  - Validation errors
- Tests must use in-memory SQLite database
- Organize code into modules (routes, models, middleware, etc.)
