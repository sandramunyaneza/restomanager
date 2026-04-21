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


class StockAjustement(BaseModel):
    variation_quantite: Decimal = Field(description="Positif = entrée, négatif = sortie")
    motif_mouvement: Optional[str] = None


class MouvementStockOut(BaseModel):
    id: int
    id_ingredient: int
    variation_quantite: Decimal
    motif_mouvement: Optional[str] = None
    cree_le: datetime
