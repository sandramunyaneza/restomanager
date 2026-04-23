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
        client: o.client_nom || `Client #${o.id_client}`,
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

  const updateQuantity = (productId, newQuantity) => {
    if (newQuantity <= 0) {
      setCartItems(cartItems.filter(item => item.id_produit !== productId));
    } else {
      setCartItems(cartItems.map(item =>
        item.id_produit === productId
          ? { ...item, quantite: newQuantity }
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
      remarques_commande: orderRemark || `Réservation #${selectedReservation.id}`
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

      {/* Modal de prise de commande - DESIGN AMÉLIORÉ */}
      {isOrderModalOpen && selectedReservation && (
        <div className="modal-overlay" onClick={() => setIsOrderModalOpen(false)}>
          <div className="modal-content" style={{ 
            maxWidth: 1000, 
            width: '90%', 
            maxHeight: '85vh',
            display: 'flex',
            flexDirection: 'column',
            padding: 0,
            overflow: 'hidden'
          }} onClick={e => e.stopPropagation()}>
            
            {/* En-tête */}
            <div className="modal-header" style={{
              padding: '20px 25px',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              borderRadius: '16px 16px 0 0'
            }}>
              <div>
                <h3 style={{ margin: 0, color: 'white' }}>
                  <i className="fas fa-clipboard-list"></i> Prise de commande
                </h3>
                <p style={{ margin: '5px 0 0', opacity: 0.9, fontSize: '13px' }}>
                  Réservation #{selectedReservation.id} - Client #{selectedReservation.id_utilisateur}
                </p>
              </div>
              <button 
                className="btn-secondary" 
                onClick={() => setIsOrderModalOpen(false)}
                style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white' }}
              >
                <i className="fas fa-times"></i>
              </button>
            </div>

            {/* Corps avec défilement */}
            <div style={{ 
              flex: 1, 
              overflowY: 'auto', 
              padding: '20px 25px',
              background: '#f8f9fa'
            }}>
              {/* Infos réservation */}
              <div style={{
                background: 'white',
                borderRadius: '12px',
                padding: '15px',
                marginBottom: '20px',
                display: 'flex',
                gap: '20px',
                flexWrap: 'wrap',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
              }}>
                <div><strong>👥 Personnes :</strong> {selectedReservation.nombre_convives}</div>
                <div><strong>📅 Date :</strong> {new Date(selectedReservation.horaire_reservation).toLocaleDateString()}</div>
                <div><strong>⏰ Heure :</strong> {new Date(selectedReservation.horaire_reservation).toLocaleTimeString().slice(0,5)}</div>
                <div><strong>🍽️ Table :</strong> {selectedReservation.designation_table || 'À définir'}</div>
              </div>

              {/* Menu et Panier - Disposition en colonnes */}
              <div style={{ display: 'flex', gap: '25px', flexWrap: 'wrap' }}>
                {/* Colonne Menu */}
                <div style={{ flex: 2, minWidth: '280px' }}>
                  <div style={{
                    background: 'white',
                    borderRadius: '12px',
                    overflow: 'hidden',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                  }}>
                    <div style={{
                      background: '#667eea',
                      color: 'white',
                      padding: '12px 15px',
                      fontWeight: 'bold'
                    }}>
                      <i className="fas fa-utensils"></i> Menu
                    </div>
                    <div style={{ maxHeight: '400px', overflowY: 'auto', padding: '10px' }}>
                      {products.length === 0 ? (
                        <p style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
                          <i className="fas fa-spinner fa-spin"></i> Chargement...
                        </p>
                      ) : (
                        products.map(product => (
                          <div key={product.id} style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            padding: '12px',
                            borderBottom: '1px solid #eee',
                            transition: 'background 0.2s'
                          }}>
                            <div style={{ flex: 1 }}>
                              <div style={{ fontWeight: 'bold' }}>{product.nom_produit}</div>
                              <div style={{ fontSize: '12px', color: '#666' }}>{product.prix_tarif}€</div>
                            </div>
                            <button
                              className="btn-primary"
                              onClick={() => addToCart(product)}
                              style={{
                                padding: '6px 15px',
                                fontSize: '13px',
                                background: '#28a745',
                                borderRadius: '20px'
                              }}
                            >
                              <i className="fas fa-plus"></i> Ajouter
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>

                {/* Colonne Panier */}
                <div style={{ flex: 1.2, minWidth: '260px' }}>
                  <div style={{
                    background: 'white',
                    borderRadius: '12px',
                    overflow: 'hidden',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                    position: 'sticky',
                    top: 0
                  }}>
                    <div style={{
                      background: '#28a745',
                      color: 'white',
                      padding: '12px 15px',
                      fontWeight: 'bold'
                    }}>
                      <i className="fas fa-shopping-cart"></i> Panier
                      {cartItems.length > 0 && (
                        <span style={{
                          background: 'white',
                          color: '#28a745',
                          padding: '2px 8px',
                          borderRadius: '20px',
                          marginLeft: '10px',
                          fontSize: '12px'
                        }}>
                          {cartItems.length} article(s)
                        </span>
                      )}
                    </div>
                    
                    <div style={{ maxHeight: '350px', overflowY: 'auto', padding: '10px' }}>
                      {cartItems.length === 0 ? (
                        <p style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
                          <i className="fas fa-shopping-basket"></i> Panier vide
                        </p>
                      ) : (
                        cartItems.map(item => (
                          <div key={item.id_produit} style={{
                            padding: '10px',
                            borderBottom: '1px solid #eee',
                            marginBottom: '5px'
                          }}>
                            <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>{item.nom_produit}</div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <div style={{ fontSize: '13px', color: '#666' }}>
                                {item.prix_unitaire}€ x {item.quantite}
                              </div>
                              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                <span style={{ fontWeight: 'bold' }}>{(item.prix_unitaire * item.quantite).toFixed(2)}€</span>
                                <div style={{ display: 'flex', gap: '5px' }}>
                                  <button
                                    className="btn-secondary"
                                    onClick={() => updateQuantity(item.id_produit, item.quantite - 1)}
                                    style={{ padding: '2px 8px', fontSize: '12px', background: '#dc3545' }}
                                  >
                                    -
                                  </button>
                                  <span style={{ minWidth: '25px', textAlign: 'center' }}>{item.quantite}</span>
                                  <button
                                    className="btn-secondary"
                                    onClick={() => updateQuantity(item.id_produit, item.quantite + 1)}
                                    style={{ padding: '2px 8px', fontSize: '12px', background: '#28a745' }}
                                  >
                                    +
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>

                    <div style={{
                      padding: '15px',
                      borderTop: '1px solid #eee',
                      background: '#f8f9fa'
                    }}>
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        fontSize: '18px',
                        fontWeight: 'bold',
                        marginBottom: '15px'
                      }}>
                        <span>Total :</span>
                        <span style={{ color: '#28a745' }}>{cartTotal.toFixed(2)}€</span>
                      </div>

                      <div style={{ marginBottom: '15px' }}>
                        <label style={{ display: 'block', fontSize: '13px', marginBottom: '5px', color: '#666' }}>
                          <i className="fas fa-comment"></i> Remarques
                        </label>
                        <textarea
                          value={orderRemark}
                          onChange={(e) => setOrderRemark(e.target.value)}
                          placeholder="Ex: Sans oignons, bien cuit..."
                          style={{
                            width: '100%',
                            padding: '10px',
                            borderRadius: '8px',
                            border: '1px solid #ddd',
                            fontSize: '13px',
                            resize: 'vertical'
                          }}
                          rows="2"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Pied de page avec boutons */}
            <div style={{
              padding: '15px 25px',
              background: 'white',
              borderTop: '1px solid #eee',
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '10px',
              borderRadius: '0 0 16px 16px'
            }}>
              <button
                className="btn-secondary"
                onClick={() => setIsOrderModalOpen(false)}
                style={{ padding: '10px 20px' }}
              >
                <i className="fas fa-times"></i> Annuler
              </button>
              <button
                className="btn-primary"
                onClick={validateOrder}
                disabled={cartItems.length === 0}
                style={{
                  padding: '10px 25px',
                  background: cartItems.length === 0 ? '#ccc' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                }}
              >
                <i className="fas fa-paper-plane"></i> Envoyer en cuisine
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Commandes;