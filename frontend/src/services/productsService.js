import api from './api';

export async function fetchProducts(params = {}) {
  const { data } = await api.get('/api/v1/products', { params });
  return data;
}

export async function createProduct(payload) {
  const { data } = await api.post('/api/v1/products', payload);
  return data;
}

