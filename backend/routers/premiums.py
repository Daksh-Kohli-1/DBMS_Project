from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from database import get_db
import models, schemas
from auth_utils import get_current_user
from datetime import date

router = APIRouter()


def _mark_overdue(premiums: list, db: Session) -> list:
    """
    Query-time overdue transition — no background job needed.

    For every 'pending' premium whose due date has already passed,
    flip status to 'overdue' and persist in the same DB session.
    This runs inside the GET handler so the DB stays consistent
    without a scheduler.

    Why not a background job?
    - Simpler for a project this size.
    - ACID-safe: the UPDATE is committed before the response is sent,
      so the frontend always sees the correct status.
    - Trade-off: stale 'pending' rows exist between reads, but that's
      acceptable — the customer only sees the page when they open it.
    """
    today   = date.today()
    changed = False
    for p in premiums:
        if p.status == "pending" and p.date < today:
            p.status = "overdue"
            changed  = True
    if changed:
        db.commit()
    return premiums


# ── READ ENDPOINTS ─────────────────────────────────────────────────────────────

@router.get("/", response_model=List[schemas.PremiumOut])
def list_premiums(db: Session = Depends(get_db), _=Depends(get_current_user)):
    premiums = db.query(models.Premium).all()
    return _mark_overdue(premiums, db)


@router.get("/policy/{policy_id}", response_model=List[schemas.PremiumOut])
def premiums_for_policy(
    policy_id: int,
    db: Session = Depends(get_db),
    _=Depends(get_current_user),
):
    premiums = db.query(models.Premium).filter(models.Premium.policy_id == policy_id).all()
    return _mark_overdue(premiums, db)


@router.get("/customer/{customer_id}", response_model=List[schemas.PremiumOut])
def premiums_for_customer(
    customer_id: int,
    db: Session = Depends(get_db),
    _=Depends(get_current_user),
):
    holders = (
        db.query(models.PolicyHolder)
        .filter(models.PolicyHolder.customer_id == customer_id)
        .all()
    )
    policy_ids = [h.policy_id for h in holders]
    premiums = (
        db.query(models.Premium)
        .filter(models.Premium.policy_id.in_(policy_ids))
        .order_by(models.Premium.date.asc())
        .all()
    )
    return _mark_overdue(premiums, db)


# ── PAY PREMIUM ────────────────────────────────────────────────────────────────
# Atomic: Premium.status = 'paid'  +  Transaction_ insert in one commit.
# If the commit fails both changes roll back.

@router.post("/{premium_id}/pay", response_model=schemas.TransactionOut)
def pay_premium(
    premium_id: int,
    db: Session = Depends(get_db),
    _=Depends(get_current_user),
):
    premium = (
        db.query(models.Premium)
        .filter(models.Premium.premium_id == premium_id)
        .first()
    )
    if not premium:
        raise HTTPException(status_code=404, detail="Premium not found")
    if premium.status == "paid":
        raise HTTPException(status_code=400, detail="Premium already paid")

    premium.status = "paid"
    txn = models.Transaction_(
        premium_id       = premium_id,
        transaction_date = date.today(),
        amount           = premium.premium_amount,
        status           = "success",
    )
    db.add(txn)
    db.commit()
    db.refresh(txn)
    return txn