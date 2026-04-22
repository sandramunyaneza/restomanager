import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import DataTable from '../components/Common/DataTable';
import * as deliveriesService from '../services/deliveriesService';

const Livraisons = () => {
  const { user } = useAuth();
  const [livraisons, setLivraisons] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const rows = await deliveriesService.fetchDeliveries();
        if (!alive) return;
        setLivraisons(rows);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const tableRows = useMemo(
    () =>
      livraisons.map((l) => ({
        id: l.id,
        idCommande: l.id_commande,
        client: l.id_commande ? `Commande #${l.id_commande}` : '',
        adresse: l.adresse_livraison,
        livreur: l.id_employe_livreur ? `Livreur #${l.id_employe_livreur}` : 'Non assigné',
        statut: l.avancement_livraison,
      })),
    [livraisons]
  );

  const handleUpdateLivraison = (livraison, newStatus = null) => {
  (async () => {
    try {
      // Définir le prochain statut selon le statut actuel
      let nextStatus = newStatus;
      if (!nextStatus) {
        const statusFlow = {
          'en_attente': 'en_preparation',
          'en_preparation': 'en_route',
          'en_route': 'livree',
        };
        nextStatus = statusFlow[livraison.avancement_livraison] || 'livree';
      }
      
      // Vérifier que le statut est valide
      const validStatuses = ['en_attente', 'en_preparation', 'en_route', 'livree', 'annulee'];
      if (!validStatuses.includes(nextStatus)) {
        console.error('Statut invalide:', nextStatus);
        return;
      }
      
      await deliveriesService.updateDelivery(livraison.id, { avancement_livraison: nextStatus });
      const refreshed = await deliveriesService.fetchDeliveries();
      setLivraisons(refreshed);
    } catch (e) {
      console.warn('Update livraison failed', e);
      alert('Erreur lors de la mise à jour de la livraison');
    }
  })();
};

const getActionsForLivraison = (livraison) => {
  const actions = [];
  
  if (livraison.avancement_livraison === 'en_attente') {
    actions.push({ 
      label: 'Préparer', 
      icon: 'fa-box', 
      className: 'btn-secondary',
      onClick: () => handleUpdateLivraison(livraison, 'en_preparation')
    });
  }
  if (livraison.avancement_livraison === 'en_preparation') {
    actions.push({ 
      label: 'Envoyer en route', 
      icon: 'fa-truck', 
      className: 'btn-primary',
      onClick: () => handleUpdateLivraison(livraison, 'en_route')
    });
  }
  if (livraison.avancement_livraison === 'en_route') {
    actions.push({ 
      label: 'Marquer livrée', 
      icon: 'fa-check-circle', 
      className: 'btn-success',
      onClick: () => handleUpdateLivraison(livraison, 'livree')
    });
  }
  
  return actions;
};

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
        <h2>Suivi des livraisons</h2>
        {user?.role === 'admin' && (
          <button className="btn-primary" onClick={() => console.log('Assigner livreur')}>
            <i className="fas fa-user-plus"></i> Assigner livreur
          </button>
        )}
      </div>
      
      <DataTable
        columns={[
          { key: 'idCommande', label: 'ID Commande' },
          { key: 'client', label: 'Client' },
          { key: 'adresse', label: 'Adresse' },
          { key: 'livreur', label: 'Livreur' },
          { 
            key: 'statut', 
            label: 'Statut',
            render: (row) => {
              const statusLabels = {
                'en_attente': '⏳ En attente',
                'en_preparation': '📦 En préparation',
                'en_route': '🚚 En route',
                'livree': '✅ Livrée',
                'annulee': '❌ Annulée'
              };
              return statusLabels[row.statut] || row.statut;
            }
          }
        ]}
        data={tableRows}
        actions={getActionsForLivraison}
      />
    </div>
  );
};

export default Livraisons;