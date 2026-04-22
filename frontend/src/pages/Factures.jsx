import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import DataTable from '../components/Common/DataTable';
import * as paymentsService from '../services/paymentsService';

const Factures = () => {
  const { user } = useAuth();
  const [paiements, setPaiements] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const rows = await paymentsService.fetchPayments();
        if (!alive) return;
        setPaiements(rows);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const factures = useMemo(() => {
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
        modePaiement: p.mode_reglement,
        paye: p.etat_transaction === 'valide' || p.etat_transaction === 'validé' || true,
      };
    });
  }, [paiements]);

  const handlePrint = (facture) => {
    const receiptWindow = window.open('', '_blank');
    receiptWindow.document.write(`
      <html>
        <head>
          <title>Facture ${facture.numero}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            .invoice { max-width: 800px; margin: 0 auto; border: 1px solid #ddd; padding: 20px; }
            .header { text-align: center; margin-bottom: 30px; }
            .divider { border-top: 2px solid #333; margin: 20px 0; }
            .total { font-size: 20px; font-weight: bold; margin-top: 20px; text-align: right; }
          </style>
        </head>
        <body>
          <div class="invoice">
            <div class="header">
              <h1>🍽️ RestoManager</h1>
              <h2>FACTURE ${facture.numero}</h2>
              <p>Date: ${facture.date}</p>
            </div>
            <div class="divider"></div>
            <p><strong>Client:</strong> ${facture.client}</p>
            <div class="divider"></div>
            <table style="width: 100%; border-collapse: collapse;">
              <tr style="border-bottom: 1px solid #ddd;">
                <th style="text-align: left; padding: 10px;">Description</th>
                <th style="text-align: right; padding: 10px;">Montant</th>
              </tr>
              <tr>
                <td style="padding: 10px;">Commande de repas</td>
                <td style="text-align: right; padding: 10px;">${facture.montantHT}€</td>
              </tr>
              <tr>
                <td style="padding: 10px;">TVA (20%)</td>
                <td style="text-align: right; padding: 10px;">${facture.tva}€</td>
              </tr>
            </table>
            <div class="divider"></div>
            <p class="total">Total TTC: ${facture.montantTTC}€</p>
            <p><strong>Mode de paiement:</strong> ${facture.modePaiement || 'Non spécifié'}</p>
            <p><strong>Statut:</strong> ${facture.paye ? 'Payée ✅' : 'Impayée ❌'}</p>
            <div class="divider"></div>
            <p style="text-align: center;">Merci de votre confiance !</p>
          </div>
          <script>window.print();</script>
        </body>
      </html>
    `);
  };

  const handleMarkAsPaid = (facture) => {
    showNotification(`Paiement ${facture.numero} déjà enregistré côté API.`);
  };

  const showNotification = (msg) => {
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.textContent = msg;
    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 3000);
  };

  const getActions = () => {
    const actions = [
      { label: 'Imprimer', icon: 'fa-print', className: 'btn-primary', onClick: handlePrint }
    ];
    
    if (user?.role === 'caissier' || user?.role === 'admin') {
      actions.push({ 
        label: 'Marquer payée', 
        icon: 'fa-check', 
        className: 'btn-secondary', 
        onClick: (row) => !row.paye && handleMarkAsPaid(row) 
      });
    }
    
    return actions;
  };

  return (
    <div>
      <div style={{ marginBottom: '20px' }}>
        <h2>Factures</h2>
      </div>
      
      <DataTable
        columns={[
          { key: 'numero', label: 'N° Facture' },
          { key: 'date', label: 'Date' },
          { key: 'client', label: 'Client' },
          { key: 'montantHT', label: 'Montant HT' },
          { key: 'tva', label: 'TVA' },
          { key: 'montantTTC', label: 'Montant TTC' },
          { key: 'modePaiement', label: 'Mode de paiement' },
          { 
            key: 'paye', 
            label: 'Statut',
            render: (row) => (
              <span className={`status ${row.paye ? 'prete' : 'en-cours'}`}>
                {row.paye ? 'Payée' : 'Impayée'}
              </span>
            )
          }
        ]}
        data={factures}
        actions={getActions()}
      />
    </div>
  );
};

export default Factures;