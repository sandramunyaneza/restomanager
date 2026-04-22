import api from './api';

const DRAFT_KEY = 'client_order_draft';

export function getDraftOrder() {
  const raw = localStorage.getItem(DRAFT_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveDraftOrder(lines) {
  localStorage.setItem(DRAFT_KEY, JSON.stringify(lines));
}

export function clearDraftOrder() {
  localStorage.removeItem(DRAFT_KEY);
}

export function addProductToDraft(product) {
  const current = getDraftOrder();
  const existing = current.find((x) => x.id_produit === product.id);
  let next;
  if (existing) {
    next = current.map((x) =>
      x.id_produit === product.id ? { ...x, quantite: x.quantite + 1 } : x
    );
  } else {
    next = [
      ...current,
      {
        id_produit: product.id,
        quantite: 1,
        nom_produit: product.nom_produit,
        image_url: product.image_url ?? '',
        prix_unitaire: Number(product.prix_tarif),
      },
    ];
  }
  saveDraftOrder(next);
  return next;
}

export function updateDraftLine(productId, quantite) {
  const next = getDraftOrder()
    .map((x) => (x.id_produit === productId ? { ...x, quantite: Math.max(1, Number(quantite) || 1) } : x))
    .filter((x) => x.quantite > 0);
  saveDraftOrder(next);
  return next;
}

export function removeDraftLine(productId) {
  const next = getDraftOrder().filter((x) => x.id_produit !== productId);
  saveDraftOrder(next);
  return next;
}

export async function fetchOrders(role) {
  const endpoint = role === 'client' ? '/api/v1/orders/me' : '/api/v1/orders';
  const { data } = await api.get(endpoint);
  return data;
}

export async function createOrder(payload) {
  const { data } = await api.post('/api/v1/orders', payload);
  return data;
}

export async function updateOrderStatus(orderId, etat_commande) {
  const { data } = await api.patch(`/api/v1/orders/${orderId}/status`, { etat_commande });
  return data;
}

export async function deleteOrder(orderId) {
  await api.delete(`/api/v1/orders/${orderId}`);
}
