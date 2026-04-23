# Documentation Application - RestoManager

## 1) Vue d'ensemble

RestoManager est une application de gestion de restaurant avec:
- un backend FastAPI (`backend/app`)
- un frontend React/Vite (`frontend/src`)
- une base MySQL (`database/schema.sql`, `database/seed.sql`)

Fonctionnalites principales:
- Commandes
- Reservations
- Livraisons
- Paiements
- Rapports

## 2) Corrections appliquees

Les interfaces ont ete corrigees pour afficher les noms au lieu des IDs sur les modules demandes:

- Commandes: la colonne client affiche `nom_client`
- Reservations: la colonne client affiche `nom_client`
- Livraisons: la colonne livreur affiche `nom_livreur` et la colonne client affiche `nom_client`

### Changement technique principal

Le backend renvoie maintenant les champs de relation lisibles:
- `nom_client` dans les commandes
- `nom_client` dans les reservations
- `nom_livreur` et `nom_client` dans les livraisons

## 3) Architecture resumee

### Backend
- Entree API: `backend/app/main.py`
- Routes:
  - `backend/app/routes/orders.py`
  - `backend/app/routes/reservations.py`
  - `backend/app/routes/deliveries.py`
  - `backend/app/routes/payments.py`
  - `backend/app/routes/reports.py`
- Services metier:
  - `backend/app/services/order_service.py`
  - `backend/app/services/reservation_service.py`
  - `backend/app/services/livraison_service.py`
  - `backend/app/services/payment_service.py`
  - `backend/app/services/report_service.py`

### Frontend
- Pages:
  - `frontend/src/pages/Commandes.jsx`
  - `frontend/src/pages/Reservations.jsx`
  - `frontend/src/pages/Livraisons.jsx`
  - `frontend/src/pages/Caisse.jsx`
  - `frontend/src/pages/Rapports.jsx`
- Composant table:
  - `frontend/src/components/Common/DataTable.jsx` (support du rendu custom de colonnes)

## 4) Fonctionnalites testees

## Commande
- Chargement de la liste des commandes
- Affichage du nom client (au lieu de l'ID)
- Mise a jour des statuts (en cours, prete, livree, etc.)
- Suppression d'une commande

## Reservation
- Chargement de la liste des reservations
- Affichage du nom client (au lieu de l'ID)
- Creation/modification/suppression d'une reservation
- Changement de statut (confirmee, terminee)

## Livraison
- Chargement de la liste des livraisons
- Affichage du nom client et du nom livreur (au lieu des IDs)
- Mise a jour du statut de livraison

## Paiement
- Encaissement via caisse
- Mapping des modes conformes backend:
  - `carte`
  - `especes`
  - `mobile_pay`
  - `autre`
- Affichage client corrige via `nom_client` lorsque disponible

## Rapport
- Chargement du rapport journalier/mensuel/annuel
- Affichage des indicateurs:
  - nombre de commandes
  - chiffre d'affaires regle
  - commandes reglees

## 5) Verification technique effectuee

- Build frontend OK (`npm run build`)
- Verification lint ciblee des fichiers modifies: OK
- Compilation backend Python OK (`python -m compileall app`)

## 6) Relations de donnees verifiees

Relations principales affichees avec bons champs lisibles:
- `commandes.id_client -> utilisateurs.id -> utilisateurs.nom_complet` (`nom_client`)
- `reservations.id_utilisateur -> utilisateurs.id -> utilisateurs.nom_complet` (`nom_client`)
- `livraisons.id_employe_livreur -> utilisateurs.id -> utilisateurs.nom_complet` (`nom_livreur`)
- `livraisons.id_commande -> commandes.id -> commandes.id_client -> utilisateurs.nom_complet` (`nom_client`)

## 7) Procedure de recette fonctionnelle recommandee

1. Lancer backend et frontend.
2. Se connecter en `admin`, `serveur`, `livreur`, `caissier`, `client`.
3. Verifier:
   - Commandes: noms clients visibles
   - Reservations: noms clients visibles
   - Livraisons: nom livreur visible
4. Realiser un flux complet:
   - client cree reservation
   - serveur confirme reservation et cree commande
   - cuisine/livreur met a jour statut
   - caissier encaisse
   - admin consulte rapport
5. Controler la coherence inter-modules (statuts et montants).

## 8) Notes d'exploitation

- La base doit etre initialisee via `database/schema.sql` puis `database/seed.sql`.
- Les champs de nom sont des valeurs de lecture (jointures SQL) et ne remplacent pas les cles etrangeres.
- Les cles etrangeres restent la source de verite pour l'integrite des donnees.
