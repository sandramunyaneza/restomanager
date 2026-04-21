import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import DataTable from '../components/Common/DataTable';
import Modal from '../components/Common/Modal';
import * as usersService from '../services/usersService';

const Utilisateurs = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    nom: '',
    email: '',
    telephone: '',
    role: 'client',
    motDePasse: 'Password123!',
  });

  if (user?.role !== 'admin') {
    return <div>Accès non autorisé</div>;
  }

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const rows = await usersService.fetchUsers();
        if (!alive) return;
        setUsers(rows);
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
      users.map((u) => ({
        id: u.id,
        nom: u.nom_complet,
        email: u.courriel,
        telephone: u.numero_telephone ?? '',
        role: u.profil,
        compte_actif: u.compte_actif,
      })),
    [users]
  );

  const handleAddUser = async () => {
    const payload = {
      courriel: formData.email,
      mot_de_passe: formData.motDePasse,
      nom_complet: formData.nom,
      numero_telephone: formData.telephone || null,
      profil: formData.role,
    };
    const created = await usersService.createUser(payload);
    setUsers((prev) => [created, ...prev]);
    setIsModalOpen(false);
    setFormData({ nom: '', email: '', telephone: '', role: 'client', motDePasse: 'Password123!' });
  };

  const handleDeleteUser = (userToDelete) => {
    if (window.confirm('Supprimer cet utilisateur ?')) {
      // Endpoint DELETE non implémenté côté backend : on retire côté UI uniquement.
      setUsers(users.filter((u) => u.id !== userToDelete.id));
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
        <h2>Gestion des utilisateurs</h2>
        <button className="btn-primary" onClick={() => setIsModalOpen(true)}>
          <i className="fas fa-user-plus"></i> Ajouter utilisateur
        </button>
      </div>
      
      <DataTable
        columns={[
          { key: 'id', label: 'ID' },
          { key: 'nom', label: 'Nom' },
          { key: 'email', label: 'Email' },
          { key: 'telephone', label: 'Téléphone' },
          { key: 'role', label: 'Rôle' }
        ]}
        data={tableRows}
        actions={[
          { label: 'Supprimer', icon: 'fa-trash', className: 'btn-danger', onClick: handleDeleteUser }
        ]}
      />

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Ajouter utilisateur">
        <div className="form-group">
          <label>Nom</label>
          <input type="text" value={formData.nom} onChange={(e) => setFormData({ ...formData, nom: e.target.value })} />
        </div>
        <div className="form-group">
          <label>Email</label>
          <input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
        </div>
        <div className="form-group">
          <label>Mot de passe (création)</label>
          <input
            type="password"
            value={formData.motDePasse}
            onChange={(e) => setFormData({ ...formData, motDePasse: e.target.value })}
          />
        </div>
        <div className="form-group">
          <label>Téléphone</label>
          <input type="tel" value={formData.telephone} onChange={(e) => setFormData({ ...formData, telephone: e.target.value })} />
        </div>
        <div className="form-group">
          <label>Rôle</label>
          <select value={formData.role} onChange={(e) => setFormData({ ...formData, role: e.target.value })}>
            <option value="client">client</option>
            <option value="caissier">caissier</option>
            <option value="cuisinier">cuisinier</option>
            <option value="livreur">livreur</option>
            <option value="magasinier">magasinier</option>
            <option value="admin">admin</option>
          </select>
        </div>
        <button className="btn-primary" onClick={handleAddUser} disabled={loading}>
          Ajouter
        </button>
      </Modal>
    </div>
  );
};

export default Utilisateurs;