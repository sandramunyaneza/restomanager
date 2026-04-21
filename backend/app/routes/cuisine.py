from fastapi import APIRouter, Depends, HTTPException

from app.auth import require_roles
from app.database import execute, fetch_all, fetch_one, get_db

router = APIRouter(prefix="/cuisine", tags=["cuisine"])


@router.get("/commandes")
def cuisine_orders(_role: str = Depends(require_roles("admin", "cuisinier"))):
    with get_db() as conn:
        return fetch_all(
            conn,
            """
            SELECT id, id_client, table_id, statut_cuisine, etat_commande, montant_total, cree_le
            FROM commandes
            WHERE type_commande='sur_place' AND statut_cuisine IN ('envoyee','en_preparation','prete')
            ORDER BY cree_le ASC
            """,
        )


@router.put("/commande/{order_id}/pret")
def cuisine_ready(order_id: int, _role: str = Depends(require_roles("admin", "cuisinier"))):
    with get_db() as conn:
        n = execute(
            conn,
            "UPDATE commandes SET statut_cuisine='prete', etat_commande='prete' WHERE id=%s",
            (order_id,),
        )
        row = fetch_one(
            conn,
            "SELECT id, statut_cuisine, etat_commande FROM commandes WHERE id=%s",
            (order_id,),
        )
    if not n or not row:
        raise HTTPException(status_code=404, detail="Commande introuvable")
    return row
