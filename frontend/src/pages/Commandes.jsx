import { useState } from 'react';
import { useAuth } from '../Context/AuthContext';
import DataTable from '../components/Common/DataTable';
import Modal from '../components/Common/Modal';
import { mockData } from '../Data/mockData';

const Commandes = () => {
  const { user } = useAuth();
  const [commandes, setCommandes] = useState(mockData.commandes);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ client: '', montantTotal: '', statutCommande: 'en cours' });

  const getColumns = () => {
    const baseColumns = [
      { key: 'id', label: 'ID' },
      { key: 'dateheure', label: 'Date/Heure' },
      { key: 'client', label: 'Client' },
      { key: 'montantTotal', label: 'Montant' },
      { key: 'statutCommande', label: 'Statut' }
    ];
    
    if (user?.role === 'admin' || user?.role === 'serveur') {
      baseColumns.push({ key: 'cuisinier', label: 'Cuisinier' });
    }
    
    return baseColumns;
  };

  const handleAddCommande = () => {
    const newCommande = {
      id: commandes.length + 1,
      dateheure: new Date().toLocaleString(),
      ...formData,
      montantTotal: parseFloat(formData.montantTotal),
      cuisinier: 'À assigner'
    };
    setCommandes([...commandes, newCommande]);
    setIsModalOpen(false);
    setFormData({ client: '', montantTotal: '', statutCommande: 'en cours' });
  };

  const handleDeleteCommande = (commande) => {
    if (window.confirm('Supprimer cette commande ?')) {
      setCommandes(commandes.filter(c => c.id !== commande.id));
    }
  };

  const getActions = () => {
    const actions = [];
    if (user?.role === 'admin' || user?.role === 'serveur') {
      actions.push({ label: 'Modifier', icon: 'fa-edit', className: 'btn-secondary', onClick: (row) => console.log('Modifier', row.id) });
      actions.push({ label: 'Supprimer', icon: 'fa-trash', className: 'btn-danger', onClick: handleDeleteCommande });
    }
    if (user?.role === 'cuisinier') {
      actions.push({ label: 'Préparer', icon: 'fa-utensils', className: 'btn-secondary', onClick: (row) => {
        const updated = commandes.map(c => c.id === row.id ? { ...c, statutCommande: 'prete' } : c);
        setCommandes(updated);
      }});
    }
    return actions;
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
        <h2>Gestion des commandes</h2>
        {(user?.role === 'admin' || user?.role === 'serveur') && (
          <button className="btn-primary" onClick={() => setIsModalOpen(true)}>
            <i className="fas fa-plus"></i> Nouvelle commande
          </button>
        )}
      </div>
      
      <DataTable
        columns={getColumns()}
        data={commandes}
        actions={getActions()}
      />

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Nouvelle commande">
        <div className="form-group">
          <label>Client</label>
          <input type="text" value={formData.client} onChange={(e) => setFormData({ ...formData, client: e.target.value })} />
        </div>
        <div className="form-group">
          <label>Montant</label>
          <input type="number" value={formData.montantTotal} onChange={(e) => setFormData({ ...formData, montantTotal: e.target.value })} />
        </div>
        <div className="form-group">
          <label>Statut</label>
          <select value={formData.statutCommande} onChange={(e) => setFormData({ ...formData, statutCommande: e.target.value })}>
            <option>en cours</option>
            <option>prete</option>
            <option>livree</option>
          </select>
        </div>
        <button className="btn-primary" onClick={handleAddCommande}>Créer commande</button>
      </Modal>
    </div>
  );
};

export default Commandes;