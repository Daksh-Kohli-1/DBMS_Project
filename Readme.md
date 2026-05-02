# InsureFlow — Insurance Management and Claim System

> A full-stack, production-grade insurance management system built for the UCS310 – Database Management Systems course at Thapar Institute of Engineering and Technology.
>
> **Group Members:** Avleen Kaur (1024030403) · Rishab Kumar Jha (1024030416) · Daksh Kohli (1024030423)
> **Lab Instructor:** Dr. Shashank Singh | **Academic Year:** 2025–2026

---

## Project Overview

InsureFlow is a centralized, database-driven insurance management platform that handles customers, policies, premium payments, transactions, and claims. It replaces manual/file-based systems with a properly normalized relational database (MySQL) backed by a FastAPI REST API and a React admin dashboard.

The system directly maps to the **ER model and relational schema** designed in the DBMS synopsis, with full implementation of:
- Normalized schema (1NF → 2NF → 3NF)
- ACID-compliant transaction management
- Clean three-tier architecture (Frontend → API → Database)
- Admin SQL console with security guardrails

---

## Features

| Feature | Details |
|---|---|
| Customer Management | Create, view, delete customers with phone/email uniqueness |
| Policy Management | Policy types with coverage/rules, policy creation, purchase flow |
| Premium Auto-Generation | Monthly premiums auto-created on policy purchase |
| Payment Processing | Atomic premium payment → transaction recording |
| Claims System | File claims with holder/validity/coverage checks, approve/reject |
| Admin SQL Console | Secure SELECT-only query console with live results |
| JWT Authentication | Login-protected API, token stored in localStorage |
| Dashboard | Real-time stats: revenue, premiums health, claim counts |

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + Vite + TailwindCSS |
| Backend | FastAPI (Python 3.11+) |
| ORM | SQLAlchemy 2.0 |
| Database | MySQL 8.0 |
| Auth | JWT (python-jose + passlib bcrypt) |
| Validation | Pydantic v2 |
| HTTP Client | Axios |

---

## Database Design

### Entity–Relationship Summary

```
Customer ──(M:N via PolicyHolder)── Policy ──(N:1)── PolicyType
                                       │
                                  ┌────┴─────┐
                                  │          │
                               Premium     Claim
                                  │
                             Transaction
```

### Relational Schema

| Table | Primary Key | Foreign Keys |
|---|---|---|
| `Customer` | `customer_id` | — |
| `PolicyType` | `policy_type_id` | — |
| `Policy` | `policy_id` | `policy_type_id → PolicyType` |
| `PolicyHolder` | `(customer_id, policy_id)` | both → Customer, Policy |
| `Premium` | `premium_id` | `policy_id → Policy` |
| `Transaction` | `transaction_id` | `premium_id → Premium` |
| `Claim` | `claim_id` | `policy_id → Policy` |

### ENUM Fields
- `Premium.status`: `pending` | `paid` | `overdue`
- `Transaction.status`: `success` | `failed` | `pending`
- `Claim.status`: `pending` | `approved` | `rejected`

### Normalization
- **1NF**: All attributes atomic, no repeating groups
- **2NF**: `PolicyHolder` junction removes partial dependencies from the M:N relationship
- **3NF**: `PolicyType` separated from `Policy` — no transitive dependencies

---



## API Endpoints

### Auth
| Method | Endpoint | Description |
|---|---|---|
| POST | `/auth/login` | Get JWT token |

### Customers
| Method | Endpoint | Description |
|---|---|---|
| GET | `/customers/` | List all customers |
| GET | `/customers/{id}` | Get customer by ID |
| POST | `/customers/` | Create customer |
| DELETE | `/customers/{id}` | Delete customer |

### Policies
| Method | Endpoint | Description |
|---|---|---|
| GET | `/policies/types` | List policy types |
| POST | `/policies/types` | Create policy type |
| GET | `/policies/` | List all policies |
| POST | `/policies/` | Create policy |
| POST | `/policies/purchase` | **Atomic** policy purchase |
| GET | `/policies/customer/{id}` | Policies by customer |

### Premiums
| Method | Endpoint | Description |
|---|---|---|
| GET | `/premiums/` | List all premiums |
| GET | `/premiums/{id}` | Get premium |
| GET | `/premiums/policy/{id}` | Premiums for a policy |
| POST | `/premiums/pay` | **Atomic** premium payment |

### Transactions
| Method | Endpoint | Description |
|---|---|---|
| GET | `/transactions/` | List all transactions |
| GET | `/transactions/{id}` | Get transaction |
| GET | `/transactions/premium/{id}` | Transactions for a premium |

### Claims
| Method | Endpoint | Description |
|---|---|---|
| GET | `/claims/` | List all claims |
| GET | `/claims/{id}` | Get claim |
| POST | `/claims/` | File new claim |
| PATCH | `/claims/{id}/status` | Approve/reject claim |

### Admin
| Method | Endpoint | Description |
|---|---|---|
| POST | `/admin/run-query` | Execute SELECT query |

All endpoints (except `/auth/login`) require `Authorization: Bearer <token>` header.

---

## Setup Instructions

### Prerequisites
- Python 3.11+
- Node.js 18+
- MySQL 8.0

### 1. Database Setup

```bash
mysql -u root -p < sql/schema.sql
```

This creates the `insurance_db` database, all tables with constraints/indexes, and inserts seed data.

### 2. Backend Setup

```bash
cd backend

# Create and activate virtual environment
python -m venv venv
source venv/bin/activate       # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env with your MySQL credentials and a strong SECRET_KEY

# Run the server
uvicorn main:app --reload --port 8000
```

API will be available at `http://localhost:8000`
Interactive docs: `http://localhost:8000/docs`

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Run development server
npm run dev
```

Frontend will be available at `http://localhost:3000`

---


## Transaction Management

Three critical operations are fully atomic using SQLAlchemy sessions (InnoDB transactions):

### Policy Purchase (`policy_service.py`)
```
BEGIN
  → Validate Customer exists
  → Validate Policy exists
  → Check no duplicate PolicyHolder
  → INSERT PolicyHolder row
  → INSERT N Premium rows (monthly schedule)
COMMIT  ← all succeed together
ROLLBACK ← on IntegrityError or any exception
```

### Premium Payment (`premium_service.py`)
```
BEGIN
  → Validate Premium is payable (not already paid)
  → INSERT Transaction (status=pending)
  → FLUSH (get transaction_id without committing)
  → UPDATE Premium.status = 'paid'
  → UPDATE Transaction.status = 'success'
COMMIT
ROLLBACK ← Premium status unchanged; failed Transaction recorded
```

### Claim Creation (`claim_service.py`)
```
Validate PolicyHolder membership
Validate policy active on claim date
Validate claim_amount ≤ coverage_amount
BEGIN
  → INSERT Claim (status=pending)
COMMIT
ROLLBACK ← on DB error
```

### ACID Properties

| Property | How It Is Enforced |
|---|---|
| **Atomicity** | `db.rollback()` on any exception reverts all operations in the session |
| **Consistency** | FK constraints, ENUM types, NOT NULL prevent invalid state |
| **Isolation** | InnoDB `READ COMMITTED` default; UNIQUE constraints prevent race condition duplicates |
| **Durability** | InnoDB writes to redo log on `COMMIT`; data survives crashes |

---



## Academic Context

This project demonstrates practical application of:
- ER modeling → Relational schema conversion
- Normalization (1NF, 2NF, 3NF)
- SQL DDL/DML with constraints and indexes
- Transaction management and ACID properties
- Concurrency control via InnoDB locking
- Clean architecture separation (routes → services → models)