import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useGame } from '../context/GameContext';
import { supabase } from '../utils/supabaseClient';
import { hashPin, updateProfile } from '../utils/saveSystem';
import styles from './Setup.module.css';

const AVAILABLE_COLORS = [
    { id: 'red', label: 'Vermelha', hex: 'var(--color-red)' },
    { id: 'blue', label: 'Azul', hex: 'var(--color-blue)' },
    { id: 'green', label: 'Verde', hex: 'var(--color-green)' },
    { id: 'yellow', label: 'Amarela', hex: 'var(--color-yellow)' }
];

interface ClassStudent {
    id: string;
    name: string;
    secret_code: string;
    class_id: string;
    total_score: number;
    stars: number;
    streak: number;
}

export default function Setup() {
    const navigate = useNavigate();
    const { players, addPlayer, startGame, selectedGrade, setGrade, refreshPlayers, availableSubjects, currentSubjectId, setSubject, setClassConfig } = useGame();
    
    // Class flow state
    const [classCode, setClassCode] = useState('');
    const [classStudents, setClassStudents] = useState<ClassStudent[] | null>(null);
    const [selectedStudentId, setSelectedStudentId] = useState('');
    const [secretCode, setSecretCode] = useState('');
    const [selectedColor, setSelectedColor] = useState('red');
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

            const { data: studentsData, error: studentsError } = await supabase
                .from('profiles')
                .select('*')
                .eq('class_id', classData.id)
                .order('name');

            if (studentsError) throw studentsError;

            setClassStudents(studentsData || []);
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

        const colorHex = AVAILABLE_COLORS.find(c => c.id === selectedColor)?.hex || 'black';
        if (players.some(p => p.color === colorHex)) {
            alert('Essa cor já foi escolhida!');
            return;
        }

        if (secretCode.length < 4) {
            alert('O PIN deve ter 4 números!');
            return;
        }

        const studentData = classStudents?.find(s => s.id === selectedStudentId);
        if (!studentData) return;

        // Hash input pin to compare with DB
        const inputHash = await hashPin(secretCode);
        if (inputHash !== studentData.secret_code) {
            alert('PIN Incorreto! Tente novamente.');
            return;
        }

        // Add player to game context (returns a new local profile or updates existing)
        const profile = addPlayer(studentData.name, colorHex, studentData.secret_code, studentData.class_id);

        // Sync local profile state with DB state so progress survives device switch
        updateProfile(profile.id, {
            id: studentData.id, // Override local UUID with DB UUID to keep them linked
            totalScore: studentData.total_score || 0,
            stars: studentData.stars || 0,
            streak: studentData.streak || 1
        });

        setSecretCode('');
        setSelectedStudentId('');
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

        startGame();

        if (gameMode === 'arena') {
            navigate('/arena', { state: { fromSetup: true } });
        } else if (gameMode === 'battle') {
            navigate('/battle');
        } else {
            navigate('/game');
        }
    };

    // Sub-renderers to keep JSX clean
    const renderGradeSelector = () => {
        let grades = [];
        if (currentSubjectId === 'math') {
            grades = [
                { id: '1-2', label: '1º e 2º Ano', sub: 'Adição/Subtração', icon: '🍎' },
                { id: '3-4', label: '3º e 4º Ano', sub: 'Multiplicação', icon: '🧠' },
                { id: '5', label: '5º Ano', sub: 'Lógica/Expressões', icon: '🚀' }
            ];
        } else if (currentSubjectId === 'portuguese') {
            grades = [
                { id: '1-2', label: '1º e 2º Ano', sub: 'Alfabetização', icon: '🖍️' },
                { id: '3-4', label: '3º e 4º Ano', sub: 'Gramática', icon: '📖' },
                { id: '5', label: '5º Ano', sub: 'Interpretação', icon: '🎭' }
            ];
        } else {
            grades = [
                { id: '1-2', label: '1º e 2º Ano', sub: 'Seres Vivos', icon: '🌱' },
                { id: '3-4', label: '3º e 4º Ano', sub: 'Ciclo da Água', icon: '💧' },
                { id: '5', label: '5º Ano', sub: 'Corpo e Espaço', icon: '🪐' }
            ];
        }

        return (
            <div className={styles.gradeGrid}>
                {grades.map(g => (
                    <div 
                        key={g.id}
                        className={`${styles.islandCard} ${selectedGrade === g.id ? styles.activeGrade : ''}`}
                        onClick={() => setGrade(g.id)}
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
                            <span style={{ color: 'white' }}>✅ Turma Encontrada!</span>
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

                        <label className={styles.label} style={{ fontSize: '0.9rem', textAlign: 'center' }}>Cor da Tampinha:</label>
                        <div className={styles.colorPicker} style={{ marginBottom: '20px' }}>
                            {AVAILABLE_COLORS.map(c => {
                                const isTaken = players.some(p => p.color === c.hex);
                                return (
                                    <div
                                        key={c.id}
                                        className={styles.colorDot}
                                        onClick={() => !isTaken && setSelectedColor(c.id)}
                                        style={{
                                            backgroundColor: c.hex,
                                            opacity: isTaken ? 0.2 : 1,
                                            boxShadow: selectedColor === c.id ? `0 0 0 4px var(--color-ink)` : 'none',
                                            cursor: isTaken ? 'not-allowed' : 'pointer'
                                        }}
                                    />
                                );
                            })}
                        </div>

                        <label
                            style={{
                                display: 'flex',
                                alignItems: 'flex-start',
                                gap: '8px',
                                color: 'white',
                                fontSize: '0.8rem',
                                marginBottom: '12px',
                                cursor: 'pointer',
                                lineHeight: 1.4
                            }}
                        >
                            <input
                                type="checkbox"
                                checked={consentChecked}
                                onChange={e => setConsentChecked(e.target.checked)}
                                style={{ marginTop: '3px', accentColor: 'var(--color-green)' }}
                            />
                            Concordo que os dados inseridos sejam usados exclusivamente para fins pedagógicos nesta plataforma.
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
                                    <div className={styles.avatarBadge} style={{ backgroundColor: p.color }}>
                                        {p.avatar}
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
