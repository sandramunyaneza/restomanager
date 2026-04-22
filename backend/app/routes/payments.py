from fastapi import APIRouter, Depends, HTTPException, status

from app.auth import get_current_user_id, require_roles
from app.schemas import PaiementCreate, PaiementOut, PaiementRemboursementDemande
from app.services import payment_service

router = APIRouter(prefix="/payments", tags=["payments"])


@router.get("", response_model=list[PaiementOut])
def list_payments(_role: str = Depends(require_roles("admin", "caissier"))):
    rows = payment_service.list_all()
    return [PaiementOut(**r) for r in rows]


@router.post("", response_model=PaiementOut, status_code=status.HTTP_201_CREATED)
def create_payment(
    body: PaiementCreate,
    user_id: int = Depends(get_current_user_id),
    _role: str = Depends(require_roles("admin", "caissier")),
):
    try:
        row = payment_service.create_payment(
            user_id,
            body.id_commande,
            body.montant,
            body.mode_reglement,
        )
    except ValueError as e:
        msg = str(e)
        h = status.HTTP_404_NOT_FOUND if "introuvable" in msg else status.HTTP_400_BAD_REQUEST
        raise HTTPException(status_code=h, detail=msg) from e
    return PaiementOut(**row)


@router.post("/remboursement", response_model=dict)
def rembourser_paiement(
    body: PaiementRemboursementDemande,
    user_id: int = Depends(get_current_user_id),
    _role: str = Depends(require_roles("admin", "caissier")),
):
    try:
        out = payment_service.rembourser_commande(user_id, body.id_commande)
    except ValueError as e:
        msg = str(e)
        h = status.HTTP_404_NOT_FOUND if "introuvable" in msg else status.HTTP_400_BAD_REQUEST
        raise HTTPException(status_code=h, detail=msg) from e
    return out
