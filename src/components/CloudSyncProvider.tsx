import { useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { supabase } from '../utils/supabaseClient';
import { useSyncStore } from '../store/useSyncStore';
import type { SaveProfile } from '../utils/saveSystem';

export function CloudSyncProvider() {
    const { syncQueue, removeFromQueue } = useSyncStore();

    const { mutate, isPending } = useMutation({
        mutationFn: async (profile: SaveProfile) => {
            const { data: { session } } = await supabase.auth.getSession();
            const currentUserId = session?.user?.id;
            
            const { error } = await supabase.from('profiles').upsert({
                id: profile.id,
                name: profile.name,
                secret_code: profile.secretCode,
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
                last_sync: new Date().toISOString()
            });

            if (error) {
                // If the session is locked, React Query will gracefully retry due to backoff.
                if (error.message?.includes('Lock')) {
                    throw new Error("Lock"); 
                }
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
