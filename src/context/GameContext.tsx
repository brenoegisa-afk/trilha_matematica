import { useEffect } from 'react';
import type { ReactNode } from 'react';
import { supabase } from '../utils/supabaseClient';
import { useGameStore } from '../store/useGameStore';

export const useGame = useGameStore;

export function GameProvider({ children }: { children: ReactNode }) {
    const setCurrentUser = useGameStore(state => state.setCurrentUser);

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            setCurrentUser(session?.user ?? null);
        });

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setCurrentUser(session?.user ?? null);
        });

        return () => subscription.unsubscribe();
    }, [setCurrentUser]);

    return <>{children}</>;
}
