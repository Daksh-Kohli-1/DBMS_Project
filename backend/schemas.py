from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import date
from decimal import Decimal

# ── Auth ────────────────────────────────────────────
class LoginRequest(BaseModel):
    username: str
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: str
    customer_id: Optional[int] = None
    username: str

# ── Customer ─────────────────────────────────────────
class CustomerCreate(BaseModel):
    name: str
    phone: Optional[str] = None
    email: str

class CustomerOut(BaseModel):
    customer_id: int
    name: str
    phone: Optional[str]
    email: str
    model_config = {"from_attributes": True}

# ── PolicyType ───────────────────────────────────────
class PolicyTypeOut(BaseModel):
    policy_type_id: int
    type_name: str
    coverage_amount: Decimal
    rules: Optional[str]
    time_period: int
    model_config = {"from_attributes": True}

# ── Policy ───────────────────────────────────────────
class PolicyCreate(BaseModel):
    policy_type_id: int
    start_date: date
    end_date: date
    customer_id: int

class PolicyOut(BaseModel):
    policy_id: int
    policy_type_id: int
    start_date: date
    end_date: date
    model_config = {"from_attributes": True}

class PolicyDetail(PolicyOut):
    policy_type: Optional[PolicyTypeOut] = None

# ── Premium ──────────────────────────────────────────
class PremiumOut(BaseModel):
    premium_id: int
    policy_id: int
    date: date
    premium_amount: Decimal
    status: str
    model_config = {"from_attributes": True}

# ── Transaction ──────────────────────────────────────
class TransactionOut(BaseModel):
    transaction_id: int
    premium_id: int
    transaction_date: date
    amount: Decimal
    status: str
    model_config = {"from_attributes": True}

# ── Claim ────────────────────────────────────────────
class ClaimCreate(BaseModel):
    policy_id: int
    claim_date: date
    claim_amount: Decimal
    description: Optional[str] = None

class ClaimUpdate(BaseModel):
    status: str

class ClaimOut(BaseModel):
    claim_id: int
    policy_id: int
    claim_date: date
    claim_amount: Decimal
    status: str
    description: Optional[str]
    model_config = {"from_attributes": True}

# ── Admin SQL ─────────────────────────────────────────
class QueryRequest(BaseModel):
    sql: str

class QueryResult(BaseModel):
    columns: List[str]
    rows: List[List]
    row_count: int

    
class PolicyBuyRequest(BaseModel):
    policy_type_id: int
 
    class Config:
        from_attributes = True
