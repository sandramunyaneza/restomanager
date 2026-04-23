import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import DataTable from '../components/Common/DataTable';
import Modal from '../components/Common/Modal';
import * as reservationsService from '../services/reservationsService';

const INITIAL_FORM = { date: '', heure: '', personnes: '', table: '', remarques: '' };

const Reservations = () => {
  const { user } = useAuth();
  const [reservations, setReservations] = useState([]);
  const [stats, setStats] = useState({ total: 0, validees: 0, non_validees: 0 });
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState(INITIAL_FORM);

  const refreshReservations = async () => {
    const rows = await reservationsService.fetchReservations(user?.role);
    setReservations(rows);
    if (user?.role === 'admin') {
      const s = await reservationsService.fetchReservationStats();
      setStats(s);
    }
  };

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
        client: r.nom_client || (r.id_utilisateur ? `Client #${r.id_utilisateur}` : ''),
        date: String(r.horaire_reservation).slice(0, 10),
        heure: String(r.horaire_reservation).slice(11, 16),
        personnes: r.nombre_convives,
        table: r.designation_table || '-',
        statut: r.etat_reservation,
      })),
    [reservations]
  );

  const resetForm = () => {
    setEditingId(null);
    setFormData(INITIAL_FORM);
  };

  const handleSaveReservation = async () => {
    if (!formData.date || !formData.heure) {
      window.alert('Veuillez saisir une date et une heure.');
      return;
    }
    const payload = {
      horaire_reservation: `${formData.date} ${formData.heure}:00`,
      nombre_convives: Number(formData.personnes || 1),
      designation_table: formData.table || null,
      remarques_client: formData.remarques || null,
    };
    if (editingId) {
      await reservationsService.updateReservation(editingId, payload);
    } else {
      await reservationsService.createReservation(payload);
    }
    await refreshReservations();
    setIsModalOpen(false);
    resetForm();
  };

  const handleDeleteReservation = async (reservation) => {
    if (!window.confirm('Annuler cette réservation ?')) return;
    await reservationsService.deleteReservation(reservation.id);
    await refreshReservations();
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

  const handleUpdateStatus = async (reservation, status) => {
    await reservationsService.updateReservationStatus(reservation.id, status);
    await refreshReservations();
  };

  const getActionsForReservation = () => {
    const actions = [];
    if (['admin', 'serveur', 'caissier'].includes(user?.role)) {
      actions.push({
        label: 'Confirmer',
        icon: 'fa-check-circle',
        className: 'btn-primary',
        onClick: (row) => handleUpdateStatus(row, 'confirmee'),
      });
      actions.push({
        label: 'Terminer',
        icon: 'fa-user-check',
        className: 'btn-secondary',
        onClick: (row) => handleUpdateStatus(row, 'terminee'),
      });
    }
    actions.push({ label: 'Modifier', icon: 'fa-edit', className: 'btn-secondary', onClick: handleEditReservation });
    actions.push({ label: 'Supprimer', icon: 'fa-trash', className: 'btn-danger', onClick: handleDeleteReservation });
    return actions;
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
        <h2>Gestion des reservations</h2>
        {user?.role === 'client' && (
          <button className="btn-primary" onClick={() => setIsModalOpen(true)}>
            <i className="fas fa-plus" /> Nouvelle reservation
          </button>
        )}
      </div>

      {user?.role === 'admin' && (
        <div className="stats-grid" style={{ marginBottom: '20px' }}>
          <div className="stat-card">
            <h3>Total reservations</h3>
            <p>{stats.total}</p>
          </div>
          <div className="stat-card">
            <h3>Validees</h3>
            <p>{stats.validees}</p>
          </div>
          <div className="stat-card">
            <h3>Non validees</h3>
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
          { key: 'statut', label: 'Statut' },
        ]}
        data={tableRows}
        actions={getActionsForReservation()}
      />

      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          resetForm();
        }}
        title={editingId ? 'Modifier reservation' : 'Nouvelle reservation'}
      >
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
          <input
            type="number"
            min="1"
            max="50"
            value={formData.personnes}
            onChange={(e) => setFormData({ ...formData, personnes: e.target.value })}
          />
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
          {editingId ? 'Enregistrer' : 'Creer reservation'}
        </button>
      </Modal>
    </div>
  );
};

export default Reservations;