from fastapi import APIRouter, Depends, HTTPException, status

from app.auth import get_current_role, get_current_user_id
from app.database import execute, fetch_all, fetch_one, get_db
from app.schemas import LivraisonMiseAJour, LivraisonOut
from app.services import livraison_service

router = APIRouter(prefix="/deliveries", tags=["deliveries"])

_SQL_LIV = """
SELECT
  l.id,
  l.id_commande,
  l.id_employe_livreur,
  ul.nom_complet AS nom_livreur,
  uc.nom_complet AS nom_client,
  l.adresse_livraison,
  l.avancement_livraison
FROM livraisons l
JOIN commandes c ON c.id = l.id_commande
LEFT JOIN utilisateurs ul ON ul.id = l.id_employe_livreur
LEFT JOIN utilisateurs uc ON uc.id = c.id_client
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
                + " WHERE l.id_employe_livreur = %s OR l.id_employe_livreur IS NULL ORDER BY l.id DESC",
                (user_id,),
            )
        else:
            rows = fetch_all(
                conn,
                _SQL_LIV + " ORDER BY l.id DESC LIMIT 500",
            )
    return [LivraisonOut(**r) for r in rows]


@router.patch("/{delivery_id}", response_model=LivraisonOut)
def update_delivery(
    delivery_id: int,
    body: LivraisonMiseAJour,
    user_id: int = Depends(get_current_user_id),
    role: str = Depends(get_current_role),
):
    if role not in ("admin", "livreur"):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Permission refusée")
    if body.avancement_livraison is None and body.id_employe_livreur is None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Aucune mise à jour")
    with get_db() as conn:
        row = fetch_one(
            conn,
            """
            SELECT l.id, l.id_commande, l.id_employe_livreur, ul.nom_complet AS nom_livreur,
                   uc.nom_complet AS nom_client, l.adresse_livraison, l.avancement_livraison
            FROM livraisons l
            JOIN commandes c ON c.id = l.id_commande
            LEFT JOIN utilisateurs ul ON ul.id = l.id_employe_livreur
            LEFT JOIN utilisateurs uc ON uc.id = c.id_client
            WHERE l.id=%s
            """,
            (delivery_id,),
        )
        if not row:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Livraison introuvable")
        if role == "livreur" and row.get("id_employe_livreur") and int(row["id_employe_livreur"]) != user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Cette tournée est assignée à un autre livreur",
            )
        if body.avancement_livraison is not None:
            try:
                livraison_service.assert_transition_is_valid(
                    str(row.get("avancement_livraison", "")),
                    str(body.avancement_livraison),
                )
            except ValueError as e:
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e)) from e
        fields = []
        params = []
        if body.avancement_livraison is not None:
            fields.append("avancement_livraison=%s")
            params.append(body.avancement_livraison)
        if body.id_employe_livreur is not None:
            if role != "admin":
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Seul l'administrateur peut réassigner le livreur",
                )
            fields.append("id_employe_livreur=%s")
            params.append(body.id_employe_livreur)
        if not fields:
            raise HTTPException(status_code=400, detail="Aucune mise à jour")
        params.append(delivery_id)
        sql = f"UPDATE livraisons SET {', '.join(fields)} WHERE id=%s"
        n = execute(conn, sql, tuple(params))
        if body.avancement_livraison is not None and str(body.avancement_livraison) == "livree":
            execute(
                conn,
                "UPDATE commandes SET etat_commande='livree' WHERE id=%s",
                (int(row["id_commande"]),),
            )
        out = fetch_one(
            conn,
            """
            SELECT l.id, l.id_commande, l.id_employe_livreur, ul.nom_complet AS nom_livreur,
                   uc.nom_complet AS nom_client, l.adresse_livraison, l.avancement_livraison
            FROM livraisons l
            JOIN commandes c ON c.id = l.id_commande
            LEFT JOIN utilisateurs ul ON ul.id = l.id_employe_livreur
            LEFT JOIN utilisateurs uc ON uc.id = c.id_client
            WHERE l.id=%s
            """,
            (delivery_id,),
        )
    if not n or not out:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Livraison introuvable")
    return LivraisonOut(**out)


@router.post("/{delivery_id}/confirmer-reception", response_model=LivraisonOut)
def client_confirmer_livree(
    delivery_id: int,
    user_id: int = Depends(get_current_user_id),
    role: str = Depends(get_current_role),
):
    """Client : confirme la réception lorsque le livreur a statut 'en_route'."""
    if role != "client":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Réservé au profil client (réception de livraison)",
        )
    with get_db() as conn:
        row = fetch_one(
            conn,
            """
            SELECT l.id, l.id_commande, l.id_employe_livreur, ul.nom_complet AS nom_livreur,
                   uc.nom_complet AS nom_client, l.adresse_livraison, l.avancement_livraison,
                   c.id_client
            FROM livraisons l
            JOIN commandes c ON c.id = l.id_commande
            LEFT JOIN utilisateurs ul ON ul.id = l.id_employe_livreur
            LEFT JOIN utilisateurs uc ON uc.id = c.id_client
            WHERE l.id=%s
            """,
            (delivery_id,),
        )
        if not row:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Livraison introuvable")
        if int(row["id_client"]) != int(user_id):
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Accès refusé")
        if str(row.get("avancement_livraison")) != "en_route":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="La réception n'est possible que lorsque la livraison est « en route »",
            )
        try:
            livraison_service.assert_transition_is_valid(
                str(row.get("avancement_livraison", "")),
                "livree",
            )
        except ValueError as e:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e)) from e
        execute(
            conn,
            "UPDATE livraisons SET avancement_livraison='livree' WHERE id=%s",
            (delivery_id,),
        )
        execute(
            conn,
            "UPDATE commandes SET etat_commande='livree' WHERE id=%s",
            (int(row["id_commande"]),),
        )
        out = fetch_one(
            conn,
            """
            SELECT l.id, l.id_commande, l.id_employe_livreur, ul.nom_complet AS nom_livreur,
                   uc.nom_complet AS nom_client, l.adresse_livraison, l.avancement_livraison
            FROM livraisons l
            JOIN commandes c ON c.id = l.id_commande
            LEFT JOIN utilisateurs ul ON ul.id = l.id_employe_livreur
            LEFT JOIN utilisateurs uc ON uc.id = c.id_client
            WHERE l.id=%s
            """,
            (delivery_id,),
        )
    if not out:
        raise HTTPException(status_code=500, detail="Mise à jour impossible")
    return LivraisonOut(**out)
