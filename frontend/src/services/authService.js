import api from './api';

export async function loginRequest(courriel, motDePasse) {
  const { data } = await api.post('/api/v1/auth/login', {
    courriel,
    mot_de_passe: motDePasse,
  });
  return data;
}

export async function registerRequest(payload) {
  const { data } = await api.post('/api/v1/auth/register', payload);
  return data;
}

export async function fetchMe() {
  const { data } = await api.get('/api/v1/auth/me');
  return data;
}
