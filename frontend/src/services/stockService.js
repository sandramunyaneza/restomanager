import api from './api';

export async function fetchIngredients() {
  const { data } = await api.get('/api/v1/stock/ingredients');
  return data;
}

export async function adjustIngredientStock(ingredientId, payload) {
  const { data } = await api.post(`/api/v1/stock/ingredients/${ingredientId}/adjust`, payload);
  return data;
}

