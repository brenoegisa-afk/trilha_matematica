import { useEffect } from 'react';
import styles from './FloatingXP.module.css';

interface FloatingXPProps {
    amount: number;
    x: number;
    y: number;
    onComplete: () => void;
}

export default function FloatingXP({ amount, x, y, onComplete }: FloatingXPProps) {
    useEffect(() => {
        const timer = setTimeout(onComplete, 1200);
        return () => clearTimeout(timer);
    }, [onComplete]);

    return (
        <div className={styles.floatingContainer} style={{ left: x, top: y }}>
            <div className={styles.xpText}>+{amount} XP</div>
        </div>
    );
}
