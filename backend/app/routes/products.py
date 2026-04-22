from fastapi import APIRouter, Depends, HTTPException, status

from app.auth import require_roles
from app.database import execute, fetch_all, fetch_one, get_db, last_insert_id
from app.schemas import CategorieOut, ProduitCreate, ProduitOut

router = APIRouter(prefix="/products", tags=["products"])


@router.get("/categories", response_model=list[CategorieOut])
def list_categories():
    with get_db() as conn:
        rows = fetch_all(conn, "SELECT id, libelle, ordre_tri FROM categories_menu ORDER BY ordre_tri, id")
    return [CategorieOut(**r) for r in rows]


@router.get("", response_model=list[ProduitOut])
def list_products(available_only: bool = False):
    with get_db() as conn:
        base = """
            SELECT p.id, p.id_categorie, c.libelle AS categorie_nom, p.nom_produit,
                   p.description_detaillee, p.image_url, p.prix_tarif, p.est_disponible
            FROM produits p
            LEFT JOIN categories_menu c ON c.id = p.id_categorie
        """
        if available_only:
            rows = fetch_all(conn, base + " WHERE est_disponible=1")
        else:
            rows = fetch_all(conn, base + " ORDER BY id")
    return [ProduitOut(**{**r, "est_disponible": bool(r["est_disponible"])}) for r in rows]


@router.post("", response_model=ProduitOut, status_code=status.HTTP_201_CREATED)
def create_product(body: ProduitCreate, _role: str = Depends(require_roles("admin"))):
    with get_db() as conn:
        execute(
            conn,
            """
            INSERT INTO produits (
              id_categorie, nom_produit, description_detaillee, image_url, prix_tarif, est_disponible
            )
            VALUES (%s, %s, %s, %s, %s, %s)
            """,
            (
                body.id_categorie,
                body.nom_produit,
                body.description_detaillee,
                body.image_url,
                str(body.prix_tarif),
                1 if body.est_disponible else 0,
            ),
        )
        pid = last_insert_id(conn)
        row = fetch_one(
            conn,
            """
            SELECT p.id, p.id_categorie, c.libelle AS categorie_nom, p.nom_produit,
                   p.description_detaillee, p.image_url, p.prix_tarif, p.est_disponible
            FROM produits p
            LEFT JOIN categories_menu c ON c.id = p.id_categorie
            WHERE p.id=%s
            """,
            (pid,),
        )
    if not row:
        raise HTTPException(status_code=500, detail="Création impossible")
    return ProduitOut(**{**row, "est_disponible": bool(row["est_disponible"])})
