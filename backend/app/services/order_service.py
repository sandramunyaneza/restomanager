"""Création et lecture des commandes (transactions, prix catalogue, livraison auto)."""

from __future__ import annotations

from collections import defaultdict
from decimal import Decimal
from typing import Any, Dict, List, Optional, Tuple

from app.database import execute, fetch_all, fetch_one, get_db, last_insert_id
from app.schemas.order import CommandeCreate, LigneCommandeEntree
from app.schemas.serveur import ServeurCommandeCreate

_ORDER_LIST_SQL = """
SELECT
  id,
  id_client,
  type_commande,
  type_commande AS nature_commande,
  table_id,
  etat_commande,
  statut_cuisine,
  montant_total,
  statut_reglement,
  cree_le,
  remarques_commande
FROM commandes
"""

_ORDER_BY_ID = _ORDER_LIST_SQL + " WHERE id = %s"

_LIGNES_SQL = """
SELECT
  id,
  id_produit,
  quantite_commandee,
  prix_unitaire_applique
FROM lignes_commande
WHERE id_commande = %s
ORDER BY id
"""


def _merge_line_quantities(articles: List[LigneCommandeEntree]) -> List[LigneCommandeEntree]:
    by_pid: dict[int, int] = defaultdict(int)
    for a in articles:
        by_pid[a.id_produit] += a.quantite
    return [LigneCommandeEntree(id_produit=pid, quantite=qty) for pid, qty in sorted(by_pid.items())]


def resolve_lines_and_total(conn, articles: List[LigneCommandeEntree]) -> Tuple[Decimal, List[Tuple[int, int, Decimal]]]:
    """
    Vérifie l'existence et la disponibilité des produits et calcule le total.
    Retourne (montant_total, [(id_produit, quantite, prix_unitaire), ...]).
    """
    merged = _merge_line_quantities(articles)
    ids = [m.id_produit for m in merged]
    if not ids:
        raise ValueError("Aucun article")

    fmt = ", ".join(["%s"] * len(ids))
    rows = fetch_all(
        conn,
        f"""
        SELECT id, prix_tarif, est_disponible
        FROM produits
        WHERE id IN ({fmt})
        """,
        tuple(ids),
    )
    by_id = {int(r["id"]): r for r in rows}
    total = Decimal("0.00")
    out: List[Tuple[int, int, Decimal]] = []
    for m in merged:
        r = by_id.get(m.id_produit)
        if not r:
            raise ValueError(f"Produit {m.id_produit} introuvable")
        if not int(r.get("est_disponible", 0)):
            raise ValueError(f"Produit {m.id_produit} indisponible")
        p = Decimal(str(r["prix_tarif"]))
        line = p * m.quantite
        total += line
        out.append((m.id_produit, m.quantite, p))
    return total, out


def _assign_livreur(conn) -> Optional[int]:
    row = fetch_one(
        conn,
        """
        SELECT u.id
        FROM utilisateurs u
        LEFT JOIN (
          SELECT id_employe_livreur AS uid, COUNT(*) AS cnt
          FROM livraisons
          WHERE avancement_livraison NOT IN ('livree', 'annulee')
            AND id_employe_livreur IS NOT NULL
          GROUP BY id_employe_livreur
        ) t ON t.uid = u.id
        WHERE u.profil_utilisateur = 'livreur' AND u.compte_actif = 1
        ORDER BY COALESCE(t.cnt, 0) ASC, u.id ASC
        LIMIT 1
        """,
    )
    if not row:
        return None
    return int(row["id"])


