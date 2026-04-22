import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import DataTable from '../components/Common/DataTable';
import Modal from '../components/Common/Modal';
import * as reservationsService from '../services/reservationsService';

const Reservations = () => {
  const { user } = useAuth();
  const [reservations, setReservations] = useState([]);
  const [stats, setStats] = useState({ total: 0, validees: 0, non_validees: 0 });
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({ date: '', heure: '', personnes: '', table: '', remarques: '' });

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const rows = await reservationsService.fetchReservations(user?.role);
        if (!alive) return;
        setReservations(rows);
        if (user?.role === 'admin') {
          const s = await reservationsService.fetchReservationStats();
          if (alive) setStats(s);
        }
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [user?.role]);

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

  const refreshReservations = async () => {
    const rows = await reservationsService.fetchReservations(user?.role);
    setReservations(rows);
    if (user?.role === 'admin') {
      const s = await reservationsService.fetchReservationStats();
      setStats(s);
    }
  };

  const handleSaveReservation = async () => {
    const horaire = `${formData.date} ${formData.heure}:00`;
    const payload = editingId
      ? {
          horaire_reservation: horaire,
          nombre_convives: Number(formData.personnes || 1),
          designation_table: formData.table || null,
          remarques_client: formData.remarques || null,
        }
      : {
      horaire_reservation: horaire,
      nombre_convives: Number(formData.personnes || 1),
      designation_table: formData.table || null,
      remarques_client: formData.remarques || null,
    };
    if (editingId) {
      await reservationsService.updateReservation(editingId, payload);
      await refreshReservations();
    } else {
      const created = await reservationsService.createReservation(payload);
      setReservations((prev) => [created, ...prev]);
      if (user?.role === 'admin') {
        const s = await reservationsService.fetchReservationStats();
        setStats(s);
      }
    }
    setIsModalOpen(false);
    setEditingId(null);
    setFormData({ date: '', heure: '', personnes: '', table: '', remarques: '' });
  };

  const handleDeleteReservation = async (reservation) => {
    if (window.confirm('Annuler cette réservation ?')) {
      await reservationsService.deleteReservation(reservation.id);
      await refreshReservations();
    }
  };

  const handleEditReservation = (reservation) => {
    const ts = String(reservation.horaire_reservation);
    setEditingId(reservation.id);
    setFormData({
      date: ts.slice(0, 10),
      heure: ts.slice(11, 16),
      personnes: String(reservation.nombre_convives),
      table: reservation.designation_table || '',
      remarques: reservation.remarques_client || '',
    });
    setIsModalOpen(true);
  };

  const handleValidateReservation = async (reservation) => {
    await reservationsService.updateReservationStatus(reservation.id, 'validated');
    await refreshReservations();
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
        <h2>Gestion des réservations</h2>
        {user?.role === 'client' && (
          <button className="btn-primary" onClick={() => setIsModalOpen(true)}>
            <i className="fas fa-plus"></i> Nouvelle réservation
          </button>
        )}
      </div>

      {user?.role === 'admin' && (
        <div className="stats-grid" style={{ marginBottom: '20px' }}>
          <div className="stat-card">
            <h3>Total réservations</h3>
            <p>{stats.total}</p>
          </div>
          <div className="stat-card">
            <h3>Validées</h3>
            <p>{stats.validees}</p>
          </div>
          <div className="stat-card">
            <h3>Non validées</h3>
            <p>{stats.non_validees}</p>
          </div>
        </div>
      )}
      
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
          { label: 'Modifier', icon: 'fa-edit', className: 'btn-secondary', onClick: handleEditReservation },
          { label: 'Supprimer', icon: 'fa-trash', className: 'btn-danger', onClick: handleDeleteReservation },
          { label: 'Valider', icon: 'fa-check', className: 'btn-primary', onClick: handleValidateReservation },
        ]}
      />

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingId ? 'Modifier réservation' : 'Nouvelle réservation'}>
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
        <button className="btn-primary" onClick={handleSaveReservation} disabled={loading}>
          {editingId ? 'Enregistrer' : 'Créer réservation'}
        </button>
      </Modal>
    </div>
  );
};

export default Reservations;