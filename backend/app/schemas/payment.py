from datetime import datetime
from decimal import Decimal
from typing import Optional

from pydantic import BaseModel, Field


class PaiementCreate(BaseModel):
    id_commande: int
    montant: Decimal = Field(ge=0)
    mode_reglement: str = "carte"


class PaiementOut(BaseModel):
    id: int
    id_commande: int
    montant: Decimal
    mode_reglement: str
    etat_transaction: str
    cree_le: datetime
    id_employe_encaissement: Optional[int] = None
