import api from './api';

export async function fetchReservations(role) {
  const endpoint = role === 'client' ? '/api/v1/reservations/me' : '/api/v1/reservations';
  const { data } = await api.get(endpoint);
  return data;
}

export async function createReservation(payload) {
  const { data } = await api.post('/api/v1/reservations', payload);
  return data;
}

export async function updateReservationStatus(resId, etat_reservation) {
  const { data } = await api.patch(`/api/v1/reservations/${resId}/status`, { etat_reservation });
  return data;
}

export async function updateReservation(resId, payload) {
  const { data } = await api.patch(`/api/v1/reservations/${resId}`, payload);
  return data;
}

export async function deleteReservation(resId) {
  await api.delete(`/api/v1/reservations/${resId}`);
}

export async function fetchReservationStats() {
  const { data } = await api.get('/api/v1/reservations/stats');
  return data;
}

