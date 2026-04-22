from decimal import Decimal
from typing import Optional

from pydantic import BaseModel, Field


class CategorieOut(BaseModel):
    id: int
    libelle: str
    ordre_tri: int


class ProduitOut(BaseModel):
    id: int
    id_categorie: int
    categorie_nom: Optional[str] = None
    nom_produit: str
    description_detaillee: Optional[str] = None
    image_url: Optional[str] = None
    prix_tarif: Decimal
    est_disponible: bool


class ProduitCreate(BaseModel):
    id_categorie: int
    nom_produit: str
    description_detaillee: Optional[str] = None
    image_url: Optional[str] = None
    prix_tarif: Decimal = Field(ge=0)
    est_disponible: bool = True
