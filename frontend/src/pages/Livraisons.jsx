import React, { useState } from 'react';
import { useAuth } from '../Context/AuthContext';
import DataTable from '../components/Common/DataTable';
import { mockData } from '../Data/mockData';

const Livraisons = () => {
  const { user } = useAuth();
  const [livraisons, setLivraisons] = useState(mockData.livraisons);

  const handleUpdateLivraison = (livraison) => {
    console.log('Mettre à jour livraison', livraison.idCommande);
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
        data={livraisons}
        actions={[
          { label: 'Mettre à jour', icon: 'fa-sync', className: 'btn-primary', onClick: handleUpdateLivraison }
        ]}
      />
    </div>
  );
};

export default Livraisons;