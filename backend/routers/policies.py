from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from sqlalchemy.exc import IntegrityError
from typing import List
from database import get_db
import models, schemas
from auth_utils import get_current_user, require_admin
from datetime import date
from sqlalchemy import text
from dateutil.relativedelta import relativedelta

router = APIRouter()


# ──────────────────────────────────────────────────────────────────────────────
# READ ENDPOINTS
# ──────────────────────────────────────────────────────────────────────────────

@router.get("/", response_model=List[schemas.PolicyDetail])
def list_policies(db: Session = Depends(get_db), _=Depends(get_current_user)):
    return (
        db.query(models.Policy)
        .options(joinedload(models.Policy.policy_type))
        .all()
    )


@router.get("/types", response_model=List[schemas.PolicyTypeOut])
def list_policy_types(db: Session = Depends(get_db), _=Depends(get_current_user)):
    return db.query(models.PolicyType).all()


@router.get("/customer/{customer_id}", response_model=List[schemas.PolicyDetail])
def customer_policies(
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
    return (
        db.query(models.Policy)
        .options(joinedload(models.Policy.policy_type))
        .filter(models.Policy.policy_id.in_(policy_ids))
        .all()
    )


# ──────────────────────────────────────────────────────────────────────────────
# BUY POLICY  (self-service)
#
# Transaction scope (all-or-nothing):
#   1. Policy row
#   2. PolicyHolder row
#   3. N Premium rows  (one per month for the full policy duration)
#
# If any insert fails every row is rolled back — no dangling Policy without
# premiums, no premiums without a Policy.
#
# Isolation: SET SESSION SERIALIZABLE so the duplicate-active check and the
# subsequent inserts are one atomic unit under MySQL (avoids error 1568).
# ──────────────────────────────────────────────────────────────────────────────

@router.post("/buy", response_model=schemas.PolicyOut)
def buy_policy(
    body: schemas.PolicyBuyRequest,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    # ── 1. Serializable isolation (MySQL-safe) ────────────────────────────────
    db.execute(text("SET SESSION TRANSACTION ISOLATION LEVEL SERIALIZABLE"))

    # ── 2. Verify policy type exists ──────────────────────────────────────────
    policy_type = (
        db.query(models.PolicyType)
        .filter(models.PolicyType.policy_type_id == body.policy_type_id)
        .first()
    )
    if not policy_type:
        raise HTTPException(status_code=404, detail="Policy type not found")

    # ── 3. Reject if customer already has an active policy of this type ───────
    today = date.today()
    existing_active = (
        db.query(models.Policy)
        .join(models.PolicyHolder, models.Policy.policy_id == models.PolicyHolder.policy_id)
        .filter(
            models.PolicyHolder.customer_id == current_user.customer_id,
            models.Policy.policy_type_id    == body.policy_type_id,
            models.Policy.end_date          >= today,
        )
        .first()
    )
    if existing_active:
        raise HTTPException(
            status_code=409,
            detail="You already have an active policy of this type.",
        )

    # ── 4. Compute policy dates ───────────────────────────────────────────────
    start_date = today
    end_date   = today + relativedelta(months=int(policy_type.time_period))

    # ── 5. Atomic insert: Policy + PolicyHolder + Premium schedule ────────────
    #
    # Premium schedule logic:
    #   - One Premium row per month for the full time_period.
    #   - Due date = start_date + N months (month 1 is due one month in).
    #   - Amount sourced from policy_type.premium_amount (monthly cost).
    #   - All start as 'pending'; overdue transition happens at query time
    #     in the premiums router (no background job needed).
    #
    try:
        # 5a. Policy
        policy = models.Policy(
            policy_type_id=body.policy_type_id,
            start_date=start_date,
            end_date=end_date,
        )
        db.add(policy)
        db.flush()  # generates policy.policy_id without committing

        # 5b. PolicyHolder
        holder = models.PolicyHolder(
            customer_id=current_user.customer_id,
            policy_id=policy.policy_id,
        )
        db.add(holder)

        # 5c. Premium schedule — one row per month
        for month in range(1, int(policy_type.time_period) + 1):
            due_date = start_date + relativedelta(months=month)
            premium  = models.Premium(
                policy_id      = policy.policy_id,
                date           = due_date,
                premium_amount = policy_type.premium_amount,
                status         = "pending",
            )
            db.add(premium)

        db.commit()
        db.refresh(policy)

    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=409,
            detail="Could not complete purchase — constraint error.",
        )

    return policy


# ──────────────────────────────────────────────────────────────────────────────
# ADMIN-ONLY ENDPOINTS
# ──────────────────────────────────────────────────────────────────────────────

@router.post("/", response_model=schemas.PolicyOut)
def create_policy(
    body: schemas.PolicyCreate,
    db: Session = Depends(get_db),
    _=Depends(require_admin),
):
    policy = models.Policy(
        policy_type_id=body.policy_type_id,
        start_date=body.start_date,
        end_date=body.end_date,
    )
    db.add(policy)
    db.flush()
    holder = models.PolicyHolder(
        customer_id=body.customer_id,
        policy_id=policy.policy_id,
    )
    db.add(holder)
    db.commit()
    db.refresh(policy)
    return policy


@router.delete("/{policy_id}")
def delete_policy(
    policy_id: int,
    db: Session = Depends(get_db),
    _=Depends(require_admin),
):
    p = db.query(models.Policy).filter(models.Policy.policy_id == policy_id).first()
    if not p:
        raise HTTPException(404, "Policy not found")
    db.delete(p)
    db.commit()
    return {"message": "Deleted"}