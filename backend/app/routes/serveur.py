from decimal import Decimal
from fastapi import APIRouter, Depends, HTTPException, status
from app.auth import get_current_user_id, require_roles
from app.database import execute, fetch_all, fetch_one, get_db, last_insert_id
from app.schemas import ServeurCommandeCreate, ServeurCommandeOut, TableRestaurantOut

router = APIRouter(prefix="/serveur", tags=["serveur"])


@router.get("/tables", response_model=list[TableRestaurantOut])
def list_tables(_role: str = Depends(require_roles("admin", "serveur"))):
    with get_db() as conn:
        rows = fetch_all(
            conn, 
            "SELECT id, numero_table, capacite, statut, created_at FROM tables_restaurant ORDER BY numero_table"
        )
    return [TableRestaurantOut(**r) for r in rows]


@router.put("/table/{table_id}/occuper", response_model=TableRestaurantOut)
def occuper_table(table_id: int, _role: str = Depends(require_roles("admin", "serveur"))):
    with get_db() as conn:
        n = execute(conn, "UPDATE tables_restaurant SET statut='occupee' WHERE id=%s", (table_id,))
        row = fetch_one(
            conn, 
            "SELECT id, numero_table, capacite, statut, created_at FROM tables_restaurant WHERE id=%s", 
            (table_id,)
        )
    if not n or not row:
        raise HTTPException(status_code=404, detail="Table introuvable")
    return TableRestaurantOut(**row)


@router.put("/table/{table_id}/liberer", response_model=TableRestaurantOut)
def liberer_table(table_id: int, _role: str = Depends(require_roles("admin", "serveur"))):
    with get_db() as conn:
        n = execute(conn, "UPDATE tables_restaurant SET statut='libre' WHERE id=%s", (table_id,))
        row = fetch_one(
            conn, 
            "SELECT id, numero_table, capacite, statut, created_at FROM tables_restaurant WHERE id=%s", 
            (table_id,)
        )
    if not n or not row:
        raise HTTPException(status_code=404, detail="Table introuvable")
    return TableRestaurantOut(**row)


@router.post("/commande", response_model=ServeurCommandeOut, status_code=status.HTTP_201_CREATED)
def create_serveur_order(
    body: ServeurCommandeCreate,
    serveur_id: int = Depends(get_current_user_id),
    _role: str = Depends(require_roles("admin", "serveur")),
):
    total = sum((i.prix_unitaire * i.quantite for i in body.articles), start=Decimal("0"))
    
    with get_db() as conn:
        table_row = fetch_one(conn, "SELECT id, statut FROM tables_restaurant WHERE id=%s", (body.table_id,))
        if not table_row:
            raise HTTPException(status_code=404, detail="Table introuvable")
        
        type_commande = "sur_place"
        statut_cuisine = "a_envoyer"
        
        if body.serveur_type == "bar":
            statut_cuisine = "boisson"
        
        id_client_value = body.id_client if body.id_client else None
        
        execute(
            conn,
            """
            INSERT INTO commandes (
              id_client, id_employe_creation, serveur_id, table_id, type_commande, nature_commande,
              statut_cuisine, etat_commande, montant_total, statut_reglement, remarques_commande
            )
            VALUES (%s, %s, %s, %s, %s, %s, %s, 'en_attente', %s, 'non_payee', %s)
            """,
            (
                id_client_value,
                serveur_id,
                serveur_id,
                body.table_id,
                type_commande,
                type_commande,
                statut_cuisine,
                str(total),
                body.remarques_commande,
            ),
        )
        oid = last_insert_id(conn)
        
        for line in body.articles:
            execute(
                conn,
                """
                INSERT INTO lignes_commande (id_commande, id_produit, quantite_commandee, prix_unitaire_applique)
                VALUES (%s, %s, %s, %s)
                """,
                (oid, line.id_produit, line.quantite, str(line.prix_unitaire)),
            )
        
        execute(conn, "UPDATE tables_restaurant SET statut='occupee' WHERE id=%s", (body.table_id,))
    
    return _get_serveur_commande(oid)

@router.get("/produits")
def get_produits(_role: str = Depends(require_roles("admin", "serveur"))):
    with get_db() as conn:
        rows = fetch_all(
            conn,
            """
            SELECT id, nom_produit, description_detaillee, prix_tarif, id_categorie
            FROM produits
            WHERE est_disponible = 1
            ORDER BY id_categorie, nom_produit
            """
        )
        
        categories = fetch_all(conn, "SELECT id, libelle FROM categories_menu ORDER BY ordre_tri")
        
        for row in rows:
            cat = next((c for c in categories if c["id"] == row["id_categorie"]), None)
            row["categorie_libelle"] = cat["libelle"] if cat else "Non classé"
    
    return rows


