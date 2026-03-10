import '../styles/GameItem.css';

const difficultyColors = {
    'Débutant': 'difficulty-beginner',
    'Intermédiaire': 'difficulty-intermediate',
    'Avancé': 'difficulty-advanced',
    'Expert': 'difficulty-expert',
};

function DifficultyBadge({ level }) {
    if (!level) return null;
    const colorClass = difficultyColors[level] || 'difficulty-default';
    return (
        <span className={`bg-game-difficulty-badge ${colorClass}`}>
            {level}
        </span>
    );
}

function GameItem({ game }) {
    const genres = [game.genre_gam, game.genre2_gam, game.genre3_gam].filter(Boolean);
    const subgenres = [game.subgenre_gam, game.subgenre2_gam, game.subgenre3_gam].filter(Boolean);

    const playerRange = game.max_player_gam
        ? `${game.min_player_gam}–${game.max_player_gam}`
        : `${game.min_player_gam}`;

    return (
        <div className="bg-game-card">
            {/* Image area */}
            <div className="bg-game-image-area">
                {game.image_gam ? (
                    <img src={game.image_gam} alt={game.name_gam} className="bg-game-image" />
                ) : (
                    <div className="bg-game-image-placeholder">
                        <span className="placeholder-icon">🎲</span>
                    </div>
                )}
            </div>

            {/* Title + Difficulty */}
            <div className="bg-game-header">
                <div className="bg-game-card-title">{game.name_gam}</div>
                <DifficultyBadge level={game.difficulty_gam} />
            </div>

            {/* Genre tags */}
            {genres.length > 0 && (
                <div className="bg-game-tags">
                    {genres.map((tag, i) => (
                        <span key={`genre-${i}`} className="bg-game-tag genre-tag">{tag}</span>
                    ))}
                    {subgenres.map((tag, i) => (
                        <span key={`sub-${i}`} className="bg-game-tag subgenre-tag">{tag}</span>
                    ))}
                </div>
            )}

            {/* Info rows */}
            <div className="bg-game-card-info">
                <span>
                    <span className="info-icon">👥</span>
                    <span className="info-label">Joueurs</span>
                    {playerRange}
                </span>
                <span>
                    <span className="info-icon">⏱</span>
                    <span className="info-label">Durée</span>
                    {game.playtime_gam || '—'}
                </span>
                <span>
                    <span className="info-icon">🎂</span>
                    <span className="info-label">Âge</span>
                    {game.minimum_age_gam ? `${game.minimum_age_gam}+` : '—'}
                </span>
                {game.language_gam && (
                    <span>
                        <span className="info-icon">🌐</span>
                        <span className="info-label">Langue</span>
                        {game.language_gam}
                    </span>
                )}
                {game.publisher_gam && (
                    <span>
                        <span className="info-icon">🏭</span>
                        <span className="info-label">Éditeur</span>
                        {game.publisher_gam}
                    </span>
                )}
                <span>
                    <span className="info-icon">👤</span>
                    <span className="info-label">Proprio</span>
                    {game.owner_gam}
                </span>
            </div>

            {/* Comment */}
            {game.comment_gam && (
                <div className="bg-game-comment">
                    <span className="comment-icon">💬</span>
                    {game.comment_gam}
                </div>
            )}
        </div>
    );
}

export default GameItem;