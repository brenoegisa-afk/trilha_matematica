import { useEffect } from 'react';
import type { ReactNode } from 'react';
import { supabase } from '../utils/supabaseClient';
import { useGameStore } from '../store/useGameStore';

/**
 * Re-export the store hook for backward compatibility.
 * Components import `useGame` from here.
 */
export const useGame = useGameStore;

/**
 * GameProvider — Minimal provider that only handles auth state sync.
 * All game state lives in Zustand (useGameStore).
 */
export function GameProvider({ children }: { children: ReactNode }) {
    const setCurrentUser = useGameStore(state => state.setCurrentUser);

    useEffect(() => {
        // Garante uma sessão ativa. Se não houver (aluno sem login de e-mail),
        // cria uma sessão ANÔNIMA para que o perfil tenha um dono (auth.uid())
        // e a RLS restritiva funcione. Professores/pais depois fazem login por
        // e-mail, que substitui a sessão anônima.
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (session) {
                setCurrentUser(session.user);
            } else {
                supabase.auth.signInAnonymously().then(({ data, error }) => {
                    if (error) console.error('Falha ao iniciar sessão anônima', error);
                    setCurrentUser(data?.session?.user ?? null);
                });
            }
        });

        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            setCurrentUser(session?.user ?? null);
            // Num tablet compartilhado, ao sair da conta do professor/pai,
            // recria a sessão anônima para o próximo aluno conseguir sincronizar.
            if (event === 'SIGNED_OUT') {
                supabase.auth.signInAnonymously();
            }
        });

        return () => subscription.unsubscribe();
    }, [setCurrentUser]);

    return <>{children}</>;
}
