from fastapi import APIRouter, Depends, HTTPException, status

from app.auth import get_current_user_id, require_roles
from app.database import execute, fetch_all, fetch_one, get_db, last_insert_id
from app.schemas import PaiementCreate, PaiementOut

router = APIRouter(prefix="/payments", tags=["payments"])


@router.get("", response_model=list[PaiementOut])
def list_payments(_role: str = Depends(require_roles("admin", "caissier"))):
    with get_db() as conn:
        rows = fetch_all(
            conn,
            """
            SELECT
              p.id,
              p.id_commande,
              p.montant_verse AS montant,
              p.mode_reglement,
              p.etat_transaction,
              p.cree_le,
              p.id_employe_encaissement,
              u.nom_complet AS client_nom
            FROM paiements p
            LEFT JOIN commandes c ON c.id = p.id_commande
            LEFT JOIN utilisateurs u ON u.id = c.id_client
            ORDER BY p.cree_le DESC LIMIT 500
            """,
        )
    return [PaiementOut(**r) for r in rows]
@router.post("", response_model=PaiementOut, status_code=status.HTTP_201_CREATED)
def create_payment(
    body: PaiementCreate,
    user_id: int = Depends(get_current_user_id),
    _role: str = Depends(require_roles("admin", "caissier")),
):
    with get_db() as conn:
        order = fetch_one(
            conn,
            "SELECT id, montant_total, statut_reglement FROM commandes WHERE id=%s",
            (body.id_commande,),
        )
        if not order:
            raise HTTPException(status_code=404, detail="Commande introuvable")
        execute(
            conn,
            """
            INSERT INTO paiements (
              id_commande, montant_verse, mode_reglement, etat_transaction, id_employe_encaissement
            )
            VALUES (%s, %s, %s, 'valide', %s)
            """,
            (body.id_commande, str(body.montant), body.mode_reglement, user_id),
        )
        execute(
            conn,
            "UPDATE commandes SET statut_reglement='payee' WHERE id=%s",
            (body.id_commande,),
        )
        pid = last_insert_id(conn)
        row = fetch_one(
            conn,
            """
            SELECT 
              p.id, 
              p.id_commande, 
              p.montant_verse AS montant, 
              p.mode_reglement, 
              p.etat_transaction,
              p.cree_le, 
              p.id_employe_encaissement,
              u.nom_complet AS client_nom
            FROM paiements p
            LEFT JOIN commandes c ON c.id = p.id_commande
            LEFT JOIN utilisateurs u ON u.id = c.id_client
            WHERE p.id=%s
            """,
            (pid,),
        )
    return PaiementOut(**row)
