import { useEffect, useState } from 'react';
import { fetchGames } from '../datas/GameList';
import sampleGames from '../datas/sampleGames';
import GameItem from './GameItem';

function GamesList() {
    const [games, setGames] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchGames()
            .then((data) => {
                // Use sample data as fallback if the API returns nothing
                setGames(data && data.length > 0 ? data : sampleGames);
                setLoading(false);
            })
            .catch((err) => {
                console.warn('Supabase fetch failed, using sample data:', err.message);
                setGames(sampleGames);
                setError(null);
                setLoading(false);
            });
    }, []);

    if (loading) return <div className="bg-games-loading">Chargement des jeux…</div>;
    if (error) return <div className="bg-games-error">Erreur : {error}</div>;

    return (
        <section className="bg-games-section">
            <div className="bg-games-grid">
                {games.map((game) => (
                    <GameItem key={game.id_gam} game={game} />
                ))}
            </div>
        </section>
    );
}

export default GamesList;
