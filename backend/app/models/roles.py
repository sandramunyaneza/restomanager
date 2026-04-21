from enum import Enum


class Role(str, Enum):
    CLIENT = "client"
    ADMIN = "admin"
    CAISSIER = "caissier"
    CUISINIER = "cuisinier"
    LIVREUR = "livreur"
    MAGASINIER = "magasinier"
