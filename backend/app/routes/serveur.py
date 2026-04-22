from fastapi import APIRouter, Depends, HTTPException, status

from app.auth import get_current_user_id, require_roles
from app.database import execute, fetch_all, fetch_one, get_db
from app.schemas import ServeurCommandeCreate, ServeurCommandeOut, TableRestaurantOut
from app.services import order_service

router = APIRouter(prefix="/serveur", tags=["serveur"])


@router.get("/tables", response_model=list[TableRestaurantOut])
def list_tables(_role: str = Depends(require_roles("admin", "serveur"))):
    with get_db() as conn:
        rows = fetch_all(conn, "SELECT id, numero_table, capacite, statut, created_at FROM tables_restaurant ORDER BY numero_table")
    return [TableRestaurantOut(**r) for r in rows]


@router.put("/table/{table_id}/occuper", response_model=TableRestaurantOut)
def occuper_table(table_id: int, _role: str = Depends(require_roles("admin", "serveur"))):
    with get_db() as conn:
        n = execute(conn, "UPDATE tables_restaurant SET statut='occupee' WHERE id=%s", (table_id,))
        row = fetch_one(conn, "SELECT id, numero_table, capacite, statut, created_at FROM tables_restaurant WHERE id=%s", (table_id,))
    if not n or not row:
        raise HTTPException(status_code=404, detail="Table introuvable")
    return TableRestaurantOut(**row)


@router.put("/table/{table_id}/liberer", response_model=TableRestaurantOut)
def liberer_table(table_id: int, _role: str = Depends(require_roles("admin", "serveur"))):
    with get_db() as conn:
        n = execute(conn, "UPDATE tables_restaurant SET statut='libre' WHERE id=%s", (table_id,))
        row = fetch_one(conn, "SELECT id, numero_table, capacite, statut, created_at FROM tables_restaurant WHERE id=%s", (table_id,))
    if not n or not row:
        raise HTTPException(status_code=404, detail="Table introuvable")
    return TableRestaurantOut(**row)


@router.post("/commande", response_model=ServeurCommandeOut, status_code=status.HTTP_201_CREATED)
def create_serveur_order(
    body: ServeurCommandeCreate,
    serveur_id: int = Depends(get_current_user_id),
    _role: str = Depends(require_roles("admin", "serveur")),
):
    try:
        oid = order_service.create_table_order_serveur(serveur_id, body)
    except ValueError as e:
        msg = str(e)
        code = 404 if "Table introuvable" in msg or "introuvable" in msg else 400
        raise HTTPException(status_code=code, detail=msg) from e
    with get_db() as conn:
        row = fetch_one(
            conn,
            """
            SELECT id, id_client, serveur_id, table_id, type_commande, type_commande AS nature_commande,
                   statut_cuisine, heure_envoi_cuisine, etat_commande, montant_total, cree_le
            FROM commandes WHERE id=%s
            """,
            (oid,),
        )
    if not row:
        raise HTTPException(status_code=500, detail="Commande non retrouvée")
    return ServeurCommandeOut(**row)


@router.get("/mes-commandes", response_model=list[ServeurCommandeOut])
def list_my_orders(
    serveur_id: int = Depends(get_current_user_id),
    _role: str = Depends(require_roles("admin", "serveur")),
):
    with get_db() as conn:
        rows = fetch_all(
            conn,
            """
            SELECT id, id_client, serveur_id, table_id, type_commande, type_commande AS nature_commande,
                   statut_cuisine, heure_envoi_cuisine, etat_commande, montant_total, cree_le
            FROM commandes
            WHERE serveur_id=%s
            ORDER BY id DESC
            """,
            (serveur_id,),
        )
    return [ServeurCommandeOut(**r) for r in rows]


@router.put("/commande/{order_id}/envoyer-cuisine", response_model=ServeurCommandeOut)
def send_to_kitchen(
    order_id: int,
    serveur_id: int = Depends(get_current_user_id),
    role: str = Depends(require_roles("admin", "serveur")),
):
    with get_db() as conn:
        order = fetch_one(conn, "SELECT id, serveur_id, type_commande FROM commandes WHERE id=%s", (order_id,))
        if not order:
            raise HTTPException(status_code=404, detail="Commande introuvable")
        if role != "admin" and order.get("serveur_id") and int(order["serveur_id"]) != serveur_id:
            raise HTTPException(status_code=403, detail="Commande d'un autre serveur")
        if str(order.get("type_commande") or "") != "sur_place":
            raise HTTPException(status_code=400, detail="Envoi cuisine réservé aux commandes sur place")
        execute(
            conn,
            """
            UPDATE commandes
            SET statut_cuisine='envoyee', heure_envoi_cuisine=NOW(), etat_commande='confirmee'
            WHERE id=%s
            """,
            (order_id,),
        )
        execute(
            conn,
            "INSERT INTO commande_statuts (commande_id, statut, changed_by) VALUES (%s, 'envoyee_cuisine', %s)",
            (order_id, serveur_id),
        )
        row = fetch_one(
            conn,
            """
            SELECT id, id_client, serveur_id, table_id, type_commande, type_commande AS nature_commande,
                   statut_cuisine, heure_envoi_cuisine, etat_commande, montant_total, cree_le
            FROM commandes WHERE id=%s
            """,
            (order_id,),
        )
    return ServeurCommandeOut(**row)
