from decimal import Decimal
from typing import Any, Dict, List

from app.database import execute, fetch_all, fetch_one, get_db, last_insert_id

_MODES = {"especes", "carte", "mobile_pay", "autre"}


def list_all() -> List[dict]:
    with get_db() as conn:
        return fetch_all(
            conn,
            """
            SELECT
              id,
              id_commande,
              montant_verse AS montant,
              mode_reglement,
              etat_transaction,
              cree_le,
              id_employe_encaissement
            FROM paiements
            ORDER BY cree_le DESC LIMIT 500
            """,
        )


def create_payment(employee_id: int, id_commande: int, montant: Decimal, mode_reglement: str) -> dict:
    if mode_reglement not in _MODES:
        raise ValueError("Mode de règlement invalide (especes, carte, mobile_pay, autre)")
    with get_db() as conn:
        order = fetch_one(
            conn,
            "SELECT id, id_client, montant_total, statut_reglement FROM commandes WHERE id=%s",
            (id_commande,),
        )
        if not order:
            raise ValueError("Commande introuvable")
        if str(order.get("statut_reglement")) == "remboursee":
            raise ValueError("Commande déjà remboursée")
        if str(order.get("statut_reglement")) == "payee":
            raise ValueError("Commande déjà payée")
        expected = Decimal(str(order["montant_total"]))
        if montant != expected:
            raise ValueError("Le montant doit correspondre au total de la commande")
        execute(
            conn,
            """
            INSERT INTO paiements (id_commande, montant_verse, mode_reglement, etat_transaction, id_employe_encaissement)
            VALUES (%s, %s, %s, 'valide', %s)
            """,
            (id_commande, str(montant), mode_reglement, employee_id),
        )
        execute(conn, "UPDATE commandes SET statut_reglement='payee' WHERE id=%s", (id_commande,))
        pid = last_insert_id(conn)
        row = fetch_one(
            conn,
            """
            SELECT id, id_commande, montant_verse AS montant, mode_reglement, etat_transaction,
                   cree_le, id_employe_encaissement
            FROM paiements WHERE id=%s
            """,
            (pid,),
        )
    if not row:
        raise RuntimeError("Paiement non enregistré")
    return row


def rembourser_commande(employee_id: int, id_commande: int) -> Dict[str, Any]:
    with get_db() as conn:
        order = fetch_one(
            conn,
            "SELECT id, statut_reglement, montant_total FROM commandes WHERE id=%s",
            (id_commande,),
        )
        if not order:
            raise ValueError("Commande introuvable")
        sr = str(order.get("statut_reglement") or "")
        if sr == "remboursee":
            raise ValueError("Commande déjà remboursée")
        if sr != "payee":
            raise ValueError("Remboursement réservé aux commandes déjà payées")
        execute(
            conn,
            "UPDATE paiements SET etat_transaction='rembourse' WHERE id_commande=%s",
            (id_commande,),
        )
        execute(conn, "UPDATE commandes SET statut_reglement='remboursee' WHERE id=%s", (id_commande,))
        order_after = fetch_one(
            conn,
            "SELECT id, statut_reglement, montant_total FROM commandes WHERE id=%s",
            (id_commande,),
        )
    if not order_after:
        raise RuntimeError("Mise à jour impossible")
    return {
        "id_commande": int(order_after["id"]),
        "statut_reglement": order_after["statut_reglement"],
        "montant_total": order_after["montant_total"],
    }
