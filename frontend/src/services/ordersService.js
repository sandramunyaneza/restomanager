import api from './api';

export async function fetchOrders() {
  const { data } = await api.get('/api/v1/orders');
  return data;
}

export async function updateOrderStatus(orderId, etat_commande) {
  const { data } = await api.patch(`/api/v1/orders/${orderId}/status`, { etat_commande });
  return data;
}
