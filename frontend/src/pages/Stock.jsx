import { useState } from 'react';
import { useAuth } from '../Context/AuthContext';
import DataTable from '../components/Common/DataTable';
import Modal from '../components/Common/Modal';
import { mockData } from '../Data/mockData';

const Stock = () => {
  const { user } = useAuth();
  const [stocks, setStocks] = useState(mockData.stocks);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ nomingredient: '', quantite: '', seuilMin: '' });

  const handleAddIngredient = () => {
    const quantite = parseInt(formData.quantite);
    const seuilMin = parseInt(formData.seuilMin);
    const newIngredient = {
      id: stocks.length + 1,
      ...formData,
      quantite: quantite,
      seuilMin: seuilMin,
      statut: quantite < seuilMin ? 'Alerte' : 'OK'
    };
    setStocks([...stocks, newIngredient]);
    setIsModalOpen(false);
    setFormData({ nomingredient: '', quantite: '', seuilMin: '' });
  };

  const handleReappro = (stock) => {
    const updated = stocks.map(s => {
      if (s.id === stock.id) {
        const newQuantite = s.quantite + 10;
        return { ...s, quantite: newQuantite, statut: newQuantite >= s.seuilMin ? 'OK' : 'Alerte' };
      }
      return s;
    });
    setStocks(updated);
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
        data={stocks}
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
        <button className="btn-primary" onClick={handleAddIngredient}>Ajouter</button>
      </Modal>
    </div>
  );
};

export default Stock;