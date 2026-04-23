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


class ReservationUpdate(BaseModel):
    horaire_reservation: Optional[datetime] = None
    nombre_convives: Optional[int] = Field(default=None, ge=1, le=50)
    designation_table: Optional[str] = None
    remarques_client: Optional[str] = None


class ReservationStatsOut(BaseModel):
    total: int
    validees: int
    non_validees: int


class ReservationOut(BaseModel):
    id: int
    id_utilisateur: int
    nom_client: Optional[str] = None
    horaire_reservation: datetime
    nombre_convives: int
    etat_reservation: str
    designation_table: Optional[str] = None
    remarques_client: Optional[str] = None
