import api from './api';

export async function fetchReservations() {
  const { data } = await api.get('/api/v1/reservations');
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

