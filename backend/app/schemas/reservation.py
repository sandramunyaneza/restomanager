from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


class ReservationCreate(BaseModel):
    horaire_reservation: datetime
    nombre_convives: int = Field(ge=1, le=50)
    designation_table: Optional[str] = None
    remarques_client: Optional[str] = None


class ReservationStatutMiseAJour(BaseModel):
    etat_reservation: str


class ReservationOut(BaseModel):
    id: int
    id_utilisateur: int
    horaire_reservation: datetime
    nombre_convives: int
    etat_reservation: str
    designation_table: Optional[str] = None
    remarques_client: Optional[str] = None
    client_nom: Optional[str] = None
