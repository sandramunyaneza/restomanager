from fastapi import APIRouter, Depends, HTTPException, status, Query
from datetime import datetime
from typing import Optional

from app.auth import get_current_user_id, require_roles, load_user_row
from app.database import execute, fetch_all, fetch_one, get_db, last_insert_id
from app.schemas import IngredientOut, MouvementStockOut, StockAjustement, IngredientCreate, IngredientUpdate

router = APIRouter(prefix="/stock", tags=["stock"])


@router.get("/ingredients", response_model=list[IngredientOut])
def list_ingredients(current_user: dict = Depends(load_user_row)):
    allowed_roles = ["admin", "magasinier", "cuisinier"]
    if current_user["profil_utilisateur"] not in allowed_roles:
        raise HTTPException(status_code=403, detail="Permission refusée")
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


@router.post("/ingredients", response_model=IngredientOut, status_code=status.HTTP_201_CREATED)
def create_ingredient(
    body: IngredientCreate,
    current_user: dict = Depends(require_roles("admin", "magasinier"))
):
    with get_db() as conn:
        existing = fetch_one(
            conn,
            "SELECT id FROM ingredients WHERE libelle_ingredient = %s",
            (body.libelle_ingredient,)
        )
        if existing:
            raise HTTPException(status_code=400, detail="Cet ingrédient existe déjà")
        
        execute(
            conn,
            """
            INSERT INTO ingredients (libelle_ingredient, unite_mesure, quantite_en_stock, quantite_seuil_alerte)
            VALUES (%s, %s, %s, %s)
            """,
            (body.libelle_ingredient, body.unite_mesure, str(body.quantite_en_stock), str(body.quantite_seuil_alerte))
        )
        iid = last_insert_id(conn)
        row = fetch_one(
            conn,
            "SELECT id, libelle_ingredient, unite_mesure, quantite_en_stock, quantite_seuil_alerte FROM ingredients WHERE id=%s",
            (iid,)
        )
    return IngredientOut(**row)


@router.put("/ingredients/{ingredient_id}", response_model=IngredientOut)
def update_ingredient(
    ingredient_id: int,
    body: IngredientUpdate,
    current_user: dict = Depends(require_roles("admin", "magasinier"))
):
    with get_db() as conn:
        ing = fetch_one(conn, "SELECT id FROM ingredients WHERE id=%s", (ingredient_id,))
        if not ing:
            raise HTTPException(status_code=404, detail="Ingrédient introuvable")
        
        updates = []
        params = []
        if body.libelle_ingredient is not None:
            updates.append("libelle_ingredient = %s")
            params.append(body.libelle_ingredient)
        if body.unite_mesure is not None:
            updates.append("unite_mesure = %s")
            params.append(body.unite_mesure)
        if body.quantite_seuil_alerte is not None:
            updates.append("quantite_seuil_alerte = %s")
            params.append(str(body.quantite_seuil_alerte))
        
        if updates:
            params.append(ingredient_id)
            execute(conn, f"UPDATE ingredients SET {', '.join(updates)} WHERE id=%s", tuple(params))
        
        row = fetch_one(
            conn,
            "SELECT id, libelle_ingredient, unite_mesure, quantite_en_stock, quantite_seuil_alerte FROM ingredients WHERE id=%s",
            (ingredient_id,)
        )
    return IngredientOut(**row)


@router.delete("/ingredients/{ingredient_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_ingredient(
    ingredient_id: int,
    current_user: dict = Depends(require_roles("admin", "magasinier"))
):
    with get_db() as conn:
        ing = fetch_one(conn, "SELECT id FROM ingredients WHERE id=%s", (ingredient_id,))
        if not ing:
            raise HTTPException(status_code=404, detail="Ingrédient introuvable")
        
        execute(conn, "DELETE FROM ingredients WHERE id=%s", (ingredient_id,))
    return None


