from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Query

from app.auth import require_roles
from app.schemas import RapportSynthese
from app.services.report_service import report_aggregate

router = APIRouter(prefix="/reports", tags=["reports"])


@router.get("/summary", response_model=RapportSynthese)
def summary(
    period: str = Query(..., pattern="^(day|month|year)$"),
    ref: str = Query(..., description="YYYY-MM-DD, YYYY-MM ou YYYY"),
    _role: str = Depends(require_roles("admin", "caissier")),
):
    try:
        if period == "day":
            datetime.strptime(ref, "%Y-%m-%d")
        elif period == "month":
            datetime.strptime(ref + "-01", "%Y-%m-%d")
        elif period == "year":
            datetime.strptime(ref + "-01-01", "%Y-%m-%d")
    except ValueError as e:
        raise HTTPException(status_code=400, detail="Format de date invalide") from e
    try:
        data = report_aggregate(period, ref)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e)) from e
    return RapportSynthese(**data)
