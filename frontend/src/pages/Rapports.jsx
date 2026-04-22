import { useState } from 'react';
import StatCard from '../components/Common/StatCard';
import * as reportsService from '../services/reportsService';

const Rapports = () => {
  const [reportResult, setReportResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedPeriod, setSelectedPeriod] = useState(null);

  const loadReport = async (period) => {
    setLoading(true);
    setError('');
    setSelectedPeriod(period);
    const d = new Date();
    let ref = d.toISOString().slice(0, 10);
    if (period === 'month') ref = d.toISOString().slice(0, 7);
    if (period === 'year') ref = d.getFullYear().toString();
    try {
      const data = await reportsService.fetchReportSummary(period, ref);
      setReportResult({ ref, period, ...data });
    } catch (e) {
      setReportResult(null);
      setError(e?.response?.data?.detail || 'Impossible de charger le rapport (droits ou API).');
    } finally {
      setLoading(false);
    }
  };

  const handlePrintReport = () => {
    if (!reportResult) return;
    
    const periodLabels = {
      day: 'Journalier',
      month: 'Mensuel',
      year: 'Annuel'
    };
    
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Rapport ${periodLabels[reportResult.period]} - RestoManager</title>
        <meta charset="UTF-8">
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body {
            font-family: 'Segoe UI', Arial, sans-serif;
            padding: 40px 20px;
            background: #f5f5f5;
          }
          .report-container {
            max-width: 800px;
            margin: 0 auto;
            background: white;
            border-radius: 16px;
            box-shadow: 0 10px 40px rgba(0,0,0,0.1);
            overflow: hidden;
          }
          .report-header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            text-align: center;
          }
          .report-header h1 {
            font-size: 28px;
            margin-bottom: 8px;
          }
          .report-header p {
            opacity: 0.9;
            font-size: 14px;
          }
          .report-body {
            padding: 30px;
          }
          .period-info {
            text-align: center;
            margin-bottom: 30px;
            padding-bottom: 20px;
            border-bottom: 2px solid #eee;
          }
          .period-info h2 {
            color: #667eea;
            font-size: 20px;
            margin-bottom: 5px;
          }
          .period-info p {
            color: #666;
          }
          .stats-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 20px;
            margin: 30px 0;
          }
          .stat-card {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 12px;
            text-align: center;
          }
          .stat-card .value {
            font-size: 28px;
            font-weight: bold;
            color: #333;
          }
          .stat-card .label {
            color: #666;
            font-size: 14px;
            margin-top: 8px;
          }
          .stat-card.ca .value { color: #28a745; }
          .stat-card.commandes .value { color: #667eea; }
          .stat-card.reglees .value { color: #17a2b8; }
          .footer {
            background: #f8f9fa;
            padding: 20px;
            text-align: center;
            color: #666;
            font-size: 12px;
            border-top: 1px solid #eee;
          }
          @media print {
            body { background: white; padding: 0; }
            .report-container { box-shadow: none; border-radius: 0; }
          }
        </style>
      </head>
      <body>
        <div class="report-container">
          <div class="report-header">
            <h1>🍽️ RestoManager</h1>
            <p>Rapport d'activité</p>
          </div>
          <div class="report-body">
            <div class="period-info">
              <h2>${periodLabels[reportResult.period]} - ${reportResult.ref}</h2>
              <p>Période du rapport</p>
            </div>
            
            <div class="stats-grid">
              <div class="stat-card commandes">
                <div class="value">${reportResult.nombre_commandes}</div>
                <div class="label">Commandes totales</div>
              </div>
              <div class="stat-card ca">
                <div class="value">${parseFloat(reportResult.chiffre_affaires).toFixed(2)} €</div>
                <div class="label">Chiffre d'affaires</div>
              </div>
              <div class="stat-card reglees">
                <div class="value">${reportResult.commandes_reglees}</div>
                <div class="label">Commandes réglées</div>
              </div>
            </div>
            
            <div style="margin-top: 20px; padding: 15px; background: #e8f5e9; border-radius: 12px; text-align: center;">
              <p style="color: #2e7d32;"><strong>💰 Total encaissé :</strong> ${parseFloat(reportResult.chiffre_affaires).toFixed(2)} €</p>
            </div>
          </div>
          <div class="footer">
            <p>RestoManager - Solution complète de gestion restaurant</p>
            <p>Rapport généré le ${new Date().toLocaleDateString()} à ${new Date().toLocaleTimeString()}</p>
          </div>
        </div>
        <script>
          window.onload = function() { window.print(); setTimeout(window.close, 500); };
        </script>
      </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '15px' }}>
        <h2>📊 Rapports de caisse</h2>
        {reportResult && (
          <button className="btn-primary" onClick={handlePrintReport}>
            <i className="fas fa-print"></i> Imprimer le rapport
          </button>
        )}
      </div>
      
      {error && (
        <div style={{ background: '#ff767520', color: '#d63031', padding: '15px', borderRadius: '12px', marginBottom: '20px', borderLeft: '4px solid #d63031' }}>
          <i className="fas fa-exclamation-triangle"></i> {error}
        </div>
      )}
      
      <div className="stats-grid" style={{ marginBottom: '30px', cursor: 'pointer' }}>
        <div onClick={() => loadReport('day')} role="presentation">
          <StatCard icon="fa-calendar-day" iconColor="#667eea" value="Journalier" label="CA du jour" />
        </div>
        <div onClick={() => loadReport('month')} role="presentation">
          <StatCard icon="fa-calendar-alt" iconColor="#a8e6cf" value="Mensuel" label="CA du mois" />
        </div>
        <div onClick={() => loadReport('year')} role="presentation">
          <StatCard icon="fa-calendar" iconColor="#ff7675" value="Annuel" label="CA de l'année" />
        </div>
      </div>

      {loading && (
        <div className="data-table" style={{ padding: '60px', textAlign: 'center' }}>
          <i className="fas fa-spinner fa-spin" style={{ fontSize: '32px', color: '#667eea' }}></i>
          <p style={{ marginTop: '15px', color: '#666' }}>Chargement du rapport...</p>
        </div>
      )}

      {reportResult && !loading && (
        <div className="data-table">
          <div style={{ padding: '25px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px', flexWrap: 'wrap', gap: '10px' }}>
              <h3 style={{ color: '#667eea', margin: 0 }}>
                <i className="fas fa-chart-line"></i> Rapport {reportResult.period === 'day' ? 'Journalier' : reportResult.period === 'month' ? 'Mensuel' : 'Annuel'}
              </h3>
              <span style={{ background: '#f0f0f0', padding: '6px 14px', borderRadius: '20px', fontSize: '13px', color: '#555' }}>
                <i className="fas fa-calendar"></i> {reportResult.ref}
              </span>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '25px' }}>
              <div style={{ background: '#f8f9fa', padding: '20px', borderRadius: '12px', textAlign: 'center' }}>
                <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#667eea' }}>{reportResult.nombre_commandes}</div>
                <div style={{ color: '#666', fontSize: '13px', marginTop: '8px' }}>Commandes totales</div>
              </div>
              <div style={{ background: '#f8f9fa', padding: '20px', borderRadius: '12px', textAlign: 'center' }}>
                <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#28a745' }}>{parseFloat(reportResult.chiffre_affaires).toFixed(2)} €</div>
                <div style={{ color: '#666', fontSize: '13px', marginTop: '8px' }}>Chiffre d'affaires</div>
              </div>
              <div style={{ background: '#f8f9fa', padding: '20px', borderRadius: '12px', textAlign: 'center' }}>
                <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#17a2b8' }}>{reportResult.commandes_reglees}</div>
                <div style={{ color: '#666', fontSize: '13px', marginTop: '8px' }}>Commandes réglées</div>
              </div>
            </div>
            
            <div style={{ background: 'linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%)', padding: '18px', borderRadius: '12px', textAlign: 'center' }}>
              <p style={{ color: '#2e7d32', margin: 0, fontSize: '16px' }}>
                <strong>💰 Total encaissé sur la période :</strong> {parseFloat(reportResult.chiffre_affaires).toFixed(2)} €
              </p>
            </div>
          </div>
        </div>
      )}
      
      {!reportResult && !loading && !error && (
        <div className="data-table" style={{ padding: '60px', textAlign: 'center', color: '#999' }}>
          <i className="fas fa-chart-line" style={{ fontSize: '48px', marginBottom: '15px', opacity: 0.3 }}></i>
          <p>Sélectionnez une période pour générer un rapport</p>
        </div>
      )}
    </div>
  );
};

export default Rapports;