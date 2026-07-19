import { useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useGame } from '../context/GameContext';
import { DiagnosticEngine, DIAGNOSTIC_MIN_CHALLENGES, type DiagnosticEvidence } from '../core/learning/DiagnosticEngine';
import { MathEngine } from '../core/learning/MathEngine';
import { DiagnosticProgressService } from '../core/services/DiagnosticProgressService';

export default function Diagnostic() {
    const navigate = useNavigate();
    const { players, selectedGrade, currentSubjectId, applyDiagnosticPlacement, startMascotBattle } = useGame();
    const location = useLocation();
    const [evidence, setEvidence] = useState<DiagnosticEvidence[]>([]);
    const [feedback, setFeedback] = useState<string | null>(null);
    const [isFinalizing, setIsFinalizing] = useState(false);
    const first = useMemo(() => DiagnosticEngine.getStartingNodes(currentSubjectId, selectedGrade)[0], [currentSubjectId, selectedGrade]);
    const node = evidence.length === 0 ? first : DiagnosticEngine.getNextNode(currentSubjectId, selectedGrade, evidence);
    const question = useMemo(() => node ? MathEngine.generateFromNode(node) : null, [node?.id, evidence.length]);
    const startNextMode = () => {
        if (location.state?.continueMode === 'battle') {
            startMascotBattle();
        }
        navigate('/game');
    };

    if (!players.length || currentSubjectId !== 'math') {
        navigate('/game');
        return null;
    }
    if (!node || !question) {
        return <main style={wrap}><h1>✨ Pronto para a aventura!</h1><p>{isFinalizing ? 'Guardando seu ponto de partida…' : 'Agora vamos jogar.'}</p><button style={button} disabled={isFinalizing} onClick={startNextMode}>{isFinalizing ? 'Preparando…' : 'Começar missão'}</button></main>;
    }

    const answer = (option: string) => {
        const correct = option === question.answer;
        setFeedback(correct ? 'Boa! Vamos ver o próximo desafio.' : 'Boa tentativa! Vamos descobrir mais juntos.');
        window.setTimeout(() => {
            const next = [...evidence, { nodeId: node.id, skillId: node.skillId, isCorrect: correct, supportLevel: 'none' as const }];
            const completed = next.length >= DIAGNOSTIC_MIN_CHALLENGES
                && !DiagnosticEngine.getNextNode(currentSubjectId, selectedGrade, next);
            const skillEvidence = next.filter(item => item.skillId === node.skillId);

            if (completed) {
                const nodeMastery = DiagnosticEngine.applyPlacement(players[0].nodeMastery || {}, next);
                setIsFinalizing(true);
                void Promise.all([
                    applyDiagnosticPlacement(players[0].id, nodeMastery),
                    DiagnosticProgressService.complete({ studentId: players[0].id, subjectId: currentSubjectId, evidence: next })
                ]).finally(() => setIsFinalizing(false));
            } else {
                void DiagnosticProgressService.save({
                    studentId: players[0].id, subjectId: currentSubjectId, skillId: node.skillId,
                    entryNodeId: node.id, evidenceCount: skillEvidence.length, completed: false
                });
            }

            setEvidence(next);
            setFeedback(null);
        }, 700);
    };

    return <main style={wrap}>
        <p style={{ fontWeight: 700 }}>Aquecimento da jornada · desafio {evidence.length + 1}</p>
        <h1 style={{ textAlign: 'center' }}>Vamos descobrir o que você já sabe ✨</h1>
        <p style={{ textAlign: 'center' }}>Não vale nota. É só um aquecimento!</p>
        <section style={card}>
            <h2 style={{ textAlign: 'center' }}>{question.question}</h2>
            {feedback ? <p style={{ textAlign: 'center', fontWeight: 800 }}>{feedback}</p> : <div style={{ display: 'grid', gap: 12 }}>
                {question.options.map(option => <button key={option} style={button} onClick={() => answer(option)}>{option}</button>)}
            </div>}
        </section>
        <button style={{ ...button, background: '#eee', color: '#222' }} onClick={startNextMode}>Pular aquecimento</button>
    </main>;
}

const wrap: React.CSSProperties = { minHeight: '100vh', padding: 24, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, background: '#e8f7ff', color: '#1b2a41' };
const card: React.CSSProperties = { width: 'min(480px, 92vw)', padding: 28, borderRadius: 24, background: 'white', boxShadow: '0 8px 0 #b8d8e8' };
const button: React.CSSProperties = { width: 'min(420px, 88vw)', border: 0, borderRadius: 16, padding: 16, fontSize: '1.2rem', fontWeight: 800, cursor: 'pointer', background: '#3b82f6', color: 'white' };
