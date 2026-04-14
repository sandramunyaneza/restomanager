import  { useState } from 'react';
import StatCard from '../components/Common/StatCard';
import { mockData } from '../Data/mockData';

const Rapports = () => {
  const [reportResult, setReportResult] = useState(null);

  const generateReport = (type) => {
    let content = {};
    switch(type) {
      case 'journalier':
        content = {
          title: '📊 Rapport Journalier',
          date: new Date().toLocaleDateString(),
          commandes: mockData.commandes.length,
          ca: mockData.commandes.reduce((sum, c) => sum + c.montantTotal, 0),
          reservations: mockData.reservations.length
        };
        break;
      case 'mensuel':
        content = {
          title: '📈 Rapport Mensuel - Avril 2026',
          commandes: mockData.commandes.length * 30,
          ca: (mockData.commandes.reduce((sum, c) => sum + c.montantTotal, 0) * 30).toFixed(2),
          reservations: mockData.reservations.length * 30
        };
        break;
      case 'annuel':
        content = {
          title: '📅 Rapport Annuel - 2026',
          commandes: 4680,
          ca: 234000,
          satisfaction: '94%'
        };
        break;
    }
    setReportResult(content);
  };

  return (
    <div>
      <h2 style={{ marginBottom: '20px' }}>Génération de rapports</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '25px', marginBottom: '30px' }}>
        <div onClick={() => generateReport('journalier')}>
          <StatCard icon="fa-calendar-day" iconColor="#667eea" value="Journalier" label="Rapport du jour" />
        </div>
        <div onClick={() => generateReport('mensuel')}>
          <StatCard icon="fa-calendar-alt" iconColor="#a8e6cf" value="Mensuel" label="Rapport du mois" />
        </div>
        <div onClick={() => generateReport('annuel')}>
          <StatCard icon="fa-calendar-year" iconColor="#ff7675" value="Annuel" label="Bilan complet" />
        </div>
      </div>
      
      {reportResult && (
        <div className="data-table">
          <div style={{ padding: '20px' }}>
            <h3>{reportResult.title}</h3>
            <p>Commandes: {reportResult.commandes}</p>
            <p>Chiffre d'affaires: {reportResult.ca}€</p>
            <p>Réservations: {reportResult.reservations}</p>
            {reportResult.satisfaction && <p>Taux de satisfaction: {reportResult.satisfaction}</p>}
          </div>
        </div>
      )}
    </div>
  );
};

export default Rapports;