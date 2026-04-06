from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from database import get_db
import models, schemas
from auth_utils import get_current_user, require_admin

router = APIRouter()

@router.get("/", response_model=List[schemas.CustomerOut])
def list_customers(db: Session = Depends(get_db), _=Depends(get_current_user)):
    return db.query(models.Customer).all()

@router.get("/{customer_id}", response_model=schemas.CustomerOut)
def get_customer(customer_id: int, db: Session = Depends(get_db), _=Depends(get_current_user)):
    c = db.query(models.Customer).filter(models.Customer.customer_id == customer_id).first()
    if not c:
        raise HTTPException(404, "Customer not found")
    return c

@router.post("/", response_model=schemas.CustomerOut)
def create_customer(body: schemas.CustomerCreate, db: Session = Depends(get_db), _=Depends(require_admin)):
    existing = db.query(models.Customer).filter(models.Customer.email == body.email).first()
    if existing:
        raise HTTPException(400, "Email already registered")
    c = models.Customer(**body.model_dump())
    db.add(c)
    db.commit()
    db.refresh(c)
    return c

@router.delete("/{customer_id}")
def delete_customer(customer_id: int, db: Session = Depends(get_db), _=Depends(require_admin)):
    c = db.query(models.Customer).filter(models.Customer.customer_id == customer_id).first()
    if not c:
        raise HTTPException(404, "Customer not found")
    db.delete(c)
    db.commit()
    return {"message": "Deleted"}
