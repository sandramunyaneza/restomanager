from typing import List

from app.database import execute, fetch_all, fetch_one, get_db, last_insert_id

_SQL_RES = """
SELECT
  r.id,
  r.id_utilisateur,
  u.nom_complet AS nom_client,
  r.horaire_reservation,
  r.nombre_convives,
  r.etat_reservation,
  r.designation_table,
  r.remarques_client
FROM reservations r
LEFT JOIN utilisateurs u ON u.id = r.id_utilisateur
"""


def list_for_user_client(user_id: int) -> List[dict]:
    with get_db() as conn:
        return fetch_all(
            conn,
            _SQL_RES + " WHERE r.id_utilisateur = %s ORDER BY r.horaire_reservation DESC",
            (user_id,),
        )


def list_all_staff(limit: int = 500) -> List[dict]:
    with get_db() as conn:
        return fetch_all(
            conn,
            _SQL_RES + " ORDER BY r.horaire_reservation DESC LIMIT %s",
            (int(limit),),
        )


def create(
    user_id: int,
    horaire_s: str,
    nombre_convives: int,
    designation_table: str | None,
    remarques_client: str | None,
) -> dict:
    with get_db() as conn:
        execute(
            conn,
            """
            INSERT INTO reservations (
              id_utilisateur, horaire_reservation, nombre_convives,
              etat_reservation, designation_table, remarques_client
            )
            VALUES (%s, %s, %s, 'en_attente', %s, %s)
            """,
            (user_id, horaire_s, nombre_convives, designation_table, remarques_client),
        )
        rid = last_insert_id(conn)
        row = fetch_one(conn, _SQL_RES + " WHERE r.id=%s", (rid,))
    if not row:
        raise RuntimeError("Réservation non créée")
    return row


def _set_table_reserved_if_confirmed(conn, etat: str, designation: str | None) -> None:
    if etat != "confirmee" or not designation or not str(designation).strip():
        return
    tab = fetch_one(
        conn,
        "SELECT id FROM tables_restaurant WHERE numero_table = %s",
        (designation.strip(),),
    )
    if not tab:
        return
    execute(
        conn,
        "UPDATE tables_restaurant SET statut='reservee' WHERE id=%s AND statut IN ('libre', 'reservee')",
        (int(tab["id"]),),
    )


def set_status(res_id: int, new_status: str) -> dict | None:
    """Met à jour l'état ; si confirmée, marque la table « réservée » (numéro = designation_table)."""
    aliases = {
        "validated": "confirmee",
        "pending": "en_attente",
        "cancelled": "annulee",
        "completed": "terminee",
    }
    new_status = aliases.get(new_status, new_status)
    allowed = {"en_attente", "confirmee", "annulee", "terminee"}
    if new_status not in allowed:
        raise ValueError("Statut de réservation invalide")
    with get_db() as conn:
        row = fetch_one(conn, "SELECT * FROM reservations WHERE id=%s", (res_id,))
        if not row:
            return None
        execute(
            conn,
            "UPDATE reservations SET etat_reservation=%s WHERE id=%s",
            (new_status, res_id),
        )
        if new_status == "confirmee":
            _set_table_reserved_if_confirmed(
                conn,
                "confirmee",
                row.get("designation_table") if row else None,
            )
        return fetch_one(conn, _SQL_RES + " WHERE r.id=%s", (res_id,))


def update_reservation(
    res_id: int,
    user_id: int,
    role: str,
    horaire_s: str | None,
    nombre_convives: int | None,
    designation_table: str | None,
    remarques_client: str | None,
) -> dict | None:
    with get_db() as conn:
        row = fetch_one(conn, "SELECT * FROM reservations WHERE id=%s", (res_id,))
        if not row:
            return None
        if role == "client" and int(row["id_utilisateur"]) != int(user_id):
            raise PermissionError("Vous ne pouvez modifier que vos réservations")
        if role not in {"admin", "serveur", "caissier", "client"}:
            raise PermissionError("Permission refusée")
        execute(
            conn,
            """
            UPDATE reservations
            SET horaire_reservation = COALESCE(%s, horaire_reservation),
                nombre_convives = COALESCE(%s, nombre_convives),
                designation_table = COALESCE(%s, designation_table),
                remarques_client = COALESCE(%s, remarques_client)
            WHERE id=%s
            """,
            (horaire_s, nombre_convives, designation_table, remarques_client, res_id),
        )
        return fetch_one(conn, _SQL_RES + " WHERE r.id=%s", (res_id,))


def delete_reservation(res_id: int, user_id: int, role: str) -> bool:
    with get_db() as conn:
        row = fetch_one(conn, "SELECT id, id_utilisateur FROM reservations WHERE id=%s", (res_id,))
        if not row:
            return False
        if role == "client" and int(row["id_utilisateur"]) != int(user_id):
            raise PermissionError("Vous ne pouvez supprimer que vos réservations")
        if role not in {"admin", "serveur", "caissier", "client"}:
            raise PermissionError("Permission refusée")
        execute(conn, "DELETE FROM reservations WHERE id=%s", (res_id,))
    return True


def reservations_stats() -> dict:
    with get_db() as conn:
        row = fetch_one(
            conn,
            """
            SELECT
              COUNT(*) AS total,
              SUM(CASE WHEN etat_reservation='confirmee' THEN 1 ELSE 0 END) AS validees,
              SUM(CASE WHEN etat_reservation<>'confirmee' THEN 1 ELSE 0 END) AS non_validees
            FROM reservations
            """,
        )
    return {
        "total": int((row or {}).get("total") or 0),
        "validees": int((row or {}).get("validees") or 0),
        "non_validees": int((row or {}).get("non_validees") or 0),
    }
