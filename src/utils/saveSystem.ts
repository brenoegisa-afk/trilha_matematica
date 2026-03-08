import { supabase } from './supabaseClient';

export interface SaveProfile {
    id: string;
    name: string;
    secretCode: string; // 4-digit code for remote sync
    stars: number;
    equippedAvatar: string;
    unlockedAvatars: string[];
    gamesPlayed: number;
    totalScore: number;
    lastSync?: number;
    equippedMascot?: string;
    unlockedMascots?: string[];
    streak?: number;
    class_id?: string;
}

const STORAGE_KEY = '@TrilhaCampeoes:Profiles';

export function getSavedProfiles(): SaveProfile[] {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) return JSON.parse(raw);
    } catch (e) {
        console.error("Error reading from localStorage", e);
    }
    return [];
}

export function saveProfiles(profiles: SaveProfile[]) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(profiles));
    } catch (e) {
        console.error("Error saving to localStorage", e);
    }
}

export function getOrCreateProfile(name: string, code: string = '0000'): SaveProfile {
    const profiles = getSavedProfiles();
    // Match by name AND code for basic security
    const existing = profiles.find(p =>
        p.name.toLowerCase() === name.toLowerCase() &&
        (p.secretCode === code || !p.secretCode)
    );

    if (existing) {
        if (!existing.secretCode) existing.secretCode = code; // Migration
        return existing;
    }

    const newProfile: SaveProfile = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
        name: name,
        secretCode: code,
        stars: 0,
        equippedAvatar: '',
        unlockedAvatars: [],
        gamesPlayed: 0,
        totalScore: 0,
        equippedMascot: '',
        unlockedMascots: [],
        streak: 1,
        class_id: ''
    };

    profiles.push(newProfile);
    saveProfiles(profiles);

    // Trigger async sync in background
    syncProfileToCloud(newProfile);

    return newProfile;
}

// REAL CLOUD SYNC IMPLEMENTATION

// Throttling to prevent excessive sync calls and Auth Lock issues
let syncTimeout: any = null;

export async function syncProfileToCloud(profile: SaveProfile) {
    if (syncTimeout) clearTimeout(syncTimeout);

    syncTimeout = setTimeout(async () => {
        try {
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
                last_sync: new Date().toISOString()
            });

            if (error) {
                // If it's a transient lock error, we don't need to spam the console as if it were fatal
                if (error.message?.includes('Lock')) {
                    console.debug("Sincronização adiada por trava de sessão.");
                    return;
                }
                throw error;
            }
            console.log("Perfil sincronizado com sucesso:", profile.name);
        } catch (e) {
            console.warn("Sincronização em segundo plano falhou. O jogo continuará offline.", e);
        }
    }, 500); // Wait 500ms before syncing
}


export async function getGlobalRanking() {
    try {
        const { data, error } = await supabase
            .from('profiles')
            .select('name, stars, total_score, equipped_avatar')
            .order('stars', { ascending: false })
            .limit(100);

        if (error) throw error;

        return data.map(p => ({
            name: p.name,
            stars: p.stars,
            totalScore: p.total_score,
            avatar: p.equipped_avatar
        }));
    } catch (e) {
        console.error("Erro ao carregar ranking global", e);
        return [];
    }
}

export function updateProfile(id: string, updates: Partial<SaveProfile>): SaveProfile | null {
    const profiles = getSavedProfiles();
    const index = profiles.findIndex(p => p.id === id);

    if (index === -1) return null;

    const updatedProfile = { ...profiles[index], ...updates };
    profiles[index] = updatedProfile;
    saveProfiles(profiles);

    // Trigger background sync
    syncProfileToCloud(updatedProfile);

    return updatedProfile;
}

export function calculateStreak(lastSyncDate: number): number {
    const last = new Date(lastSyncDate);
    const now = new Date();

    // Set to midnight for comparison
    last.setHours(0, 0, 0, 0);
    now.setHours(0, 0, 0, 0);

    const diffTime = Math.abs(now.getTime() - last.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
        return 1; // Increment will happen outside
    } else if (diffDays > 1) {
        return 0; // Reset streak
    }
    return -1; // Same day, keep current streak
}
