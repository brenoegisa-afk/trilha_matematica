import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useGame } from '../context/GameContext';
import '../App.css';

const AVAILABLE_COLORS = [
    { id: 'red', label: 'Vermelha', hex: 'var(--color-red)' },
    { id: 'blue', label: 'Azul', hex: 'var(--color-blue)' },
    { id: 'green', label: 'Verde', hex: 'var(--color-green)' },
    { id: 'yellow', label: 'Amarela', hex: 'var(--color-yellow)' }
];

export default function Setup() {
    const navigate = useNavigate();
    const { players, addPlayer, startGame, selectedGrade, setGrade, refreshPlayers } = useGame();
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

        // Add player to game context
        const profile = addPlayer(name, colorHex, secretCode, finalClassId);

        // Explicitly update the profile if a class code was provided 
        // (addPlayer handles creation, this ensures an existing profile gets updated)
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

    return (
        <div className="app-container" style={{ justifyContent: 'flex-start', paddingTop: '40px' }}>
            <h2 style={{ marginBottom: '10px' }}>Configuração do Jogo</h2>

            <div style={{ background: 'white', padding: '15px', borderRadius: '12px', border: '3px solid var(--color-ink)', marginBottom: '20px', width: '100%', maxWidth: '400px', boxShadow: 'var(--shadow-handmade)' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Série (Nível das Perguntas):</label>
                <select
                    value={selectedGrade}
                    onChange={(e) => setGrade(e.target.value)}
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '2px solid var(--color-ink)', fontFamily: 'var(--font-title)', fontSize: '1rem', backgroundColor: '#f9f9f9' }}
                >
                    <option value="1-2">1º e 2º Ano (Adição/Subtração)</option>
                    <option value="3-4">3º e 4º Ano (Multiplicação)</option>
                    <option value="5">5º Ano (Lógica/Expressões)</option>
                </select>
            </div>

            <div style={{ background: 'white', padding: '20px', borderRadius: '12px', border: '3px solid var(--color-ink)', marginBottom: '20px', width: '100%', maxWidth: '400px', boxShadow: 'var(--shadow-handmade)' }}>
                <h3 style={{ marginBottom: '15px', textAlign: 'center' }}>Adicionar Jogador ({players.length}/4)</h3>
                <div style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Nome do Jogador:</label>
                    <input
                        type="text"
                        value={name}
                        onChange={e => setName(e.target.value)}
                        placeholder="Ex: Joãozinho"
                        style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '2px solid var(--color-ink)', fontFamily: 'var(--font-title)', fontSize: '1rem' }}
                    />
                </div>

                <div style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Código Secreto (4 dígitos):</label>
                    <input
                        type="password"
                        inputMode="numeric"
                        maxLength={4}
                        value={secretCode}
                        onChange={e => setSecretCode(e.target.value.replace(/\D/g, ''))}
                        placeholder="1234"
                        style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '2px solid var(--color-ink)', fontFamily: 'var(--font-title)', fontSize: '1rem', letterSpacing: '8px', textAlign: 'center' }}
                    />
                    <small style={{ fontSize: '0.7rem', opacity: 0.7 }}>Acesse seu ranking em qualquer lugar!</small>
                </div>

                <div style={{ marginBottom: '20px' }}>
                    <label style={{ display: 'block', marginBottom: '10px', fontWeight: 'bold' }}>Escolha sua Tampinha:</label>
                    <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                        {AVAILABLE_COLORS.map(c => {
                            const isTaken = players.some(p => p.color === c.hex);
                            return (
                                <button
                                    key={c.id}
                                    disabled={isTaken}
                                    onClick={() => setSelectedColor(c.id)}
                                    style={{
                                        width: '40px', height: '40px', borderRadius: '50%',
                                        backgroundColor: c.hex,
                                        border: selectedColor === c.id ? '4px solid var(--color-ink)' : '2px solid rgba(0,0,0,0.2)',
                                        opacity: isTaken ? 0.3 : 1,
                                        padding: 0,
                                        boxShadow: selectedColor === c.id ? 'none' : '2px 2px 4px rgba(0,0,0,0.2)'
                                    }}
                                    title={c.label}
                                />
                            )
                        })}
                    </div>
                </div>

                <div style={{ marginBottom: '20px' }}>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Código da Turma (Opcional):</label>
                    <input
                        type="text"
                        maxLength={6}
                        value={classCode}
                        onChange={e => setClassCode(e.target.value.toUpperCase())}
                        placeholder="ABC123"
                        style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '2px solid var(--color-blue)', fontFamily: 'var(--font-title)', fontSize: '1rem', textAlign: 'center' }}
                    />
                    <small style={{ fontSize: '0.7rem', opacity: 0.7 }}>Peça o código ao seu professor!</small>
                </div>

                <button className="btn-primary" onClick={handleAddPlayer} disabled={!name.trim() || secretCode.length < 4 || players.length >= 4 || classLoading} style={{ width: '100%' }}>
                    {classLoading ? 'Verificando...' : 'Adicionar Jogador'}
                </button>
            </div>

            {players.length > 0 && (
                <div style={{ width: '100%', maxWidth: '400px', marginBottom: '20px' }}>
                    <h3 style={{ marginBottom: '10px' }}>Na Fila:</h3>
                    <ul style={{ listStyle: 'none', padding: 0 }}>
                        {players.map(p => (
                            <li key={p.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px', background: 'white', padding: '10px', borderRadius: '8px', border: '2px solid var(--color-ink)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <div style={{
                                        width: '30px',
                                        height: '30px',
                                        borderRadius: '50%',
                                        backgroundColor: p.color,
                                        border: '2px solid var(--color-ink)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: '1.2rem'
                                    }}>
                                        {p.avatar}
                                    </div>
                                    <span style={{ fontWeight: 'bold' }}>{p.name}</span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.9rem', fontWeight: 'bold', color: 'var(--color-ink)' }}>
                                    <span style={{ color: '#f1c40f' }}>⭐</span>
                                    Pronto!
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            <div className="menu-buttons" style={{ flexDirection: 'column', gap: '10px', width: '100%', maxWidth: '400px' }}>
                <button
                    onClick={() => navigate('/shop')}
                    style={{
                        width: '100%',
                        padding: '12px',
                        backgroundColor: 'var(--color-yellow)',
                        fontWeight: 'bold',
                        borderRadius: '12px'
                    }}
                >
                    🛒 Ir para a Lojinha
                </button>

                <div style={{ display: 'flex', gap: '10px', width: '100%' }}>
                    <button onClick={() => navigate('/')} style={{ flex: 1, padding: '12px' }}>Voltar</button>
                    <button className="btn-primary" onClick={handleStart} disabled={players.length === 0} style={{ flex: 1, padding: '12px' }}>
                        Começar!
                    </button>
                </div>
            </div>
        </div>
    );
}

