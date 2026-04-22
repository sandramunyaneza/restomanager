from typing import Optional

from pydantic import BaseModel, EmailStr, Field


class LoginRequest(BaseModel):
    courriel: EmailStr
    mot_de_passe: str = Field(min_length=1)


class RegisterRequest(BaseModel):
    courriel: EmailStr
    mot_de_passe: str = Field(min_length=6)
    nom_complet: str
    numero_telephone: Optional[str] = None


class UserPublic(BaseModel):
    id: int
    courriel: str
    nom_complet: str
    numero_telephone: Optional[str] = None
    profil: str


class TokenResponse(BaseModel):
    jeton_acces: str
    type_jeton: str = "bearer"
    utilisateur: UserPublic
