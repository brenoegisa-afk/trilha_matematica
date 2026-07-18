import { supabase } from '../../utils/supabaseClient';
import { toLearningAttemptRow, type LearningAttempt } from '../learning/LearningAttempt';
import { useSyncStore } from '../../store/useSyncStore';

export class LearningAttemptService {
    /**
     * Insere um fato append-only. Uma colisão de attempt_id é um reenvio válido,
     * portanto conta como sucesso e não cria uma segunda tentativa.
     */
    static async record(attempt: LearningAttempt): Promise<{ duplicate: boolean; error: unknown | null }> {
        const { error } = await supabase
            .from('learning_attempts')
            .insert(toLearningAttemptRow(attempt));

        if (!error) return { duplicate: false, error: null };
        if (error.code === '23505') return { duplicate: true, error: null };

        useSyncStore.getState().addAttempt(attempt);
        return { duplicate: false, error };
    }
}
