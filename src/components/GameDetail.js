import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { fetchGameById, fetchReviews, fetchExtensions } from '../datas/GameList';
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
    const [extensions, setExtensions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        setLoading(true);
        Promise.all([fetchGameById(id), fetchReviews(id), fetchExtensions(id)])
            .then(([gameData, reviewsData, extensionsData]) => {
                const resolvedGame = gameData || sampleGames.find(g => String(g.id_gam) === String(id));
                setGame(resolvedGame || null);
                setReviews(reviewsData || []);
                setExtensions(extensionsData || []);
                setLoading(false);
            })
            .catch((err) => {
                console.error(err);
                const fallback = sampleGames.find(g => String(g.id_gam) === String(id));
                if (fallback) {
                    setGame(fallback);
                    setReviews([]);
                    setExtensions([]);
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

            {/* ── Commentaire ────────────────────────────────────────── */}
            <div className="gd-reviews-section">
                <h2 className="gd-section-title">
                    Commentaire
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
                        <p>Aucun commentaire pour le moment.</p>
                    </div>
                )}
            </div>

            {/* ── Extensions ─────────────────────────────────────────── */}
            <div className="gd-extensions-section">
                <h2 className="gd-section-title">
                    Extensions
                    <span className="gd-reviews-count">{extensions.length}</span>
                </h2>

                {extensions.length > 0 ? (
                    <div className="gd-extensions-list">
                        {extensions.map((ext) => (
                            <div key={ext.id_ext} className="gd-extension-card">
                                <div className="gd-extension-info">
                                    <span className="gd-extension-name">{ext.name_ext}</span>
                                    <span className="gd-extension-owner">
                                        <span className="gd-extension-owner-icon">👤</span>
                                        {ext.owner_ext}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="gd-no-extensions">
                        <p>Aucune extension enregistrée.</p>
                    </div>
                )}
            </div>
        </section>
    );
}

export default GameDetail;
