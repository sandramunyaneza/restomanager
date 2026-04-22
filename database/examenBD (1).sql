CREATE DATABASE IF NOT EXISTS resto_manager
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;
  
USE resto_manager;

-- Comptes applicatifs (personnel + clients)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS utilisateurs (
  id                      BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  courriel                VARCHAR(255) NOT NULL,
  mot_de_passe_chiffre    VARCHAR(255) NOT NULL,
  nom_complet             VARCHAR(255) NOT NULL,
  numero_telephone        VARCHAR(32) NULL,

  profil_utilisateur ENUM(
    'client',
    'admin',
    'serveur',
    'caissier',
    'cuisinier',
    'livreur',
    'magasinier'
  ) NOT NULL DEFAULT 'client',

  compte_actif            TINYINT(1) NOT NULL DEFAULT 1,
  cree_le                 TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  modifie_le              TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
                          ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  UNIQUE KEY uq_utilisateurs_courriel (courriel),
  KEY idx_utilisateurs_profil (profil_utilisateur)

) ENGINE=InnoDB;
-- Menu
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS categories_menu (
  id           BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  libelle      VARCHAR(128) NOT NULL,
  ordre_tri    INT NOT NULL DEFAULT 0,
  PRIMARY KEY (id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS produits (
  id                     BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  id_categorie           BIGINT UNSIGNED NOT NULL,
  nom_produit            VARCHAR(255) NOT NULL,
  description_detaillee  TEXT NULL,
  prix_tarif             DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  est_disponible         TINYINT(1) NOT NULL DEFAULT 1,
  cree_le                TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  KEY fk_produits_categorie (id_categorie),

  CONSTRAINT fk_produits_categorie
    FOREIGN KEY (id_categorie)
    REFERENCES categories_menu(id)
    ON DELETE RESTRICT
    ON UPDATE CASCADE

) ENGINE=InnoDB;

ALTER TABLE produits
ADD image_url VARCHAR(512) NULL;

-- Tables restaurant
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS tables_restaurant (
  id             BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  numero_table   VARCHAR(32) NOT NULL,
  capacite       INT UNSIGNED NOT NULL DEFAULT 2,

  statut ENUM(
    'libre',
    'occupee',
    'reservee'
  ) NOT NULL DEFAULT 'libre',

  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  UNIQUE KEY uq_numero_table (numero_table)

) ENGINE=InnoDB;

-- Réservations
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS reservations (
  id                   BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  id_utilisateur       BIGINT UNSIGNED NOT NULL,
  horaire_reservation  DATETIME NOT NULL,
  nombre_convives      INT UNSIGNED NOT NULL DEFAULT 2,

  etat_reservation ENUM(
    'en_attente',
    'confirmee',
    'annulee',
    'terminee'
  ) NOT NULL DEFAULT 'en_attente',

  designation_table VARCHAR(32) NULL,
  remarques_client  VARCHAR(512) NULL,
  cree_le           TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  KEY fk_reservations_utilisateur (id_utilisateur),

  CONSTRAINT fk_reservations_utilisateur
    FOREIGN KEY (id_utilisateur)
    REFERENCES utilisateurs(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE

) ENGINE=InnoDB;

-- Commandes
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS commandes (
  id                    BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  id_client             BIGINT UNSIGNED NOT NULL,
  id_employe_creation   BIGINT UNSIGNED NULL,
  serveur_id            BIGINT UNSIGNED NULL,
  table_id              BIGINT UNSIGNED NULL,

  type_commande ENUM(
    'sur_place',
    'emporter',
    'livraison'
  ) NOT NULL DEFAULT 'sur_place',

  statut_cuisine ENUM(
    'a_envoyer',
    'envoyee',
    'en_preparation',
    'prete'
  ) NOT NULL DEFAULT 'a_envoyer',

  heure_envoi_cuisine DATETIME NULL,

  etat_commande ENUM(
    'en_attente',
    'confirmee',
    'en_cours',
    'prete',
    'livree',
    'annulee'
  ) NOT NULL DEFAULT 'en_attente',

  montant_total DECIMAL(10,2) NOT NULL DEFAULT 0.00,

  statut_reglement ENUM(
    'non_payee',
    'payee',
    'remboursee'
  ) NOT NULL DEFAULT 'non_payee',

  remarques_commande VARCHAR(512) NULL,

  cree_le    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  modifie_le TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
             ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (id),

  KEY fk_commandes_client (id_client),
  KEY fk_commandes_employe (id_employe_creation),
  KEY fk_commandes_serveur (serveur_id),
  KEY fk_commandes_table (table_id),

  CONSTRAINT fk_commandes_client
    FOREIGN KEY (id_client)
    REFERENCES utilisateurs(id)
    ON DELETE RESTRICT
    ON UPDATE CASCADE,

  CONSTRAINT fk_commandes_employe
    FOREIGN KEY (id_employe_creation)
    REFERENCES utilisateurs(id)
    ON DELETE SET NULL
    ON UPDATE CASCADE,

  CONSTRAINT fk_commandes_serveur
    FOREIGN KEY (serveur_id)
    REFERENCES utilisateurs(id)
    ON DELETE SET NULL
    ON UPDATE CASCADE,

  CONSTRAINT fk_commandes_table
    FOREIGN KEY (table_id)
    REFERENCES tables_restaurant(id)
    ON DELETE SET NULL
    ON UPDATE CASCADE

) ENGINE=InnoDB;

-- Historique statuts commandes
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS commande_statuts (
  id           BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  commande_id  BIGINT UNSIGNED NOT NULL,
  statut       VARCHAR(64) NOT NULL,
  changed_by   BIGINT UNSIGNED NULL,
  created_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (id),

  KEY idx_commande (commande_id),
  KEY idx_changed_by (changed_by),

  CONSTRAINT fk_commande_statuts_commande
    FOREIGN KEY (commande_id)
    REFERENCES commandes(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,

  CONSTRAINT fk_commande_statuts_user
    FOREIGN KEY (changed_by)
    REFERENCES utilisateurs(id)
    ON DELETE SET NULL
    ON UPDATE CASCADE

) ENGINE=InnoDB;

-- Lignes commande
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS lignes_commande (
  id                      BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  id_commande             BIGINT UNSIGNED NOT NULL,
  id_produit              BIGINT UNSIGNED NOT NULL,
  quantite_commandee      INT UNSIGNED NOT NULL DEFAULT 1,
  prix_unitaire_applique  DECIMAL(10,2) NOT NULL,

  PRIMARY KEY (id),

  KEY fk_ligne_commande (id_commande),
  KEY fk_ligne_produit (id_produit),

  CONSTRAINT fk_ligne_commande
    FOREIGN KEY (id_commande)
    REFERENCES commandes(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,

  CONSTRAINT fk_ligne_produit
    FOREIGN KEY (id_produit)
    REFERENCES produits(id)
    ON DELETE RESTRICT
    ON UPDATE CASCADE

) ENGINE=InnoDB;

-- Paiements
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS paiements (
  id                      BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  id_commande             BIGINT UNSIGNED NOT NULL,
  montant_verse           DECIMAL(10,2) NOT NULL,

  mode_reglement ENUM(
    'especes',
    'carte',
    'mobile_pay',
    'autre'
  ) NOT NULL DEFAULT 'carte',

  etat_transaction ENUM(
    'en_attente',
    'valide',
    'echoue',
    'rembourse'
  ) NOT NULL DEFAULT 'valide',

  id_employe_encaissement BIGINT UNSIGNED NULL,
  cree_le TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (id),

  KEY fk_paiement_commande (id_commande),
  KEY fk_paiement_employe (id_employe_encaissement),

  CONSTRAINT fk_paiement_commande
    FOREIGN KEY (id_commande)
    REFERENCES commandes(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,

  CONSTRAINT fk_paiement_employe
    FOREIGN KEY (id_employe_encaissement)
    REFERENCES utilisateurs(id)
    ON DELETE SET NULL
    ON UPDATE CASCADE

) ENGINE=InnoDB;

-- Livraisons
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS livraisons (
  id                 BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  id_commande        BIGINT UNSIGNED NOT NULL,
  id_employe_livreur BIGINT UNSIGNED NULL,
  adresse_livraison  VARCHAR(512) NOT NULL,

  avancement_livraison ENUM(
    'en_attente',
    'en_preparation',
    'en_route',
    'livree',
    'annulee'
  ) NOT NULL DEFAULT 'en_attente',

  horaire_prevu DATETIME NULL,
  modifie_le TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
             ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  UNIQUE KEY uq_livraison_commande (id_commande),

  KEY fk_livraison_livreur (id_employe_livreur),

  CONSTRAINT fk_livraison_commande
    FOREIGN KEY (id_commande)
    REFERENCES commandes(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,

  CONSTRAINT fk_livraison_livreur
    FOREIGN KEY (id_employe_livreur)
    REFERENCES utilisateurs(id)
    ON DELETE SET NULL
    ON UPDATE CASCADE

) ENGINE=InnoDB;

-- Stock
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS ingredients (
  id                    BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  libelle_ingredient    VARCHAR(255) NOT NULL,
  unite_mesure          VARCHAR(32) NOT NULL DEFAULT 'kg',
  quantite_en_stock     DECIMAL(12,3) NOT NULL DEFAULT 0,
  quantite_seuil_alerte DECIMAL(12,3) NOT NULL DEFAULT 0,
  modifie_le TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
             ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  UNIQUE KEY uq_ingredient (libelle_ingredient)

) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS mouvements_stock (
  id                        BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  id_ingredient             BIGINT UNSIGNED NOT NULL,
  variation_quantite        DECIMAL(12,3) NOT NULL,
  motif_mouvement           VARCHAR(255) NULL,
  type_reference_operation  VARCHAR(64) NULL,
  id_reference_operation    BIGINT UNSIGNED NULL,
  id_utilisateur_effectuant BIGINT UNSIGNED NULL,
  cree_le TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (id),

  KEY fk_mvt_ing (id_ingredient),
  KEY fk_mvt_user (id_utilisateur_effectuant),

  CONSTRAINT fk_mvt_ing
    FOREIGN KEY (id_ingredient)
    REFERENCES ingredients(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,

  CONSTRAINT fk_mvt_user
    FOREIGN KEY (id_utilisateur_effectuant)
    REFERENCES utilisateurs(id)
    ON DELETE SET NULL
    ON UPDATE CASCADE

) ENGINE=InnoDB;

-- Audit
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS journal_audit (
  id                    BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  id_utilisateur        BIGINT UNSIGNED NULL,
  libelle_action        VARCHAR(128) NOT NULL,
  type_objet_concerne   VARCHAR(64) NULL,
  id_objet_concerne     BIGINT UNSIGNED NULL,
  donnees_complementaires JSON NULL,
  cree_le TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  KEY fk_audit_user (id_utilisateur),

  CONSTRAINT fk_audit_user
    FOREIGN KEY (id_utilisateur)
    REFERENCES utilisateurs(id)
    ON DELETE SET NULL
    ON UPDATE CASCADE

) ENGINE=InnoDB;

-- INSERTS (inchangés comme demandé)
-- ---------------------------------------------------------------------------

UPDATE utilisateurs
SET mot_de_passe_chiffre = '$2b$12$sMkiSxqwc6RqCakgY93oiOCdaTVxjr0iewKegmLhPQSpdZ/NJZx7K',
    compte_actif = 1
WHERE courriel = 'admin@resto.com';

INSERT INTO utilisateurs
(courriel, mot_de_passe_chiffre, nom_complet, numero_telephone, profil_utilisateur, compte_actif)
VALUES
('admin@resto.com', '$2b$12$sMkiSxqwc6RqCakgY93oiOCdaTVxjr0iewKegmLhPQSpdZ/NJZx7K', 'Administrateur', '0972811353', 'admin', 1);

INSERT INTO utilisateurs
(courriel, mot_de_passe_chiffre, nom_complet, numero_telephone, profil_utilisateur, compte_actif)
VALUES
('caissier@resto.com', '$2b$12$sMkiSxqwc6RqCakgY93oiOCdaTVxjr0iewKegmLhPQSpdZ/NJZx7K', 'Caissier', '0970070056', 'caissier', 1),
('cuisinier@resto.com', '$2b$12$sMkiSxqwc6RqCakgY93oiOCdaTVxjr0iewKegmLhPQSpdZ/NJZx7K', 'Cuisinier', '0972341353', 'cuisinier', 1),
('livreur@resto.com', '$2b$12$sMkiSxqwc6RqCakgY93oiOCdaTVxjr0iewKegmLhPQSpdZ/NJZx7K', 'Livreur', '097281893', 'livreur', 1),
('magasinier@resto.com', '$2b$12$sMkiSxqwc6RqCakgY93oiOCdaTVxjr0iewKegmLhPQSpdZ/NJZx7K', 'Magasinier', '0990811353', 'magasinier', 1);
DELETE FROM utilisateurs
WHERE courriel IN (
  'caissier@resto.com',
  'cuisinier@resto.com',
  'livreur@resto.com',
  'magasinier@resto.com'
);