import api from './api';

export async function fetchUsers() {
  const { data } = await api.get('/api/v1/users');
  return data;
}

export async function createUser(payload) {
  const { data } = await api.post('/api/v1/users', payload);
  return data;
}

