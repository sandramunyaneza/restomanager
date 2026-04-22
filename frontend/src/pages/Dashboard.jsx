import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import StatCard from '../components/Common/StatCard';
import DataTable from '../components/Common/DataTable';
import * as ordersService from '../services/ordersService';
import * as reportsService from '../services/reportsService';
import * as reservationsService from '../services/reservationsService';
import * as deliveriesService from '../services/deliveriesService';
import * as stockService from '../services/stockService';
import * as paymentsService from '../services/paymentsService';

function mapApiOrder(o, userNameById = {}) {
  return {
    id: o.id,
    dateheure: o.cree_le,
    client: userNameById[o.id_client] || `Client #${o.id_client}`,
    montantTotal: Number(o.montant_total),
    statutCommande: o.etat_commande,
    paye: o.statut_reglement === 'payee',
  };
}

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({});
  const [rows, setRows] = useState(null);
  const [stockRows, setStockRows] = useState([]);
  const [recentPayments, setRecentPayments] = useState([]);

  const loadData = async () => {
    try {
      const [orders, reservations, deliveries, ingredients] = await Promise.all([
        ordersService.fetchOrders(),
        reservationsService.fetchReservations().catch(() => []),
        deliveriesService.fetchDeliveries().catch(() => []),
        stockService.fetchIngredients().catch(() => []),
      ]);
      
      const today = new Date().toISOString().slice(0, 10);
      let report = null;
      try {
        report = await reportsService.fetchReportSummary('day', today);
      } catch {
      }
      
      let payments = [];
      try {
        payments = await paymentsService.fetchPayments();
      } catch {
      }
      
      const mapped = orders.map((o) => mapApiOrder(o));
      setRows(mapped);
      setStockRows(ingredients);
      setRecentPayments(payments.slice(0, 5));
      
      const ca = report ? Number(report.chiffre_affaires) : mapped.reduce((s, r) => s + r.montantTotal, 0);
      setStats({
        commandes: mapped.length,
        reservations: reservations.length,
        ca,
        livraisons: deliveries.length,
        commandesPayees: mapped.filter((m) => m.paye).length,
        totalEncaissement: mapped.filter((m) => m.paye).reduce((s, m) => s + m.montantTotal, 0),
      });
    } catch {
      setRows([]);
      setStockRows([]);
      setRecentPayments([]);
      setStats({ commandes: 0, reservations: 0, ca: 0, livraisons: 0, commandesPayees: 0, totalEncaissement: 0 });
    }
  };

  useEffect(() => {
    let cancelled = false;
    
    const fetchData = async () => {
      if (!cancelled) {
        await loadData();
      }
    };
    
    fetchData();
    
    const interval = setInterval(() => {
      if (!cancelled && user?.role === 'serveur') {
        loadData();
      }
    }, 5000);
    
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [user?.role]);

  const handleServeOrder = async (order) => {
    try {
      await ordersService.updateOrderStatus(order.id, 'livree');
      await loadData();
      alert(`Commande #${order.id} servie avec succès !`);
    } catch (error) {
      console.error('Erreur service:', error);
      alert('Erreur lors du service');
    }
  };

  const commandes = rows ?? [];

  const getDashboardContent = () => {
    switch (user?.role) {
      case 'admin':
        return (
          <>
            <div className="stats-grid">
              <StatCard icon="fa-shopping-cart" iconColor="#667eea" value={stats.commandes} label="Commandes" />
              <StatCard icon="fa-calendar-check" iconColor="#1e7e34" value={stats.reservations} label="Réservations" />
              <StatCard icon="fa-truck" iconColor="#d4a000" value={stats.livraisons} label="Livraisons" />
              <StatCard icon="fa-chart-line" iconColor="#d63031" value={`${stats.ca}€`} label="Chiffre d'affaires" />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '25px' }}>
              <DataTable
                columns={[
                  { key: 'id', label: '#' },
                  { key: 'client', label: 'Client' },
                  { key: 'montantTotal', label: 'Montant' },
                  { key: 'statutCommande', label: 'Statut' },
                ]}
                data={commandes.slice(0, 5)}
              />
              <DataTable
                columns={[
                  { key: 'nomingredient', label: 'Ingrédient' },
                  { key: 'quantite', label: 'Stock' },
                  { key: 'seuilMin', label: 'Seuil' },
                ]}
                data={stockRows
                  .map((s) => ({
                    id: s.id,
                    nomingredient: s.libelle_ingredient,
                    quantite: Number(s.quantite_en_stock),
                    seuilMin: Number(s.quantite_seuil_alerte),
                  }))
                  .filter((s) => s.quantite < s.seuilMin)}
              />
            </div>
          </>
        );

      case 'caissier':
        return (
          <>
            <div className="stats-grid">
              <StatCard icon="fa-cash-register" iconColor="#667eea" value={stats.commandesPayees ?? 0} label="Commandes payées" />
              <StatCard icon="fa-euro-sign" iconColor="#1e7e34" value={`${(stats.totalEncaissement ?? 0).toFixed(2)}€`} label="Total encaissé" />
              <StatCard
                icon="fa-clock"
                iconColor="#d4a000"
                value={commandes.filter((c) => c.statutCommande === 'livree' && !c.paye).length}
                label="En attente de paiement"
              />
              <StatCard icon="fa-chart-line" iconColor="#d63031" value={`${stats.ca}€`} label="Chiffre d'affaires" />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '25px' }}>
              <div className="data-table">
                <div style={{ padding: '20px', borderBottom: '1px solid #e0e0e0' }}>
                  <h3>Derniers encaissements</h3>
                </div>
                <table style={{ width: '100%' }}>
                  <thead>
                    <tr>
                      <th>Client</th>
                      <th>Montant</th>
                      <th>Mode</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentPayments.slice(0, 3).map((p, idx) => (
                      <tr key={idx}>
                        <td>{p.id_commande ? `Commande #${p.id_commande}` : ''}</td>
                        <td>{Number(p.montant)}€</td>
                        <td>{p.mode_reglement}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="data-table">
                <div style={{ padding: '20px', borderBottom: '1px solid #e0e0e0' }}>
                  <h3>Alertes paiement</h3>
                </div>
                <table style={{ width: '100%' }}>
                  <thead>
                    <tr>
                      <th>Commande</th>
                      <th>Client</th>
                      <th>Montant</th>
                    </tr>
                  </thead>
                  <tbody>
                    {commandes
                      .filter((c) => c.statutCommande === 'livree' && !c.paye)
                      .map((cmd, idx) => (
                        <tr key={idx}>
                          <td>#{cmd.id}</td>
                          <td>{cmd.client}</td>
                          <td>{cmd.montantTotal}€</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        );

      case 'cuisinier':
        return (
          <>
            <div className="stats-grid">
              <StatCard
                icon="fa-shopping-cart"
                iconColor="#667eea"
                value={commandes.filter((c) => c.statutCommande === 'en_cours' || c.statutCommande === 'en cours' || c.statutCommande === 'confirmee').length}
                label="Commandes en cuisine"
              />
              <StatCard
                icon="fa-clock"
                iconColor="#d4a000"
                value={commandes.filter((c) => c.statutCommande === 'prete').length}
                label="Commandes prêtes"
              />
            </div>
            <DataTable
              columns={[
                { key: 'id', label: '#' },
                { key: 'client', label: 'Client' },
                { key: 'montantTotal', label: 'Montant' },
                { key: 'statutCommande', label: 'Statut' },
              ]}
              data={commandes}
              actions={[
                {
                  label: 'Préparer',
                  icon: 'fa-utensils',
                  className: 'btn-secondary',
                  onClick: (row) => handleServeOrder(row)
                },
              ]}
            />
          </>
        );

      case 'serveur':
        const commandesPretes = commandes.filter(c => c.statutCommande === 'prete');
        const commandesASuivre = commandes.filter(c => 
          c.statutCommande === 'en_attente' || c.statutCommande === 'confirmee' || c.statutCommande === 'en_cours'
        );
        
        return (
          <>
            <div className="stats-grid">
              <StatCard
                icon="fa-utensils"
                iconColor="#667eea"
                value={commandesASuivre.length}
                label="Commandes à suivre"
              />
              <StatCard
                icon="fa-bell"
                iconColor="#28a745"
                value={commandesPretes.length}
                label="Commandes prêtes à servir"
              />
            </div>
            
            {commandesPretes.length > 0 && (
              <div style={{ marginBottom: '30px' }}>
                <h3 style={{ color: '#28a745' }}>✅ Commandes prêtes à être servies</h3>
                <DataTable
                  columns={[
                    { key: 'id', label: '#' },
                    { key: 'client', label: 'Client' },
                    { key: 'montantTotal', label: 'Montant' },
                    { key: 'statutCommande', label: 'Statut' },
                  ]}
                  data={commandesPretes}
                  actions={[
                    {
                      label: 'Servir',
                      icon: 'fa-hands-helping',
                      className: 'btn-success',
                      onClick: handleServeOrder
                    }
                  ]}
                />
              </div>
            )}
            
            <h3 style={{ marginBottom: '15px' }}>📋 Commandes en cours</h3>
            <DataTable
              columns={[
                { key: 'id', label: '#' },
                { key: 'client', label: 'Client' },
                { key: 'montantTotal', label: 'Montant' },
                { key: 'statutCommande', label: 'Statut' },
              ]}
              data={commandesASuivre}
            />
            
            {commandesPretes.length === 0 && (
              <p style={{ color: '#555', textAlign: 'center', marginTop: '20px' }}>
                Aucune commande prête pour le moment. Les commandes apparaîtront ici quand le cuisinier les aura préparées.
              </p>
            )}
          </>
        );

      case 'client':
        return (
          <>
            <div className="stats-grid">
              <StatCard
                icon="fa-shopping-cart"
                iconColor="#667eea"
                value={commandes.filter((c) => c.client?.includes(user?.nom) || c.client === user?.nom).length}
                label="Mes commandes"
              />
              <StatCard
                icon="fa-calendar-check"
                iconColor="#1e7e34"
                value={stats.reservations ?? 0}
                label="Mes réservations"
              />
            </div>
            <DataTable
              columns={[
                { key: 'id', label: '#' },
                { key: 'dateheure', label: 'Date' },
                { key: 'montantTotal', label: 'Montant' },
                { key: 'statutCommande', label: 'Statut' },
              ]}
              data={commandes.filter((c) => c.client === user?.nom || String(c.client).includes(user?.nom || ''))}
            />
          </>
        );

      case 'livreur':
        return (
          <>
            <div className="stats-grid">
              <StatCard icon="fa-truck" iconColor="#667eea" value={stats.livraisons ?? 0} label="Courses actives" />
              <StatCard icon="fa-check" iconColor="#1e7e34" value={commandes.filter((c) => c.statutCommande === 'livree').length} label="Livraisons terminées" />
            </div>
            <p style={{ color: '#555' }}>Utilisez la page Livraisons pour le détail des tournées.</p>
          </>
        );

      case 'magasinier':
        return (
          <>
            <div className="stats-grid">
              <StatCard
                icon="fa-exclamation-triangle"
                iconColor="#d63031"
                value={stockRows.filter((s) => Number(s.quantite_en_stock) < Number(s.quantite_seuil_alerte)).length}
                label="Alertes stock"
              />
              <StatCard icon="fa-boxes" iconColor="#1e7e34" value={stockRows.length} label="Références suivies" />
            </div>
            <DataTable
              columns={[
                { key: 'nomingredient', label: 'Ingrédient' },
                { key: 'quantite', label: 'Stock' },
                { key: 'seuilMin', label: 'Seuil' },
              ]}
              data={stockRows.map((s) => ({
                id: s.id,
                nomingredient: s.libelle_ingredient,
                quantite: Number(s.quantite_en_stock),
                seuilMin: Number(s.quantite_seuil_alerte),
              }))}
            />
          </>
        );

      default:
        return <div>Rôle non reconnu</div>;
    }
  };

  return <div>{getDashboardContent()}</div>;
};

export default Dashboard;