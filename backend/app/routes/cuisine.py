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
            SELECT id, id_client, type_commande, table_id, statut_cuisine, etat_commande, montant_total, cree_le
            FROM commandes
            WHERE type_commande IN ('sur_place', 'livraison', 'emporter')
              AND statut_cuisine IN ('a_envoyer', 'envoyee', 'en_preparation', 'prete')
            ORDER BY cree_le ASC
            """,
        )


@router.put("/commande/{order_id}/en-preparation")
def cuisine_en_preparation(order_id: int, _role: str = Depends(require_roles("admin", "cuisinier"))):
    with get_db() as conn:
        o = fetch_one(
            conn,
            "SELECT id, statut_cuisine, type_commande FROM commandes WHERE id=%s",
            (order_id,),
        )
        if not o:
            raise HTTPException(status_code=404, detail="Commande introuvable")
        if str(o.get("statut_cuisine") or "") not in ("envoyee", "a_envoyer"):
            raise HTTPException(
                status_code=400,
                detail="Mise en préparation impossible depuis ce statut cuisine",
            )
        n = execute(
            conn,
            "UPDATE commandes SET statut_cuisine='en_preparation', etat_commande='en_cours' WHERE id=%s",
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


@router.put("/commande/{order_id}/pret")
def cuisine_ready(order_id: int, _role: str = Depends(require_roles("admin", "cuisinier"))):
    with get_db() as conn:
        o = fetch_one(
            conn,
            "SELECT id, statut_cuisine, type_commande FROM commandes WHERE id=%s",
            (order_id,),
        )
        if not o:
            raise HTTPException(status_code=404, detail="Commande introuvable")
        if str(o.get("type_commande") or "") == "sur_place":
            etat = "prete"
        else:
            etat = "en_cours"
        n = execute(
            conn,
            """
            UPDATE commandes
            SET statut_cuisine='prete', etat_commande=%s
            WHERE id=%s
            """,
            (etat, order_id),
        )
        row = fetch_one(
            conn,
            "SELECT id, statut_cuisine, etat_commande, type_commande FROM commandes WHERE id=%s",
            (order_id,),
        )
    if not n or not row:
        raise HTTPException(status_code=404, detail="Commande introuvable")
    return row
