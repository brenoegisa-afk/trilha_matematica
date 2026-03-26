import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { SaveProfile } from '../utils/saveSystem';

interface SyncStore {
    syncQueue: SaveProfile[];
    addToQueue: (profile: SaveProfile) => void;
    removeFromQueue: (id: string) => void;
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
            }))
        }),
        {
            name: 'cloud-sync-queue',
        }
    )
);
