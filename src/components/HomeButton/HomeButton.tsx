import { useNavigate, useLocation } from 'react-router-dom';
import styles from './HomeButton.module.css';

export default function HomeButton() {
    const navigate = useNavigate();
    const location = useLocation();

    // Don't show on Home or Hub itself
    if (location.pathname === '/' || location.pathname === '/hub') {
        return null;
    }

    const handleHomeClick = () => {
        // Simple heuristic: if we are in game or arena, ask for confirmation
        const isGameActive = location.pathname.includes('/game') || location.pathname.includes('/arena');

        if (isGameActive) {
            if (window.confirm("Deseja mesmo sair? Sua partida atual não será salva.")) {
                navigate('/hub');
            }
        } else {
            navigate('/hub');
        }
    };

    return (
        <button
            className={styles.homeBtn}
            onClick={handleHomeClick}
            title="Voltar ao Portal"
        >
            🏠
        </button>
    );
}

