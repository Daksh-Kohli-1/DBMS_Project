from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from database import get_db
import models, schemas
from auth_utils import get_current_user
from datetime import date

router = APIRouter()

@router.get("/", response_model=List[schemas.PremiumOut])
def list_premiums(db: Session = Depends(get_db), _=Depends(get_current_user)):
    return db.query(models.Premium).all()

@router.get("/policy/{policy_id}", response_model=List[schemas.PremiumOut])
def premiums_for_policy(policy_id: int, db: Session = Depends(get_db), _=Depends(get_current_user)):
    return db.query(models.Premium).filter(models.Premium.policy_id == policy_id).all()

@router.get("/customer/{customer_id}", response_model=List[schemas.PremiumOut])
def premiums_for_customer(customer_id: int, db: Session = Depends(get_db), _=Depends(get_current_user)):
    holders = db.query(models.PolicyHolder).filter(
        models.PolicyHolder.customer_id == customer_id
    ).all()
    policy_ids = [h.policy_id for h in holders]
    return db.query(models.Premium).filter(models.Premium.policy_id.in_(policy_ids)).all()

@router.post("/{premium_id}/pay", response_model=schemas.TransactionOut)
def pay_premium(premium_id: int, db: Session = Depends(get_db), _=Depends(get_current_user)):
    premium = db.query(models.Premium).filter(models.Premium.premium_id == premium_id).first()
    if not premium:
        raise HTTPException(404, "Premium not found")
    if premium.status == "paid":
        raise HTTPException(400, "Premium already paid")
    txn = models.Transaction_(
        premium_id=premium_id,
        transaction_date=date.today(),
        amount=premium.premium_amount,
        status="success",
    )
    db.add(txn)
    premium.status = "paid"
    db.commit()
    db.refresh(txn)
    return txn
