import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import DataTable from '../components/Common/DataTable';
import Modal from '../components/Common/Modal';
import * as productsService from '../services/productsService';

const Menu = () => {
  const { user } = useAuth();
  const [plats, setPlats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ nom: '', description: '', prix: '', categorie: 'Plat principal' });

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const rows = await productsService.fetchProducts();
        if (!alive) return;
        setPlats(rows);
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
        categorie: p.id_categorie ? `Catégorie #${p.id_categorie}` : '',
        est_disponible: p.est_disponible,
      })),
    [plats]
  );

  const handleAddPlat = async () => {
    // Côté API: création admin uniquement, nécessite id_categorie.
    // Ici on ne gère pas le mapping libellé->id, donc on crée par défaut en catégorie 1.
    const payload = {
      id_categorie: 1,
      nom_produit: formData.nom,
      description_detaillee: formData.description,
      prix_tarif: Number(formData.prix || 0),
      est_disponible: true,
    };
    const created = await productsService.createProduct(payload);
    setPlats((prev) => [...prev, created]);
    setIsModalOpen(false);
    setFormData({ nom: '', description: '', prix: '', categorie: 'Plat principal' });
  };

  const handleDeletePlat = (plat) => {
    if (window.confirm('Supprimer ce plat ?')) {
      // Endpoint DELETE non implémenté côté backend : on retire côté UI uniquement.
      setPlats(plats.filter((p) => p.id !== plat.id));
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
        data={tableRows}
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
        <button className="btn-primary" onClick={handleAddPlat} disabled={loading}>
          Ajouter plat
        </button>
      </Modal>
    </div>
  );
};

export default Menu;