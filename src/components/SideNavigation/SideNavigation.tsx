import { useNavigate, useLocation } from 'react-router-dom';
import { useGame } from '../../context/GameContext';
import styles from './SideNavigation.module.css';

export default function SideNavigation() {
    const navigate = useNavigate();
    const location = useLocation();
    const { currentUser, logout } = useGame();

    const menuItems = [
        { id: 'home', label: 'Início', icon: '🏠', path: '/' },
        { id: 'game', label: 'Jogar', icon: '🎮', path: '/setup' },
        { id: 'ranking', label: 'Ranking', icon: '🏆', path: '/ranking' },
        { id: 'shop', label: 'Lojinha', icon: '🛒', path: '/shop' },
        { id: 'parent', label: 'Pais', icon: '👪', path: '/parent' },
        { id: 'admin', label: 'Admin', icon: '⚙️', path: '/admin/import' },
    ];

    return (
        <nav className={styles.sideNav}>
            <div className={styles.logo}>
                <span className={styles.logoIcon}>🏆</span>
                <span className={styles.logoText}>Trilha</span>
            </div>
            
            <div className={styles.menuList}>
                {menuItems.map((item) => {
                    const isActive = location.pathname === item.path;
                    
                    return (
                        <button
                            key={item.id}
                            className={`${styles.navItem} ${isActive ? styles.active : ''}`}
                            onClick={() => navigate(item.path)}
                        >
                            <span className={styles.icon}>{item.icon}</span>
                            <span className={styles.label}>{item.label}</span>
                        </button>
                    );
                })}
            </div>

            <div className={styles.footer}>
                {currentUser ? (
                    <div className={styles.userSection}>
                        <div className={styles.userInfo}>
                            <div className={styles.userEmail}>{currentUser.email}</div>
                            <button className={styles.logoutBtn} onClick={logout}>Sair</button>
                        </div>
                    </div>
                ) : (
                    <button className={styles.loginBtn} onClick={() => navigate('/login')}>
                        🔑 Entrar (SaaS)
                    </button>
                )}
                <div className={styles.streakIndicator}>
                    🔥 Ativo!
                </div>
            </div>
        </nav>
    );
}
