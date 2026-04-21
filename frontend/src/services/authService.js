import api from './api';

export async function loginRequest(courriel, motDePasse) {
  const { data } = await api.post('/api/v1/auth/login', {
    courriel,
    mot_de_passe: motDePasse,
  });
  return data;
}

<<<<<<< HEAD
export async function clientLoginRequest(courriel, motDePasse) {
  const { data } = await api.post('/api/v1/client/login', {
    courriel,
    mot_de_passe: motDePasse,
  });
  return data;
}

=======
>>>>>>> c22961cdc564de1d53b8f1381e1d373448e90275
export async function registerRequest(payload) {
  const { data } = await api.post('/api/v1/auth/register', payload);
  return data;
}

<<<<<<< HEAD
export async function clientRegisterRequest(payload) {
  const { data } = await api.post('/api/v1/client/register', payload);
  return data;
}

=======
>>>>>>> c22961cdc564de1d53b8f1381e1d373448e90275
export async function fetchMe() {
  const { data } = await api.get('/api/v1/auth/me');
  return data;
}
