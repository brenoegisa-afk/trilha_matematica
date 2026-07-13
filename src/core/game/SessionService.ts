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
     * Saves a completed game session to Supabase.
     * Also updates the player profile with accumulated pedagogy data:
     * - total_score (additive)
     * - stars (additive)
     * - streak
     * - session_stats (JSON snapshot of this session's skills)
     * - last_sync (timestamp)
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
            accuracy,
            xp_gained: player.score,
            skill_stats: stats.skillsPracticed
        };

        try {
            // 1. Insert the game session log
            const { data, error: sessionError } = await supabase
                .from('game_sessions')
                .insert([sessionData]);

            if (sessionError) {
                console.error('Erro ao salvar sessão no Supabase:', sessionError);
                return { data: null, error: sessionError };
            }

            // 2. Fetch current profile to safely accumulate totals
            const { data: currentProfile } = await supabase
                .from('profiles')
                .select('total_score, stars, streak')
                .eq('id', player.id)
                .single();

            // 3. Calculate stars earned this session (1 star per 10 XP)
            const starsEarned = Math.floor(player.score / 10);
            const currentStars = currentProfile?.stars ?? 0;
            const currentScore = currentProfile?.total_score ?? 0;

            // 4. Update profile with pedagogy data (upsert-safe merge)
            const { error: profileError } = await supabase
                .from('profiles')
                .update({
                    total_score: currentScore + player.score,
                    stars: currentStars + starsEarned,
                    session_stats: stats.skillsPracticed, // latest session snapshot
                    skills_mastery: player.skillsMastery || [],
                    srs_reviews: player.srsReviews || [],
                    node_mastery: player.nodeMastery || {},
                    tabuada_mastery: player.tabuadaMastery || {},
                    last_sync: new Date().toISOString()
                })
                .eq('id', player.id);

            if (profileError) {
                // Non-fatal: session was already saved, just log warning
                console.warn('Aviso: falha ao atualizar perfil pós-sessão:', profileError.message);
            } else {
                console.log(`✅ Perfil ${player.name} atualizado: +${player.score} pts, +${starsEarned}⭐`);
            }

            return { data, error: null };
        } catch (err) {
            console.error('Exceção ao salvar sessão:', err);
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

    /**
     * Fetches sessions for a class with real-time subscription support.
     * Returns the unsubscribe function.
     */
    static subscribeToClassSessions(
        classId: string,
        onData: (sessions: GameSessionData[]) => void
    ) {
        // Initial fetch
        supabase
            .from('game_sessions')
            .select('*')
            .eq('class_id', classId)
            .order('finished_at', { ascending: false })
            .limit(100)
            .then(({ data }) => {
                if (data) onData(data as unknown as GameSessionData[]);
            });

        // Realtime subscription for new inserts
        const channel = supabase
            .channel(`class-sessions-${classId}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'game_sessions',
                    filter: `class_id=eq.${classId}`
                },
                () => {
                    // Re-fetch on any new session
                    supabase
                        .from('game_sessions')
                        .select('*')
                        .eq('class_id', classId)
                        .order('finished_at', { ascending: false })
                        .limit(100)
                        .then(({ data }) => {
                            if (data) onData(data as unknown as GameSessionData[]);
                        });
                }
            )
            .subscribe();

        return () => supabase.removeChannel(channel);
    }
}
