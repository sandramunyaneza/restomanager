import React, { useState } from 'react';
import { useAuth } from '../Context/AuthContext';
import DataTable from '../components/Common/DataTable';
import Modal from '../components/Common/Modal';
import { mockData } from '../Data/mockData';

const Utilisateurs = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState(mockData.users);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ nom: '', email: '', telephone: '', role: 'client' });

  if (user?.role !== 'admin') {
    return <div>Accès non autorisé</div>;
  }

  const handleAddUser = () => {
    const newUser = {
      id: users.length + 1,
      ...formData
    };
    setUsers([...users, newUser]);
    setIsModalOpen(false);
    setFormData({ nom: '', email: '', telephone: '', role: 'client' });
  };

  const handleDeleteUser = (userToDelete) => {
    if (window.confirm('Supprimer cet utilisateur ?')) {
      setUsers(users.filter(u => u.id !== userToDelete.id));
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
        data={users}
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
          <label>Téléphone</label>
          <input type="tel" value={formData.telephone} onChange={(e) => setFormData({ ...formData, telephone: e.target.value })} />
        </div>
        <div className="form-group">
          <label>Rôle</label>
          <select value={formData.role} onChange={(e) => setFormData({ ...formData, role: e.target.value })}>
            <option>client</option>
            <option>serveur</option>
            <option>cuisinier</option>
            <option>admin</option>
          </select>
        </div>
        <button className="btn-primary" onClick={handleAddUser}>Ajouter</button>
      </Modal>
    </div>
  );
};

export default Utilisateurs;