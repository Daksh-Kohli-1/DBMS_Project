from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List
from database import get_db
import models, schemas
from auth_utils import get_current_user

router = APIRouter()

@router.get("/", response_model=List[schemas.TransactionOut])
def list_transactions(db: Session = Depends(get_db), _=Depends(get_current_user)):
    return db.query(models.Transaction_).all()

@router.get("/customer/{customer_id}", response_model=List[schemas.TransactionOut])
def customer_transactions(customer_id: int, db: Session = Depends(get_db), _=Depends(get_current_user)):
    holders = db.query(models.PolicyHolder).filter(
        models.PolicyHolder.customer_id == customer_id
    ).all()
    policy_ids = [h.policy_id for h in holders]
    premiums = db.query(models.Premium).filter(models.Premium.policy_id.in_(policy_ids)).all()
    premium_ids = [p.premium_id for p in premiums]
    return db.query(models.Transaction_).filter(models.Transaction_.premium_id.in_(premium_ids)).all()
