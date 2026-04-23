import { useEffect, useState } from 'react';
import * as serveurService from '../../services/serveurService';
import * as reservationsService from '../../services/reservationsService';

export default function ServeurHome() {
  const [tables, setTables] = useState([]);
  const [commandes, setCommandes] = useState([]);
  const [produits, setProduits] = useState([]);
  const [selectedTable, setSelectedTable] = useState(null);
  const [cartItems, setCartItems] = useState([]);
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [orderType, setOrderType] = useState('cuisine');
  const [orderRemark, setOrderRemark] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showReservations, setShowReservations] = useState(false);
  const [reservations, setReservations] = useState([]);
  const [loadingReservations, setLoadingReservations] = useState(false);

  const refresh = async () => {
    try {
      const [t, c] = await Promise.all([
        serveurService.fetchTables(),
        serveurService.fetchMesCommandes()
      ]);
      setTables(t);
      setCommandes(c);
    } catch (err) {
      console.error('Erreur refresh:', err);
    }
  };

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, 10000);
    return () => clearInterval(interval);
  }, []);

  const loadProducts = async () => {
    try {
      const prods = await serveurService.fetchProduits();
      setProduits(prods);
    } catch (err) {
      console.error('Erreur chargement produits:', err);
    }
  };

  const loadReservations = async () => {
    setLoadingReservations(true);
    try {
      const data = await reservationsService.fetchReservations();
      setReservations(data);
      setShowReservations(true);
    } catch (err) {
      console.error('Erreur chargement réservations:', err);
      alert('Impossible de charger les réservations');
    } finally {
      setLoadingReservations(false);
    }
  };

  const handleTakeOrder = (table) => {
    setSelectedTable(table);
    setCartItems([]);
    setOrderType('cuisine');
    setOrderRemark('');
    setIsOrderModalOpen(true);
    loadProducts();
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
        prix_unitaire: parseFloat(product.prix_tarif),
        categorie: product.categorie_libelle
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

    setLoading(true);

    const payload = {
      table_id: selectedTable.id,
      articles: cartItems.map(item => ({
        id_produit: item.id_produit,
        quantite: item.quantite,
        prix_unitaire: item.prix_unitaire
      })),
      remarques_commande: orderRemark,
      serveur_type: orderType
    };

    try {
      await serveurService.createCommandeServeur(payload);
      alert(`✅ Commande pour la table ${selectedTable.numero_table} envoyée ${orderType === 'cuisine' ? 'en cuisine' : 'au bar'} !`);
      setIsOrderModalOpen(false);
      setCartItems([]);
      setSelectedTable(null);
      await refresh();
    } catch (err) {
      console.error('Erreur création commande:', err);
      alert(err.response?.data?.detail || '❌ Erreur lors de la création');
    } finally {
      setLoading(false);
    }
  };

  const handleOccuperTable = async (tableId) => {
    try {
      await serveurService.occuperTable(tableId);
      await refresh();
    } catch (err) {
      console.error('Erreur occupation:', err);
      alert('Impossible d\'occuper la table');
    }
  };

  const handleLibererTable = async (tableId) => {
    if (window.confirm('Libérer cette table ?')) {
      try {
        await serveurService.libererTable(tableId);
        await refresh();
      } catch (err) {
        console.error('Erreur libération:', err);
        alert('Impossible de libérer la table');
      }
    }
  };

  const handleEnvoyerCuisine = async (commandeId) => {
    try {
      await serveurService.envoyerCuisine(commandeId);
      await refresh();
      alert('✅ Commande envoyée en cuisine');
    } catch (err) {
      console.error('Erreur envoi cuisine:', err);
      alert('❌ Erreur lors de l\'envoi');
    }
  };

  const handleServirCommande = async (commande) => {
    try {
      await serveurService.servirCommande(commande.id);
      await refresh();
      alert(`✅ Commande #${commande.id} servie !`);
    } catch (err) {
      console.error('Erreur service:', err);
      alert('❌ Erreur lors du service');
    }
  };

  const cartTotal = cartItems.reduce((sum, item) => sum + (item.prix_unitaire * item.quantite), 0);

  const produitsParCategorie = produits.reduce((acc, p) => {
    const cat = p.categorie_libelle || 'Autres';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(p);
    return acc;
  }, {});

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h2>🧑‍🍳 Espace Serveur</h2>
        <button className="btn-primary" onClick={loadReservations}>
          <i className="fas fa-calendar-alt"></i> Voir les réservations
        </button>
      </div>
      {error && <p style={{ color: 'red' }}>{error}</p>}

      {showReservations && (
        <div style={{ marginBottom: 30 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 }}>
            <h3>📅 Liste des réservations</h3>
            <button className="btn-secondary" onClick={() => setShowReservations(false)}>
              <i className="fas fa-times"></i> Fermer
            </button>
          </div>
          
          {loadingReservations ? (
            <div className="data-table" style={{ padding: 40, textAlign: 'center' }}>
              <i className="fas fa-spinner fa-spin"></i> Chargement...
            </div>
          ) : reservations.length === 0 ? (
            <div className="data-table" style={{ padding: 40, textAlign: 'center', color: '#999' }}>
              <i className="fas fa-calendar-alt" style={{ fontSize: 48, marginBottom: 15, opacity: 0.3 }}></i>
              <p>Aucune réservation pour le moment</p>
            </div>
          ) : (
            <div className="data-table">
              <table style={{ width: '100%' }}>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Client</th>
                    <th>Date</th>
                    <th>Heure</th>
                    <th>Personnes</th>
                    <th>Table</th>
                    <th>Statut</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {reservations.map((r) => (
                    <tr key={r.id} style={{
                      background: r.etat_reservation === 'en_attente' ? '#fff3e0' : 
                                 r.etat_reservation === 'confirmee' ? '#e8f5e9' : 
                                 r.etat_reservation === 'terminee' ? '#e3f2fd' : '#ffebee'
                    }}>
                      <td>{r.id}</td>
                      <td>{r.client_nom || `Client #${r.id_utilisateur}`}</td>
                      <td>{new Date(r.horaire_reservation).toLocaleDateString()}</td>
                      <td>{new Date(r.horaire_reservation).toLocaleTimeString().slice(0, 5)}</td>
                      <td>{r.nombre_convives}</td>
                      <td>{r.designation_table || 'Non assignée'}</td>
                      <td>
                        <span style={{
                          background: r.etat_reservation === 'en_attente' ? '#ffc107' :
                                     r.etat_reservation === 'confirmee' ? '#28a745' :
                                     r.etat_reservation === 'terminee' ? '#17a2b8' : '#dc3545',
                          color: 'white',
                          padding: '4px 8px',
                          borderRadius: '20px',
                          fontSize: '12px'
                        }}>
                          {r.etat_reservation === 'en_attente' ? '⏳ En attente' :
                           r.etat_reservation === 'confirmee' ? '✅ Confirmée' :
                           r.etat_reservation === 'terminee' ? '📋 Terminée' : '❌ Annulée'}
                        </span>
                      </td>
                      <td>
                        {r.etat_reservation === 'en_attente' && (
                          <button 
                            className="btn-success" 
                            style={{ fontSize: 12, padding: '4px 10px', marginRight: 5 }}
                            onClick={async () => {
                              try {
                                await reservationsService.updateReservationStatus(r.id, 'confirmee');
                                loadReservations();
                                alert(`Réservation #${r.id} confirmée`);
                              } catch (err) {
                                alert('Erreur lors de la confirmation');
                              }
                            }}
                          >
                            Confirmer
                          </button>
                        )}
                        {r.etat_reservation === 'confirmee' && (
                          <button 
                            className="btn-primary" 
                            style={{ fontSize: 12, padding: '4px 10px', marginRight: 5 }}
                            onClick={async () => {
                              try {
                                await reservationsService.updateReservationStatus(r.id, 'terminee');
                                loadReservations();
                                alert(`Client arrivé pour la réservation #${r.id}`);
                              } catch (err) {
                                alert('Erreur');
                              }
                            }}
                          >
                            Client arrivé
                          </button>
                        )}
                        {r.etat_reservation !== 'annulee' && r.etat_reservation !== 'terminee' && (
                          <button 
                            className="btn-danger" 
                            style={{ fontSize: 12, padding: '4px 10px' }}
                            onClick={async () => {
                              if (window.confirm('Annuler cette réservation ?')) {
                                try {
                                  await reservationsService.updateReservationStatus(r.id, 'annulee');
                                  loadReservations();
                                  alert(`Réservation #${r.id} annulée`);
                                } catch (err) {
                                  alert('Erreur');
                                }
                              }
                            }}
                          >
                            Annuler
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      <h3>📊 Tables du restaurant</h3>
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', 
        gap: 15, 
        marginBottom: 30 
      }}>
        {tables.map((t) => (
          <div key={t.id} className="stat-card" style={{ 
            background: t.statut === 'libre' ? '#e8f5e9' : t.statut === 'occupee' ? '#fff3e0' : '#ffebee',
            borderLeft: `4px solid ${t.statut === 'libre' ? '#4caf50' : t.statut === 'occupee' ? '#ff9800' : '#f44336'}`,
            transition: 'transform 0.2s'
          }}>
            <div style={{ fontSize: 28, fontWeight: 'bold', marginBottom: 8 }}>Table {t.numero_table}</div>
            <div>👥 Capacité: {t.capacite} personnes</div>
            <div style={{ 
              color: t.statut === 'libre' ? '#4caf50' : t.statut === 'occupee' ? '#ff9800' : '#f44336',
              fontWeight: 'bold',
              margin: '10px 0',
              fontSize: 14
            }}>
              {t.statut === 'libre' ? '🟢 Libre' : t.statut === 'occupee' ? '🟠 Occupée' : '🔴 Réservée'}
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {t.statut === 'libre' && (
                <button 
                  className="btn-success" 
                  onClick={() => handleOccuperTable(t.id)} 
                  style={{ flex: 1, padding: '8px 12px', fontSize: 13 }}
                >
                  🪑 Occuper
                </button>
              )}
              {t.statut === 'occupee' && (
                <>
                  <button 
                    className="btn-primary" 
                    onClick={() => handleTakeOrder(t)} 
                    style={{ flex: 1, padding: '8px 12px', fontSize: 13 }}
                  >
                    📝 Commander
                  </button>
                  <button 
                    className="btn-danger" 
                    onClick={() => handleLibererTable(t.id)} 
                    style={{ flex: 1, padding: '8px 12px', fontSize: 13 }}
                  >
                    🧹 Libérer
                  </button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>

      <h3>📋 Commandes en cours</h3>
      {commandes.length === 0 ? (
        <div className="data-table" style={{ padding: '40px', textAlign: 'center', color: '#999' }}>
          Aucune commande en cours
        </div>
      ) : (
        <div className="data-table">
          <table style={{ width: '100%' }}>
            <thead>
              <tr>
                <th>#</th>
                <th>Table</th>
                <th>Type</th>
                <th>Statut</th>
                <th>Montant</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {commandes.map((c) => {
                const table = tables.find(t => t.id === c.table_id);
                return (
                  <tr key={c.id}>
                    <td>{c.id}</td>
                    <td><strong>Table {table?.numero_table || c.table_id}</strong></td>
                    <td>{c.statut_cuisine === 'boisson' ? '🥤 Boissons' : '🍽️ Nourriture'}</td>
                    <td>
                      {c.statut_cuisine === 'a_envoyer' && '⏳ En attente'}
                      {c.statut_cuisine === 'en_preparation' && '👨‍🍳 En cuisine'}
                      {c.statut_cuisine === 'boisson' && '🍹 En attente bar'}
                      {c.statut_cuisine === 'prete' && '✅ Prête à servir'}
                    </td>
                    <td>{Number(c.montant_total).toFixed(2)}€</td>
                    <td>
                      {c.statut_cuisine === 'a_envoyer' && (
                        <button className="btn-secondary" onClick={() => handleEnvoyerCuisine(c.id)} style={{ fontSize: 12 }}>
                          Envoyer cuisine
                        </button>
                      )}
                      {c.statut_cuisine === 'prete' && (
                        <button className="btn-success" onClick={() => handleServirCommande(c)} style={{ fontSize: 12 }}>
                          Servir
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {isOrderModalOpen && selectedTable && (
        <div className="modal-overlay" onClick={() => setIsOrderModalOpen(false)}>
          <div className="modal-content" style={{ maxWidth: 900, width: '90%' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>📝 Prise de commande - Table {selectedTable.numero_table}</h3>
              <button className="btn-secondary" onClick={() => setIsOrderModalOpen(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div style={{ marginBottom: 20, display: 'flex', gap: 20, padding: 10, background: '#f5f5f5', borderRadius: 8 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <input type="radio" value="cuisine" checked={orderType === 'cuisine'} onChange={(e) => setOrderType(e.target.value)} />
                  🍽️ Nourriture (Cuisine)
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <input type="radio" value="bar" checked={orderType === 'bar'} onChange={(e) => setOrderType(e.target.value)} />
                  🥤 Boissons (Bar)
                </label>
              </div>

              <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
                <div style={{ flex: 2 }}>
                  <h4>🍽️ Menu</h4>
                  <div style={{ maxHeight: 450, overflowY: 'auto', border: '1px solid #eee', borderRadius: 8, padding: 10 }}>
                    {Object.entries(produitsParCategorie).map(([categorie, items]) => {
                      const filteredItems = orderType === 'cuisine' 
                        ? items.filter(p => p.categorie_libelle !== 'Boissons')
                        : items.filter(p => p.categorie_libelle === 'Boissons');
                      
                      if (filteredItems.length === 0) return null;
                      
                      return (
                        <div key={categorie} style={{ marginBottom: 20 }}>
                          <h5 style={{ color: '#667eea', borderBottom: '1px solid #e0e0e0', paddingBottom: 5, marginBottom: 10 }}>{categorie}</h5>
                          {filteredItems.map(product => (
                            <div key={product.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px', borderBottom: '1px solid #f0f0f0' }}>
                              <div>
                                <strong>{product.nom_produit}</strong>
                                <br />
                                <small style={{ color: '#666' }}>{product.prix_tarif}€</small>
                              </div>
                              <button className="btn-secondary" style={{ padding: '5px 15px' }} onClick={() => addToCart(product)}>+</button>
                            </div>
                          ))}
                        </div>
                      );
                    })}
                    {produits.length === 0 && (
                      <p style={{ textAlign: 'center', padding: 20, color: '#999' }}>Chargement du menu...</p>
                    )}
                  </div>
                </div>

                <div style={{ flex: 1.2 }}>
                  <h4>🛒 Panier</h4>
                  <div style={{ maxHeight: 350, overflowY: 'auto', border: '1px solid #eee', borderRadius: 8, padding: 10, minHeight: 200 }}>
                    {cartItems.length === 0 ? (
                      <p style={{ textAlign: 'center', color: '#999', padding: 20 }}>Aucun article</p>
                    ) : (
                      cartItems.map(item => (
                        <div key={item.id_produit} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px', borderBottom: '1px solid #eee' }}>
                          <div style={{ flex: 2 }}>
                            <strong>{item.nom_produit}</strong>
                            <br />
                            <small>x{item.quantite}</small>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <div>{(item.prix_unitaire * item.quantite).toFixed(2)}€</div>
                            <button className="btn-danger" style={{ padding: '2px 10px', marginTop: 4 }} onClick={() => removeFromCart(item.id_produit)}>-</button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                  <div style={{ marginTop: 15, paddingTop: 15, borderTop: '2px solid #eee', fontWeight: 'bold', textAlign: 'right', fontSize: 18 }}>
                    Total: {cartTotal.toFixed(2)}€
                  </div>

                  <div style={{ marginTop: 15 }}>
                    <label>Remarques spéciales</label>
                    <textarea
                      value={orderRemark}
                      onChange={(e) => setOrderRemark(e.target.value)}
                      placeholder="Ex: Sans oignons, bien cuit, sans gluten..."
                      style={{ width: '100%', padding: 8, borderRadius: 4, border: '1px solid #ddd', marginTop: 5 }}
                      rows="2"
                    />
                  </div>
                </div>
              </div>

              <div style={{ marginTop: 20, display: 'flex', gap: 10 }}>
                <button className="btn-primary" onClick={validateOrder} disabled={loading || cartItems.length === 0}>
                  {loading ? 'Envoi en cours...' : '🚀 Envoyer la commande'}
                </button>
                <button className="btn-secondary" onClick={() => setIsOrderModalOpen(false)}>Annuler</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}