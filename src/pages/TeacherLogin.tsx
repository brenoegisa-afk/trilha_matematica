import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../utils/supabaseClient';
import styles from './TeacherLogin.module.css';

export default function TeacherLogin() {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [mode, setMode] = useState<'login' | 'signup'>('login');

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            if (mode === 'login') {
                const { error } = await supabase.auth.signInWithPassword({ email, password });
                if (error) throw error;
                navigate('/teacher');
            } else {
                const { error } = await supabase.auth.signUp({ email, password });
                if (error) throw error;
                alert('Verifique seu e-mail para confirmar o cadastro!');
                setMode('login');
            }
        } catch (err: any) {
            setError(err.message || 'Erro ao processar sua solicitação');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.loginContainer}>
            <div className={styles.loginBox}>
                <button onClick={() => navigate('/')} className={styles.backBtn}>← Início</button>

                <h1>{mode === 'login' ? 'Acesso do Professor' : 'Cadastro de Professor'}</h1>
                <p className={styles.subtitle}>
                    {mode === 'login'
                        ? 'Gerencie suas turmas e acompanhe o progresso dos alunos.'
                        : 'Crie sua conta para começar a monitorar suas turmas.'}
                </p>

                {error && <div className={styles.error}>{error}</div>}

                <form onSubmit={handleAuth} className={styles.form}>
                    <div className={styles.inputGroup}>
                        <label>E-mail:</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            placeholder="professor@escola.com"
                        />
                    </div>
                    <div className={styles.inputGroup}>
                        <label>Senha:</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            placeholder="••••••••"
                        />
                    </div>

                    <button type="submit" className={styles.submitBtn} disabled={loading}>
                        {loading ? 'Processando...' : mode === 'login' ? 'Entrar' : 'Cadastrar'}
                    </button>
                </form>

                <div className={styles.footer}>
                    {mode === 'login' ? (
                        <p>Não tem uma conta? <button onClick={() => setMode('signup')}>Cadastre-se grátis</button></p>
                    ) : (
                        <p>Já tem uma conta? <button onClick={() => setMode('login')}>Fazer Login</button></p>
                    )}
                </div>
            </div>
        </div>
    );
}
