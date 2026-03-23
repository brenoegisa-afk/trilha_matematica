import { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import styles from './MathRunner.module.css';

interface Obstacle {
  id: number;
  x: number;
  y: number;
  value: number;
  isCorrect: boolean;
}

export default function MathRunner() {
  const [score, setScore] = useState(0);
  const [isJumping, setIsJumping] = useState(false);
  const [obstacles, setObstacles] = useState<Obstacle[]>([]);
  const [question, setQuestion] = useState({ text: '4 + 5', answer: 9 });
  const [feedback, setFeedback] = useState<string | null>(null);
  const [hitId, setHitId] = useState<number | null>(null);
  
  const requestRef = useRef<number>(null);
  const lastTimeRef = useRef<number>(null);
  const obstacleIdRef = useRef(0);

  // 📝 Generate Math Question & Pillars
  const generateLevelSegment = useCallback(() => {
    const a = Math.floor(Math.random() * 9) + 1;
    const b = Math.floor(Math.random() * 9) + 1;
    const ans = a + b;
    setQuestion({ text: `${a} + ${b}`, answer: ans });
    
    // Create two Gates MUCH further apart
    const isCorrectFirst = Math.random() > 0.5;
    const newGates: Obstacle[] = [
      {
        id: obstacleIdRef.current++,
        x: 1300,
        y: 200,
        value: isCorrectFirst ? ans : ans + (Math.random() > 0.5 ? 2 : -2),
        isCorrect: isCorrectFirst
      },
      {
        id: obstacleIdRef.current++,
        x: 1800,
        y: 200,
        value: !isCorrectFirst ? ans : ans + (Math.random() > 0.5 ? 1 : -1),
        isCorrect: !isCorrectFirst
      }
    ];
    setObstacles(prev => [...prev, ...newGates]);
  }, []);

  // 🎮 Game Loop
  const animate = useCallback((time: number) => {
    if (lastTimeRef.current !== null) {
      const deltaTime = time - lastTimeRef.current;
      
      setObstacles(prev => {
        // SLOWER SPEED: 0.25 pixels per ms
        const next = prev
          .map(obs => ({ ...obs, x: obs.x - 0.25 * deltaTime }))
          .filter(obs => obs.x > -400);
        
        // Character is at x: 150
        const characterX = 150;
        const collisionThreshold = 80;
        
        const hit = next.find(o => Math.abs(o.x - characterX) < collisionThreshold);
        if (hit && !feedback && isJumping) {
          if (hit.isCorrect) {
            setScore(s => s + 10);
            setFeedback('CORRETO! ✔️');
            setHitId(hit.id);
            setTimeout(() => {
              setFeedback(null);
              setHitId(null);
            }, 1000);
          } else {
            setFeedback('OPS! ❌');
            setTimeout(() => setFeedback(null), 1000);
          }
        }

        return next;
      });
    }
    lastTimeRef.current = time;
    requestRef.current = requestAnimationFrame(animate);
  }, [isJumping, feedback]);

  useEffect(() => {
    requestRef.current = requestAnimationFrame(animate);
    // SLOWER INTERVAL: 3.5 seconds
    const interval = setInterval(generateLevelSegment, 3500);
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
      clearInterval(interval);
    };
  }, [animate, generateLevelSegment]);

  const handleAction = () => {
    if (!isJumping) {
      setIsJumping(true);
      setTimeout(() => setIsJumping(false), 700);
    }
  };

  return (
    <div className={styles.gameContainer} onPointerDown={handleAction}>
      {/* 🖼️ Parallax Layers */}
      <div className={styles.mountains} />
      <div className={styles.forest}>
        {Array.from({ length: 15 }).map((_, i) => (
          <div key={i} className={styles.tree} />
        ))}
      </div>
      <div className={styles.track}>
        <div className={styles.road} />
      </div>

      {/* 🎯 Math Question */}
      <div className={styles.questionCloud}>{question.text} = ?</div>
      
      <div className={styles.hud}>
        <div className={styles.score}>⭐ {score}</div>
      </div>

      {feedback && (
        <div className={`${styles.feedbackCorrect} ${feedback.includes('OPS') ? styles.error : ''}`}>
          {feedback}
        </div>
      )}

      {/* 🐰 RABBIT CHARACTER (Redesigned) */}
      <div className={`${styles.character} ${isJumping ? styles.jump : styles.bounce}`}>
        <div className={styles.rabbitEars}>
          <div className={styles.ear} />
          <div className={styles.ear} />
        </div>
        <div className={styles.rabbitHead}>
          <div className={styles.rabbitEyes}>
            <div className={styles.eye} />
            <div className={styles.eye} />
          </div>
          <div className={styles.blush} style={{ left: '5px' }} />
          <div className={styles.blush} style={{ right: '5px' }} />
        </div>
        <div className={styles.rabbitBody} />
      </div>

      {/* 🏁 GATES */}
      {obstacles.map(obs => (
        <div 
          key={obs.id} 
          className={`${styles.gate} ${hitId === obs.id ? styles.correctHit : ''}`}
          style={{ left: `${obs.x}px`, top: `${obs.y}px` }}
        >
          <div className={styles.gateValue}>{obs.value}</div>
        </div>
      ))}

      <Link to="/experimental/3d" className={styles.backButton}>
        Finalizar Missão
      </Link>
    </div>
  );
}
