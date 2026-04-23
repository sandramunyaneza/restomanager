from datetime import datetime
from decimal import Decimal
from typing import List, Optional

from pydantic import BaseModel, Field


class LigneCommandeEntree(BaseModel):
    id_produit: int
    quantite: int = Field(ge=1)
    prix_unitaire: Decimal = Field(ge=0)


class CommandeCreate(BaseModel):
    id_client: Optional[int] = None
    nature_commande: str = "sur_place"
    articles: List[LigneCommandeEntree]
    remarques_commande: Optional[str] = None


class CommandeOut(BaseModel):
    id: int
    id_client: Optional[int] = None
    nature_commande: str
    etat_commande: str
    montant_total: Decimal
    statut_reglement: str
    cree_le: datetime
    remarques_commande: Optional[str] = None
    client_nom: Optional[str] = None


class CommandeStatutMiseAJour(BaseModel):
    etat_commande: str