@router.post("/ingredients/{ingredient_id}/adjust", response_model=MouvementStockOut, status_code=status.HTTP_201_CREATED)
def adjust_stock(
    ingredient_id: int,
    body: StockAjustement,
    user_id: int = Depends(get_current_user_id),
    current_user: dict = Depends(require_roles("admin", "magasinier"))
):
    with get_db() as conn:
        ing = fetch_one(
            conn,
            "SELECT id, libelle_ingredient, quantite_en_stock FROM ingredients WHERE id=%s",
            (ingredient_id,),
        )
        if not ing:
            raise HTTPException(status_code=404, detail="Ingrédient introuvable")
        
        ancien_stock = float(ing["quantite_en_stock"])
        nouvelle_qty = ancien_stock + float(body.variation_quantite)
        if nouvelle_qty < 0:
            raise HTTPException(status_code=400, detail="Stock insuffisant")
        
        execute(
            conn,
            "UPDATE ingredients SET quantite_en_stock=%s WHERE id=%s",
            (str(nouvelle_qty), ingredient_id),
        )
        
        type_operation = "entree" if body.variation_quantite > 0 else "sortie"
        execute(
            conn,
            """
            INSERT INTO mouvements_stock (
              id_ingredient, variation_quantite, ancien_stock, nouveau_stock, 
              motif_mouvement, type_reference_operation, id_utilisateur_effectuant
            )
            VALUES (%s, %s, %s, %s, %s, %s, %s)
            """,
            (
                ingredient_id, 
                str(body.variation_quantite), 
                str(ancien_stock),
                str(nouvelle_qty),
                body.motif_mouvement, 
                type_operation,
                user_id
            ),
        )
        mid = last_insert_id(conn)
        row = fetch_one(
            conn,
            """
            SELECT id, id_ingredient, variation_quantite, ancien_stock, nouveau_stock, 
                   motif_mouvement, cree_le
            FROM mouvements_stock WHERE id=%s
            """,
            (mid,),
        )
    return MouvementStockOut(**row)


@router.get("/mouvements/{ingredient_id}")
def get_mouvements_stock(
    ingredient_id: int,
    start_date: Optional[str] = Query(None, description="YYYY-MM-DD"),
    end_date: Optional[str] = Query(None, description="YYYY-MM-DD"),
    current_user: dict = Depends(require_roles("admin", "magasinier"))
):
    with get_db() as conn:
        conditions = ["id_ingredient = %s"]
        params = [ingredient_id]
        
        if start_date:
            conditions.append("DATE(cree_le) >= %s")
            params.append(start_date)
        if end_date:
            conditions.append("DATE(cree_le) <= %s")
            params.append(end_date)
        
        rows = fetch_all(
            conn,
            f"""
            SELECT id, variation_quantite, ancien_stock, nouveau_stock,
                   motif_mouvement, type_reference_operation, cree_le
            FROM mouvements_stock
            WHERE {' AND '.join(conditions)}
            ORDER BY cree_le DESC
            """,
            tuple(params)
        )
    return rows


@router.get("/fiche-stock/{ingredient_id}")
def get_fiche_stock(
    ingredient_id: int,
    start_date: str = Query(..., description="YYYY-MM-DD"),
    end_date: str = Query(..., description="YYYY-MM-DD"),
    current_user: dict = Depends(require_roles("admin", "magasinier"))
):
    with get_db() as conn:
        ingredient = fetch_one(
            conn,
            "SELECT id, libelle_ingredient, unite_mesure, quantite_en_stock FROM ingredients WHERE id=%s",
            (ingredient_id,)
        )
        if not ingredient:
            raise HTTPException(status_code=404, detail="Ingrédient introuvable")
        
        mouvements = fetch_all(
            conn,
            """
            SELECT variation_quantite, motif_mouvement, type_reference_operation, 
                   cree_le, ancien_stock, nouveau_stock
            FROM mouvements_stock
            WHERE id_ingredient = %s AND DATE(cree_le) BETWEEN %s AND %s
            ORDER BY cree_le ASC
            """,
            (ingredient_id, start_date, end_date)
        )
        
        stock_initial = 0
        entrees = 0
        sorties = 0
        
        for m in mouvements:
            qty = float(m["variation_quantite"])
            if qty > 0:
                entrees += qty
            else:
                sorties += abs(qty)
        
        if mouvements:
            stock_initial = float(mouvements[0]["ancien_stock"])
        else:
            stock_initial = float(ingredient["quantite_en_stock"]) - entrees + sorties
        
        stock_final = stock_initial + entrees - sorties
        
        return {
            "ingredient": ingredient,
            "periode": {"debut": start_date, "fin": end_date},
            "stock_initial": round(stock_initial, 2),
            "total_entrees": round(entrees, 2),
            "total_sorties": round(sorties, 2),
            "stock_final": round(stock_final, 2),
            "mouvements": mouvements
        }