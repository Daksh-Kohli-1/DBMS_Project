from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from database import get_db
import models, schemas
from auth_utils import get_current_user, require_admin

router = APIRouter()

@router.get("/", response_model=List[schemas.ClaimOut])
def list_claims(db: Session = Depends(get_db), _=Depends(get_current_user)):
    return db.query(models.Claim).all()

@router.get("/customer/{customer_id}", response_model=List[schemas.ClaimOut])
def customer_claims(customer_id: int, db: Session = Depends(get_db), _=Depends(get_current_user)):
    holders = db.query(models.PolicyHolder).filter(
        models.PolicyHolder.customer_id == customer_id
    ).all()
    policy_ids = [h.policy_id for h in holders]
    return db.query(models.Claim).filter(models.Claim.policy_id.in_(policy_ids)).all()

@router.post("/", response_model=schemas.ClaimOut)
def file_claim(body: schemas.ClaimCreate, db: Session = Depends(get_db), _=Depends(get_current_user)):
    claim = models.Claim(**body.model_dump())
    db.add(claim)
    db.commit()
    db.refresh(claim)
    return claim

@router.patch("/{claim_id}", response_model=schemas.ClaimOut)
def update_claim(claim_id: int, body: schemas.ClaimUpdate, db: Session = Depends(get_db), _=Depends(require_admin)):
    claim = db.query(models.Claim).filter(models.Claim.claim_id == claim_id).first()
    if not claim:
        raise HTTPException(404, "Claim not found")
    if body.status not in ("pending", "approved", "rejected"):
        raise HTTPException(400, "Invalid status")
    claim.status = body.status
    db.commit()
    db.refresh(claim)
    return claim

@router.delete("/{claim_id}")
def delete_claim(claim_id: int, db: Session = Depends(get_db), _=Depends(require_admin)):
    claim = db.query(models.Claim).filter(models.Claim.claim_id == claim_id).first()
    if not claim:
        raise HTTPException(404, "Claim not found")
    db.delete(claim)
    db.commit()
    return {"message": "Deleted"}
