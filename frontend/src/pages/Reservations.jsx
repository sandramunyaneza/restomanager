import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import DataTable from '../components/Common/DataTable';
import Modal from '../components/Common/Modal';
import * as reservationsService from '../services/reservationsService';
import * as productsService from '../services/productsService';
import * as ordersService from '../services/ordersService';

const Reservations = () => {
  const { user } = useAuth();
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ date: '', heure: '', personnes: '2', table: '', remarques: '' });
  
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [selectedReservation, setSelectedReservation] = useState(null);
  const [cartItems, setCartItems] = useState([]);
  const [products, setProducts] = useState([]);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const rows = await reservationsService.fetchReservations();
        if (!alive) return;
        setReservations(rows);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const rows = await productsService.fetchProducts();
        setProducts(rows);
      } catch (error) {
        console.error('Erreur chargement produits:', error);
      }
    };
    fetchProducts();
  }, []);

  const tableRows = useMemo(
    () =>
      reservations.map((r) => ({
        id: r.id,
        client: r.id_utilisateur ? `Client #${r.id_utilisateur}` : '',
        date: String(r.horaire_reservation).slice(0, 10),
        heure: String(r.horaire_reservation).slice(11, 16),
        personnes: r.nombre_convives,
        table: r.designation_table,
        statut: r.etat_reservation,
      })),
    [reservations]
  );

  const handleAddReservation = async () => {
    const storedUser = localStorage.getItem('user');
    if (!storedUser) {
      alert('Vous devez être connecté pour faire une réservation');
      return;
    }
    
    if (!formData.date || !formData.heure) {
      alert('Veuillez remplir la date et l\'heure');
      return;
    }
    
    const horaire = `${formData.date} ${formData.heure}:00`;
    
    const payload = {
      horaire_reservation: horaire,
      nombre_convives: Number(formData.personnes || 1),
      designation_table: formData.table || null,
      remarques_client: formData.remarques || null,
    };
    
    try {
      const created = await reservationsService.createReservation(payload);
      setReservations((prev) => [created, ...prev]);
      setIsModalOpen(false);
      setFormData({ date: '', heure: '', personnes: '2', table: '', remarques: '' });
      alert('Réservation créée avec succès !');
    } catch (error) {
      console.error('Erreur création réservation:', error);
      if (error.response?.status === 403) {
        alert('Seuls les clients peuvent créer des réservations. Veuillez vous connecter avec un compte client.');
      } else if (error.response?.data?.detail) {
        alert(`Erreur: ${JSON.stringify(error.response.data.detail)}`);
      } else {
        alert('Erreur lors de la création de la réservation');
      }
    }
  };

  const handleDeleteReservation = (reservation) => {
    if (window.confirm('Annuler cette réservation ?')) {
      setReservations(reservations.filter((r) => r.id !== reservation.id));
    }
  };

  const handleConfirmReservation = async (reservation) => {
    try {
      await reservationsService.updateReservationStatus(reservation.id, 'confirmee');
      const rows = await reservationsService.fetchReservations();
      setReservations(rows);
      alert(`Réservation #${reservation.id} confirmée`);
    } catch (error) {
      console.error('Erreur confirmation:', error);
      alert(error.response?.data?.detail || 'Erreur lors de la confirmation');
    }
  };

  const handleMarkArrived = async (reservation) => {
    try {
      await reservationsService.updateReservationStatus(reservation.id, 'terminee');
      const rows = await reservationsService.fetchReservations();
      setReservations(rows);
      alert(`Client arrivé pour la réservation #${reservation.id}`);
    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur lors de la mise à jour');
    }
  };

  const handleTakeOrder = (reservation) => {
    setSelectedReservation(reservation);
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
      remarques_commande: `Réservation #${selectedReservation.id}`
    };
    
    try {
      const order = await ordersService.createOrder(payload);
      alert(`Commande #${order.id} créée avec succès !`);
      setIsOrderModalOpen(false);
      setCartItems([]);
      setSelectedReservation(null);
      await reservationsService.updateReservationStatus(selectedReservation.id, 'terminee');
      const rows = await reservationsService.fetchReservations();
      setReservations(rows);
    } catch (error) {
      console.error('Erreur création commande:', error);
      alert(error.response?.data?.detail || 'Erreur lors de la création');
    }
  };

  const getActionsForReservation = () => {
    const actions = [];
    
    if (user?.role === 'serveur' || user?.role === 'admin') {
      actions.push({ 
        label: 'Confirmer', 
        icon: 'fa-check-circle', 
        className: 'btn-success', 
        onClick: handleConfirmReservation 
      });
    }
    
    if (user?.role === 'serveur' || user?.role === 'admin') {
      actions.push({ 
        label: 'Prendre commande', 
        icon: 'fa-clipboard-list', 
        className: 'btn-primary', 
        onClick: handleTakeOrder 
      });
    }
    
    if (user?.role === 'serveur' || user?.role === 'admin') {
      actions.push({ 
        label: 'Client arrivé', 
        icon: 'fa-user-check', 
        className: 'btn-info', 
        onClick: handleMarkArrived 
      });
    }
    
    actions.push({ 
      label: 'Annuler', 
      icon: 'fa-trash', 
      className: 'btn-danger', 
      onClick: handleDeleteReservation 
    });
    
    return actions;
  };

  const cartTotal = cartItems.reduce((sum, item) => sum + (item.prix_unitaire * item.quantite), 0);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
        <h2>Gestion des réservations</h2>
        <button className="btn-primary" onClick={() => setIsModalOpen(true)}>
          <i className="fas fa-plus"></i> Nouvelle réservation
        </button>
      </div>
      
      <DataTable
        columns={[
          { key: 'id', label: 'ID' },
          { key: 'client', label: 'Client' },
          { key: 'date', label: 'Date' },
          { key: 'heure', label: 'Heure' },
          { key: 'personnes', label: 'Personnes' },
          { key: 'table', label: 'Table' },
          { 
            key: 'statut', 
            label: 'Statut',
            render: (row) => {
              const statusColors = {
                'en_attente': '#ffc107',
                'confirmee': '#28a745',
                'terminee': '#17a2b8',
                'annulee': '#dc3545'
              };
              const statusLabels = {
                'en_attente': '⏳ En attente',
                'confirmee': '✅ Confirmée',
                'terminee': '📋 Terminée',
                'annulee': '❌ Annulée'
              };
              return (
                <span style={{ 
                  backgroundColor: statusColors[row.statut] || '#6c757d',
                  color: 'white',
                  padding: '4px 8px',
                  borderRadius: '4px',
                  fontSize: '12px'
                }}>
                  {statusLabels[row.statut] || row.statut}
                </span>
              );
            }
          }
        ]}
        data={tableRows}
        actions={getActionsForReservation()}
      />

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Nouvelle réservation">
        <div className="form-group">
          <label>Date</label>
          <input type="date" value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} />
        </div>
        <div className="form-group">
          <label>Heure</label>
          <input type="time" value={formData.heure} onChange={(e) => setFormData({ ...formData, heure: e.target.value })} />
        </div>
        <div className="form-group">
          <label>Personnes</label>
          <input type="number" min="1" max="50" value={formData.personnes} onChange={(e) => setFormData({ ...formData, personnes: e.target.value })} />
        </div>
        <div className="form-group">
          <label>Table (optionnel)</label>
          <input type="text" value={formData.table} onChange={(e) => setFormData({ ...formData, table: e.target.value })} />
        </div>
        <div className="form-group">
          <label>Remarques (optionnel)</label>
          <textarea value={formData.remarques} onChange={(e) => setFormData({ ...formData, remarques: e.target.value })} />
        </div>
        <button className="btn-primary" onClick={handleAddReservation} disabled={loading}>
          Créer réservation
        </button>
      </Modal>

      <Modal isOpen={isOrderModalOpen} onClose={() => setIsOrderModalOpen(false)} title={`Commande - Réservation #${selectedReservation?.id}`}>
        <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: '250px' }}>
            <h4>Menu</h4>
            <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
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
            <h4>Panier</h4>
            {cartItems.length === 0 ? (
              <p style={{ textAlign: 'center', padding: '20px', color: '#999' }}>Aucun article</p>
            ) : (
              <>
                <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                  {cartItems.map(item => (
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
                  ))}
                </div>
                <div style={{ marginTop: '15px', paddingTop: '15px', borderTop: '2px solid #ddd', fontWeight: 'bold', textAlign: 'right' }}>
                  Total: {cartTotal.toFixed(2)}€
                </div>
              </>
            )}
          </div>
        </div>
        
        <div style={{ marginTop: '20px', display: 'flex', gap: '10px' }}>
          <button className="btn-primary" onClick={validateOrder} disabled={cartItems.length === 0}>
            Valider la commande
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

export default Reservations;