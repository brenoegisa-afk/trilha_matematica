import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../utils/supabaseClient';
import styles from './Login.module.css';

type Mode = 'login' | 'signup';
type Step = 'form' | 'confirm'; // 'confirm' = digitar o código de 6 dígitos

export default function Login() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [code, setCode] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [info, setInfo] = useState<string | null>(null);
    const [mode, setMode] = useState<Mode>('login');
    const [step, setStep] = useState<Step>('form');

    // Já logado? Vai direto pro painel.
    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (session) navigate('/teacher');
        });
    }, [navigate]);

    const handleLogin = async () => {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate('/teacher');
    };

    const handleSignup = async () => {
        const { data, error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;

        // Confirmação de e-mail DESLIGADA → já vem sessão → entra direto.
        if (data.session) {
            navigate('/teacher');
            return;
        }
        // Confirmação LIGADA → Supabase enviou um código de 6 dígitos por e-mail.
        setStep('confirm');
        setInfo('Enviamos um código de 6 dígitos para o seu e-mail. Digite-o abaixo para confirmar a conta.');
    };

    const handleConfirmCode = async () => {
        const { error } = await supabase.auth.verifyOtp({
            email,
            token: code.trim(),
            type: 'signup',
        });
        if (error) throw error;
        navigate('/teacher');
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            if (step === 'confirm') {
                await handleConfirmCode();
            } else if (mode === 'signup') {
                await handleSignup();
            } else {
                await handleLogin();
            }
        } catch (err: any) {
            setError(traduzErro(err?.message));
        } finally {
            setLoading(false);
        }
    };

    const resendCode = async () => {
        setError(null);
        setInfo(null);
        try {
            const { error } = await supabase.auth.resend({ type: 'signup', email });
            if (error) throw error;
            setInfo('Novo código enviado! Confira seu e-mail (e a caixa de spam).');
        } catch (err: any) {
            setError(traduzErro(err?.message));
        }
    };

    return (
        <div className={styles.loginContainer}>
            <div className={styles.loginCard}>
                <div className={styles.logo}>🏆 Trilha dos Campeões</div>

                {step === 'confirm' ? (
                    <>
                        <h1>Confirme seu e-mail</h1>
                        <p className={styles.subtitle}>{info}</p>

                        <form onSubmit={handleSubmit} className={styles.form}>
                            <div className={styles.inputGroup}>
                                <label>Código de 6 dígitos</label>
                                <input
                                    type="text"
                                    inputMode="numeric"
                                    maxLength={6}
                                    value={code}
                                    onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                                    placeholder="000000"
                                    style={{ letterSpacing: '8px', textAlign: 'center', fontSize: '1.5rem' }}
                                    autoFocus
                                    required
                                />
                            </div>

                            {error && <div className={styles.error}>{error}</div>}

                            <button type="submit" className={styles.submitBtn} disabled={loading || code.length < 6}>
                                {loading ? 'Confirmando...' : 'Confirmar e Entrar'}
                            </button>
                        </form>

                        <div className={styles.switch}>
                            Não recebeu?
                            <button onClick={resendCode} type="button">Reenviar código</button>
                        </div>
                        <p className={styles.subtitle} style={{ fontSize: '0.8rem', marginTop: '10px' }}>
                            Recebeu um <strong>link</strong> em vez de um código? É só clicar no link do
                            e-mail para confirmar a conta.
                        </p>
                    </>
                ) : (
                    <>
                        <h1>{mode === 'signup' ? 'Criar Conta de Professor' : 'Área do Professor'}</h1>
                        <p className={styles.subtitle}>
                            {mode === 'signup'
                                ? 'Crie sua conta para montar turmas e acompanhar seus alunos.'
                                : 'Acesse para gerenciar turmas e ver o progresso da turma.'}
                        </p>

                        <form onSubmit={handleSubmit} className={styles.form}>
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
                                    minLength={6}
                                    required
                                />
                            </div>

                            {error && <div className={styles.error}>{error}</div>}
                            {info && !error && <div className={styles.subtitle} style={{ color: 'var(--color-green)' }}>{info}</div>}

                            <button type="submit" className={styles.submitBtn} disabled={loading}>
                                {loading ? 'Carregando...' : (mode === 'signup' ? 'Cadastrar' : 'Entrar')}
                            </button>
                        </form>

                        <div className={styles.switch}>
                            {mode === 'signup' ? 'Já tem uma conta?' : 'Ainda não tem conta?'}
                            <button type="button" onClick={() => { setMode(mode === 'signup' ? 'login' : 'signup'); setError(null); setInfo(null); }}>
                                {mode === 'signup' ? 'Fazer Login' : 'Criar Conta Grátis'}
                            </button>
                        </div>
                    </>
                )}

                <div className={styles.footer}>
                    &copy; 2026 Trilha dos Campeões • SaaS Educacional
                </div>
            </div>
        </div>
    );
}

// Traduz as mensagens de erro mais comuns do Supabase para o professor.
function traduzErro(msg?: string): string {
    if (!msg) return 'Algo deu errado. Tente de novo.';
    const m = msg.toLowerCase();
    if (m.includes('invalid login')) return 'E-mail ou senha incorretos.';
    if (m.includes('already registered') || m.includes('already exists')) return 'Esse e-mail já tem conta. Faça login.';
    if (m.includes('token has expired') || m.includes('invalid') && m.includes('otp')) return 'Código inválido ou expirado. Reenvie e tente de novo.';
    if (m.includes('password')) return 'A senha precisa ter pelo menos 6 caracteres.';
    if (m.includes('rate limit') || m.includes('too many')) return 'Muitas tentativas. Aguarde um minuto e tente novamente.';
    return msg;
}
