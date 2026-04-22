from fastapi import APIRouter, Depends, HTTPException, status

from app.auth import require_roles
from app.database import execute, fetch_all, fetch_one, get_db, last_insert_id
from app.schemas import UserCreate, UserOut
from app.utils import hash_password

router = APIRouter(prefix="/users", tags=["users"])


@router.get("", response_model=list[UserOut])
def list_users(_role: str = Depends(require_roles("admin"))):
    with get_db() as conn:
        rows = fetch_all(
            conn,
            """
            SELECT id, courriel, nom_complet, numero_telephone, profil_utilisateur AS profil, compte_actif
            FROM utilisateurs
            ORDER BY id DESC
            """,
        )
    return [UserOut(**r) for r in rows]


@router.post("", response_model=UserOut, status_code=status.HTTP_201_CREATED)
def create_user(body: UserCreate, _role: str = Depends(require_roles("admin"))):
    with get_db() as conn:
        execute(
            conn,
            """
            INSERT INTO utilisateurs (
              courriel, mot_de_passe_chiffre, nom_complet, numero_telephone, profil_utilisateur, compte_actif
            )
            VALUES (%s, %s, %s, %s, %s, 1)
            """,
            (
                body.courriel.lower().strip(),
                hash_password(body.mot_de_passe),
                body.nom_complet,
                body.numero_telephone,
                body.profil,
            ),
        )
        uid = last_insert_id(conn)
        row = fetch_one(
            conn,
            """
            SELECT id, courriel, nom_complet, numero_telephone, profil_utilisateur AS profil, compte_actif
            FROM utilisateurs WHERE id=%s
            """,
            (uid,),
        )
    return UserOut(**row)
