from typing import Optional

from pydantic import BaseModel


class LivraisonOut(BaseModel):
    id: int
    id_commande: int
    id_employe_livreur: Optional[int] = None
    adresse_livraison: str
    avancement_livraison: str


class LivraisonMiseAJour(BaseModel):
    avancement_livraison: Optional[str] = None
    id_employe_livreur: Optional[int] = None
