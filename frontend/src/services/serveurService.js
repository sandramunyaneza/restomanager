import api from './api';

export async function fetchTables() {
  const { data } = await api.get('/api/v1/serveur/tables');
  return data;
}

export async function fetchMesCommandes() {
  const { data } = await api.get('/api/v1/serveur/mes-commandes');
  return data;
}

export async function createCommandeServeur(payload) {
  const { data } = await api.post('/api/v1/serveur/commande', payload);
  return data;
}

export async function envoyerCuisine(orderId) {
  const { data } = await api.put(`/api/v1/serveur/commande/${orderId}/envoyer-cuisine`);
  return data;
}

export async function occuperTable(tableId) {
  const { data } = await api.put(`/api/v1/serveur/table/${tableId}/occuper`);
  return data;
}

export async function libererTable(tableId) {
  const { data } = await api.put(`/api/v1/serveur/table/${tableId}/liberer`);
  return data;
}

export async function fetchProduits() {
  const { data } = await api.get('/api/v1/serveur/produits');
  return data;
}

export async function servirCommande(orderId) {
  const { data } = await api.put(`/api/v1/orders/${orderId}/status`, { etat_commande: 'livree' });
  return data;
}