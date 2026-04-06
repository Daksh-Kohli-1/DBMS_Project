from sqlalchemy import Column, Integer, String, Numeric, Date, Text, Enum, ForeignKey, TIMESTAMP, func
from sqlalchemy.orm import relationship
from database import Base

class User(Base):
    __tablename__ = "users"
    id            = Column(Integer, primary_key=True, index=True)
    username      = Column(String(100), unique=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    role          = Column(Enum("customer","admin"), default="customer")
    customer_id   = Column(Integer, ForeignKey("Customer.customer_id"), nullable=True)
    created_at    = Column(TIMESTAMP, server_default=func.now())

class Customer(Base):
    __tablename__ = "Customer"
    customer_id = Column(Integer, primary_key=True, autoincrement=True)
    name        = Column(String(100), nullable=False)
    phone       = Column(String(15))
    email       = Column(String(100), unique=True, nullable=False)
    holders     = relationship("PolicyHolder", back_populates="customer")

class PolicyType(Base):
    __tablename__ = "PolicyType"
    policy_type_id  = Column(Integer, primary_key=True, autoincrement=True)
    type_name       = Column(String(100), nullable=False)
    coverage_amount = Column(Numeric(12,2), nullable=False)
    rules           = Column(Text)
    time_period     = Column(Integer, nullable=False)
    policies        = relationship("Policy", back_populates="policy_type")

class Policy(Base):
    __tablename__ = "Policy"
    policy_id      = Column(Integer, primary_key=True, autoincrement=True)
    policy_type_id = Column(Integer, ForeignKey("PolicyType.policy_type_id"), nullable=False)
    start_date     = Column(Date, nullable=False)
    end_date       = Column(Date, nullable=False)
    policy_type    = relationship("PolicyType", back_populates="policies")
    holders        = relationship("PolicyHolder", back_populates="policy")
    premiums       = relationship("Premium", back_populates="policy")
    claims         = relationship("Claim", back_populates="policy")

class PolicyHolder(Base):
    __tablename__ = "PolicyHolder"
    customer_id = Column(Integer, ForeignKey("Customer.customer_id"), primary_key=True)
    policy_id   = Column(Integer, ForeignKey("Policy.policy_id"), primary_key=True)
    customer    = relationship("Customer", back_populates="holders")
    policy      = relationship("Policy", back_populates="holders")

class Premium(Base):
    __tablename__ = "Premium"
    premium_id     = Column(Integer, primary_key=True, autoincrement=True)
    policy_id      = Column(Integer, ForeignKey("Policy.policy_id"), nullable=False)
    date           = Column(Date, nullable=False)
    premium_amount = Column(Numeric(10,2), nullable=False)
    status         = Column(Enum("pending","paid","overdue"), default="pending")
    policy         = relationship("Policy", back_populates="premiums")
    transactions   = relationship("Transaction_", back_populates="premium")

class Transaction_(Base):
    __tablename__ = "Transaction_"
    transaction_id   = Column(Integer, primary_key=True, autoincrement=True)
    premium_id       = Column(Integer, ForeignKey("Premium.premium_id"), nullable=False)
    transaction_date = Column(Date, nullable=False)
    amount           = Column(Numeric(10,2), nullable=False)
    status           = Column(Enum("success","failed","pending"), default="success")
    premium          = relationship("Premium", back_populates="transactions")

class Claim(Base):
    __tablename__ = "Claim"
    claim_id     = Column(Integer, primary_key=True, autoincrement=True)
    policy_id    = Column(Integer, ForeignKey("Policy.policy_id"), nullable=False)
    claim_date   = Column(Date, nullable=False)
    claim_amount = Column(Numeric(12,2), nullable=False)
    status       = Column(Enum("pending","approved","rejected"), default="pending")
    description  = Column(Text)
    policy       = relationship("Policy", back_populates="claims")
