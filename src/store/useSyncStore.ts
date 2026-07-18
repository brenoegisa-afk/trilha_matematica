import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { SaveProfile } from '../utils/saveSystem';
import type { LearningAttempt } from '../core/learning/LearningAttempt';

interface SyncStore {
    syncQueue: SaveProfile[];
    addToQueue: (profile: SaveProfile) => void;
    removeFromQueue: (id: string) => void;
    attemptQueue: LearningAttempt[];
    addAttempt: (attempt: LearningAttempt) => void;
    removeAttempt: (attemptId: string) => void;
}

export const useSyncStore = create<SyncStore>()(
    persist(
        (set) => ({
            syncQueue: [],
            addToQueue: (profile) => set((state) => ({ 
                // Always keep the latest version of the profile in the queue
                syncQueue: [...state.syncQueue.filter(p => p.id !== profile.id), profile]
            })),
            removeFromQueue: (id) => set((state) => ({
                syncQueue: state.syncQueue.filter(p => p.id !== id)
            })),
            attemptQueue: [],
            addAttempt: (attempt) => set(state => ({ attemptQueue: state.attemptQueue.some(a => a.attemptId === attempt.attemptId) ? state.attemptQueue : [...state.attemptQueue, attempt] })),
            removeAttempt: (attemptId) => set(state => ({ attemptQueue: state.attemptQueue.filter(a => a.attemptId !== attemptId) }))
        }),
        {
            name: 'cloud-sync-queue',
        }
    )
);
