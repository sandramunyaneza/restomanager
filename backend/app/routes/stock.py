from fastapi import APIRouter, Depends, HTTPException, status

from app.auth import get_current_user_id, require_roles
from app.database import execute, fetch_all, fetch_one, get_db, last_insert_id
from app.schemas import IngredientOut, MouvementStockOut, StockAjustement

router = APIRouter(prefix="/stock", tags=["stock"])


@router.get("/ingredients", response_model=list[IngredientOut])
def list_ingredients(_role: str = Depends(require_roles("admin", "magasinier", "cuisinier"))):
    with get_db() as conn:
        rows = fetch_all(
            conn,
            """
            SELECT id, libelle_ingredient, unite_mesure, quantite_en_stock, quantite_seuil_alerte
            FROM ingredients
            ORDER BY libelle_ingredient
            """,
        )
    return [IngredientOut(**r) for r in rows]


@router.post("/ingredients/{ingredient_id}/adjust", response_model=MouvementStockOut, status_code=status.HTTP_201_CREATED)
def adjust_stock(
    ingredient_id: int,
    body: StockAjustement,
    user_id: int = Depends(get_current_user_id),
    _role: str = Depends(require_roles("admin", "magasinier")),
):
    with get_db() as conn:
        ing = fetch_one(
            conn,
            "SELECT id, quantite_en_stock FROM ingredients WHERE id=%s",
            (ingredient_id,),
        )
        if not ing:
            raise HTTPException(status_code=404, detail="Ingrédient introuvable")
        new_qty = float(ing["quantite_en_stock"]) + float(body.variation_quantite)
        if new_qty < 0:
            raise HTTPException(status_code=400, detail="Stock insuffisant")
        execute(
            conn,
            "UPDATE ingredients SET quantite_en_stock=%s WHERE id=%s",
            (str(new_qty), ingredient_id),
        )
        execute(
            conn,
            """
            INSERT INTO mouvements_stock (
              id_ingredient, variation_quantite, motif_mouvement, type_reference_operation, id_utilisateur_effectuant
            )
            VALUES (%s, %s, %s, 'ajustement', %s)
            """,
            (ingredient_id, str(body.variation_quantite), body.motif_mouvement, user_id),
        )
        mid = last_insert_id(conn)
        row = fetch_one(
            conn,
            """
            SELECT id, id_ingredient, variation_quantite, motif_mouvement, cree_le
            FROM mouvements_stock WHERE id=%s
            """,
            (mid,),
        )
    return MouvementStockOut(**row)
