import { useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { supabase } from '../utils/supabaseClient';
import { useSyncStore } from '../store/useSyncStore';
import { isValidUuid } from '../utils/saveSystem';
import type { SaveProfile } from '../utils/saveSystem';

export function CloudSyncProvider() {
    const { syncQueue, removeFromQueue } = useSyncStore();

    const { mutate, isPending } = useMutation({
        mutationFn: async (profile: SaveProfile) => {
            // Perfil legado com id não-UUID: não pode ir pro banco (erro 22P02).
            // Descarta da fila (retornando o id, onSuccess remove) em vez de
            // ficar em loop infinito de retry.
            if (!isValidUuid(profile.id)) {
                console.warn('Sync descartado (id não-UUID):', profile.id);
                return profile.id;
            }

            const { data: { session } } = await supabase.auth.getSession();
            const currentUserId = session?.user?.id;
            
            const { error } = await supabase.from('profiles').upsert({
                id: profile.id,
                name: profile.name,
                // secret_code NÃO é escrito pelo cliente: o PIN é criado e
                // guardado (hasheado) apenas pelo professor no StudentManager.
                // Enviá-lo daqui arriscaria sobrescrever o hash com lixo.
                stars: profile.stars,
                equipped_avatar: profile.equippedAvatar,
                unlocked_avatars: profile.unlockedAvatars,
                games_played: profile.gamesPlayed,
                total_score: profile.totalScore,
                equipped_mascot: profile.equippedMascot || '',
                unlocked_mascots: profile.unlockedMascots || [],
                streak: profile.streak || 1,
                class_id: profile.class_id || null,
                user_id: profile.user_id || currentUserId || null,
                session_stats: (profile as any).session_stats || null,
                skills_mastery: profile.skillsMastery || [],
                srs_reviews: profile.srsReviews || [],
                node_mastery: profile.nodeMastery || {},
                tabuada_mastery: profile.tabuadaMastery || {},
                last_sync: new Date().toISOString()
            });

            if (error) {
                // If the session is locked, React Query will gracefully retry due to backoff.
                if (error.message?.includes('Lock')) {
                    throw new Error("Lock");
                }
                // Loga o detalhe COMPLETO do erro (PostgREST) para diagnóstico —
                // ex.: coluna inexistente (PGRST204), violação de RLS, etc.
                console.error(
                    '❌ SYNC PERFIL falhou:',
                    'message=', error.message,
                    '| details=', (error as any).details,
                    '| hint=', (error as any).hint,
                    '| code=', (error as any).code
                );
                throw error;
            }
            return profile.id;
        },
        onSuccess: (id) => {
            console.log(`Cloud Sync Concluído: Profile ${id}`);
            removeFromQueue(id);
        },
        retry: 5, // React Query's magic exponential backoff offline retry!
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    });

    useEffect(() => {
        // Only trigger mutation if there's something in queue and we aren't currently waiting for one to finish
        if (syncQueue.length > 0 && !isPending) {
            const profileToSync = syncQueue[0];
            mutate(profileToSync);
        }
    }, [syncQueue, mutate, isPending]);

    return null; // Invisible background manager component
}
