import { useEffect, useState } from 'react';
import { fetchGames } from '../datas/GameList';
import sampleGames from '../datas/sampleGames';
import GameItem from './GameItem';

function GamesList() {
    const [games, setGames] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [search, setSearch] = useState('');
    const [difficultyFilter, setDifficultyFilter] = useState('');
    const [genreFilter, setGenreFilter] = useState('');

    useEffect(() => {
        fetchGames()
            .then((data) => {
                setGames(data && data.length > 0 ? data : sampleGames);
                setLoading(false);
            })
            .catch((err) => {
                console.warn('Supabase fetch failed, using sample data.');
                setGames(sampleGames);
                setError(null);
                setLoading(false);
            });
    }, []);

    if (loading) return <div className="bg-games-loading">Chargement des jeux…</div>;
    if (error) return <div className="bg-games-error">Erreur : {error}</div>;

    // Extract unique difficulty levels and first genres for filter options
    const difficulties = [...new Set(games.map((g) => g.difficulty_gam).filter(Boolean))].sort();
    const genres = [...new Set(games.map((g) => g.genre_gam).filter(Boolean))].sort();

    const filtered = games.filter((game) => {
        const matchesSearch = game.name_gam.toLowerCase().includes(search.toLowerCase());
        const matchesDifficulty = !difficultyFilter || game.difficulty_gam === difficultyFilter;
        const matchesGenre = !genreFilter || game.genre_gam === genreFilter;
        return matchesSearch && matchesDifficulty && matchesGenre;
    });

    return (
        <section className="bg-games-section">
            <div className="bg-games-header">
                <h2 className="bg-games-title">
                    <span className="title-icon">🎲</span>
                    La Collection
                    <span className="bg-games-count">{filtered.length} jeu{filtered.length !== 1 ? 'x' : ''}</span>
                </h2>
                <div className="bg-games-filters">
                    <div className="bg-games-search-wrapper">
                        <span className="bg-search-icon">🔍</span>
                        <input
                            type="text"
                            className="bg-games-search"
                            placeholder="Rechercher un jeu…"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <select
                        className="bg-games-filter-select"
                        value={difficultyFilter}
                        onChange={(e) => setDifficultyFilter(e.target.value)}
                    >
                        <option value="">Toutes les difficultés</option>
                        {difficulties.map((d) => (
                            <option key={d} value={d}>{d}</option>
                        ))}
                    </select>
                    <select
                        className="bg-games-filter-select"
                        value={genreFilter}
                        onChange={(e) => setGenreFilter(e.target.value)}
                    >
                        <option value="">Tous les genres</option>
                        {genres.map((g) => (
                            <option key={g} value={g}>{g}</option>
                        ))}
                    </select>
                </div>
            </div>
            <div className="bg-games-grid">
                {filtered.length > 0 ? (
                    filtered.map((game) => (
                        <GameItem key={game.id_gam} game={game} />
                    ))
                ) : (
                    <div className="bg-games-no-results">
                        <span className="no-results-icon">🎯</span>
                        Aucun jeu ne correspond à « {search} »
                    </div>
                )}
            </div>
        </section>
    );
}

export default GamesList;
