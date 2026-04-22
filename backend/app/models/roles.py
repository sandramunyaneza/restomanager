from enum import Enum


class Role(str, Enum):
    CLIENT = "client"
    ADMIN = "admin"
    SERVEUR = "serveur"
    CAISSIER = "caissier"
    CUISINIER = "cuisinier"
    LIVREUR = "livreur"
    MAGASINIER = "magasinier"
