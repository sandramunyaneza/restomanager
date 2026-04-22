from datetime import datetime
from decimal import Decimal
from typing import List, Optional

from pydantic import BaseModel, Field, field_validator, model_validator

_TYPE_CMD = ("sur_place", "livraison", "emporter")


class LigneCommandeEntree(BaseModel):
    id_produit: int = Field(ge=1)
    quantite: int = Field(ge=1, le=9999)


class LigneCommandeOut(BaseModel):
    id: int
    id_produit: int
    quantite_commandee: int
    prix_unitaire_applique: Decimal


class CommandeCreate(BaseModel):
    id_client: Optional[int] = None
    type_commande: str = "sur_place"
    table_id: Optional[int] = None
    adresse_livraison: Optional[str] = None
    horaire_livraison_prevu: Optional[datetime] = None
    articles: List[LigneCommandeEntree] = Field(min_length=1)
    remarques_commande: Optional[str] = Field(default=None, max_length=512)

    @field_validator("type_commande")
    @classmethod
    def validate_type_commande(cls, v: str) -> str:
        v = (v or "").strip().lower()
        if v not in _TYPE_CMD:
            raise ValueError("type_commande doit être sur_place, livraison ou emporter")
        return v

    @field_validator("adresse_livraison")
    @classmethod
    def strip_adresse(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return None
        s = v.strip()
        return s or None

    @model_validator(mode="after")
    def validate_livraison(self):
        if self.type_commande == "livraison" and not self.adresse_livraison:
            raise ValueError("adresse_livraison requise pour une commande en livraison")
        if self.type_commande != "livraison" and self.adresse_livraison is not None:
            pass
        return self


class CommandeOut(BaseModel):
    id: int
    id_client: int
    type_commande: str
    nature_commande: str
    table_id: Optional[int] = None
    etat_commande: str
    statut_cuisine: str
    montant_total: Decimal
    statut_reglement: str
    cree_le: datetime
    remarques_commande: Optional[str] = None


class CommandeDetailOut(CommandeOut):
    lignes_commande: List[LigneCommandeOut] = Field(default_factory=list)


class CommandeStatutMiseAJour(BaseModel):
    etat_commande: str
