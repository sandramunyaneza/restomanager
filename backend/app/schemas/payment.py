from datetime import datetime
from decimal import Decimal
from typing import Optional

from pydantic import BaseModel, Field, field_validator


class PaiementCreate(BaseModel):
    id_commande: int
    montant: Decimal = Field(ge=0)
    mode_reglement: str = "carte"

    @field_validator("mode_reglement")
    @classmethod
    def valider_mode(cls, v: str) -> str:
        allowed = {"especes", "carte", "mobile_pay", "autre"}
        if (v or "").lower() not in allowed:
            raise ValueError("mode_reglement doit être especes, carte, mobile_pay ou autre")
        return (v or "").lower()


class PaiementOut(BaseModel):
    id: int
    id_commande: int
    montant: Decimal
    mode_reglement: str
    etat_transaction: str
    cree_le: datetime
    id_employe_encaissement: Optional[int] = None


class PaiementRemboursementDemande(BaseModel):
    id_commande: int
    motif: Optional[str] = Field(default=None, max_length=255)
