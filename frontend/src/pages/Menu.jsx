import React, { useState } from 'react';
import { useAuth } from '../Context/AuthContext';
import DataTable from '../components/Common/DataTable';
import Modal from '../components/Common/Modal';
import { mockData } from '../Data/mockData';

const Menu = () => {
  const { user } = useAuth();
  const [plats, setPlats] = useState(mockData.plats);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ nom: '', description: '', prix: '', categorie: 'Plat principal' });

  const handleAddPlat = () => {
    const newPlat = {
      id: plats.length + 1,
      ...formData,
      prix: parseFloat(formData.prix)
    };
    setPlats([...plats, newPlat]);
    setIsModalOpen(false);
    setFormData({ nom: '', description: '', prix: '', categorie: 'Plat principal' });
  };

  const handleDeletePlat = (plat) => {
    if (window.confirm('Supprimer ce plat ?')) {
      setPlats(plats.filter(p => p.id !== plat.id));
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
        <h2>Carte & Menu</h2>
        {user?.role === 'admin' && (
          <button className="btn-primary" onClick={() => setIsModalOpen(true)}>
            <i className="fas fa-plus"></i> Ajouter un plat
          </button>
        )}
      </div>
      
      <DataTable
        columns={[
          { key: 'id', label: 'ID' },
          { key: 'nom', label: 'Nom' },
          { key: 'description', label: 'Description' },
          { key: 'prix', label: 'Prix' },
          { key: 'categorie', label: 'Catégorie' }
        ]}
        data={plats}
        actions={user?.role === 'admin' ? [
          { label: 'Supprimer', icon: 'fa-trash', className: 'btn-danger', onClick: handleDeletePlat }
        ] : []}
      />

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Ajouter un plat">
        <div className="form-group">
          <label>Nom</label>
          <input type="text" value={formData.nom} onChange={(e) => setFormData({ ...formData, nom: e.target.value })} />
        </div>
        <div className="form-group">
          <label>Description</label>
          <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
        </div>
        <div className="form-group">
          <label>Prix</label>
          <input type="number" step="0.01" value={formData.prix} onChange={(e) => setFormData({ ...formData, prix: e.target.value })} />
        </div>
        <div className="form-group">
          <label>Catégorie</label>
          <select value={formData.categorie} onChange={(e) => setFormData({ ...formData, categorie: e.target.value })}>
            <option>Entrée</option>
            <option>Plat principal</option>
            <option>Dessert</option>
            <option>Boisson</option>
          </select>
        </div>
        <button className="btn-primary" onClick={handleAddPlat}>Ajouter plat</button>
      </Modal>
    </div>
  );
};

export default Menu;