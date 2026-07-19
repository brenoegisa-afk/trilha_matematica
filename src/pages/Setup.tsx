import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useGame } from '../context/GameContext';
import { DiagnosticProgressService } from '../core/services/DiagnosticProgressService';
import { DIAGNOSTIC_VERSION } from '../core/learning/DiagnosticEngine';
import { supabase } from '../utils/supabaseClient';
import { CustomizableHero } from '../components/CustomizableHero';
import { getPlayerHeroStage } from '../core/theme/heroProgress';
import styles from './Setup.module.css';

const AVAILABLE_COLORS = [
    'var(--color-red)',
    'var(--color-blue)',
    'var(--color-green)',
    'var(--color-yellow)'
];

/** A identidade visual não deve ser uma decisão obrigatória antes de jogar.
 *  O resultado é estável para cada aluno e só muda se a cor já estiver em uso
 *  pela equipe presente na mesma partida. */
function getAutomaticHeroColor(studentId: string, players: { color: string }[]): string {
    const hash = [...studentId].reduce((total, char) => ((total * 31) + char.charCodeAt(0)) >>> 0, 0);
    const ordered = AVAILABLE_COLORS.map((_, index) => AVAILABLE_COLORS[(hash + index) % AVAILABLE_COLORS.length]);
    return ordered.find(color => !players.some(player => player.color === color)) || ordered[0];
}

// O roster devolvido pela RPC get_class_roster contém APENAS id + name.
// Nenhum dado sensível (secret_code, notas) trafega para a tela de login.
interface ClassStudent {
    id: string;
    name: string;
}

