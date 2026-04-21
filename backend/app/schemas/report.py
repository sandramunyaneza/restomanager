from decimal import Decimal

from pydantic import BaseModel


class RapportSynthese(BaseModel):
    periode: str
    nombre_commandes: int
    chiffre_affaires: Decimal
    commandes_reglees: int
