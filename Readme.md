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

## Project Structure

```
insurance-system/
├── sql/
│   └── schema.sql              # Full DDL + seed data
│
├── backend/
│   ├── main.py                 # FastAPI app entry, CORS, router registration
│   ├── requirements.txt
│   ├── .env.example
│   ├── core/
│   │   ├── config.py           # Pydantic Settings (env vars)
│   │   └── security.py         # JWT helpers, password hashing
│   ├── database/
│   │   └── db.py               # Engine, SessionLocal, get_db()
│   ├── models/
│   │   └── models.py           # SQLAlchemy ORM models
│   ├── schemas/
│   │   └── schemas.py          # Pydantic request/response schemas
│   ├── services/
│   │   ├── customer_service.py
│   │   ├── policy_service.py   # Policy purchase (atomic)
│   │   ├── premium_service.py  # Payment (atomic), auto-generation
│   │   ├── claim_service.py    # Claim validation + status update
│   │   ├── transaction_service.py
│   │   └── admin_service.py    # SQL console with query validation
│   └── routers/
│       ├── auth.py
│       ├── customers.py
│       ├── policies.py
│       ├── premiums.py
│       ├── transactions.py
│       ├── claims.py
│       └── admin.py
│
└── frontend/
    ├── index.html
    ├── vite.config.js
    ├── tailwind.config.js
    └── src/
        ├── main.jsx
        ├── App.jsx             # Routes + ProtectedLayout
        ├── api/
        │   ├── axios.js        # Axios instance + JWT interceptors
        │   └── services.js     # All API call functions
        ├── hooks/
        │   └── useAuth.jsx     # Auth context
        ├── components/
        │   ├── UI.jsx          # StatusBadge, Modal, DataTable, StatCard…
        │   └── Sidebar.jsx
        └── pages/
            ├── Login.jsx
            ├── Dashboard.jsx
            ├── Customers.jsx
            ├── Policies.jsx
            ├── Premiums.jsx
            ├── Transactions.jsx
            ├── Claims.jsx
            └── SQLConsole.jsx
```

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

Frontend will be available at `http://localhost:5173`

---

## Environment Variables

Create `backend/.env` from `.env.example`:

```env
DATABASE_URL=mysql+pymysql://root:yourpassword@localhost:3306/insurance_db
SECRET_KEY=your-super-secret-key-minimum-32-characters-long
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin123
```

> ⚠️ Change `SECRET_KEY` and `ADMIN_PASSWORD` before any deployment.

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

## Security Features

| Feature | Implementation |
|---|---|
| JWT Authentication | All routes protected via `Depends(get_current_user)` |
| Password Hashing | bcrypt via passlib |
| SQL Injection Prevention | SQLAlchemy ORM parameterized queries throughout |
| SQL Console Protection | Keyword blocklist, SELECT-only enforcement, comment blocking, multi-statement rejection |
| Input Validation | Pydantic v2 schemas on all request bodies |
| Error Sanitization | DB error messages stripped before returning to client |
| CORS | Restricted to localhost:5173 and localhost:3000 |
| Token Expiry | Configurable via `ACCESS_TOKEN_EXPIRE_MINUTES` |

---

## Edge Cases Handled

| Edge Case | Handling |
|---|---|
| Duplicate policy purchase | `HTTP 409` — UNIQUE PK `(customer_id, policy_id)` + pre-check |
| Payment on already-paid premium | `HTTP 400` with clear message |
| Expired policy claim | `HTTP 400` — date comparison against `start_date`/`end_date` |
| Claim > coverage amount | `HTTP 422` — explicit check against `PolicyType.coverage_amount` |
| Non-holder filing a claim | `HTTP 403` — PolicyHolder membership check |
| Duplicate customer email/phone | `HTTP 409` — DB UNIQUE constraint + IntegrityError catch |
| Invalid SQL in console | `HTTP 400` — keyword blocklist + SELECT-only rule |
| Multi-statement SQL | `HTTP 400` — semicolon detection |
| SQL comments (injection vector) | `HTTP 400` — `--`, `/*`, `#` blocked |
| Expired/invalid JWT | `HTTP 401` — jose JWTError caught in `get_current_user` |

---

## Screenshots

> Add screenshots in the `docs/screenshots/` directory:
> - `01_login.png` — Login page
> - `02_dashboard.png` — Dashboard with stats
> - `03_customers.png` — Customer list + add modal
> - `04_policies.png` — Policy types and policies
> - `05_purchase.png` — Policy purchase flow
> - `06_premiums.png` — Premium list with Pay Now
> - `07_transactions.png` — Transaction history
> - `08_claims.png` — Claims with approve/reject
> - `09_sql_console.png` — SQL console with results
> - `10_api_docs.png` — FastAPI /docs swagger UI

---

## Future Improvements

- **Alembic migrations** for schema versioning instead of `create_all()`
- **Role-based access**: separate Customer and Admin roles with scoped permissions
- **Email notifications**: send premium due reminders via SMTP
- **PDF generation**: policy documents and claim reports
- **Pagination**: cursor-based pagination for large tables
- **Audit log**: immutable ledger of all state changes
- **Scheduled tasks**: Celery beat to mark overdue premiums automatically
- **Redis caching**: cache policy type lookups and dashboard stats
- **Docker Compose**: single-command setup for the full stack
- **Unit tests**: pytest suite for all service functions

---

## Academic Context

This project demonstrates practical application of:
- ER modeling → Relational schema conversion
- Normalization (1NF, 2NF, 3NF)
- SQL DDL/DML with constraints and indexes
- Transaction management and ACID properties
- Concurrency control via InnoDB locking
- Clean architecture separation (routes → services → models)