export default function Setup() {
    const navigate = useNavigate();
    const { players, addPlayer, startGame, startMascotBattle, selectedGrade, setGrade, refreshPlayers, availableSubjects, currentSubjectId, setSubject, setClassConfig } = useGame();
    
    // Class flow state
    const [classCode, setClassCode] = useState('');
    const [classStudents, setClassStudents] = useState<ClassStudent[] | null>(null);
    const [selectedStudentId, setSelectedStudentId] = useState('');
    const [secretCode, setSecretCode] = useState('');
    const [classLoading, setClassLoading] = useState(false);
    const [consentChecked, setConsentChecked] = useState(false);
    const [classActiveFocus, setClassActiveFocus] = useState<string | null>(null);
    const [currentClassId, setCurrentClassId] = useState<string | null>(null);

    useEffect(() => {
        refreshPlayers();
    }, []);

    const handleFetchClass = async () => {
        if (!classCode.trim()) return;
        setClassLoading(true);
        try {
            const { data: classData, error: classError } = await supabase
                .from('classes')
                .select('id, active_focus_skill')
                .eq('access_code', classCode.toUpperCase())
                .single();

            if (classError || !classData) {
                alert('Código de Turma inválido!');
                setClassLoading(false);
                return;
            }

            // Roster via RPC server-side: devolve só id + name (sem secret_code/notas).
            const { data: rosterData, error: rosterError } = await supabase
                .rpc('get_class_roster', { p_access_code: classCode.toUpperCase() });

            if (rosterError) throw rosterError;

            setClassStudents((rosterData as ClassStudent[]) || []);
            setClassActiveFocus(classData.active_focus_skill || null);
            setCurrentClassId(classData.id);
        } catch (e) {
            console.error(e);
            alert('Erro ao buscar alunos da turma.');
        } finally {
            setClassLoading(false);
        }
    };

    const handleAddPlayer = async () => {
        if (!selectedStudentId) {
            alert('Selecione seu nome na lista!');
            return;
        }

        if (secretCode.length < 4) {
            alert('O PIN deve ter 4 números!');
            return;
        }

        setClassLoading(true);
        try {
            // Garante uma sessão (anônima) para que o perfil tenha um dono.
            const { data: sess } = await supabase.auth.getSession();
            if (!sess.session) {
                const { error: anonErr } = await supabase.auth.signInAnonymously();
                if (anonErr) throw anonErr;
            }

            // Verificação do PIN NO SERVIDOR. Se o PIN bater, a RPC reivindica
            // o perfil (user_id = auth.uid()) e devolve os dados do aluno.
            // O hash (secret_code) nunca é enviado ao cliente.
            const { data: rows, error } = await supabase.rpc('student_login', {
                p_student_id: selectedStudentId,
                p_pin: secretCode
            });

            // Distingue erro de servidor (RPC falhou) de PIN que simplesmente não bate.
            if (error) {
                console.error('Erro na RPC student_login:', error);
                alert('Erro ao verificar o PIN (servidor): ' + error.message);
                return;
            }

            const student = Array.isArray(rows) ? rows[0] : rows;
            if (!student) {
                alert('PIN Incorreto! Tente novamente.');
                return;
            }

            // Perfis que já possuírem uma cor remota a preservam. Para os
            // demais, a trilha atribui um brilho automaticamente, sem criar
            // uma barreira de escolha antes da partida.
            const colorHex = typeof student.color === 'string' && student.color
                ? student.color
                : getAutomaticHeroColor(student.id, players);

            // O perfil remoto precisa ser aplicado antes de entrar na fila.
            // Assim o diagnóstico e os pré-requisitos não são substituídos por
            // um perfil vazio do navegador ao iniciar a partida.
            addPlayer(student.name, colorHex, '', student.class_id, {
                id: student.id,
                user_id: student.user_id,
                totalScore: student.total_score || 0,
                stars: student.stars || 0,
                streak: student.streak || 1,
                class_id: student.class_id,
                skillsMastery: student.skills_mastery || [],
                srsReviews: student.srs_reviews || [],
                nodeMastery: student.node_mastery || {},
                tabuadaMastery: student.tabuada_mastery || {},
                equippedHero: student.equipped_hero || undefined,
                heroConfig: student.hero_config || {}
            });

            // Recarrega a fila para o herói vindo da nuvem (login em outro aparelho)
            // aparecer na hora, sem esperar o refresh do próximo mount.
            refreshPlayers();

            setSecretCode('');
            setSelectedStudentId('');
        } catch (e) {
            console.error(e);
            alert('Erro ao entrar. Verifique sua conexão e tente novamente.');
        } finally {
            setClassLoading(false);
        }
        // No longer returning home if players >= 4, allowed to add indefinitely
    };

    const location = useLocation();
    const gameMode = location.state?.gameMode || 'trilha';

    const handleStart = async () => {
        if (players.length === 0) return;

        // Load class config (focus + custom questions) before starting
        if (currentClassId) {
            let customQuestions: any[] = [];
            try {
                const { data } = await supabase
                    .from('custom_questions')
                    .select('*')
                    .eq('class_id', currentClassId);
                if (data) customQuestions = data;
            } catch (e) {
                console.warn('custom_questions table not ready yet:', e);
            }
            setClassConfig(classActiveFocus, customQuestions);
        }

        const diagnosticStoredLocally = !!players[0]?.nodeMastery
            && Object.values(players[0].nodeMastery).some(item => item.diagnosticVersion === DIAGNOSTIC_VERSION);
        const needsDiagnostic = currentSubjectId === 'math'
            && !!players[0]
            && (!diagnosticStoredLocally || !await DiagnosticProgressService.hasCompleted(players[0].id, currentSubjectId));

        await startGame();

        if (gameMode === 'arena') {
            navigate('/arena', { state: { fromSetup: true } });
        } else if (gameMode === 'tabuada') {
            navigate('/tabuada', { state: { fromSetup: true } });
        } else if (gameMode === 'battle') {
            if (needsDiagnostic) {
                navigate('/diagnostic', { state: { continueMode: 'battle' } });
            } else {
                startMascotBattle();
                navigate('/game');
            }
        } else {
            navigate(needsDiagnostic ? '/diagnostic' : '/game');
        }
    };

    // Sub-renderers to keep JSX clean
    const renderGradeSelector = () => {
        let grades = [];
        if (currentSubjectId === 'math') {
            grades = [
                { id: '1', label: '1º Ano', sub: 'Números iniciais', icon: '🍎' },
                { id: '2', label: '2º Ano', sub: 'Operações iniciais', icon: '➕' },
                { id: '3', label: '3º Ano', sub: 'Multiplicação', icon: '🧠' },
                { id: '4', label: '4º Ano', sub: 'Consolidação', icon: '📐' },
                { id: '5', label: '5º Ano', sub: 'Lógica e expressões', icon: '🚀' }
            ];
        } else if (currentSubjectId === 'portuguese') {
            grades = [
                { id: '1', label: '1º Ano', sub: 'Alfabetização', icon: '🖍️' },
                { id: '2', label: '2º Ano', sub: 'Leitura inicial', icon: '🔤' },
                { id: '3', label: '3º Ano', sub: 'Gramática', icon: '📖' },
                { id: '4', label: '4º Ano', sub: 'Textos e gêneros', icon: '📰' },
                { id: '5', label: '5º Ano', sub: 'Interpretação', icon: '🎭' }
            ];
        } else {
            grades = [
                { id: '1', label: '1º Ano', sub: 'Seres vivos', icon: '🌱' },
                { id: '2', label: '2º Ano', sub: 'Corpo e natureza', icon: '🐾' },
                { id: '3', label: '3º Ano', sub: 'Hábitos e ambiente', icon: '💧' },
                { id: '4', label: '4º Ano', sub: 'Ecossistemas', icon: '🌍' },
                { id: '5', label: '5º Ano', sub: 'Corpo e espaço', icon: '🪐' }
            ];
        }

        return (
            <div className={styles.gradeGrid}>
                {grades.map(g => (
                    <div 
                        key={g.id}
                        className={`${styles.islandCard} ${selectedGrade === g.id ? styles.activeGrade : ''}`}
                        onClick={() => setGrade(g.id as import('../core/learning/Grade').GradeSelection)}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', width: '100%' }}>
                            <span style={{ fontSize: '2rem' }}>{g.icon}</span>
                            <div style={{ textAlign: 'left' }}>
                                <div style={{ fontWeight: '900', fontSize: '1.2rem' }}>{g.label}</div>
                                <div style={{ fontSize: '0.85rem', opacity: 0.9 }}>{g.sub}</div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        );
    };

    return (
        <div className={styles.setupContainer}>
            <h1 className={styles.title}>Preparar Aventura!</h1>

            {/* Panel 1: Subject Selection */}
            <div className={styles.panel}>
                <label className={styles.label}>O que vamos aprender hoje?</label>
                <div className={styles.cardGrid}>
                    {availableSubjects.map(sub => (
                        <div 
                            key={sub.id}
                            className={`${styles.islandCard} ${currentSubjectId === sub.id ? styles.activeSubject : ''}`}
                            onClick={() => setSubject(sub.id)}
                        >
                            <span className={styles.islandIcon}>{sub.icon}</span>
                            <span className={styles.islandText}>{sub.name}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Panel 2: Grade Selection */}
            <div className={styles.panel}>
                <label className={styles.label}>Nível do Desafio:</label>
                {renderGradeSelector()}
            </div>

            {/* Panel 3: Player Creation (Cloud Flow) */}
            <div className={styles.panel}>
                <label className={styles.label}>Turma e Jogadores ({players.length} na fila)</label>
                
                {!classStudents ? (
                    <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
                        <input
                            type="text"
                            maxLength={6}
                            className={styles.inputField}
                            style={{ flex: 1, textAlign: 'center', textTransform: 'uppercase' }}
                            value={classCode}
                            onChange={e => setClassCode(e.target.value.toUpperCase())}
                            placeholder="Código da Turma (Ex: A99B)"
                        />
                        <button 
                            className="btn-primary" 
                            onClick={handleFetchClass}
                            disabled={!classCode.trim() || classLoading}
                        >
                            {classLoading ? '⏳' : 'Buscar'}
                        </button>
                    </div>
                ) : (
                    <>
                        <div style={{ marginBottom: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ color: 'var(--color-ink)', fontWeight: 700 }}>✅ Turma Encontrada!</span>
                            <button 
                                onClick={() => { setClassStudents(null); setClassCode(''); }}
                                style={{ background: 'none', border: 'none', color: '#ff4d4f', cursor: 'pointer', textDecoration: 'underline' }}
                            >
                                Trocar Turma
                            </button>
                        </div>
                        
                        <select 
                            className={styles.inputField} 
                            style={{ marginBottom: '10px', cursor: 'pointer' }}
                            value={selectedStudentId}
                            onChange={e => setSelectedStudentId(e.target.value)}
                        >
                            <option value="">-- Escolha seu nome --</option>
                            {classStudents.filter(s => !players.some(p => p.name === s.name)).map(student => (
                                <option key={student.id} value={student.id}>{student.name}</option>
                            ))}
                        </select>

                        <input
                            type="password"
                            inputMode="numeric"
                            maxLength={4}
                            className={styles.inputField}
                            style={{ marginBottom: '10px', letterSpacing: '8px', textAlign: 'center' }}
                            value={secretCode}
                            onChange={e => setSecretCode(e.target.value.replace(/\D/g, ''))}
                            placeholder="PIN (4 números)"
                        />

                        <p style={{
                            margin: '0 0 16px', textAlign: 'center', color: 'var(--color-ink)',
                            fontSize: '0.85rem', fontWeight: 700, lineHeight: 1.4
                        }}>
                            ✨ O brilho do seu herói será preparado automaticamente para a aventura.
                        </p>

                        <label className={styles.consentLabel}>
                            <input
                                className={styles.consentCheckbox}
                                type="checkbox"
                                checked={consentChecked}
                                onChange={e => setConsentChecked(e.target.checked)}
                            />
                            <span className={styles.consentIndicator} aria-hidden="true">✓</span>
                            <span>Concordo que os dados inseridos sejam usados exclusivamente para fins pedagógicos nesta plataforma.</span>
                        </label>

                        <button 
                            className="btn-primary" 
                            style={{ width: '100%', padding: '15px' }}
                            onClick={handleAddPlayer} 
                            disabled={!selectedStudentId || secretCode.length < 4 || !consentChecked}
                        >
                            ➕ Adicionar Herói!
                        </button>
                    </>
                )}
            </div>

            {/* Panel 4: Queue & Start (Only visible if players exist) */}
            {players.length > 0 && (
                <div style={{ width: '100%', maxWidth: '500px', marginBottom: '20px' }}>
                    <h3 style={{ color: 'white', marginBottom: '10px', textAlign: 'center', textShadow: '2px 2px 0 var(--color-ink)' }}>
                        Equipe Pronta:
                    </h3>
                    <ul className={styles.queueList}>
                        {players.map(p => (
                            <li key={p.id} className={styles.queueItem}>
                                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                    <div
                                        className={styles.avatarBadge}
                                        style={p.hero ? { background: 'transparent' } : { backgroundColor: p.color }}
                                    >
                                        {p.hero
                                            ? <CustomizableHero heroId={p.hero} stage={getPlayerHeroStage(p)} config={p.heroConfig} size={40} />
                                            : (p.avatar || '🐰')}
                                    </div>
                                    <strong style={{ fontSize: '1.2rem' }}>{p.name}</strong>
                                </div>
                                <span style={{ fontSize: '1.5rem', animation: 'bounce var(--transition-bounce) infinite alternate' }}>⭐</span>
                            </li>
                        ))}
                    </ul>

                    <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                        <button className="btn-danger" style={{ flex: 1 }} onClick={() => navigate('/')}>
                            🔙 Voltar
                        </button>
                        <button className="btn-primary" style={{ flex: 2, padding: '20px', fontSize: '1.5rem' }} onClick={handleStart}>
                            🎮 JOGAR AGORA!
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
