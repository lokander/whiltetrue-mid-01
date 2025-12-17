# Expense Tracker API

A REST API for tracking employee expenses with approval workflow. Built with Node.js, Express, SQLite, and JWT authentication.

## Features

- User authentication with JWT tokens
- Role-based access control (Employee and Manager roles)
- Expense creation and management
- Approval workflow for managers
- Category management
- Comprehensive reporting system
- Input validation and security

## Tech Stack

- Node.js with Express
- SQLite with better-sqlite3
- JWT for authentication
- bcrypt for password hashing
- Jest and Supertest for testing

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm

### Installation

1. Clone the repository or extract the files

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```

Edit `.env` and set a secure JWT_SECRET:
```
JWT_SECRET=your-secure-secret-key-here
PORT=8000
NODE_ENV=development
```

### Running the Application

Start the server:
```bash
npm start
```

For development with auto-reload:
```bash
npm run dev
```

The server will start on port 8000 (or the PORT specified in .env).

### Running Tests

Run all tests:
```bash
npm test
```

The tests use an in-memory SQLite database and include:
- Authentication tests
- CRUD operation tests
- Approval workflow tests
- Permission and access control tests

## Seed Data

The application automatically creates seed data on first run:

**Users:**
- Manager: `manager@example.com` / `password123`
- Employee: `employee@example.com` / `password123`

**Categories:**
- Uncategorized (system category)
- Travel
- Meals
- Software

## API Documentation

### Authentication

#### Register
```
POST /auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123",
  "name": "John Doe"
}
```

#### Login
```
POST /auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}

Response:
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

#### Get Current User
```
GET /auth/me
Authorization: Bearer <token>
```

### Categories

#### List Categories
```
GET /categories
Authorization: Bearer <token>
```

#### Create Category (Manager only)
```
POST /categories
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Office Supplies"
}
```

#### Delete Category (Manager only)
```
DELETE /categories/:id
Authorization: Bearer <token>
```

### Expenses

#### Create Expense
```
POST /expenses
Authorization: Bearer <token>
Content-Type: application/json

{
  "category_id": 2,
  "amount": 125.50,
  "description": "Client lunch",
  "receipt_date": "2024-01-15"
}
```

#### List Expenses
```
GET /expenses
Authorization: Bearer <token>

Query Parameters:
- status: pending|approved|rejected
- category_id: number
- from_date: YYYY-MM-DD
- to_date: YYYY-MM-DD
- limit: number (default 20, max 100)
- offset: number (default 0)
```

#### Get Expense by ID
```
GET /expenses/:id
Authorization: Bearer <token>
```

#### Update Expense (own, pending only)
```
PUT /expenses/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "category_id": 2,
  "amount": 150.00,
  "description": "Updated description",
  "receipt_date": "2024-01-15"
}
```

#### Delete Expense (own, pending only)
```
DELETE /expenses/:id
Authorization: Bearer <token>
```

### Approval (Manager only)

#### List Pending Expenses
```
GET /expenses/pending
Authorization: Bearer <token>
```

#### Approve Expense
```
POST /expenses/:id/approve
Authorization: Bearer <token>
```

#### Reject Expense
```
POST /expenses/:id/reject
Authorization: Bearer <token>
Content-Type: application/json

{
  "reason": "Missing receipt"
}
```

### Reports

#### Summary by Category
```
GET /reports/summary
Authorization: Bearer <token>

Query Parameters:
- from_date: YYYY-MM-DD (optional, defaults to start of current month)
- to_date: YYYY-MM-DD (optional, defaults to end of current month)

Response:
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

#### Summary by User (Manager only)
```
GET /reports/by-user
Authorization: Bearer <token>

Query Parameters: Same as summary report
```

#### Summary by Status
```
GET /reports/by-status
Authorization: Bearer <token>

Query Parameters: Same as summary report
```

## Validation Rules

- Email must be valid format
- Password minimum 8 characters
- Amount must be positive
- Receipt date cannot be in the future
- Cannot modify/delete approved or rejected expenses
- Only managers can approve/reject expenses
- Cannot approve/reject own expenses

## Access Control

- Employees can only see and manage their own expenses
- Managers can see all expenses from all users
- Only managers can approve/reject expenses (but not their own)
- Only managers can create/delete categories
- Reports: employees see only their own data, managers see all users' data

## Project Structure

```
.
├── src/
│   ├── db/
│   │   ├── schema.js          # Database schema
│   │   └── seed.js            # Seed data
│   ├── models/
│   │   ├── user.js            # User model
│   │   ├── category.js        # Category model
│   │   └── expense.js         # Expense model
│   ├── middleware/
│   │   ├── auth.js            # JWT authentication
│   │   ├── validation.js      # Input validation
│   │   └── roles.js           # Role-based access control
│   ├── routes/
│   │   ├── auth.js            # Auth endpoints
│   │   ├── categories.js      # Category endpoints
│   │   ├── expenses.js        # Expense endpoints
│   │   └── reports.js         # Report endpoints
│   ├── utils/
│   │   └── db.js              # Database connection
│   └── app.js                 # Express app setup
├── tests/
│   ├── auth.test.js           # Authentication tests
│   ├── expenses.test.js       # Expense CRUD tests
│   ├── approval.test.js       # Approval workflow tests
│   └── permissions.test.js    # Permission tests
├── .env                       # Environment variables
├── .gitignore
├── package.json
└── server.js                  # Entry point
```

## HTTP Status Codes

- 200: Success
- 201: Created
- 204: No Content (successful deletion)
- 400: Bad Request (validation error)
- 401: Unauthorized (authentication required)
- 403: Forbidden (insufficient permissions)
- 404: Not Found
- 500: Internal Server Error

## License

MIT
