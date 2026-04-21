import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import DataTable from '../components/Common/DataTable';
import Modal from '../components/Common/Modal';
import * as ordersService from '../services/ordersService';

const Commandes = () => {
  const { user } = useAuth();
  const [commandes, setCommandes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ client: '', montantTotal: '', statutCommande: 'en cours' });

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const rows = await ordersService.fetchOrders();
        if (!alive) return;
        setCommandes(rows);
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
      commandes.map((o) => ({
        id: o.id,
        dateheure: o.cree_le,
        client: o.id_client ? `Client #${o.id_client}` : '',
        montantTotal: Number(o.montant_total),
        statutCommande: o.etat_commande,
        paye: o.statut_reglement === 'payee',
      })),
    [commandes]
  );

  const getColumns = () => {
    const baseColumns = [
      { key: 'id', label: 'ID' },
      { key: 'dateheure', label: 'Date/Heure' },
      { key: 'client', label: 'Client' },
      { key: 'montantTotal', label: 'Montant' },
      { key: 'statutCommande', label: 'Statut' }
    ];
    
    if (user?.role === 'admin' || user?.role === 'caissier') {
      // Non exposé directement par l’API à ce stade.
      baseColumns.push({ key: 'cuisinier', label: 'Cuisinier' });
    }
    
    return baseColumns;
  };

  const handleAddCommande = () => {
    // L’API de création de commande requiert des "articles" (produits, quantités).
    // On garde la création locale (démo) tant que l’UI n’a pas de panier.
    const newCommande = {
      id: Math.max(0, ...tableRows.map((c) => c.id)) + 1,
      dateheure: new Date().toISOString(),
      ...formData,
      montantTotal: parseFloat(formData.montantTotal),
      cuisinier: 'À assigner',
    };
    setCommandes((prev) => [
      {
        id: newCommande.id,
        id_client: 0,
        nature_commande: 'sur_place',
        etat_commande: newCommande.statutCommande,
        montant_total: newCommande.montantTotal,
        statut_reglement: newCommande.paye ? 'payee' : 'impayee',
        cree_le: newCommande.dateheure,
        remarques_commande: null,
      },
      ...prev,
    ]);
    setIsModalOpen(false);
    setFormData({ client: '', montantTotal: '', statutCommande: 'en cours' });
  };

  const handleDeleteCommande = (commande) => {
    if (window.confirm('Supprimer cette commande ?')) {
      // Endpoint DELETE non implémenté : suppression UI uniquement.
      setCommandes(commandes.filter((c) => c.id !== commande.id));
    }
  };

  const getActions = () => {
    const actions = [];
    if (user?.role === 'admin' || user?.role === 'caissier') {
      actions.push({ label: 'Modifier', icon: 'fa-edit', className: 'btn-secondary', onClick: (row) => console.log('Modifier', row.id) });
      actions.push({ label: 'Supprimer', icon: 'fa-trash', className: 'btn-danger', onClick: handleDeleteCommande });
    }
    if (user?.role === 'cuisinier') {
      actions.push({
        label: 'Préparer',
        icon: 'fa-utensils',
        className: 'btn-secondary',
        onClick: (row) => {
          (async () => {
            try {
              await ordersService.updateOrderStatus(row.id, 'prete');
              const refreshed = await ordersService.fetchOrders();
              setCommandes(refreshed);
            } catch {
              // fallback local
              const updated = commandes.map((c) => (c.id === row.id ? { ...c, etat_commande: 'prete' } : c));
              setCommandes(updated);
            }
          })();
        },
      });
    }
    return actions;
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
        <h2>Gestion des commandes</h2>
        {(user?.role === 'admin' || user?.role === 'caissier') && (
          <button className="btn-primary" onClick={() => setIsModalOpen(true)}>
            <i className="fas fa-plus"></i> Nouvelle commande
          </button>
        )}
      </div>
      
      <DataTable
        columns={getColumns()}
        data={tableRows}
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
        <button className="btn-primary" onClick={handleAddCommande} disabled={loading}>
          Créer commande (démo)
        </button>
      </Modal>
    </div>
  );
};

export default Commandes;