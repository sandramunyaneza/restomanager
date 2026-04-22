from fastapi import APIRouter, Depends, HTTPException

from app.auth import get_current_role, get_current_user_id
from app.database import fetch_one, get_db
from app.schemas import CommandeCreate, CommandeOut, CommandeStatutMiseAJour
from app.services import order_service

router = APIRouter(prefix="/orders", tags=["orders"])

_ORDER_ONE = """
SELECT
  id,
  id_client,
  nature_commande,
  etat_commande,
  montant_total,
  statut_reglement,
  cree_le,
  remarques_commande
FROM commandes
WHERE id = %s
"""


def _order_out(oid: int) -> CommandeOut:
    with get_db() as conn:
        row = fetch_one(conn, _ORDER_ONE, (oid,))
    if not row:
        raise HTTPException(status_code=404, detail="Commande introuvable")
    return CommandeOut(**row)


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
    return _order_out(oid)


@router.patch("/{order_id}/status", response_model=CommandeOut)
def patch_status(
    order_id: int,
    body: CommandeStatutMiseAJour,
    user_id: int = Depends(get_current_user_id),
    role: str = Depends(get_current_role),
):
    if role not in ("admin", "caissier", "cuisinier", "serveur"):
        raise HTTPException(status_code=403, detail="Permission refusée")
    try:
        ok = order_service.update_order_status(order_id, body.etat_commande, user_id)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e)) from e
    if not ok:
        raise HTTPException(status_code=404, detail="Commande introuvable")
    return _order_out(order_id)