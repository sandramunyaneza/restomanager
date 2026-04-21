USE resto_manager;

-- Données de démonstration (après schema.sql). Mot de passe : Password123!

INSERT INTO utilisateurs (courriel, mot_de_passe_chiffre, nom_complet, numero_telephone, profil_utilisateur, compte_actif) VALUES
('admin@resto.com', '$2b$12$sMkiSxqwc6RqCakgY93oiOCdaTVxjr0iewKegmLhPQSpdZ/NJZx7K', 'Administrateur', '0972811353', 'admin', 1),
('client@resto.com', '$2b$12$K09C/JiJTjK.OSf0gbSNNu7cn41vVuhz.spNSquAq6gjViV8oHnj2', 'Jean Dupont', '0600000002', 'client', 1),
('caissier@resto.com', '$2b$12$K09C/JiJTjK.OSf0gbSNNu7cn41vVuhz.spNSquAq6gjViV8oHnj2', 'Marie Caisse', '0600000003', 'caissier', 1),
('cuisinier@resto.com', '$2b$12$K09C/JiJTjK.OSf0gbSNNu7cn41vVuhz.spNSquAq6gjViV8oHnj2', 'Pierre Cuisine', '0600000004', 'cuisinier', 1),
('livreur@resto.com', '$2b$12$K09C/JiJTjK.OSf0gbSNNu7cn41vVuhz.spNSquAq6gjViV8oHnj2', 'Paul Livreur', '0600000005', 'livreur', 1),
<<<<<<< HEAD
('magasinier@resto.com', '$2b$12$K09C/JiJTjK.OSf0gbSNNu7cn41vVuhz.spNSquAq6gjViV8oHnj2', 'Sophie Stock', '0600000006', 'magasinier', 1),
('serveur@resto.com', '$2b$12$K09C/JiJTjK.OSf0gbSNNu7cn41vVuhz.spNSquAq6gjViV8oHnj2', 'Samuel Salle', '0600000007', 'serveur', 1);
=======
('magasinier@resto.com', '$2b$12$K09C/JiJTjK.OSf0gbSNNu7cn41vVuhz.spNSquAq6gjViV8oHnj2', 'Sophie Stock', '0600000006', 'magasinier', 1);
>>>>>>> c22961cdc564de1d53b8f1381e1d373448e90275

INSERT INTO categories_menu (libelle, ordre_tri) VALUES
('Entrées', 1),
('Plats', 2),
('Desserts', 3);

INSERT INTO produits (id_categorie, nom_produit, description_detaillee, prix_tarif, est_disponible) VALUES
(1, 'Salade César', 'Poulet, parmesan', 10.90, 1),
(2, 'Pizza Margherita', 'Tomate, mozzarella', 12.50, 1),
(3, 'Tiramisu', 'Mascarpone, café', 6.50, 1);

INSERT INTO ingredients (libelle_ingredient, unite_mesure, quantite_en_stock, quantite_seuil_alerte) VALUES
('Tomates', 'kg', 5.000, 10.000),
('Mozzarella', 'kg', 2.000, 5.000),
('Farine', 'kg', 25.000, 10.000);

<<<<<<< HEAD
INSERT INTO tables_restaurant (numero_table, capacite, statut) VALUES
('T1', 2, 'libre'),
('T2', 4, 'occupee'),
('T3', 6, 'libre');

=======
>>>>>>> c22961cdc564de1d53b8f1381e1d373448e90275
-- id_utilisateur 2 = client@resto.com
INSERT INTO reservations (id_utilisateur, horaire_reservation, nombre_convives, etat_reservation, designation_table) VALUES
(2, DATE_ADD(NOW(), INTERVAL 1 DAY), 4, 'confirmee', 'T12');

<<<<<<< HEAD
INSERT INTO commandes (
  id_client, id_employe_creation, serveur_id, table_id, type_commande, nature_commande,
  statut_cuisine, heure_envoi_cuisine, etat_commande, montant_total, statut_reglement, remarques_commande
) VALUES
(2, 3, NULL, NULL, 'livraison', 'livraison', 'en_preparation', NOW(), 'en_cours', 45.50, 'non_payee', 'Exemple livraison');
=======
INSERT INTO commandes (id_client, nature_commande, etat_commande, montant_total, statut_reglement, remarques_commande) VALUES
(2, 'livraison', 'en_cours', 45.50, 'non_payee', 'Exemple livraison');
>>>>>>> c22961cdc564de1d53b8f1381e1d373448e90275

SET @oid := LAST_INSERT_ID();

INSERT INTO lignes_commande (id_commande, id_produit, quantite_commandee, prix_unitaire_applique) VALUES
(@oid, 1, 1, 10.90),
(@oid, 2, 1, 12.50);

INSERT INTO livraisons (id_commande, id_employe_livreur, adresse_livraison, avancement_livraison) VALUES
(@oid, 5, '12 rue de Paris, Paris', 'en_attente');
