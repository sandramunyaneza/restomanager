import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import DataTable from '../components/Common/DataTable';
import Toast from '../components/Common/Toast';
import { useToast } from '../hooks/useToast';
import * as ordersService from '../services/ordersService';

const Commandes = () => {
  const { user } = useAuth();
  const { message: toastMessage, show: showToast } = useToast();
  const [commandes, setCommandes] = useState([]);
  const [draftLines, setDraftLines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  const refreshDraft = () => setDraftLines(ordersService.getDraftOrder());

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoadError('');
      try {
        const rows = await ordersService.fetchOrders(user?.role);
        if (!alive) return;
        setCommandes(Array.isArray(rows) ? rows : []);
      } catch (e) {
        if (!alive) return;
        setCommandes([]);
        const detail = e?.response?.data?.detail;
        setLoadError(
          typeof detail === 'string'
            ? detail
            : 'Impossible de charger vos commandes. Vérifiez la connexion et que le serveur API est démarré.'
        );
      } finally {
        refreshDraft();
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [user?.role, user?.id]);

  useEffect(() => {
    const onFocus = () => refreshDraft();
    const onVis = () => {
      if (document.visibilityState === 'visible') refreshDraft();
    };
    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onVis);
    return () => {
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onVis);
    };
  }, []);

  const tableRows = useMemo(
    () =>
      commandes.map((o) => ({
        id: o.id,
        dateheure: o.cree_le,
        client: o.nom_client || (o.id_client ? `Client #${o.id_client}` : ''),
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
      { 
        key: 'statutCommande', 
        label: 'Statut',
        render: (row) => {
          const statusColors = {
            'en_attente': '#ffc107',
            'confirmee': '#17a2b8',
            'en_cours': '#007bff',
            'prete': '#28a745',
            'livree': '#6c757d',
            'annulee': '#dc3545'
          };
          return (
            <span style={{ 
              backgroundColor: statusColors[row.statutCommande] || '#6c757d',
              color: 'white',
              padding: '4px 8px',
              borderRadius: '4px',
              fontSize: '12px'
            }}>
              {row.statutCommande}
            </span>
          );
        }
      }
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

  const handleUpdateStatus = async (commande, nextStatus) => {
    await ordersService.updateOrderStatus(commande.id, nextStatus);
    setCommandes((prev) =>
      prev.map((c) => (c.id === commande.id ? { ...c, etat_commande: nextStatus } : c))
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
    
    if (user?.role === 'serveur') {
      actions.push({
        label: 'Servir',
        icon: 'fa-hands-helping',
        className: 'btn-primary',
        onClick: (row) => handleUpdateStatus(row, 'livree')
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
    try {
      await ordersService.createOrder(payload);
      ordersService.clearDraftOrder();
      setDraftLines([]);
      const rows = await ordersService.fetchOrders(user?.role);
      setCommandes(Array.isArray(rows) ? rows : []);
      showToast('Commande ajoutée avec succès');
    } catch (e) {
      const detail = e?.response?.data?.detail;
      const msg =
        typeof detail === 'string'
          ? detail
          : e?.message || 'Échec de la création de la commande.';
      showToast(msg);
      window.alert(msg);
    }
  };

  return (
    <div>
      <Toast message={toastMessage} />
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
        <h2>Gestion des commandes</h2>
      </div>
      {loadError && (
        <p style={{ color: 'coral', marginBottom: 12 }} role="alert">
          {loadError}
        </p>
      )}

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
      
      <h3 style={{ marginBottom: '15px' }}>📋 Commandes en cours</h3>
      <DataTable
        columns={orderColumns}
        data={tableRows}
        actions={getActions()}
      />
    </div>
  );
};

export default Commandes;