import { useState } from 'react';
import Scene from './Scene';
import styles from './Mundo3D.module.css';
import { Link } from 'react-router-dom';

interface Challenge {
  id: string;
  question: string;
  options: string[];
  answer: string;
  feedback: string;
}

const SAMPLE_CHALLENGE: Challenge = {
  id: 'geom-1',
  question: 'Observe a Torre Central. Ela possui uma base Quadrada e um topo Cônico. Se a base tem 4m de lado, qual é a área da base?',
  options: ['12m²', '16m²', '8m²', '20m²'],
  answer: '16m²',
  feedback: 'Correto! Em um quadrado, a área é Lado × Lado (4 × 4 = 16).'
};

export default function Mundo3D() {
  const [activeChallenge, setActiveChallenge] = useState<Challenge | null>(null);
  const [isChallengeComplete, setIsChallengeComplete] = useState(false);

  const handleOpenChallenge = () => {
    setActiveChallenge(SAMPLE_CHALLENGE);
    setIsChallengeComplete(false);
  };

  const handleAnswer = (option: string) => {
    if (option === activeChallenge?.answer) {
      setIsChallengeComplete(true);
      setTimeout(() => setActiveChallenge(null), 3000); // Close after 3s
    } else {
      alert('Tente novamente! Observe bem as dimensões da torre.');
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.overlay}>
        <div className={styles.header}>
          <h1>Mundo dos Campeões 3D</h1>
          <p>Módulo de Exploração e Aprendizado Espacial</p>
        </div>
        
        <div className={styles.controls}>
          <div className={styles.hint}>
            🖱️ Gire o mundo • Clique no chão para andar • Clique nas construções para aprender
          </div>
          <Link to="/game" className={styles.backButton}>
            Voltar para a Trilha
          </Link>
        </div>
      </div>

      {/* 🧩 Educational Modal Overlay */}
      {activeChallenge && (
        <div className={styles.modalBackdrop}>
          <div className={`${styles.modal} ${isChallengeComplete ? styles.complete : ''}`}>
            {!isChallengeComplete ? (
              <>
                <h2>Desafio de Geometria</h2>
                <p>{activeChallenge.question}</p>
                <div className={styles.options}>
                  {activeChallenge.options.map(opt => (
                    <button key={opt} onClick={() => handleAnswer(opt)}>{opt}</button>
                  ))}
                </div>
              </>
            ) : (
              <div className={styles.successMessage}>
                <h2>🌟 Parabéns!</h2>
                <p>{activeChallenge.feedback}</p>
              </div>
            )}
            <button className={styles.closeBtn} onClick={() => setActiveChallenge(null)}>Fechar</button>
          </div>
        </div>
      )}
      
      <div className={styles.canvasContainer}>
        <Scene 
          onTriggerChallenge={handleOpenChallenge} 
          isCelebrating={isChallengeComplete}
        />
      </div>
    </div>
  );
}
