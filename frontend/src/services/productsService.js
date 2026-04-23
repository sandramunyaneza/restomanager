import api from './api';

export async function fetchProducts(params = {}) {
  const { data } = await api.get('/api/v1/products', { params });
  return data;
}

export async function fetchCategories() {
  const { data } = await api.get('/api/v1/products/categories');
  return data;
}

export async function createProduct(payload) {
  const { data } = await api.post('/api/v1/products', payload);
  return data;
}

export async function updateProduct(id, payload) {
  const { data } = await api.put(`/api/v1/products/${id}`, payload);
  return data;
}

export async function deleteProduct(id) {
  await api.delete(`/api/v1/products/${id}`);
}