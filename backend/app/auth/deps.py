from typing import Callable, Optional, Set

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.auth.jwt_utils import safe_decode
from app.database import fetch_one, get_db
from app.models import Role

security = HTTPBearer(auto_error=False)


def _roles_subset() -> dict[str, Set[str]]:
    """Permissions par route métier (noms de rôles)."""
    return {
        "admin": {r.value for r in Role},
        "staff_orders": {
            Role.ADMIN.value,
            Role.CAISSIER.value,
            Role.CUISINIER.value,
            Role.SERVEUR.value,
        },
        "cashier": {Role.ADMIN.value, Role.CAISSIER.value},
        "kitchen": {Role.ADMIN.value, Role.CUISINIER.value},
        "server": {Role.ADMIN.value, Role.SERVEUR.value},
        "delivery": {Role.ADMIN.value, Role.LIVREUR.value},
        "warehouse": {Role.ADMIN.value, Role.MAGASINIER.value},
        "reports": {Role.ADMIN.value, Role.CAISSIER.value},
    }


def get_token_payload(
    creds: Optional[HTTPAuthorizationCredentials] = Depends(security),
) -> dict:
    if creds is None or not creds.credentials:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Non authentifié")
    payload = safe_decode(creds.credentials)
    if not payload or "sub" not in payload:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token invalide")
    return payload


def get_current_user_id(payload: dict = Depends(get_token_payload)) -> int:
    try:
        return int(payload["sub"])
    except (KeyError, TypeError, ValueError) as e:
        raise HTTPException(status_code=401, detail="Token invalide") from e


def get_current_role(payload: dict = Depends(get_token_payload)) -> str:
    role = payload.get("role")
    if not role:
        raise HTTPException(status_code=401, detail="Rôle manquant")
    return str(role)


def require_roles(*allowed: str) -> Callable:
    allowed_set = set(allowed)

    def checker(role: str = Depends(get_current_role)) -> str:
        if role not in allowed_set:
            raise HTTPException(status_code=403, detail="Permission refusée")
        return role

    return checker


def require_permission(permission_key: str) -> Callable:
    allowed = _roles_subset().get(permission_key, set())

    def checker(role: str = Depends(get_current_role)) -> str:
        if role not in allowed:
            raise HTTPException(status_code=403, detail="Permission refusée")
        return role

    return checker


def load_user_row(user_id: int = Depends(get_current_user_id)):
    with get_db() as conn:
        row = fetch_one(
            conn,
            """
            SELECT id, courriel, nom_complet, numero_telephone, profil_utilisateur, compte_actif, cree_le
            FROM utilisateurs
            WHERE id = %s
            """,
            (user_id,),
        )
    if not row or not row.get("compte_actif"):
        raise HTTPException(status_code=401, detail="Utilisateur invalide ou inactif")
    return row
