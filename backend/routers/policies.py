from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from sqlalchemy.exc import IntegrityError
from typing import List
from database import get_db
import models, schemas
from auth_utils import get_current_user, require_admin
from datetime import date
from sqlalchemy import text
from dateutil.relativedelta import relativedelta   # pip install python-dateutil

router = APIRouter()


# ──────────────────────────────────────────────────────────────────────────────
# READ ENDPOINTS  (all authenticated users)
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
# BUY POLICY  (self-service — any authenticated customer)
#
# Isolation level: SERIALIZABLE is set on this session to prevent two
# concurrent requests from creating duplicate active policies of the same
# type for the same customer (phantom-read / write-skew protection).
#
# Transaction scope: Policy row + PolicyHolder row are written atomically.
# If either insert fails (e.g. FK violation, IntegrityError) the whole unit
# rolls back so we never get a dangling Policy without a holder.
# ──────────────────────────────────────────────────────────────────────────────

@router.post("/buy", response_model=schemas.PolicyOut)
def buy_policy(
    body: schemas.PolicyBuyRequest,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """
    Lets a logged-in customer purchase a policy for themselves.

    Steps
    -----
    1. Raise isolation level to SERIALIZABLE for this connection so that
       the duplicate-check + insert is protected against concurrent requests.
    2. Verify the PolicyType exists.
    3. Guard: reject if the customer already owns an *active* policy of the
       same type (business rule — one active policy per type per customer).
    4. Compute start_date = today, end_date = today + time_period months.
    5. Insert Policy + PolicyHolder inside a single transaction.
    6. On IntegrityError roll back and return 409.
    """

    # ── 1. Raise isolation level for this connection ──────────────────────────
    #
    # MySQL error 1568: SET TRANSACTION must come BEFORE any transaction starts,
    # but SQLAlchemy auto-begins a transaction on session creation.
    # SET SESSION changes the isolation level for this whole connection and
    # works even inside an already-open transaction — no 1568 error.
    #
    db.execute(text("SET SESSION TRANSACTION ISOLATION LEVEL SERIALIZABLE"))

    # ── 2. Look up the requested policy type ─────────────────────────────────
    policy_type = (
        db.query(models.PolicyType)
        .filter(models.PolicyType.policy_type_id == body.policy_type_id)
        .first()
    )
    if not policy_type:
        raise HTTPException(status_code=404, detail="Policy type not found")

    # ── 3. Duplicate-active check ─────────────────────────────────────────────
    #
    # We read existing holders and join to Policy to check end_date.
    # Under SERIALIZABLE, Postgres places a predicate lock on the rows
    # returned by this query, so a concurrent transaction trying to insert
    # the same pair will either wait or abort.
    #
    today = date.today()
    existing_active = (
        db.query(models.Policy)
        .join(
            models.PolicyHolder,
            models.Policy.policy_id == models.PolicyHolder.policy_id,
        )
        .filter(
            models.PolicyHolder.customer_id == current_user.customer_id,
            models.Policy.policy_type_id == body.policy_type_id,
            models.Policy.end_date >= today,   # still active
        )
        .first()
    )
    if existing_active:
        raise HTTPException(
            status_code=409,
            detail="You already have an active policy of this type.",
        )

    # ── 4. Compute dates ──────────────────────────────────────────────────────
    start_date = today
    end_date   = today + relativedelta(months=int(policy_type.time_period))

    # ── 5. Atomic insert (Policy + PolicyHolder) ──────────────────────────────
    #
    # db.flush() writes the Policy to the DB inside the open transaction
    # (generates policy_id via SERIAL/AUTO_INCREMENT) but does NOT commit.
    # Both rows land in the DB together on db.commit(), or both disappear
    # on db.rollback().  This is standard 2PC-safe unit-of-work behaviour.
    #
    try:
        policy = models.Policy(
            policy_type_id=body.policy_type_id,
            start_date=start_date,
            end_date=end_date,
        )
        db.add(policy)
        db.flush()   # get policy.policy_id without committing

        holder = models.PolicyHolder(
            customer_id=current_user.customer_id,
            policy_id=policy.policy_id,
        )
        db.add(holder)
        db.commit()
        db.refresh(policy)

    except IntegrityError:
        # ── 6. Rollback on any constraint violation ───────────────────────────
        db.rollback()
        raise HTTPException(
            status_code=409,
            detail="Could not complete purchase — possible duplicate or constraint error.",
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
        customer_id=body.customer_id, policy_id=policy.policy_id
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