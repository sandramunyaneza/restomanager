import api from './api';

export async function fetchPayments() {
  const { data } = await api.get('/api/v1/payments');
  return data;
}

export async function createPayment(payload) {
  const { data } = await api.post('/api/v1/payments', payload);
  return data;
}

