from fastapi import APIRouter, Depends, HTTPException, status

from app.auth import require_roles
from app.database import execute, fetch_all, fetch_one, get_db, last_insert_id
from app.schemas import CategorieOut, ProduitCreate, ProduitOut, ProduitUpdate

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
            SELECT id, id_categorie, nom_produit, description_detaillee, prix_tarif, est_disponible
            FROM produits
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
              id_categorie, nom_produit, description_detaillee, prix_tarif, est_disponible
            )
            VALUES (%s, %s, %s, %s, %s)
            """,
            (
                body.id_categorie,
                body.nom_produit,
                body.description_detaillee,
                str(body.prix_tarif),
                1 if body.est_disponible else 0,
            ),
        )
        pid = last_insert_id(conn)
        row = fetch_one(
            conn,
            """
            SELECT id, id_categorie, nom_produit, description_detaillee, prix_tarif, est_disponible
            FROM produits WHERE id=%s
            """,
            (pid,),
        )
    if not row:
        raise HTTPException(status_code=500, detail="Création impossible")
    return ProduitOut(**{**row, "est_disponible": bool(row["est_disponible"])})
@router.put("/{product_id}", response_model=ProduitOut)
def update_product(
    product_id: int,
    body: ProduitUpdate,
    _role: str = Depends(require_roles("admin")),
):
    with get_db() as conn:
        existing = fetch_one(conn, "SELECT id FROM produits WHERE id=%s", (product_id,))
        if not existing:
            raise HTTPException(status_code=404, detail="Produit introuvable")
        
        execute(
            conn,
            """
            UPDATE produits 
            SET nom_produit = %s, description_detaillee = %s, prix_tarif = %s, id_categorie = %s
            WHERE id = %s
            """,
            (
                body.nom_produit,
                body.description_detaillee,
                str(body.prix_tarif),
                body.id_categorie,
                product_id,
            ),
        )
        
        row = fetch_one(
            conn,
            """
            SELECT id, id_categorie, nom_produit, description_detaillee, prix_tarif, est_disponible
            FROM produits WHERE id=%s
            """,
            (product_id,),
        )
    return ProduitOut(**{**row, "est_disponible": bool(row["est_disponible"])})


@router.delete("/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_product(
    product_id: int,
    _role: str = Depends(require_roles("admin")),
):
    with get_db() as conn:
        existing = fetch_one(conn, "SELECT id FROM produits WHERE id=%s", (product_id,))
        if not existing:
            raise HTTPException(status_code=404, detail="Produit introuvable")
        
        execute(conn, "DELETE FROM produits WHERE id=%s", (product_id,))
    return None
