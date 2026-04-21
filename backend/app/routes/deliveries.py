from fastapi import APIRouter, Depends, HTTPException

from app.auth import get_current_role, get_current_user_id
from app.database import execute, fetch_all, fetch_one, get_db
from app.schemas import LivraisonMiseAJour, LivraisonOut

router = APIRouter(prefix="/deliveries", tags=["deliveries"])

_SQL_LIV = """
SELECT
  id,
  id_commande,
  id_employe_livreur,
  adresse_livraison,
  avancement_livraison
FROM livraisons
"""


@router.get("", response_model=list[LivraisonOut])
def list_deliveries(
    user_id: int = Depends(get_current_user_id),
    role: str = Depends(get_current_role),
):
    with get_db() as conn:
        if role == "livreur":
            rows = fetch_all(
                conn,
                _SQL_LIV
                + " WHERE id_employe_livreur = %s OR id_employe_livreur IS NULL ORDER BY id DESC",
                (user_id,),
            )
        else:
            rows = fetch_all(conn, _SQL_LIV + " ORDER BY id DESC LIMIT 500")
    return [LivraisonOut(**r) for r in rows]


@router.patch("/{delivery_id}", response_model=LivraisonOut)
def update_delivery(
    delivery_id: int,
    body: LivraisonMiseAJour,
    role: str = Depends(get_current_role),
):
    if role not in ("admin", "livreur"):
        raise HTTPException(status_code=403, detail="Permission refusée")
    fields = []
    params = []
    if body.avancement_livraison is not None:
        fields.append("avancement_livraison=%s")
        params.append(body.avancement_livraison)
    if body.id_employe_livreur is not None:
        fields.append("id_employe_livreur=%s")
        params.append(body.id_employe_livreur)
    if not fields:
        raise HTTPException(status_code=400, detail="Aucune mise à jour")
    params.append(delivery_id)
    sql = f"UPDATE livraisons SET {', '.join(fields)} WHERE id=%s"
    with get_db() as conn:
        n = execute(conn, sql, tuple(params))
        row = fetch_one(conn, _SQL_LIV + " WHERE id=%s", (delivery_id,))
    if not n or not row:
        raise HTTPException(status_code=404, detail="Livraison introuvable")
    return LivraisonOut(**row)
