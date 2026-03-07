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
        totalScore: 0
    };

    profiles.push(newProfile);
    saveProfiles(profiles);

    // Trigger async sync in background
    syncProfileToCloud(newProfile);

    return newProfile;
}

// REAL CLOUD SYNC IMPLEMENTATION
export async function syncProfileToCloud(profile: SaveProfile) {
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
            last_sync: new Date().toISOString()
        });

        if (error) throw error;
        console.log("Perfil sincronizado com sucesso:", profile.name);
    } catch (e) {
        console.warn("Erro ao sincronizar. O jogo continuará offline.", e);
    }
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
