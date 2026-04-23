import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import DataTable from '../components/Common/DataTable';
import Modal from '../components/Common/Modal';
import * as ordersService from '../services/ordersService';
import * as reservationsService from '../services/reservationsService';
import * as productsService from '../services/productsService';

const Commandes = () => {
  const { user } = useAuth();
  const [commandes, setCommandes] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [selectedReservation, setSelectedReservation] = useState(null);
  const [cartItems, setCartItems] = useState([]);
  const [products, setProducts] = useState([]);
  const [orderRemark, setOrderRemark] = useState('');

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const [orders, resas, prods] = await Promise.all([
          ordersService.fetchOrders(),
          reservationsService.fetchReservations(),
          productsService.fetchProducts()
        ]);
        if (!alive) return;
        setCommandes(orders);
        setReservations(resas);
        setProducts(prods);
      } catch (error) {
        console.error('Erreur chargement:', error);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const reservationsTerminees = useMemo(() => {
    return reservations.filter(r => r.etat_reservation === 'terminee');
  }, [reservations]);

  const tableRows = useMemo(
    () =>
      commandes.map((o) => ({
        id: o.id,
        dateheure: o.cree_le,
        client: o.client_nom ? `Client #${o.id_client}` : '',
        montantTotal: Number(o.montant_total),
        statutCommande: o.etat_commande,
        paye: o.statut_reglement === 'payee',
      })),
    [commandes]
  );

  const handleTakeOrder = (reservation) => {
    setSelectedReservation(reservation);
    setCartItems([]);
    setOrderRemark('');
    setIsOrderModalOpen(true);
  };

  const addToCart = (product) => {
    const existing = cartItems.find(item => item.id_produit === product.id);
    if (existing) {
      setCartItems(cartItems.map(item => 
        item.id_produit === product.id 
          ? { ...item, quantite: item.quantite + 1 }
          : item
      ));
    } else {
      setCartItems([...cartItems, {
        id_produit: product.id,
        nom_produit: product.nom_produit,
        quantite: 1,
        prix_unitaire: parseFloat(product.prix_tarif)
      }]);
    }
  };

  const removeFromCart = (productId) => {
    const item = cartItems.find(item => item.id_produit === productId);
    if (item && item.quantite === 1) {
      setCartItems(cartItems.filter(item => item.id_produit !== productId));
    } else {
      setCartItems(cartItems.map(item =>
        item.id_produit === productId
          ? { ...item, quantite: item.quantite - 1 }
          : item
      ));
    }
  };

  const validateOrder = async () => {
    if (cartItems.length === 0) {
      alert('Ajoutez au moins un article');
      return;
    }
    
    const storedUser = localStorage.getItem('user');
    const currentUser = JSON.parse(storedUser);
    
    const payload = {
      id_client: selectedReservation.id_utilisateur,
      nature_commande: "sur_place",
      articles: cartItems.map(item => ({
        id_produit: item.id_produit,
        quantite: item.quantite,
        prix_unitaire: item.prix_unitaire
      })),
      remarques_commande: orderRemark || `Réservation #${selectedReservation.id} - Table: ${selectedReservation.designation_table || 'non spécifiée'}`
    };
    
    try {
      const order = await ordersService.createOrder(payload);
      alert(`Commande #${order.id} créée et envoyée en cuisine !`);
      setIsOrderModalOpen(false);
      setCartItems([]);
      setSelectedReservation(null);
      
      const [orders, resas] = await Promise.all([
        ordersService.fetchOrders(),
        reservationsService.fetchReservations()
      ]);
      setCommandes(orders);
      setReservations(resas);
    } catch (error) {
      console.error('Erreur création commande:', error);
      alert(error.response?.data?.detail || 'Erreur lors de la création');
    }
  };

  const cartTotal = cartItems.reduce((sum, item) => sum + (item.prix_unitaire * item.quantite), 0);

  const getColumns = () => {
    const baseColumns = [
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
    
    if (user?.role === 'admin' || user?.role === 'caissier') {
      baseColumns.push({ key: 'paye', label: 'Payé', render: (row) => row.paye ? '✅' : '❌' });
    }
    
    return baseColumns;
  };

  const handleDeleteCommande = (commande) => {
    if (window.confirm('Supprimer cette commande ?')) {
      setCommandes(commandes.filter((c) => c.id !== commande.id));
    }
  };

  const handleUpdateStatus = async (commande, newStatus) => {
    try {
      await ordersService.updateOrderStatus(commande.id, newStatus);
      const refreshed = await ordersService.fetchOrders();
      setCommandes(refreshed);
      alert(`Commande #${commande.id} : ${newStatus}`);
    } catch (error) {
      console.error('Erreur mise à jour statut:', error);
      alert('Erreur lors de la mise à jour');
    }
  };

  const getActions = () => {
    const actions = [];
    
    if (user?.role === 'admin') {
      actions.push({ label: 'Modifier', icon: 'fa-edit', className: 'btn-secondary', onClick: (row) => console.log('Modifier', row.id) });
      actions.push({ label: 'Supprimer', icon: 'fa-trash', className: 'btn-danger', onClick: handleDeleteCommande });
    }
    
    if (user?.role === 'cuisinier') {
      actions.push({
        label: 'Préparer',
        icon: 'fa-utensils',
        className: 'btn-secondary',
        onClick: (row) => handleUpdateStatus(row, 'prete')
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
  if (user?.role === 'serveur') {
      actions.push({
        label: 'Marquer livrée',
        icon: 'fa-check-circle',
        className: 'btn-success',
        onClick: (row) => handleUpdateStatus(row, 'livree')
    });
  }
    
    return actions;
  };

  const reservationColumns = [
    { key: 'id', label: 'ID Résa' },
    { key: 'client', label: 'Client' },
    { key: 'date', label: 'Date' },
    { key: 'heure', label: 'Heure' },
    { key: 'personnes', label: 'Personnes' },
    { key: 'table', label: 'Table' }
  ];

  const reservationRows = reservationsTerminees.map(r => ({
    id: r.id,
    client: `Client #${r.id_utilisateur}`,
    date: String(r.horaire_reservation).slice(0, 10),
    heure: String(r.horaire_reservation).slice(11, 16),
    personnes: r.nombre_convives,
    table: r.designation_table || 'À définir'
  }));

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
        <h2>Gestion des commandes</h2>
      </div>

      {user?.role === 'serveur' && reservationsTerminees.length > 0 && (
        <div style={{ marginBottom: '30px' }}>
          <h3 style={{ marginBottom: '15px', color: '#28a745' }}>
            🟢 Clients arrivés - Prendre commande
          </h3>
          <DataTable
            columns={reservationColumns}
            data={reservationRows}
            actions={[
              { 
                label: 'Prendre commande', 
                icon: 'fa-clipboard-list', 
                className: 'btn-primary', 
                onClick: (row) => {
                  const reservation = reservationsTerminees.find(r => r.id === row.id);
                  handleTakeOrder(reservation);
                }
              }
            ]}
          />
        </div>
      )}
      
      <h3 style={{ marginBottom: '15px' }}>📋 Commandes en cours</h3>
      <DataTable
        columns={getColumns()}
        data={tableRows}
        actions={getActions()}
      />

      <Modal 
        isOpen={isOrderModalOpen} 
        onClose={() => setIsOrderModalOpen(false)} 
        title={`Prendre commande - Réservation #${selectedReservation?.id}`}
      >
        <div style={{ marginBottom: '15px', padding: '10px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
          <p><strong>Client:</strong> Client #{selectedReservation?.id_utilisateur}</p>
          <p><strong>Table:</strong> {selectedReservation?.designation_table || 'À définir'}</p>
          <p><strong>Personnes:</strong> {selectedReservation?.nombre_convives}</p>
        </div>

        <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: '250px' }}>
            <h4>🍽️ Menu</h4>
            <div style={{ maxHeight: '400px', overflowY: 'auto', border: '1px solid #eee', borderRadius: '8px', padding: '10px' }}>
              {products.map(product => (
                <div key={product.id} style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  padding: '10px', 
                  borderBottom: '1px solid #eee' 
                }}>
                  <div>
                    <strong>{product.nom_produit}</strong>
                    <br />
                    <small>{product.prix_tarif}€</small>
                  </div>
                  <button className="btn-secondary" style={{ padding: '5px 15px' }} onClick={() => addToCart(product)}>
                    +
                  </button>
                </div>
              ))}
              {products.length === 0 && (
                <p style={{ textAlign: 'center', padding: '20px' }}>Aucun produit disponible</p>
              )}
            </div>
          </div>
          
          <div style={{ flex: 1, minWidth: '250px' }}>
            <h4>🛒 Panier</h4>
            <div style={{ maxHeight: '300px', overflowY: 'auto', border: '1px solid #eee', borderRadius: '8px', padding: '10px', minHeight: '200px' }}>
              {cartItems.length === 0 ? (
                <p style={{ textAlign: 'center', padding: '20px', color: '#999' }}>Aucun article</p>
              ) : (
                cartItems.map(item => (
                  <div key={item.id_produit} style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    padding: '10px', 
                    borderBottom: '1px solid #eee' 
                  }}>
                    <div>
                      <strong>{item.nom_produit}</strong>
                      <br />
                      <small>x{item.quantite}</small>
                    </div>
                    <div>
                      <span style={{ marginRight: '10px' }}>{(item.prix_unitaire * item.quantite).toFixed(2)}€</span>
                      <button className="btn-danger" style={{ padding: '2px 10px' }} onClick={() => removeFromCart(item.id_produit)}>
                        -
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
            <div style={{ marginTop: '15px', paddingTop: '15px', borderTop: '2px solid #ddd', fontWeight: 'bold', textAlign: 'right' }}>
              Total: {cartTotal.toFixed(2)}€
            </div>
          </div>
        </div>

        <div className="form-group" style={{ marginTop: '15px' }}>
          <label>Remarques spéciales (optionnel)</label>
          <textarea 
            value={orderRemark} 
            onChange={(e) => setOrderRemark(e.target.value)}
            placeholder="Ex: Sans oignons, bien cuit, etc."
            style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
            rows="2"
          />
        </div>
        
        <div style={{ marginTop: '20px', display: 'flex', gap: '10px' }}>
          <button className="btn-primary" onClick={validateOrder} disabled={cartItems.length === 0}>
            Envoyer en cuisine
          </button>
          <button className="btn-secondary" onClick={() => {
            setIsOrderModalOpen(false);
            setCartItems([]);
            setSelectedReservation(null);
          }}>
            Annuler
          </button>
        </div>
      </Modal>
    </div>
  );
};

export default Commandes;