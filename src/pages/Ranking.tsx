import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getGlobalRanking } from '../utils/saveSystem';
import styles from './Ranking.module.css';

interface LeaderboardEntry {
    name: string;
    stars: number;
    totalScore: number;
    avatar: string;
}

export default function Ranking() {
    const navigate = useNavigate();
    const [ranking, setRanking] = useState<LeaderboardEntry[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            const data = await getGlobalRanking();
            // Fallback mock data for demo if cloud is not yet configured or returns empty
            if (!data || data.length === 0) {
                setRanking([
                    { name: 'Matemágico', stars: 1250, totalScore: 12000, avatar: '👑' },
                    { name: 'Calculadora Viva', stars: 980, totalScore: 9500, avatar: '🤖' },
                    { name: 'Einstein Júnior', stars: 850, totalScore: 8200, avatar: '🚀' },
                    { name: 'Super Estrela', stars: 720, totalScore: 7000, avatar: '⭐' },
                    { name: 'Tabuada Ninja', stars: 600, totalScore: 5800, avatar: '🐱' },
                ]);
            } else {
                setRanking(data as any);
            }
            setLoading(false);
        };
        fetchData();
    }, []);

    return (
        <div className={styles.rankingContainer}>
            <header className={styles.rankingHeader}>
                <button onClick={() => navigate('/')} className={styles.backBtn}>← Voltar</button>
                <h1>Mural dos Campeões</h1>
            </header>

            <div className={styles.rankingContent}>
                {loading ? (
                    <div className={styles.loader}>Carregando Ranking... 🏃‍♂️💨</div>
                ) : (
                    <>
                        <div className={styles.podium}>
                            {ranking.slice(0, 3).map((entry, index) => (
                                <div key={entry.name + index} className={`${styles.podiumItem} ${styles[`rank${index + 1}`]}`}>
                                    <div className={styles.podiumAvatar}>
                                        {entry.avatar || '⭕'}
                                        <div className={styles.rankBadge}>{index + 1}</div>
                                    </div>
                                    <div className={styles.podiumName}>{entry.name}</div>
                                    <div className={styles.podiumStars}>⭐ {entry.stars}</div>
                                </div>
                            ))}
                        </div>

                        <div className={styles.rankingList}>
                            {ranking.map((entry, index) => (
                                <div key={entry.name + index} className={styles.rankingRow}>
                                    <div className={styles.rowRank}>{index + 1}º</div>
                                    <div className={styles.rowAvatar}>{entry.avatar || '⭕'}</div>
                                    <div className={styles.rowName}>{entry.name}</div>
                                    <div className={styles.rowScore}>{entry.totalScore} pts</div>
                                    <div className={styles.rowStars}>⭐ {entry.stars}</div>
                                </div>
                            ))}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
