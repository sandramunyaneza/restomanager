/** Menus latéraux par rôle (chemins autorisés). */
export const ROLE_MENU = {
  admin: [
    { path: '/dashboard', icon: 'fa-chart-line', label: 'Dashboard' },
    { path: '/commandes', icon: 'fa-shopping-cart', label: 'Commandes' },
    { path: '/reservations', icon: 'fa-calendar-alt', label: 'Réservations' },
    { path: '/menu', icon: 'fa-utensils', label: 'Carte & Menu' },
    { path: '/stock', icon: 'fa-boxes', label: 'Gestion Stock' },
    { path: '/livraisons', icon: 'fa-truck', label: 'Livraisons' },
    { path: '/factures', icon: 'fa-file-invoice', label: 'Factures' },
    { path: '/rapports', icon: 'fa-chart-bar', label: 'Rapports' },
    { path: '/utilisateurs', icon: 'fa-users', label: 'Utilisateurs' },
    { path: '/caisse', icon: 'fa-cash-register', label: 'Caisse' },
  ],
  caissier: [
    { path: '/dashboard', icon: 'fa-chart-line', label: 'Dashboard' },
    { path: '/caisse', icon: 'fa-cash-register', label: 'Encaissement' },
    { path: '/factures', icon: 'fa-file-invoice', label: 'Factures' },
    { path: '/commandes', icon: 'fa-shopping-cart', label: 'Commandes' },
    { path: '/rapports', icon: 'fa-chart-bar', label: 'Rapports' },
  ],
  cuisinier: [
    { path: '/dashboard', icon: 'fa-chart-line', label: 'Dashboard' },
    { path: '/cuisine', icon: 'fa-fire', label: 'Cuisine' },
    { path: '/commandes', icon: 'fa-shopping-cart', label: 'File commandes' },
  ],
  serveur: [
    { path: '/dashboard', icon: 'fa-chart-line', label: 'Dashboard' },
    { path: '/serveur', icon: 'fa-concierge-bell', label: 'Salle' },
    { path: '/commandes', icon: 'fa-shopping-cart', label: 'Mes commandes' },
  ],
  livreur: [
    { path: '/dashboard', icon: 'fa-chart-line', label: 'Dashboard' },
    { path: '/livreur', icon: 'fa-motorcycle', label: 'Tournées' },
    { path: '/livraisons', icon: 'fa-truck', label: 'Livraisons' },
  ],
  magasinier: [
    { path: '/dashboard', icon: 'fa-chart-line', label: 'Dashboard' },
    { path: '/magasin', icon: 'fa-warehouse', label: 'Entrepôt' },
    { path: '/stock', icon: 'fa-boxes', label: 'Stock' },
  ],
  client: [
    { path: '/dashboard', icon: 'fa-chart-line', label: 'Accueil' },
    { path: '/client', icon: 'fa-user', label: 'Mon espace' },
    { path: '/commandes', icon: 'fa-shopping-cart', label: 'Mes commandes' },
    { path: '/reservations', icon: 'fa-calendar-alt', label: 'Mes réservations' },
    { path: '/menu', icon: 'fa-utensils', label: 'Carte' },
  ],
};

export function menuForRole(role) {
  return ROLE_MENU[role] || ROLE_MENU.client;
}
