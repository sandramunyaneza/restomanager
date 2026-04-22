from datetime import datetime
from decimal import Decimal
from typing import Optional

from pydantic import BaseModel, Field


class IngredientOut(BaseModel):
    id: int
    libelle_ingredient: str
    unite_mesure: str
    quantite_en_stock: Decimal
    quantite_seuil_alerte: Decimal


class IngredientCreate(BaseModel):
    libelle_ingredient: str = Field(min_length=2)
    unite_mesure: str = "kg"
    quantite_en_stock: Decimal = Field(default=0, ge=0)
    quantite_seuil_alerte: Decimal = Field(default=5, ge=0)


class IngredientUpdate(BaseModel):
    libelle_ingredient: Optional[str] = None
    unite_mesure: Optional[str] = None
    quantite_seuil_alerte: Optional[Decimal] = None


class StockAjustement(BaseModel):
    variation_quantite: Decimal = Field(description="Positif = entrée, négatif = sortie")
    motif_mouvement: str = Field(min_length=3)


class MouvementStockOut(BaseModel):
    id: int
    id_ingredient: int
    variation_quantite: Decimal
    motif_mouvement: Optional[str] = None
    cree_le: datetime
    ancien_stock: Optional[Decimal] = None
    nouveau_stock: Optional[Decimal] = None