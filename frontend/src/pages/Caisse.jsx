import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';  
import { useAuth } from '../context/AuthContext';
import DataTable from '../components/Common/DataTable';
import Modal from '../components/Common/Modal';
import * as ordersService from '../services/ordersService';
import * as paymentsService from '../services/paymentsService';

const Caisse = () => {
  const { user } = useAuth();
  const navigate = useNavigate(); 
  const [commandes, setCommandes] = useState([]);
  const [paiements, setPaiements] = useState([]);
  const [selectedCommande, setSelectedCommande] = useState(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('Carte bancaire');
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [stats, setStats] = useState({
    totalCA: 0,
    totalPaye: 0,
    totalImpaye: 0,
    transactionsJour: 0
  });

  const loadData = async () => {
    try {
      const [orders, pays] = await Promise.all([
        ordersService.fetchOrders(),
        paymentsService.fetchPayments()
      ]);
      setCommandes(orders);
      setPaiements(pays);
    } catch (error) {
      console.error('Erreur chargement:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 10000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const totalCA = commandes.reduce((sum, cmd) => sum + Number(cmd.montant_total || 0), 0);
    const totalPaye = paiements.reduce((sum, p) => sum + Number(p.montant || 0), 0);
    const totalImpaye = commandes
      .filter((c) => (c.etat_commande === 'livree' || c.etat_commande === 'prete') && c.statut_reglement !== 'payee')
      .reduce((sum, c) => sum + Number(c.montant_total || 0), 0);
    const today = new Date().toISOString().slice(0, 10);
    const transactionsJour = paiements.filter((p) => String(p.cree_le).startsWith(today)).length;
    setStats({ totalCA, totalPaye, totalImpaye, transactionsJour });
  }, [commandes, paiements]);

  const handlePayment = (commande) => {
    setSelectedCommande(commande);
    setIsPaymentModalOpen(true);
  };

  const processPayment = async () => {
    if (!selectedCommande || processing) return;
    
    setProcessing(true);
    
    try {
      const modeMap = {
        'Carte bancaire': 'carte',
        'Espèces': 'especes',
        'Ticket restaurant': 'ticket',
        'Virement': 'virement',
        'Mobile pay': 'mobile_pay'
      };
      
      await paymentsService.createPayment({
        id_commande: selectedCommande.id,
        montant: Number(selectedCommande.montantTotal),
        mode_reglement: modeMap[paymentMethod] || 'carte',
      });
      
      await loadData();
      setIsPaymentModalOpen(false);
      setSelectedCommande(null);
      
      const notification = document.createElement('div');
      notification.className = 'notification';
      notification.textContent = `✓ Paiement de ${selectedCommande.montantTotal}€ encaissé avec succès !`;
      document.body.appendChild(notification);
      setTimeout(() => notification.remove(), 3000);
    } catch (error) {
      console.error('Payment failed:', error);
      const notification = document.createElement('div');
      notification.className = 'notification';
      notification.textContent = error.response?.data?.detail || '❌ Erreur lors du paiement';
      notification.style.background = '#dc3545';
      document.body.appendChild(notification);
      setTimeout(() => notification.remove(), 3000);
    } finally {
      setProcessing(false);
    }
  };

  const commandesAEncaisser = useMemo(() => {
    const encaissables = commandes.filter((cmd) => {
      const estLivrable = cmd.etat_commande === 'livree' || cmd.etat_commande === 'prete';
      const nonPayee = cmd.statut_reglement !== 'payee';
      return estLivrable && nonPayee;
    });
    
    return encaissables.map((cmd) => ({
      id: cmd.id,
      client: cmd.client_nom || `Client #${cmd.id_client}`,
      dateheure: new Date(cmd.cree_le).toLocaleString(),
      montantTotal: Number(cmd.montant_total),
    }));
  }, [commandes]);

  const commandesPayees = useMemo(() => {
    const payees = commandes.filter((cmd) => cmd.statut_reglement === 'payee');
    
    return payees.map((cmd) => ({
      id: cmd.id,
      client: cmd.client_nom || `Client #${cmd.id_client}`,
      dateheure: new Date(cmd.cree_le).toLocaleString(),
      montantTotal: Number(cmd.montant_total),
      modePaiement: paiements.find(p => p.id_commande === cmd.id)?.mode_reglement || 'Non spécifié'
    }));
  }, [commandes, paiements]);

  const handlePrintInvoice = (facture) => {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Facture ${facture.numero}</title>
        <meta charset="UTF-8">
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body {
            font-family: 'Segoe UI', Arial, sans-serif;
            padding: 40px 20px;
            background: #f5f5f5;
          }
          .invoice {
            max-width: 800px;
            margin: 0 auto;
            background: white;
            border-radius: 16px;
            box-shadow: 0 10px 40px rgba(0,0,0,0.1);
            overflow: hidden;
          }
          .invoice-header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            text-align: center;
          }
          .invoice-header h1 { font-size: 28px; margin-bottom: 8px; }
          .invoice-body { padding: 30px; }
          .info-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 30px;
            flex-wrap: wrap;
            gap: 15px;
          }
          .info-box {
            background: #f8f9fa;
            padding: 15px 25px;
            border-radius: 12px;
            flex: 1;
            min-width: 180px;
          }
          .info-box h4 { color: #667eea; margin-bottom: 8px; font-size: 12px; text-transform: uppercase; }
          .info-box p { font-size: 16px; font-weight: 600; color: #333; }
          table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          th {
            background: #f8f9fa;
            padding: 12px;
            text-align: left;
            font-weight: 600;
            border-bottom: 2px solid #e0e0e0;
          }
          td { padding: 12px; border-bottom: 1px solid #eee; }
          .totals { text-align: right; margin-top: 20px; padding-top: 20px; border-top: 2px solid #eee; }
          .totals .total { font-size: 24px; font-weight: bold; color: #28a745; }
          .payment-info {
            background: #e8f5e9;
            padding: 15px;
            border-radius: 12px;
            margin: 20px 0;
            text-align: center;
          }
          .footer {
            background: #f8f9fa;
            padding: 20px;
            text-align: center;
            color: #666;
            font-size: 12px;
          }
          @media print {
            body { background: white; padding: 0; }
            .invoice { box-shadow: none; border-radius: 0; }
          }
        </style>
      </head>
      <body>
        <div class="invoice">
          <div class="invoice-header">
            <h1>🍽️ RestoManager</h1>
            <p>Facture de paiement</p>
          </div>
          <div class="invoice-body">
            <div class="info-row">
              <div class="info-box"><h4>N° FACTURE</h4><p>${facture.numero}</p></div>
              <div class="info-box"><h4>DATE</h4><p>${facture.date}</p></div>
              <div class="info-box"><h4>CLIENT</h4><p>${facture.client}</p></div>
            </div>
            <table>
              <thead><tr><th>Description</th><th style="text-align:right">Montant</th></tr></thead>
              <tbody>
                <tr><td>Commande de repas</td><td style="text-align:right">${facture.montantHT} €</td></tr>
                <tr><td>TVA (20%)</td><td style="text-align:right">${facture.tva} €</td></tr>
              </tbody>
            </table>
            <div class="totals">
              <p>Total HT : ${facture.montantHT} €</p>
              <p>TVA : ${facture.tva} €</p>
              <p class="total">Total TTC : ${facture.montantTTC} €</p>
            </div>
            <div class="payment-info">
              <p>💰 Mode de paiement : ${facture.modePaiement}</p>
              <p>✅ Statut : Payée</p>
            </div>
            <p style="text-align:center; margin-top:20px;">Merci de votre visite et à bientôt !</p>
          </div>
          <div class="footer">
            <p>RestoManager - Solution complète de gestion restaurant</p>
            <p>Cette facture fait foi de paiement</p>
          </div>
        </div>
        <script>window.onload = function() { window.print(); setTimeout(window.close, 500); };</script>
      </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div>
      <h2 style={{ marginBottom: '20px' }}>💰 Gestion de la Caisse</h2>
      
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#667eea20', color: '#667eea' }}>
            <i className="fas fa-chart-line"></i>
          </div>
          <h3>{stats.totalCA.toFixed(2)}€</h3>
          <p>CA Total du jour</p>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#a8e6cf20', color: '#1e7e34' }}>
            <i className="fas fa-check-circle"></i>
          </div>
          <h3>{stats.totalPaye.toFixed(2)}€</h3>
          <p>Total encaissé</p>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#ffeaa720', color: '#d4a000' }}>
            <i className="fas fa-clock"></i>
          </div>
          <h3>{stats.totalImpaye.toFixed(2)}€</h3>
          <p>En attente de paiement</p>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#ff767520', color: '#d63031' }}>
            <i className="fas fa-exchange-alt"></i>
          </div>
          <h3>{stats.transactionsJour}</h3>
          <p>Transactions aujourd'hui</p>
        </div>
        <div className="stat-card" onClick={() => navigate('/rapports')} style={{ cursor: 'pointer' }}>
          <div className="stat-icon" style={{ background: '#764ba220', color: '#764ba2' }}>
            <i className="fas fa-chart-bar"></i>
          </div>
          <h3>Rapports</h3>
          <p>Voir et imprimer</p>
        </div>
      </div>

      <div style={{ marginBottom: '30px' }}>
        <h3 style={{ marginBottom: '15px' }}>🟡 Commandes à encaisser</h3>
        <DataTable
          columns={[
            { key: 'id', label: 'N° Commande' },
            { key: 'client', label: 'Client' },
            { key: 'dateheure', label: 'Date/Heure' },
            { key: 'montantTotal', label: 'Montant' }
          ]}
          data={commandesAEncaisser}
          actions={[
            { label: 'Encaisser', icon: 'fa-cash-register', className: 'btn-primary', onClick: handlePayment }
          ]}
        />
        {commandesAEncaisser.length === 0 && (
          <div className="data-table" style={{ padding: '40px', textAlign: 'center', color: '#999' }}>
            Aucune commande à encaisser pour le moment
          </div>
        )}
      </div>

      <div>
        <h3 style={{ marginBottom: '15px' }}>✅ Paiements effectués</h3>
        <DataTable
          columns={[
            { key: 'id', label: 'N° Commande' },
            { key: 'client', label: 'Client' },
            { key: 'dateheure', label: 'Date/Heure' },
            { key: 'montantTotal', label: 'Montant' },
            { key: 'modePaiement', label: 'Mode de paiement' }
          ]}
          data={commandesPayees}
          actions={[
            { 
              label: 'Facture', 
              icon: 'fa-file-invoice', 
              className: 'btn-primary', 
              onClick: (row) => {
                const facture = {
                  numero: `FACT-${row.id.toString().padStart(6, '0')}`,
                  date: new Date().toLocaleDateString(),
                  client: row.client,
                  montantHT: (row.montantTotal / 1.2).toFixed(2),
                  tva: (row.montantTotal - row.montantTotal / 1.2).toFixed(2),
                  montantTTC: row.montantTotal.toFixed(2),
                  modePaiement: row.modePaiement === 'carte' ? 'Carte bancaire'
                    : row.modePaiement === 'especes' ? 'Espèces'
                    : row.modePaiement === 'ticket' ? 'Ticket restaurant'
                    : row.modePaiement === 'virement' ? 'Virement'
                    : row.modePaiement === 'mobile_pay' ? 'Mobile pay'
                    : row.modePaiement
                };
                handlePrintInvoice(facture);
              }
            }
          ]}
        />
      </div>

      <Modal isOpen={isPaymentModalOpen} onClose={() => setIsPaymentModalOpen(false)} title="💳 Encaissement">
        {selectedCommande && (
          <div>
            <div className="form-group">
              <label>Commande N°</label>
              <input type="text" value={selectedCommande.id} disabled />
            </div>
            <div className="form-group">
              <label>Client</label>
              <input type="text" value={selectedCommande.client} disabled />
            </div>
            <div className="form-group">
              <label>Montant à payer</label>
              <input type="text" value={`${selectedCommande.montantTotal.toFixed(2)}€`} disabled style={{ fontSize: '18px', fontWeight: 'bold' }} />
            </div>
            <div className="form-group">
              <label>Mode de paiement</label>
              <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
                <option>Carte bancaire</option>
                <option>Espèces</option>
                <option>Ticket restaurant</option>
                <option>Virement</option>
                <option>Mobile pay</option>
              </select>
            </div>
            <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
              <button className="btn-primary" onClick={processPayment} disabled={processing} style={{ flex: 1 }}>
                {processing ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-check"></i>} 
                {processing ? ' Traitement...' : ' Valider le paiement'}
              </button>
              <button className="btn-secondary" onClick={() => setIsPaymentModalOpen(false)} style={{ flex: 1 }}>
                <i className="fas fa-times"></i> Annuler
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Caisse;