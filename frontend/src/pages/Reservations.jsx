import React, { useState } from 'react';
import { useAuth } from '../Context/AuthContext';
import DataTable from '../components/Common/DataTable';
import Modal from '../components/Common/Modal';
import { mockData } from '../Data/mockData';

const Reservations = () => {
  const { user } = useAuth();
  const [reservations, setReservations] = useState(mockData.reservations);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ client: '', date: '', heure: '', personnes: '' });

  const filteredReservations = user?.role === 'client' 
    ? reservations.filter(r => r.client === user.nom)
    : reservations;

  const handleAddReservation = () => {
    const newReservation = {
      id: reservations.length + 1,
      ...formData,
      personnes: parseInt(formData.personnes),
      table: 'T' + (Math.floor(Math.random() * 20) + 1),
      statut: 'confirmée'
    };
    setReservations([...reservations, newReservation]);
    setIsModalOpen(false);
    setFormData({ client: '', date: '', heure: '', personnes: '' });
  };

  const handleDeleteReservation = (reservation) => {
    if (window.confirm('Annuler cette réservation ?')) {
      setReservations(reservations.filter(r => r.id !== reservation.id));
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
        <h2>Gestion des réservations</h2>
        <button className="btn-primary" onClick={() => setIsModalOpen(true)}>
          <i className="fas fa-plus"></i> Nouvelle réservation
        </button>
      </div>
      
      <DataTable
        columns={[
          { key: 'id', label: 'ID' },
          { key: 'client', label: 'Client' },
          { key: 'date', label: 'Date' },
          { key: 'heure', label: 'Heure' },
          { key: 'personnes', label: 'Personnes' },
          { key: 'table', label: 'Table' },
          { key: 'statut', label: 'Statut' }
        ]}
        data={filteredReservations}
        actions={[
          { label: 'Annuler', icon: 'fa-trash', className: 'btn-danger', onClick: handleDeleteReservation }
        ]}
      />

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Nouvelle réservation">
        <div className="form-group">
          <label>Client</label>
          <input type="text" value={formData.client} onChange={(e) => setFormData({ ...formData, client: e.target.value })} />
        </div>
        <div className="form-group">
          <label>Date</label>
          <input type="date" value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} />
        </div>
        <div className="form-group">
          <label>Heure</label>
          <input type="time" value={formData.heure} onChange={(e) => setFormData({ ...formData, heure: e.target.value })} />
        </div>
        <div className="form-group">
          <label>Personnes</label>
          <input type="number" value={formData.personnes} onChange={(e) => setFormData({ ...formData, personnes: e.target.value })} />
        </div>
        <button className="btn-primary" onClick={handleAddReservation}>Créer réservation</button>
      </Modal>
    </div>
  );
};

export default Reservations;