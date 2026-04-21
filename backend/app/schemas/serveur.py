from datetime import datetime
from decimal import Decimal
from typing import Optional

from pydantic import BaseModel, Field

from app.schemas.order import LigneCommandeEntree


class ServeurCommandeCreate(BaseModel):
    id_client: int
    table_id: int
    articles: list[LigneCommandeEntree]
    remarques_commande: Optional[str] = None


class TableRestaurantOut(BaseModel):
    id: int
    numero_table: str
    capacite: int
    statut: str
    created_at: datetime


class ServeurCommandeOut(BaseModel):
    id: int
    id_client: int
    serveur_id: Optional[int] = None
    table_id: Optional[int] = None
    type_commande: str
    nature_commande: str
    statut_cuisine: str
    heure_envoi_cuisine: Optional[datetime] = None
    etat_commande: str
    montant_total: Decimal
    cree_le: datetime


class TableStatutUpdate(BaseModel):
    statut: str = Field(pattern="^(libre|occupee|reservee)$")
