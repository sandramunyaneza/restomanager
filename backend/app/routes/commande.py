from fastapi import APIRouter, Depends, HTTPException

from app.auth import get_current_role, get_current_user_id
from app.database import fetch_one, get_db
from app.schemas import CommandeCreate, CommandeOut, CommandeStatutMiseAJour
from app.services import order_service

router = APIRouter(prefix="/commande", tags=["commande"])


def _order_out(oid: int) -> CommandeOut:
    with get_db() as conn:
        row = fetch_one(
            conn,
            """
            SELECT id, id_client, nature_commande, etat_commande, montant_total, statut_reglement, cree_le, remarques_commande
            FROM commandes
            WHERE id = %s
            """,
            (oid,),
        )
    if not row:
        raise HTTPException(status_code=404, detail="Commande introuvable")
    return CommandeOut(**row)


@router.get("", response_model=list[CommandeOut])
def list_commandes(user_id: int = Depends(get_current_user_id), role: str = Depends(get_current_role)):
    rows = order_service.list_orders(user_id, role)
    return [CommandeOut(**r) for r in rows]


@router.post("", response_model=CommandeOut, status_code=201)
def create_commande(body: CommandeCreate, user_id: int = Depends(get_current_user_id), role: str = Depends(get_current_role)):
    oid = order_service.create_order(body, user_id, role)
    return _order_out(oid)


@router.patch("/{order_id}/status", response_model=CommandeOut)
def patch_commande_status(order_id: int, body: CommandeStatutMiseAJour, role: str = Depends(get_current_role)):
    if role not in ("admin", "caissier", "cuisinier", "serveur"):
        raise HTTPException(status_code=403, detail="Permission refusée")
    ok = order_service.update_order_status(order_id, body.etat_commande)
    if not ok:
        raise HTTPException(status_code=404, detail="Commande introuvable")
    return _order_out(order_id)
