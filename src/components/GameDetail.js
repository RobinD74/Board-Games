import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { fetchGameById, fetchReviews } from '../datas/GameList';
import sampleGames from '../datas/sampleGames';
import '../styles/GameDetail.css';

const difficultyColors = {
    'Débutant': 'difficulty-beginner',
    'Intermédiaire': 'difficulty-intermediate',
    'Avancé': 'difficulty-advanced',
    'Expert': 'difficulty-expert',
};

function formatDate(dateStr) {
    return new Date(dateStr).toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
    });
}

function GameDetail() {
    const { id } = useParams();
    const [game, setGame] = useState(null);
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        setLoading(true);
        Promise.all([fetchGameById(id), fetchReviews(id)])
            .then(([gameData, reviewsData]) => {
                const resolvedGame = gameData || sampleGames.find(g => String(g.id_gam) === String(id));
                setGame(resolvedGame || null);
                setReviews(reviewsData || []);
                setLoading(false);
            })
            .catch((err) => {
                console.error(err);
                const fallback = sampleGames.find(g => String(g.id_gam) === String(id));
                if (fallback) {
                    setGame(fallback);
                    setReviews([]);
                    setLoading(false);
                } else {
                    setError('Impossible de charger les détails du jeu.');
                    setLoading(false);
                }
            });
    }, [id]);

    if (loading) {
        return (
            <div className="gd-loading">
                <span>Chargement…</span>
            </div>
        );
    }

    if (error || !game) {
        return (
            <div className="gd-error">
                <span className="gd-error-icon">⚠️</span>
                <p>{error || 'Jeu introuvable.'}</p>
                <Link to="/" className="gd-back-btn">← Retour à la collection</Link>
            </div>
        );
    }

    const genres = [game.genre_gam, game.genre2_gam, game.genre3_gam].filter(Boolean);
    const subgenres = [game.subgenre_gam, game.subgenre2_gam, game.subgenre3_gam].filter(Boolean);
    const playerRange =
        game.max_player_gam && game.min_player_gam !== game.max_player_gam
            ? `${game.min_player_gam}–${game.max_player_gam}`
            : `${game.min_player_gam}`;
    const diffClass = difficultyColors[game.difficulty_gam] || 'difficulty-default';

    return (
        <section className="gd-section">
            <Link to="/" className="gd-back-link">
                <span className="gd-back-arrow">←</span> Retour à la collection
            </Link>

            <div className="gd-hero">
                <div className="gd-hero-image-area">
                    {game.image_gam ? (
                        <img src={game.image_gam} alt={game.name_gam} className="gd-hero-image" />
                    ) : (
                        <div className="gd-hero-placeholder">
                            <span className="gd-placeholder-icon">🎲</span>
                        </div>
                    )}
                </div>

                <div className="gd-hero-info">
                    <div className="gd-title-row">
                        <h1 className="gd-title">{game.name_gam}</h1>
                        <span className={`gd-difficulty-badge ${diffClass}`}>
                            {game.difficulty_gam}
                        </span>
                    </div>

                    {genres.length > 0 && (
                        <div className="gd-tags">
                            {genres.map((tag, i) => (
                                <span key={`genre-${i}`} className="gd-tag genre-tag">{tag}</span>
                            ))}
                            {subgenres.map((tag, i) => (
                                <span key={`sub-${i}`} className="gd-tag subgenre-tag">{tag}</span>
                            ))}
                        </div>
                    )}

                    <div className="gd-stats">
                        <div className="gd-stat">
                            <span className="gd-stat-icon">👥</span>
                            <span className="gd-stat-label">Joueurs</span>
                            <span className="gd-stat-value">{playerRange}</span>
                        </div>
                        <div className="gd-stat">
                            <span className="gd-stat-icon">⏱</span>
                            <span className="gd-stat-label">Durée</span>
                            <span className="gd-stat-value">{game.playtime_gam || '—'}</span>
                        </div>
                        <div className="gd-stat">
                            <span className="gd-stat-icon">🎂</span>
                            <span className="gd-stat-label">Âge</span>
                            <span className="gd-stat-value">{game.minimum_age_gam ? `${game.minimum_age_gam}+` : '—'}</span>
                        </div>
                        {game.language_gam && (
                            <div className="gd-stat">
                                <span className="gd-stat-icon">🌐</span>
                                <span className="gd-stat-label">Langue</span>
                                <span className="gd-stat-value">{game.language_gam}</span>
                            </div>
                        )}
                        {game.publisher_gam && (
                            <div className="gd-stat">
                                <span className="gd-stat-icon">🏭</span>
                                <span className="gd-stat-label">Éditeur</span>
                                <span className="gd-stat-value">{game.publisher_gam}</span>
                            </div>
                        )}
                        <div className="gd-stat">
                            <span className="gd-stat-icon">👤</span>
                            <span className="gd-stat-label">Propriétaire</span>
                            <span className="gd-stat-value">{game.owner_gam}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Avis ────────────────────────────────────────── */}
            <div className="gd-reviews-section">
                <h2 className="gd-section-title">
                    <span className="gd-section-icon">💬</span>
                    Avis
                    <span className="gd-reviews-count">{reviews.length}</span>
                </h2>

                {reviews.length > 0 ? (
                    <div className="gd-reviews-list">
                        {reviews.map((review) => (
                            <div key={review.id_rev} className="gd-review-card">
                                <div className="gd-review-header">
                                    <span className="gd-review-author">
                                        <span className="gd-author-icon">👤</span>
                                        {review.author_name_rev}
                                    </span>
                                    <span className="gd-review-date">
                                        {formatDate(review.created_at)}
                                    </span>
                                </div>
                                <p className="gd-review-content">{review.content_rev}</p>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="gd-no-reviews">
                        <span className="gd-no-reviews-icon">📝</span>
                        <p>Aucun avis pour le moment.</p>
                    </div>
                )}
            </div>

            {/* ── Extensions (placeholder) ────────────────────── */}
            <div className="gd-extensions-section">
                <h2 className="gd-section-title">
                    <span className="gd-section-icon">🧩</span>
                    Extensions
                </h2>
                <div className="gd-extensions-placeholder">
                    <span className="gd-placeholder-emoji">🚧</span>
                    <p>Bientôt disponible</p>
                </div>
            </div>
        </section>
    );
}

export default GameDetail;
