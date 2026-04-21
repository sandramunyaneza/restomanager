import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import DataTable from '../components/Common/DataTable';
import Modal from '../components/Common/Modal';
import * as reservationsService from '../services/reservationsService';

const Reservations = () => {
  const { user } = useAuth();
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ date: '', heure: '', personnes: '', table: '', remarques: '' });

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const rows = await reservationsService.fetchReservations();
        if (!alive) return;
        setReservations(rows);
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
      reservations.map((r) => ({
        id: r.id,
        client: r.id_utilisateur ? `Client #${r.id_utilisateur}` : '',
        date: String(r.horaire_reservation).slice(0, 10),
        heure: String(r.horaire_reservation).slice(11, 16),
        personnes: r.nombre_convives,
        table: r.designation_table,
        statut: r.etat_reservation,
      })),
    [reservations]
  );

  const handleAddReservation = async () => {
    const horaire = `${formData.date} ${formData.heure}:00`;
    const payload = {
      horaire_reservation: horaire,
      nombre_convives: Number(formData.personnes || 1),
      designation_table: formData.table || null,
      remarques_client: formData.remarques || null,
    };
    const created = await reservationsService.createReservation(payload);
    setReservations((prev) => [created, ...prev]);
    setIsModalOpen(false);
    setFormData({ date: '', heure: '', personnes: '', table: '', remarques: '' });
  };

  const handleDeleteReservation = (reservation) => {
    if (window.confirm('Annuler cette réservation ?')) {
      // Endpoint DELETE non implémenté : suppression UI uniquement pour l’instant.
      setReservations(reservations.filter((r) => r.id !== reservation.id));
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
        data={tableRows}
        actions={[
          { label: 'Annuler', icon: 'fa-trash', className: 'btn-danger', onClick: handleDeleteReservation }
        ]}
      />

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Nouvelle réservation">
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
        <div className="form-group">
          <label>Table (optionnel)</label>
          <input type="text" value={formData.table} onChange={(e) => setFormData({ ...formData, table: e.target.value })} />
        </div>
        <div className="form-group">
          <label>Remarques (optionnel)</label>
          <textarea value={formData.remarques} onChange={(e) => setFormData({ ...formData, remarques: e.target.value })} />
        </div>
        <button className="btn-primary" onClick={handleAddReservation} disabled={loading}>
          Créer réservation
        </button>
      </Modal>
    </div>
  );
};

export default Reservations;