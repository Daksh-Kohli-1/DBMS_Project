from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import engine, Base
from routers import customers, policies, premiums, claims, transactions, admin, auth

app = FastAPI(title="Insurance Management API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router,         prefix="/auth",         tags=["Auth"])
app.include_router(customers.router,    prefix="/customers",    tags=["Customers"])
app.include_router(policies.router,     prefix="/policies",     tags=["Policies"])
app.include_router(premiums.router,     prefix="/premiums",     tags=["Premiums"])
app.include_router(claims.router,       prefix="/claims",       tags=["Claims"])
app.include_router(transactions.router, prefix="/transactions",  tags=["Transactions"])
app.include_router(admin.router,        prefix="/admin",         tags=["Admin"])

@app.get("/")
def root():
    return {"message": "Insurance Management API is running"}
