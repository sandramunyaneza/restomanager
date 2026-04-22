from typing import Optional

from pydantic import BaseModel, EmailStr, Field


class ClientRegisterRequest(BaseModel):
    courriel: EmailStr
    mot_de_passe: str = Field(min_length=6)
    nom_complet: str
    numero_telephone: Optional[str] = None
