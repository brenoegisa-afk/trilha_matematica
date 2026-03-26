import { supabase } from '../../utils/supabaseClient';
import type { Player } from '../types';

export interface GameSessionData {
    player_id: string;
    class_id?: string;
    total_questions: number;
    correct_answers: number;
    accuracy: number;
    xp_gained: number;
    skill_stats: Record<string, { attempts: number; successes: number }>;
}

export class SessionService {
    /**
     * Saves a completed game session to Supabase
     */
    static async saveSession(player: Player): Promise<{ data: any; error: any }> {
        const stats = player.sessionStats;
        const accuracy = stats.totalQuestions > 0 
            ? Math.round((stats.correctAnswers / stats.totalQuestions) * 100) 
            : 0;

        const sessionData: GameSessionData = {
            player_id: player.id,
            class_id: player.class_id || undefined,
            total_questions: stats.totalQuestions,
            correct_answers: stats.correctAnswers,
            accuracy: accuracy,
            xp_gained: player.score, // Assume player.score is the XP gained this session
            skill_stats: stats.skillsPracticed
        };

        try {
            const { data, error } = await supabase
                .from('game_sessions')
                .insert([sessionData]);
            
            if (error) {
                console.error("Erro ao salvar sessão no Supabase:", error);
                return { data: null, error };
            }

            return { data, error: null };
        } catch (err) {
            console.error("Exceção ao salvar sessão:", err);
            return { data: null, error: err };
        }
    }

    /**
     * Fetches recent sessions for a specific player
     */
    static async getPlayerHistory(playerId: string, limit = 10) {
        const { data, error } = await supabase
            .from('game_sessions')
            .select('*')
            .eq('player_id', playerId)
            .order('finished_at', { ascending: false })
            .limit(limit);
        
        return { data, error };
    }
}
