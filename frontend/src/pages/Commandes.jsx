import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import DataTable from '../components/Common/DataTable';
import * as ordersService from '../services/ordersService';

const Commandes = () => {
  const { user } = useAuth();
  const [commandes, setCommandes] = useState([]);
  const [draftLines, setDraftLines] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const rows = await ordersService.fetchOrders(user?.role);
        if (!alive) return;
        setCommandes(rows);
        setDraftLines(ordersService.getDraftOrder());
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [user?.role]);

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

  const orderColumns = [
      { key: 'id', label: 'ID' },
      { key: 'dateheure', label: 'Date/Heure' },
      { key: 'client', label: 'Client' },
      { key: 'montantTotal', label: 'Montant' },
      { key: 'statutCommande', label: 'Statut' }
    ];

  const handleDeleteCommande = async (commande) => {
    if (window.confirm('Supprimer cette commande ?')) {
      await ordersService.deleteOrder(commande.id);
      setCommandes((prev) => prev.filter((c) => c.id !== commande.id));
    }
  };

  const handleValidateCommande = async (commande) => {
    await ordersService.updateOrderStatus(commande.id, 'confirmee');
    setCommandes((prev) =>
      prev.map((c) => (c.id === commande.id ? { ...c, etat_commande: 'confirmee' } : c))
    );
  };

  const getActions = () => {
    const actions = [];
    if (user?.role === 'admin' || user?.role === 'caissier' || user?.role === 'serveur') {
      actions.push({
        label: 'Modifier',
        icon: 'fa-edit',
        className: 'btn-secondary',
        onClick: (row) => ordersService.updateOrderStatus(row.id, 'en_cours').then(() => {
          setCommandes((prev) => prev.map((c) => (c.id === row.id ? { ...c, etat_commande: 'en_cours' } : c)));
        }),
      });
      actions.push({ label: 'Supprimer', icon: 'fa-trash', className: 'btn-danger', onClick: handleDeleteCommande });
      actions.push({ label: 'Valider', icon: 'fa-check', className: 'btn-primary', onClick: handleValidateCommande });
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

  const draftRows = useMemo(
    () =>
      draftLines.map((line) => ({
        id: line.id_produit,
        image: line.image_url ? (
          <img src={line.image_url} alt={line.nom_produit} style={{ width: 56, height: 56, objectFit: 'cover', borderRadius: 8 }} />
        ) : (
          'Aucune image'
        ),
        produit: line.nom_produit,
        quantite: line.quantite,
        prix: Number(line.prix_unitaire),
        total: Number(line.prix_unitaire) * Number(line.quantite),
      })),
    [draftLines]
  );

  const draftTotal = draftRows.reduce((sum, x) => sum + x.total, 0);

  const updateDraftQty = (row) => {
    const value = window.prompt('Nouvelle quantité', String(row.quantite));
    if (value === null) return;
    setDraftLines(ordersService.updateDraftLine(row.id, Number(value)));
  };

  const removeDraft = (row) => {
    setDraftLines(ordersService.removeDraftLine(row.id));
  };

  const submitDraftOrder = async () => {
    if (!draftLines.length) return;
    const payload = {
      type_commande: 'sur_place',
      articles: draftLines.map((x) => ({ id_produit: x.id_produit, quantite: x.quantite })),
    };
    await ordersService.createOrder(payload);
    ordersService.clearDraftOrder();
    setDraftLines([]);
    const rows = await ordersService.fetchOrders(user?.role);
    setCommandes(rows);
    window.alert('Commande validée et envoyée.');
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
        <h2>Gestion des commandes</h2>
      </div>

      {(user?.role === 'client' || user?.role === 'serveur') && (
        <div style={{ marginBottom: 24 }}>
          <h3>Commande du client (brouillon)</h3>
          <DataTable
            columns={[
              { key: 'image', label: 'Image' },
              { key: 'produit', label: 'Produit' },
              { key: 'quantite', label: 'Quantité' },
              { key: 'prix', label: 'PU' },
              { key: 'total', label: 'Total' },
            ]}
            data={draftRows}
            actions={[
              { label: 'Modifier', icon: 'fa-edit', className: 'btn-secondary', onClick: updateDraftQty },
              { label: 'Supprimer', icon: 'fa-trash', className: 'btn-danger', onClick: removeDraft },
              { label: 'Valider', icon: 'fa-check', className: 'btn-primary', onClick: submitDraftOrder },
            ]}
          />
          <p style={{ marginTop: 10, fontWeight: 600 }}>Montant brouillon: {draftTotal.toFixed(2)}</p>
          <button className="btn-primary" onClick={submitDraftOrder} disabled={!draftRows.length || loading}>
            Valider toute la commande
          </button>
        </div>
      )}
      
      <DataTable
        columns={orderColumns}
        data={tableRows}
        actions={getActions()}
      />
    </div>
  );
};

export default Commandes;