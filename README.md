# 🍽️ RestoManager

**Solution complète de gestion de restaurant**

RestoManager est une application web moderne permettant de gérer l'ensemble des opérations d'un restaurant : réservations, commandes, gestion des tables, caisse, stocks, facturation et rapports.

---

## 📋 Table des matières

- [Fonctionnalités](#-fonctionnalités)
- [Technologies utilisées](#-technologies-utilisées)
- [Prérequis](#-prérequis)
- [Installation](#-installation)
- [Configuration](#-configuration)
- [Démarrage](#-démarrage)
- [Comptes de démonstration](#-comptes-de-démonstration)
- [Structure du projet](#-structure-du-projet)
- [API Endpoints](#-api-endpoints)
- [Captures d'écran](#-captures-décran)
- [Contribuer](#-contribuer)
- [Licence](#-licence)

---

## 🚀 Fonctionnalités

### 👤 Gestion des utilisateurs
- Authentification sécurisée (JWT)
- Inscription des clients
- Gestion des rôles : Admin, Caissier, Cuisinier, Serveur, Livreur, Magasinier

### 📅 Réservations
- Création de réservation par les clients
- Confirmation par le serveur
- Gestion des statuts (en attente, confirmée, terminée, annulée)

### 📝 Commandes
- Prise de commande avec panier
- Envoi automatique en cuisine
- Suivi des statuts (en attente, confirmée, en cours, prête, livrée, annulée)

### 💰 Caisse & Facturation
- Encaissement des commandes
- Impression PDF des factures
- Historique des paiements

### 📊 Rapports
- Chiffre d'affaires journalier / mensuel / annuel
- Impression des rapports

### 🍽️ Gestion des tables (Serveur)
- Occupation / Libération des tables
- Envoi des commandes en cuisine

### 🍳 Espace Cuisinier
- Visualisation des commandes reçues
- Validation des plats préparés

### 📦 Gestion des stocks (Magasinier)
- Ajout / Modification / Suppression d'ingrédients
- Mouvements de stock (entrées / sorties)
- Fiche de stock avec impression PDF
- Alertes de seuil minimum

### 🚚 Livraisons
- Suivi des livraisons
- Gestion des statuts (en attente, préparation, en route, livrée)

### 📋 Menu
- Consultation de la carte
- Ajout / Suppression de plats (Admin)

### 👥 Administration
- Gestion complète des utilisateurs
- Accès à toutes les fonctionnalités

---

## 🛠 Technologies utilisées

### Backend
| Technologie | Version | Utilisation |
|-------------|---------|-------------|
| Python | 3.12+ | Langage principal |
| FastAPI | 0.115+ | Framework API |
| MySQL | 8.0+ | Base de données |
| PyMySQL | 1.1+ | Connecteur MySQL |
| Pydantic | 2.10+ | Validation des données |
| JWT | 2.9+ | Authentification |
| Bcrypt | 4.2+ | Hachage des mots de passe |

### Frontend
| Technologie | Version | Utilisation |
|-------------|---------|-------------|
| React | 19.0+ | Framework UI |
| Vite | 6.0+ | Build tool |
| React Router DOM | 7.0+ | Navigation |
| Axios | 1.7+ | Requêtes HTTP |
| FontAwesome | 6.0+ | Icônes |

---

## 📋 Prérequis

- **Python 3.12 ou supérieur**
- **Node.js 20 ou supérieur**
- **MySQL 8.0 ou supérieur**
- **Git** (optionnel)

---

## 🔧 Installation

### 1. Cloner le projet

```bash
git clone https://github.com/votre-username/restomanager.git
cd restomanager

### 2. Installer le backend
bash
cd backend
python -m venv .venv

# Windows
.venv\Scripts\activate

# Linux / Mac
source .venv/bin/activate

pip install -r requirements.txt
### 3. Installer le frontend
bash
cd ../frontend
npm install
4. Configurer la base de données
sql
CREATE DATABASE resto_manager CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE resto_manager;
SOURCE chemin/vers/schema.sql;

⚙️ Configuration
Backend (.env)
Créez un fichier backend/.env :

env
# Base de données
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=votre_mot_de_passe
DB_NAME=resto_manager

# JWT
JWT_SECRET_KEY=votre_cle_secrete_au_moins_32_caracteres
JWT_ALGORITHM=HS256
JWT_EXPIRE_MINUTES=1440

# CORS
CORS_ORIGINS=http://localhost:5173,http://127.0.0.1:5173

# Application
APP_NAME=RestoManager
DEBUG=True
Frontend (.env)
Créez un fichier frontend/.env :

env
VITE_API_URL=http://localhost:8000
🚀 Démarrage
1. Démarrer le backend
bash
cd backend
.venv\Scripts\activate  # Windows
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
Le backend est accessible sur : http://localhost:8000
Documentation API : http://localhost:8000/docs

2. Démarrer le frontend
bash
cd frontend
npm run dev
L'application est accessible sur : http://localhost:5173


📁 Structure du projet
text
restomanager/
│
├── backend/
│   ├── app/
│   │   ├── auth/              # Authentification JWT
│   │   ├── database/          # Connexion MySQL
│   │   ├── routes/            # Endpoints API
│   │   │   ├── auth.py        # Login / Register / Me
│   │   │   ├── orders.py      # Gestion des commandes
│   │   │   ├── payments.py    # Paiements et factures
│   │   │   ├── reservations.py # Réservations
│   │   │   ├── stock.py       # Gestion des stocks
│   │   │   ├── serveur.py     # Tables et commandes serveur
│   │   │   ├── cuisine.py     # Commandes cuisine
│   │   │   ├── deliveries.py  # Livraisons
│   │   │   ├── products.py    # Menu
│   │   │   ├── reports.py     # Rapports
│   │   │   └── users.py       # Utilisateurs
│   │   ├── schemas/           # Modèles Pydantic
│   │   ├── services/          # Logique métier
│   │   └── utils/             # Fonctions utilitaires
│   ├── .env
│   └── requirements.txt
│
├── frontend/
│   ├── src/
│   │   ├── components/        # Composants réutilisables
│   │   │   ├── Common/        # DataTable, Modal, StatCard
│   │   │   └── Layout/        # Sidebar, Header
│   │   ├── pages/             # Pages de l'application
│   │   │   ├── Dashboard.jsx  # Tableau de bord
│   │   │   ├── Caisse.jsx     # Encaissement
│   │   │   ├── Commandes.jsx  # Gestion des commandes
│   │   │   ├── Reservations.jsx
│   │   │   ├── Stock.jsx
│   │   │   ├── Menu.jsx
│   │   │   ├── Factures.jsx
│   │   │   ├── Rapports.jsx
│   │   │   └── Utilisateurs.jsx
│   │   ├── services/          # Appels API
│   │   ├── contexts/          # AuthContext
│   │   └── routes/            # Configuration des routes
│   ├── .env
│   └── package.json
│
└── database/
    └── schema.sql
🔌 API Endpoints
Authentification
Méthode	Endpoint	Description
POST	/api/v1/auth/login	Connexion
POST	/api/v1/auth/register	Inscription client
GET	/api/v1/auth/me	Profil utilisateur
Commandes
Méthode	Endpoint	Description
GET	/api/v1/orders	Liste des commandes
POST	/api/v1/orders	Créer une commande
PATCH	/api/v1/orders/{id}/status	Modifier statut
Paiements
Méthode	Endpoint	Description
GET	/api/v1/payments	Liste des paiements
POST	/api/v1/payments	Créer un paiement
Réservations
Méthode	Endpoint	Description
GET	/api/v1/reservations	Liste des réservations
POST	/api/v1/reservations	Créer une réservation
PATCH	/api/v1/reservations/{id}/status	Modifier statut
Stock
Méthode	Endpoint	Description
GET	/api/v1/stock/ingredients	Liste des ingrédients
POST	/api/v1/stock/ingredients	Ajouter ingrédient
PUT	/api/v1/stock/ingredients/{id}	Modifier ingrédient
DELETE	/api/v1/stock/ingredients/{id}	Supprimer ingrédient
POST	/api/v1/stock/ingredients/{id}/adjust	Mouvement de stock
GET	/api/v1/stock/fiche-stock/{id}	Fiche de stock
Serveur
Méthode	Endpoint	Description
GET	/api/v1/serveur/tables	Liste des tables
PUT	/api/v1/serveur/table/{id}/occuper	Occuper table
PUT	/api/v1/serveur/table/{id}/liberer	Libérer table
POST	/api/v1/serveur/commande	Commande sur place
GET	/api/v1/serveur/mes-commandes	Commandes du serveur
Rapports
Méthode	Endpoint	Description
GET	/api/v1/reports/summary	Rapport CA (jour/mois/année)

🖨️ Fonctionnalités d'impression
L'application permet d'imprimer :

Factures (PDF) depuis la page Caisse

Rapports (PDF) depuis la page Rapports

Fiches de stock (PDF) depuis la page Stock

L'impression se fait automatiquement dans une nouvelle fenêtre avec mise en page optimisée.

🔐 Rôles et permissions
Rôle	Accès
admin	Toutes les fonctionnalités
caissier	Caisse, factures, rapports, commandes
cuisinier	Commandes cuisine, stock (lecture)
serveur	Tables, commandes, réservations
livreur	Livraisons
magasinier	Stock (CRUD complet)
client	Réservations, consultation menu, historique commandes
📝 Commandes utiles
Backend
bash
# Démarrer en développement
uvicorn app.main:app --reload

# Démarrer avec host spécifique
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Installer une dépendance
pip install nom_package
Frontend
bash
# Démarrer en développement
npm run dev

# Build pour production
npm run build

# Prévisualiser le build
npm run preview
🐛 Dépannage
Erreur 403 Forbidden
Vérifiez le rôle de l'utilisateur dans la base de données :

sql
UPDATE utilisateurs SET profil_utilisateur = 'admin' WHERE courriel = 'votre_email';
Erreur 500 Internal Server Error
Consultez les logs dans le terminal backend pour identifier l'erreur.

La base de données ne se connecte pas
Vérifiez les identifiants dans backend/.env et que MySQL est démarré.

###  Comptes de démonstration
Rôle	                  Email	                Mot de passe
Administrateur	    admin@resto.com             Password123!
Caissier	        caissier@resto.com	        Password123!
Cuisinier	        cuisinier@resto.com	        Password123!
Serveur	              serveur@resto.com	        Password123!
Livreur	              livreur@resto.com	        Password123!
Magasinier	            magasinier@resto.com	Password123!
Client	                client@resto.com	    Password123!
