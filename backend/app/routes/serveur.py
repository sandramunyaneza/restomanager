from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException, status

from app.auth import get_current_user_id, require_roles
from app.database import execute, fetch_all, fetch_one, get_db, last_insert_id
from app.schemas import ServeurCommandeCreate, ServeurCommandeOut, TableRestaurantOut

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
    total = sum((i.prix_unitaire * i.quantite for i in body.articles), start=Decimal("0"))
    with get_db() as conn:
        table_row = fetch_one(conn, "SELECT id, statut FROM tables_restaurant WHERE id=%s", (body.table_id,))
        if not table_row:
            raise HTTPException(status_code=404, detail="Table introuvable")

        execute(
            conn,
            """
            INSERT INTO commandes (
              id_client, id_employe_creation, serveur_id, table_id, type_commande, nature_commande,
              statut_cuisine, etat_commande, montant_total, statut_reglement, remarques_commande
            )
            VALUES (%s, %s, %s, %s, 'sur_place', 'sur_place', 'a_envoyer', 'en_attente', %s, 'non_payee', %s)
            """,
            (body.id_client, serveur_id, serveur_id, body.table_id, str(total), body.remarques_commande),
        )
        oid = last_insert_id(conn)
        for line in body.articles:
            execute(
                conn,
                """
                INSERT INTO lignes_commande (id_commande, id_produit, quantite_commandee, prix_unitaire_applique)
                VALUES (%s, %s, %s, %s)
                """,
                (oid, line.id_produit, line.quantite, str(line.prix_unitaire)),
            )
        execute(conn, "UPDATE tables_restaurant SET statut='occupee' WHERE id=%s", (body.table_id,))
        execute(
            conn,
            "INSERT INTO commande_statuts (commande_id, statut, changed_by) VALUES (%s, 'en_attente', %s)",
            (oid, serveur_id),
        )
        row = fetch_one(
            conn,
            """
            SELECT id, id_client, serveur_id, table_id, type_commande, nature_commande,
                   statut_cuisine, heure_envoi_cuisine, etat_commande, montant_total, cree_le
            FROM commandes WHERE id=%s
            """,
            (oid,),
        )
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
            SELECT id, id_client, serveur_id, table_id, type_commande, nature_commande,
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
    _role: str = Depends(require_roles("admin", "serveur")),
):
    with get_db() as conn:
        order = fetch_one(conn, "SELECT id, serveur_id FROM commandes WHERE id=%s", (order_id,))
        if not order:
            raise HTTPException(status_code=404, detail="Commande introuvable")
        if order.get("serveur_id") and int(order["serveur_id"]) != serveur_id:
            raise HTTPException(status_code=403, detail="Commande d'un autre serveur")
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
            SELECT id, id_client, serveur_id, table_id, type_commande, nature_commande,
                   statut_cuisine, heure_envoi_cuisine, etat_commande, montant_total, cree_le
            FROM commandes WHERE id=%s
            """,
            (order_id,),
        )
    return ServeurCommandeOut(**row)
