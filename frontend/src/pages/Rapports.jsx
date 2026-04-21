import { useState } from 'react';
import StatCard from '../components/Common/StatCard';
import * as reportsService from '../services/reportsService';

const Rapports = () => {
  const [reportResult, setReportResult] = useState(null);
  const [error, setError] = useState('');

  const loadReport = async (period) => {
    setError('');
    const d = new Date();
    let ref = d.toISOString().slice(0, 10);
    if (period === 'month') ref = d.toISOString().slice(0, 7);
    if (period === 'year') ref = d.getFullYear().toString();
    try {
      const data = await reportsService.fetchReportSummary(period, ref);
      setReportResult({ ref, ...data });
    } catch (e) {
      setReportResult(null);
      setError(e?.response?.data?.detail || 'Impossible de charger le rapport (droits ou API).');
    }
  };

  return (
    <div>
      <h2 style={{ marginBottom: '20px' }}>Rapports (API)</h2>
      {error && <p style={{ color: 'coral', marginBottom: '12px' }}>{error}</p>}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '25px', marginBottom: '30px' }}>
        <div onClick={() => loadReport('day')} role="presentation">
          <StatCard icon="fa-calendar-day" iconColor="#667eea" value="Journalier" label="CA du jour" />
        </div>
        <div onClick={() => loadReport('month')} role="presentation">
          <StatCard icon="fa-calendar-alt" iconColor="#a8e6cf" value="Mensuel" label="CA du mois" />
        </div>
        <div onClick={() => loadReport('year')} role="presentation">
          <StatCard icon="fa-calendar" iconColor="#ff7675" value="Annuel" label="CA de l’année" />
        </div>
      </div>

      {reportResult && (
        <div className="data-table">
          <div style={{ padding: '20px' }}>
            <h3>
              Période : {reportResult.periode} ({reportResult.ref})
            </h3>
            <p>Nombre de commandes : {reportResult.nombre_commandes}</p>
            <p>Chiffre d’affaires (réglé) : {reportResult.chiffre_affaires} €</p>
            <p>Commandes réglées : {reportResult.commandes_reglees}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Rapports;
