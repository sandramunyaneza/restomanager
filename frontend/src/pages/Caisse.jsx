import React, { useState, useEffect } from 'react';
import { useAuth } from '../Context/AuthContext';
import DataTable from '../components/Common/DataTable';
import Modal from '../components/Common/Modal';
import { mockData } from '../Data/mockData';

const Caisse = () => {
  const { user } = useAuth();
  const [commandes, setCommandes] = useState(mockData.commandes);
  const [factures, setFactures] = useState(mockData.factures);
  const [paiements, setPaiements] = useState(mockData.paiements);
  const [selectedCommande, setSelectedCommande] = useState(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('Carte bancaire');
  const [stats, setStats] = useState({
    totalCA: 0,
    totalPaye: 0,
    totalImpaye: 0,
    transactionsJour: 0
  });

  useEffect(() => {
    // Calcul des statistiques de caisse
    const totalCA = commandes.reduce((sum, cmd) => sum + cmd.montantTotal, 0);
    const totalPaye = factures.filter(f => f.paye).reduce((sum, f) => sum + f.montantTTC, 0);
    const totalImpaye = commandes.filter(c => !c.paye && c.statutCommande === 'livree').reduce((sum, c) => sum + c.montantTotal, 0);
    const transactionsJour = paiements.filter(p => p.date.startsWith(new Date().toISOString().split('T')[0])).length;

    setStats({
      totalCA,
      totalPaye,
      totalImpaye,
      transactionsJour
    });
  }, [commandes, factures, paiements]);

  const handlePayment = (commande) => {
    setSelectedCommande(commande);
    setIsPaymentModalOpen(true);
  };

  const processPayment = () => {
    if (!selectedCommande) return;

    // Mettre à jour le statut de paiement de la commande
    const updatedCommandes = commandes.map(cmd => 
      cmd.id === selectedCommande.id ? { ...cmd, paye: true } : cmd
    );
    setCommandes(updatedCommandes);

    // Créer la facture
    const montantHT = selectedCommande.montantTotal / 1.2;
    const tva = selectedCommande.montantTotal - montantHT;
    const newFacture = {
      numero: `F${new Date().getFullYear()}${String(factures.length + 1).padStart(4, '0')}`,
      date: new Date().toISOString().split('T')[0],
      client: selectedCommande.client,
      montantHT: montantHT.toFixed(2),
      tva: tva.toFixed(2),
      montantTTC: selectedCommande.montantTotal,
      paye: true,
      modePaiement: paymentMethod
    };
    setFactures([...factures, newFacture]);

    // Enregistrer le paiement
    const newPaiement = {
      id: paiements.length + 1,
      commandeId: selectedCommande.id,
      montant: selectedCommande.montantTotal,
      mode: paymentMethod,
      date: new Date().toLocaleString(),
      statut: 'validé',
      encaissePar: user.nom
    };
    setPaiements([...paiements, newPaiement]);

    setIsPaymentModalOpen(false);
    setSelectedCommande(null);
    showNotification(`Paiement de ${selectedCommande.montantTotal}€ encaissé avec succès !`);
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

  // Commandes à encaisser (livrées mais non payées)
  const commandesAEncaisser = commandes.filter(cmd => cmd.statutCommande === 'livree' && !cmd.paye);
  
  // Commandes payées
  const commandesPayees = commandes.filter(cmd => cmd.paye);

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
                <option>Ticket restaurant</option>
                <option>Virement</option>
                <option>Mobile pay</option>
              </select>
            </div>
            <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
              <button className="btn-primary" onClick={processPayment} style={{ flex: 1 }}>
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