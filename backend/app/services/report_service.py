from decimal import Decimal
from typing import Any, Dict

from app.database import fetch_one, get_db


def report_aggregate(period: str, ref: str) -> Dict[str, Any]:
    """
    period: day -> ref = YYYY-MM-DD
            month -> ref = YYYY-MM
            year -> ref = YYYY
    """
    if period == "day":
        start = f"{ref} 00:00:00"
        end = f"{ref} 23:59:59"
        cond = "cree_le BETWEEN %s AND %s"
        params = (start, end)
    elif period == "month":
        cond = "DATE_FORMAT(cree_le, '%%Y-%%m') = %s"
        params = (ref,)
    elif period == "year":
        cond = "YEAR(cree_le) = %s"
        params = (int(ref),)
    else:
        raise ValueError("Période invalide")

    sql = f"""
        SELECT
            COUNT(*) AS nombre_commandes,
            COALESCE(SUM(CASE WHEN statut_reglement = 'payee' THEN montant_total ELSE 0 END), 0) AS chiffre_affaires,
            SUM(CASE WHEN statut_reglement = 'payee' THEN 1 ELSE 0 END) AS commandes_reglees
        FROM commandes
        WHERE {cond}
    """
    with get_db() as conn:
        row = fetch_one(conn, sql, params)
    return {
        "periode": f"{period}:{ref}",
        "nombre_commandes": int(row["nombre_commandes"] or 0),
        "chiffre_affaires": Decimal(str(row["chiffre_affaires"] or 0)),
        "commandes_reglees": int(row["commandes_reglees"] or 0),
    }
