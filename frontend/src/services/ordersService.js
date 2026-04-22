import api from './api';

export async function fetchOrders() {
  try {
    const { data } = await api.get('/api/v1/orders');
    return data;
  } catch (error) {
    console.error('Erreur lors du chargement des commandes:', error);
    if (error.response?.status === 403) {
      throw new Error('Vous n\'avez pas les droits pour voir les commandes');
    }
    throw error;
  }
}

export async function updateOrderStatus(orderId, etat_commande) {
  try {
    const { data } = await api.patch(`/api/v1/orders/${orderId}/status`, { etat_commande });
    return data;
  } catch (error) {
    console.error('Erreur lors de la mise à jour du statut:', error);
    if (error.response?.status === 403) {
      throw new Error('Vous n\'avez pas les droits pour modifier le statut');
    }
    throw error;
  }
}

// Optionnel : Ajouter une fonction pour créer une commande
export async function createOrder(orderData) {
  try {
    const { data } = await api.post('/api/v1/orders', orderData);
    return data;
  } catch (error) {
    console.error('Erreur lors de la création de la commande:', error);
    if (error.response?.status === 403) {
      throw new Error('Vous n\'avez pas les droits pour créer une commande');
    }
    throw error;
  }
}