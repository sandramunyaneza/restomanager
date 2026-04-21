from fastapi import APIRouter, Depends, HTTPException, status
from pymysql.err import OperationalError

from app.auth import load_user_row
from app.schemas import LoginRequest, RegisterRequest, TokenResponse, UserPublic
from app.services.auth_service import login_user, register_user

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/login", response_model=TokenResponse)
def login(body: LoginRequest):
    try:
        result = login_user(body.courriel, body.mot_de_passe)
    except OperationalError as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Connexion base de donnees impossible. Verifiez MYSQL_USER / MYSQL_PASSWORD dans backend/.env.",
        ) from e

    if not result:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Identifiants invalides")
    return result


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
def register(body: RegisterRequest):
    try:
        return register_user(body)
    except FileExistsError as e:
        raise HTTPException(status_code=409, detail=str(e)) from e
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e)) from e
    except OperationalError as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Connexion base de donnees impossible. Verifiez MYSQL_USER / MYSQL_PASSWORD dans backend/.env.",
        ) from e


@router.get("/me", response_model=UserPublic)
def me(user=Depends(load_user_row)):
    return UserPublic(
        id=user["id"],
        courriel=user["courriel"],
        nom_complet=user["nom_complet"],
        numero_telephone=user.get("numero_telephone"),
        profil=user["profil_utilisateur"],
    )
