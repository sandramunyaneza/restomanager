from fastapi import APIRouter, Depends, HTTPException

from app.auth import get_current_role, get_current_user_id
from app.schemas import CommandeCreate, CommandeOut, CommandeStatutMiseAJour
from app.services import order_service

router = APIRouter(prefix="/orders", tags=["orders"])


def _order_out(oid: int) -> CommandeOut:
    """Même projection que list_orders / CommandeOut (jointure client, type_commande, statut_cuisine)."""
    row = order_service.fetch_commande_header(oid)
    if not row:
        raise HTTPException(status_code=404, detail="Commande introuvable")
    return CommandeOut(**row)


@router.get("/me", response_model=list[CommandeOut])
def list_my_orders(
    user_id: int = Depends(get_current_user_id),
    role: str = Depends(get_current_role),
):
    """Alias explicite pour le client (même filtrage que GET /orders)."""
    rows = order_service.list_orders(user_id, role)
    return [CommandeOut(**r) for r in rows]


@router.get("", response_model=list[CommandeOut])
def list_orders(
    user_id: int = Depends(get_current_user_id),
    role: str = Depends(get_current_role),
):
    rows = order_service.list_orders(user_id, role)
    return [CommandeOut(**r) for r in rows]


@router.post("", response_model=CommandeOut, status_code=201)
def create_order_route(
    body: CommandeCreate,
    user_id: int = Depends(get_current_user_id),
    role: str = Depends(get_current_role),
):
    try:
        oid = order_service.create_order(body, user_id, role)
    except PermissionError as e:
        raise HTTPException(status_code=403, detail=str(e)) from e
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e)) from e
    return _order_out(oid)


@router.patch("/{order_id}/status", response_model=CommandeOut)
def patch_status(
    order_id: int,
    body: CommandeStatutMiseAJour,
    role: str = Depends(get_current_role),
):
    if role not in ("admin", "caissier", "cuisinier", "serveur"):
        raise HTTPException(status_code=403, detail="Permission refusée")
    try:
        ok = order_service.update_order_status(order_id, body.etat_commande)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e)) from e
    if not ok:
        raise HTTPException(status_code=404, detail="Commande introuvable")
    return _order_out(order_id)
