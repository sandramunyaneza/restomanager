import api from './api';

export async function fetchIngredients() {
  const { data } = await api.get('/api/v1/stock/ingredients');
  return data;
}

export async function createIngredient(payload) {
  const { data } = await api.post('/api/v1/stock/ingredients', payload);
  return data;
}

export async function updateIngredient(id, payload) {
  const { data } = await api.put(`/api/v1/stock/ingredients/${id}`, payload);
  return data;
}

export async function deleteIngredient(id) {
  await api.delete(`/api/v1/stock/ingredients/${id}`);
}

export async function adjustIngredientStock(ingredientId, payload) {
  const { data } = await api.post(`/api/v1/stock/ingredients/${ingredientId}/adjust`, payload);
  return data;
}

export async function fetchMouvements(ingredientId, startDate, endDate) {
  const { data } = await api.get(`/api/v1/stock/mouvements/${ingredientId}`, {
    params: { start_date: startDate, end_date: endDate }
  });
  return data;
}

export async function getFicheStock(ingredientId, startDate, endDate) {
  const { data } = await api.get(`/api/v1/stock/fiche-stock/${ingredientId}`, {
    params: { start_date: startDate, end_date: endDate }
  });
  return data;
}