import { supabase } from '../supabaseClient';

/**
 * Fetch all games from the Supabase `games_gam` table.
 * Returns an array of game objects.
 */
export async function fetchGames() {
    const { data, error } = await supabase
        .from('games_gam')
        .select('*');

    if (error) {
        console.error('Error fetching games:', error);
        throw error;
    }
    return data;
}