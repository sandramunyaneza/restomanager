import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import DataTable from '../components/Common/DataTable';
import Modal from '../components/Common/Modal';
import * as stockService from '../services/stockService';

const Stock = () => {
  const { user } = useAuth();
  const [stocks, setStocks] = useState([]);
  const [mouvements, setMouvements] = useState([]);
  const [selectedIngredient, setSelectedIngredient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isMouvementModalOpen, setIsMouvementModalOpen] = useState(false);
  const [isFicheModalOpen, setIsFicheModalOpen] = useState(false);
  const [ficheData, setFicheData] = useState(null);
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10));
  const [endDate, setEndDate] = useState(new Date().toISOString().slice(0, 10));
  const [formData, setFormData] = useState({
    libelle_ingredient: '',
    unite_mesure: 'kg',
    quantite_en_stock: 0,
    quantite_seuil_alerte: 5
  });
  const [mouvementData, setMouvementData] = useState({
    variation_quantite: 0,
    motif_mouvement: ''
  });

  const loadStocks = async () => {
    try {
      setError('');
      const rows = await stockService.fetchIngredients();
      setStocks(rows);
    } catch (err) {
      if (err.response?.status === 403) {
        setError('Accès non autorisé au stock');
      } else {
        setError('Erreur lors du chargement');
      }
    } finally {
      setLoading(false);
    }
  };

  const loadMouvements = async (ingredientId, start, end) => {
    try {
      const rows = await stockService.fetchMouvements(ingredientId, start, end);
      setMouvements(rows);
    } catch (err) {
      console.error('Erreur chargement mouvements:', err);
    }
  };

  useEffect(() => {
    loadStocks();
  }, []);

  const tableRows = useMemo(() =>
    stocks.map((s) => ({
      id: s.id,
      nomingredient: s.libelle_ingredient,
      unite: s.unite_mesure,
      quantite: Number(s.quantite_en_stock),
      seuilMin: Number(s.quantite_seuil_alerte),
      statut: Number(s.quantite_en_stock) < Number(s.quantite_seuil_alerte) ? '🔴 Alerte' : '✅ OK',
    })),
    [stocks]
  );

  const handleAddIngredient = async () => {
    try {
      await stockService.createIngredient(formData);
      await loadStocks();
      setIsAddModalOpen(false);
      setFormData({ libelle_ingredient: '', unite_mesure: 'kg', quantite_en_stock: 0, quantite_seuil_alerte: 5 });
      showNotification('Ingrédient ajouté avec succès', 'success');
    } catch (err) {
      showNotification(err.response?.data?.detail || 'Erreur lors de l\'ajout', 'error');
    }
  };

  const handleEditIngredient = async () => {
    try {
      await stockService.updateIngredient(selectedIngredient.id, {
        libelle_ingredient: formData.libelle_ingredient,
        unite_mesure: formData.unite_mesure,
        quantite_seuil_alerte: formData.quantite_seuil_alerte
      });
      await loadStocks();
      setIsEditModalOpen(false);
      showNotification('Ingrédient modifié avec succès', 'success');
    } catch (err) {
      showNotification(err.response?.data?.detail || 'Erreur lors de la modification', 'error');
    }
  };

  const handleDeleteIngredient = async (ingredient) => {
    if (window.confirm(`Supprimer ${ingredient.nomingredient} ?`)) {
      try {
        await stockService.deleteIngredient(ingredient.id);
        await loadStocks();
        showNotification('Ingrédient supprimé', 'success');
      } catch (err) {
        showNotification('Erreur lors de la suppression', 'error');
      }
    }
  };

  const handleAdjustStock = async () => {
    try {
      await stockService.adjustIngredientStock(selectedIngredient.id, {
        variation_quantite: mouvementData.variation_quantite,
        motif_mouvement: mouvementData.motif_mouvement
      });
      await loadStocks();
      setIsMouvementModalOpen(false);
      setMouvementData({ variation_quantite: 0, motif_mouvement: '' });
      showNotification('Mouvement enregistré', 'success');
    } catch (err) {
      showNotification(err.response?.data?.detail || 'Erreur', 'error');
    }
  };

  const handlePrintFiche = async () => {
    try {
      const data = await stockService.getFicheStock(selectedIngredient.id, startDate, endDate);
      setFicheData(data);
      setIsFicheModalOpen(true);
    } catch (err) {
      showNotification('Erreur lors de la génération', 'error');
    }
  };

  const printFiche = () => {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Fiche de stock - ${ficheData.ingredient.libelle_ingredient}</title>
        <meta charset="UTF-8">
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Segoe UI', Arial, sans-serif; padding: 40px; background: #f5f5f5; }
          .fiche { max-width: 1000px; margin: 0 auto; background: white; border-radius: 16px; box-shadow: 0 10px 40px rgba(0,0,0,0.1); overflow: hidden; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; }
          .header h1 { font-size: 28px; margin-bottom: 8px; }
          .body { padding: 30px; }
          .info { display: flex; justify-content: space-between; margin-bottom: 30px; flex-wrap: wrap; gap: 15px; }
          .info-box { background: #f8f9fa; padding: 15px 25px; border-radius: 12px; flex: 1; min-width: 180px; }
          .info-box h4 { color: #667eea; margin-bottom: 8px; font-size: 12px; text-transform: uppercase; }
          .info-box p { font-size: 18px; font-weight: 600; }
          .summary { display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; margin: 30px 0; }
          .summary-card { background: #f8f9fa; padding: 15px; border-radius: 12px; text-align: center; }
          .summary-card .value { font-size: 24px; font-weight: bold; }
          .summary-card .label { color: #666; font-size: 12px; margin-top: 5px; }
          table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          th { background: #f8f9fa; padding: 12px; text-align: left; border-bottom: 2px solid #e0e0e0; }
          td { padding: 12px; border-bottom: 1px solid #eee; }
          .entree { color: #28a745; font-weight: bold; }
          .sortie { color: #dc3545; font-weight: bold; }
          .footer { background: #f8f9fa; padding: 20px; text-align: center; color: #666; font-size: 12px; }
          @media print { body { background: white; padding: 0; } .fiche { box-shadow: none; } }
        </style>
      </head>
      <body>
        <div class="fiche">
          <div class="header">
            <h1>🍽️ RestoManager</h1>
            <p>Fiche de stock</p>
          </div>
          <div class="body">
            <div class="info">
              <div class="info-box"><h4>INGRÉDIENT</h4><p>${ficheData.ingredient.libelle_ingredient}</p></div>
              <div class="info-box"><h4>UNITÉ</h4><p>${ficheData.ingredient.unite_mesure}</p></div>
              <div class="info-box"><h4>PÉRIODE</h4><p>${ficheData.periode.debut} → ${ficheData.periode.fin}</p></div>
            </div>
            <div class="summary">
              <div class="summary-card"><div class="value">${ficheData.stock_initial}</div><div class="label">Stock Initial</div></div>
              <div class="summary-card"><div class="value" style="color:#28a745">+${ficheData.total_entrees}</div><div class="label">Entrées</div></div>
              <div class="summary-card"><div class="value" style="color:#dc3545">-${ficheData.total_sorties}</div><div class="label">Sorties</div></div>
              <div class="summary-card"><div class="value" style="color:#667eea">${ficheData.stock_final}</div><div class="label">Stock Final</div></div>
            </div>
            <h3>Détail des mouvements</h3>
            <table>
              <thead><tr><th>Date</th><th>Type</th><th>Quantité</th><th>Motif</th><th>Stock après</th></tr></thead>
              <tbody>
                ${ficheData.mouvements.map(m => `
                  <tr>
                    <td>${new Date(m.cree_le).toLocaleDateString()}</td>
                    <td class="${parseFloat(m.variation_quantite) > 0 ? 'entree' : 'sortie'}">${parseFloat(m.variation_quantite) > 0 ? '📥 Entrée' : '📤 Sortie'}</td>
                    <td class="${parseFloat(m.variation_quantite) > 0 ? 'entree' : 'sortie'}">${Math.abs(parseFloat(m.variation_quantite))}</td>
                    <td>${m.motif_mouvement || '-'}</td>
                    <td>${parseFloat(m.nouveau_stock).toFixed(2)}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
          <div class="footer"><p>Document généré le ${new Date().toLocaleDateString()}</p></div>
        </div>
        <script>window.onload = function() { window.print(); setTimeout(window.close, 500); };</script>
      </body>
      </html>
    `);
    printWindow.document.close();
  };

  const showNotification = (msg, type = 'success') => {
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.textContent = msg;
    notification.style.background = type === 'success' ? '#28a745' : '#dc3545';
    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 3000);
  };

  if (error) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <div style={{ color: '#d63031', marginBottom: '20px' }}>
          <i className="fas fa-exclamation-triangle" style={{ fontSize: '48px' }}></i>
          <h2>Accès refusé</h2>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  const isMagasinier = user?.role === 'admin' || user?.role === 'magasinier';

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
        <h2>📦 Gestion des stocks</h2>
        {isMagasinier && (
          <button className="btn-primary" onClick={() => setIsAddModalOpen(true)}>
            <i className="fas fa-plus"></i> Ajouter un ingrédient
          </button>
        )}
      </div>

      {loading ? (
        <div className="data-table" style={{ padding: '40px', textAlign: 'center' }}>
          <i className="fas fa-spinner fa-spin"></i> Chargement...
        </div>
      ) : (
        <DataTable
          columns={[
            { key: 'id', label: 'ID' },
            { key: 'nomingredient', label: 'Ingrédient' },
            { key: 'unite', label: 'Unité' },
            { key: 'quantite', label: 'Quantité' },
            { key: 'seuilMin', label: 'Seuil' },
            { key: 'statut', label: 'Statut' }
          ]}
          data={tableRows}
          actions={isMagasinier ? [
            { label: 'Modifier', icon: 'fa-edit', className: 'btn-secondary', onClick: (row) => {
              const ing = stocks.find(s => s.id === row.id);
              setSelectedIngredient(ing);
              setFormData({
                libelle_ingredient: ing.libelle_ingredient,
                unite_mesure: ing.unite_mesure,
                quantite_en_stock: ing.quantite_en_stock,
                quantite_seuil_alerte: ing.quantite_seuil_alerte
              });
              setIsEditModalOpen(true);
            }},
            { label: 'Supprimer', icon: 'fa-trash', className: 'btn-danger', onClick: handleDeleteIngredient },
            { label: 'Mouvement', icon: 'fa-exchange-alt', className: 'btn-primary', onClick: (row) => {
              const ing = stocks.find(s => s.id === row.id);
              setSelectedIngredient(ing);
              setMouvementData({ variation_quantite: 0, motif_mouvement: '' });
              setIsMouvementModalOpen(true);
            }},
            { label: 'Fiche stock', icon: 'fa-file-pdf', className: 'btn-success', onClick: (row) => {
              const ing = stocks.find(s => s.id === row.id);
              setSelectedIngredient(ing);
              setIsFicheModalOpen(true);
            }}
          ] : []}
        />
      )}

      {/* Modal Ajout */}
      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Ajouter un ingrédient">
        <div className="form-group"><label>Nom</label><input value={formData.libelle_ingredient} onChange={(e) => setFormData({...formData, libelle_ingredient: e.target.value})} /></div>
        <div className="form-group"><label>Unité</label><select value={formData.unite_mesure} onChange={(e) => setFormData({...formData, unite_mesure: e.target.value})}><option>kg</option><option>L</option><option>unité</option><option>g</option></select></div>
        <div className="form-group"><label>Stock initial</label><input type="number" step="0.1" value={formData.quantite_en_stock} onChange={(e) => setFormData({...formData, quantite_en_stock: parseFloat(e.target.value)})} /></div>
        <div className="form-group"><label>Seuil d'alerte</label><input type="number" step="0.1" value={formData.quantite_seuil_alerte} onChange={(e) => setFormData({...formData, quantite_seuil_alerte: parseFloat(e.target.value)})} /></div>
        <button className="btn-primary" onClick={handleAddIngredient}>Ajouter</button>
      </Modal>

      {/* Modal Modification */}
      <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="Modifier l'ingrédient">
        <div className="form-group"><label>Nom</label><input value={formData.libelle_ingredient} onChange={(e) => setFormData({...formData, libelle_ingredient: e.target.value})} /></div>
        <div className="form-group"><label>Unité</label><select value={formData.unite_mesure} onChange={(e) => setFormData({...formData, unite_mesure: e.target.value})}><option>kg</option><option>L</option><option>unité</option><option>g</option></select></div>
        <div className="form-group"><label>Seuil d'alerte</label><input type="number" step="0.1" value={formData.quantite_seuil_alerte} onChange={(e) => setFormData({...formData, quantite_seuil_alerte: parseFloat(e.target.value)})} /></div>
        <button className="btn-primary" onClick={handleEditIngredient}>Enregistrer</button>
      </Modal>

      {/* Modal Mouvement */}
      <Modal isOpen={isMouvementModalOpen} onClose={() => setIsMouvementModalOpen(false)} title={`Mouvement - ${selectedIngredient?.libelle_ingredient}`}>
        <div className="form-group"><label>Quantité (+ entrée / - sortie)</label><input type="number" step="0.1" value={mouvementData.variation_quantite} onChange={(e) => setMouvementData({...mouvementData, variation_quantite: parseFloat(e.target.value)})} /></div>
        <div className="form-group"><label>Motif</label><input value={mouvementData.motif_mouvement} onChange={(e) => setMouvementData({...mouvementData, motif_mouvement: e.target.value})} placeholder="Achat, usage, perte, etc." /></div>
        <button className="btn-primary" onClick={handleAdjustStock}>Enregistrer</button>
      </Modal>

      {/* Modal Fiche Stock */}
      <Modal isOpen={isFicheModalOpen} onClose={() => setIsFicheModalOpen(false)} title={`Fiche de stock - ${selectedIngredient?.libelle_ingredient}`}>
        <div className="form-group"><label>Date début</label><input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} /></div>
        <div className="form-group"><label>Date fin</label><input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} /></div>
        <button className="btn-primary" onClick={handlePrintFiche}>Générer et imprimer</button>
      </Modal>

      {/* Modal Aperçu Fiche */}
      <Modal isOpen={ficheData !== null} onClose={() => setFicheData(null)} title={`Fiche - ${ficheData?.ingredient?.libelle_ingredient}`}>
        {ficheData && (
          <div>
            <div style={{ marginBottom: '15px' }}>
              <p><strong>Stock initial:</strong> {ficheData.stock_initial}</p>
              <p><strong>Entrées:</strong> +{ficheData.total_entrees}</p>
              <p><strong>Sorties:</strong> -{ficheData.total_sorties}</p>
              <p><strong>Stock final:</strong> {ficheData.stock_final}</p>
            </div>
            <button className="btn-primary" onClick={printFiche}>🖨️ Imprimer la fiche</button>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Stock;