import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import DataTable from '../components/Common/DataTable';
import Modal from '../components/Common/Modal';
import * as ordersService from '../services/ordersService';
import * as paymentsService from '../services/paymentsService';

const Caisse = () => {
  useAuth();
  const [commandes, setCommandes] = useState([]);
  const [paiements, setPaiements] = useState([]);
  const [selectedCommande, setSelectedCommande] = useState(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('Carte bancaire');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalCA: 0,
    totalPaye: 0,
    totalImpaye: 0,
    transactionsJour: 0
  });

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const [orders, pays] = await Promise.all([ordersService.fetchOrders(), paymentsService.fetchPayments()]);
        if (!alive) return;
        setCommandes(orders);
        setPaiements(pays);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    const totalCA = commandes.reduce((sum, cmd) => sum + Number(cmd.montant_total || 0), 0);
    const totalPaye = paiements.reduce((sum, p) => sum + Number(p.montant || 0), 0);
    const totalImpaye = commandes
      .filter((c) => c.etat_commande === 'livree' && c.statut_reglement !== 'payee')
      .reduce((sum, c) => sum + Number(c.montant_total || 0), 0);
    const today = new Date().toISOString().slice(0, 10);
    const transactionsJour = paiements.filter((p) => String(p.cree_le).startsWith(today)).length;
    setStats({ totalCA, totalPaye, totalImpaye, transactionsJour });
  }, [commandes, paiements]);

  const handlePayment = (commande) => {
    setSelectedCommande(commande);
    setIsPaymentModalOpen(true);
  };

  const processPayment = () => {
    if (!selectedCommande) return;
    (async () => {
      try {
        const mode =
          paymentMethod === 'Espèces'
            ? 'especes'
            : paymentMethod === 'Mobile pay'
              ? 'mobile_pay'
              : paymentMethod === 'Autre'
                ? 'autre'
                : 'carte';
        await paymentsService.createPayment({
          id_commande: selectedCommande.id,
          montant: Number(selectedCommande.montantTotal),
          mode_reglement: mode,
        });
        const [orders, pays] = await Promise.all([ordersService.fetchOrders(), paymentsService.fetchPayments()]);
        setCommandes(orders);
        setPaiements(pays);
        setIsPaymentModalOpen(false);
        setSelectedCommande(null);
        showNotification(`Paiement de ${selectedCommande.montantTotal}€ encaissé avec succès !`);
      } catch (e) {
        console.warn('Payment failed', e);
        showNotification("Impossible d'encaisser (permissions ou API indisponible).");
      }
    })();
  };

  const showNotification = (msg) => {
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.textContent = msg;
    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 3000);
  };

  const printReceipt = (facture) => {
    const receiptWindow = window.open('', '_blank');
    receiptWindow.document.write(`
      <html>
        <head>
          <title>Reçu de paiement - ${facture.numero}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            .receipt { max-width: 300px; margin: 0 auto; }
            .header { text-align: center; margin-bottom: 20px; }
            .divider { border-top: 1px dashed #000; margin: 10px 0; }
            .total { font-size: 18px; font-weight: bold; margin-top: 10px; }
          </style>
        </head>
        <body>
          <div class="receipt">
            <div class="header">
              <h2>🍽️ RestoManager</h2>
              <p>Reçu de paiement</p>
              <p>${facture.numero}</p>
            </div>
            <div class="divider"></div>
            <p><strong>Client:</strong> ${facture.client}</p>
            <p><strong>Date:</strong> ${facture.date}</p>
            <p><strong>Mode de paiement:</strong> ${facture.modePaiement}</p>
            <div class="divider"></div>
            <p>Montant HT: ${facture.montantHT}€</p>
            <p>TVA (20%): ${facture.tva}€</p>
            <p class="total">Total TTC: ${facture.montantTTC}€</p>
            <div class="divider"></div>
            <p style="text-align: center;">Merci de votre visite !</p>
          </div>
          <script>window.print();</script>
        </body>
      </html>
    `);
  };

  const commandesAEncaisser = useMemo(
    () =>
      commandes
        .filter((cmd) => cmd.etat_commande === 'livree' && cmd.statut_reglement !== 'payee')
        .map((cmd) => ({
          id: cmd.id,
          client: cmd.nom_client || `Client #${cmd.id_client}`,
          dateheure: cmd.cree_le,
          montantTotal: Number(cmd.montant_total),
        })),
    [commandes]
  );

  const commandesPayees = useMemo(
    () =>
      commandes
        .filter((cmd) => cmd.statut_reglement === 'payee')
        .map((cmd) => ({
          id: cmd.id,
          client: cmd.nom_client || `Client #${cmd.id_client}`,
          dateheure: cmd.cree_le,
          montantTotal: Number(cmd.montant_total),
        })),
    [commandes]
  );

  const factures = useMemo(() => {
    // Pas de table "factures" côté backend : on dérive une “facture” depuis chaque paiement.
    return paiements.map((p) => {
      const ttc = Number(p.montant);
      const ht = ttc / 1.2;
      const tva = ttc - ht;
      return {
        numero: `PAY-${p.id}`,
        date: String(p.cree_le).slice(0, 10),
        client: p.id_commande ? `Commande #${p.id_commande}` : '',
        montantHT: ht.toFixed(2),
        tva: tva.toFixed(2),
        montantTTC: ttc,
        paye: true,
        modePaiement: p.mode_reglement,
      };
    });
  }, [paiements]);

  return (
    <div>
      <h2 style={{ marginBottom: '20px' }}>Gestion de la Caisse</h2>
      
      {/* Statistiques de caisse */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#667eea20', color: '#667eea' }}>
            <i className="fas fa-chart-line"></i>
          </div>
          <h3>{stats.totalCA}€</h3>
          <p>CA Total du jour</p>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#a8e6cf20', color: '#1e7e34' }}>
            <i className="fas fa-check-circle"></i>
          </div>
          <h3>{stats.totalPaye}€</h3>
          <p>Total encaissé</p>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#ffeaa720', color: '#d4a000' }}>
            <i className="fas fa-clock"></i>
          </div>
          <h3>{stats.totalImpaye}€</h3>
          <p>En attente de paiement</p>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#ff767520', color: '#d63031' }}>
            <i className="fas fa-exchange-alt"></i>
          </div>
          <h3>{stats.transactionsJour}</h3>
          <p>Transactions aujourd'hui</p>
        </div>
      </div>

      {/* Commandes à encaisser */}
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
      </div>

      {/* Historique des paiements */}
      <div>
        <h3 style={{ marginBottom: '15px' }}>✅ Paiements effectués</h3>
        <DataTable
          columns={[
            { key: 'commandeId', label: 'N° Commande' },
            { key: 'client', label: 'Client' },
            { key: 'montantTotal', label: 'Montant' },
            { key: 'modePaiement', label: 'Mode de paiement' }
          ]}
          data={commandesPayees.map(cmd => ({
            ...cmd,
            modePaiement: factures.find(f => f.client === cmd.client && f.montantTTC === cmd.montantTotal)?.modePaiement || 'Non spécifié'
          }))}
          actions={[
            { label: 'Reçu', icon: 'fa-print', className: 'btn-secondary', onClick: (row) => {
              const facture = factures.find(f => f.client === row.client && f.montantTTC === row.montantTotal);
              if (facture) printReceipt(facture);
            }}
          ]}
        />
      </div>

      {/* Modal de paiement */}
      <Modal isOpen={isPaymentModalOpen} onClose={() => setIsPaymentModalOpen(false)} title="Encaissement">
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
              <input type="text" value={`${selectedCommande.montantTotal}€`} disabled style={{ fontSize: '18px', fontWeight: 'bold' }} />
            </div>
            <div className="form-group">
              <label>Mode de paiement</label>
              <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
                <option>Carte bancaire</option>
                <option>Espèces</option>
                <option>Mobile pay</option>
                <option>Autre</option>
              </select>
            </div>
            <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
              <button className="btn-primary" onClick={processPayment} style={{ flex: 1 }} disabled={loading}>
                <i className="fas fa-check"></i> Valider le paiement
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