def create_order(
    payload: CommandeCreate,
    acting_user_id: int,
    acting_role: str,
) -> int:
    """Insère commandes + lignes dans une transaction ; crée la livraison si besoin."""
    t = payload.type_commande
    target_client = payload.id_client if payload.id_client is not None else acting_user_id
    if acting_role == "client" and int(target_client) != int(acting_user_id):
        raise PermissionError("Vous ne pouvez pas créer de commande pour un autre client")
    if acting_role == "serveur" and t != "sur_place":
        raise PermissionError("Le serveur ne peut créer que des commandes sur place")
    if acting_role == "serveur" and t == "sur_place" and payload.table_id is None:
        raise ValueError("Table requise pour une commande sur place (serveur)")
    if acting_role == "client" and t not in ("livraison", "emporter", "sur_place"):
        raise ValueError("Type de commande invalide")
    if t == "livraison" and not (payload.adresse_livraison and payload.adresse_livraison.strip()):
        raise ValueError("Adresse de livraison requise")

    with get_db() as conn:
        if t == "sur_place" and payload.table_id is not None:
            trow = fetch_one(conn, "SELECT id, statut FROM tables_restaurant WHERE id=%s", (payload.table_id,))
            if not trow:
                raise ValueError("Table introuvable")
        total, line_rows = resolve_lines_and_total(conn, payload.articles)
        if total <= 0:
            raise ValueError("Montant total invalide")

        # Valeurs cuisine / suivi
        if t in ("livraison", "emporter"):
            statut_cuisine = "a_envoyer"
            etat_c = "en_cours"
        else:
            statut_cuisine = "a_envoyer"
            etat_c = "en_attente"

        execute(
            conn,
            """
            INSERT INTO commandes (
              id_client, id_employe_creation, serveur_id, table_id,
              type_commande, statut_cuisine, heure_envoi_cuisine,
              etat_commande, montant_total, statut_reglement, remarques_commande
            )
            VALUES (
              %s, %s, %s, %s,
              %s, %s, NULL,
              %s, %s, 'non_payee', %s
            )
            """,
            (
                target_client,
                acting_user_id if acting_role != "client" else None,
                acting_user_id if acting_role == "serveur" and t == "sur_place" else None,
                payload.table_id,
                t,
                statut_cuisine,
                etat_c,
                str(total),
                payload.remarques_commande,
            ),
        )
        oid = last_insert_id(conn)
        for id_produit, qte, prix in line_rows:
            execute(
                conn,
                """
                INSERT INTO lignes_commande (id_commande, id_produit, quantite_commandee, prix_unitaire_applique)
                VALUES (%s, %s, %s, %s)
                """,
                (oid, id_produit, qte, str(prix)),
            )
        if t == "livraison":
            lid = _assign_livreur(conn)
            hprev = payload.horaire_livraison_prevu
            hstr = hprev.strftime("%Y-%m-%d %H:%M:%S") if hprev else None
            execute(
                conn,
                """
                INSERT INTO livraisons (id_commande, id_employe_livreur, adresse_livraison, avancement_livraison, horaire_prevu)
                VALUES (%s, %s, %s, 'en_attente', %s)
                """,
                (oid, lid, payload.adresse_livraison.strip() if payload.adresse_livraison else "", hstr),
            )
        if acting_role == "serveur" and t == "sur_place" and payload.table_id is not None:
            execute(conn, "UPDATE tables_restaurant SET statut='occupee' WHERE id=%s", (payload.table_id,))
            execute(
                conn,
                "INSERT INTO commande_statuts (commande_id, statut, changed_by) VALUES (%s, 'en_attente', %s)",
                (oid, acting_user_id),
            )
        else:
            execute(
                conn,
                """
                INSERT INTO commande_statuts (commande_id, statut, changed_by)
                VALUES (%s, %s, %s)
                """,
                (oid, f"creee_{t}", acting_user_id),
            )
    return int(oid)


def create_table_order_serveur(serveur_id: int, body: ServeurCommandeCreate) -> int:
    """Commande salle (serveur) : délègue à create_order (prix issus du catalogue)."""
    articles = [LigneCommandeEntree(id_produit=a.id_produit, quantite=a.quantite) for a in body.articles]
    payload = CommandeCreate(
        id_client=body.id_client,
        type_commande="sur_place",
        table_id=body.table_id,
        articles=articles,
        remarques_commande=body.remarques_commande,
    )
    return create_order(payload, serveur_id, "serveur")


def list_orders(user_id: int, role: str) -> List[dict]:
    with get_db() as conn:
        if role == "client":
            return fetch_all(conn, _ORDER_LIST_SQL + " WHERE id_client = %s ORDER BY cree_le DESC", (user_id,))
        if role == "serveur":
            return fetch_all(conn, _ORDER_LIST_SQL + " WHERE serveur_id = %s ORDER BY cree_le DESC", (user_id,))
        return fetch_all(conn, _ORDER_LIST_SQL + " ORDER BY cree_le DESC LIMIT 500")


def fetch_commande_header(order_id: int) -> Optional[Dict[str, Any]]:
    with get_db() as conn:
        return fetch_one(conn, _ORDER_BY_ID, (order_id,))


def get_order_for_user(order_id: int, user_id: int, role: str) -> Optional[Dict[str, Any]]:
    """Détail commande + lignes ; None si 404. Vérifie l'accès (client propriétaire ou admin)."""
    with get_db() as conn:
        row = fetch_one(conn, _ORDER_BY_ID, (order_id,))
        if not row:
            return None
        if role != "admin" and int(row["id_client"]) != int(user_id):
            return None
        lines = fetch_all(conn, _LIGNES_SQL, (order_id,))
    out = dict(row)
    out["lignes_commande"] = lines
    return out


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
        n = execute(conn, "UPDATE commandes SET etat_commande = %s WHERE id = %s", (new_status, order_id))
    return n > 0


def delete_order_for_user(order_id: int, user_id: int, role: str) -> bool:
    with get_db() as conn:
        row = fetch_one(conn, "SELECT id, id_client, serveur_id FROM commandes WHERE id=%s", (order_id,))
        if not row:
            return False
        if role == "client" and int(row["id_client"]) != int(user_id):
            raise PermissionError("Vous ne pouvez supprimer que vos commandes")
        if role == "serveur":
            serveur_id = row.get("serveur_id")
            if serveur_id is not None and int(serveur_id) != int(user_id):
                raise PermissionError("Vous ne pouvez supprimer que vos commandes de service")
        if role not in ("admin", "caissier", "serveur", "client"):
            raise PermissionError("Permission refusée")
        execute(conn, "DELETE FROM commandes WHERE id=%s", (order_id,))
    return True
