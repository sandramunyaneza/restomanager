import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import DataTable from '../components/Common/DataTable';
import Modal from '../components/Common/Modal';
import * as stockService from '../services/stockService';

const Stock = () => {
  const { user } = useAuth();
  const [stocks, setStocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ nomingredient: '', quantite: '', seuilMin: '' });

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const rows = await stockService.fetchIngredients();
        if (!alive) return;
        setStocks(rows);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const tableRows = useMemo(
    () =>
      stocks.map((s) => ({
        id: s.id,
        nomingredient: s.libelle_ingredient,
        quantite: Number(s.quantite_en_stock),
        seuilMin: Number(s.quantite_seuil_alerte),
        statut: Number(s.quantite_en_stock) < Number(s.quantite_seuil_alerte) ? 'Alerte' : 'OK',
      })),
    [stocks]
  );

  const handleAddIngredient = async () => {
    // L’API backend ne propose pas la création d’ingrédients ici (uniquement list + adjust).
    // On garde la création UI en local pour l’instant.
    const quantite = parseFloat(formData.quantite || 0);
    const seuilMin = parseFloat(formData.seuilMin || 0);
    const newIngredient = {
      id: Math.max(0, ...stocks.map((s) => s.id)) + 1,
      libelle_ingredient: formData.nomingredient,
      unite_mesure: 'u',
      quantite_en_stock: quantite,
      quantite_seuil_alerte: seuilMin,
    };
    setStocks((prev) => [newIngredient, ...prev]);
    setIsModalOpen(false);
    setFormData({ nomingredient: '', quantite: '', seuilMin: '' });
  };

  const handleReappro = (stock) => {
    (async () => {
      try {
        await stockService.adjustIngredientStock(stock.id, {
          variation_quantite: 10,
          motif_mouvement: 'Réapprovisionnement (UI)',
        });
        const refreshed = await stockService.fetchIngredients();
        setStocks(refreshed);
      } catch {
        // fallback local
        const updated = stocks.map((s) => {
          if (s.id === stock.id) {
            return { ...s, quantite_en_stock: Number(s.quantite_en_stock) + 10 };
          }
          return s;
        });
        setStocks(updated);
      }
    })();
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
        <h2>Gestion des stocks</h2>
        {user?.role === 'admin' && (
          <button className="btn-primary" onClick={() => setIsModalOpen(true)}>
            <i className="fas fa-plus"></i> Ajouter ingrédient
          </button>
        )}
      </div>
      
      <DataTable
        columns={[
          { key: 'id', label: 'ID' },
          { key: 'nomingredient', label: 'Ingrédient' },
          { key: 'quantite', label: 'Quantité' },
          { key: 'seuilMin', label: 'Seuil min' },
          { key: 'statut', label: 'Statut' }
        ]}
        data={tableRows}
        actions={[
          { label: 'Réappro', icon: 'fa-plus', className: 'btn-secondary', onClick: handleReappro }
        ]}
      />

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Ajouter ingrédient">
        <div className="form-group">
          <label>Ingrédient</label>
          <input type="text" value={formData.nomingredient} onChange={(e) => setFormData({ ...formData, nomingredient: e.target.value })} />
        </div>
        <div className="form-group">
          <label>Quantité</label>
          <input type="number" value={formData.quantite} onChange={(e) => setFormData({ ...formData, quantite: e.target.value })} />
        </div>
        <div className="form-group">
          <label>Seuil minimum</label>
          <input type="number" value={formData.seuilMin} onChange={(e) => setFormData({ ...formData, seuilMin: e.target.value })} />
        </div>
        <button className="btn-primary" onClick={handleAddIngredient} disabled={loading}>
          Ajouter
        </button>
      </Modal>
    </div>
  );
};

export default Stock;