@router.get("/commandes/cuisine")
def get_commandes_cuisine(_role: str = Depends(require_roles("admin", "cuisinier"))):
    with get_db() as conn:
        rows = fetch_all(
            conn,
            """
            SELECT 
                c.id, 
                c.table_id, 
                t.numero_table,
                c.statut_cuisine, 
                c.etat_commande, 
                c.montant_total, 
                c.cree_le,
                GROUP_CONCAT(CONCAT(p.nom_produit, ' x', lc.quantite_commandee) SEPARATOR ', ') as articles
            FROM commandes c
            LEFT JOIN tables_restaurant t ON t.id = c.table_id
            LEFT JOIN lignes_commande lc ON lc.id_commande = c.id
            LEFT JOIN produits p ON p.id = lc.id_produit
            WHERE c.type_commande = 'sur_place' 
              AND c.statut_cuisine IN ('a_envoyer', 'en_preparation', 'boisson')
            GROUP BY c.id
            ORDER BY c.cree_le ASC
            """
        )
    return rows


@router.put("/commande/{order_id}/preparer")
def preparer_commande(order_id: int, _role: str = Depends(require_roles("admin", "cuisinier"))):
    with get_db() as conn:
        execute(
            conn,
            "UPDATE commandes SET statut_cuisine = 'en_preparation' WHERE id = %s AND statut_cuisine = 'a_envoyer'",
            (order_id,)
        )
        row = fetch_one(
            conn,
            "SELECT id, statut_cuisine FROM commandes WHERE id=%s",
            (order_id,)
        )
    if not row:
        raise HTTPException(status_code=404, detail="Commande introuvable")
    return row


@router.put("/commande/{order_id}/pret")
def commande_prete(order_id: int, _role: str = Depends(require_roles("admin", "cuisinier"))):
    with get_db() as conn:
        execute(
            conn,
            "UPDATE commandes SET statut_cuisine = 'prete', etat_commande = 'prete' WHERE id = %s",
            (order_id,)
        )
        row = fetch_one(
            conn,
            "SELECT id, statut_cuisine, etat_commande FROM commandes WHERE id=%s",
            (order_id,)
        )
    if not row:
        raise HTTPException(status_code=404, detail="Commande introuvable")
    return row


@router.get("/commandes/bar")
def get_commandes_bar(_role: str = Depends(require_roles("admin", "magasinier"))):
    with get_db() as conn:
        rows = fetch_all(
            conn,
            """
            SELECT 
                c.id, 
                c.table_id, 
                t.numero_table,
                c.statut_cuisine, 
                c.etat_commande, 
                c.montant_total, 
                c.cree_le,
                GROUP_CONCAT(CONCAT(p.nom_produit, ' x', lc.quantite_commandee) SEPARATOR ', ') as articles
            FROM commandes c
            LEFT JOIN tables_restaurant t ON t.id = c.table_id
            LEFT JOIN lignes_commande lc ON lc.id_commande = c.id
            LEFT JOIN produits p ON p.id = lc.id_produit
            WHERE c.type_commande = 'sur_place' 
              AND c.statut_cuisine = 'boisson'
            GROUP BY c.id
            ORDER BY c.cree_le ASC
            """
        )
    return rows


@router.put("/commande/{order_id}/servir-boisson")
def servir_boisson(order_id: int, _role: str = Depends(require_roles("admin", "magasinier"))):
    with get_db() as conn:
        execute(
            conn,
            "UPDATE commandes SET statut_cuisine = 'prete', etat_commande = 'prete' WHERE id = %s AND statut_cuisine = 'boisson'",
            (order_id,)
        )
        row = fetch_one(
            conn,
            "SELECT id, statut_cuisine, etat_commande FROM commandes WHERE id=%s",
            (order_id,)
        )
    if not row:
        raise HTTPException(status_code=404, detail="Commande introuvable")
    return row


@router.get("/mes-commandes", response_model=list[ServeurCommandeOut])
def list_my_orders(
    serveur_id: int = Depends(get_current_user_id),
    _role: str = Depends(require_roles("admin", "serveur")),
):
    with get_db() as conn:
        rows = fetch_all(
            conn,
            """
            SELECT id, id_client, serveur_id, table_id, type_commande, nature_commande,
                   statut_cuisine, heure_envoi_cuisine, etat_commande, montant_total, cree_le
            FROM commandes
            WHERE serveur_id = %s
            ORDER BY id DESC
            """,
            (serveur_id,),
        )
    return [ServeurCommandeOut(**r) for r in rows]


def _get_serveur_commande(order_id: int) -> ServeurCommandeOut:
    with get_db() as conn:
        row = fetch_one(
            conn,
            """
            SELECT id, id_client, serveur_id, table_id, type_commande, nature_commande,
                   statut_cuisine, heure_envoi_cuisine, etat_commande, montant_total, cree_le
            FROM commandes WHERE id=%s
            """,
            (order_id,),
        )
    if not row:
        raise HTTPException(status_code=404, detail="Commande introuvable")
    return ServeurCommandeOut(**row)