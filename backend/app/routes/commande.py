from fastapi import APIRouter, Depends, HTTPException, status

from app.auth import get_current_role, get_current_user_id
from app.schemas import CommandeCreate, CommandeOut, CommandeStatutMiseAJour
from app.services import order_service

router = APIRouter(prefix="/commande", tags=["commande"])


@router.get("/me", response_model=list[CommandeOut])
def list_my_commandes(
    user_id: int = Depends(get_current_user_id),
    role: str = Depends(get_current_role),
):
    if role != "client":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Réservé au profil client (utilisez /orders côté personnel)",
        )
    rows = order_service.list_orders(user_id, role)
    return [CommandeOut(**r) for r in rows]


@router.get("", response_model=list[CommandeOut])
def list_commandes(
    user_id: int = Depends(get_current_user_id),
    role: str = Depends(get_current_role),
):
    if role == "client":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Utilisez GET /api/v1/commande/me",
        )
    rows = order_service.list_orders(user_id, role)
    return [CommandeOut(**r) for r in rows]


@router.post("", response_model=CommandeOut, status_code=201)
def create_commande(
    body: CommandeCreate,
    user_id: int = Depends(get_current_user_id),
    role: str = Depends(get_current_role),
):
    try:
        oid = order_service.create_order(body, user_id, role)
    except PermissionError as e:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(e)) from e
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e)) from e
    row = order_service.fetch_commande_header(oid)
    if not row:
        raise HTTPException(status_code=500, detail="Commande non retrouvée")
    return CommandeOut(**row)


@router.patch("/{order_id}/status", response_model=CommandeOut)
def patch_commande_status(
    order_id: int,
    body: CommandeStatutMiseAJour,
    role: str = Depends(get_current_role),
):
    if role not in ("admin", "caissier", "cuisinier", "serveur"):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Permission refusée")
    try:
        ok = order_service.update_order_status(order_id, body.etat_commande)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e)) from e
    if not ok:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Commande introuvable")
    row = order_service.fetch_commande_header(order_id)
    if not row:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Commande introuvable")
    return CommandeOut(**row)
