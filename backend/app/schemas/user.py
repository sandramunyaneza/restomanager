from typing import Optional

from pydantic import BaseModel, EmailStr, Field


class UserCreate(BaseModel):
    courriel: EmailStr
    mot_de_passe: str = Field(min_length=6)
    nom_complet: str
    numero_telephone: Optional[str] = None
    profil: str


class UserOut(BaseModel):
    id: int
    courriel: str
    nom_complet: str
    numero_telephone: Optional[str] = None
    profil: str
    compte_actif: bool
