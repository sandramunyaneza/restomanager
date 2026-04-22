from fastapi import APIRouter, Depends, HTTPException, status

from app.auth import get_current_role, get_current_user_id, load_user_row, require_roles
from app.schemas import ReservationCreate, ReservationOut, ReservationStatutMiseAJour, ReservationStatsOut, ReservationUpdate
from app.services import reservation_service

router = APIRouter(prefix="/reservations", tags=["reservations"])


@router.get("/me", response_model=list[ReservationOut])
def my_reservations(user_id: int = Depends(get_current_user_id)):
    """Liste des réservations du compte connecté (JWT : id utilisateur)."""
    rows = reservation_service.list_for_user_client(user_id)
    return [ReservationOut(**r) for r in rows]


@router.get("", response_model=list[ReservationOut])
def list_reservations(
    _role: str = Depends(require_roles("admin", "serveur", "caissier")),
):
    rows = reservation_service.list_all_staff()
    return [ReservationOut(**r) for r in rows]


@router.get("/stats", response_model=ReservationStatsOut)
def reservation_stats(_role: str = Depends(require_roles("admin"))):
    return ReservationStatsOut(**reservation_service.reservations_stats())


@router.post("", response_model=ReservationOut, status_code=status.HTTP_201_CREATED)
def create_reservation(
    body: ReservationCreate,
    user: dict = Depends(load_user_row),
    role: str = Depends(get_current_role),
):
    if role != "client":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="La création de réservation est réservée au profil client",
        )
    row = reservation_service.create(
        int(user["id"]),
        body.horaire_reservation.strftime("%Y-%m-%d %H:%M:%S"),
        body.nombre_convives,
        body.designation_table,
        body.remarques_client,
    )
    return ReservationOut(**row)


@router.patch("/{res_id}", response_model=ReservationOut)
def update_reservation_route(
    res_id: int,
    body: ReservationUpdate,
    user_id: int = Depends(get_current_user_id),
    role: str = Depends(get_current_role),
):
    horaire_s = body.horaire_reservation.strftime("%Y-%m-%d %H:%M:%S") if body.horaire_reservation else None
    try:
        row = reservation_service.update_reservation(
            res_id,
            user_id,
            role,
            horaire_s,
            body.nombre_convives,
            body.designation_table,
            body.remarques_client,
        )
    except PermissionError as e:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(e)) from e
    if not row:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Réservation introuvable")
    return ReservationOut(**row)


@router.patch("/{res_id}/status", response_model=ReservationOut)
def set_status(
    res_id: int,
    body: ReservationStatutMiseAJour,
    _role: str = Depends(require_roles("admin", "serveur", "caissier")),
):
    try:
        row = reservation_service.set_status(res_id, body.etat_reservation)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e)) from e
    if not row:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Réservation introuvable")
    return ReservationOut(**row)


@router.delete("/{res_id}", status_code=204)
def delete_reservation_route(
    res_id: int,
    user_id: int = Depends(get_current_user_id),
    role: str = Depends(get_current_role),
):
    try:
        ok = reservation_service.delete_reservation(res_id, user_id, role)
    except PermissionError as e:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(e)) from e
    if not ok:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Réservation introuvable")
    return None


