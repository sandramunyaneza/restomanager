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

  const handleUpdateLivraison = (livraison) => {
    // Exemple de mise à jour : passer à "en_cours" si admin/livreur.
    (async () => {
      try {
        await deliveriesService.updateDelivery(livraison.id, { avancement_livraison: 'en_cours' });
        const refreshed = await deliveriesService.fetchDeliveries();
        setLivraisons(refreshed);
      } catch (e) {
        console.warn('Update livraison failed', e);
      }
    })();
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
          { key: 'statut', label: 'Statut' }
        ]}
        data={tableRows}
        actions={[
          { label: 'Mettre à jour', icon: 'fa-sync', className: 'btn-primary', onClick: handleUpdateLivraison }
        ]}
      />
    </div>
  );
};

export default Livraisons;