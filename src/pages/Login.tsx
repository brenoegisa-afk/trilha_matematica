import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../utils/supabaseClient';
import styles from './Login.module.css';

export default function Login() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [isSignUp, setIsSignUp] = useState(false);
    const [role, setRole] = useState<'teacher' | 'parent'>('teacher');

    // Check if already logged in
    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (session) navigate('/');
        });
    }, [navigate]);

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            if (isSignUp) {
                const { data, error } = await supabase.auth.signUp({ email, password });
                if (error) throw error;
                
                if (data.user) {
                    await supabase.from('profiles')
                        .update({ role: role })
                        .eq('user_id', data.user.id);
                }
                
                alert('Mágico! Verifique seu e-mail para confirmar o cadastro!');
            } else {
                const { error } = await supabase.auth.signInWithPassword({ email, password });
                if (error) throw error;
                navigate('/');
            }
        } catch (err: any) {
            setError(err.message || 'Erro ao processar autenticação');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.loginContainer}>
            <div className={styles.loginCard}>
                <div className={styles.logo}>🏆 Trilha dos Campeões</div>
                <h1>{isSignUp ? 'Criar Conta' : 'Área do Professor / Pais'}</h1>
                <p className={styles.subtitle}>
                    Acesse para sincronizar o progresso e gerenciar turmas.
                </p>

                <form onSubmit={handleAuth} className={styles.form}>
                    {isSignUp && (
                        <div className={styles.roleSelection} style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
                            <button 
                                type="button" 
                                onClick={() => setRole('teacher')}
                                style={{ flex: 1, padding: '10px', borderRadius: '10px', border: role === 'teacher' ? '3px solid var(--color-blue)' : '2px solid #e2e8f0', background: role === 'teacher' ? '#eff6ff' : 'white', cursor: 'pointer', fontWeight: 'bold' }}
                            >
                                👨‍🏫 Professor
                            </button>
                            <button 
                                type="button" 
                                onClick={() => setRole('parent')}
                                style={{ flex: 1, padding: '10px', borderRadius: '10px', border: role === 'parent' ? '3px solid var(--color-blue)' : '2px solid #e2e8f0', background: role === 'parent' ? '#eff6ff' : 'white', cursor: 'pointer', fontWeight: 'bold' }}
                            >
                                👨‍👩‍👧 Família
                            </button>
                        </div>
                    )}

                    <div className={styles.inputGroup}>
                        <label>E-mail</label>
                        <input 
                            type="email" 
                            value={email} 
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="seu@email.com"
                            required
                        />
                    </div>

                    <div className={styles.inputGroup}>
                        <label>Senha</label>
                        <input 
                            type="password" 
                            value={password} 
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            required
                        />
                    </div>

                    {error && <div className={styles.error}>{error}</div>}

                    <button type="submit" className={styles.submitBtn} disabled={loading}>
                        {loading ? 'Carregando...' : (isSignUp ? 'Cadastrar' : 'Entrar')}
                    </button>
                </form>

                <div className={styles.switch}>
                    {isSignUp ? 'Já tem uma conta?' : 'Ainda não tem conta?'}
                    <button onClick={() => setIsSignUp(!isSignUp)}>
                        {isSignUp ? 'Fazer Login' : 'Criar Conta Grátis'}
                    </button>
                </div>

                <div className={styles.footer}>
                    &copy; 2026 Trilha dos Campeões • SaaS Educacional
                </div>
            </div>
        </div>
    );
}
