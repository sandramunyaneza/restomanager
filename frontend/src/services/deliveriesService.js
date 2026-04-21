import api from './api';

export async function fetchDeliveries() {
  const { data } = await api.get('/api/v1/deliveries');
  return data;
}

export async function updateDelivery(deliveryId, payload) {
  const { data } = await api.patch(`/api/v1/deliveries/${deliveryId}`, payload);
  return data;
}

