from app.database import execute, fetch_one, get_db, last_insert_id
from app.schemas import RegisterRequest, TokenResponse, UserPublic
from app.utils import hash_password, verify_password
from app.auth.jwt_utils import create_access_token


def login_user(courriel: str, mot_de_passe: str) -> TokenResponse | None:
    with get_db() as conn:
        row = fetch_one(
            conn,
            """
            SELECT id, courriel, mot_de_passe_chiffre, nom_complet, numero_telephone, profil_utilisateur, compte_actif
            FROM utilisateurs
            WHERE courriel = %s
            """,
            (courriel.lower().strip(),),
        )
    if not row or not row.get("compte_actif"):
        return None
    if not verify_password(mot_de_passe, row["mot_de_passe_chiffre"]):
        return None

    user = UserPublic(
        id=row["id"],
        courriel=row["courriel"],
        nom_complet=row["nom_complet"],
        numero_telephone=row.get("numero_telephone"),
        profil=row["profil_utilisateur"],
    )
    token = create_access_token(
        {"sub": str(row["id"]), "role": row["profil_utilisateur"], "email": row["courriel"]}
    )
    return TokenResponse(jeton_acces=token, utilisateur=user)


def register_user(body: RegisterRequest) -> TokenResponse:
    allowed_self_roles = {"client", "cuisinier", "livreur", "caissier", "magasinier"}
    profil = body.profil.strip().lower()
    if profil not in allowed_self_roles:
        raise ValueError("Rôle d'inscription invalide")

    with get_db() as conn:
        existing = fetch_one(
            conn,
            "SELECT id FROM utilisateurs WHERE courriel=%s",
            (body.courriel.lower().strip(),),
        )
        if existing:
            raise FileExistsError("Courriel déjà utilisé")

        execute(
            conn,
            """
            INSERT INTO utilisateurs (
              courriel, mot_de_passe_chiffre, nom_complet, numero_telephone, profil_utilisateur, compte_actif
            )
            VALUES (%s, %s, %s, %s, %s, 1)
            """,
            (
                body.courriel.lower().strip(),
                hash_password(body.mot_de_passe),
                body.nom_complet,
                body.numero_telephone,
                profil,
            ),
        )
        uid = last_insert_id(conn)
        row = fetch_one(
            conn,
            """
            SELECT id, courriel, nom_complet, numero_telephone, profil_utilisateur, compte_actif
            FROM utilisateurs WHERE id=%s
            """,
            (uid,),
        )

    user = UserPublic(
        id=row["id"],
        courriel=row["courriel"],
        nom_complet=row["nom_complet"],
        numero_telephone=row.get("numero_telephone"),
        profil=row["profil_utilisateur"],
    )
    token = create_access_token({"sub": str(row["id"]), "role": row["profil_utilisateur"], "email": row["courriel"]})
    return TokenResponse(jeton_acces=token, utilisateur=user)
