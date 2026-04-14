export const mockData = {
  users: [
    { id: 1, nom: 'Jean Dupont', email: 'jean@email.com', telephone: '0612345678', role: 'client' },
    { id: 2, nom: 'Marie Martin', email: 'marie@email.com', telephone: '0623456789', role: 'serveur' },
    { id: 3, nom: 'Pierre Durand', email: 'pierre@email.com', telephone: '0634567890', role: 'cuisinier' },
    { id: 4, nom: 'Sophie Bernard', email: 'sophie@email.com', telephone: '0645678901', role: 'admin' },
    { id: 5, nom: 'Sophie Martin', email: 'sophie.martin@email.com', telephone: '0656789012', role: 'caissier' },
  ],
  commandes: [
    { id: 1, dateheure: '2026-04-13 12:30:00', client: 'Jean Dupont', montantTotal: 45.50, statutCommande: 'en cours', cuisinier: 'Pierre Durand', paye: false },
    { id: 2, dateheure: '2026-04-13 13:00:00', client: 'Alice Legrand', montantTotal: 32.00, statutCommande: 'prete', cuisinier: 'Pierre Durand', paye: false },
    { id: 3, dateheure: '2026-04-13 11:45:00', client: 'Robert Petit', montantTotal: 67.80, statutCommande: 'livree', cuisinier: 'Pierre Durand', paye: true },
    { id: 4, dateheure: '2026-04-13 14:30:00', client: 'Claire Fontaine', montantTotal: 89.90, statutCommande: 'livree', cuisinier: 'Pierre Durand', paye: false },
  ],
  reservations: [
    { id: 1, client: 'Jean Dupont', date: '2026-04-14', heure: '20:00', personnes: 4, table: 'T12', statut: 'confirmée' },
    { id: 2, client: 'Marie Curie', date: '2026-04-14', heure: '19:30', personnes: 2, table: 'T08', statut: 'en attente' },
  ],
  plats: [
    { id: 1, nom: 'Pizza Margherita', description: 'Sauce tomate, mozzarella, basilic', prix: 12.50, categorie: 'Plat principal' },
    { id: 2, nom: 'Salade César', description: 'Poulet, parmesan, croûtons', prix: 10.90, categorie: 'Entrée' },
    { id: 3, nom: 'Tiramisu', description: 'Café, mascarpone, cacao', prix: 6.50, categorie: 'Dessert' },
  ],
  stocks: [
    { id: 1, nomingredient: 'Tomates', quantite: 5, seuilMin: 10, statut: 'Alerte' },
    { id: 2, nomingredient: 'Mozzarella', quantite: 2, seuilMin: 5, statut: 'Alerte' },
    { id: 3, nomingredient: 'Farine', quantite: 25, seuilMin: 10, statut: 'OK' },
  ],
  livraisons: [
    { idCommande: 3, client: 'Robert Petit', adresse: '12 rue de Paris', livreur: 'Paul Livreur', statut: 'en cours' },
  ],
  factures: [
    { numero: 'F2026001', date: '2026-04-13', client: 'Jean Dupont', montantHT: 37.92, tva: 7.58, montantTTC: 45.50, paye: true, modePaiement: 'Carte bancaire' },
    { numero: 'F2026002', date: '2026-04-13', client: 'Robert Petit', montantHT: 56.50, tva: 11.30, montantTTC: 67.80, paye: true, modePaiement: 'Espèces' },
  ],
  paiements: [
    { id: 1, commandeId: 1, montant: 45.50, mode: 'Carte bancaire', date: '2026-04-13 12:35:00', statut: 'validé' },
    { id: 2, commandeId: 3, montant: 67.80, mode: 'Espèces', date: '2026-04-13 11:50:00', statut: 'validé' },
  ]
};