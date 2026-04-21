from decimal import Decimal
from typing import List

from app.database import execute, fetch_all, get_db, last_insert_id
from app.schemas import CommandeCreate, LigneCommandeEntree


def _sum_items(items: List[LigneCommandeEntree]) -> Decimal:
    return sum((i.prix_unitaire * i.quantite for i in items), start=Decimal("0"))


_SQL_LIST = """
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
"""


def create_order(
    payload: CommandeCreate,
    acting_user_id: int,
    acting_role: str,
) -> int:
    """Crée une commande et ses lignes. Le client ne peut commander que pour lui-même."""
    target_user = payload.id_client or acting_user_id
    if acting_role == "client" and target_user != acting_user_id:
        raise PermissionError("Vous ne pouvez pas créer de commande pour un autre client")

    total = _sum_items(payload.articles)
    with get_db() as conn:
        execute(
            conn,
            """
            INSERT INTO commandes (
              id_client, id_employe_creation, nature_commande,
              etat_commande, montant_total, statut_reglement, remarques_commande
            )
            VALUES (%s, %s, %s, 'en_attente', %s, 'non_payee', %s)
            """,
            (
                target_user,
                acting_user_id if acting_role != "client" else None,
                payload.nature_commande,
                str(total),
                payload.remarques_commande,
            ),
        )
        oid = last_insert_id(conn)
        for line in payload.articles:
            execute(
                conn,
                """
                INSERT INTO lignes_commande (
                  id_commande, id_produit, quantite_commandee, prix_unitaire_applique
                )
                VALUES (%s, %s, %s, %s)
                """,
                (oid, line.id_produit, line.quantite, str(line.prix_unitaire)),
            )
    return oid


def list_orders(user_id: int, role: str) -> List[dict]:
    with get_db() as conn:
        if role == "client":
            return fetch_all(
                conn,
                _SQL_LIST + " WHERE id_client = %s ORDER BY cree_le DESC",
                (user_id,),
            )
        return fetch_all(conn, _SQL_LIST + " ORDER BY cree_le DESC LIMIT 500")


def update_order_status(order_id: int, new_status: str) -> bool:
    allowed = {
        "en_attente",
        "confirmee",
        "en_cours",
        "prete",
        "livree",
        "annulee",
    }
    if new_status not in allowed:
        raise ValueError("Statut invalide")
    with get_db() as conn:
        n = execute(
            conn,
            "UPDATE commandes SET etat_commande = %s WHERE id = %s",
            (new_status, order_id),
        )
    return n > 0
