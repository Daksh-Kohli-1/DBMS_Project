from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import text
from database import get_db
import models, schemas
from auth_utils import require_admin

router = APIRouter()

BLOCKED_KEYWORDS = ["drop","truncate","alter","create","grant","revoke","insert","update","delete"]

@router.post("/query", response_model=schemas.QueryResult)
def run_custom_query(body: schemas.QueryRequest, db: Session = Depends(get_db), _=Depends(require_admin)):
    sql_lower = body.sql.strip().lower()
    if not sql_lower.startswith("select") and not sql_lower.startswith("show") and not sql_lower.startswith("describe") and not sql_lower.startswith("desc"):
        raise HTTPException(400, "Only SELECT / SHOW / DESCRIBE queries are allowed")
    for kw in BLOCKED_KEYWORDS:
        if f" {kw} " in f" {sql_lower} ":
            raise HTTPException(400, f"Keyword '{kw}' is not permitted")
    try:
        result = db.execute(text(body.sql))
        columns = list(result.keys())
        rows = [list(map(str, row)) for row in result.fetchall()]
        return schemas.QueryResult(columns=columns, rows=rows, row_count=len(rows))
    except Exception as e:
        raise HTTPException(400, f"SQL Error: {str(e)}")

@router.get("/reports/summary")
def summary_report(db: Session = Depends(get_db), _=Depends(require_admin)):
    total_customers  = db.query(models.Customer).count()
    total_policies   = db.query(models.Policy).count()
    pending_claims   = db.query(models.Claim).filter(models.Claim.status == "pending").count()
    approved_claims  = db.query(models.Claim).filter(models.Claim.status == "approved").count()
    rejected_claims  = db.query(models.Claim).filter(models.Claim.status == "rejected").count()
    total_premiums   = db.query(models.Premium).count()
    paid_premiums    = db.query(models.Premium).filter(models.Premium.status == "paid").count()
    overdue_premiums = db.query(models.Premium).filter(models.Premium.status == "overdue").count()

    revenue_result = db.execute(text("SELECT COALESCE(SUM(amount),0) FROM Transaction_ WHERE status='success'"))
    total_revenue = float(list(revenue_result)[0][0])

    return {
        "total_customers":  total_customers,
        "total_policies":   total_policies,
        "pending_claims":   pending_claims,
        "approved_claims":  approved_claims,
        "rejected_claims":  rejected_claims,
        "total_premiums":   total_premiums,
        "paid_premiums":    paid_premiums,
        "overdue_premiums": overdue_premiums,
        "total_revenue":    total_revenue,
    }
