from fastapi import APIRouter, Depends, HTTPException, status
from pymysql.err import OperationalError
from app.services.auth_service import login_user
from app.schemas import LoginRequest, TokenResponse, UserPublic

router = APIRouter()
@router.post("/login", response_model=TokenResponse)
def login(body: LoginRequest):
    result = login_user(body.courriel, body.mot_de_passe)
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