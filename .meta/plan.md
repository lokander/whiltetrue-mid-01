# Expense Tracker API - Implementation Plan

## Overview
Building a REST API for tracking employee expenses with approval workflow using Node.js, Express, SQLite, and JWT authentication.

## Milestones

### 1. Project Setup
- Initialize package.json with dependencies
- Set up project structure (routes, models, middleware, db)
- Configure environment variables (.env)
- Create .gitignore

### 2. Database Layer
- Create database schema (users, categories, expenses tables)
- Implement database initialization
- Create seed data function
- Add database utility functions

### 3. Authentication System
- Implement user model
- Create JWT middleware
- Build auth routes (register, login, /me)
- Add password hashing with bcrypt

### 4. Category Management
- Implement category model
- Create category routes (list, create, delete)
- Add manager-only middleware
- Handle system category protection

### 5. Expense CRUD
- Implement expense model
- Create expense routes (create, list, get, update, delete)
- Add validation middleware
- Implement access control (employees see own, managers see all)

### 6. Approval Workflow
- Create approval routes (approve, reject)
- Add manager-only validation
- Prevent self-approval
- Update expense status tracking

### 7. Reports System
- Implement summary by category
- Add by-user report (manager only)
- Create by-status report
- Add date range filtering

### 8. Testing
- Set up Jest with in-memory SQLite
- Write auth tests
- Write expense CRUD tests
- Write approval workflow tests
- Write permission tests
- Write validation tests

### 9. Documentation & Cleanup
- Create README.md
- Test all endpoints manually
- Final git commit

## Key Assumptions
- Using better-sqlite3 for synchronous operations (simpler)
- JWT_SECRET must be in .env file
- Server runs on port 8000 by default
- Amount stored as real numbers (SQLite doesn't have decimal type)
- Date format: ISO 8601 (YYYY-MM-DD)
- Token expiry: 24 hours

## Project Structure
```
/workspace
├── src/
│   ├── db/
│   │   ├── schema.js      # Database schema and initialization
│   │   └── seed.js        # Seed data
│   ├── models/
│   │   ├── user.js        # User model
│   │   ├── category.js    # Category model
│   │   └── expense.js     # Expense model
│   ├── middleware/
│   │   ├── auth.js        # JWT authentication
│   │   ├── validation.js  # Request validation
│   │   └── roles.js       # Role-based access control
│   ├── routes/
│   │   ├── auth.js        # Auth routes
│   │   ├── categories.js  # Category routes
│   │   ├── expenses.js    # Expense routes
│   │   └── reports.js     # Report routes
│   ├── utils/
│   │   └── db.js          # Database connection
│   └── app.js             # Express app setup
├── tests/
│   ├── auth.test.js
│   ├── expenses.test.js
│   ├── approval.test.js
│   └── permissions.test.js
├── .env.example
├── .gitignore
├── package.json
├── server.js              # Entry point
└── README.md
```
