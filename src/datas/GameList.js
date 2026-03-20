import { supabase } from '../supabaseClient';

export async function fetchGames() {
    const { data, error } = await supabase
        .from('games_gam')
        .select(
            'id_gam, name_gam, image_gam, difficulty_gam, genre_gam, genre2_gam, genre3_gam, subgenre_gam, subgenre2_gam, subgenre3_gam, min_player_gam, max_player_gam, playtime_gam, minimum_age_gam, language_gam, publisher_gam, owner_gam, comment_gam'
        );

    if (error) {
        console.error('Error fetching games');
        throw error;
    }
    return data;
}