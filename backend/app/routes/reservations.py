from fastapi import APIRouter, Depends, HTTPException, status

from app.auth import get_current_role, get_current_user_id, require_roles
from app.database import execute, fetch_all, fetch_one, get_db, last_insert_id
from app.schemas import ReservationCreate, ReservationOut, ReservationStatutMiseAJour

router = APIRouter(prefix="/reservations", tags=["reservations"])

_SQL_RES = """
SELECT
  r.id,
  r.id_utilisateur,
  r.horaire_reservation,
  r.nombre_convives,
  r.etat_reservation,
  r.designation_table,
  r.remarques_client,
  u.nom_complet AS client_nom
FROM reservations r
LEFT JOIN utilisateurs u ON u.id = r.id_utilisateur
"""

@router.get("", response_model=list[ReservationOut])
def list_reservations(
    user_id: int = Depends(get_current_user_id),
    role: str = Depends(get_current_role),
):
    with get_db() as conn:
        if role == "client":
            rows = fetch_all(
                conn,
                _SQL_RES + " WHERE id_utilisateur = %s ORDER BY horaire_reservation DESC",
                (user_id,),
            )
        else:
            rows = fetch_all(conn, _SQL_RES + " ORDER BY horaire_reservation DESC LIMIT 500")
    return [ReservationOut(**r) for r in rows]


@router.post("", response_model=ReservationOut, status_code=status.HTTP_201_CREATED)
def create_reservation(
    body: ReservationCreate,
    user_id: int = Depends(get_current_user_id),
    role: str = Depends(get_current_role),
):
    if role != "client":
        raise HTTPException(status_code=403, detail="Création réservée au compte client")
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
            (
                user_id,
                body.horaire_reservation.strftime("%Y-%m-%d %H:%M:%S"),
                body.nombre_convives,
                body.designation_table,
                body.remarques_client,
            ),
        )
        rid = last_insert_id(conn)
        row = fetch_one(conn, _SQL_RES + " WHERE id=%s", (rid,))
    return ReservationOut(**row)


@router.patch("/{res_id}/status", response_model=ReservationOut)
def set_status(
    res_id: int,
    body: ReservationStatutMiseAJour,
    _role: str = Depends(require_roles("admin", "caissier", "serveur")),
):
    allowed = {"en_attente", "confirmee", "annulee", "terminee"}
    if body.etat_reservation not in allowed:
        raise HTTPException(status_code=400, detail="Statut invalide")
    with get_db() as conn:
        n = execute(
            conn,
            "UPDATE reservations SET etat_reservation=%s WHERE id=%s",
            (body.etat_reservation, res_id),
        )
        row = fetch_one(conn, _SQL_RES + " WHERE id=%s", (res_id,))
    if not n or not row:
        raise HTTPException(status_code=404, detail="Réservation introuvable")
    return ReservationOut(**row)