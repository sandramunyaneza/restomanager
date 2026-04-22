from fastapi import APIRouter, HTTPException, status
from pymysql.err import OperationalError

from app.schemas import ClientRegisterRequest, LoginRequest, RegisterRequest, TokenResponse
from app.services.auth_service import login_user_for_role, register_user_with_forced_role

router = APIRouter(prefix="/client", tags=["client-auth"])


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
def client_register(body: ClientRegisterRequest):
    try:
        return register_user_with_forced_role(
            RegisterRequest(
                courriel=body.courriel,
                mot_de_passe=body.mot_de_passe,
                nom_complet=body.nom_complet,
                numero_telephone=body.numero_telephone,
            ),
            "client",
        )
    except FileExistsError as e:
        raise HTTPException(status_code=409, detail=str(e)) from e
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e)) from e
    except OperationalError as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Connexion base de donnees impossible.",
        ) from e


@router.post("/login", response_model=TokenResponse)
def client_login(body: LoginRequest):
    try:
        result = login_user_for_role(body.courriel, body.mot_de_passe, "client")
    except OperationalError as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Connexion base de donnees impossible.",
        ) from e
    if not result:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Identifiants invalides")
    return result
