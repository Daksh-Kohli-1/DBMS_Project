from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from typing import List
from database import get_db
import models, schemas
from auth_utils import get_current_user, require_admin
from datetime import date

router = APIRouter()

@router.get("/", response_model=List[schemas.PolicyDetail])
def list_policies(db: Session = Depends(get_db), _=Depends(get_current_user)):
    return db.query(models.Policy).options(joinedload(models.Policy.policy_type)).all()

@router.get("/types", response_model=List[schemas.PolicyTypeOut])
def list_policy_types(db: Session = Depends(get_db), _=Depends(get_current_user)):
    return db.query(models.PolicyType).all()

@router.get("/customer/{customer_id}", response_model=List[schemas.PolicyDetail])
def customer_policies(customer_id: int, db: Session = Depends(get_db), _=Depends(get_current_user)):
    holders = db.query(models.PolicyHolder).filter(
        models.PolicyHolder.customer_id == customer_id
    ).all()
    policy_ids = [h.policy_id for h in holders]
    return db.query(models.Policy).options(
        joinedload(models.Policy.policy_type)
    ).filter(models.Policy.policy_id.in_(policy_ids)).all()

@router.post("/", response_model=schemas.PolicyOut)
def create_policy(body: schemas.PolicyCreate, db: Session = Depends(get_db), _=Depends(require_admin)):
    policy = models.Policy(
        policy_type_id=body.policy_type_id,
        start_date=body.start_date,
        end_date=body.end_date,
    )
    db.add(policy)
    db.flush()
    holder = models.PolicyHolder(customer_id=body.customer_id, policy_id=policy.policy_id)
    db.add(holder)
    db.commit()
    db.refresh(policy)
    return policy

@router.delete("/{policy_id}")
def delete_policy(policy_id: int, db: Session = Depends(get_db), _=Depends(require_admin)):
    p = db.query(models.Policy).filter(models.Policy.policy_id == policy_id).first()
    if not p:
        raise HTTPException(404, "Policy not found")
    db.delete(p)
    db.commit()
    return {"message": "Deleted"}
