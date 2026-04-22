import { useEffect, useState } from 'react';
import * as serveurService from '../../services/serveurService';

export default function ServeurHome() {
  const [tables, setTables] = useState([]);
  const [commandes, setCommandes] = useState([]);
  const [clientId, setClientId] = useState('');
  const [tableId, setTableId] = useState('');
  const [articleId, setArticleId] = useState('');
  const [quantite, setQuantite] = useState(1);
  const [prix, setPrix] = useState('');
  const [error, setError] = useState('');

  const refresh = async () => {
    const [t, c] = await Promise.all([serveurService.fetchTables(), serveurService.fetchMesCommandes()]);
    setTables(t);
    setCommandes(c);
  };

  useEffect(() => {
    refresh().catch(() => setError('Chargement impossible'));
  }, []);

  const submitCommande = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await serveurService.createCommandeServeur({
        id_client: Number(clientId),
        table_id: Number(tableId),
        articles: [{ id_produit: Number(articleId), quantite: Number(quantite), prix_unitaire: Number(prix) }],
      });
      setClientId('');
      setTableId('');
      setArticleId('');
      setQuantite(1);
      setPrix('');
      await refresh();
    } catch {
      setError('Création de commande impossible');
    }
  };

  return (
    <div>
      <h2>Espace Serveur</h2>
      {error && <p style={{ color: 'red' }}>{error}</p>}

      <h3>Tables disponibles</h3>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 20 }}>
        {tables.map((t) => (
          <div key={t.id} className="stat-card" style={{ minWidth: 160 }}>
            <strong>{t.numero_table}</strong>
            <p>Capacité: {t.capacite}</p>
            <p>Statut: {t.statut}</p>
            <button className="btn-secondary" onClick={() => serveurService.occuperTable(t.id).then(refresh)}>
              Occuper
            </button>{' '}
            <button className="btn-secondary" onClick={() => serveurService.libererTable(t.id).then(refresh)}>
              Libérer
            </button>
          </div>
        ))}
      </div>

      <h3>Nouvelle commande sur place</h3>
      <form onSubmit={submitCommande} style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 10 }}>
        <input placeholder="ID client" value={clientId} onChange={(e) => setClientId(e.target.value)} required />
        <input placeholder="ID table" value={tableId} onChange={(e) => setTableId(e.target.value)} required />
        <input placeholder="ID produit" value={articleId} onChange={(e) => setArticleId(e.target.value)} required />
        <input placeholder="Quantité" type="number" value={quantite} onChange={(e) => setQuantite(e.target.value)} required />
        <input placeholder="Prix unitaire" type="number" value={prix} onChange={(e) => setPrix(e.target.value)} required />
        <button className="btn-primary" type="submit" style={{ gridColumn: '1 / span 2' }}>
          Créer la commande
        </button>
      </form>

      <h3 style={{ marginTop: 24 }}>Commandes en cours</h3>
      <div className="data-table">
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Table</th>
              <th>Statut cuisine</th>
              <th>Statut commande</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {commandes.map((c) => (
              <tr key={c.id}>
                <td>{c.id}</td>
                <td>{c.table_id ?? '-'}</td>
                <td>{c.statut_cuisine}</td>
                <td>{c.etat_commande}</td>
                <td>
                  <button className="btn-secondary" onClick={() => serveurService.envoyerCuisine(c.id).then(refresh)}>
                    Envoyer cuisine
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
