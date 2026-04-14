import { useState, useEffect } from 'react';
import { useAuth } from '../Context/AuthContext';
import StatCard from '../components/Common/StatCard';
import DataTable from '../components/Common/DataTable';
import { mockData } from '../Data/mockData';

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({});

  useEffect(() => {
    // Calcul des statistiques en fonction du rôle
    const commandesCount = mockData.commandes.length;
    const reservationsCount = mockData.reservations.length;
    const caTotal = mockData.commandes.reduce((sum, cmd) => sum + cmd.montantTotal, 0);
    
    setStats({
      commandes: commandesCount,
      reservations: reservationsCount,
      ca: caTotal,
      livraisons: mockData.livraisons.length
    });
  }, []);

  const getDashboardContent = () => {
    switch(user?.role) {
      case 'admin':
        return (
          <>
            <div className="stats-grid">
              <StatCard icon="fa-shopping-cart" iconColor="#667eea" value={stats.commandes} label="Commandes aujourd'hui" />
              <StatCard icon="fa-calendar-check" iconColor="#1e7e34" value={stats.reservations} label="Réservations" />
              <StatCard icon="fa-truck" iconColor="#d4a000" value={stats.livraisons} label="Livraisons en cours" />
              <StatCard icon="fa-chart-line" iconColor="#d63031" value={`${stats.ca}€`} label="CA du jour" />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '25px' }}>
              <DataTable
                columns={[
                  { key: 'id', label: '#' },
                  { key: 'client', label: 'Client' },
                  { key: 'montantTotal', label: 'Montant' },
                  { key: 'statutCommande', label: 'Statut' }
                ]}
                data={mockData.commandes.slice(0, 3)}
              />
              <DataTable
                columns={[
                  { key: 'nomingredient', label: 'Ingrédient' },
                  { key: 'quantite', label: 'Stock' },
                  { key: 'seuilMin', label: 'Seuil' }
                ]}
                data={mockData.stocks.filter(s => s.quantite < s.seuilMin)}
              />
            </div>
          </>
        );
      
      case 'serveur':
        return (
          <>
            <div className="stats-grid">
              <StatCard icon="fa-shopping-cart" iconColor="#667eea" value={stats.commandes} label="Commandes à servir" />
              <StatCard icon="fa-calendar-check" iconColor="#1e7e34" value={stats.reservations} label="Réservations du jour" />
              <StatCard icon="fa-chart-line" iconColor="#d63031" value={`${stats.ca}€`} label="CA du jour" />
            </div>
            <DataTable
              columns={[
                { key: 'id', label: '#' },
                { key: 'client', label: 'Client' },
                { key: 'montantTotal', label: 'Montant' },
                { key: 'statutCommande', label: 'Statut' }
              ]}
              data={mockData.commandes}
            />
          </>
        );
      
      case 'cuisinier':
        return (
          <>
            <div className="stats-grid">
              <StatCard icon="fa-shopping-cart" iconColor="#667eea" value={mockData.commandes.filter(c => c.statutCommande === 'en cours').length} label="Commandes en cuisine" />
              <StatCard icon="fa-clock" iconColor="#d4a000" value={mockData.commandes.filter(c => c.statutCommande === 'prete').length} label="Commandes prêtes" />
            </div>
            <DataTable
              columns={[
                { key: 'id', label: '#' },
                { key: 'client', label: 'Client' },
                { key: 'montantTotal', label: 'Montant' },
                { key: 'statutCommande', label: 'Statut' }
              ]}
              data={mockData.commandes}
              actions={[
                { label: 'Préparer', icon: 'fa-utensils', className: 'btn-secondary', onClick: (row) => console.log('Préparer commande', row.id) }
              ]}
            />
          </>
        );
      
      case 'client':
        return (
          <>
            <div className="stats-grid">
              <StatCard icon="fa-shopping-cart" iconColor="#667eea" value={mockData.commandes.filter(c => c.client === user.nom).length} label="Mes commandes" />
              <StatCard icon="fa-calendar-check" iconColor="#1e7e34" value={mockData.reservations.filter(r => r.client === user.nom).length} label="Mes réservations" />
            </div>
            <DataTable
              columns={[
                { key: 'id', label: '#' },
                { key: 'dateheure', label: 'Date' },
                { key: 'montantTotal', label: 'Montant' },
                { key: 'statutCommande', label: 'Statut' }
              ]}
              data={mockData.commandes.filter(c => c.client === user.nom)}
            />
          </>
        );
         case 'caissier':
        return (
          <>
            <div className="stats-grid">
              <StatCard icon="fa-cash-register" iconColor="#667eea" value={stats.commandesPayees} label="Commandes encaissées" />
              <StatCard icon="fa-euro-sign" iconColor="#1e7e34" value={`${stats.totalEncaissement}€`} label="Total encaissé" />
              <StatCard icon="fa-clock" iconColor="#d4a000" value={mockData.commandes.filter(c => c.statutCommande === 'livree' && !c.paye).length} label="En attente de paiement" />
              <StatCard icon="fa-chart-line" iconColor="#d63031" value={`${stats.ca}€`} label="CA total du jour" />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '25px' }}>
              <div className="data-table">
                <div style={{ padding: '20px', borderBottom: '1px solid #e0e0e0' }}>
                  <h3>Derniers encaissements</h3>
                </div>
                <table>
                  <thead>
                    <tr><th>Client</th><th>Montant</th><th>Mode</th></tr>
                  </thead>
                  <tbody>
                    {mockData.factures.filter(f => f.paye).slice(0, 3).map((fact, idx) => (
                      <tr key={idx}>
                        <td>{fact.client}</td>
                        <td>{fact.montantTTC}€</td>
                        <td>{fact.modePaiement}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="data-table">
                <div style={{ padding: '20px', borderBottom: '1px solid #e0e0e0' }}>
                  <h3>Alertes paiement</h3>
                </div>
                <table>
                  <thead>
                    <tr><th>Commande</th><th>Client</th><th>Montant</th></tr>
                  </thead>
                  <tbody>
                    {mockData.commandes.filter(c => c.statutCommande === 'livree' && !c.paye).map((cmd, idx) => (
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
      
      default:
        return <div>Sélectionnez un rôle valide</div>;
    }
  };

  return (
    <div>
      {getDashboardContent()}
    </div>
  );
};

export default Dashboard;