import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import DataTable from '../components/Common/DataTable';
import Modal from '../components/Common/Modal';
import * as productsService from '../services/productsService';

const Menu = () => {
  const { user } = useAuth();
  const [plats, setPlats] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedPlat, setSelectedPlat] = useState(null);
  const [formData, setFormData] = useState({ 
    nom: '', 
    description: '', 
    prix: '', 
    id_categorie: 1 
  });

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const [rows, cats] = await Promise.all([
          productsService.fetchProducts(),
          productsService.fetchCategories()
        ]);
        if (!alive) return;
        setPlats(rows);
        setCategories(cats);
      } catch (error) {
        console.error('Erreur chargement:', error);
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
      plats.map((p) => ({
        id: p.id,
        nom: p.nom_produit,
        description: p.description_detaillee,
        prix: Number(p.prix_tarif),
        categorie: categories.find(c => c.id === p.id_categorie)?.libelle || `Catégorie #${p.id_categorie}`,
        est_disponible: p.est_disponible,
        id_categorie: p.id_categorie
      })),
    [plats, categories]
  );

  const handleOpenAddModal = () => {
    setFormData({ nom: '', description: '', prix: '', id_categorie: categories[0]?.id || 1 });
    setIsAddModalOpen(true);
  };

  const handleOpenEditModal = (plat) => {
    setSelectedPlat(plat);
    setFormData({
      nom: plat.nom,
      description: plat.description,
      prix: plat.prix,
      id_categorie: plat.id_categorie
    });
    setIsEditModalOpen(true);
  };

  const handleAddPlat = async () => {
    const payload = {
      id_categorie: formData.id_categorie,
      nom_produit: formData.nom,
      description_detaillee: formData.description,
      prix_tarif: Number(formData.prix || 0),
      est_disponible: true,
    };
    try {
      const created = await productsService.createProduct(payload);
      setPlats((prev) => [...prev, created]);
      setIsAddModalOpen(false);
      setFormData({ nom: '', description: '', prix: '', id_categorie: categories[0]?.id || 1 });
      showNotification('Plat ajouté avec succès', 'success');
    } catch (error) {
      console.error('Erreur ajout:', error);
      showNotification(error.response?.data?.detail || 'Erreur lors de l\'ajout', 'error');
    }
  };

  const handleEditPlat = async () => {
    try {
      const updated = await productsService.updateProduct(selectedPlat.id, {
        nom_produit: formData.nom,
        description_detaillee: formData.description,
        prix_tarif: Number(formData.prix || 0),
        id_categorie: formData.id_categorie
      });
      setPlats((prev) => prev.map(p => p.id === selectedPlat.id ? updated : p));
      setIsEditModalOpen(false);
      setSelectedPlat(null);
      showNotification('Plat modifié avec succès', 'success');
    } catch (error) {
      console.error('Erreur modification:', error);
      showNotification(error.response?.data?.detail || 'Erreur lors de la modification', 'error');
    }
  };

  const handleDeletePlat = async (plat) => {
    if (window.confirm(`Supprimer "${plat.nom}" ?`)) {
      try {
        await productsService.deleteProduct(plat.id);
        setPlats(plats.filter((p) => p.id !== plat.id));
        showNotification('Plat supprimé avec succès', 'success');
      } catch (error) {
        console.error('Erreur suppression:', error);
        showNotification(error.response?.data?.detail || 'Erreur lors de la suppression', 'error');
      }
    }
  };

  const showNotification = (msg, type = 'success') => {
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.textContent = msg;
    notification.style.background = type === 'success' ? '#28a745' : '#dc3545';
    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 3000);
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
        <h2>🍽️ Carte & Menu</h2>
        {user?.role === 'admin' && (
          <button className="btn-primary" onClick={handleOpenAddModal}>
            <i className="fas fa-plus"></i> Ajouter un plat
          </button>
        )}
      </div>
      
      <DataTable
        columns={[
          { key: 'id', label: 'ID' },
          { key: 'nom', label: 'Nom' },
          { key: 'description', label: 'Description' },
          { key: 'prix', label: 'Prix (€)' },
          { key: 'categorie', label: 'Catégorie' },
          { 
            key: 'est_disponible', 
            label: 'Disponible',
            render: (row) => (
              <span style={{
                background: row.est_disponible ? '#a8e6cf20' : '#ff767520',
                color: row.est_disponible ? '#1e7e34' : '#d63031',
                padding: '4px 12px',
                borderRadius: '20px',
                fontSize: '12px',
                fontWeight: 'bold'
              }}>
                {row.est_disponible ? '✅ Oui' : '❌ Non'}
              </span>
            )
          }
        ]}
        data={tableRows}
        actions={user?.role === 'admin' ? [
          { 
            label: 'Modifier', 
            icon: 'fa-edit', 
            className: 'btn-secondary', 
            onClick: handleOpenEditModal 
          },
          { 
            label: 'Supprimer', 
            icon: 'fa-trash', 
            className: 'btn-danger', 
            onClick: handleDeletePlat 
          }
        ] : []}
      />

      {/* Modal Ajout */}
      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="➕ Ajouter un plat">
        <div className="form-group">
          <label>Nom du plat *</label>
          <input 
            type="text" 
            value={formData.nom} 
            onChange={(e) => setFormData({ ...formData, nom: e.target.value })} 
            placeholder="Ex: Pizza Margherita"
            required
          />
        </div>
        <div className="form-group">
          <label>Description</label>
          <textarea 
            value={formData.description} 
            onChange={(e) => setFormData({ ...formData, description: e.target.value })} 
            placeholder="Description détaillée du plat..."
            rows="3"
          />
        </div>
        <div className="form-group">
          <label>Prix (€) *</label>
          <input 
            type="number" 
            step="0.01" 
            value={formData.prix} 
            onChange={(e) => setFormData({ ...formData, prix: e.target.value })} 
            placeholder="0.00"
            required
          />
        </div>
        <div className="form-group">
          <label>Catégorie</label>
          <select 
            value={formData.id_categorie} 
            onChange={(e) => setFormData({ ...formData, id_categorie: parseInt(e.target.value) })}
          >
            {categories.map(cat => (
              <option key={cat.id} value={cat.id}>{cat.libelle}</option>
            ))}
          </select>
        </div>
        <button className="btn-primary" onClick={handleAddPlat} disabled={loading || !formData.nom || !formData.prix}>
          Ajouter le plat
        </button>
      </Modal>

      {/* Modal Modification */}
      <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="✏️ Modifier le plat">
        <div className="form-group">
          <label>Nom du plat *</label>
          <input 
            type="text" 
            value={formData.nom} 
            onChange={(e) => setFormData({ ...formData, nom: e.target.value })} 
            required
          />
        </div>
        <div className="form-group">
          <label>Description</label>
          <textarea 
            value={formData.description} 
            onChange={(e) => setFormData({ ...formData, description: e.target.value })} 
            rows="3"
          />
        </div>
        <div className="form-group">
          <label>Prix (€) *</label>
          <input 
            type="number" 
            step="0.01" 
            value={formData.prix} 
            onChange={(e) => setFormData({ ...formData, prix: e.target.value })} 
            required
          />
        </div>
        <div className="form-group">
          <label>Catégorie</label>
          <select 
            value={formData.id_categorie} 
            onChange={(e) => setFormData({ ...formData, id_categorie: parseInt(e.target.value) })}
          >
            {categories.map(cat => (
              <option key={cat.id} value={cat.id}>{cat.libelle}</option>
            ))}
          </select>
        </div>
        <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
          <button className="btn-primary" onClick={handleEditPlat} style={{ flex: 1 }}>
            <i className="fas fa-save"></i> Enregistrer
          </button>
          <button className="btn-secondary" onClick={() => setIsEditModalOpen(false)} style={{ flex: 1 }}>
            <i className="fas fa-times"></i> Annuler
          </button>
        </div>
      </Modal>
    </div>
  );
};

export default Menu;