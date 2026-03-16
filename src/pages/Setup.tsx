import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useGame } from '../context/GameContext';
import styles from './Setup.module.css';

const AVAILABLE_COLORS = [
    { id: 'red', label: 'Vermelha', hex: 'var(--color-red)' },
    { id: 'blue', label: 'Azul', hex: 'var(--color-blue)' },
    { id: 'green', label: 'Verde', hex: 'var(--color-green)' },
    { id: 'yellow', label: 'Amarela', hex: 'var(--color-yellow)' }
];

export default function Setup() {
    const navigate = useNavigate();
    const { players, addPlayer, startGame, selectedGrade, setGrade, refreshPlayers, availableSubjects, currentSubjectId, setSubject } = useGame();
    const [name, setName] = useState('');
    const [secretCode, setSecretCode] = useState('');
    const [classCode, setClassCode] = useState('');
    const [selectedColor, setSelectedColor] = useState('red');
    const [classLoading, setClassLoading] = useState(false);

    useEffect(() => {
        refreshPlayers();
    }, []);

    const handleAddPlayer = async () => {
        if (!name.trim()) return;
        if (players.length >= 4) return;

        const colorHex = AVAILABLE_COLORS.find(c => c.id === selectedColor)?.hex || 'black';
        if (players.some(p => p.color === colorHex)) {
            alert('Essa cor já foi escolhida!');
            return;
        }

        if (name.trim() && secretCode.length < 4) {
            alert('O Código Secreto deve ter 4 números!');
            return;
        }

        let finalClassId = '';
        if (classCode.trim()) {
            setClassLoading(true);
            const { data, error } = await import('../utils/supabaseClient').then(m =>
                m.supabase.from('classes').select('id').eq('access_code', classCode.toUpperCase()).single()
            );

            if (error || !data) {
                alert('Código de Turma inválido!');
                setClassLoading(false);
                return;
            }
            finalClassId = data.id;
            setClassLoading(false);
        }

        const profile = addPlayer(name, colorHex, secretCode, finalClassId);

        if (finalClassId) {
            import('../utils/saveSystem').then(m => m.updateProfile(profile.id, { class_id: finalClassId }));
        }

        setName('');
        setSecretCode('');
        setClassCode('');
    };

    const location = useLocation();
    const gameMode = location.state?.gameMode || 'trilha';

    const handleStart = () => {
        if (players.length === 0) return;
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

            {/* Panel 3: Player Creation */}
            <div className={styles.panel}>
                <label className={styles.label}>Criar Jogador ({players.length}/4)</label>
                
                <input
                    type="text"
                    className={styles.inputField}
                    style={{ marginBottom: '10px' }}
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="Seu Nome de Herói"
                />

                <input
                    type="password"
                    inputMode="numeric"
                    maxLength={4}
                    className={styles.inputField}
                    style={{ marginBottom: '10px', letterSpacing: '8px', textAlign: 'center' }}
                    value={secretCode}
                    onChange={e => setSecretCode(e.target.value.replace(/\D/g, ''))}
                    placeholder="Senha (4 números)"
                />

                <input
                    type="text"
                    maxLength={6}
                    className={styles.inputField}
                    style={{ marginBottom: '15px', textAlign: 'center' }}
                    value={classCode}
                    onChange={e => setClassCode(e.target.value.toUpperCase())}
                    placeholder="Código da Turma (Ex: A99B)"
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

                <button 
                    className="btn-primary" 
                    style={{ width: '100%', padding: '15px' }}
                    onClick={handleAddPlayer} 
                    disabled={!name.trim() || secretCode.length < 4 || players.length >= 4 || classLoading}
                >
                    {classLoading ? '⏳ Criando...' : '➕ Adicionar Herói!'}
                </button>
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
