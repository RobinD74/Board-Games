import { supabase } from '../supabaseClient';

export async function fetchGames() {
    if (!supabase) return null;

    const { data, error } = await supabase
        .from('games_gam')
        .select(
            'id_gam, name_gam, image_gam, difficulty_gam, genre_gam, genre2_gam, genre3_gam, subgenre_gam, subgenre2_gam, subgenre3_gam, min_player_gam, max_player_gam, playtime_gam, minimum_age_gam, language_gam, publisher_gam, owner_gam'
        );

    if (error) {
        console.error('Error fetching games');
        throw error;
    }
    return data;
}

export async function fetchGameById(id) {
    if (!supabase) return null;

    const { data, error } = await supabase
        .from('games_gam')
        .select('*')
        .eq('id_gam', id)
        .single();

    if (error) {
        console.error('Error fetching game', id);
        throw error;
    }
    return data;
}

export async function fetchReviews(gameId) {
    if (!supabase) return [];

    const { data, error } = await supabase
        .from('reviews_rev')
        .select('*')
        .eq('game_id_rev', gameId)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching reviews for game', gameId);
        throw error;
    }
    return data;
}

export async function fetchExtensions(gameId) {
    if (!supabase) return [];

    const { data, error } = await supabase
        .from('extensions_ext')
        .select('*')
        .eq('game_id_ext', gameId)
        .order('name_ext', { ascending: true });

    if (error) {
        console.error('Error fetching extensions for game', gameId);
        throw error;
    }
    return data;
}